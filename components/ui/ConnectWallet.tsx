"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

function truncate(addr: string) {
  return addr.slice(0, 4) + "…" + addr.slice(-4);
}

// What the wallet is actually for, stated plainly so it is never a mystery button.
const PURPOSE = [
  "Confirm the on-chain TxLINE pass tied to this wallet",
  "Pin the team you back so every read leans your way",
  "Carry your match history between devices",
];

export default function ConnectWallet() {
  const { connected, publicKey, connect, disconnect, select, wallets, connecting } = useWallet();
  const [open, setOpen] = useState(false);

  if (connected && publicKey) {
    return (
      <div style={{ position: "relative" }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setOpen(!open)}
          title="Wallet linked — click to see what it unlocks"
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
                minWidth: "260px",
                background: "#0d0d0d",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px",
                zIndex: 200,
              }}
            >
              <p style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", color: "var(--green)", marginBottom: "10px" }}>
                WHAT THIS WALLET IS FOR
              </p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
                {PURPOSE.map((line) => (
                  <li key={line} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--green)", flexShrink: 0 }}>—</span>
                    {line}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { disconnect(); setOpen(false); }}
                style={{
                  width: "100%",
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  color: "var(--text-3)",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Unlink wallet
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        disabled={connecting}
        title="Link a Solana wallet to unlock the pass and pin your team"
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
        {connecting ? "Linking…" : "Connect wallet"}
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
              minWidth: "260px",
              background: "#0d0d0d",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "14px",
              zIndex: 200,
            }}
          >
            <p style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", color: "var(--green)", marginBottom: "8px" }}>
              WHY LINK A WALLET
            </p>
            <ul style={{ listStyle: "none", margin: "0 0 12px", padding: 0, display: "flex", flexDirection: "column", gap: "7px" }}>
              {PURPOSE.map((line) => (
                <li key={line} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", color: "var(--text-2)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--green)", flexShrink: 0 }}>—</span>
                  {line}
                </li>
              ))}
            </ul>

            {wallets.length === 0 ? (
              <p style={{ fontSize: "12px", color: "var(--text-3)", padding: "8px 10px", background: "var(--bg-3)", borderRadius: "8px", lineHeight: 1.5 }}>
                No Solana wallet found. Install Phantom or Backpack, then reload to link.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
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
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
