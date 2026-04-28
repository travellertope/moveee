/**
 * POST /api/pulse/comments
 *
 * Proxies comment submissions to the WordPress REST API.
 * Includes a honeypot check to silently reject bot submissions.
 */

import { NextRequest, NextResponse } from "next/server";
import { postPulseComment } from "@/lib/pulse-wordpress";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { postId, authorName, authorEmail, content, website } = body;

  // Honeypot — bots fill the hidden "website" field; real users leave it empty.
  if (website) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  if (!postId || !authorName || !authorEmail || !content) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const trimmed = String(content).trim();
  if (trimmed.length < 3 || trimmed.length > 1000) {
    return NextResponse.json(
      { error: "Comment must be between 3 and 1000 characters" },
      { status: 400 }
    );
  }

  // Basic email format check.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(authorEmail))) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    const comment = await postPulseComment({
      postId: Number(postId),
      authorName: String(authorName).trim().slice(0, 100),
      authorEmail: String(authorEmail).trim(),
      content: trimmed,
    });
    return NextResponse.json({ success: true, comment });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to post comment" }, { status: 500 });
  }
}
