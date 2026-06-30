/**
 * Re-injects a valid GROQ_API_KEY onto Vercel from the local emergency file.
 * The Vercel key went stale; this swaps it for the working one.
 * Secret never touches CLI args or shell history — temp-file pipe only.
 * Run: node scripts/groq-fix-vercel-key.mjs
 */
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const KEY_FILE = "E:\\Download\\GROQ API DARURAT.txt";

const raw = fs.readFileSync(KEY_FILE, "utf8");
const match = raw.match(/gsk_[A-Za-z0-9]+/);
if (!match) {
  console.error("[error] No gsk_ key found in", KEY_FILE);
  process.exit(1);
}
const key = match[0];
console.log(`[info] Key loaded: ${key.slice(0, 6)}... (${key.length} chars)`);

function run(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { shell: "cmd.exe", stdio: "pipe" }).toString() };
  } catch (e) {
    return { ok: false, out: (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? e.message ?? "") };
  }
}

for (const env of ["production", "development"]) {
  const rm = run(`npx vercel env rm GROQ_API_KEY ${env} --yes`);
  console.log(`[rm ${env}] ${rm.ok ? "removed old" : rm.out.slice(0, 70).replace(/\s+/g, " ")}`);

  const tmp = path.join(os.tmpdir(), `groq_${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(tmp, key, "utf8");
  const add = run(`type "${tmp}" | npx vercel env add GROQ_API_KEY ${env}`);
  fs.unlinkSync(tmp);
  console.log(`[add ${env}] ${add.out.includes("Saved") || add.out.includes("Added") ? "saved new key" : add.out.slice(0, 70).replace(/\s+/g, " ")}`);
}

console.log("\n[done] GROQ_API_KEY refreshed on production + development.");
console.log("       Trigger a redeploy for it to take effect.");
