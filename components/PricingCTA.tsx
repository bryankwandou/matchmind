"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { devnetConnection, ensureDevnetSol, explorerTxUrl } from "@/lib/moments";
import { TIER_PRICING, buildFanPassTx, loadReceipt, saveReceipt, type TierId, type Receipt } from "@/lib/fanPass";

type PayState =
  | { phase: "idle" }
  | { phase: "paying"; step: string }
  | { phase: "error"; message: string };

export default function PricingCTA({
  tier,
  label,
  bg,
  color,
  outlined,
}: {
  tier: TierId;
  label: string;
  bg: string;
  color: string;
  outlined?: boolean;
}) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<PayState>({ phase: "idle" });
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  // localStorage is only readable client-side, so hydration has to happen in an effect.
  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    setReceipt(loadReceipt());
  }, []);

  const active = receipt?.tier === tier;

  async function pay() {
    if (!connected || !publicKey) {
      setState({ phase: "error", message: "Connect a wallet above to buy a pass." });
      return;
    }
    if (state.phase === "paying") return;

    try {
      setState({ phase: "paying", step: "Checking devnet balance" });
      await ensureDevnetSol(publicKey);

      const conn = devnetConnection();
      const tx = buildFanPassTx(publicKey, tier);
      const bh = await conn.getLatestBlockhash();
      tx.recentBlockhash = bh.blockhash;
      tx.feePayer = publicKey;

      setState({ phase: "paying", step: "Waiting for wallet signature" });
      const signature = await sendTransaction(tx, conn);

      setState({ phase: "paying", step: "Confirming on devnet" });
      await conn.confirmTransaction({ signature, ...bh }, "confirmed");

      const r: Receipt = {
        tier,
        signature,
        wallet: publicKey.toBase58(),
        expiresAt: Date.now() + TIER_PRICING[tier].durationMs,
      };
      saveReceipt(r);
      setReceipt(r);
      setState({ phase: "idle" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = /reject|cancel|denied/i.test(raw)
        ? "Payment declined in the wallet."
        : /insufficient|0x1\b/i.test(raw)
        ? "Not enough devnet SOL and the faucet is rate-limited. Try again shortly."
        : "Payment failed — devnet may be busy. Try again shortly.";
      setState({ phase: "error", message });
    }
  }

  if (active && receipt) {
    return (
      <div>
        <div style={{
          width: "100%", padding: "11px", borderRadius: "9px",
          background: "rgba(0,232,122,0.1)", border: "1px solid rgba(0,232,122,0.3)",
          textAlign: "center",
        }}>
          <p style={{ fontSize: "13px", fontWeight: 800, color: "var(--green)" }}>Pass active</p>
        </div>
        <a
          href={explorerTxUrl(receipt.signature)}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "block", textAlign: "center", fontSize: "10px", color: "var(--text-3)", marginTop: "6px", textDecoration: "none" }}
        >
          View payment on explorer
        </a>
      </div>
    );
  }

  return (
    <div>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={pay}
        disabled={state.phase === "paying"}
        style={{
          width: "100%",
          padding: "11px",
          borderRadius: "9px",
          background: state.phase === "paying" ? "var(--bg-3)" : bg,
          color: state.phase === "paying" ? "var(--text-3)" : color,
          fontSize: "13px",
          fontWeight: 700,
          cursor: state.phase === "paying" ? "default" : "pointer",
          letterSpacing: "-0.01em",
          border: outlined ? "1px solid var(--border)" : "none",
        }}
      >
        {state.phase === "paying" ? state.step + "…" : `${label} · ${TIER_PRICING[tier].devnetSol} SOL (devnet)`}
      </motion.button>
      <AnimatePresence>
        {state.phase === "error" && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: "10px", color: "var(--red)", marginTop: "6px", textAlign: "center" }}
          >
            {state.message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
