const TXLINE_BASE = process.env.TXLINE_BASE_URL ?? "https://txline.txodds.com/api";
const TXLINE_KEY = process.env.TXLINE_API_KEY ?? "";

async function txFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${TXLINE_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${TXLINE_KEY}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 30 },
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

export async function getLiveMatches(): Promise<TxMatch[]> {
  return txFetch<TxMatch[]>("/worldcup/matches/live");
}

export async function getMatchEvents(matchId: string): Promise<TxEvent[]> {
  return txFetch<TxEvent[]>(`/worldcup/matches/${matchId}/events`);
}

export async function getMatchOdds(matchId: string) {
  return txFetch(`/worldcup/matches/${matchId}/odds`);
}

export async function getAllMatches(): Promise<TxMatch[]> {
  return txFetch<TxMatch[]>("/worldcup/matches");
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
