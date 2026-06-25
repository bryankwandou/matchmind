"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect } from "react";

const STATS = [
  { value: 104, suffix: "", label: "World Cup matches covered", sub: "Group stage through final" },
  { value: 2, suffix: "s", label: "Average AI response time", sub: "Groq inference, not polling" },
  { value: 50, suffix: "+", label: "Bookmakers in the odds feed", sub: "Consensus pricing via TxLINE" },
  { value: 12, suffix: "", label: "Languages supported", sub: "Pick yours at match start" },
];

function CountUpNumber({ target, suffix, inView }: { target: number; suffix: string; inView: boolean }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, target, { duration: 1.8, ease: "easeOut" });
    rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(v) + suffix;
    });
    return controls.stop;
  }, [inView, target, suffix, motionVal, rounded]);

  return <span ref={ref}>0{suffix}</span>;
}

export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section style={{
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-2)",
      padding: "80px 24px",
    }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "0",
        }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                padding: "40px 32px",
                borderRight: i < STATS.length - 1 ? "1px solid var(--border)" : "none",
                textAlign: "center",
              }}
            >
              <div style={{
                fontSize: "clamp(36px, 4vw, 56px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                color: "var(--green)",
                marginBottom: "8px",
                fontVariantNumeric: "tabular-nums",
              }}>
                <CountUpNumber target={stat.value} suffix={stat.suffix} inView={inView} />
              </div>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                {stat.label}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-3)" }}>
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          section > div > div { grid-template-columns: 1fr 1fr !important; }
          section > div > div > div { border-right: 1px solid var(--border) !important; border-bottom: 1px solid var(--border) !important; }
        }
      `}</style>
    </section>
  );
}
