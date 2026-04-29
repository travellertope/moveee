/**
 * POST /api/pulse/refresh?secret=...
 *
 * Calls Gemini with Google Search grounding to surface fresh cultural stories,
 * then saves them to WordPress as pulse_story posts.
 *
 * Protected by PULSE_REFRESH_SECRET query param.
 * Configured in vercel.json to run at 06:00, 12:00, and 18:00 UTC daily.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiPulseStories } from "@/lib/pulse-gemini";
import { savePulseStory } from "@/lib/pulse-wordpress";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const configuredSecret = process.env.PULSE_REFRESH_SECRET ?? "";
  const querySecret = req.nextUrl.searchParams.get("secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  // Accept either query param (admin UI) or Authorization header (Vercel cron).
  const validQuery = configuredSecret && querySecret === configuredSecret;
  const validBearer = configuredSecret && authHeader === `Bearer ${configuredSecret}`;

  if (!validQuery && !validBearer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const topic: string = body.topic || "African and Black diaspora culture news";

  try {
    const stories = await fetchGeminiPulseStories(topic);

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
      topic,
      total: stories.length,
      saved,
      duplicates,
      errors,
      ...(errorMessages.length > 0 && { errorSample: errorMessages.slice(0, 3) }),
    });
  } catch (err: any) {
    console.error("[pulse/refresh] Error:", err?.message);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
