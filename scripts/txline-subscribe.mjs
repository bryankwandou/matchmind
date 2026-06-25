/**
 * TxLINE Free Tier Subscription — follows World Cup docs exactly.
 * Service Level 1 (60s delay) or 12 (real-time), both free.
 * Run: node scripts/txline-subscribe.mjs
 *
 * Requires ~0.003 SOL on mainnet in the wallet below.
 * Wallet: 35z7X59rtyts557Up1RAwpyYN7x2cFqcDc7RjPuNxFzr
 */

import { Connection, Keypair, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
} from "@solana/spl-token";
import nacl from "tweetnacl";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Mainnet addresses (from https://txline-docs.txodds.com/documentation/programs/addresses.md)
const RPC           = "https://api.mainnet-beta.solana.com";
const PROGRAM_ID    = new PublicKey("9ExbZjAapQww1vfcisDmrngPinHTEfpjYRWMunJgcKaA");
const TOKEN_MINT    = new PublicKey("Zhw9TVKp68a1QrftncMSd6ELXKDtpVMNuMGr1jNwdeL");
const TXLINE_API    = "https://txline.txodds.com";

const SERVICE_LEVEL  = 1;   // 1 = 60s delay (free); 12 = real-time (free)
const DURATION_WEEKS = 4;
const LEAGUES        = [];   // empty = standard bundle

const WALLET_PATH = "C:\\Users\\arche\\.config\\solana\\veztra-deploy.json";
const TX_SIG_FILE = path.join(__dirname, ".txline-txsig.txt");
const TOKEN_FILE  = path.join(__dirname, ".txline-token.txt");

// ── PDAs derived per docs ────────────────────────────────────────────────────
const [pricingMatrixPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("pricing_matrix")], PROGRAM_ID
);
const [tokenTreasuryPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("token_treasury_v2")], PROGRAM_ID
);
const tokenTreasuryVault = getAssociatedTokenAddressSync(
  TOKEN_MINT, tokenTreasuryPda, true, TOKEN_2022_PROGRAM_ID
);

