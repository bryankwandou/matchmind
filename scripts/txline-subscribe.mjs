/**
 * TxLINE Free Tier Subscription Script
 * Service Level 12 — World Cup real-time (free, no TxL tokens needed)
 * Run: node scripts/txline-subscribe.mjs
 */

import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import * as anchor from "@coral-xyz/anchor";
import nacl from "tweetnacl";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Constants — using DEVNET (wallet has devnet SOL) ──────────────────────
const MAINNET_RPC   = "https://api.devnet.solana.com";
const PROGRAM_ID    = new PublicKey("6pW64gN1s2uqjHkn1unFeEjAwJkPGHoppGvS715wyP2J");
const TOKEN_MINT    = new PublicKey("4Zao8ocPhmMgq7PdsYWyxvqySMGx7xb9cMftPMkEokRG");
const TXLINE_API    = "https://txline-dev.txodds.com";

const SERVICE_LEVEL = 1;    // World Cup & Int Friendlies (60s delay, free tier)
const DURATION_WEEKS = 4;   // 4 weeks minimum
const LEAGUES = [];          // Empty = standard bundle

// ── Wallet setup ──────────────────────────────────────────────────────────
// Prefer existing funded Solana CLI wallet, fall back to generated wallet
const SYSTEM_WALLET = "C:\\Users\\arche\\.config\\solana\\veztra-deploy.json";
const FALLBACK_WALLET_PATH = path.join(__dirname, ".txline-wallet.json");

function loadOrCreateWallet() {
  // Use existing funded wallet if available
  if (fs.existsSync(SYSTEM_WALLET)) {
    const raw = JSON.parse(fs.readFileSync(SYSTEM_WALLET, "utf8"));
    const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
    console.log(`[wallet] Using system wallet: ${kp.publicKey.toBase58()}`);
    return kp;
  }
  if (fs.existsSync(FALLBACK_WALLET_PATH)) {
    const raw = JSON.parse(fs.readFileSync(FALLBACK_WALLET_PATH, "utf8"));
    const kp = Keypair.fromSecretKey(Uint8Array.from(raw));
    console.log(`[wallet] Loaded existing: ${kp.publicKey.toBase58()}`);
    return kp;
  }
  const kp = Keypair.generate();
  fs.writeFileSync(FALLBACK_WALLET_PATH, JSON.stringify(Array.from(kp.secretKey)));
  console.log(`[wallet] Generated new: ${kp.publicKey.toBase58()}`);
  console.log(`[wallet] IMPORTANT: Back up ${FALLBACK_WALLET_PATH}`);
  return kp;
}

// ── PDA derivation ────────────────────────────────────────────────────────
function getPricingMatrixPda() {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_matrix")],
    PROGRAM_ID
  );
  return pda;
}

function getTokenTreasuryPda() {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("token_treasury_v2")],
    PROGRAM_ID
  );
  return pda;
}

