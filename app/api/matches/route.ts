import { NextResponse } from "next/server";
import { getLiveMatches, MOCK_MATCHES, type TxMatch } from "@/lib/txline";

function normalize(m: TxMatch) {
  return {
    id: m.id,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    homeScore: m.score.home,
    awayScore: m.score.away,
    minute: m.minute,
    status: m.status === "ht" || m.status === "ft" ? "finished" : m.status,
    stage: m.stage,
    homeOdds: m.odds.home,
    awayOdds: m.odds.away,
    drawOdds: m.odds.draw,
    lastEvent: undefined as string | undefined,
  };
}

export async function GET() {
  try {
    const hasKey = !!process.env.TXLINE_API_KEY;
    const raw = hasKey ? await getLiveMatches() : MOCK_MATCHES;
    const matches = raw.map(normalize);
    return NextResponse.json({ matches, source: hasKey ? "live" : "mock" });
  } catch (err) {
    console.error("TxLINE fetch error:", err);
    return NextResponse.json({ matches: MOCK_MATCHES.map(normalize), source: "mock" });
  }
}
