"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { appConnection, ensureFunded, explorerTxUrl } from "@/lib/moments";
import {
  TIER_PRICING,
  buildFanPassTx,
  getUsdcBalance,
  loadReceipt,
  saveReceipt,
  type TierId,
  type Receipt,
} from "@/lib/fanPass";
import { IS_DEVNET, USDC_FAUCET_URL } from "@/lib/network";

type PayState =
  | { phase: "idle" }
  | { phase: "paying"; step: string }
  | { phase: "error"; message: string; needsFaucet?: boolean };

export default function PricingCTA({
  tier,
  label,
  bg,
  color,
  outlined,
  amountUsdc,
  couponCode,
}: {
  tier: TierId;
  label: string;
  bg: string;
  color: string;
  outlined?: boolean;
  amountUsdc?: number; // overrides the list price when a coupon has been applied
  couponCode?: string;
}) {
  const { connected, publicKey, sendTransaction } = useWallet();
  const [state, setState] = useState<PayState>({ phase: "idle" });
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const price = amountUsdc ?? TIER_PRICING[tier].usdc;

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
      setState({ phase: "paying", step: "Checking USDC balance" });
      const conn = appConnection();
      const balance = await getUsdcBalance(conn, publicKey);
      if (balance < price) {
        setState({
          phase: "error",
          message: IS_DEVNET
            ? `This wallet holds ${balance.toFixed(2)} USDC, needs ${price.toFixed(2)}. Get devnet USDC from Circle's faucet.`
            : `This wallet holds ${balance.toFixed(2)} USDC, needs ${price.toFixed(2)} USDC.`,
          needsFaucet: IS_DEVNET,
        });
        return;
      }

      setState({ phase: "paying", step: "Checking network fee balance" });
      await ensureFunded(publicKey);

      setState({ phase: "paying", step: "Building payment" });
      const tx = await buildFanPassTx(conn, publicKey, price);
      const bh = await conn.getLatestBlockhash();
      tx.recentBlockhash = bh.blockhash;
      tx.feePayer = publicKey;

      setState({ phase: "paying", step: "Waiting for wallet signature" });
      const signature = await sendTransaction(tx, conn);

      setState({ phase: "paying", step: "Confirming on-chain" });
      await conn.confirmTransaction({ signature, ...bh }, "confirmed");

      const r: Receipt = {
        tier,
        signature,
        wallet: publicKey.toBase58(),
        expiresAt: Date.now() + TIER_PRICING[tier].durationMs,
        amountUsdc: price,
        couponCode,
      };
      saveReceipt(r);
      setReceipt(r);
      setState({ phase: "idle" });
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err);
      const message = /reject|cancel|denied/i.test(raw)
        ? "Payment declined in the wallet."
        : /insufficient|0x1\b/i.test(raw)
        ? "Payment failed — insufficient balance for fees or funds."
        : "Payment failed — network may be busy. Try again shortly.";
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
        {state.phase === "paying" ? state.step + "…" : `${label} · ${price.toFixed(2)} USDC`}
      </motion.button>
      <AnimatePresence>
        {state.phase === "error" && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ marginTop: "6px", textAlign: "center" }}
          >
            <p style={{ fontSize: "10px", color: "var(--red)" }}>{state.message}</p>
            {state.needsFaucet && (
              <a
                href={USDC_FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "10px", color: "var(--text-3)", textDecoration: "underline" }}
              >
                Open Circle&apos;s devnet USDC faucet
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
