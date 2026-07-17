"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loadReceipt } from "@/lib/fanPass";
import { flagUrl } from "@/lib/flags";
import Navigation from "@/components/Navigation";
import { AuroraBackground, SpotlightGrid } from "@/components/ui/AuroraBackground";
import MomentMint from "@/components/match/MomentMint";
import PredictionStreak from "@/components/match/PredictionStreak";
import ShareCard from "@/components/match/ShareCard";
import type { Moment } from "@/lib/moments";
import { agentFor, BOOTH } from "@/lib/booth";

type MatchEvent = {
  id: string;
  type: "goal" | "yellow_card" | "red_card" | "substitution" | "penalty" | "var" | "kickoff" | "halftime" | "fulltime";
  team: "home" | "away";
  player: string;
  minute: number;
  detail?: string;
};

type CommentaryMessage = {
  role: "event" | "ai";
  content: string;
  eventType?: string;
  minute?: number;
  aiStyle?: "analyst" | "casual" | "stats";
  question?: string; // the fan question this read answers, if any — routes it to the right agent
  timestamp: number;
};

type MatchData = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode?: string;
  awayCode?: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: "live" | "pre" | "finished";
  stage: string;
  startTime?: string;
  homeOdds: number;
  awayOdds: number;
  drawOdds: number;
  events: MatchEvent[];
};

const EVENT_ICON: Record<string, string> = {
  goal: "GOAL",
  yellow_card: "YEL",
  red_card: "RED",
  substitution: "SUB",
  penalty: "PEN",
  var: "VAR",
  kickoff: "KO",
  halftime: "HT",
  fulltime: "FT",
};

const EVENT_COLOR: Record<string, string> = {
  goal: "var(--green)",
  yellow_card: "#f5c842",
  red_card: "var(--red)",
  substitution: "var(--text-3)",
  penalty: "var(--orange)",
  var: "#00c4ff",
  kickoff: "var(--text-3)",
  halftime: "var(--text-3)",
  fulltime: "var(--text-3)",
};

const MOCK_MATCH: MatchData = {
  id: "arg-fra-qf",
  homeTeam: "Argentina",
  awayTeam: "France",
  homeScore: 2,
  awayScore: 0,
  minute: 71,
  status: "live",
  stage: "Quarter-Final",
  homeOdds: 1.08,
  awayOdds: 14.00,
  drawOdds: 9.00,
  events: [
    { id: "1", type: "kickoff", team: "home", player: "—", minute: 0 },
    { id: "2", type: "goal", team: "home", player: "L. Messi", minute: 34, detail: "Right foot, box centre" },
    { id: "3", type: "red_card", team: "away", player: "Tchouameni", minute: 52, detail: "Second yellow" },
    { id: "4", type: "halftime", team: "home", player: "—", minute: 45 },
    { id: "5", type: "goal", team: "home", player: "Di Maria", minute: 71, detail: "Left foot, top right" },
  ],
};

const AI_STYLE_OPTIONS = [
  { value: "analyst" as const, label: "Analyst" },
  { value: "casual" as const, label: "Casual" },
  { value: "stats" as const, label: "Stats-first" },
];

function OddsBar({ home, draw, away, homeTeam, awayTeam }: {
  home: number; draw: number; away: number; homeTeam: string; awayTeam: string;
}) {
  const priced = home > 0 && draw > 0 && away > 0;
  if (!priced) {
    return (
      <div style={{ marginTop: "16px", textAlign: "center", fontSize: "11px", color: "var(--text-3)", padding: "8px 0" }}>
        No price posted for this tie yet
      </div>
    );
  }
  const total = (1 / home) + (1 / draw) + (1 / away);
  const homePct = Math.round((1 / home / total) * 100);
  const drawPct = Math.round((1 / draw / total) * 100);
  const awayPct = 100 - homePct - drawPct;

  return (
    <div style={{ marginTop: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{homeTeam}</span>
        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>Draw</span>
        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{awayTeam}</span>
      </div>
      <div style={{ display: "flex", borderRadius: "4px", overflow: "hidden", height: "6px", gap: "2px" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${homePct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "var(--green)", borderRadius: "2px" }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${drawPct}%` }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "var(--text-3)", borderRadius: "2px" }}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${awayPct}%` }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "var(--red)", borderRadius: "2px" }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "5px" }}>
        <span style={{ fontSize: "10px", color: "var(--green)", fontWeight: 700 }}>{homePct}%</span>
        <span style={{ fontSize: "10px", color: "var(--text-3)", fontWeight: 600 }}>{drawPct}%</span>
        <span style={{ fontSize: "10px", color: "var(--red)", fontWeight: 700 }}>{awayPct}%</span>
      </div>
    </div>
  );
}

