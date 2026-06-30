/**
 * TxLINE DEVNET activation — uses the confirmed devnet subscription tx sig.
 * The devnet subscription (SL1, free World Cup tier) is already on-chain.
 * This activates it against the DEVNET off-chain API (txline-dev.txodds.com),
 * NOT mainnet. No mainnet SOL required.
 *
 * Run: node scripts/txline-activate-devnet.mjs
 */
import { Keypair } from "@solana/web3.js";
import nacl from "tweetnacl";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Devnet off-chain API base (per TxLINE docs)
const TXLINE_DEV = "https://txline-dev.txodds.com";

// The wallet that signed the on-chain devnet subscribe tx
const WALLET_PATH = "C:\\Users\\arche\\.config\\solana\\veztra-deploy.json";

// Confirmed devnet subscription tx (SL1 free World Cup tier, 4 weeks)
const TX_SIG = "rQPwqMhC8B6sw7oC7PKZgbhxcAbgDqbXk9zUrkY5NqSSvAWkfEC458bGgXETzwgUvA22VY8yC329NT65BX4245a";
const LEAGUES = []; // empty = standard bundle

const TOKEN_FILE = path.join(__dirname, ".txline-token.txt");

async function main() {
  console.log("=".repeat(60));
  console.log(" TxLINE DEVNET Activation (no mainnet SOL needed)");
  console.log("=".repeat(60));

  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log("\n[wallet]", keypair.publicKey.toBase58());
  console.log("[tx]    ", TX_SIG.slice(0, 44) + "...");

  // 1. Guest JWT from DEVNET endpoint
  console.log("\n[step 1] Getting devnet guest JWT...");
  const auth = await axios.post(`${TXLINE_DEV}/auth/guest/start`, {}, { timeout: 15000 });
  const jwt = auth.data.token;
  console.log("  [ok] jwt:", jwt.slice(0, 40) + "...");

  // 2. Sign the activation intent
  console.log("\n[step 2] Signing activation intent...");
  const messageString = `${TX_SIG}:${LEAGUES.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const sigBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(sigBytes).toString("base64");
  console.log("  [ok] signature:", walletSignature.slice(0, 30) + "...");

  // 3. Activate against DEVNET endpoint
  console.log("\n[step 3] Activating against devnet endpoint...");
  let token;
  for (let i = 1; i <= 5; i++) {
    try {
      const res = await axios.post(
        `${TXLINE_DEV}/api/token/activate`,
        { txSig: TX_SIG, walletSignature, leagues: LEAGUES },
        { headers: { Authorization: `Bearer ${jwt}` }, timeout: 30000 }
      );
      token = res.data?.token ?? res.data;
      if (typeof token !== "string") throw new Error("Unexpected response: " + JSON.stringify(res.data).slice(0, 150));
      console.log("  [ok] activated! token:", token.slice(0, 40) + "...");
      break;
    } catch (err) {
      const status = err.response?.status ?? 0;
      const body = err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message.slice(0, 120);
      console.log(`  [attempt ${i}] ${status}: ${body}`);
      if (i < 5 && [0, 502, 503, 504].includes(status)) {
        await new Promise(r => setTimeout(r, i * 4000));
      } else {
        throw err;
      }
    }
  }

  // 4. Verify
  console.log("\n[step 4] Verifying token against devnet fixtures...");
  let guestJwt2 = "";
  try {
    const a2 = await axios.post(`${TXLINE_DEV}/auth/guest/start`, {}, { timeout: 10000 });
    guestJwt2 = a2.data.token ?? "";
  } catch { /* fallback below */ }

  const headers = guestJwt2
    ? { Authorization: `Bearer ${guestJwt2}`, "X-Api-Token": token }
    : { Authorization: `Bearer ${token}` };

  const verify = await axios.get(`${TXLINE_DEV}/api/fixtures/snapshot`, { headers, timeout: 15000 });
  const count = Array.isArray(verify.data) ? verify.data.length : "?";
  console.log(`  [ok] ${verify.status} — ${count} fixtures retrieved`);

  // 5. Save token
  fs.writeFileSync(TOKEN_FILE, token);
  console.log("\n" + "=".repeat(60));
  console.log(" SUCCESS — DEVNET TxLINE API key ready");
  console.log("=".repeat(60));
  console.log(" Token saved to:", TOKEN_FILE);
  console.log(" API base:      ", TXLINE_DEV + "/api");
  console.log(" Next: node scripts/txline-set-vercel-key.mjs");
  console.log("=".repeat(60));
}

main().catch(err => {
  const status = err.response?.status ?? 0;
  const body = err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message;
  console.error(`\n[error] ${status}: ${body}`);
  process.exit(1);
});
