// Moment Mint — writes a match moment on-chain as a Solana devnet Memo transaction.
// The memo carries score, minute, odds at that second, and the AI read, signed by
// the user's wallet. Verifiable on explorer.solana.com (?cluster=devnet).

import { Buffer } from "buffer";
import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Dedicated devnet connection — moment mints always land on devnet regardless of
// the wallet provider's default cluster, so no real SOL is ever spent.
let _devnet: Connection | null = null;
export function devnetConnection(): Connection {
  if (!_devnet) _devnet = new Connection(clusterApiUrl("devnet"), "confirmed");
  return _devnet;
}

export type Moment = {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  eventType: string;
  odds: { home: number; draw: number; away: number };
  read: string; // AI read at that second
};

// Signed memos cap out around 566 bytes — keep the payload compact and clip the read.
export function momentMemoPayload(m: Moment): string {
  const read = m.read.length > 140 ? m.read.slice(0, 137) + "..." : m.read;
  return JSON.stringify({
    app: "MatchMind",
    v: 1,
    fx: m.fixtureId,
    tie: `${m.homeTeam} ${m.homeScore}-${m.awayScore} ${m.awayTeam}`,
    min: m.minute,
    ev: m.eventType,
    odds: [m.odds.home, m.odds.draw, m.odds.away],
    read,
    ts: Date.now(),
  });
}

export function buildMemoTx(payer: PublicKey, payload: string): Transaction {
  const ix = new TransactionInstruction({
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
    data: Buffer.from(payload, "utf8"),
  });
  return new Transaction().add(ix);
}

// Devnet SOL is free — top the wallet up automatically if it can't cover fees.
export async function ensureDevnetSol(pubkey: PublicKey): Promise<void> {
  const conn = devnetConnection();
  const balance = await conn.getBalance(pubkey);
  if (balance >= 0.001 * LAMPORTS_PER_SOL) return;
  try {
    const sig = await conn.requestAirdrop(pubkey, 1 * LAMPORTS_PER_SOL);
    const bh = await conn.getLatestBlockhash();
    await conn.confirmTransaction({ signature: sig, ...bh }, "confirmed");
  } catch {
    // Airdrop faucet is rate-limited; the mint attempt will surface a clear error.
  }
}

export function explorerTxUrl(signature: string): string {
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
