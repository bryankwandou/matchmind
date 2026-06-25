"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Animated rotating gradient border
export function BeamBorder({ children, style, className }: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }} className={className}>
      {/* Rotating beam */}
      <div style={{
        position: "absolute",
        inset: "-1px",
        borderRadius: "inherit",
        padding: "1px",
        background: "linear-gradient(var(--beam-angle, 0deg), var(--green), var(--purple), #00c4ff, var(--green))",
        backgroundSize: "400% 400%",
        animation: "beam-rotate 3s linear infinite",
        zIndex: 0,
        WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
      <style>{`
        @keyframes beam-rotate {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

// Spotlight card — follows mouse
export function SpotlightCard({ children, style, className }: {
  children: ReactNode;
  style?: React.CSSProperties;
  className?: string;
}) {
  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  }

  return (
    <div
      onMouseMove={handleMove}
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        background: "radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgba(0,232,122,0.06), transparent 60%)",
        pointerEvents: "none",
        transition: "opacity 0.3s",
        zIndex: 0,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}

// Animated line that draws itself
export function DrawLine({ vertical = false, color = "var(--green)", delay = 0 }: {
  vertical?: boolean;
  color?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ scaleX: vertical ? 1 : 0, scaleY: vertical ? 0 : 1 }}
      whileInView={{ scaleX: 1, scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay, ease: [0.16, 1, 0.3, 1] }}
      style={{
        transformOrigin: vertical ? "top" : "left",
        background: `linear-gradient(${vertical ? "to bottom" : "to right"}, ${color}, transparent)`,
        width: vertical ? "1px" : "100%",
        height: vertical ? "100%" : "1px",
      }}
    />
  );
}

// Floating badge
export function FloatingBadge({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        borderRadius: "100px",
        border: "1px solid var(--border-2)",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(12px)",
        fontSize: "12px",
        color: "var(--text-2)",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
