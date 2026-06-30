/**
 * Cleanly removes and re-adds TXLINE_BASE_URL on Vercel with the devnet value.
 * Does NOT touch any other env var (GROQ_API_KEY, TXLINE_API_KEY stay intact).
 * Run: node scripts/txline-fix-base-url.mjs
 */
import fs from "fs";
import path from "path";
import os from "os";
import { execSync } from "child_process";

const BASE_URL = "https://txline-dev.txodds.com/api";

function run(cmd) {
  try {
    return { ok: true, out: execSync(cmd, { shell: "cmd.exe", stdio: "pipe" }).toString() };
  } catch (e) {
    return { ok: false, out: (e.stdout?.toString() ?? "") + (e.stderr?.toString() ?? e.message ?? "") };
  }
}

for (const env of ["production", "development"]) {
  // Remove existing (ignore "not found")
  const rm = run(`npx vercel env rm TXLINE_BASE_URL ${env} --yes`);
  console.log(`[rm ${env}] ${rm.ok ? "removed" : rm.out.slice(0, 80).replace(/\s+/g, " ")}`);

  // Add devnet value via temp file (no shell exposure)
  const tmp = path.join(os.tmpdir(), `txlbase_${Math.random().toString(36).slice(2)}.txt`);
  fs.writeFileSync(tmp, BASE_URL, "utf8");
  const add = run(`type "${tmp}" | npx vercel env add TXLINE_BASE_URL ${env}`);
  fs.unlinkSync(tmp);
  console.log(`[add ${env}] ${add.out.includes("Saved") || add.out.includes("Added") ? "saved -> " + BASE_URL : add.out.slice(0, 80).replace(/\s+/g, " ")}`);
}

console.log("\n[done] TXLINE_BASE_URL set to devnet on production + development.");
