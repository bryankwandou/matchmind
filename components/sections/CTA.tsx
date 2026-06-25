"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { GlowOrb } from "../ui/AnimatedBackground";

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section style={{ padding: "140px 24px", position: "relative", overflow: "hidden" }}>
      <GlowOrb color="#00e87a" size={700} x="50%" y="50%" opacity={0.07} />
      <GlowOrb color="#7c3aed" size={400} x="80%" y="30%" opacity={0.06} />

      <div ref={ref} style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Live badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 16px",
            borderRadius: "100px",
            border: "1px solid var(--green)44",
            background: "var(--green-dim)",
            fontSize: "12px",
            color: "var(--green)",
            fontWeight: 600,
            marginBottom: "32px",
          }}>
            <span className="live-dot" />
            Matches running now
          </div>

          <h2 style={{
            fontSize: "clamp(36px, 5vw, 64px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--text)",
            marginBottom: "20px",
          }}>
            Open the first match.<br />
            <span className="gradient-text">See what you have been missing.</span>
          </h2>

          <p style={{
            fontSize: "16px",
            color: "var(--text-2)",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "500px",
            margin: "0 auto 40px",
          }}>
            No account required. No payment. Pick a match that is running right now and watch MatchMind work through it.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <motion.a
              href="/match"
              whileHover={{ scale: 1.05, boxShadow: "0 0 60px var(--green-glow)" }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "16px 36px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 700,
                textDecoration: "none",
                color: "#000",
                background: "var(--green)",
                letterSpacing: "-0.01em",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="live-dot" style={{ width: "7px", height: "7px" }} />
              Open a live match
            </motion.a>

            <motion.a
              href="https://github.com/nayrbryanGaming/matchmind"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "16px 28px",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                textDecoration: "none",
                color: "var(--text-2)",
                border: "1px solid var(--border-2)",
                background: "transparent",
                letterSpacing: "-0.01em",
              }}
            >
              View source
            </motion.a>
          </div>

          {/* Tech stack badges */}
          <div style={{
            display: "flex",
            gap: "8px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "48px",
          }}>
            {["TxLINE", "Groq AI", "Next.js 15", "Solana", "Vercel"].map((tech) => (
              <span key={tech} style={{
                padding: "5px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "11px",
                color: "var(--text-3)",
                background: "var(--bg-card)",
              }}>
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
