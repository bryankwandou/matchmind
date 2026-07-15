// The Booth — MatchMind's commentary is delivered by a squad of named
// agents, not one anonymous "AI". Same grounding rules for all of them;
// what differs is the beat each one owns and the voice it uses.

export type AgentId = "scout" | "chalk" | "roastmaster";

export type Agent = {
  id: AgentId;
  name: string;
  beat: string;      // what this agent covers, shown in the chip tooltip
  initial: string;   // avatar mark letter
  color: string;     // accent for avatar + typing dots
};

export const BOOTH: Record<AgentId, Agent> = {
  scout: {
    id: "scout",
    name: "Scout",
    beat: "watches the TxLINE feed — goals, cards, momentum",
    initial: "S",
    color: "var(--green)",
  },
  chalk: {
    id: "chalk",
    name: "The Chalk",
    beat: "reads the market — prices, drifts, what the books think",
    initial: "C",
    color: "#00c4ff",
  },
  roastmaster: {
    id: "roastmaster",
    name: "Roastmaster",
    beat: "post-match verdicts on your calls, win or lose",
    initial: "R",
    color: "var(--orange)",
  },
};

const PRICE_WORDS = /\b(odds|price|drift|market|1x2|line|value|payout|shorten|lengthen|favou?rite)\b/i;

// Route a message to the agent whose beat it belongs to.
// Odds shifts and price questions go to The Chalk; everything the pitch
// produces goes to Scout. Roastmaster only ever speaks through RoastCard.
export function agentFor(opts: { eventType?: string; question?: string }): Agent {
  if (opts.eventType && /odds|drift|price/i.test(opts.eventType)) return BOOTH.chalk;
  if (opts.question && PRICE_WORDS.test(opts.question)) return BOOTH.chalk;
  return BOOTH.scout;
}
