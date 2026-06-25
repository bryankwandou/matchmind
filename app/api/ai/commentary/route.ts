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

function validateBody(body: unknown): body is CommentaryRequest {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (!b.event || typeof b.event !== "object") return false;
  if (!b.matchContext || typeof b.matchContext !== "object") return false;
  const ev = b.event as Record<string, unknown>;
  if (!ALLOWED_EVENT_TYPES.has(ev.type as string)) return false;
  if (typeof ev.minute !== "number" || ev.minute < 0 || ev.minute > 130) return false;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limit: 20 requests per IP per minute
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

  // Sanitize all string fields before they reach the LLM prompt
  const safe: CommentaryRequest = {
    event: {
      type: body.event.type,
      minute: body.event.minute,
      team: sanitize(body.event.team),
      player: sanitize(body.event.player),
      detail: sanitize(body.event.detail),
      oddsBefore: typeof body.event.oddsBefore === "number" ? body.event.oddsBefore : undefined,
      oddsAfter: typeof body.event.oddsAfter === "number" ? body.event.oddsAfter : undefined,
      score: body.event.score,
    },
    matchContext: {
      homeTeam: sanitize((body.matchContext as Record<string, unknown>).homeTeam),
      awayTeam: sanitize((body.matchContext as Record<string, unknown>).awayTeam),
      score: (body.matchContext as CommentaryRequest["matchContext"]).score,
      minute: (body.matchContext as CommentaryRequest["matchContext"]).minute,
      competition: sanitize((body.matchContext as Record<string, unknown>).competition),
    },
    userTeam: sanitize(body.userTeam),
    language: sanitize(body.language, 20),
    pundtStyle: ALLOWED_PUNDIT_STYLES.has(body.pundtStyle as string)
      ? (body.pundtStyle as "analyst" | "casual" | "stats")
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