function EventRow({ event, homeTeam }: { event: MatchEvent; homeTeam: string }) {
  const isHome = event.team === "home";
  const color = EVENT_COLOR[event.type] ?? "var(--text-3)";
  const isMinor = ["kickoff", "halftime", "fulltime", "substitution"].includes(event.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: isHome ? -10 : 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 60px 1fr",
        alignItems: "center",
        gap: "8px",
        padding: "8px 0",
        borderBottom: "1px solid var(--border)",
        opacity: isMinor ? 0.5 : 1,
      }}
    >
      {/* Home side */}
      <div style={{ textAlign: "right" }}>
        {isHome && !isMinor && (
          <p style={{ fontSize: "12px", color: "var(--text)", fontWeight: 600 }}>{event.player}</p>
        )}
      </div>

      {/* Center badge */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
        <div style={{
          padding: "2px 6px",
          borderRadius: "4px",
          background: `${color}18`,
          border: `1px solid ${color}44`,
          fontSize: "8px",
          fontWeight: 800,
          color,
          letterSpacing: "0.08em",
        }}>
          {EVENT_ICON[event.type]}
        </div>
        <span style={{ fontSize: "9px", color: "var(--text-3)" }}>{event.minute}&apos;</span>
      </div>

      {/* Away side */}
      <div style={{ textAlign: "left" }}>
        {!isHome && !isMinor && (
          <p style={{ fontSize: "12px", color: "var(--text)", fontWeight: 600 }}>{event.player}</p>
        )}
      </div>
    </motion.div>
  );
}

