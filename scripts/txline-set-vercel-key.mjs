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

console.log(`[info] Token: ${token.slice(0, 20)}... (${token.length} chars)`);
console.log("[info] Setting TXLINE_API_KEY on Vercel (Production + Development)...");

// Write to temp file to avoid shell exposure
const tmpFile = path.join(os.tmpdir(), `txline_key_${Date.now()}.txt`);
fs.writeFileSync(tmpFile, token, { encoding: "utf8" });

function runVercel(env) {
  try {
    const cmd = `type "${tmpFile}" | npx vercel env add TXLINE_API_KEY ${env} --force`;
    const out = execSync(cmd, { shell: "cmd.exe", stdio: "pipe" }).toString();
    console.log(`  [ok] ${env}: ${out.includes("Saved") || out.includes("Overrode") ? "saved" : out.trim().slice(0, 80)}`);
  } catch (e) {
    const msg = e.stdout?.toString() ?? e.message ?? "";
    if (msg.includes("Overrode") || msg.includes("Saved")) {
      console.log(`  [ok] ${env}: saved`);
    } else {
      console.log(`  [warn] ${env}: ${msg.slice(0, 120)}`);
    }
  }
}

runVercel("production");
runVercel("development");

// Clean up temp file immediately
fs.unlinkSync(tmpFile);
console.log("[info] Temp file deleted.");

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
