"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { MagneticButton } from "../ui/MagneticButton";
import { AuroraBackground } from "../ui/AuroraBackground";

export default function CTA() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [burst, setBurst] = useState(false);

  function handleCTAClick() {
    setBurst(true);
    setTimeout(() => setBurst(false), 600);
  }

  return (
    <section style={{ padding: "140px 24px", position: "relative", overflow: "hidden" }}>
      <AuroraBackground />

      {/* Radial glow */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        width: "800px",
        height: "400px",
        background: "radial-gradient(ellipse, var(--green)08 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div
        ref={ref}
        style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}
      >
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.94 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Live badge */}
          <motion.div
            animate={{ borderColor: ["var(--green)44", "var(--green)88", "var(--green)44"] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            style={{
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
            }}
          >
            <span className="live-dot" />
Ties in play this minute
          </motion.div>

          <h2 style={{
            fontSize: "clamp(34px, 5vw, 62px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.05,
            color: "var(--text)",
            marginBottom: "20px",
          }}>
            Pull up a match.
            <br />
            <span style={{
              background: "linear-gradient(135deg, var(--green) 0%, #00c4ff 50%, var(--purple) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Notice what slipped past you.
            </span>
          </h2>

          <p style={{
            fontSize: "16px",
            color: "var(--text-2)",
            lineHeight: 1.7,
            marginBottom: "40px",
            maxWidth: "480px",
            margin: "0 auto 40px",
          }}>
No account. No card. Tap a tie that is already underway and follow it from the very first whistle.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "48px" }}>
            <MagneticButton href="/match" onClick={handleCTAClick} strength={0.3}>
              <motion.span
                animate={burst ? { scale: [1, 1.08, 1] } : {}}
                transition={{ duration: 0.4 }}
                whileHover={{ boxShadow: "0 0 80px var(--green-glow)" }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 36px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#000",
                  background: "var(--green)",
                  textDecoration: "none",
                  transition: "box-shadow 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Shimmer sweep on hover */}
                <motion.div
                  whileHover={{ x: ["−100%", "200%"] }}
                  transition={{ duration: 0.6 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    transform: "translateX(-100%)",
                  }}
                />
                <span className="live-dot" style={{ background: "#000" }} />
                Pull up a live tie
              </motion.span>
            </MagneticButton>

            <MagneticButton href="https://github.com/bryankwandou/matchmind" strength={0.3}>
              <motion.span
                whileHover={{ borderColor: "var(--border-2)", color: "var(--text)" }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 28px",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-2)",
                  border: "1px solid var(--border)",
                  background: "transparent",
                  textDecoration: "none",
                  transition: "border-color 0.2s, color 0.2s",
                }}
              >
                View source
              </motion.span>
            </MagneticButton>
          </div>

          {/* Tech stack */}
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
            {["TxLINE", "AI Commentary", "Next.js 16", "Solana", "Vercel"].map((tech, i) => (
              <motion.span
                key={tech}
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.6 + i * 0.06 }}
                style={{
                  padding: "5px 12px",
                  borderRadius: "6px",
                  border: "1px solid var(--border)",
                  fontSize: "11px",
                  color: "var(--text-3)",
                  background: "var(--bg-card)",
                }}
              >
                {tech}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