// ── Step 1: On-chain subscription ─────────────────────────────────────────
async function subscribeOnChain(keypair, connection) {
  console.log("\n[step 1] Subscribing on-chain...");

  const wallet = new anchor.Wallet(keypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  const pricingMatrixPda = getPricingMatrixPda();
  const tokenTreasuryPda = getTokenTreasuryPda();

  // Fetch pricing matrix account to get the vault address
  let tokenTreasuryVault;
  try {
    const acct = await connection.getAccountInfo(tokenTreasuryPda);
    if (acct) {
      // Treasury vault is the ATA of the treasury PDA for the token mint
      tokenTreasuryVault = getAssociatedTokenAddressSync(
        TOKEN_MINT,
        tokenTreasuryPda,
        true, // allowOwnerOffCurve = true for PDAs
        TOKEN_2022_PROGRAM_ID
      );
    }
  } catch (e) {
    console.log("[warn] Could not fetch treasury PDA account, deriving vault...");
  }

  if (!tokenTreasuryVault) {
    tokenTreasuryVault = getAssociatedTokenAddressSync(
      TOKEN_MINT,
      tokenTreasuryPda,
      true,
      TOKEN_2022_PROGRAM_ID
    );
  }

  const userTokenAccount = getAssociatedTokenAddressSync(
    TOKEN_MINT,
    keypair.publicKey,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  console.log(`  pricingMatrix:     ${pricingMatrixPda.toBase58()}`);
  console.log(`  tokenTreasuryPda:  ${tokenTreasuryPda.toBase58()}`);
  console.log(`  tokenTreasuryVault:${tokenTreasuryVault.toBase58()}`);
  console.log(`  userTokenAccount:  ${userTokenAccount.toBase58()}`);
  console.log(`  serviceLevel:      ${SERVICE_LEVEL} (WC free tier)`);
  console.log(`  duration:          ${DURATION_WEEKS} weeks`);

  // Exact discriminator from TxLINE devnet IDL
  const discriminator = Buffer.from([254, 28, 191, 138, 156, 179, 183, 53]);

  // service_level_id is u16 (little-endian), weeks is u8
  const serviceLevelBuf = Buffer.alloc(2);
  serviceLevelBuf.writeUInt16LE(SERVICE_LEVEL, 0);
  const weeksBuf = Buffer.from([DURATION_WEEKS]);
  const data = Buffer.concat([discriminator, serviceLevelBuf, weeksBuf]);

  const { Transaction, TransactionInstruction } = await import("@solana/web3.js");

  // Account ordering matches IDL exactly:
  // user, pricing_matrix, token_mint, user_token_account, token_treasury_vault,
  // token_treasury_pda, token_program, system_program, associated_token_program
  const ix = new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: keypair.publicKey,          isSigner: true,  isWritable: true  },  // user
      { pubkey: pricingMatrixPda,           isSigner: false, isWritable: false },  // pricing_matrix
      { pubkey: TOKEN_MINT,                 isSigner: false, isWritable: false },  // token_mint
      { pubkey: userTokenAccount,           isSigner: false, isWritable: true  },  // user_token_account
      { pubkey: tokenTreasuryVault,         isSigner: false, isWritable: true  },  // token_treasury_vault
      { pubkey: tokenTreasuryPda,           isSigner: false, isWritable: false },  // token_treasury_pda
      { pubkey: TOKEN_2022_PROGRAM_ID,      isSigner: false, isWritable: false },  // token_program
      { pubkey: SystemProgram.programId,    isSigner: false, isWritable: false },  // system_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,isSigner: false, isWritable: false },  // associated_token_program
    ],
    data,
  });

  // Check if user ATA exists — if not, prepend a createATA instruction
  const ataInfo = await connection.getAccountInfo(userTokenAccount);
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const tx = new Transaction({ recentBlockhash: blockhash, feePayer: keypair.publicKey });

  if (!ataInfo) {
    console.log("  [info] Creating user Token-2022 ATA first...");
    tx.add(
      createAssociatedTokenAccountInstruction(
        keypair.publicKey,      // payer
        userTokenAccount,       // ata
        keypair.publicKey,      // owner
        TOKEN_MINT,             // mint
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  tx.add(ix);
  tx.sign(keypair);

  try {
    const txSig = await connection.sendRawTransaction(tx.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });
    console.log(`  [ok] tx: ${txSig}`);
    await connection.confirmTransaction(txSig, "confirmed");
    console.log(`  [ok] confirmed`);
    return txSig;
  } catch (err) {
    // If subscription already active, extract tx sig from logs
    const msg = err.message ?? String(err);
    console.log(`  [warn] on-chain error: ${msg}`);

    // Extract embedded tx sig if present
    const sigMatch = msg.match(/([1-9A-HJ-NP-Za-km-z]{87,88})/);
    if (sigMatch) {
      console.log(`  [info] extracted existing tx sig: ${sigMatch[1]}`);
      return sigMatch[1];
    }
    throw err;
  }
}

// ── Step 2: Get guest JWT ──────────────────────────────────────────────────
async function getGuestJwt() {
  console.log("\n[step 2] Getting guest JWT...");
  // Guest auth always on mainnet endpoint regardless of data environment
  const res = await axios.post(`https://txline.txodds.com/auth/guest/start`);
  const jwt = res.data?.token ?? res.data;
  if (!jwt) throw new Error("No JWT in response: " + JSON.stringify(res.data));
  console.log(`  [ok] JWT obtained (${String(jwt).slice(0, 20)}...)`);
  return jwt;
}

// ── Step 3: Sign + activate API token ─────────────────────────────────────
async function activateToken(keypair, txSig, jwt) {
  console.log("\n[step 3] Activating API token...");

  const leagueStr = LEAGUES.join(",");
  const messageString = `${txSig}:${leagueStr}:${jwt}`;
  const message = new TextEncoder().encode(messageString);

  const signatureBytes = nacl.sign.detached(message, keypair.secretKey);
  const walletSignature = Buffer.from(signatureBytes).toString("base64");

  console.log(`  message: "${messageString.slice(0, 60)}..."`);

  const res = await axios.post(
    `https://txline.txodds.com/api/token/activate`,
    {
      txSig,
      walletSignature,
      leagues: LEAGUES,
    },
    {
      headers: { Authorization: `Bearer ${jwt}` },
    }
  );

  const apiToken = res.data?.token ?? res.data;
  if (!apiToken || typeof apiToken !== "string") {
    throw new Error("No API token in response: " + JSON.stringify(res.data));
  }

  console.log(`  [ok] API token activated: ${apiToken.slice(0, 20)}...`);
  return apiToken;
}

// ── Step 4: Verify token works ────────────────────────────────────────────
async function verifyToken(apiToken) {
  console.log("\n[step 4] Verifying token against /api/scores/snapshot...");
  const res = await axios.get(`https://txline.txodds.com/api/scores/snapshot`, {
    headers: { Authorization: `Bearer ${apiToken}` },
    timeout: 10000,
  });
  const count = Array.isArray(res.data) ? res.data.length : "unknown";
  console.log(`  [ok] Response status ${res.status} — ${count} fixtures in snapshot`);
  return true;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log(" TxLINE Free Tier Subscription — World Cup Real-Time");
  console.log("=".repeat(60));

  const keypair = loadOrCreateWallet();
  const connection = new Connection(MAINNET_RPC, "confirmed");

  // Check wallet balance
  const lamports = await connection.getBalance(keypair.publicKey);
  const sol = lamports / 1e9;
  console.log(`\n[wallet] Balance: ${sol.toFixed(4)} SOL`);

  if (sol < 0.001) {
    console.log("\n[warn] Wallet has no SOL. Need ~0.001 SOL for tx fees.");
    console.log(`       Fund this address: ${keypair.publicKey.toBase58()}`);
    console.log("       Then re-run this script.");

    // Still try the guest auth flow — maybe subscription is already active
    console.log("\n[info] Attempting auth flow anyway (may work if already subscribed)...");
  }

  // ── Recover saved tx sig (skip re-subscription if already done) ────────────
  const txSigFile = path.join(__dirname, ".txline-txsig.txt");
  let txSig;

  if (fs.existsSync(txSigFile)) {
    txSig = fs.readFileSync(txSigFile, "utf8").trim();
    console.log(`\n[info] Reusing saved tx sig: ${txSig.slice(0, 30)}...`);
  } else {
    try {
      txSig = await subscribeOnChain(keypair, connection);
      fs.writeFileSync(txSigFile, txSig);
      console.log(`  [info] tx sig saved to ${txSigFile}`);
    } catch (err) {
      console.log(`\n[error] On-chain subscription failed: ${err.message}`);
      console.log("[info] Cannot proceed without successful on-chain subscription.");
      console.log(`\nFund this wallet with 0.001 SOL and retry:`);
      console.log(`  Address: ${keypair.publicKey.toBase58()}`);
      process.exit(1);
    }
  }

  const jwt = await getGuestJwt();
  // Retry activation up to 5 times with exponential backoff (handles 504)
  let apiToken;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      apiToken = await activateToken(keypair, txSig, jwt);
      break;
    } catch (err) {
      const status = err.response?.status ?? 0;
      if ((status === 504 || status === 502 || status === 503 || status === 0) && attempt < 5) {
        const wait = attempt * 3000;
        console.log(`  [retry] attempt ${attempt} failed (${status || err.message?.slice(0,30)}), waiting ${wait/1000}s...`);
        await new Promise(r => setTimeout(r, wait));
      } else {
        throw err;
      }
    }
  }
  await verifyToken(apiToken);

  // Save token to file + print for Vercel injection
  const tokenPath = path.join(__dirname, ".txline-token.txt");
  fs.writeFileSync(tokenPath, apiToken);

  console.log("\n" + "=".repeat(60));
  console.log(" SUCCESS");
  console.log("=".repeat(60));
  console.log(`\nAPI Token saved to: ${tokenPath}`);
  console.log(`\nNext: set on Vercel with:`);
  console.log(`  node scripts/txline-set-vercel-key.mjs`);
  console.log("=".repeat(60));

  return apiToken;
}

main().catch((err) => {
  console.error("\n[fatal]", err.message ?? err);
  process.exit(1);
});
