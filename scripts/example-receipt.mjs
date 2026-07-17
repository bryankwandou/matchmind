// Sends one real devnet memo transaction in the exact shape the app's
// Moment Mint uses, so the README can link a live example receipt that
// judges can open on the explorer.
import { Connection, Keypair, Transaction, TransactionInstruction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import fs from "fs";

const WALLET_PATH = "C:\\Users\\arche\\.config\\solana\\veztra-deploy.json";
const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

const conn = new Connection("https://api.devnet.solana.com", "confirmed");
const kp = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(WALLET_PATH, "utf8"))));
console.log("wallet:", kp.publicKey.toBase58());

let bal = await conn.getBalance(kp.publicKey);
console.log("balance:", bal / LAMPORTS_PER_SOL, "SOL");
if (bal < 0.002 * LAMPORTS_PER_SOL) {
  console.log("airdropping...");
  const sig = await conn.requestAirdrop(kp.publicKey, 0.05 * LAMPORTS_PER_SOL);
  await conn.confirmTransaction(sig, "confirmed");
  bal = await conn.getBalance(kp.publicKey);
  console.log("balance now:", bal / LAMPORTS_PER_SOL);
}

const moment = {
  app: "MatchMind",
  kind: "moment",
  fixture: "example — England vs Argentina",
  score: "0-0",
  minute: 0,
  odds: { home: 2.78, draw: 3.00, away: 3.19 },
  note: "Example receipt for judges — the in-app Mint moment button writes this same shape, signed by the fan's own wallet.",
};

const ix = new TransactionInstruction({
  keys: [{ pubkey: kp.publicKey, isSigner: true, isWritable: false }],
  programId: MEMO_PROGRAM,
  data: Buffer.from(JSON.stringify(moment), "utf8"),
});

const tx = new Transaction().add(ix);
const sig = await conn.sendTransaction(tx, [kp]);
await conn.confirmTransaction(sig, "confirmed");
console.log("\nSIGNATURE:", sig);
console.log("EXPLORER: https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
