import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generateDirectoryStub } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { topic } = await req.json().catch(() => ({}));
  if (!topic || typeof topic !== "string" || topic.trim().length < 2) {
    return NextResponse.json({ error: "topic is required." }, { status: 400 });
  }

  try {
    const stub = await generateDirectoryStub(topic.trim());
    return NextResponse.json(stub);
  } catch (err: any) {
    console.error("[directory/generate]", err);
    return NextResponse.json(
      { error: err?.message ?? "AI generation failed. Please try again." },
      { status: 500 }
    );
  }
}
