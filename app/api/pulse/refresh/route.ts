/**
 * GET/POST /api/pulse/refresh?secret=...
 *
 * Calls Gemini with Google Search grounding to surface fresh cultural stories,
 * then saves them to WordPress as pulse_story posts.
 *
 * GET  — invoked by Vercel cron (Authorization: Bearer {PULSE_REFRESH_SECRET}).
 * POST — invoked manually; accepts { topic } in request body.
 *
 * Protected by PULSE_REFRESH_SECRET query param or Authorization header.
 * Configured in vercel.json to run daily at 08:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiPulseStories } from "@/lib/pulse-gemini";
import { savePulseStory } from "@/lib/pulse-wordpress";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const configuredSecret = process.env.PULSE_REFRESH_SECRET ?? "";
  if (!configuredSecret) return false;
  const querySecret = req.nextUrl.searchParams.get("secret") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  return querySecret === configuredSecret || authHeader === `Bearer ${configuredSecret}`;
}

async function run(topic: string) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

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

const DEFAULT_TOPIC = "African and Black diaspora culture news";

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return run(DEFAULT_TOPIC);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  return run(body.topic || DEFAULT_TOPIC);
}
