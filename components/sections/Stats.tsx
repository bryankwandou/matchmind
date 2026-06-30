"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AnimatedNumber } from "../ui/TextAnimations";
import { TiltCard } from "../ui/TiltCard";

const STATS = [
  { value: 104, suffix: "", label: "World Cup ties", sub: "Groups all the way to the final", accent: "var(--green)" },
  { value: 2, suffix: "s", label: "Typical turnaround", sub: "TxLINE moment to your screen", accent: "#00c4ff" },
  { value: 50, suffix: "+", label: "Books in the panel", sub: "Blended pricing through TxLINE", accent: "var(--purple)" },
  { value: 12, suffix: "", label: "Languages", sub: "Chosen as the match kicks off", accent: "var(--orange)" },
];

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-2)",
      padding: "72px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Glow spot */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "600px",
        height: "200px",
        background: "radial-gradient(ellipse, var(--green-dim) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto", position: "relative" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0" }}
          className="stats-grid"
        >
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <TiltCard intensity={6}>
                <div style={{
                  padding: "40px 28px",
                  borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
                  textAlign: "center",
                  height: "100%",
                }}>
                  {/* Accent dot */}
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.4 }}
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: stat.accent,
                      margin: "0 auto 16px",
                      boxShadow: `0 0 10px ${stat.accent}`,
                    }}
                  />

                  <div style={{
                    fontSize: "clamp(40px, 4vw, 60px)",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    color: stat.accent,
                    marginBottom: "8px",
                    fontVariantNumeric: "tabular-nums",
                    textShadow: `0 0 40px ${stat.accent}44`,
                  }}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </div>

                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "5px" }}>
                    {stat.label}
                  </p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", lineHeight: 1.5 }}>
                    {stat.sub}
                  </p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .stats-grid > div > div > div { border-right: 1px solid var(--border) !important; border-bottom: 1px solid var(--border) !important; }
        }
      `}</style>
    </section>
  );
}
