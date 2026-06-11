import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDirectoryStub } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "AI service not configured. Set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  let body: { topic?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const topic = (body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic is required." }, { status: 400 });
  }
  if (topic.length > 120) {
    return NextResponse.json(
      { error: "topic must be 120 characters or fewer." },
      { status: 400 }
    );
  }

  try {
    const stub = await generateDirectoryStub(topic);
    return NextResponse.json(stub);
  } catch (err: any) {
    console.error("[directory/generate] Gemini error:", err?.message ?? err);
    return NextResponse.json(
      { error: "Generation failed. Please try again." },
      { status: 502 }
    );
  }
}
