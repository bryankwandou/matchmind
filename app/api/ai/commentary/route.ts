import { NextRequest, NextResponse } from "next/server";
import { generateCommentary, type CommentaryRequest } from "@/lib/groq";
import { rateLimitCheck, getClientIp } from "@/lib/rateLimit";

const ALLOWED_EVENT_TYPES = new Set([
  "goal", "red_card", "yellow_card", "odds_shift",
  "substitution", "penalty", "var",
]);

const ALLOWED_PUNDIT_STYLES = new Set(["analyst", "casual", "stats"]);

function sanitize(val: unknown, maxLen = 80): string {
  if (typeof val !== "string") return "";
  return val.replace(/[`<>{}]/g, "").slice(0, maxLen);
}

// Accept both `matchContext` (canonical) and `match` (frontend alias)
function resolveMatchContext(b: Record<string, unknown>) {
  return (b.matchContext ?? b.match) as Record<string, unknown> | undefined;
}

function validateBody(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.event || typeof b.event !== "object") return false;
  if (!resolveMatchContext(b)) return false;
  const ev = b.event as Record<string, unknown>;
  if (!ALLOWED_EVENT_TYPES.has(ev.type as string)) return false;
  if (typeof ev.minute !== "number" || ev.minute < 0 || ev.minute > 130) return false;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = rateLimitCheck(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
          "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!validateBody(body)) {
    return NextResponse.json({ error: "Invalid or missing fields" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const ev = b.event as Record<string, unknown>;
  const ctx = resolveMatchContext(b)!;

  // Derive score — accept either nested score object or flat homeScore/awayScore
  const ctxScore = ctx.score as { home: number; away: number } | undefined;
  const score = ctxScore ?? {
    home: typeof ctx.homeScore === "number" ? ctx.homeScore : 0,
    away: typeof ctx.awayScore === "number" ? ctx.awayScore : 0,
  };

  const safe: CommentaryRequest = {
    event: {
      type: ev.type as CommentaryRequest["event"]["type"],
      minute: ev.minute as number,
      team: sanitize(ev.team),
      player: sanitize(ev.player),
      detail: sanitize(ev.detail),
      oddsBefore: typeof ev.oddsBefore === "number" ? ev.oddsBefore : undefined,
      oddsAfter: typeof ev.oddsAfter === "number" ? ev.oddsAfter : undefined,
      score: ev.score as { home: number; away: number } | undefined,
    },
    matchContext: {
      homeTeam: sanitize(ctx.homeTeam),
      awayTeam: sanitize(ctx.awayTeam),
      score,
      minute: typeof ctx.minute === "number" ? ctx.minute : (ev.minute as number),
      competition: sanitize(ctx.competition) || "FIFA World Cup 2026",
      kickoff: typeof ctx.startTime === "string" ? ctx.startTime
        : typeof ctx.kickoff === "string" ? ctx.kickoff : undefined,
      status: sanitize(ctx.status, 20) || undefined,
    },
    userTeam: sanitize(b.userTeam),
    language: sanitize(b.language, 20),
    pundtStyle: ALLOWED_PUNDIT_STYLES.has(b.pundtStyle as string)
      ? (b.pundtStyle as "analyst" | "casual" | "stats")
      : "casual",
  };

  try {
    const commentary = await generateCommentary(safe);
    return NextResponse.json(
      { commentary },
      {
        headers: {
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
        },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[commentary] generation failed:", message);
    return NextResponse.json({ error: "Failed to generate commentary" }, { status: 500 });
  }
}
