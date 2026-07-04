// Fan Pass — a real Solana devnet payment: SystemProgram.transfer to the
// MatchMind treasury address, confirmed on-chain, signature kept as the
// receipt. Devnet SOL stands in for the listed USD price so the whole rail
// (connect, sign, confirm, unlock) can be tested without touching mainnet.

import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";

// Devnet-only receiving address — holds no mainnet value.
export const TREASURY_PUBKEY = new PublicKey("2Waw7LcrVgc54fvry6CqWyuysdpf3qEFNWUvoegG5ceM");

export type TierId = "fan_pass" | "tournament";

export const TIER_PRICING: Record<TierId, { label: string; usd: string; devnetSol: number; durationMs: number }> = {
  fan_pass: { label: "Fan Pass", usd: "$4", devnetSol: 0.004, durationMs: 6 * 60 * 60 * 1000 },
  tournament: { label: "Tournament", usd: "$29", devnetSol: 0.029, durationMs: 45 * 24 * 60 * 60 * 1000 },
};

export type Receipt = { tier: TierId; signature: string; wallet: string; expiresAt: number };

const RECEIPT_KEY = "mm_fan_pass_receipt";

export function loadReceipt(): Receipt | null {
  try {
    const raw = localStorage.getItem(RECEIPT_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as Receipt;
    return r.expiresAt > Date.now() ? r : null;
  } catch {
    return null;
  }
}

export function saveReceipt(r: Receipt): void {
  try {
    localStorage.setItem(RECEIPT_KEY, JSON.stringify(r));
  } catch {
    // storage blocked — receipt still valid on explorer, just not remembered locally
  }
}

export function buildFanPassTx(payer: PublicKey, tier: TierId): Transaction {
  const { devnetSol } = TIER_PRICING[tier];
  return new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: TREASURY_PUBKEY,
      lamports: Math.round(devnetSol * LAMPORTS_PER_SOL),
    })
  );
}
