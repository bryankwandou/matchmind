import { NextResponse } from "next/server";
import { getLiveMatches, MOCK_MATCHES } from "@/lib/txline";

export async function GET() {
  try {
    const hasKey = !!process.env.TXLINE_API_KEY;
    const matches = hasKey ? await getLiveMatches() : MOCK_MATCHES;
    return NextResponse.json({ matches, source: hasKey ? "live" : "mock" });
  } catch (err) {
    console.error("TxLINE fetch error:", err);
    return NextResponse.json({ matches: MOCK_MATCHES, source: "mock" });
  }
}
