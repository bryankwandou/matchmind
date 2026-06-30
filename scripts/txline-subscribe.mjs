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
  createAssociatedTokenAccountInstruction,
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
const TX_SIG_FILE      = path.join(__dirname, ".txline-txsig.txt");
const TOKEN_FILE       = path.join(__dirname, ".txline-token.txt");
const ATA_PAYER_FILE   = path.join(__dirname, ".txline-ata-payer.json");

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

  // ── ATA creation uses a separate CLEAN payer keypair ────────────────────────
  // The subscriber wallet (35z7X59...) is a durable nonce account with 80 bytes
  // of data. System Program rejects Transfer FROM accounts with data.
  // The ATAP calls SystemProgram::Transfer internally, so it can't use the nonce
  // account as payer. Solution: use a fresh keypair (no data) as the ATA payer.
  if (!ataInfo) {
    // Load or generate the clean ATA payer keypair
    let ataPayer;
    if (fs.existsSync(ATA_PAYER_FILE)) {
      ataPayer = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(ATA_PAYER_FILE, "utf8"))));
      console.log("  [info] Loaded ATA payer:", ataPayer.publicKey.toBase58());
    } else {
      ataPayer = Keypair.generate();
      fs.writeFileSync(ATA_PAYER_FILE, JSON.stringify(Array.from(ataPayer.secretKey)));
      console.log("  [info] Generated ATA payer:", ataPayer.publicKey.toBase58());
    }

    // Poll until ATA payer has enough SOL
    const ATA_PAYER_NEEDED = 0.003;
    let ataBal = await connection.getBalance(ataPayer.publicKey);
    if (ataBal < ATA_PAYER_NEEDED * 1e9) {
      console.log(`\n  ⚠ ATA payer needs ${ATA_PAYER_NEEDED} SOL on mainnet:`);
      console.log(`  → ${ataPayer.publicKey.toBase58()}`);
      console.log(`  Current balance: ${ataBal / 1e9} SOL. Polling every 15s...\n`);
      while (ataBal < ATA_PAYER_NEEDED * 1e9) {
        await new Promise(r => setTimeout(r, 15000));
        ataBal = await connection.getBalance(ataPayer.publicKey);
        process.stdout.write(`\r  Balance: ${(ataBal/1e9).toFixed(6)} SOL   `);
      }
      console.log(`\n  [ok] ATA payer funded: ${(ataBal/1e9).toFixed(6)} SOL`);
    } else {
      console.log(`  [ok] ATA payer balance: ${(ataBal/1e9).toFixed(6)} SOL`);
    }

    // Transaction 1: Create ATA (payer = clean wallet, owner = nonce account)
    console.log("\n  [tx-1] Creating ATA...");
    const { blockhash: bh1 } = await connection.getLatestBlockhash("confirmed");
    const ataTx = new Transaction({ recentBlockhash: bh1, feePayer: ataPayer.publicKey });
    ataTx.add(
      createAssociatedTokenAccountInstruction(
        ataPayer.publicKey,   // payer (clean, no data)
        userTokenAccount,     // ATA address
        keypair.publicKey,    // owner (nonce account)
        TOKEN_MINT,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
    ataTx.sign(ataPayer);
    const ataTxSig = await connection.sendRawTransaction(ataTx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    console.log("  [ok] ATA tx:", ataTxSig);
    await connection.confirmTransaction(ataTxSig, "confirmed");
    console.log("  [ok] ATA created");
  } else {
    console.log("  [ok] ATA already exists");
  }

  // Transaction 2: Subscribe (fee payer = nonce account, signer = nonce account)
  // Nonce accounts CAN pay tx fees — the validator deducts directly at runtime
  // level without calling SystemProgram::Transfer.
  console.log("\n  [tx-2] Subscribing...");
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: keypair.publicKey });
  tx.add(subscribeIx);
  tx.sign(keypair);

  const txSig = await connection.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: "confirmed",
  });
  console.log("  [ok] subscribe tx:", txSig);
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
