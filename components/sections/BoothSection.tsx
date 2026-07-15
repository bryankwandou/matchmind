"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TiltCard } from "../ui/TiltCard";
import { SpotlightCard } from "../ui/BeamBorder";
import { BOOTH, type Agent } from "@/lib/booth";

// Sample lines so each agent's voice is audible before a visitor ever
// opens a match. Static copy, same grounding rules as the live product.
const SAMPLES: Record<string, string> = {
  scout: "Red card in the 52nd. Ten men, 38 minutes to hold. The shape of this game just changed.",
  chalk: "Argentina 2.10 into 1.45 inside a minute. The books have stopped arguing about tonight.",
  roastmaster: "You called the draw at 3.30 and cashed it. Even a broken clock gets a night like this.",
};

function AgentCard({ ag, index }: { ag: Agent; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.09, ease: [0.16, 1, 0.3, 1] }}
    >
      <TiltCard intensity={8}>
        <SpotlightCard style={{
          padding: "26px", borderRadius: "14px",
          border: "1px solid var(--border)", background: "var(--bg-card)", height: "100%",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            {/* Crest avatar */}
            <div style={{
              width: "44px", height: "48px",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: `color-mix(in srgb, ${ag.color} 18%, var(--bg-3))`,
              border: `1px solid color-mix(in srgb, ${ag.color} 50%, transparent)`,
              clipPath: "polygon(50% 0, 100% 22%, 100% 72%, 50% 100%, 0 72%, 0 22%)",
              fontSize: "16px", fontWeight: 900, color: ag.color,
              boxShadow: `0 0 24px color-mix(in srgb, ${ag.color} 25%, transparent)`,
            }}>{ag.initial}</div>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>{ag.name}</h3>
              <p style={{ fontSize: "11px", color: "var(--text-3)" }}>{ag.beat}</p>
            </div>
            <span style={{
              marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: "4px",
              fontSize: "9px", fontWeight: 800, color: ag.color, letterSpacing: "0.08em",
            }}>
              <span className="live-dot" style={{ width: "5px", height: "5px", background: ag.color }} />
              ON AIR
            </span>
          </div>
          {/* Sample line, styled like a live bubble */}
          <div style={{
            padding: "12px 14px", borderRadius: "9px",
            background: "var(--bg-3)", border: "1px solid var(--border)",
            borderLeft: `3px solid ${ag.color}`,
          }}>
            <p style={{ fontSize: "12.5px", color: "var(--text-2)", lineHeight: 1.65 }}>{SAMPLES[ag.id]}</p>
          </div>
        </SpotlightCard>
      </TiltCard>
    </motion.div>
  );
}

export default function BoothSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="booth" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={ref} style={{ marginBottom: "56px" }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            style={{ fontSize: "11px", fontWeight: 800, color: "#00c4ff", letterSpacing: "0.12em", marginBottom: "14px" }}
          >
            THE BOOTH
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            style={{ fontSize: "clamp(30px, 4vw, 50px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, color: "var(--text)", maxWidth: "620px" }}
          >
            Three voices call your match
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
            style={{ fontSize: "14px", color: "var(--text-2)", marginTop: "14px", maxWidth: "540px", lineHeight: 1.7 }}
          >
            Not one anonymous feed — a booth. Scout watches the pitch, The Chalk watches
            the price, and when your call settles, Roastmaster has the last word. Same
            rule for all three: they only speak to what the TxLINE feed confirms.
          </motion.p>
        </div>

        <div className="booth-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {Object.values(BOOTH).map((ag, i) => (
            <AgentCard key={ag.id} ag={ag} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
