import { NextRequest, NextResponse } from "next/server";
import { getMatchById, type TxEvent } from "@/lib/txline";

export const dynamic = "force-dynamic";

// Map the internal event shape into the flat shape the detail page expects.
function flattenEvent(e: TxEvent) {
  return {
    id: e.id,
    type: e.type,
    team: e.team === "home" ? "home" : "away",
    player: e.player || "—",
    minute: e.minute,
    detail: e.detail || undefined,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const hasKey = !!process.env.TXLINE_API_KEY;
  if (!hasKey) {
    return NextResponse.json({ error: "no feed key", source: "mock" }, { status: 404 });
  }

  try {
    const result = await getMatchById(id);
    if (!result) {
      return NextResponse.json({ error: "fixture not found", source: "live" }, { status: 404 });
    }
    const { match, events } = result;
    const hasOdds = match.odds.home > 0 || match.odds.away > 0 || match.odds.draw > 0;
    return NextResponse.json({
      source: "live",
      match: {
        id: match.id,
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        homeScore: match.score.home,
        awayScore: match.score.away,
        minute: match.minute,
        status: match.status === "ht" || match.status === "ft" ? "finished" : match.status,
        stage: match.stage,
        startTime: match.startTime,
        homeOdds: hasOdds ? match.odds.home : null,
        awayOdds: hasOdds ? match.odds.away : null,
        drawOdds: hasOdds ? match.odds.draw : null,
        events: events.map(flattenEvent),
      },
    });
  } catch (err) {
    console.error("[match/:id] fetch failed:", err);
    return NextResponse.json({ error: "fetch failed", source: "error" }, { status: 502 });
  }
}
