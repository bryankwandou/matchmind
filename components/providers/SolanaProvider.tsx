"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import { useMemo, ReactNode } from "react";

// Network: mainnet-beta for production subscription
const NETWORK = (process.env.NEXT_PUBLIC_SOLANA_NETWORK ?? "mainnet-beta") as
  | "mainnet-beta"
  | "devnet"
  | "testnet";

export default function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => clusterApiUrl(NETWORK), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={[]} autoConnect={false}>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
