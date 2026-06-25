import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline.txodds.com/api";
const TXLINE_KEY = process.env.TXLINE_API_KEY ?? "";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!TXLINE_KEY) {
    // Mock odds response
    return NextResponse.json({
      fixtureId: id,
      source: "mock",
      markets: {
        "1X2": {
          home: 1.95 + Math.random() * 0.1 - 0.05,
          draw: 3.40 + Math.random() * 0.2 - 0.1,
          away: 3.80 + Math.random() * 0.2 - 0.1,
        },
        btts: { yes: 1.72, no: 2.05 },
        overUnder: { over25: 1.65, under25: 2.20 },
      },
      updatedAt: new Date().toISOString(),
    });
  }

  try {
    const res = await fetch(`${TXLINE_BASE}/odds/live/${id}`, {
      headers: { Authorization: `Bearer ${TXLINE_KEY}` },
      next: { revalidate: 10 },
    });
    if (!res.ok) throw new Error(`TxLINE odds ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ ...data, source: "live" });
  } catch (err) {
    return NextResponse.json({ error: String(err), source: "error" }, { status: 502 });
  }
}
