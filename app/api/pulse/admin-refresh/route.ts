/**
 * POST /api/pulse/admin-refresh
 *
 * Session-authenticated refresh endpoint for the editorial admin UI.
 * Any logged-in user whose email appears in PULSE_ADMIN_EMAILS (comma-separated)
 * may trigger a refresh. If PULSE_ADMIN_EMAILS is not set, any authenticated
 * session is accepted (suitable for private/beta deployments).
 *
 * Cron jobs use the separate /api/pulse/refresh endpoint with secret auth.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { fetchGeminiPulseStories } from "@/lib/pulse-gemini";
import { savePulseStory } from "@/lib/pulse-wordpress";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to access Pulse Admin." }, { status: 401 });
  }

  // Optional email allowlist — if set, only those addresses may trigger refresh.
  const allowlist = process.env.PULSE_ADMIN_EMAILS;
  if (allowlist) {
    const allowed = allowlist.split(",").map((e) => e.trim().toLowerCase());
    if (!allowed.includes(session.user.email.toLowerCase())) {
      return NextResponse.json({ error: "Your account is not authorised for Pulse Admin." }, { status: 403 });
    }
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  void body; // topic no longer used — stories sourced from RSS feeds

  try {
    const stories = await fetchGeminiPulseStories();
    const results = await Promise.allSettled(stories.map((s) => savePulseStory(s)));

    let saved = 0, duplicates = 0, errors = 0;
    const errorMessages: string[] = [];

    for (const r of results) {
      if (r.status === "rejected") {
        errors++;
        errorMessages.push(String(r.reason?.message ?? r.reason));
      } else {
        if (r.value.status === "saved")     saved++;
        if (r.value.status === "duplicate") duplicates++;
        if (r.value.status === "error") {
          errors++;
          errorMessages.push(r.value.message);
        }
      }
    }

    return NextResponse.json({
      success: true,
      total: stories.length,
      saved,
      duplicates,
      errors,
      ...(errorMessages.length > 0 && { errorSample: errorMessages.slice(0, 3) }),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
