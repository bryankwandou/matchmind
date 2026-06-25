"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import ConnectWallet from "@/components/ui/ConnectWallet";

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease, border-color 0.3s ease",
          background: scrolled ? "rgba(5,5,5,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "30px",
            height: "30px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, var(--green), #00c4ff)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "14px",
            fontWeight: 900,
            color: "#000",
          }}>
            M
          </div>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", letterSpacing: "-0.02em" }}>
            MatchMind
          </span>
        </Link>

        {/* Center links */}
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}
          className="hidden-mobile">
          {["How it works", "Live matches", "Features"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-2)")}
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <ConnectWallet />
          <motion.a
            href="/match"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textDecoration: "none",
              color: "#000",
              background: "var(--green)",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span className="live-dot" style={{ width: "6px", height: "6px" }} />
            Watch live
          </motion.a>
        </div>
      </motion.nav>

      <style>{`
        @media (max-width: 768px) {
          .hidden-mobile { display: none !important; }
        }
      `}</style>
    </>
  );
}
