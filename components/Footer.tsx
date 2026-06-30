"use client";

import { Link001, Link002, Link003 } from "@/components/ui/skiper-ui/skiper40";

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

        <div style={{ display: "flex", gap: "26px", alignItems: "center", fontSize: "12px", color: "var(--text-3)" }}>
          <Link001 href="https://txline.txodds.com" className="footer-link">
            TxLINE feed
          </Link001>
          <Link002 href="https://github.com/nayrbryanGaming/matchmind" className="footer-link">
            Source on GitHub
          </Link002>
          <Link003 href="https://solana.com" className="footer-link">
            Runs on Solana
          </Link003>
        </div>
      </div>

      <style>{`
        .footer-link { color: var(--text-3); text-decoration: none; transition: color 0.2s ease; }
        .footer-link:hover { color: var(--text); }
      `}</style>
    </footer>
  );
}
