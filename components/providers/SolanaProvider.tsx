"use client";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { useMemo, ReactNode } from "react";
import { SOLANA_RPC_URL } from "@/lib/network";

export default function SolanaProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => SOLANA_RPC_URL, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      {/* autoConnect: silently re-attach the last-used wallet on every page
          load — without it, navigation dropped the session and users had to
          reconnect on each page. */}
      <WalletProvider wallets={[]} autoConnect>
        {children}
      </WalletProvider>
    </ConnectionProvider>
  );
}
