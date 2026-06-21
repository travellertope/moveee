/**
 * GET/POST /api/pulse/refresh?secret=...
 *
 * Fetches fresh articles from 40+ RSS feeds across global culture
 * media, then uses Gemini (no grounding — free tier compatible) to select
 * and editorially rewrite the most culturally relevant stories, saving them
 * to WordPress as pulse_story posts.
 *
 * GET  — invoked by Vercel cron (Authorization: Bearer {PULSE_REFRESH_SECRET}).
 * POST — invoked manually from the admin panel.
 *
 * Protected by PULSE_REFRESH_SECRET query param or Authorization header.
 * Configured in vercel.json to run daily at 08:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchGeminiPulseStories } from "@/lib/pulse-gemini";
import { savePulseStory } from "@/lib/pulse-wordpress";

export const runtime    = "nodejs";
export const maxDuration = 120; // bumped — RSS fetching + Gemini rewrite needs more time

function isAuthorized(req: NextRequest): boolean {
  const pulseSecret = process.env.PULSE_REFRESH_SECRET ?? "";
  const cronSecret  = process.env.CRON_SECRET ?? "";
  const querySecret = req.nextUrl.searchParams.get("secret") ?? "";
  const authHeader  = req.headers.get("Authorization") ?? "";

  if (pulseSecret && (querySecret === pulseSecret || authHeader === `Bearer ${pulseSecret}`)) return true;
  if (cronSecret  && authHeader === `Bearer ${cronSecret}`) return true;
  return false;
}

async function run() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const stories = await fetchGeminiPulseStories();
    const results = await Promise.allSettled(stories.map(s => savePulseStory(s)));

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
    console.error("[pulse/refresh] Error:", err?.message);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return run();
}
