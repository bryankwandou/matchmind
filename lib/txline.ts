// Devnet free tier (txline-dev) is the default; override with TXLINE_BASE_URL for mainnet.
const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline-dev.txodds.com/api";
const TXLINE_KEY  = process.env.TXLINE_API_KEY ?? "";

export const HAS_TXLINE_KEY = !!process.env.TXLINE_API_KEY;

// Guest auth lives on the same host as the API base (txline-dev for devnet).
const TXLINE_HOST = TXLINE_BASE.replace(/\/api\/?$/, "");

// Guest JWT — refreshed lazily, cached until close to expiry
let _guestJwt: string | null = null;
let _guestJwtAt = 0;
const JWT_TTL_MS = 24 * 60 * 60 * 1000; // refresh every 24 hours (JWT lasts 30 days)

async function getGuestJwt(): Promise<string> {
  if (_guestJwt && Date.now() - _guestJwtAt < JWT_TTL_MS) return _guestJwt;
  try {
    const r = await fetch(`${TXLINE_HOST}/auth/guest/start`, { method: "POST" });
    const body = await r.json();
    _guestJwt = (body.token as string) ?? "";
    _guestJwtAt = Date.now();
  } catch {
    _guestJwt = "";
  }
  return _guestJwt ?? "";
}

async function txFetch<T>(path: string, ttl = 30): Promise<T> {
  const jwt = await getGuestJwt();
  // Per TxLINE docs: Authorization: Bearer <guest_jwt>, X-Api-Token: <activated_token>
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(jwt && { Authorization: `Bearer ${jwt}` }),
    ...(TXLINE_KEY && { "X-Api-Token": TXLINE_KEY }),
  };
  // Fallback: if no guest JWT, use API key as bearer (some endpoints accept this)
  if (!jwt && TXLINE_KEY) {
    headers["Authorization"] = `Bearer ${TXLINE_KEY}`;
  }

  const res = await fetch(`${TXLINE_BASE}${path}`, {
    headers,
    next: { revalidate: ttl },
  });

  if (!res.ok) throw new Error(`TxLINE ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export type TxMatch = {
  id: string;
  homeTeam: { name: string; code: string };
  awayTeam: { name: string; code: string };
  score: { home: number; away: number };
  minute: number;
  status: "pre" | "live" | "ht" | "ft";
  stage: string;
  startTime: string;
  odds: {
    home: number;
    draw: number;
    away: number;
  };
};

export type TxEvent = {
  id: string;
  matchId: string;
  type: string;
  minute: number;
  team: string;
  player: string;
  detail: string;
  timestamp: string;
};

// ── Raw TxLINE shapes (PascalCase, as returned by txline-dev/txline) ──────────
type TxFixtureRaw = {
  FixtureId: number;
  Participant1: string;
  Participant2: string;
  Participant1Id: number;
  Participant2Id: number;
  Competition: string;
  CompetitionId: number;
  StartTime: number;        // epoch ms
  Participant1IsHome: boolean;
};

type TxScoreRaw = {
  FixtureId: number;
  GameState?: string;
  StatusId?: number;
  Clock?: { Running?: boolean; Seconds?: number };
  // Stats keyed by the soccer-feed encoding: "1" = P1 goals, "2" = P2 goals
  Stats?: Record<string, number>;
};

const LIVE_WINDOW_MS = 2.5 * 60 * 60 * 1000; // a match stays "live" for 2.5h after kickoff

// Build a 3-letter code from a team name (e.g. "Netherlands" -> "NET").
function teamCode(name: string): string {
  const clean = name.replace(/[^A-Za-z ]/g, "").trim();
  if (clean.length <= 3) return clean.toUpperCase();
  return clean.slice(0, 3).toUpperCase();
}

function deriveStatus(startMs: number, clock?: TxScoreRaw["Clock"]): TxMatch["status"] {
  if (clock?.Running && (clock.Seconds ?? 0) > 0) return "live";
  const now = Date.now();
  if (now < startMs) return "pre";
  if (now < startMs + LIVE_WINDOW_MS) return "live";
  return "ft";
}

// Pull goals + minute from the latest score update for a fixture.
function readScore(updates: TxScoreRaw[], p1IsHome: boolean) {
  if (!Array.isArray(updates) || updates.length === 0) return null;
  const last = updates[updates.length - 1];
  const s = last.Stats ?? {};
  const p1Goals = Number(s["1"] ?? 0);
  const p2Goals = Number(s["2"] ?? 0);
  return {
    home: p1IsHome ? p1Goals : p2Goals,
    away: p1IsHome ? p2Goals : p1Goals,
    minute: Math.floor((last.Clock?.Seconds ?? 0) / 60),
    clock: last.Clock,
    gameState: last.GameState,
  };
}

function fixtureToMatch(f: TxFixtureRaw, score?: ReturnType<typeof readScore>): TxMatch {
  const home = f.Participant1IsHome ? f.Participant1 : f.Participant2;
  const away = f.Participant1IsHome ? f.Participant2 : f.Participant1;
  return {
    id: String(f.FixtureId),
    homeTeam: { name: home, code: teamCode(home) },
    awayTeam: { name: away, code: teamCode(away) },
    score: { home: score?.home ?? 0, away: score?.away ?? 0 },
    minute: score?.minute ?? 0,
    status: deriveStatus(f.StartTime, score?.clock),
    stage: f.Competition,
    startTime: new Date(f.StartTime).toISOString(),
    // Devnet free tier does not price every tie; expose 0 and let the UI show a dash.
    odds: { home: 0, draw: 0, away: 0 },
  };
}

// /api/fixtures/snapshot — every World Cup & Friendly fixture on the feed.
export async function getFixturesSnapshot(): Promise<TxFixtureRaw[]> {
  return txFetch<TxFixtureRaw[]>("/fixtures/snapshot", 60);
}

// /api/scores/snapshot/{id} — the run of score updates for one fixture.
export async function getScoresFor(fixtureId: string | number): Promise<TxScoreRaw[]> {
  return txFetch<TxScoreRaw[]>(`/scores/snapshot/${fixtureId}`, 10);
}

// /api/odds/snapshot/{id} — price history for one fixture (often empty on devnet).
export async function getOddsFor(fixtureId: string | number): Promise<unknown[]> {
  return txFetch<unknown[]>(`/odds/snapshot/${fixtureId}`, 5);
}

// Full list: real fixtures, enriched with live score where the feed has one.
export async function getLiveMatches(): Promise<TxMatch[]> {
  const fixtures = await getFixturesSnapshot();
  const enriched = await Promise.all(
    fixtures.map(async (f) => {
      try {
        const updates = await getScoresFor(f.FixtureId);
        return fixtureToMatch(f, readScore(updates, f.Participant1IsHome));
      } catch {
        return fixtureToMatch(f);
      }
    })
  );
  // Live first, then upcoming by kickoff, then finished.
  const rank = { live: 0, pre: 1, ht: 0, ft: 2 } as Record<TxMatch["status"], number>;
  return enriched.sort((a, b) => {
    const r = rank[a.status] - rank[b.status];
    if (r !== 0) return r;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

// One match with a synthetic event log derived from the real score updates.
export async function getMatchById(fixtureId: string): Promise<{ match: TxMatch; events: TxEvent[] } | null> {
  const fixtures = await getFixturesSnapshot();
  const f = fixtures.find((x) => String(x.FixtureId) === String(fixtureId));
  if (!f) return null;

  let updates: TxScoreRaw[] = [];
  try {
    updates = await getScoresFor(f.FixtureId);
  } catch {
    updates = [];
  }
  const score = readScore(updates, f.Participant1IsHome);
  const match = fixtureToMatch(f, score);

  // Turn the goal counts into a readable event list (kickoff + each goal).
  const events: TxEvent[] = [
    { id: `${f.FixtureId}-ko`, matchId: match.id, type: "kickoff", minute: 0, team: "home", player: "—", detail: "", timestamp: match.startTime },
  ];
  const totalGoals = (score?.home ?? 0) + (score?.away ?? 0);
  for (let i = 0; i < Math.min(totalGoals, 10); i++) {
    const homeSide = i < (score?.home ?? 0);
    events.push({
      id: `${f.FixtureId}-g${i}`,
      matchId: match.id,
      type: "goal",
      minute: Math.max(1, Math.round(((i + 1) / (totalGoals + 1)) * Math.max(match.minute, 90))),
      team: homeSide ? "home" : "away",
      player: homeSide ? match.homeTeam.name : match.awayTeam.name,
      detail: "",
      timestamp: match.startTime,
    });
  }
  return { match, events };
}

export async function getMatchEvents(matchId: string): Promise<TxEvent[]> {
  const r = await getMatchById(matchId);
  return r?.events ?? [];
}

export async function getAllMatches(): Promise<TxMatch[]> {
  return getLiveMatches();
}

// Mock data for demo/dev when API key is not set
export const MOCK_MATCHES: TxMatch[] = [
  {
    id: "m001",
    homeTeam: { name: "Argentina", code: "ARG" },
    awayTeam: { name: "France", code: "FRA" },
    score: { home: 1, away: 0 },
    minute: 34,
    status: "live",
    stage: "Quarter-Final",
    startTime: new Date().toISOString(),
    odds: { home: 1.95, draw: 3.40, away: 3.80 },
  },
  {
    id: "m002",
    homeTeam: { name: "Brazil", code: "BRA" },
    awayTeam: { name: "Germany", code: "GER" },
    score: { home: 0, away: 0 },
    minute: 0,
    status: "pre",
    stage: "Quarter-Final",
    startTime: new Date(Date.now() + 3600000).toISOString(),
    odds: { home: 2.10, draw: 3.20, away: 3.50 },
  },
  {
    id: "m003",
    homeTeam: { name: "Spain", code: "ESP" },
    awayTeam: { name: "England", code: "ENG" },
    score: { home: 2, away: 1 },
    minute: 78,
    status: "live",
    stage: "Semi-Final",
    startTime: new Date().toISOString(),
    odds: { home: 1.40, draw: 4.50, away: 7.00 },
  },
];
