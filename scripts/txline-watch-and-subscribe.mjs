/**
 * Watches mainnet SOL balance and auto-triggers subscription the moment
 * the wallet has enough SOL (≥0.003).
 * Run: node scripts/txline-watch-and-subscribe.mjs
 *
 * This script polls every 30s. Once funded, it runs the full subscription
 * and Vercel key injection automatically with zero human touch.
 */
import { Connection, PublicKey } from "@solana/web3.js";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLET  = new PublicKey("35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr");
const RPC     = "https://api.mainnet-beta.solana.com";
const MINIMUM = 0.003;       // SOL required for ATA + tx fees
const POLL_MS = 30_000;      // Check every 30 seconds

async function main() {
  const conn = new Connection(RPC, "confirmed");
  console.log(`[watch] Monitoring ${WALLET.toBase58()} for ≥${MINIMUM} SOL on mainnet`);
  console.log(`[watch] Polling every ${POLL_MS / 1000}s — Ctrl+C to stop\n`);

  const tokenFile = path.join(__dirname, ".txline-token.txt");
  if (fs.existsSync(tokenFile)) {
    console.log("[watch] API token already exists. Running set-vercel-key...");
    execSync(`node "${path.join(__dirname, "txline-set-vercel-key.mjs")}"`, { stdio: "inherit" });
    return;
  }

  while (true) {
    const bal = await conn.getBalance(WALLET);
    const sol = bal / 1e9;
    process.stdout.write(`\r[watch] Balance: ${sol.toFixed(6)} SOL  ${sol >= MINIMUM ? "✓ READY!" : `(need ${(MINIMUM - sol).toFixed(6)} more)`}   `);

    if (sol >= MINIMUM) {
      console.log("\n[watch] Threshold reached — starting subscription...\n");
      try {
        execSync(`node "${path.join(__dirname, "txline-subscribe.mjs")}"`, { stdio: "inherit" });
        console.log("\n[watch] Subscription complete. Running Vercel key injection...");
        execSync(`node "${path.join(__dirname, "txline-set-vercel-key.mjs")}"`, { stdio: "inherit" });
        console.log("[watch] Done. TXLINE_API_KEY is live on Vercel.");
        return;
      } catch (err) {
        console.error("\n[watch] Subscription failed:", err.message.slice(0, 120));
        console.log("[watch] Will retry in 60s...");
        await new Promise(r => setTimeout(r, 60_000));
      }
    } else {
      await new Promise(r => setTimeout(r, POLL_MS));
    }
  }
}

main().catch(e => {
  console.error("[fatal]", e.message);
  process.exit(1);
});
