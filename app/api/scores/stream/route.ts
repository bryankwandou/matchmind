import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Devnet free tier by default; override with TXLINE_BASE_URL for mainnet.
const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline-dev.txodds.com/api";
const TXLINE_KEY = process.env.TXLINE_API_KEY ?? "";
const TXLINE_HOST = TXLINE_BASE.replace(/\/api\/?$/, "");

// Fetch a guest JWT for the live stream (TxLINE needs Bearer JWT + X-Api-Token).
async function getGuestJwt(): Promise<string> {
  try {
    const r = await fetch(`${TXLINE_HOST}/auth/guest/start`, { method: "POST" });
    const body = await r.json();
    return (body.token as string) ?? "";
  } catch {
    return "";
  }
}

// Mock event generator for demo mode
const TEAMS = ["Argentina", "France", "Brazil", "Germany", "Spain", "England"];
const EVENT_TYPES = ["goal", "yellow_card", "substitution", "var"] as const;

function randomMockEvent() {
  const type = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
  const homeTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];
  const awayTeam = TEAMS.filter((t) => t !== homeTeam)[Math.floor(Math.random() * (TEAMS.length - 1))];
  return {
    id: `mock_${Date.now()}`,
    fixtureId: "m001",
    homeTeam,
    awayTeam,
    score: { home: Math.floor(Math.random() * 3), away: Math.floor(Math.random() * 3) },
    minute: Math.floor(Math.random() * 90) + 1,
    status: "live",
    event: { type, team: Math.random() > 0.5 ? homeTeam : awayTeam, player: "Player", detail: "" },
  };
}

export async function GET(req: NextRequest) {
  const hasKey = !!TXLINE_KEY;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown, eventName?: string) => {
        const id = `${Date.now()}:0`;
        let msg = `id: ${id}\n`;
        if (eventName) msg += `event: ${eventName}\n`;
        msg += `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(msg));
      };

      // Send initial heartbeat
      send({ Ts: Date.now() }, "heartbeat");

      if (hasKey) {
        // Proxy TxLINE real SSE stream (devnet free tier)
        try {
          const jwt = await getGuestJwt();
          const upstream = await fetch(`${TXLINE_BASE}/scores/stream`, {
            headers: {
              ...(jwt && { Authorization: `Bearer ${jwt}` }),
              "X-Api-Token": TXLINE_KEY,
              Accept: "text/event-stream",
              "Cache-Control": "no-cache",
            },
            signal: req.signal,
          });

          if (!upstream.ok || !upstream.body) {
            send({ error: "upstream unavailable" }, "error");
            controller.close();
            return;
          }

          const reader = upstream.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            // Forward raw SSE chunks directly
            if (value) controller.enqueue(value);
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            send({ error: "stream error" }, "error");
          }
        }
      } else {
        // Mock SSE — send a random event every 15 seconds
        let count = 0;
        const interval = setInterval(() => {
          count++;
          if (count % 4 === 0) {
            send({ Ts: Date.now() }, "heartbeat");
          } else {
            send(randomMockEvent());
          }
        }, 15000);

        // Clean up when client disconnects
        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });

        // Keep alive — send initial mock event immediately
        send(randomMockEvent());
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-store",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
