// Streak Badge — mints a real fixed-supply SPL token on Solana devnet at each
// streak milestone (5, 10, 25, 50...). One transaction: create the mint,
// mint the single unit to the caller's wallet, then permanently revoke mint
// authority so supply can never exceed 1 — a genuine on-chain collectible,
// not just a log entry. Milestone context rides along in a bundled memo.

import { Buffer } from "buffer";
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  getMinimumBalanceForRentExemptMint,
  createInitializeMint2Instruction,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  createSetAuthorityInstruction,
  AuthorityType,
} from "@solana/spl-token";
import { MEMO_PROGRAM_ID, devnetConnection } from "./moments";

export const STREAK_MILESTONES = [5, 10, 25, 50, 100] as const;

export function nextMilestone(streak: number): number | null {
  return STREAK_MILESTONES.find((m) => m > streak) ?? null;
}

export function hitMilestone(streak: number): number | null {
  return STREAK_MILESTONES.includes(streak as (typeof STREAK_MILESTONES)[number]) ? streak : null;
}

export type BadgeBuild = { tx: Transaction; mint: Keypair };

export async function buildStreakBadgeTx(
  conn: Connection,
  payer: PublicKey,
  milestone: number,
  best: number
): Promise<BadgeBuild> {
  const mint = Keypair.generate();
  const rent = await getMinimumBalanceForRentExemptMint(conn);
  const ata = getAssociatedTokenAddressSync(mint.publicKey, payer);

  const memoPayload = Buffer.from(
    JSON.stringify({
      app: "MatchMind",
      v: 1,
      kind: "streak-badge",
      milestone,
      best,
      ts: Date.now(),
    }),
    "utf8"
  );

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mint.publicKey,
      space: MINT_SIZE,
      lamports: rent,
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMint2Instruction(mint.publicKey, 0, payer, payer),
    createAssociatedTokenAccountInstruction(payer, ata, payer, mint.publicKey),
    createMintToInstruction(mint.publicKey, ata, payer, 1),
    // Fixed supply forever — no further badges can ever be minted from this address.
    createSetAuthorityInstruction(mint.publicKey, payer, AuthorityType.MintTokens, null),
    new TransactionInstruction({
      programId: MEMO_PROGRAM_ID,
      keys: [{ pubkey: payer, isSigner: true, isWritable: false }],
      data: memoPayload,
    })
  );
  return { tx, mint };
}

export { devnetConnection };
