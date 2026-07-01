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
    event.detail && !isQuestion ? `Latest event: ${event.type.replace(/_/g, " ")} — ${event.player || "unknown"} (${event.team})` : "",
    oddsContext,
  ].filter(Boolean).join("\n");

  // Shared guardrails — the fix for hallucinated players and off-topic replies.
  const guard = `Ground rules:
- Use only the facts in KNOWN below. Do not invent player names, minutes, cards, or stats that are not listed. The feed gives team scores, not per-player breakdowns, so if you are asked which player did something and it is not in KNOWN, say the feed does not name individual scorers.
- If a request asks you to insult, mock, or demean anyone, decline in one short line and offer a factual read instead.
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

export { getGroq as groq };
