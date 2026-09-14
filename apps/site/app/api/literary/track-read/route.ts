import { NextRequest, NextResponse } from "next/server";
import {
  LITERARY_READS_COOKIE,
  LITERARY_READ_WINDOW_MS,
  isCrawlerUserAgent,
  parseReadsCookie,
} from "@/lib/literary-access";

/**
 * Records a free anonymous read against the metered quota (see
 * LITERARY_FREE_READ_LIMIT in literary-access.ts). Called client-side,
 * fire-and-forget, after a Literary piece page mounts — a Server Component
 * can't set a cookie during render, only a Route Handler/Server Action can,
 * so metering is written here rather than in page.tsx itself.
 *
 * Re-reading a piece already counted this window doesn't cost another
 * credit (dedup by slug). Logged-in/verified readers never call this —
 * LiteraryPieceGate only fires it for genuinely anonymous, unmetered reads.
 */
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent");
  if (isCrawlerUserAgent(userAgent)) {
    return NextResponse.json({ count: 0 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const slug = typeof body?.slug === "string" ? body.slug.trim() : "";
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  const existing = parseReadsCookie(request.cookies.get(LITERARY_READS_COOKIE)?.value);
  const alreadyCounted = existing.some((e) => e.slug === slug);
  const updated = alreadyCounted
    ? existing
    : [...existing, { slug, ts: Date.now() }].slice(-50);

  const response = NextResponse.json({ count: updated.length });
  response.cookies.set(LITERARY_READS_COOKIE, JSON.stringify(updated), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(LITERARY_READ_WINDOW_MS / 1000),
  });
  return response;
}
