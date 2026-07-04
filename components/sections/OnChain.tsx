"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TiltCard } from "../ui/TiltCard";
import { SpotlightCard } from "../ui/BeamBorder";
import { Link003 } from "../ui/skiper-ui/skiper40";

const CARDS = [
  {
    num: "01",
    title: "Call it before kickoff",
    body: "Pick the side you back against the TxLINE line before a ball is kicked. Get it right and the streak climbs. Get it wrong and it resets — best score stays on the board either way.",
    accent: "var(--green)",
  },
  {
    num: "02",
    title: "Every goal, signed and timestamped",
    body: "The instant the ball crosses the line — score, minute, the price at that second — gets written to Solana devnet under your wallet. Not a screenshot. A transaction with a signature.",
    accent: "#00c4ff",
  },
  {
    num: "03",
    title: "Five in a row becomes a token",
    body: "Hit a milestone streak and claim a fixed-supply token, minted on the spot. Mint authority gets revoked the second it's created — one unit, and nobody can ever print a second.",
    accent: "#b899ff",
  },
  {
    num: "04",
    title: "When you're wrong, own it",
    body: "One line about the call you just made, good or bad, ready to post. The market doesn't care how sure you sounded going in.",
    accent: "var(--orange)",
  },
  {
    num: "05",
    title: "The price on the pricing page is a real price",
    body: "Grab a pass and the button sends a real USDC payment on the same network the wallet is connected to, confirmed on-chain, receipt included. Nothing behind it says \"coming soon.\"",
    accent: "var(--gold)",
  },
];

function OnChainCard({ c, index }: { c: typeof CARDS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className="onchain-card-wrap"
    >
      <TiltCard intensity={8}>
        <SpotlightCard
          style={{
            padding: "26px 26px 24px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            height: "100%",
          }}
        >
          <motion.div
            whileHover={{ borderColor: `${c.accent}66`, boxShadow: `0 0 40px ${c.accent}18` }}
            style={{ height: "100%", borderRadius: "12px" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
              <div style={{
                width: "34px", height: "34px", borderRadius: "8px",
                background: `${c.accent}14`, border: `1px solid ${c.accent}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 800, color: c.accent, letterSpacing: "0.04em",
              }}>{c.num}</div>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: index * 0.07 + 0.3 }}
                style={{ flex: 1, height: "1px", background: `linear-gradient(to right, ${c.accent}44, transparent)`, transformOrigin: "left" }}
              />
            </div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", marginBottom: "10px", letterSpacing: "-0.02em", lineHeight: 1.3 }}>
              {c.title}
            </h3>
            <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.75 }}>
              {c.body}
            </p>
          </motion.div>
        </SpotlightCard>
      </TiltCard>
    </motion.div>
  );
}

export default function OnChain() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="on-chain" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={ref} style={{ marginBottom: "60px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "24px" }}>
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              style={{ fontSize: "11px", fontWeight: 800, color: "#b899ff", letterSpacing: "0.12em", marginBottom: "14px" }}
            >
              PAST THE COMMENTARY
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              style={{ fontSize: "clamp(30px, 4vw, 50px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--text)", maxWidth: "560px" }}
            >
              Every call leaves a receipt
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.3 }}
            style={{ color: "#b899ff", fontSize: "13px", fontWeight: 700 }}
          >
            <Link003 href="/match">See it live</Link003>
          </motion.div>
        </div>

        <div className="onchain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
          {CARDS.map((c, i) => (
            <OnChainCard key={c.num} c={c} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .onchain-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
