"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { TiltCard } from "../ui/TiltCard";
import { SpotlightCard } from "../ui/BeamBorder";

const FEATURES = [
  {
    num: "01",
    title: "Price moves that come with a reason",
    body: "A goal pushes Argentina from 2.10 to 1.45. Instead of a bare number, you read a short line that says what the shift does to the rest of the night — settled, swung, or still open.",
    accent: "var(--green)",
    wide: false,
  },
  {
    num: "02",
    title: "Nothing on the calendar gets skipped",
    body: "Groups, last sixteen, the final on the far end. All 104 ties run on the same engine. Tap into anything already kicked off and the read picks up from that second.",
    accent: "#00c4ff",
    wide: false,
  },
  {
    num: "03",
    title: "Made for the phone in your hand while the TV runs",
    body: "Tight rows, quick to skim, nothing spinning. No login wall stands in front of you. The numbers refresh on their own while you keep your eyes on the broadcast.",
    accent: "var(--purple)",
    wide: true,
  },
  {
    num: "04",
    title: "Read from the side you back",
    body: "Choose the team you are pulling for and every note leans that way. A sending-off lands as relief or trouble depending on whose half of the pitch it happened in.",
    accent: "var(--orange)",
    wide: false,
  },
  {
    num: "05",
    title: "Roughly a second and a half, event to text",
    body: "Groq turns the moment around quick enough that the line shows up before the replay finishes rolling. The read is waiting while the goal is still fresh in the room.",
    accent: "var(--gold)",
    wide: false,
  },
];

function FeatureCard({ f, index }: { f: typeof FEATURES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.16, 1, 0.3, 1] }}
      style={{ gridColumn: f.wide ? "span 2" : "span 1" }}
      className="feature-card-wrap"
    >
      <TiltCard intensity={8}>
        <SpotlightCard
          style={{
            padding: "28px 28px 26px",
            borderRadius: "14px",
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            height: "100%",
            transition: "border-color 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          <motion.div
            whileHover={{ borderColor: `${f.accent}66`, boxShadow: `0 0 40px ${f.accent}18` }}
            style={{ height: "100%", borderRadius: "12px" }}
          >
            {/* Number badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}>
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                background: `${f.accent}14`,
                border: `1px solid ${f.accent}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 800,
                color: f.accent,
                letterSpacing: "0.04em",
              }}>{f.num}</div>

              {/* Animated line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.8, delay: index * 0.07 + 0.3 }}
                style={{
                  flex: 1,
                  height: "1px",
                  background: `linear-gradient(to right, ${f.accent}44, transparent)`,
                  transformOrigin: "left",
                }}
              />
            </div>

            <h3 style={{
              fontSize: f.wide ? "18px" : "15px",
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: "10px",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
            }}>
              {f.title}
            </h3>

            <p style={{
              fontSize: "13px",
              color: "var(--text-2)",
              lineHeight: 1.75,
              maxWidth: f.wide ? "560px" : undefined,
            }}>
              {f.body}
            </p>
          </motion.div>
        </SpotlightCard>
      </TiltCard>
    </motion.div>
  );
}

export default function Features() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <section id="features" style={{ padding: "120px 24px" }}>
      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div ref={ref} style={{ marginBottom: "60px" }}>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            style={{ fontSize: "11px", fontWeight: 800, color: "var(--green)", letterSpacing: "0.12em", marginBottom: "14px" }}
          >
WHAT YOU GET
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1 }}
            style={{
              fontSize: "clamp(30px, 4vw, 50px)",
              fontWeight: 900,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              color: "var(--text)",
              maxWidth: "480px",
            }}
          >
A scoreboard that talks back
          </motion.h2>
        </div>

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "12px",
          }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.num} f={f} index={i} />
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .features-grid { grid-template-columns: 1fr !important; }
          .feature-card-wrap { grid-column: span 1 !important; }
        }
      `}</style>
    </section>
  );
}
