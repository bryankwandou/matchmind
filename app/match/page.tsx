"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Navigation from "@/components/Navigation";
import { AuroraBackground, SpotlightGrid } from "@/components/ui/AuroraBackground";

type Match = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: "live" | "pre" | "finished";
  stage: string;
  homeOdds: number | null;
  awayOdds: number | null;
  drawOdds: number | null;
  lastEvent?: string;
  source?: string;
};

const STATUS_COLOR: Record<string, string> = {
  live: "var(--red)",
  pre: "var(--text-3)",
  finished: "var(--text-3)",
};

const STATUS_LABEL: Record<string, string> = {
  live: "LIVE",
  pre: "UPCOMING",
  finished: "FT",
};

function MatchCard({ match, index }: { match: Match; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const isLive = match.status === "live";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={`/match/${match.id}`} style={{ textDecoration: "none" }}>
        <motion.div
          whileHover={{
            borderColor: isLive ? "var(--green)66" : "var(--border-2)",
            boxShadow: isLive ? "0 0 30px rgba(0,232,122,0.08)" : "0 8px 32px rgba(0,0,0,0.3)",
            y: -2,
          }}
          transition={{ duration: 0.2 }}
          style={{
            background: isLive
              ? "linear-gradient(158deg, rgba(0,232,122,0.10), rgba(14,19,32,0.96))"
              : "var(--grad-card)",
            border: `1px solid ${isLive ? "var(--green)44" : "var(--border-2)"}`,
            borderRadius: "14px",
            padding: "20px 22px",
            backdropFilter: "blur(6px)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Live glow strip */}
          {isLive && (
            <motion.div
              animate={{ opacity: [0, 0.4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: "linear-gradient(to right, transparent, var(--green), transparent)",
              }}
            />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            {/* Status badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 9px",
              borderRadius: "5px",
              background: isLive ? "rgba(0,232,122,0.08)" : "var(--bg-3)",
              border: `1px solid ${isLive ? "var(--green)33" : "var(--border)"}`,
            }}>
              {isLive && <span className="live-dot" style={{ width: "5px", height: "5px" }} />}
              <span style={{
                fontSize: "9px",
                fontWeight: 800,
                color: STATUS_COLOR[match.status],
                letterSpacing: "0.1em",
              }}>
                {match.status === "live" ? `${match.minute}'` : STATUS_LABEL[match.status]}
              </span>
            </div>

            <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{match.stage}</span>

            {/* Odds — favourite in green, longest shot in red, matching the
                CURRENT ODDS panel on the match page */}
            <div style={{ marginLeft: "auto", display: "flex", gap: "8px" }}>
              {(() => {
                const cells = [
                  { label: "1", val: match.homeOdds },
                  { label: "X", val: match.drawOdds },
                  { label: "2", val: match.awayOdds },
                ];
                const nums = cells.map(c => (typeof c.val === "number" && c.val > 0 ? c.val : null));
                const valid = nums.filter((n): n is number => n !== null);
                const lo = valid.length ? Math.min(...valid) : null;
                const hi = valid.length > 1 ? Math.max(...valid) : null;
                return cells.map(({ label, val }, i) => {
                  const n = nums[i];
                  const isFav = n !== null && n === lo;
                  const isLong = n !== null && n === hi && hi !== lo;
                  const tint = isFav ? "var(--green)" : isLong ? "var(--red)" : null;
                  return (
                    <div key={label} style={{
                      textAlign: "center",
                      padding: "3px 8px",
                      borderRadius: "4px",
                      border: `1px solid ${tint ? `color-mix(in srgb, ${tint} 40%, var(--border))` : "var(--border)"}`,
                      background: tint ? `color-mix(in srgb, ${tint} 9%, var(--bg-3))` : "var(--bg-3)",
                      minWidth: "40px",
                    }}>
                      <p style={{ fontSize: "8px", color: "var(--text-3)", marginBottom: "1px" }}>{label}</p>
                      <p style={{ fontSize: "11px", fontWeight: 700, color: tint ?? "var(--text-2)", fontVariantNumeric: "tabular-nums" }}>
                        {n !== null ? n.toFixed(2) : "—"}
                      </p>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Score row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {match.homeTeam}
              </p>
            </div>

            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 16px",
              background: "var(--bg-2)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              fontVariantNumeric: "tabular-nums",
            }}>
              <span style={{ fontSize: "20px", fontWeight: 900, color: isLive ? "var(--green)" : "var(--text)", minWidth: "16px", textAlign: "center" }}>
                {match.homeScore}
              </span>
              <span style={{ fontSize: "12px", color: "var(--text-3)", fontWeight: 400 }}>—</span>
              <span style={{ fontSize: "20px", fontWeight: 900, color: isLive ? "var(--green)" : "var(--text)", minWidth: "16px", textAlign: "center" }}>
                {match.awayScore}
              </span>
            </div>

            <div style={{ flex: 1, textAlign: "right" }}>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
                {match.awayTeam}
              </p>
            </div>
          </div>

          {/* Last event */}
          {match.lastEvent && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              style={{
                marginTop: "12px",
                paddingTop: "12px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}
            >
              <div style={{
                width: "18px",
                height: "18px",
                borderRadius: "5px",
                background: "linear-gradient(135deg, var(--green), #00c4ff)",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "8px",
                fontWeight: 900,
                color: "#000",
              }}>M</div>
              <p style={{ fontSize: "11px", color: "var(--text-2)", lineHeight: 1.5 }}>{match.lastEvent}</p>
            </motion.div>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}

export default function MatchListPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "pre" | "finished">("all");

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        const live: Match[] = data.matches ?? data;
        // TxLINE's fixtures/snapshot only carries the upcoming and in-play
        // slate — settled ties leave the feed. Keep a client-side archive of
        // every fixture this browser has seen; anything that has left the
        // feed after its start time shows under FINISHED with the last
        // score we saw for it.
        const KEY = "mm_fixture_archive";
        let archive: Record<string, Match & { seenAt: number }> = {};
        try { archive = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch {}
        const now = Date.now();
        for (const m of live) archive[m.id] = { ...m, seenAt: now };
        try { localStorage.setItem(KEY, JSON.stringify(archive)); } catch {}
        const liveIds = new Set(live.map((m) => m.id));
        const settled = Object.values(archive).filter((m) =>
          // Absent from the feed for 2.5h+ means the tie has wrapped up —
          // the snapshot drops fixtures once they settle.
          !liveIds.has(m.id) && now - m.seenAt > 2.5 * 60 * 60 * 1000
        ).map((m) => ({ ...m, status: "finished" as const }));
        setMatches([...live, ...settled]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // World Cup fixtures lead; friendlies and other competitions follow. The
  // feed carries whatever is live on TxLINE — we surface all of it, in order
  // of what a World Cup audience came for.
  const ranked = [...matches].sort((a, b) => {
    const aWC = /world cup/i.test(a.stage) ? 0 : 1;
    const bWC = /world cup/i.test(b.stage) ? 0 : 1;
    if (aWC !== bWC) return aWC - bWC;
    return 0;
  });
  const filtered = filter === "all" ? ranked : ranked.filter((m) => m.status === filter);
  const liveCount = matches.filter((m) => m.status === "live").length;

  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
      <AuroraBackground />
      <SpotlightGrid />
      <Navigation />

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "100px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: "40px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-0.04em" }}>
              World Cup 2026
            </h1>
            {liveCount > 0 && (
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0,232,122,0.08)",
                  border: "1px solid var(--green)33",
                  fontSize: "11px",
                  color: "var(--green)",
                  fontWeight: 700,
                }}
              >
                <span className="live-dot" />
                {liveCount} live
              </motion.div>
            )}
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-3)" }}>
            {matches.length} ties · World Cup first, live friendlies below · TxLINE feed · prices off 50+ books
          </p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          style={{ display: "flex", gap: "4px", marginBottom: "24px" }}
        >
          {(["all", "live", "pre", "finished"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              style={{
                padding: "7px 16px",
                borderRadius: "7px",
                border: "1px solid",
                borderColor: filter === tab ? "var(--green)66" : "var(--border-2)",
                background: filter === tab
                  ? "linear-gradient(180deg, rgba(0,232,122,0.16), rgba(0,232,122,0.06))"
                  : "var(--grad-bar)",
                color: filter === tab ? "var(--green)" : "var(--text-2)",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
                letterSpacing: "0.02em",
                textTransform: "uppercase",
              }}
            >
              {tab === "all" ? "All" : tab === "pre" ? "Upcoming" : tab === "finished" ? "Finished" : "Live"}
            </button>
          ))}
        </motion.div>

        {/* Match list */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                style={{
                  height: "110px",
                  borderRadius: "14px",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-3)", fontSize: "14px", maxWidth: "460px", margin: "0 auto", lineHeight: 1.7 }}>
            {filter === "finished"
              ? "Nothing settled yet on this device. The TxLINE snapshot carries the upcoming and in-play slate — once a tie you've seen here wraps up and leaves the feed, it stays on this tab with the last score we caught."
              : "Nothing here under that filter."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((match, i) => (
              <MatchCard key={match.id} match={match} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
