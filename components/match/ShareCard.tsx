"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Share Card — renders the AI read + score + odds into a 1200×630 PNG entirely
// client-side (canvas, no deps), with download + share-to-X.

export type ShareCardData = {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  minute: number;
  status: string;
  stage: string;
  odds: { home: number; draw: number; away: number };
  read: string;
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ") !== lines.join(" ") + (line && !lines.includes(line) ? " " + line : "")) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.replace(/\s+\S*$/, "") + "…";
  }
  return lines;
}

function renderCard(d: ShareCardData): string {
  const W = 1200, H = 630;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // Backdrop
  ctx.fillStyle = "#070a12";
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, -100, 50, W / 2, -100, 700);
  glow.addColorStop(0, "rgba(0,232,122,0.18)");
  glow.addColorStop(1, "rgba(0,232,122,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Top strip
  ctx.fillStyle = "#00e87a";
  ctx.fillRect(0, 0, W, 6);

  // Header
  ctx.fillStyle = "#00e87a";
  ctx.font = "800 26px Arial";
  ctx.fillText("MATCHMIND", 70, 78);
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "500 20px Arial";
  ctx.fillText(`${d.stage}  ·  ${d.status === "live" ? d.minute + "' LIVE" : d.status.toUpperCase()}`, 70, 112);

  // Scoreline
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 58px Arial";
  ctx.fillText(d.homeTeam, 70, 210);
  ctx.fillText(d.awayTeam, 70, 286);
  ctx.fillStyle = "#00e87a";
  ctx.font = "900 64px Arial";
  ctx.textAlign = "right";
  ctx.fillText(String(d.homeScore), W - 90, 212);
  ctx.fillText(String(d.awayScore), W - 90, 288);
  ctx.textAlign = "left";

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(70, 330);
  ctx.lineTo(W - 70, 330);
  ctx.stroke();

  // AI read
  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "800 16px Arial";
  ctx.fillText("THE READ", 70, 372);
  ctx.fillStyle = "rgba(255,255,255,0.88)";
  ctx.font = "500 27px Arial";
  const lines = wrapText(ctx, d.read || "Waiting on the next moment.", W - 140, 4);
  lines.forEach((line, i) => ctx.fillText(line, 70, 412 + i * 40));

  // Odds row
  const oddsY = H - 72;
  const cells: [string, number][] = [["1", d.odds.home], ["X", d.odds.draw], ["2", d.odds.away]];
  cells.forEach(([label, price], i) => {
    const x = 70 + i * 190;
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.roundRect(x, oddsY - 38, 170, 56, 10);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = "700 16px Arial";
    ctx.fillText(label, x + 16, oddsY - 12);
    ctx.fillStyle = "#00e87a";
    ctx.font = "900 24px Arial";
    ctx.fillText(price > 0 ? price.toFixed(2) : "—", x + 48, oddsY - 8);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.font = "500 17px Arial";
  ctx.textAlign = "right";
  ctx.fillText("TxLINE data · grounded AI · Solana", W - 70, H - 34);
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

export default function ShareCard({ data }: { data: ShareCardData }) {
  const [preview, setPreview] = useState<string | null>(null);

  function open() {
    const url = renderCard(data);
    if (url) setPreview(url);
  }

  function download() {
    if (!preview) return;
    const a = document.createElement("a");
    a.href = preview;
    a.download = `matchmind-${data.homeTeam}-${data.awayTeam}.png`.replace(/\s+/g, "-").toLowerCase();
    a.click();
  }

  function shareToX() {
    const text = `${data.homeTeam} ${data.homeScore}-${data.awayScore} ${data.awayTeam} ${
      data.status === "live" ? `(${data.minute}')` : ""
    } — ${data.read.slice(0, 120)}${data.read.length > 120 ? "…" : ""}\n\nRead by MatchMind, priced by TxLINE.`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={open}
        style={{
          padding: "3px 9px",
          borderRadius: "5px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text-3)",
          fontSize: "10px",
          fontWeight: 600,
          cursor: "pointer",
        }}
        title="Turn the current read into a shareable card"
      >
        Share card
      </motion.button>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreview(null)}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
              display: "flex", alignItems: "center", justifyContent: "center", padding: "24px",
            }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: "720px", width: "100%",
                background: "#0d0d0d", border: "1px solid var(--border-2)",
                borderRadius: "16px", padding: "16px",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="MatchMind share card" style={{ width: "100%", borderRadius: "10px", display: "block" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setPreview(null)}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-3)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Close
                </button>
                <button
                  onClick={download}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "1px solid var(--border-2)", background: "var(--bg-3)", color: "var(--text)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Download PNG
                </button>
                <button
                  onClick={shareToX}
                  style={{ padding: "8px 14px", borderRadius: "8px", border: "none", background: "var(--green)", color: "#000", fontSize: "12px", fontWeight: 800, cursor: "pointer" }}
                >
                  Post to X
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
