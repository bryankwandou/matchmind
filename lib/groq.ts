import Groq from "groq-sdk";

let _groq: Groq | null = null;
function getGroq(): Groq {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? "" });
  return _groq;
}

export type MatchEvent = {
  type: "goal" | "red_card" | "yellow_card" | "odds_shift" | "substitution" | "penalty" | "var";
  minute: number;
  team: string;
  player?: string;
  detail?: string;
  oddsBefore?: number;
  oddsAfter?: number;
  score?: { home: number; away: number };
};

export type CommentaryRequest = {
  event: MatchEvent;
  matchContext: {
    homeTeam: string;
    awayTeam: string;
    score: { home: number; away: number };
    minute: number;
    competition: string;
    kickoff?: string; // ISO start time, lets the AI answer kickoff/timezone questions
    status?: string;
  };
  userTeam?: string;
  language?: string;
  pundtStyle?: "analyst" | "casual" | "stats";
};

export async function generateCommentary(req: CommentaryRequest): Promise<string> {
  const { event, matchContext, userTeam, pundtStyle = "casual" } = req;

  const styleGuide = {
    analyst: "Write like a calm, data-focused football analyst. Reference odds movements, tactical context, and historical precedent. Keep it under 3 sentences.",
    casual: "Write like a knowledgeable friend watching the match. Conversational, direct, no jargon. Under 3 sentences.",
    stats: "Lead with the key number or stat. Follow with one sentence of context. Under 2 sentences.",
  };

  const oddsContext = event.oddsBefore && event.oddsAfter
    ? `The market moved: ${event.oddsBefore} → ${event.oddsAfter} for ${matchContext.homeTeam}.`
    : "";

  const teamAngle = userTeam
    ? `The user supports ${userTeam}. Frame the analysis from their perspective.`
    : "";

  const isQuestion = event.type === "goal" && event.player && event.player === event.detail;

  // The only facts the model is allowed to treat as true.
  const known = [
    `Fixture: ${matchContext.homeTeam} vs ${matchContext.awayTeam}`,
    `Score: ${matchContext.homeTeam} ${matchContext.score.home}, ${matchContext.awayTeam} ${matchContext.score.away}`,
    `Clock: ${event.minute}'`,
    `Competition: ${matchContext.competition}`,
    matchContext.status ? `Status: ${matchContext.status}` : "",
    matchContext.kickoff ? `Kickoff (UTC): ${matchContext.kickoff}` : "",
    event.detail && !isQuestion ? `Latest event: ${event.type.replace(/_/g, " ")} — ${event.player || "unknown"} (${event.team})` : "",
    oddsContext,
  ].filter(Boolean).join("\n");

  // Shared guardrails — the fix for hallucinated players and off-topic replies.
  const guard = `Ground rules:
- Use only the facts in KNOWN below. Do not invent player names, minutes, cards, or stats that are not listed. The feed gives team scores, not per-player breakdowns, so if you are asked which player did something and it is not in KNOWN, say the feed does not name individual scorers.
- If a request asks you to insult, mock, or demean anyone, decline in one short line and offer a factual read instead.
- The Kickoff time in KNOWN is UTC. If asked when the match starts in a place or timezone, convert it and give the local time — this is arithmetic, not a guess.
- Reply in the same language the user wrote in.
- No emojis. No hype words. Lead with the fact, then what it means.`;

  const system = isQuestion
    ? `You answer questions about one live football match for a fan watching it. Be specific and never guess.`
    : `You write one short, real-time note about a football match event for a fan watching it.`;

  const user = isQuestion
    ? `KNOWN:\n${known}\n\nThe fan asks:\n"${event.player}"\n\n${guard}\n\nAnswer in 2-3 sentences.`
    : `KNOWN:\n${known}\n${teamAngle ? "\n" + teamAngle : ""}\n\nStyle: ${styleGuide[pundtStyle]}\n\n${guard}`;

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    max_tokens: 220,
    temperature: 0.4,
  });

  return completion.choices[0]?.message?.content ?? "No commentary available.";
}

export async function generateMatchPreview(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  drawOdds: number
): Promise<string> {
  const prompt = `Write a 2-sentence pre-match summary for ${homeTeam} vs ${awayTeam}.
Odds: ${homeTeam} ${homeOdds} | Draw ${drawOdds} | ${awayTeam} ${awayOdds}.
Be direct. No filler words. No emojis. Focus on what the odds tell us about how the market sees this game.`;

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
    temperature: 0.6,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export type RoastRequest = {
  homeTeam: string;
  awayTeam: string;
  pickLabel: string; // e.g. "Colombia" or "Draw" — the team/side name the caller backed
  result: "win" | "loss";
  priceTaken: number;
  finalScore: { home: number; away: number };
  streak: number;
};

// Roasts the CALL, never a real player or team — self-directed gambling banter,
// the same "bad beat" tradition as poker/betting group chats.
export async function generateRoast(req: RoastRequest): Promise<string> {
  const { homeTeam, awayTeam, pickLabel, result, priceTaken, finalScore, streak } = req;

  const known = [
    `Fixture: ${homeTeam} vs ${awayTeam}`,
    `Final score: ${homeTeam} ${finalScore.home} - ${finalScore.away} ${awayTeam}`,
    `The call: ${pickLabel} at ${priceTaken.toFixed(2)}`,
    `Outcome: ${result === "win" ? "correct" : "wrong"}`,
    `Current streak: ${streak}`,
  ].join("\n");

  const guard = `Ground rules:
- Roast the CALL and the caller's judgement only — never a real player, coach, or team's ability. No player or team put-downs.
- No emojis. No hashtags. One or two sentences, sharp and quotable.
- If you cannot roast without naming or mocking a real person, write a dry one-liner about the odds instead.
- Reply in English.`;

  const tone = result === "win"
    ? "Write a backhanded compliment — congratulate the call while needling how obvious or lucky it looked in hindsight."
    : "Write a short, funny roast of the call itself — the reasoning that led to it, the confidence, the price taken. Self-deprecating bettor humor, not cruelty.";

  const user = `KNOWN:\n${known}\n\n${tone}\n\n${guard}`;

  const completion = await getGroq().chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: user }],
    max_tokens: 90,
    temperature: 0.85,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export { getGroq as groq };
