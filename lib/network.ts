// Single source of truth for which Solana cluster the app talks to. The
// wallet connection, Moment Mint, Streak Badge, and the Fan Pass USDC
// payment all read from here so they can never drift onto different
// networks — set NEXT_PUBLIC_SOLANA_NETWORK once and everything follows it.

import { clusterApiUrl, type Cluster } from "@solana/web3.js";

const RAW = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "devnet").trim().toLowerCase();

export const SOLANA_NETWORK: Cluster =
  RAW === "mainnet-beta" || RAW === "mainnet" ? "mainnet-beta" :
  RAW === "testnet" ? "testnet" :
  "devnet";

export const IS_DEVNET = SOLANA_NETWORK === "devnet";

export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl(SOLANA_NETWORK);

// Circle's official USDC mint for the active cluster.
// Mainnet: https://www.circle.com/multi-chain-usdc/solana
// Devnet:  https://developers.circle.com/stablecoins/quickstart-transfer-10-usdc-on-solana
export const USDC_MINT_ADDRESS =
  SOLANA_NETWORK === "mainnet-beta"
    ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    : "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

export const USDC_DECIMALS = 6;

// Circle's devnet faucet — the only way to get devnet USDC into a wallet
// (unlike devnet SOL, it is not airdroppable from the RPC itself).
export const USDC_FAUCET_URL = "https://faucet.circle.com/";

export function explorerUrl(path: string): string {
  const suffix = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/${path}${suffix}`;
}
