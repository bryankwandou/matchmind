"use client";

import { useEffect, useRef } from "react";

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {/* Base gradient */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(ellipse 80% 50% at 50% -10%, #00e87a0a, transparent)",
      }} />

      {/* Aurora layer 1 */}
      <div style={{
        position: "absolute",
        width: "120%",
        height: "600px",
        top: "-100px",
        left: "-10%",
        background: "linear-gradient(105deg, transparent 20%, #00e87a08 40%, #7c3aed0a 60%, transparent 80%)",
        animation: "aurora1 12s ease-in-out infinite alternate",
        transformOrigin: "center",
      }} />

      {/* Aurora layer 2 */}
      <div style={{
        position: "absolute",
        width: "110%",
        height: "500px",
        top: "0",
        left: "-5%",
        background: "linear-gradient(80deg, transparent 10%, #00c4ff08 35%, #00e87a06 55%, transparent 75%)",
        animation: "aurora2 16s ease-in-out infinite alternate-reverse",
      }} />

      {/* Aurora layer 3 */}
      <div style={{
        position: "absolute",
        width: "100%",
        height: "400px",
        top: "100px",
        left: "0",
        background: "linear-gradient(120deg, transparent 30%, #7c3aed06 50%, #00e87a08 70%, transparent 90%)",
        animation: "aurora1 20s ease-in-out infinite alternate",
        animationDelay: "-4s",
      }} />

      {/* Noise grain overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E")`,
        opacity: 0.4,
      }} />

      <style>{`
        @keyframes aurora1 {
          0% { transform: translateX(0) skewX(-3deg) scaleY(1); opacity: 0.6; }
          33% { transform: translateX(3%) skewX(1deg) scaleY(1.05); opacity: 0.9; }
          66% { transform: translateX(-2%) skewX(-2deg) scaleY(0.98); opacity: 0.7; }
          100% { transform: translateX(1%) skewX(2deg) scaleY(1.03); opacity: 0.85; }
        }
        @keyframes aurora2 {
          0% { transform: translateX(0) rotate(0deg); opacity: 0.5; }
          50% { transform: translateX(-4%) rotate(1deg); opacity: 0.8; }
          100% { transform: translateX(2%) rotate(-1deg); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export function SpotlightGrid() {
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
      {/* Animated grid lines */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,232,122,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,232,122,0.04) 1px, transparent 1px)
        `,
        backgroundSize: "72px 72px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
        WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 100%)",
      }} />
    </div>
  );
}
