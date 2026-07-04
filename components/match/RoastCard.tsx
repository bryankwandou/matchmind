"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

// Roast My Prediction — fires right after a pick resolves. Pulls a one-line,
// self-directed bit of gambling banter from Groq and offers it straight to X.

export default function RoastCard({
  homeTeam,
  awayTeam,
  pickLabel,
  result,
  priceTaken,
  finalScore,
  streak,
}: {
  homeTeam: string;
  awayTeam: string;
  pickLabel: string;
  result: "win" | "loss";
  priceTaken: number;
  finalScore: { home: number; away: number };
  streak: number;
}) {
  const [roast, setRoast] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/roast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeTeam, awayTeam, pickLabel, result, priceTaken, finalScore, streak }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) setRoast(d.roast || null); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeTeam, awayTeam, pickLabel, result]);

  if (failed || (!roast && failed)) return null;

  function shareRoast() {
    if (!roast) return;
    const text = `${roast}\n\n${homeTeam} ${finalScore.home}-${finalScore.away} ${awayTeam} · called ${pickLabel} @ ${priceTaken.toFixed(2)}\n\nRoasted by MatchMind.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        marginTop: "10px",
        padding: "12px 14px",
        borderRadius: "10px",
        background: result === "win" ? "rgba(0,232,122,0.05)" : "rgba(255,140,0,0.06)",
        border: `1px solid ${result === "win" ? "rgba(0,232,122,0.2)" : "rgba(255,140,0,0.25)"}`,
      }}
    >
      <p style={{
        fontSize: "9px", fontWeight: 800, letterSpacing: "0.08em",
        color: result === "win" ? "var(--green)" : "var(--orange)", marginBottom: "6px",
      }}>
        ROAST MY PREDICTION
      </p>
      {roast ? (
        <>
          <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.55, marginBottom: "8px" }}>
            {roast}
          </p>
          <button
            onClick={shareRoast}
            style={{
              padding: "5px 11px", borderRadius: "6px", border: "1px solid var(--border-2)",
              background: "transparent", color: "var(--text-3)", fontSize: "10px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Post the roast
          </button>
        </>
      ) : (
        <p style={{ fontSize: "11px", color: "var(--text-3)" }}>Cooking up a roast…</p>
      )}
    </motion.div>
  );
}
