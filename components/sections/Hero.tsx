"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ParticleField, GlowOrb } from "../ui/AnimatedBackground";

const LIVE_EVENTS = [
  { team: "ARG", player: "Messi", type: "GOAL", minute: 34, score: "1-0" },
  { team: "ESP", player: "Yamal", type: "GOAL", minute: 67, score: "2-1" },
  { team: "FRA", player: "Tchouameni", type: "RED CARD", minute: 52, score: "0-1" },
  { team: "BRA", player: "Vinicius Jr", type: "GOAL", minute: 88, score: "2-1" },
  { team: "GER", player: "Müller", type: "GOAL", minute: 12, score: "1-0" },
];

const AI_RESPONSES = [
  "Argentina's market moved hard after this — from 2.10 down to 1.45. With Messi in this form, the books have all but settled the result.",
  "Yamal's second goal in 23 minutes. Spain's odds to win dropped from 1.80 to 1.22. At this point the market's just pricing in time.",
  "Ten men for 38 minutes. France's draw odds lengthened from 3.40 to 5.20. Their defensive shape will determine everything from here.",
  "Vinicius with the winner in the 88th. Market barely had time to react — Brazil held at 1.55 all half, now settled at 1.10.",
  "Early goal from Germany. Their pre-match odds were 2.30 and the market has tightened to 1.62 already.",
];

function LiveCard({ event, response, isVisible }: {
  event: typeof LIVE_EVENTS[0];
  response: string;
  isVisible: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40, rotateY: -15 }}
      animate={isVisible ? { opacity: 1, x: 0, rotateY: 0 } : { opacity: 0, x: 40, rotateY: -15 }}
      exit={{ opacity: 0, x: -40, rotateY: 15 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-2)",
        borderRadius: "16px",
        padding: "20px 24px",
        maxWidth: "380px",
        width: "100%",
      }}
    >
      {/* Event header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
        <div style={{
          padding: "4px 10px",
          borderRadius: "6px",
          background: event.type === "GOAL" ? "var(--green-dim)" : "var(--orange-dim)",
          color: event.type === "GOAL" ? "var(--green)" : "var(--orange)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.08em",
        }}>
          {event.type}
        </div>
        <span style={{ fontSize: "13px", color: "var(--text-2)" }}>{event.minute}&apos;</span>
        <span style={{ fontSize: "13px", color: "var(--text-2)", marginLeft: "auto" }}>
          Score: <strong style={{ color: "var(--text)" }}>{event.score}</strong>
        </span>
      </div>

      {/* Player */}
      <p style={{ fontSize: "18px", fontWeight: 700, marginBottom: "14px", letterSpacing: "-0.02em" }}>
        {event.player}
        <span style={{ color: "var(--text-3)", fontWeight: 400, fontSize: "14px" }}> · {event.team}</span>
      </p>

      {/* AI response */}
      <div style={{
        borderTop: "1px solid var(--border)",
        paddingTop: "14px",
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
      }}>
        <div style={{
          width: "24px",
          height: "24px",
          borderRadius: "6px",
          background: "linear-gradient(135deg, var(--green), #00c4ff)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "11px",
          fontWeight: 900,
          color: "#000",
          marginTop: "2px",
        }}>M</div>
        <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-2)" }}>
          {response}
        </p>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % LIVE_EVENTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      ref={ref}
      style={{
        position: "relative",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        paddingTop: "80px",
        paddingBottom: "80px",
      }}
    >
      {/* Background layers */}
      <ParticleField />
      <GlowOrb color="#00e87a" size={600} x="20%" y="30%" opacity={0.08} />
      <GlowOrb color="#7c3aed" size={500} x="80%" y="60%" opacity={0.08} />
      <GlowOrb color="#00c4ff" size={400} x="60%" y="20%" opacity={0.06} />

      {/* Dot grid */}
      <div className="dot-bg" style={{
        position: "absolute",
        inset: 0,
        opacity: 0.3,
        pointerEvents: "none",
      }} />

      <motion.div
        style={{ y, opacity, position: "relative", zIndex: 10, width: "100%", maxWidth: "1200px", padding: "0 24px" }}
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}
        >
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "7px 16px",
            borderRadius: "100px",
            border: "1px solid var(--border-2)",
            background: "rgba(255,255,255,0.03)",
            fontSize: "12px",
            color: "var(--text-2)",
          }}>
            <span className="live-dot" />
            <span>104 World Cup matches · TxLINE live data</span>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: "center", marginBottom: "24px" }}
        >
          <h1 style={{
            fontSize: "clamp(42px, 7vw, 88px)",
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: "-0.04em",
            color: "var(--text)",
            marginBottom: "16px",
          }}>
            Your match,
            <br />
            <span className="gradient-text">explained live.</span>
          </h1>
          <p style={{
            fontSize: "clamp(16px, 2vw, 20px)",
            color: "var(--text-2)",
            maxWidth: "560px",
            margin: "0 auto",
            lineHeight: 1.6,
            fontWeight: 400,
          }}>
            MatchMind reads TxLINE data during every World Cup game — goals, red cards, odds shifts — and tells you what they mean in plain language, as they happen.
          </p>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginBottom: "72px",
          }}
        >
          <motion.a
            href="#live-matches"
            whileHover={{ scale: 1.04, boxShadow: "0 0 40px var(--green-glow)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              color: "#000",
              background: "var(--green)",
              letterSpacing: "-0.01em",
            }}
          >
            Open a live match
          </motion.a>
          <motion.a
            href="#how-it-works"
            whileHover={{ scale: 1.04, borderColor: "var(--border-2)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "14px 28px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
              color: "var(--text-2)",
              border: "1px solid var(--border)",
              background: "transparent",
              letterSpacing: "-0.01em",
              transition: "border-color 0.2s",
            }}
          >
            See how it works
          </motion.a>
        </motion.div>

        {/* Live demo card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", justifyContent: "center" }}
        >
          <div style={{ position: "relative" }}>
            {/* Glow ring */}
            <div style={{
              position: "absolute",
              inset: "-1px",
              borderRadius: "17px",
              background: "linear-gradient(135deg, var(--green)44, var(--purple)44)",
              zIndex: -1,
              filter: "blur(1px)",
            }} />
            <LiveCard
              event={LIVE_EVENTS[activeIndex]}
              response={AI_RESPONSES[activeIndex]}
              isVisible
            />
          </div>
        </motion.div>

        {/* Event indicator dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginTop: "20px",
        }}>
          {LIVE_EVENTS.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setActiveIndex(i)}
              animate={{ width: i === activeIndex ? 20 : 6 }}
              transition={{ duration: 0.3 }}
              style={{
                height: "6px",
                borderRadius: "3px",
                background: i === activeIndex ? "var(--green)" : "var(--border-2)",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Bottom fade */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "200px",
        background: "linear-gradient(to bottom, transparent, var(--bg))",
        pointerEvents: "none",
      }} />
    </section>
  );
}
