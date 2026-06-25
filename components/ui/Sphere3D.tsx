"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function Globe3D({ size = 280 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.scale(2, 2);

    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.38;
    const dotCount = 280;
    const phi = Math.PI * (3 - Math.sqrt(5));
    let angle = 0;
    let animId: number;

    const dots: { x: number; y: number; z: number; r: number }[] = [];
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = phi * i;
      dots.push({ x: Math.cos(theta) * r, y, z: Math.sin(theta) * r, r });
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, size, size);

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const sorted = dots.map((d) => {
        const x2 = d.x * cosA - d.z * sinA;
        const z2 = d.x * sinA + d.z * cosA;
        return { px: cx + x2 * radius, py: cy + d.y * radius, z: z2 };
      }).sort((a, b) => a.z - b.z);

      // Draw connection lines (arcs)
      sorted.forEach((d, i) => {
        if (d.z < -0.1) return;
        sorted.slice(i + 1, i + 6).forEach((d2) => {
          const dist = Math.hypot(d.px - d2.px, d.py - d2.py);
          if (dist > 60) return;
          const alpha = ((d.z + 1) / 2) * 0.15 * (1 - dist / 60);
          ctx.beginPath();
          ctx.moveTo(d.px, d.py);
          ctx.lineTo(d2.px, d2.py);
          ctx.strokeStyle = `rgba(0,232,122,${alpha})`;
          ctx.lineWidth = 0.4;
          ctx.stroke();
        });
      });

      // Draw dots
      sorted.forEach((d) => {
        if (d.z < -0.2) return;
        const alpha = (d.z + 1) / 2;
        const dotSize = 0.8 + alpha * 1.2;
        ctx.beginPath();
        ctx.arc(d.px, d.py, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,232,122,${0.3 + alpha * 0.5})`;
        ctx.fill();
      });

      angle += 0.003;
      animId = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <motion.div
      animate={{ opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      style={{ position: "relative", width: size, height: size }}
    >
      {/* Glow behind globe */}
      <div style={{
        position: "absolute",
        inset: "15%",
        borderRadius: "50%",
        background: "radial-gradient(circle, var(--green-glow) 0%, transparent 70%)",
        filter: "blur(20px)",
      }} />
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, position: "relative", zIndex: 1 }}
      />
    </motion.div>
  );
}

// Radar ring animation
export function RadarRings({ color = "var(--green)" }: { color?: string }) {
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            border: `1px solid ${color}`,
            animation: `radar-ring 2.4s ease-out ${i * 0.8}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes radar-ring {
          0% { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
