"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";

// Word-by-word fade in
export function WordFadeIn({ text, className, style, delay = 0 }: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const words = text.split(" ");

  return (
    <span ref={ref} className={className} style={{ display: "inline", ...style }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.5, delay: delay + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "inline-block", marginRight: "0.25em" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Character scramble effect
export function ScrambleText({ text, trigger }: { text: string; trigger: boolean }) {
  const [displayed, setDisplayed] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  useEffect(() => {
    if (!trigger) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayed(
        text.split("").map((char, idx) => {
          if (char === " ") return " ";
          if (idx < iteration) return char;
          return chars[Math.floor(Math.random() * chars.length)];
        }).join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1;
    }, 30);
    return () => clearInterval(interval);
  }, [trigger, text]);

  return <span>{displayed}</span>;
}

// Typewriter effect
export function TypewriterText({ lines, speed = 40 }: { lines: string[]; speed?: number }) {
  const [lineIdx, setLineIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [displayed, setDisplayed] = useState<string[]>([]);

  useEffect(() => {
    if (lineIdx >= lines.length) return;
    const currentLine = lines[lineIdx];
    if (charIdx < currentLine.length) {
      const t = setTimeout(() => {
        setDisplayed((prev) => {
          const next = [...prev];
          next[lineIdx] = (next[lineIdx] ?? "") + currentLine[charIdx];
          return next;
        });
        setCharIdx((c) => c + 1);
      }, speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLineIdx((l) => l + 1);
        setCharIdx(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [lineIdx, charIdx, lines, speed]);

  return (
    <div>
      {displayed.map((line, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          style={{ marginBottom: "6px" }}
        >
          {line}
          {i === lineIdx && charIdx < (lines[lineIdx]?.length ?? 0) && (
            <span style={{
              display: "inline-block",
              width: "2px",
              height: "1em",
              background: "var(--green)",
              marginLeft: "2px",
              verticalAlign: "middle",
              animation: "live-pulse 0.8s ease-in-out infinite",
            }} />
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Glowing number counter
export function AnimatedNumber({ value, suffix = "", prefix = "" }: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, value]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}
