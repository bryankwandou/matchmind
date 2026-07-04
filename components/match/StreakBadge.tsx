"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ensureDevnetSol, explorerTxUrl } from "@/lib/moments";
import { buildStreakBadgeTx, devnetConnection } from "@/lib/streakBadge";

type BadgeState =
  | { phase: "idle" }
  | { phase: "minting"; step: string }
  | { phase: "done"; signature: string; mint: string }
  | { phase: "error"; message: string };

// Fires when the caller hits a streak milestone — offers to mint a real
// fixed-supply token on devnet as proof, one per milestone, ever.
export default function StreakBadge({ milestone, best }: { milestone: number; best: number }) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<BadgeState>({ phase: "idle" });

  async function mint() {
    if (!connected || !publicKey) {
      setState({ phase: "error", message: "Link a wallet to claim this badge on-chain." });
      return;
    }
    if (state.phase === "minting") return;

    try {
      setState({ phase: "minting", step: "Checking devnet balance" });
      await ensureDevnetSol(publicKey);

      const conn = devnetConnection();
      setState({ phase: "minting", step: "Building badge mint" });
      const { tx, mint: mintKeypair } = await buildStreakBadgeTx(conn, publicKey, milestone, best);
      const bh = await conn.getLatestBlockhash();
      tx.recentBlockhash = bh.blockhash;
      tx.feePayer = publicKey;

      setState({ phase: "minting", step: "Waiting for wallet signature" });
      const signature = await sendTransaction(tx, conn, { signers: [mintKeypair] });

      setState({ phase: "minting", step: "Confirming on devnet" });
      await conn.confirmTransaction({ signature, ...bh }, "confirmed");

      setState({ phase: "done", signature, mint: mintKeypair.publicKey.toBase58() });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = /reject|cancel|denied/i.test(raw)
        ? "Signature declined in the wallet."
        : /insufficient|0x1\b/i.test(raw)
        ? "Not enough devnet SOL and the faucet is rate-limited. Try again shortly."
        : "Badge mint failed — devnet may be busy. Try again shortly.";
      setState({ phase: "error", message });
    }
  }

  if (state.phase === "done") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: "12px 14px",
          borderRadius: "10px",
          background: "rgba(153,105,255,0.08)",
          border: "1px solid rgba(153,105,255,0.3)",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <p style={{ fontSize: "12px", fontWeight: 800, color: "#b899ff" }}>
          {milestone}-streak badge claimed
        </p>
        <a
          href={explorerTxUrl(state.signature)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "10px", color: "var(--text-3)", textDecoration: "none" }}
        >
          Mint {state.mint.slice(0, 4)}…{state.mint.slice(-4)} · view on explorer
        </a>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "12px 14px",
        borderRadius: "10px",
        background: "rgba(153,105,255,0.06)",
        border: "1px solid rgba(153,105,255,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "10px",
      }}
    >
      <div>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "#b899ff", marginBottom: "2px" }}>
          {milestone}-streak reached
        </p>
        <p style={{ fontSize: "10px", color: "var(--text-3)" }}>
          Claim a fixed-supply devnet badge — one mint, ever, tied to this call.
        </p>
      </div>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={mint}
        disabled={state.phase === "minting"}
        style={{
          padding: "7px 14px",
          borderRadius: "7px",
          border: "1px solid rgba(153,105,255,0.4)",
          background: state.phase === "minting" ? "var(--bg-3)" : "#b899ff",
          color: state.phase === "minting" ? "var(--text-3)" : "#0d0616",
          fontSize: "11px",
          fontWeight: 800,
          cursor: state.phase === "minting" ? "default" : "pointer",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {state.phase === "minting" ? state.step + "…" : "Claim badge"}
      </motion.button>

      <AnimatePresence>
        {state.phase === "error" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: "10px", color: "var(--red)" }}
          >
            {state.message}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
