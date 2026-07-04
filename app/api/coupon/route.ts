import { NextRequest, NextResponse } from "next/server";
import { TIER_PRICING, type TierId } from "@/lib/fanPass";

export const dynamic = "force-dynamic";

// Fixed promo table — no database behind this, which is the honest MVP
// scope: a short, hardcoded list of codes rather than a claimed enterprise
// coupon system. Swap for a real store if this ever needs self-serve codes.
const COUPONS: Record<string, { percentOff: number; label: string }> = {
  WORLDCUP26: { percentOff: 15, label: "World Cup 2026 launch discount" },
  HACKATHON: { percentOff: 50, label: "Hackathon reviewer preview" },
};

const TIER_IDS = new Set<TierId>(["fan_pass", "tournament"]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { code, tier } = (body ?? {}) as Record<string, unknown>;
  if (typeof tier !== "string" || !TIER_IDS.has(tier as TierId)) {
    return NextResponse.json({ valid: false, error: "Unknown tier" }, { status: 400 });
  }
  if (typeof code !== "string" || !code.trim()) {
    return NextResponse.json({ valid: false, error: "Enter a code" }, { status: 400 });
  }

  const normalized = code.trim().toUpperCase().slice(0, 40);
  const coupon = COUPONS[normalized];
  const base = TIER_PRICING[tier as TierId].usdc;

  if (!coupon) {
    return NextResponse.json({ valid: false, error: "That code doesn't match anything active." });
  }

  const finalUsdc = Math.round(base * (1 - coupon.percentOff / 100) * 100) / 100;
  return NextResponse.json({
    valid: true,
    code: normalized,
    percentOff: coupon.percentOff,
    label: coupon.label,
    baseUsdc: base,
    finalUsdc,
  });
}
