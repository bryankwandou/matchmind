"use client";

export default function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      padding: "40px 24px",
      background: "var(--bg-2)",
    }}>
      <div style={{
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "24px",
            height: "24px",
            borderRadius: "6px",
            background: "linear-gradient(135deg, var(--green), #00c4ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            fontWeight: 900,
            color: "#000",
          }}>M</div>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>MatchMind</span>
          <span style={{ fontSize: "12px", color: "var(--text-3)" }}>
            World Cup Hackathon 2026 · Superteam Earn
          </span>
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="https://txline.txodds.com" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>
            TxLINE API
          </a>
          <a href="https://github.com/nayrbryanGaming/matchmind" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: "12px", color: "var(--text-3)", textDecoration: "none" }}>
            GitHub
          </a>
          <span style={{ fontSize: "12px", color: "var(--text-3)" }}>
            Built on Solana
          </span>
        </div>
      </div>
    </footer>
  );
}
