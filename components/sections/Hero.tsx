"use client";

import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { AuroraBackground, SpotlightGrid } from "../ui/AuroraBackground";
import { ParticleField } from "../ui/AnimatedBackground";
import { MagneticButton } from "../ui/MagneticButton";
import { Globe3D, RadarRings } from "../ui/Sphere3D";
import { WordFadeIn } from "../ui/TextAnimations";

const EVENTS = [
  { type: "GOAL", team: "ARG", player: "L. Messi", minute: 34, score: "1 — 0", oddsShift: "2.10 → 1.45", color: "var(--green)" },
  { type: "RED CARD", team: "FRA", player: "Tchouameni", minute: 52, score: "1 — 0", oddsShift: "draw 3.40 → 5.20", color: "var(--orange)" },
  { type: "GOAL", team: "ESP", player: "L. Yamal", minute: 67, score: "2 — 1", oddsShift: "1.80 → 1.22", color: "var(--green)" },
  { type: "GOAL", team: "BRA", player: "Vinicius Jr", minute: 88, score: "2 — 1", oddsShift: "1.55 → 1.10", color: "var(--green)" },
  { type: "PENALTY", team: "GER", player: "T. Müller", minute: 73, score: "1 — 1", oddsShift: "draw 3.20 → 2.80", color: "#f5c842" },
];

const AI_LINES = [
  "Messi's second tonight. Argentina dropped from 2.10 to 1.45 — the market has essentially settled this.",
  "Ten men and 38 minutes left. France's draw odds lengthened from 3.40 to 5.20 immediately after.",
  "Yamal's second in 23 minutes. Spain's win odds compressed to 1.22. The books have stopped arguing.",
  "Vinicius in the 88th. Market barely had time to react — Brazil held at 1.55 all half, now at 1.10.",
  "Penalty converted. Germany's draw odds tighten. The shape of this game just changed entirely.",
];

