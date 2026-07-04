"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { hitMilestone } from "@/lib/streakBadge";
import StreakBadge from "./StreakBadge";
import RoastCard from "./RoastCard";

// Prediction Streak — call the 1X2 before kickoff, with TxLINE odds as the
// baseline. Picks lock at kickoff, resolve at full time, and feed a
// wallet-linked streak counter + leaderboard.

type Pick = "1" | "X" | "2";
type StoredPick = { pick: Pick; at: number; price: number; resolved?: boolean; correct?: boolean };
type PickMap = Record<string, StoredPick>;
type Streak = { count: number; best: number };
type BoardRow = { wallet: string; streak: number; best: number };

const PICKS_KEY = "mm_predictions";
const STREAK_KEY = "mm_streak";

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full/blocked — streak simply won't persist
  }
}

export default function PredictionStreak({
  fixtureId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  status,
  odds,
}: {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: "pre" | "live" | "finished";
  odds: { home: number; draw: number; away: number };
}) {
  const { publicKey } = useWallet();
  const [myPick, setMyPick] = useState<StoredPick | null>(null);
  const [streak, setStreak] = useState<Streak>({ count: 0, best: 0 });
  const [board, setBoard] = useState<BoardRow[]>([]);
  const [justResolved, setJustResolved] = useState<"win" | "loss" | null>(null);
  const [milestoneHit, setMilestoneHit] = useState<number | null>(null);

  const syncBoard = useCallback(async (s: Streak) => {
    if (!publicKey) return;
    try {
      await fetch("/api/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58(), streak: s.count, best: s.best }),
      });
    } catch {
      // board sync is best-effort; local streak is the source of truth
    }
  }, [publicKey]);

  // Load pick + streak, resolve if the match has finished. localStorage is only
  // readable client-side, so hydration has to happen in an effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const picks = loadJson<PickMap>(PICKS_KEY, {});
    const stored = picks[fixtureId] ?? null;
    const s = loadJson<Streak>(STREAK_KEY, { count: 0, best: 0 });

    if (stored && !stored.resolved && status === "finished") {
      const result: Pick = homeScore > awayScore ? "1" : homeScore < awayScore ? "2" : "X";
      const correct = stored.pick === result;
      const next: Streak = correct
        ? { count: s.count + 1, best: Math.max(s.best, s.count + 1) }
        : { count: 0, best: s.best };
      picks[fixtureId] = { ...stored, resolved: true, correct };
      saveJson(PICKS_KEY, picks);
      saveJson(STREAK_KEY, next);
      setStreak(next);
      setMyPick(picks[fixtureId]);
      setJustResolved(correct ? "win" : "loss");
      setMilestoneHit(correct ? hitMilestone(next.count) : null);
      syncBoard(next);
    } else {
      setStreak(s);
      setMyPick(stored);
    }
  }, [fixtureId, status, homeScore, awayScore, syncBoard]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Leaderboard
  useEffect(() => {
    let cancelled = false;
    fetch("/api/streak")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.board) setBoard(d.board);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [justResolved]);

  function place(pick: Pick) {
    if (status !== "pre" || myPick) return;
    const picks = loadJson<PickMap>(PICKS_KEY, {});
    const price = pick === "1" ? odds.home : pick === "X" ? odds.draw : odds.away;
    // Click handler, never runs during render — timestamping the pick is safe.
    // eslint-disable-next-line react-hooks/purity
    picks[fixtureId] = { pick, at: Date.now(), price };
    saveJson(PICKS_KEY, picks);
    setMyPick(picks[fixtureId]);
  }

  const pickLabel: Record<Pick, string> = {
    "1": homeTeam,
    "X": "Draw",
    "2": awayTeam,
  };

  const options: { key: Pick; label: string; price: number }[] = [
    { key: "1", label: homeTeam, price: odds.home },
    { key: "X", label: "Draw", price: odds.draw },
    { key: "2", label: awayTeam, price: odds.away },
  ];

  return (
    <div style={{
      background: "var(--grad-card)",
      border: "1px solid var(--border)",
      borderRadius: "16px",
      overflow: "hidden",
      marginBottom: "16px",
    }}>
      <div style={{
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--grad-bar)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)" }}>CALL IT BEFORE KICKOFF</span>
        <span style={{
          fontSize: "10px", fontWeight: 800, color: streak.count > 0 ? "var(--orange)" : "var(--text-3)",
          display: "flex", alignItems: "center", gap: "4px",
        }}>
          STREAK {streak.count} · BEST {streak.best}
        </span>
      </div>

      <div style={{ padding: "14px 16px" }}>
        {/* Pick row or locked state */}
        {status === "pre" && !myPick ? (
          <>
            <p style={{ fontSize: "11px", color: "var(--text-3)", marginBottom: "10px", lineHeight: 1.5 }}>
              One call per tie, locked at kickoff. The prices below are the live TxLINE line — beat it.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              {options.map((o) => (
                <motion.button
                  key={o.key}
                  whileHover={{ scale: 1.03, borderColor: "var(--green)" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => place(o.key)}
                  style={{
                    padding: "12px 8px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-2)",
                    background: "var(--bg-3)",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text)", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {o.label}
                  </p>
                  <p style={{ fontSize: "14px", fontWeight: 900, color: "var(--green)", fontVariantNumeric: "tabular-nums" }}>
                    {o.price > 0 ? o.price.toFixed(2) : "—"}
                  </p>
                </motion.button>
              ))}
            </div>
            {!publicKey && (
              <p style={{ fontSize: "10px", color: "var(--text-3)", marginTop: "8px" }}>
                Streak counts either way — link a wallet to appear on the board.
              </p>
            )}
          </>
        ) : myPick ? (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "10px 12px", borderRadius: "10px",
              background: myPick.resolved
                ? myPick.correct ? "rgba(0,232,122,0.08)" : "rgba(255,71,87,0.08)"
                : "var(--bg-3)",
              border: `1px solid ${myPick.resolved ? (myPick.correct ? "rgba(0,232,122,0.3)" : "rgba(255,71,87,0.3)") : "var(--border-2)"}`,
            }}>
              <span style={{
                fontSize: "10px", fontWeight: 800, padding: "2px 7px", borderRadius: "5px",
                background: "var(--bg-2)", color: "var(--text-2)", border: "1px solid var(--border)",
              }}>{myPick.pick}</span>
              <span style={{ fontSize: "12px", color: "var(--text)", fontWeight: 600, flex: 1 }}>
                {pickLabel[myPick.pick]}
              </span>
              <span style={{
                fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em",
                color: myPick.resolved ? (myPick.correct ? "var(--green)" : "var(--red)") : "var(--text-3)",
              }}>
                {myPick.resolved ? (myPick.correct ? "HIT" : "MISSED") : status === "pre" ? "LOCKED IN" : "RUNNING"}
              </span>
            </div>
            {justResolved && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: "11px", marginTop: "8px", color: justResolved === "win" ? "var(--green)" : "var(--text-3)" }}
              >
                {justResolved === "win"
                  ? `Called it. Streak moves to ${streak.count}.`
                  : "Wrong side this time — streak resets, best stands."}
              </motion.p>
            )}
            {justResolved && myPick && (
              <RoastCard
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                pickLabel={pickLabel[myPick.pick]}
                result={justResolved}
                priceTaken={myPick.price}
                finalScore={{ home: homeScore, away: awayScore }}
                streak={streak.count}
              />
            )}
            {milestoneHit && (
              <div style={{ marginTop: "10px" }}>
                <StreakBadge milestone={milestoneHit} best={streak.best} />
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "var(--text-3)", padding: "4px 0" }}>
            Predictions closed — this one kicked off without your call. Catch the next tie.
          </p>
        )}

        {/* Leaderboard */}
        {board.length > 0 && (
          <div style={{ marginTop: "14px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
            <p style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.08em", color: "var(--text-3)", marginBottom: "6px" }}>
              STREAK BOARD
            </p>
            {board.slice(0, 5).map((row, i) => (
              <div key={row.wallet} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "3px 0" }}>
                <span style={{ fontSize: "10px", color: "var(--text-3)", width: "14px" }}>{i + 1}</span>
                <span style={{ fontSize: "11px", color: "var(--text-2)", flex: 1, fontFamily: "monospace" }}>{row.wallet}</span>
                <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--orange)" }}>{row.streak}</span>
                <span style={{ fontSize: "10px", color: "var(--text-3)" }}>best {row.best}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