function CommentaryBubble({ msg, moment }: { msg: CommentaryMessage; moment?: Moment }) {
  const isEvent = msg.role === "event";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{ marginBottom: "8px" }}
    >
      {isEvent ? (
        <div style={{
          padding: "8px 12px",
          borderRadius: "7px",
          background: "var(--green-dim)",
          border: "1px solid rgba(0,232,122,0.2)",
        }}>
          <p style={{ fontSize: "11px", color: "var(--green)", fontWeight: 700 }}>{msg.content}</p>
        </div>
      ) : (
        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
          {(() => { const ag = agentFor({ eventType: msg.eventType, question: msg.question }); return (
          <div title={`${ag.name} — ${ag.beat}`} style={{
            width: "22px",
            height: "22px",
            borderRadius: "6px",
            background: `color-mix(in srgb, ${ag.color} 22%, var(--bg-3))`,
            border: `1px solid color-mix(in srgb, ${ag.color} 55%, transparent)`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "9px",
            fontWeight: 900,
            color: ag.color,
            boxShadow: `0 0 8px color-mix(in srgb, ${ag.color} 35%, transparent)`,
          }}>{ag.initial}</div>
          ); })()}
          <div style={{
            flex: 1,
            padding: "8px 12px",
            borderRadius: "7px",
            background: "var(--bg-3)",
            border: "1px solid var(--border)",
          }}>
            {(() => { const ag = agentFor({ eventType: msg.eventType, question: msg.question }); return (
              <p style={{ fontSize: "9px", fontWeight: 800, color: ag.color, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "3px" }}>{ag.name}</p>
            ); })()}
            <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>{msg.content}</p>
            {moment && (
              <div style={{ marginTop: "8px" }}>
                <MomentMint moment={moment} compact />
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [match, setMatch] = useState<MatchData | null>(null);
  const [commentary, setCommentary] = useState<CommentaryMessage[]>([]);
  const [aiStyle, setAiStyle] = useState<"analyst" | "casual" | "stats">("analyst");
  const router = useRouter();
  // Pass state gates the paid voices. localStorage is client-only, so it must
  // hydrate in an effect; loadReceipt() already enforces expiry.
  const [hasPass, setHasPass] = useState(false);
  useEffect(() => {
    setHasPass(loadReceipt() !== null);
  }, []);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [liveConnected, setLiveConnected] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  function scrollChat() {
    setTimeout(() => {
      if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, 50);
  }

  async function triggerCommentary(event: MatchEvent) {
    if (!match) return;
    const eventMsg: CommentaryMessage = {
      role: "event",
      content: `${EVENT_ICON[event.type]} — ${event.player !== "—" ? event.player + " · " : ""}${event.minute}'`,
      timestamp: Date.now(),
    };
    setCommentary((prev) => [...prev, eventMsg]);
    scrollChat();
    setLoading(true);

    try {
      const res = await fetch("/api/ai/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            type: event.type,
            team: event.team === "home" ? match.homeTeam : match.awayTeam,
            player: event.player,
            minute: event.minute,
            detail: event.detail,
          },
          matchContext: {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: { home: match.homeScore, away: match.awayScore },
            minute: match.minute,
            competition: match.stage,
            startTime: match.startTime,
            status: match.status,
          },
          pundtStyle: aiStyle,
        }),
      });
      const data = await res.json();
      const aiMsg: CommentaryMessage = {
        role: "ai",
        content: data.commentary ?? "Could not generate commentary.",
        timestamp: Date.now(),
      };
      setCommentary((prev) => [...prev, aiMsg]);
    } catch {
      setCommentary((prev) => [...prev, {
        role: "ai",
        content: "Connection issue — commentary unavailable right now.",
        timestamp: Date.now(),
      }]);
    } finally {
      setLoading(false);
      scrollChat();
    }
  }

  async function sendQuestion() {
    if (!inputText.trim() || !match) return;
    const q = inputText.trim();
    setInputText("");
    const qMsg: CommentaryMessage = {
      role: "event",
      content: `Question: ${q}`,
      timestamp: Date.now(),
    };
    setCommentary((prev) => [...prev, qMsg]);
    scrollChat();
    setLoading(true);

    try {
      const res = await fetch("/api/ai/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: {
            type: "goal",
            team: match.homeTeam,
            player: q,
            minute: match.minute,
            detail: q,
          },
          matchContext: {
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            score: { home: match.homeScore, away: match.awayScore },
            minute: match.minute,
            competition: match.stage,
            startTime: match.startTime,
            status: match.status,
          },
          pundtStyle: aiStyle,
        }),
      });
      const data = await res.json();
      setCommentary((prev) => [...prev, {
        role: "ai",
        content: data.commentary ?? "No response.",
        question: q,
        timestamp: Date.now(),
      }]);
    } catch {
      setCommentary((prev) => [...prev, { role: "ai", content: "Connection error.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
      scrollChat();
    }
  }

  // Pull the real fixture from TxLINE on mount; fall back to MOCK_MATCH if API unavailable.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/matches/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const m = data?.match;
        const resolved: MatchData = m ? {
          id: m.id,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeCode: m.homeCode,
          awayCode: m.awayCode,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          minute: m.minute,
          status: m.status,
          stage: m.stage,
          startTime: m.startTime,
          homeOdds: m.homeOdds ?? 0,
          awayOdds: m.awayOdds ?? 0,
          drawOdds: m.drawOdds ?? 0,
          events: (m.events ?? []).map((e: MatchEvent) => ({
            id: e.id,
            type: e.type,
            team: e.team,
            player: e.player,
            minute: e.minute,
            detail: e.detail,
          })),
        } : MOCK_MATCH;
        setMatch(resolved);
        setDataLoaded(true);
      })
      .catch(() => {
        if (!cancelled) { setMatch(MOCK_MATCH); setDataLoaded(true); }
      });
    return () => { cancelled = true; };
  }, [id]);

  // SSE real-time stream connection
  useEffect(() => {
    const es = new EventSource("/api/scores/stream");

    es.addEventListener("heartbeat", () => {
      setLiveConnected(true);
    });

    es.onmessage = (e) => {
      setLiveConnected(true);
      try {
        const data = JSON.parse(e.data);
        // Only update if this event matches our fixture
        if (!data.fixtureId || data.fixtureId !== id) return;

        // Update score if present
        if (data.score) {
          setMatch((prev) => prev ? ({
            ...prev,
            homeScore: data.score.home ?? prev.homeScore,
            awayScore: data.score.away ?? prev.awayScore,
            minute: data.minute ?? prev.minute,
            status: data.status ?? prev.status,
          }) : prev);
        }

        // Trigger commentary for new goal/key events
        if (data.event?.type === "goal" || data.event?.type === "red_card") {
          setMatch((prev) => {
            if (!prev) return prev;
            const syntheticEvent: MatchEvent = {
              id: data.id ?? String(Date.now()),
              type: data.event.type as MatchEvent["type"],
              team: data.event.team === prev.homeTeam ? "home" : "away",
              player: data.event.player ?? "Player",
              minute: data.minute ?? prev.minute,
              detail: data.event.detail,
            };
            triggerCommentary(syntheticEvent);
            return { ...prev, events: [...prev.events, syntheticEvent] };
          });
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => setLiveConnected(false);

    return () => es.close();
  }, [id]);

  // Auto-load commentary for last event — only after REAL data has loaded.
  useEffect(() => {
    if (!dataLoaded || !match) return;
    const lastGoal = [...match.events].reverse().find((e) => e.type === "goal" || e.type === "penalty");
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    if (lastGoal) triggerCommentary(lastGoal);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoaded]);

  // Show skeleton while real data loads — never show mock match for a real fixture ID
  if (!match) {
    return (
      <div style={{ minHeight: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
        <AuroraBackground />
        <Navigation />
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "90px 24px 60px", position: "relative", zIndex: 1 }}>
          {[180, 500, 320].map((h, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.35, 0.6, 0.35] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.2 }}
              style={{ height: h, borderRadius: "16px", background: "var(--bg-card)", border: "1px solid var(--border)", marginBottom: "16px" }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
      <AuroraBackground />
      <SpotlightGrid />
      <Navigation />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "90px 24px 60px", position: "relative", zIndex: 1 }}>
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-3)" }}
        >
          <Link href="/match" style={{ color: "var(--text-3)", textDecoration: "none" }}>Matches</Link>
          <span>/</span>
          <span style={{ color: "var(--text-2)" }}>{match.homeTeam} vs {match.awayTeam}</span>
        </motion.div>

        {/* Score header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: "var(--grad-card)",
            border: "1px solid var(--border-2)",
            borderRadius: "16px",
            padding: "28px 32px",
            marginBottom: "20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Live line */}
          <motion.div
            animate={{ scaleX: [0, 1, 0], x: ["-100%", "0%", "100%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "1px",
              background: "linear-gradient(to right, transparent, var(--green), transparent)",
              transformOrigin: "left",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px" }}>
            {/* Home */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "14px" }}>
              {flagUrl(match.homeTeam, match.homeCode) && (<img src={flagUrl(match.homeTeam, match.homeCode, 80)!} alt="" aria-hidden width={44} style={{ borderRadius: "3px", boxShadow: "0 1px 4px rgba(0,0,0,0.5)", display: "block" }} />)}
              <div>
                <p style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>
                  {match.homeTeam}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>Home</p>
              </div>
            </div>

            {/* Score — stadium LED board */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "14px",
                padding: "10px 22px", borderRadius: "10px",
                background: "rgba(0,0,0,0.45)",
                border: "1px solid rgba(255,185,55,0.18)",
                boxShadow: "inset 0 2px 10px rgba(0,0,0,0.6)",
              }}>
                <span style={{ fontSize: "48px", fontWeight: 900, color: "var(--scoreboard)", fontVariantNumeric: "tabular-nums", lineHeight: 1, textShadow: "0 0 18px rgba(255,185,55,0.45)" }}>
                  {match.homeScore}
                </span>
                <span style={{ fontSize: "24px", color: "rgba(255,185,55,0.4)", fontWeight: 300 }}>—</span>
                <span style={{ fontSize: "48px", fontWeight: 900, color: "var(--scoreboard)", fontVariantNumeric: "tabular-nums", lineHeight: 1, textShadow: "0 0 18px rgba(255,185,55,0.45)" }}>
                  {match.awayScore}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center", marginTop: "8px" }}>
                {match.status === "live" && <span className="live-dot" />}
                <span style={{ fontSize: "12px", fontWeight: 700, color: match.status === "live" ? "var(--red)" : "var(--text-3)" }}>
                  {match.status === "live" ? `${match.minute}'` : match.status.toUpperCase()}
                </span>
                <span style={{ fontSize: "12px", color: "var(--text-3)" }}>· {match.stage}</span>
                {liveConnected && (
                  <span style={{
                    fontSize: "9px", fontWeight: 700,
                    color: "var(--green)", background: "rgba(0,232,122,0.1)",
                    border: "1px solid rgba(0,232,122,0.25)",
                    padding: "1px 6px", borderRadius: "99px", letterSpacing: "0.06em",
                  }}>
                    LIVE STREAM
                  </span>
                )}
              </div>

              {/* Odds bar */}
              <div style={{ marginTop: "14px", minWidth: "280px" }}>
                <OddsBar
                  home={match.homeOdds} draw={match.drawOdds} away={match.awayOdds}
                  homeTeam={match.homeTeam} awayTeam={match.awayTeam}
                />
              </div>
            </div>

            {/* Away */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "14px" }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "24px", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text)" }}>
                  {match.awayTeam}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "3px" }}>Away</p>
              </div>
              {flagUrl(match.awayTeam, match.awayCode) && (<img src={flagUrl(match.awayTeam, match.awayCode, 80)!} alt="" aria-hidden width={44} style={{ borderRadius: "3px", boxShadow: "0 1px 4px rgba(0,0,0,0.5)", display: "block" }} />)}
            </div>
          </div>
        </motion.div>

        {/* Prediction streak — call the 1X2 before kickoff */}
        <PredictionStreak
          fixtureId={match.id}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          homeScore={match.homeScore}
          awayScore={match.awayScore}
          status={match.status}
          odds={{ home: match.homeOdds, draw: match.drawOdds, away: match.awayOdds }}
        />

        {/* Main 2-col layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "16px" }} className="match-layout">
          {/* Left — commentary feed */}
          <div style={{
            background: "var(--grad-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            {/* Toolbar */}
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--grad-bar)",
            }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
                  <div key={c} style={{ width: "9px", height: "9px", borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", flex: 1 }}>
                {Object.values(BOOTH).map((ag) => (
                  <span key={ag.id} title={`${ag.name} — ${ag.beat}`} style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 8px", borderRadius: "100px",
                    border: `1px solid color-mix(in srgb, ${ag.color} 35%, transparent)`,
                    background: `color-mix(in srgb, ${ag.color} 8%, transparent)`,
                    fontSize: "9px", fontWeight: 800, color: ag.color, letterSpacing: "0.06em",
                  }}>
                    <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: ag.color }} />
                    {ag.name.toUpperCase()}
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                <ShareCard data={{
                  homeTeam: match.homeTeam,
                  awayTeam: match.awayTeam,
                  homeScore: match.homeScore,
                  awayScore: match.awayScore,
                  minute: match.minute,
                  status: match.status,
                  stage: match.stage,
                  odds: { home: match.homeOdds, draw: match.drawOdds, away: match.awayOdds },
                  read: [...commentary].reverse().find((m) => m.role === "ai")?.content ?? "",
                }} />
                {AI_STYLE_OPTIONS.map((opt) => {
                  // Analyst is the free voice; Casual and Stats-first are what a
                  // pass actually buys — the gate is enforced here, not implied.
                  const locked = opt.value !== "analyst" && !hasPass;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => (locked ? router.push("/pricing") : setAiStyle(opt.value))}
                      title={locked ? "Fan Pass voice — tap to see pricing" : undefined}
                      style={{
                        padding: "3px 9px",
                        borderRadius: "5px",
                        border: "1px solid",
                        borderColor: aiStyle === opt.value ? "var(--green)55" : "var(--border)",
                        background: aiStyle === opt.value ? "var(--green-dim)" : "transparent",
                        color: aiStyle === opt.value ? "var(--green)" : locked ? "var(--text-3)" : "var(--text-3)",
                        opacity: locked ? 0.55 : 1,
                        fontSize: "10px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {locked ? `${opt.label} · pass` : opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={chatRef}
              style={{ flex: 1, overflowY: "auto", padding: "14px", minHeight: "360px", maxHeight: "480px" }}
            >
              <AnimatePresence>
                {commentary.map((msg, i) => (
                  <CommentaryBubble
                    key={i}
                    msg={msg}
                    moment={msg.role === "ai" ? {
                      fixtureId: match.id,
                      homeTeam: match.homeTeam,
                      awayTeam: match.awayTeam,
                      homeScore: match.homeScore,
                      awayScore: match.awayScore,
                      minute: match.minute,
                      eventType: msg.eventType ?? "read",
                      odds: { home: match.homeOdds, draw: match.drawOdds, away: match.awayOdds },
                      read: msg.content,
                    } : undefined}
                  />
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  style={{ display: "flex", gap: "8px", alignItems: "center", padding: "6px 0" }}
                >
                  <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    background: "linear-gradient(135deg, var(--green), #00c4ff)",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: 900, color: "#000",
                  }}>M</div>
                  <div style={{ display: "flex", gap: "3px" }}>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
                        style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--green)" }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {commentary.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-3)", fontSize: "12px" }}>
                  Tap a moment on the right to read it back
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px", borderTop: "1px solid var(--border)", background: "var(--bg-2)" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendQuestion()}
                  placeholder="Ask anything about this tie..."
                  style={{
                    flex: 1,
                    background: "var(--bg-3)",
                    border: "1px solid var(--border-2)",
                    borderRadius: "8px",
                    padding: "9px 12px",
                    fontSize: "12px",
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <motion.button
                  whileHover={{ background: "#00d46e" }}
                  whileTap={{ scale: 0.96 }}
                  onClick={sendQuestion}
                  disabled={!inputText.trim() || loading}
                  style={{
                    padding: "9px 16px",
                    borderRadius: "8px",
                    background: inputText.trim() ? "var(--green)" : "var(--bg-3)",
                    border: "none",
                    color: inputText.trim() ? "#000" : "var(--text-3)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: inputText.trim() ? "pointer" : "default",
                    transition: "background 0.15s ease",
                  }}
                >
                  Ask
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right — events timeline */}
          <div style={{
            background: "var(--grad-card)",
            border: "1px solid var(--border)",
            borderRadius: "16px",
            overflow: "hidden",
          }}>
            <div style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              background: "var(--grad-bar)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)" }}>WHAT HAPPENED</span>
              <span style={{ fontSize: "10px", color: "var(--text-3)" }}>Click to analyse</span>
            </div>

            <div style={{ padding: "8px 16px" }}>
              {/* Column labels */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 60px 1fr",
                gap: "8px",
                padding: "6px 0",
                borderBottom: "1px solid var(--border)",
                marginBottom: "4px",
              }}>
                <span style={{ fontSize: "9px", color: "var(--text-3)", textAlign: "right", fontWeight: 700 }}>
                  {match.homeTeam.toUpperCase()}
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-3)", textAlign: "center", fontWeight: 700 }}>
                  MIN
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-3)", fontWeight: 700 }}>
                  {match.awayTeam.toUpperCase()}
                </span>
              </div>

              {[...match.events].reverse().map((event) => {
                const isClickable = ["goal", "penalty", "red_card", "yellow_card"].includes(event.type);
                return isClickable ? (
                  <motion.button
                    key={event.id}
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                    onClick={() => triggerCommentary(event)}
                    style={{
                      display: "block",
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      borderRadius: "6px",
                      textAlign: "left",
                    }}
                    aria-label={`Analyse ${event.type} at ${event.minute}'`}
                  >
                    <EventRow event={event} homeTeam={match.homeTeam} />
                  </motion.button>
                ) : (
                  <div key={event.id}>
                    <EventRow event={event} homeTeam={match.homeTeam} />
                  </div>
                );
              })}
            </div>

            {/* Odds numbers */}
            <div style={{
              padding: "14px 16px",
              borderTop: "1px solid var(--border)",
              background: "var(--grad-bar)",
            }}>
              <p style={{ fontSize: "9px", color: "var(--text-3)", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.08em" }}>
                CURRENT ODDS
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                {[
                  { l: "1", v: match.homeOdds, c: "var(--green)" },
                  { l: "X", v: match.drawOdds, c: "var(--text-3)" },
                  { l: "2", v: match.awayOdds, c: "var(--red)" },
                ].map(({ l, v, c }) => (
                  <div key={l} style={{
                    textAlign: "center",
                    padding: "8px 4px",
                    background: "var(--bg-3)",
                    border: "1px solid var(--border)",
                    borderRadius: "7px",
                  }}>
                    <p style={{ fontSize: "9px", color: "var(--text-3)", marginBottom: "2px" }}>{l}</p>
                    <p style={{ fontSize: "14px", fontWeight: 900, color: v > 0 ? c : "var(--text-3)", fontVariantNumeric: "tabular-nums" }}>
                      {v > 0 ? v.toFixed(2) : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .match-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