function EventCard({ event, ai, visible }: {
  event: typeof EVENTS[0];
  ai: string;
  visible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -20, scale: 0.96 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "rgba(17,17,17,0.92)",
        border: `1px solid ${event.color}33`,
        borderRadius: "16px",
        padding: "20px 22px",
        backdropFilter: "blur(20px)",
        boxShadow: `0 0 40px ${event.color}18, 0 24px 60px rgba(0,0,0,0.5)`,
        width: "100%",
        maxWidth: "360px",
      }}
    >
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          style={{
            padding: "4px 10px",
            borderRadius: "6px",
            background: `${event.color}18`,
            border: `1px solid ${event.color}44`,
            fontSize: "10px",
            fontWeight: 800,
            color: event.color,
            letterSpacing: "0.1em",
          }}
        >
          {event.type}
        </motion.div>
        <span style={{ fontSize: "12px", color: "var(--text-3)" }}>{event.minute}&apos;</span>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
          <span className="live-dot" style={{ width: "6px", height: "6px" }} />
          <span style={{ fontSize: "11px", color: "var(--text-3)", letterSpacing: "0.06em" }}>LIVE</span>
        </div>
      </div>

      {/* Score */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
        <div>
          <p style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
            {event.player}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>{event.team}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: "22px", fontWeight: 900, fontVariantNumeric: "tabular-nums", color: event.color }}>
            {event.score}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>odds: {event.oddsShift}</p>
        </div>
      </div>

      {/* AI response */}
      <div style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "14px",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "26px",
          height: "26px",
          borderRadius: "7px",
          background: "linear-gradient(135deg, var(--green) 0%, #00c4ff 100%)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 900,
          color: "#000",
          marginTop: "1px",
          boxShadow: "0 0 12px var(--green-glow)",
        }}>M</div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.65 }}
        >
          {ai}
        </motion.p>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.94]);

  // Cycle events
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIdx((prev) => (prev + 1) % EVENTS.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const event = EVENTS[activeIdx];

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: "100px 24px 80px",
      }}
    >
      <AuroraBackground />
      <SpotlightGrid />
      <ParticleField />

      <motion.div
        style={{
          y, opacity, scale,
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
        }}
      >
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "center",
        }}
          className="hero-grid"
        >
          {/* LEFT — text */}
          <div>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{ marginBottom: "28px" }}
            >
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                borderRadius: "100px",
                border: "1px solid var(--border-2)",
                background: "rgba(0,232,122,0.04)",
                fontSize: "12px",
                color: "var(--text-3)",
              }}>
                <span className="live-dot" />
                <span>104 fixtures · TxLINE feed · World Cup 2026</span>
              </div>
            </motion.div>

            {/* Headline */}
            <h1 style={{
              fontSize: "clamp(40px, 5.5vw, 76px)",
              fontWeight: 900,
              lineHeight: 1.0,
              letterSpacing: "-0.04em",
              marginBottom: "20px",
            }}>
              <WordFadeIn text="The match," delay={0.15} style={{ display: "block", color: "var(--text)" }} />
              <span style={{ display: "block" }}>
                <motion.span
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4 }}
                  style={{
                    background: "linear-gradient(135deg, var(--green) 0%, #00c4ff 50%, var(--purple) 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  read out loud.
                </motion.span>
              </span>
            </h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              style={{
                fontSize: "17px",
                color: "var(--text-2)",
                lineHeight: 1.7,
                marginBottom: "36px",
                maxWidth: "480px",
              }}
            >
              MatchMind watches the TxLINE feed for every World Cup game. A goal drops, a player walks, the price swings — and you get a plain sentence explaining what it means while the moment is still on screen.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px" }}
            >
              <MagneticButton href="#live-matches">
                <motion.span
                  whileHover={{ boxShadow: "0 0 60px var(--green-glow)" }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 28px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 700,
                    color: "#000",
                    background: "var(--green)",
                    letterSpacing: "-0.01em",
                    textDecoration: "none",
                    transition: "box-shadow 0.3s ease",
                  }}
                >
                  <span className="live-dot" style={{ background: "#000" }} />
                  Open a match
                </motion.span>
              </MagneticButton>

              <MagneticButton href="#how-it-works">
                <motion.span
                  whileHover={{ borderColor: "var(--border-2)", color: "var(--text)" }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "14px 24px",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-2)",
                    border: "1px solid var(--border)",
                    background: "transparent",
                    textDecoration: "none",
                    transition: "border-color 0.2s, color 0.2s",
                  }}
                >
                  How it works
                </motion.span>
              </MagneticButton>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              style={{ display: "flex", gap: "32px" }}
            >
              {[
                { num: "104", label: "matches" },
                { num: "<2s", label: "AI response" },
                { num: "50+", label: "bookmakers" },
              ].map(({ num, label }) => (
                <div key={label}>
                  <p style={{ fontSize: "22px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.03em" }}>{num}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>{label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* RIGHT — live card + globe */}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: "0" }}>
            {/* Globe 3D */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{ position: "relative", marginBottom: "-60px" }}
            >
              <Globe3D size={240} />
              <RadarRings color="var(--green)" />
            </motion.div>

            {/* Event card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              style={{ width: "100%", maxWidth: "380px", position: "relative", zIndex: 2 }}
            >
              <EventCard event={event} ai={AI_LINES[activeIdx]} visible={visible} />
            </motion.div>

            {/* Dot indicators */}
            <div style={{ display: "flex", gap: "6px", marginTop: "16px", justifyContent: "center" }}>
              {EVENTS.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => { setVisible(false); setTimeout(() => { setActiveIdx(i); setVisible(true); }, 300); }}
                  animate={{ width: i === activeIdx ? 20 : 6, background: i === activeIdx ? "var(--green)" : "var(--border-2)" }}
                  transition={{ duration: 0.3 }}
                  style={{ height: "6px", borderRadius: "3px", border: "none", cursor: "pointer", padding: 0 }}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "180px",
        background: "linear-gradient(to bottom, transparent, var(--bg))",
        pointerEvents: "none",
      }} />

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
