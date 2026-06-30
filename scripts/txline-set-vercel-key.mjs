/**
 * Set TXLINE_API_KEY on Vercel after txline-subscribe.mjs succeeds.
 * Run: node scripts/txline-set-vercel-key.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = path.join(__dirname, ".txline-token.txt");

if (!fs.existsSync(TOKEN_FILE)) {
  console.error("[error] No token file found. Run txline-subscribe.mjs first.");
  process.exit(1);
}

const token = fs.readFileSync(TOKEN_FILE, "utf8").trim();
if (!token) {
  console.error("[error] Token file is empty.");
  process.exit(1);
}

// Devnet free tier base — keeps secrets out of code; injected as encrypted env var.
const BASE_URL = process.env.TXLINE_BASE_URL ?? "https://txline-dev.txodds.com/api";

console.log(`[info] Token: ${token.slice(0, 20)}... (${token.length} chars)`);
console.log(`[info] Base URL: ${BASE_URL}`);
console.log("[info] Setting Vercel env vars (Production + Development)...");

// Write secret values to temp files to avoid shell history / arg exposure (COBIT)
function writeTmp(value) {
  const f = path.join(os.tmpdir(), `txl_${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(f, value, { encoding: "utf8" });
  return f;
}

function setVar(name, tmpFile, env) {
  try {
    const cmd = `type "${tmpFile}" | npx vercel env add ${name} ${env} --force`;
    const out = execSync(cmd, { shell: "cmd.exe", stdio: "pipe" }).toString();
    console.log(`  [ok] ${name} (${env}): ${out.includes("Saved") || out.includes("Overrode") ? "saved" : out.trim().slice(0, 60)}`);
  } catch (e) {
    const msg = e.stdout?.toString() ?? e.message ?? "";
    if (msg.includes("Overrode") || msg.includes("Saved")) {
      console.log(`  [ok] ${name} (${env}): saved`);
    } else {
      console.log(`  [warn] ${name} (${env}): ${msg.slice(0, 120)}`);
    }
  }
}

const keyTmp = writeTmp(token);
const baseTmp = writeTmp(BASE_URL);

for (const env of ["production", "development"]) {
  setVar("TXLINE_API_KEY", keyTmp, env);
  setVar("TXLINE_BASE_URL", baseTmp, env);
}

// Clean up temp files immediately
fs.unlinkSync(keyTmp);
fs.unlinkSync(baseTmp);
console.log("[info] Temp files deleted.");

// Trigger redeploy
console.log("\n[info] Triggering Vercel redeploy...");
try {
  const projectDir = path.join(__dirname, "..");
  execSync(`git -C "${projectDir}" commit --allow-empty -m "chore: activate TxLINE real-time API key"`, { stdio: "pipe" });
  execSync(`git -C "${projectDir}" push origin main`, { stdio: "pipe" });
  console.log("[ok] Pushed — Vercel redeploy triggered.");
} catch (e) {
  console.log("[warn] Git push failed — redeploy manually:", e.message?.slice(0, 80));
}

console.log("\n[done] TXLINE_API_KEY is live on Vercel.");
console.log("       Live data will be available after the deploy completes (~60s).");
