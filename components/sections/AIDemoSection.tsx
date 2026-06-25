"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const DEMO_THREAD: (Message & { delay: number })[] = [
  {
    type: "event",
    text: "GOAL — Messi · Argentina · 34'",
    score: "ARG 1-0 FRA",
    odds: "ARG 2.10 → 1.45",
    delay: 0,
  },
  {
    type: "ai",
    text: "Argentina's market moved hard after this — from 2.10 down to 1.45. The books are treating Messi's goal as a near-decisive swing. France would need two without reply from here, and the odds say the market does not think that's likely.",
    delay: 800,
  },
  {
    type: "event",
    text: "RED CARD — Tchouameni · France · 52'",
    score: "ARG 1-0 FRA",
    odds: "FRA draw 3.40 → 5.20",
    delay: 2000,
  },
  {
    type: "ai",
    text: "Ten men for 38 minutes is the kind of deficit France can't run back. Their draw odds lengthened from 3.40 to 5.20 immediately. Argentina's defensive structure should be enough from here — expect Scaloni to close out with a lower block.",
    delay: 2800,
  },
  {
    type: "event",
    text: "GOAL — Di Maria · Argentina · 71'",
    score: "ARG 2-0 FRA",
    odds: "ARG 1.45 → 1.08",
    delay: 5000,
  },
  {
    type: "ai",
    text: "At 1.08, the books have essentially called the match. There's no realistic path for France with nine men and 19 minutes left. The market is just pricing in the formality now.",
    delay: 5800,
  },
];

type Message = {
  type: "event" | "ai";
  text: string;
  score?: string;
  odds?: string;
};

export default function AIDemoSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [messages, setMessages] = useState<Message[]>([]);
  const [running, setRunning] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inView && !running) {
      setRunning(true);
      setMessages([]);
      DEMO_THREAD.forEach((item, i) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, item]);
          if (chatRef.current) {
            chatRef.current.scrollTop = chatRef.current.scrollHeight;
          }
        }, item.delay);
      });
    }
  }, [inView, running]);

  const reset = () => {
    setMessages([]);
    setRunning(false);
    setTimeout(() => {
      setRunning(true);
      DEMO_THREAD.forEach((item) => {
        setTimeout(() => {
          setMessages((prev) => [...prev, item]);
        }, item.delay);
      });
    }, 100);
  };

  return (
    <section id="live-matches" style={{ padding: "120px 24px" }}>
      <div ref={ref} style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              style={{ fontSize: "12px", fontWeight: 700, color: "var(--green)", letterSpacing: "0.1em", marginBottom: "16px" }}
            >
              LIVE DEMO
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
              style={{
                fontSize: "clamp(28px, 3.5vw, 46px)",
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                color: "var(--text)",
                marginBottom: "20px",
              }}
            >
              Watch it work through a match
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              style={{ fontSize: "14px", color: "var(--text-2)", lineHeight: 1.7, marginBottom: "28px" }}
            >
              This is a replay of Argentina vs France, Quarter-Final. Every event that arrived from TxLINE triggered an AI analysis within 2 seconds. This is exactly what the live experience looks like.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.3 }}
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                ["Powered by", "Groq llama-3.3-70b-versatile"],
                ["Data source", "TxLINE live feed"],
                ["Response time", "Under 2 seconds"],
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", gap: "12px", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-3)", minWidth: "100px" }}>{label}</span>
                  <span style={{ color: "var(--text)", fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Chat window */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              border: "1px solid var(--border-2)",
              borderRadius: "16px",
              overflow: "hidden",
              background: "var(--bg-card)",
            }}
          >
            {/* Window bar */}
            <div style={{
              padding: "12px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <div style={{ display: "flex", gap: "6px" }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div key={c} style={{ width: "10px", height: "10px", borderRadius: "50%", background: c }} />
                ))}
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-3)", marginLeft: "8px" }}>
                ARG vs FRA · Quarter-Final · Replay
              </span>
              <button
                onClick={reset}
                style={{
                  marginLeft: "auto",
                  fontSize: "11px",
                  color: "var(--text-3)",
                  background: "var(--border)",
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "4px",
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
                height: "420px",
                overflowY: "auto",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {msg.type === "event" ? (
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
                        <div style={{
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
                        }}>M</div>
                        <div style={{
                          padding: "10px 14px",
                          borderRadius: "8px",
                          background: "var(--bg-3)",
                          border: "1px solid var(--border)",
                          flex: 1,
                        }}>
                          <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{msg.text}</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {messages.length === 0 && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-3)", fontSize: "13px" }}>
                  Waiting for first event...
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #live-matches > div > div { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </section>
  );
}
