"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    number: "01",
    title: "Pick your team and style",
    body: "Select the team you support and how you want the analysis delivered — calm and data-heavy, or fast and conversational. MatchMind adjusts its language accordingly.",
    detail: "Supports 12 languages · 3 commentary styles",
  },
  {
    number: "02",
    title: "Connect to the live feed",
    body: "TxLINE streams live match data — scores, events, odds from 50+ bookmakers — directly into MatchMind. No refresh needed. The feed updates every 10 seconds.",
    detail: "104 matches · Live odds · Full event log",
  },
  {
    number: "03",
    title: "Events trigger analysis",
    body: "Every significant moment — a goal, a red card, a 0.3-point odds movement — triggers Groq AI to produce a brief analysis. You see it within 2 seconds of the event.",
    detail: "Groq inference · Sub-2s response · No lag",
  },
  {
    number: "04",
    title: "Follow the match your way",
    body: "Scroll back through the event log at any point, or watch the analysis stream live. Each entry links to the odds snapshot at that moment.",
    detail: "Full match history · Odds timeline · Shareable clips",
  },
];

function StepCard({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: "36px 28px",
        background: "var(--bg-card)",
        borderRadius: isFirst ? "12px 0 0 12px" : isLast ? "0 12px 12px 0" : "0",
        border: "1px solid var(--border)",
        marginLeft: index > 0 ? "-1px" : 0,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top gradient line */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 0.6, delay: index * 0.12 + 0.3 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, var(--green), var(--purple))",
          transformOrigin: "left",
        }}
      />

      {/* Background step number */}
      <div style={{
        position: "absolute",
        top: "16px",
        right: "20px",
        fontSize: "64px",
        fontWeight: 900,
        color: "var(--border)",
        lineHeight: 1,
        fontVariantNumeric: "tabular-nums",
        userSelect: "none",
        pointerEvents: "none",
      }}>
        {step.number}
      </div>

      <p style={{
        fontSize: "11px",
        fontWeight: 800,
        color: "var(--green)",
        letterSpacing: "0.1em",
        marginBottom: "20px",
        marginTop: "8px",
      }}>
        STEP {step.number}
      </p>

      <h3 style={{
        fontSize: "16px",
        fontWeight: 700,
        color: "var(--text)",
        marginBottom: "12px",
        letterSpacing: "-0.02em",
        lineHeight: 1.3,
      }}>
        {step.title}
      </h3>

      <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.7, marginBottom: "20px" }}>
        {step.body}
      </p>

      <p style={{
        fontSize: "11px",
        color: "var(--text-3)",
        borderTop: "1px solid var(--border)",
        paddingTop: "14px",
      }}>
        {step.detail}
      </p>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section
      id="how-it-works"
      style={{
        padding: "120px 24px",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg-2)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.3, pointerEvents: "none" }} />

      <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div ref={ref} style={{ textAlign: "center", marginBottom: "80px" }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em", marginBottom: "16px" }}
          >
            HOW IT WORKS
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
              color: "var(--text)",
            }}
          >
            Four steps, one match
          </motion.h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "0",
        }}>
          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #how-it-works .steps-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          #how-it-works .steps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}
