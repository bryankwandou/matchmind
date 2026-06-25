"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function truncate(addr: string) {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

export default function ConnectWallet() {
  const { connected, publicKey, connect, disconnect, select, wallets, connecting } = useWallet();
  const [open, setOpen] = useState(false);

  if (connected && publicKey) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => disconnect()}
        style={{
          padding: "7px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          border: "1px solid var(--border)",
          background: "rgba(0,232,122,0.08)",
          color: "var(--green)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        <span style={{
          width: "6px", height: "6px", borderRadius: "50%",
          background: "var(--green)", display: "inline-block",
        }} />
        {truncate(publicKey.toBase58())}
      </motion.button>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => wallets.length ? setOpen(!open) : void 0}
        disabled={connecting}
        style={{
          padding: "7px 14px",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: 600,
          cursor: "pointer",
          border: "1px solid var(--border)",
          background: "rgba(255,255,255,0.04)",
          color: "var(--text-2)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          letterSpacing: "-0.01em",
        }}
      >
        {connecting ? "Connecting…" : "Connect wallet"}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              minWidth: "200px",
              background: "#0d0d0d",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "8px",
              zIndex: 200,
            }}
          >
            {wallets.length === 0 && (
              <p style={{ fontSize: "12px", color: "var(--text-3)", padding: "8px 12px" }}>
                Install Phantom or Backpack to subscribe on-chain
              </p>
            )}
            {wallets.map((w) => (
              <button
                key={w.adapter.name}
                onClick={async () => {
                  select(w.adapter.name);
                  await connect();
                  setOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "10px 12px",
                  border: "none",
                  background: "transparent",
                  color: "var(--text)",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: "8px",
                  textAlign: "left",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {w.adapter.icon && (
                  <img src={w.adapter.icon} alt={w.adapter.name} style={{ width: "20px", height: "20px", borderRadius: "4px" }} />
                )}
                {w.adapter.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
