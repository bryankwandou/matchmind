const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline.txodds.com/api";
const TXLINE_KEY  = process.env.TXLINE_API_KEY ?? "";

export const HAS_TXLINE_KEY = !!process.env.TXLINE_API_KEY;

// Guest JWT — refreshed lazily, cached until close to expiry
let _guestJwt: string | null = null;
let _guestJwtAt = 0;
const JWT_TTL_MS = 24 * 60 * 60 * 1000; // refresh every 24 hours (JWT lasts 30 days)

async function getGuestJwt(): Promise<string> {
  if (_guestJwt && Date.now() - _guestJwtAt < JWT_TTL_MS) return _guestJwt;
  try {
    const r = await fetch("https://txline.txodds.com/auth/guest/start", { method: "POST" });
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

// /api/fixtures/snapshot — all available World Cup fixtures
export async function getFixturesSnapshot(): Promise<TxMatch[]> {
  return txFetch<TxMatch[]>("/fixtures/snapshot", 60);
}

// /api/scores/snapshot — current scores for all live matches
export async function getScoresSnapshot(): Promise<TxMatch[]> {
  return txFetch<TxMatch[]>("/scores/snapshot", 10);
}

// /api/odds/live/{fixtureId} — real-time odds for a specific fixture
export async function getLiveOdds(fixtureId: string) {
  return txFetch(`/odds/live/${fixtureId}`, 5);
}

// Combined: get all matches (fixtures with score overlay)
export async function getLiveMatches(): Promise<TxMatch[]> {
  return getFixturesSnapshot();
}

export async function getMatchEvents(matchId: string): Promise<TxEvent[]> {
  return txFetch<TxEvent[]>(`/scores/history/${matchId}`, 30);
}

export async function getMatchOdds(matchId: string) {
  return getLiveOdds(matchId);
}

export async function getAllMatches(): Promise<TxMatch[]> {
  return getFixturesSnapshot();
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
