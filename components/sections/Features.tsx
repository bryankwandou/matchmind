"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const FEATURES = [
  {
    icon: "01",
    title: "Odds explained, not just displayed",
    body: "When Argentina drops from 2.10 to 1.45 after a goal, MatchMind tells you what that shift means for the game — not just that it happened.",
    color: "var(--green)",
  },
  {
    icon: "02",
    title: "104 games, no match left unread",
    body: "Group stage to final. Every match in the schedule gets the same treatment — live event tracking and AI analysis from kickoff to the final whistle.",
    color: "#00c4ff",
  },
  {
    icon: "03",
    title: "Pick your team, get their angle",
    body: "Set your team and MatchMind frames every analysis from your side. A red card means something different depending on which bench you're sitting on.",
    color: "var(--purple)",
  },
  {
    icon: "04",
    title: "Under two seconds to your screen",
    body: "Groq's inference runs fast enough that the analysis reaches you before the broadcast replay does. The commentary is there when you need it.",
    color: "var(--orange)",
  },
  {
    icon: "05",
    title: "No account required to watch",
    body: "Open a match, start reading. No sign-up gate on the core experience. Connect a Solana wallet if you want to save preferences or unlock more depth.",
    color: "var(--gold)",
  },
  {
    icon: "06",
    title: "Built for the second screen",
    body: "Designed for your phone while the game is on the TV. Dense information, fast to scan, nothing in the way of the match.",
    color: "var(--green)",
  },
];

function FeatureCard({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6, borderColor: "var(--border-2)" }}
      style={{
        padding: "28px",
        borderRadius: "14px",
        border: "1px solid var(--border)",
        background: "var(--bg-card)",
        cursor: "default",
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${feature.color}18`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{
        width: "36px",
        height: "36px",
        borderRadius: "8px",
        background: `${feature.color}18`,
        border: `1px solid ${feature.color}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: 800,
        color: feature.color,
        letterSpacing: "0.04em",
        marginBottom: "20px",
      }}>
        {feature.icon}
      </div>

      <h3 style={{
        fontSize: "15px",
        fontWeight: 700,
        color: "var(--text)",
        marginBottom: "10px",
        letterSpacing: "-0.02em",
        lineHeight: 1.3,
      }}>
        {feature.title}
      </h3>

      <p style={{
        fontSize: "13px",
        color: "var(--text-2)",
        lineHeight: 1.7,
      }}>
        {feature.body}
      </p>
    </motion.div>
  );
}

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="features" style={{ padding: "120px 24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div ref={ref} style={{ textAlign: "center", marginBottom: "64px" }}>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5 }}
          style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em", marginBottom: "16px" }}
        >
          WHAT IT DOES
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            fontSize: "clamp(32px, 4vw, 52px)",
            fontWeight: 900,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            color: "var(--text)",
            maxWidth: "600px",
            margin: "0 auto",
          }}
        >
          More than a scoreboard
        </motion.h2>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "16px",
      }}>
        {FEATURES.map((f, i) => (
          <FeatureCard key={f.icon} feature={f} index={i} />
        ))}
      </div>
    </section>
  );
}
