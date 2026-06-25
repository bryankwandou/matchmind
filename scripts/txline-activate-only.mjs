/**
 * Standalone activation script — uses saved devnet tx sig to attempt activation.
 * Run: node scripts/txline-activate-only.mjs
 */
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WALLET_PATH = "C:\\Users\\arche\\.config\\solana\\veztra-deploy.json";
const TX_SIG = "rQPwqMhC8B6sw7oC7PKZgbhxcAbgDqbXk9zUrkY5NqSSvAWkfEC458bGgXETzwgUvA22VY8yC329NT65BX4245a";
const LEAGUES = [];

async function main() {
  console.log("[activate] Loading wallet...");
  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log("[activate] Wallet:", keypair.publicKey.toBase58());

  console.log("[activate] Getting fresh guest JWT...");
  const auth = await axios.post("https://txline.txodds.com/auth/guest/start", {}, { timeout: 15000 });
  const jwt = auth.data.token;
  console.log("[activate] JWT:", jwt.slice(0, 40) + "...");

  const messageString = `${TX_SIG}:${LEAGUES.join(",")}:${jwt}`;
  console.log("[activate] Signing message:", messageString.slice(0, 70) + "...");
  const message = new TextEncoder().encode(messageString);
  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  console.log("[activate] Calling /api/token/activate ...");
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      const res = await axios.post(
        "https://txline.txodds.com/api/token/activate",
        { txSig: TX_SIG, walletSignature, leagues: LEAGUES },
        { headers: { Authorization: `Bearer ${jwt}` }, timeout: 30000 }
      );
      const token = res.data?.token ?? res.data;
      console.log("\n✓ STATUS:", res.status);
      console.log("✓ TOKEN:", typeof token === "string" ? token.slice(0, 40) + "..." : JSON.stringify(token).slice(0, 100));

      const tokenPath = path.join(__dirname, ".txline-token.txt");
      fs.writeFileSync(tokenPath, typeof token === "string" ? token : JSON.stringify(token));
      console.log("✓ Saved to:", tokenPath);
      console.log("\nNext: node scripts/txline-set-vercel-key.mjs");
      return;
    } catch (err) {
      const status = err.response?.status ?? 0;
      const body = err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message.slice(0, 100);
      console.log(`[attempt ${attempt}] ${status}: ${body}`);
      if (attempt < 5 && (status === 504 || status === 503 || status === 502 || status === 0)) {
        const wait = attempt * 5000;
        console.log(`  Waiting ${wait / 1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        console.log("\n[done] Non-retryable error. Mainnet on-chain subscription needed.");
        console.log("Fund wallet with 0.003 SOL:", keypair.publicKey.toBase58());
        process.exit(1);
      }
    }
  }
}

main().catch(e => { console.error("[fatal]", e.message); process.exit(1); });