// ── Step 1: On-chain subscription ────────────────────────────────────────────
async function subscribeOnChain(keypair, connection) {
  console.log("\n[step 1] On-chain subscription...");
  console.log("  program:          ", PROGRAM_ID.toBase58());
  console.log("  tokenMint:        ", TOKEN_MINT.toBase58());
  console.log("  pricingMatrix:    ", pricingMatrixPda.toBase58());
  console.log("  tokenTreasuryPda: ", tokenTreasuryPda.toBase58());
  console.log("  tokenTreasuryVault:", tokenTreasuryVault.toBase58());

  const userTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT, keypair.publicKey, false, TOKEN_2022_PROGRAM_ID
  );
  console.log("  userTokenAccount: ", userTokenAccount.toBase58());

  // Check vault and ATA existence
  const [vaultInfo, ataInfo] = await Promise.all([
    connection.getAccountInfo(tokenTreasuryVault),
    connection.getAccountInfo(userTokenAccount),
  ]);

  if (!vaultInfo) {
    throw new Error("tokenTreasuryVault does not exist on mainnet — program not initialized");
  }
  console.log("  [ok] treasury vault exists");

  // Exact discriminator from mainnet IDL
  const discriminator = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);
  // service_level_id: u16 (LE) + weeks: u8
  const data = Buffer.concat([
    discriminator,
    Buffer.from(new Uint8Array(new Uint16Array([SERVICE_LEVEL]).buffer)),
    Buffer.from([DURATION_WEEKS]),
  ]);

  // Account ordering per IDL:
  // user, pricing_matrix, token_mint, user_token_account,
  // token_treasury_vault, token_treasury_pda, token_program, system_program, associated_token_program
  const subscribeIx = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: keypair.publicKey,           isSigner: true,  isWritable: true  },
      { pubkey: pricingMatrixPda,            isSigner: false, isWritable: false },
      { pubkey: TOKEN_MINT,                  isSigner: false, isWritable: false },
      { pubkey: userTokenAccount,            isSigner: false, isWritable: true  },
      { pubkey: tokenTreasuryVault,          isSigner: false, isWritable: true  },
      { pubkey: tokenTreasuryPda,            isSigner: false, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID,       isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId,     isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data,
  });

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: keypair.publicKey });

  if (!ataInfo) {
    console.log("  [info] User ATA not found — prepending createAssociatedTokenAccountIdempotent...");
    const ataRent = await connection.getMinimumBalanceForRentExemption(165);
    const balance = await connection.getBalance(keypair.publicKey);
    console.log(`  [info] Balance: ${balance / 1e9} SOL, ATA rent: ${ataRent / 1e9} SOL`);
    if (balance < ataRent + 10000) {
      throw new Error(
        `Insufficient SOL: need ${(ataRent + 10000) / 1e9} SOL, have ${balance / 1e9} SOL.\n` +
        `  Fund: ${keypair.publicKey.toBase58()} with 0.003 SOL on mainnet then retry.`
      );
    }
    tx.add(
      createAssociatedTokenAccountIdempotentInstruction(
        keypair.publicKey,
        userTokenAccount,
        keypair.publicKey,
        TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  tx.add(subscribeIx);
  tx.sign(keypair);

  const txSig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log("  [ok] tx:", txSig);
  await connection.confirmTransaction(txSig, "confirmed");
  console.log("  [ok] confirmed");
  fs.writeFileSync(TX_SIG_FILE, txSig);
  return txSig;
}

// ── Step 2: Guest JWT + activation ───────────────────────────────────────────
async function activateToken(keypair, txSig) {
  console.log("\n[step 2] Guest JWT...");
  const auth = await axios.post(`${TXLINE_API}/auth/guest/start`, {}, { timeout: 15000 });
  const jwt = auth.data.token;
  console.log("  jwt:", jwt.slice(0, 40) + "...");

  console.log("\n[step 3] Signing + activating...");
  const messageString = `${txSig}:${LEAGUES.join(",")}:${jwt}`;
  const message = new TextEncoder().encode(messageString);
  const sig = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(sig).toString("base64");

  for (let i = 1; i <= 5; i++) {
    try {
      const res = await axios.post(
        `${TXLINE_API}/api/token/activate`,
        { txSig, walletSignature, leagues: LEAGUES },
        { headers: { Authorization: `Bearer ${jwt}` }, timeout: 30000 }
      );
      const token = res.data?.token ?? res.data;
      if (typeof token !== "string") throw new Error("No token in response: " + JSON.stringify(res.data));
      return token;
    } catch (err) {
      const status = err.response?.status ?? 0;
      const body = err.response?.data
        ? JSON.stringify(err.response.data).slice(0, 150)
        : err.message.slice(0, 100);
      console.log(`  [attempt ${i}] ${status}: ${body}`);
      if (i < 5 && [0, 502, 503, 504].includes(status)) {
        await new Promise(r => setTimeout(r, i * 5000));
      } else throw err;
    }
  }
}

// ── Step 4: Verify ────────────────────────────────────────────────────────────
async function verifyToken(token) {
  console.log("\n[step 4] Verifying token...");
  // Get fresh guest JWT for verification (per TxLINE docs: Bearer=guest JWT, X-Api-Token=activated token)
  let guestJwt = "";
  try {
    const auth = await axios.post(`${TXLINE_API}/auth/guest/start`, {}, { timeout: 10000 });
    guestJwt = auth.data.token ?? "";
  } catch { /* fallback: use token as bearer */ }

  const headers = guestJwt
    ? { Authorization: `Bearer ${guestJwt}`, "X-Api-Token": token }
    : { Authorization: `Bearer ${token}` };

  const res = await axios.get(`${TXLINE_API}/api/fixtures/snapshot`, {
    headers,
    timeout: 15000,
  });
  const count = Array.isArray(res.data) ? res.data.length : "?";
  console.log(`  [ok] ${res.status} — ${count} fixtures`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log(" TxLINE Free Tier — Mainnet Subscription");
  console.log("=".repeat(60));

  const raw = JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"));
  const keypair = Keypair.fromSecretKey(Uint8Array.from(raw));
  console.log("\n[wallet]", keypair.publicKey.toBase58());

  const connection = new Connection(RPC, "confirmed");
  const balance = await connection.getBalance(keypair.publicKey);
  console.log("[wallet] Mainnet balance:", balance / 1e9, "SOL");

  // Use saved tx sig if available (skips on-chain re-subscription)
  let txSig;
  if (fs.existsSync(TX_SIG_FILE)) {
    const saved = fs.readFileSync(TX_SIG_FILE, "utf8").trim();
    // Only reuse if it looks like a mainnet sig (we'll let the activation verify)
    txSig = saved;
    console.log("\n[step 1] Reusing saved tx sig:", txSig.slice(0, 40) + "...");
  } else {
    txSig = await subscribeOnChain(keypair, connection);
  }

  const token = await activateToken(keypair, txSig);
  console.log("\n  [ok] API token:", token.slice(0, 40) + "...");

  await verifyToken(token);

  fs.writeFileSync(TOKEN_FILE, token);
  console.log("\n" + "=".repeat(60));
  console.log(" SUCCESS — TxLINE API key ready");
  console.log("=".repeat(60));
  console.log("\n Token saved to:", TOKEN_FILE);
  console.log(" Next: node scripts/txline-set-vercel-key.mjs");
  console.log("=".repeat(60));
}

main().catch(err => {
  console.error("\n[error]", err.message);
  process.exit(1);
});
