import { NextResponse } from "next/server";
import { getLiveMatches, MOCK_MATCHES, type TxMatch } from "@/lib/txline";

export const dynamic = "force-dynamic";

export function normalize(m: TxMatch) {
  const hasOdds = m.odds.home > 0 || m.odds.away > 0 || m.odds.draw > 0;
  return {
    id: m.id,
    homeTeam: m.homeTeam.name,
    awayTeam: m.awayTeam.name,
    homeCode: m.homeTeam.code,
    awayCode: m.awayTeam.code,
    homeScore: m.score.home,
    awayScore: m.score.away,
    minute: m.minute,
    status: m.status === "ht" || m.status === "ft" ? "finished" : m.status,
    stage: m.stage,
    startTime: m.startTime,
    homeOdds: hasOdds ? m.odds.home : null,
    awayOdds: hasOdds ? m.odds.away : null,
    drawOdds: hasOdds ? m.odds.draw : null,
    lastEvent: undefined as string | undefined,
  };
}

export async function GET() {
  const hasKey = !!process.env.TXLINE_API_KEY;
  if (hasKey) {
    try {
      const matches = (await getLiveMatches()).map(normalize);
      return NextResponse.json({ matches, source: "live" });
    } catch (err) {
      console.error("TxLINE fetch error:", err);
    }
  }
  return NextResponse.json({ matches: MOCK_MATCHES.map(normalize), source: "mock" });
}
