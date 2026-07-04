"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Moment,
  momentMemoPayload,
  buildMemoTx,
  appConnection,
  ensureFunded,
  explorerTxUrl,
} from "@/lib/moments";
import { IS_DEVNET } from "@/lib/network";

type MintState =
  | { phase: "idle" }
  | { phase: "minting"; step: string }
  | { phase: "done"; signature: string }
  | { phase: "error"; message: string };

export default function MomentMint({ moment, compact }: { moment: Moment; compact?: boolean }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<MintState>({ phase: "idle" });

  async function mint() {
    if (!connected || !publicKey) {
      setState({ phase: "error", message: "Link a wallet first (top right) to mint this moment." });
      return;
    }
    if (state.phase === "minting") return;

    try {
      setState({ phase: "minting", step: "Checking balance" });
      await ensureFunded(publicKey);

      setState({ phase: "minting", step: "Waiting for wallet signature" });
      const conn = appConnection();
      const tx = buildMemoTx(publicKey, momentMemoPayload(moment));
      const bh = await conn.getLatestBlockhash();
      tx.recentBlockhash = bh.blockhash;
      tx.feePayer = publicKey;

      const signature = await sendTransaction(tx, conn);
      setState({ phase: "minting", step: "Confirming on devnet" });
      await conn.confirmTransaction({ signature, ...bh }, "confirmed");

      setState({ phase: "done", signature });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = /reject|cancel|denied/i.test(raw)
        ? "Signature declined in the wallet."
        : /insufficient|0x1\b/i.test(raw)
        ? IS_DEVNET
          ? "Not enough devnet SOL for the fee and the faucet is rate-limited. Try again in a minute."
          : "Not enough SOL in this wallet to cover the network fee."
        : "Mint failed — network may be busy. Try again shortly.";
      setState({ phase: "error", message });
    }
  }

  if (state.phase === "done") {
    return (
      <motion.a
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        href={explorerTxUrl(state.signature)}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "5px",
          padding: compact ? "3px 8px" : "6px 12px",
          borderRadius: "6px",
          background: "rgba(0,232,122,0.1)",
          border: "1px solid rgba(0,232,122,0.35)",
          color: "var(--green)",
          fontSize: compact ? "9px" : "11px",
          fontWeight: 700,
          textDecoration: "none",
          letterSpacing: "0.03em",
        }}
        title="Minted on Solana devnet — click to view the transaction"
      >
        <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--green)" }} />
        Minted · view on explorer
      </motion.a>
    );
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: "4px", alignItems: "flex-start" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={mint}
        disabled={state.phase === "minting"}
        style={{
          padding: compact ? "3px 8px" : "6px 12px",
          borderRadius: "6px",
          border: "1px solid var(--border-2)",
          background: state.phase === "minting" ? "var(--bg-3)" : "rgba(153,105,255,0.10)",
          color: state.phase === "minting" ? "var(--text-3)" : "#b899ff",
          fontSize: compact ? "9px" : "11px",
          fontWeight: 700,
          cursor: state.phase === "minting" ? "default" : "pointer",
          letterSpacing: "0.03em",
        }}
        title="Write this moment to Solana devnet — score, minute, odds and the read, signed by your wallet"
      >
        {state.phase === "minting" ? state.step + "…" : "Mint moment"}
      </motion.button>

      <AnimatePresence>
        {state.phase === "error" && (
          <motion.span
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: "10px", color: "var(--red)", maxWidth: "220px", lineHeight: 1.4 }}
          >
            {state.message}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
