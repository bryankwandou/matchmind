"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { AuroraBackground, SpotlightGrid } from "@/components/ui/AuroraBackground";
import PricingCTA from "@/components/PricingCTA";
import { TIER_PRICING, NETWORK_LABEL, type TierId } from "@/lib/fanPass";
import { IS_DEVNET, USDC_FAUCET_URL } from "@/lib/network";

type CouponResult = {
  valid: boolean;
  code?: string;
  percentOff?: number;
  label?: string;
  baseUsdc?: number;
  finalUsdc?: number;
  error?: string;
};

const COMPARISON: { row: string; free: string; fan: string; tour: string }[] = [
  { row: "Live ties per day", free: "Three", fan: "No cap", tour: "No cap" },
  { row: "Read delay", free: "60 seconds", fan: "None", tour: "None, front of queue" },
  { row: "Tone of voice", free: "Analyst only", fan: "Analyst, casual, stats", tour: "All three" },
  { row: "Price-drift pings", free: "—", fan: "Included", tour: "Included" },
  { row: "Full event timeline", free: "—", fan: "Included", tour: "Included" },
  { row: "Match replay archive", free: "—", fan: "—", tour: "Any past match" },
  { row: "Alert rules", free: "—", fan: "—", tour: "Set your own" },
  { row: "API access", free: "—", fan: "—", tour: "Beta keys" },
];

const WHY = [
  { title: "No delay, no guessing", body: "Free reads are held back 60 seconds — long enough for the price to already reflect the moment. A pass removes the hold entirely." },
  { title: "The full timeline, not the highlights", body: "Free shows the headline events. A pass shows every substitution, card, and VAR check the feed carries, in order." },
  { title: "Priced in a currency that doesn't move", body: "USDC tracks the dollar 1:1, so the price you see is the price you pay — no separate SOL conversion step to second-guess." },
];

