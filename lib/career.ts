// Caller Career — the division ladder. Reputation, not wagering: divisions
// are earned purely from the best streak already tracked in localStorage,
// so no new storage and nothing to migrate.

export type Division = {
  name: string;
  minBest: number;   // best-streak needed to hold this division
  color: string;
  short: string;     // crest letters
};

// Ordered low → high. divisionFor() walks it backwards.
export const DIVISIONS: Division[] = [
  { name: "Sunday League", minBest: 0,  color: "#8a97a8", short: "SL" },
  { name: "Non-League",    minBest: 3,  color: "#c9884a", short: "NL" },
  { name: "Championship",  minBest: 5,  color: "#9fb6c9", short: "CH" },
  { name: "World Class",   minBest: 10, color: "#f5c842", short: "WC" },
  { name: "Legend",        minBest: 25, color: "#b899ff", short: "LG" },
];

export function divisionFor(best: number): Division {
  for (let i = DIVISIONS.length - 1; i >= 0; i--) {
    if (best >= DIVISIONS[i].minBest) return DIVISIONS[i];
  }
  return DIVISIONS[0];
}

export function nextDivision(best: number): Division | null {
  const idx = DIVISIONS.findIndex((d) => best < d.minBest);
  return idx === -1 ? null : DIVISIONS[idx];
}

// 0..1 progress from the current division floor to the next one's gate.
export function progressToNext(best: number): number {
  const cur = divisionFor(best);
  const nxt = nextDivision(best);
  if (!nxt) return 1;
  return Math.min(1, (best - cur.minBest) / (nxt.minBest - cur.minBest));
}
