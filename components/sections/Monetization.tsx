"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    color: "var(--text-3)",
    features: [
      "Three live ties a day",
      "Reads on a 60-second delay",
      "Core stats panel",
      "Phone and desktop",
    ],
    cta: "Start here",
    ctaBg: "rgba(255,255,255,0.06)",
    ctaColor: "var(--text)",
    highlight: false,
  },
  {
    name: "Fan Pass",
    price: "$4",
    period: "per match",
    color: "var(--green)",
    features: [
      "Every tie, no cap",
      "Reads with no delay",
      "All three tones of voice",
      "Pings when the price drifts",
      "The full event timeline",
    ],
    cta: "Grab a pass",
    ctaBg: "var(--green)",
    ctaColor: "#000",
    highlight: true,
  },
  {
    name: "Tournament",
    price: "$29",
    period: "entire World Cup",
    color: "#7c3aed",
    features: [
      "All 104 ties, start to final",
      "Front-of-queue reads",
      "Alert rules you set yourself",
      "Replay any past match",
      "API keys (beta)",
    ],
    cta: "Take the lot",
    ctaBg: "#7c3aed",
    ctaColor: "#fff",
    highlight: false,
  },
];

const B2B = [
  { label: "Embeds for sports media", desc: "A commentary widget publishers can brand as their own" },
  { label: "API for betting sites", desc: "Plain-language context sitting next to the price feed" },
  { label: "Kit for broadcasters", desc: "On-screen cards and highlight cuts put together for you" },
];

export default function Monetization() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      id="pricing"
      style={{
        padding: "120px 24px",
        maxWidth: "1100px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ textAlign: "center", marginBottom: "60px" }}
      >
        <span style={{
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: "var(--green)",
          textTransform: "uppercase",
          display: "block",
          marginBottom: "12px",
        }}>
How it pays
        </span>
        <h2 style={{
          fontSize: "clamp(28px, 4vw, 44px)",
          fontWeight: 900,
          letterSpacing: "-0.03em",
          color: "var(--text)",
          lineHeight: 1.1,
          marginBottom: "16px",
        }}>
          Earns its keep two ways
        </h2>
        <p style={{
          fontSize: "16px",
          color: "var(--text-2)",
          maxWidth: "480px",
          margin: "0 auto",
          lineHeight: 1.6,
        }}>
          Passes bought by fans pay the rent. Licensing to other firms is where
          it grows. Both sit on the same TxLINE data nobody can fake.
        </p>
      </motion.div>

      {/* Pricing tiers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "16px",
        marginBottom: "60px",
      }}>
        {TIERS.map((tier, i) => (
          <motion.div
            key={tier.name}
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              background: tier.highlight
                ? "linear-gradient(160deg, rgba(0,232,122,0.06), rgba(0,196,255,0.04))"
                : "var(--bg-card)",
              border: `1px solid ${tier.highlight ? "rgba(0,232,122,0.25)" : "var(--border)"}`,
              borderRadius: "16px",
              padding: "28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {tier.highlight && (
              <div style={{
                position: "absolute",
                top: "14px",
                right: "14px",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: "#000",
                background: "var(--green)",
                padding: "3px 8px",
                borderRadius: "99px",
              }}>
                POPULAR
              </div>
            )}

            <p style={{ fontSize: "12px", fontWeight: 700, color: tier.color, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
              {tier.name}
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "6px" }}>
              <span style={{ fontSize: "36px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em" }}>
                {tier.price}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-3)" }}>/ {tier.period}</span>
            </div>

            <ul style={{ listStyle: "none", margin: "20px 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {tier.features.map((f) => (
                <li key={f} style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "13px", color: "var(--text-2)" }}>
                  <span style={{ color: tier.color, fontWeight: 700, flexShrink: 0 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: "9px",
                background: tier.ctaBg,
                color: tier.ctaColor,
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: "-0.01em",
                border: tier.highlight ? "none" : "1px solid var(--border)",
              } as React.CSSProperties}
            >
              {tier.cta}
            </motion.button>
          </motion.div>
        ))}
      </div>

      {/* B2B section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "32px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "32px", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 280px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#7c3aed", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>
              Enterprise & B2B
            </p>
            <h3 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)", marginBottom: "10px" }}>
              Rent the data layer
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.6 }}>
              Because TxLINE signs its records on-chain, a betting desk, a newsroom, or a broadcaster can lean on MatchMind output and know the underlying numbers hold up.
            </p>
          </div>
          <div style={{ flex: "1 1 340px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {B2B.map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: 20 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.5 + i * 0.08 }}
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  padding: "12px 16px",
                  background: "rgba(124,58,237,0.06)",
                  border: "1px solid rgba(124,58,237,0.15)",
                  borderRadius: "10px",
                }}
              >
                <span style={{ fontSize: "16px", flexShrink: 0 }}>→</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "2px" }}>{item.label}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-3)" }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