export default function PricingPage() {
  const [couponInput, setCouponInput] = useState("");
  const [couponResults, setCouponResults] = useState<Record<TierId, CouponResult | null>>({
    fan_pass: null,
    tournament: null,
  });
  const [checking, setChecking] = useState<TierId | null>(null);

  async function applyCoupon(tier: TierId) {
    if (!couponInput.trim()) return;
    setChecking(tier);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, tier }),
      });
      const data = await res.json();
      setCouponResults((prev) => ({ ...prev, [tier]: data }));
    } catch {
      setCouponResults((prev) => ({ ...prev, [tier]: { valid: false, error: "Could not reach the coupon service." } }));
    } finally {
      setChecking(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "transparent", position: "relative", overflow: "hidden" }}>
      <AuroraBackground />
      <SpotlightGrid />
      <Navigation />

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "110px 24px 80px", position: "relative", zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "20px" }}
        >
          <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--green)", letterSpacing: "0.12em" }}>
            PRICING
          </span>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 52px)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text)", margin: "14px 0 12px" }}>
            One price, paid in USDC
          </h1>
          <p style={{ fontSize: "15px", color: "var(--text-2)", maxWidth: "560px", margin: "0 auto", lineHeight: 1.6 }}>
            Every pass is a real USDC transfer on {NETWORK_LABEL}, confirmed on-chain — the same
            wallet and the same network the rest of MatchMind runs on, never a different one.
          </p>
        </motion.div>

        {/* Network badge */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "56px" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "7px 14px", borderRadius: "100px", border: "1px solid var(--border-2)",
            background: "rgba(0,232,122,0.04)", fontSize: "12px", color: "var(--text-3)",
          }}>
            <span className="live-dot" />
            <span>Payments settle on {NETWORK_LABEL} · USDC only</span>
          </div>
        </div>

        {/* Pricing cards with coupon + real USDC pay */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "70px" }}>
          {(["fan_pass", "tournament"] as TierId[]).map((tier) => {
            const t = TIER_PRICING[tier];
            const coupon = couponResults[tier];
            const finalPrice = coupon?.valid ? coupon.finalUsdc : undefined;
            const isTournament = tier === "tournament";
            return (
              <motion.div
                key={tier}
                className="ticket-stub"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                  background: isTournament ? "var(--bg-card)" : "linear-gradient(160deg, rgba(0,232,122,0.06), rgba(0,196,255,0.04))",
                  border: `1px solid ${isTournament ? "var(--border)" : "rgba(0,232,122,0.25)"}`,
                  borderRadius: "16px",
                  padding: "28px",
                }}
              >
                <p style={{ fontSize: "12px", fontWeight: 700, color: isTournament ? "#7c3aed" : "var(--green)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "12px" }}>
                  {t.label}
                </p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "6px" }}>
                  {finalPrice !== undefined && (
                    <span style={{ fontSize: "18px", color: "var(--text-3)", textDecoration: "line-through" }}>
                      {t.usdc} USDC
                    </span>
                  )}
                  <span style={{ fontSize: "36px", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.04em" }}>
                    {(finalPrice ?? t.usdc).toFixed(finalPrice !== undefined ? 2 : 0)} USDC
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-3)", marginBottom: "20px" }}>
                  {tier === "fan_pass" ? "per match" : "entire World Cup"}
                </p>

                {/* Coupon row */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Coupon code"
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: "7px",
                      border: "1px solid var(--border-2)", background: "var(--bg-3)",
                      color: "var(--text)", fontSize: "12px", outline: "none",
                    }}
                  />
                  <button
                    onClick={() => applyCoupon(tier)}
                    disabled={checking === tier}
                    style={{
                      padding: "8px 12px", borderRadius: "7px", border: "1px solid var(--border-2)",
                      background: "var(--bg-3)", color: "var(--text-2)", fontSize: "12px", fontWeight: 700,
                      cursor: checking === tier ? "default" : "pointer",
                    }}
                  >
                    {checking === tier ? "…" : "Apply"}
                  </button>
                </div>
                {coupon && (
                  <p style={{
                    fontSize: "11px", marginBottom: "16px",
                    color: coupon.valid ? "var(--green)" : "var(--red)",
                  }}>
                    {coupon.valid ? `${coupon.label} — ${coupon.percentOff}% off applied` : coupon.error}
                  </p>
                )}

                <PricingCTA
                  tier={tier}
                  label={tier === "fan_pass" ? "Grab a pass" : "Take the lot"}
                  bg={isTournament ? "#7c3aed" : "var(--green)"}
                  color={isTournament ? "#fff" : "#000"}
                  amountUsdc={finalPrice}
                  couponCode={coupon?.valid ? coupon.code : undefined}
                />
              </motion.div>
            );
          })}
        </div>

        {/* Full comparison table */}
        <div style={{ marginBottom: "70px", overflowX: "auto" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
            Every tier, side by side
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "560px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-2)" }}>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "var(--text-3)", fontWeight: 700 }}>FEATURE</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "var(--text-3)", fontWeight: 700 }}>FREE</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "var(--green)", fontWeight: 700 }}>FAN PASS</th>
                <th style={{ textAlign: "left", padding: "10px 12px", fontSize: "11px", color: "#7c3aed", fontWeight: 700 }}>TOURNAMENT</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((r) => (
                <tr key={r.row} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>{r.row}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-3)" }}>{r.free}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-2)" }}>{r.fan}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-2)" }}>{r.tour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Why pay */}
        <div style={{ marginBottom: "70px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
            What a pass actually changes
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
            {WHY.map((w) => (
              <div key={w.title} style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "12px", padding: "18px" }}>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "8px" }}>{w.title}</p>
                <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>{w.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment FAQ */}
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text)", marginBottom: "16px", letterSpacing: "-0.02em" }}>
            Paying with USDC
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Why USDC and not SOL?</p>
              <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>
                The listed price is a dollar amount. USDC holds a 1:1 dollar peg, so 4 USDC is
                always 4 USDC — no separate step converting a fixed-supply, price-moving asset
                into a dollar figure at the moment you pay.
              </p>
            </div>
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                Which network does this run on?
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>
                {NETWORK_LABEL}, matching the wallet connection and every other on-chain feature
                in the app — Moment Mint, Streak Badge, and the Fan Pass payment all read the
                same network setting, so a pass can never be paid on one chain while the rest of
                the app runs on another.
              </p>
            </div>
            {IS_DEVNET && (
              <div>
                <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>
                  I don&apos;t have devnet USDC — where do I get it?
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>
                  Devnet SOL is airdroppable and MatchMind tops it up automatically for fees, but
                  devnet USDC is not — Circle runs a dedicated faucet for it.{" "}
                  <a href={USDC_FAUCET_URL} target="_blank" rel="noopener noreferrer" style={{ color: "var(--green)" }}>
                    Open the faucet
                  </a>, connect the same wallet, and request devnet USDC before paying.
                </p>
              </div>
            )}
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", marginBottom: "4px" }}>Do coupon codes stack?</p>
              <p style={{ fontSize: "12px", color: "var(--text-2)", lineHeight: 1.6 }}>
                One code per purchase. Apply it before paying and the discounted total is what
                gets charged — the receipt keeps the code that was used.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
