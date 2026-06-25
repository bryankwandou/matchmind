"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, useSpring } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  strength?: number;
  onClick?: () => void;
  href?: string;
}

export function MagneticButton({ children, className, style, strength = 0.4, onClick, href }: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 20 });
  const y = useSpring(0, { stiffness: 200, damping: 20 });

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    x.set((e.clientX - cx) * strength);
    y.set((e.clientY - cy) * strength);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
  }

  const Tag = href ? "a" : "div";

  return (
    <div ref={ref} onMouseMove={handleMove} onMouseLeave={handleLeave} style={{ display: "inline-block" }}>
      <motion.div style={{ x, y, display: "inline-block" }}>
        <Tag
          href={href}
          onClick={onClick}
          className={className}
          style={{ display: "inline-block", cursor: "pointer", ...style }}
        >
          {children}
        </Tag>
      </motion.div>
    </div>
  );
}
