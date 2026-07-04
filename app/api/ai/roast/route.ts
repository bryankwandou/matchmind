import { NextRequest, NextResponse } from "next/server";
import { generateRoast, type RoastRequest } from "@/lib/groq";
import { rateLimitCheck, getClientIp } from "@/lib/rateLimit";

function sanitize(val: unknown, maxLen = 80): string {
  if (typeof val !== "string") return "";
  return val.replace(/[`<>{}]/g, "").slice(0, maxLen);
}

function validateBody(body: unknown): body is Record<string, unknown> {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  if (typeof b.homeTeam !== "string" || typeof b.awayTeam !== "string") return false;
  if (typeof b.pickLabel !== "string") return false;
  if (b.result !== "win" && b.result !== "loss") return false;
  if (typeof b.priceTaken !== "number") return false;
  const score = b.finalScore as { home?: unknown; away?: unknown } | undefined;
  if (!score || typeof score.home !== "number" || typeof score.away !== "number") return false;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetAt } = rateLimitCheck(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
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

  const score = body.finalScore as { home: number; away: number };
  const safe: RoastRequest = {
    homeTeam: sanitize(body.homeTeam),
    awayTeam: sanitize(body.awayTeam),
    pickLabel: sanitize(body.pickLabel, 40),
    result: body.result as "win" | "loss",
    priceTaken: Math.max(0, Math.min(Number(body.priceTaken) || 0, 999)),
    finalScore: { home: Math.max(0, Math.min(score.home, 30)), away: Math.max(0, Math.min(score.away, 30)) },
    streak: Math.max(0, Math.min(Number(body.streak) || 0, 10000)),
  };

  try {
    const roast = await generateRoast(safe);
    return NextResponse.json(
      { roast },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[roast] generation failed:", message);
    return NextResponse.json({ error: "Failed to generate roast" }, { status: 500 });
  }
}
