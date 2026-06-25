import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

  const prompt = `You are a football pundit providing real-time match commentary.

Match: ${matchContext.homeTeam} ${matchContext.score.home}-${matchContext.score.away} ${matchContext.awayTeam}
Minute: ${event.minute}'
Competition: ${matchContext.competition}
Event: ${event.type.replace("_", " ")} — ${event.player || ""} (${event.team})
${event.detail ? `Detail: ${event.detail}` : ""}
${oddsContext}
${teamAngle}

Style instruction: ${styleGuide[pundtStyle]}

Rules:
- No filler phrases like "exciting" or "fascinating"
- No emojis
- Write in plain, direct English
- Start with the fact, then the meaning`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 200,
    temperature: 0.7,
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

  const completion = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 120,
    temperature: 0.6,
  });

  return completion.choices[0]?.message?.content ?? "";
}

export { groq };
