"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { TiltCard } from "../ui/TiltCard";
import { DrawLine } from "../ui/BeamBorder";

type Message = {
  type: "event" | "ai";
  text: string;
  score?: string;
  odds?: string;
};

const DEMO_THREAD: (Message & { delay: number })[] = [
  { type: "event", text: "GOAL — Messi · Argentina · 34'", score: "ARG 1–0 FRA", odds: "ARG 2.10 → 1.45", delay: 0 },
  { type: "ai", text: "Argentina's market moved hard — from 2.10 down to 1.45. The books are treating this as near-decisive. France would need two without reply, and the odds say the market does not think that is likely.", delay: 900 },
  { type: "event", text: "RED CARD — Tchouameni · France · 52'", score: "ARG 1–0 FRA", odds: "draw 3.40 → 5.20", delay: 2400 },
  { type: "ai", text: "Ten men for 38 minutes. France's draw odds lengthened from 3.40 to 5.20 straight away. Argentina's defensive shape should be enough — expect a lower block and time-wasting from here.", delay: 3400 },
  { type: "event", text: "GOAL — Di Maria · Argentina · 71'", score: "ARG 2–0 FRA", odds: "ARG 1.45 → 1.08", delay: 5400 },
  { type: "ai", text: "At 1.08, the books have called the match. No realistic path for France with nine men and 19 minutes left. The market is pricing in the formality now.", delay: 6300 },
];

function ChatBubble({ msg, index }: { msg: Message; index: number }) {
  const isEvent = msg.type === "event";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginBottom: "10px" }}
    >
      {isEvent ? (
        <div style={{
          padding: "10px 14px",
          borderRadius: "8px",
          background: "var(--green-dim)",
          border: "1px solid var(--green)33",
        }}>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", marginBottom: "4px" }}>
            {msg.text}
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <span style={{ fontSize: "11px", color: "var(--text-2)" }}>{msg.score}</span>
            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{msg.odds}</span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "7px",
              background: "linear-gradient(135deg, var(--green), #00c4ff)",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: 900,
              color: "#000",
              boxShadow: "0 0 10px var(--green-glow)",
            }}
          >M</motion.div>
          <div style={{
            padding: "10px 14px",
            borderRadius: "8px",
            background: "var(--bg-3)",
            border: "1px solid var(--border)",
            flex: 1,
          }}>
            <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.65 }}>{msg.text}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function AIDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [started, setStarted] = useState(false);

  function startReplay() {
    setMessages([]);
    setStarted(true);
    DEMO_THREAD.forEach((item) => {
      setTimeout(() => {
        const { delay: _d, ...msg } = item;
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => {
          if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 50);
      }, item.delay);
    });
  }

  useEffect(() => {
    if (inView && !started) startReplay();
  }, [inView]);

  return (
    <section id="live-matches" style={{ padding: "120px 24px" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto" }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}
          className="demo-grid"
        >
          {/* Left text */}
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              style={{ fontSize: "11px", fontWeight: 800, color: "var(--green)", letterSpacing: "0.12em", marginBottom: "14px" }}
            >
              LIVE DEMO
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: "clamp(28px, 3.5vw, 44px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "var(--text)",
                marginBottom: "18px",
              }}
            >
See it run a whole half
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.75, marginBottom: "28px" }}
            >
Argentina against France, a quarter-final played back. Each TxLINE moment pulled a written read inside a couple of seconds. What you are looking at is the same thing you would see sitting with a match in real time.
            </motion.p>

            {/* Specs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "28px" }}
            >
              {[
                ["Model", "Groq llama-3.3-70b-versatile"],
                ["Feed", "TxLINE match events, live"],
                ["Turnaround", "about 1.5 seconds"],
                ["Reach", "all 104 World Cup ties"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-3)", minWidth: "100px", fontWeight: 500 }}>{k}</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.4 }}
            >
              <DrawLine color="var(--green)" />
            </motion.div>
          </div>

          {/* Right — chat window */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <TiltCard intensity={5}>
              <div style={{
                border: "1px solid var(--border-2)",
                borderRadius: "16px",
                overflow: "hidden",
                background: "var(--bg-card)",
              }}>
                {/* Window chrome */}
                <div style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "var(--bg-2)",
                }}>
                  <div style={{ display: "flex", gap: "5px" }}>
                    {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                      <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
                    ))}
                  </div>
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "11px",
                      color: "var(--text-3)",
                      background: "var(--bg-3)",
                      padding: "4px 12px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                    }}>
                      <span className="live-dot" />
                      ARG vs FRA · QF · Replay
                    </div>
                  </div>
                  <button
                    onClick={startReplay}
                    style={{
                      fontSize: "11px",
                      color: "var(--green)",
                      background: "var(--green-dim)",
                      border: "1px solid var(--green)44",
                      padding: "4px 10px",
                      borderRadius: "5px",
                      cursor: "pointer",
                    }}
                  >
                    Replay
                  </button>
                </div>

                {/* Messages */}
                <div
                  ref={chatRef}
                  style={{
                    height: "400px",
                    overflowY: "auto",
                    padding: "16px",
                    scrollBehavior: "smooth",
                  }}
                >
                  <AnimatePresence>
                    {messages.map((msg, i) => <ChatBubble key={i} msg={msg} index={i} />)}
                  </AnimatePresence>

                  {messages.length === 0 && (
                    <div style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--text-3)",
                      fontSize: "13px",
                    }}>
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        Waiting for first event...
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .demo-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
