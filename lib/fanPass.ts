// Fan Pass — a real USDC payment on Solana: an SPL-token transfer to the
// MatchMind treasury, confirmed on-chain, signature kept as the receipt.
// Runs on whichever cluster lib/network.ts configures — the same one the
// wallet connects to, so a payment can never land on a different network
// than the rest of the app.

import {
  Connection,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  getAccount,
} from "@solana/spl-token";
import { USDC_MINT_ADDRESS, USDC_DECIMALS, SOLANA_NETWORK } from "./network";

// Receiving address — same cluster as everything else in the app.
export const TREASURY_PUBKEY = new PublicKey("2Waw7LcrVgc54fvry6CqWyuysdpf3qEFNWUvoegG5ceM");
export const USDC_MINT = new PublicKey(USDC_MINT_ADDRESS);

export type TierId = "fan_pass" | "tournament";

// Priced 1:1 with the listed USD amount — USDC is a dollar stablecoin, so
// there is no conversion step and no price-drift risk between quote and pay.
export const TIER_PRICING: Record<TierId, { label: string; usdc: number; durationMs: number }> = {
  fan_pass: { label: "Fan Pass", usdc: 4, durationMs: 6 * 60 * 60 * 1000 },
  tournament: { label: "Tournament", usdc: 29, durationMs: 45 * 24 * 60 * 60 * 1000 },
};

export type Receipt = {
  tier: TierId;
  signature: string;
  wallet: string;
  expiresAt: number;
  amountUsdc: number;
  couponCode?: string;
};

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

export async function getUsdcBalance(conn: Connection, owner: PublicKey): Promise<number> {
  const ata = getAssociatedTokenAddressSync(USDC_MINT, owner);
  try {
    const acc = await getAccount(conn, ata);
    return Number(acc.amount) / 10 ** USDC_DECIMALS;
  } catch {
    return 0; // no ATA yet == no USDC yet
  }
}

// Builds the transfer; creates the treasury's USDC associated token account
// in the same transaction if this is the first payment it has ever received.
export async function buildFanPassTx(
  conn: Connection,
  payer: PublicKey,
  amountUsdc: number
): Promise<Transaction> {
  const payerAta = getAssociatedTokenAddressSync(USDC_MINT, payer);
  const treasuryAta = getAssociatedTokenAddressSync(USDC_MINT, TREASURY_PUBKEY);

  const tx = new Transaction();
  const treasuryAccountInfo = await conn.getAccountInfo(treasuryAta);
  if (!treasuryAccountInfo) {
    tx.add(createAssociatedTokenAccountInstruction(payer, treasuryAta, TREASURY_PUBKEY, USDC_MINT));
  }

  const amountBaseUnits = Math.round(amountUsdc * 10 ** USDC_DECIMALS);
  tx.add(createTransferCheckedInstruction(payerAta, USDC_MINT, treasuryAta, payer, amountBaseUnits, USDC_DECIMALS));
  return tx;
}

// Circle's devnet faucet only dispenses USDC — a wallet still needs devnet
// SOL for the transaction fee, which ensureFunded() in lib/moments.ts covers.
export const NETWORK_LABEL = SOLANA_NETWORK === "mainnet-beta" ? "Solana mainnet" : `Solana ${SOLANA_NETWORK}`;
