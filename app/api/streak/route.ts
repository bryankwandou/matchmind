import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Leaderboard store. Module-level map survives warm invocations on the same
// instance; the client also keeps its own streak in localStorage, so a cold
// start never loses the user's personal count — only re-ranks the board.
type Entry = { wallet: string; streak: number; best: number; updatedAt: number };

const g = globalThis as unknown as { __mmStreaks?: Map<string, Entry> };
const STORE: Map<string, Entry> = g.__mmStreaks ?? new Map();
g.__mmStreaks = STORE;

function isPlausibleWallet(w: unknown): w is string {
  return typeof w === "string" && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w);
}

export async function GET() {
  const board = [...STORE.values()]
    .sort((a, b) => b.streak - a.streak || b.best - a.best)
    .slice(0, 20)
    .map((e) => ({
      wallet: e.wallet.slice(0, 4) + "…" + e.wallet.slice(-4),
      streak: e.streak,
      best: e.best,
    }));
  return NextResponse.json({ board });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }
  const { wallet, streak, best } = (body ?? {}) as Record<string, unknown>;

  if (!isPlausibleWallet(wallet)) {
    return NextResponse.json({ error: "wallet required" }, { status: 400 });
  }
  const s = Math.max(0, Math.min(Number(streak) || 0, 10000));
  const b = Math.max(s, Math.min(Number(best) || 0, 10000));

  STORE.set(wallet, { wallet, streak: s, best: b, updatedAt: Date.now() });
  return NextResponse.json({ ok: true });
}
