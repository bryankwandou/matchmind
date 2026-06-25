"use client";

import { motion } from "framer-motion";

const TICKER_ITEMS = [
  { home: "Argentina", away: "France", score: "1-0", minute: "34'", status: "LIVE" },
  { home: "Spain", away: "England", score: "2-1", minute: "67'", status: "LIVE" },
  { home: "Brazil", away: "Germany", score: "0-0", minute: "KO 21:00", status: "TODAY" },
  { home: "Portugal", away: "Morocco", score: "1-1", minute: "FT", status: "FT" },
  { home: "Netherlands", away: "USA", score: "3-0", minute: "FT", status: "FT" },
  { home: "Japan", away: "Croatia", score: "0-0", minute: "HT", status: "HT" },
  { home: "Colombia", away: "Ecuador", score: "2-0", minute: "78'", status: "LIVE" },
  { home: "Senegal", away: "Poland", score: "1-0", minute: "45'", status: "LIVE" },
];

const statusColor = (s: string) => {
  if (s === "LIVE") return "var(--red)";
  if (s === "TODAY") return "var(--green)";
  if (s === "HT") return "var(--gold)";
  return "var(--text-3)";
};

function TickerItem({ item }: { item: typeof TICKER_ITEMS[0] }) {
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      padding: "0 24px",
      borderRight: "1px solid var(--border)",
      whiteSpace: "nowrap",
      height: "100%",
    }}>
      <span style={{ fontSize: "11px", fontWeight: 700, color: statusColor(item.status), letterSpacing: "0.06em" }}>
        {item.status}
      </span>
      <span style={{ fontSize: "13px", color: "var(--text)" }}>{item.home}</span>
      <span style={{
        fontSize: "13px",
        fontWeight: 700,
        color: "var(--text)",
        background: "var(--bg-card)",
        padding: "2px 8px",
        borderRadius: "4px",
        fontVariantNumeric: "tabular-nums",
      }}>
        {item.score}
      </span>
      <span style={{ fontSize: "13px", color: "var(--text)" }}>{item.away}</span>
      <span style={{ fontSize: "11px", color: "var(--text-3)" }}>{item.minute}</span>
    </div>
  );
}

export default function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div style={{
      borderTop: "1px solid var(--border)",
      borderBottom: "1px solid var(--border)",
      background: "var(--bg-2)",
      height: "44px",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      position: "relative",
    }}>
      {/* Left fade */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: "80px",
        background: "linear-gradient(to right, var(--bg-2), transparent)",
        zIndex: 10,
        pointerEvents: "none",
      }} />

      {/* Label */}
      <div style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 11,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        gap: "6px",
        background: "var(--bg-2)",
        borderRight: "1px solid var(--border)",
      }}>
        <span className="live-dot" />
        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.06em" }}>
          LIVE
        </span>
      </div>

      {/* Ticker */}
      <div className="ticker-wrap" style={{ flex: 1, paddingLeft: "90px", height: "100%", display: "flex", alignItems: "center" }}>
        <div className="ticker-content" style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {doubled.map((item, i) => (
            <TickerItem key={i} item={item} />
          ))}
        </div>
      </div>

      {/* Right fade */}
      <div style={{
        position: "absolute",
        right: 0,
        top: 0,
        bottom: 0,
        width: "80px",
        background: "linear-gradient(to left, var(--bg-2), transparent)",
        pointerEvents: "none",
      }} />
    </div>
  );
}
