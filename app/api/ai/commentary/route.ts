import { NextRequest, NextResponse } from "next/server";
import { generateCommentary, type CommentaryRequest } from "@/lib/groq";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CommentaryRequest;

    if (!body.event || !body.matchContext) {
      return NextResponse.json({ error: "Missing event or matchContext" }, { status: 400 });
    }

    const commentary = await generateCommentary(body);
    return NextResponse.json({ commentary });
  } catch (err) {
    console.error("Commentary generation error:", err);
    return NextResponse.json({ error: "Failed to generate commentary" }, { status: 500 });
  }
}
