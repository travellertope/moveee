/**
 * GET/POST /api/pulse/refresh?secret=...
 *
 * Fetches fresh articles from 40+ RSS feeds across global culture
 * media, then uses Gemini (no grounding — free tier compatible) to select
 * and editorially rewrite the most culturally relevant stories, saving them
 * to WordPress as pulse_story posts.
 *
 * GET  — invoked by the external cron-job.org schedule ("moveee - pulse refresh"),
 *        Authorization: Bearer {PULSE_REFRESH_SECRET} or {CRON_SECRET}. cron-job.org
 *        is the live scheduler for this route, not Vercel cron — there is no
 *        vercel.json schedule. Responds 202 immediately and runs the actual
 *        refresh in the background via next/server's after() — cron-job.org's
 *        own request timeout (commonly 30s on its dashboard) is far shorter
 *        than this route's 120s maxDuration, so waiting on the full refresh
 *        synchronously made cron-job.org report false "Failed (timeout)"
 *        results even when the refresh completed fine server-side. This is
 *        also likely why the job showed "Inactive" (auto-disabled after
 *        repeated failures) on the dashboard as of 2026-06-21.
 * POST — invoked manually (e.g. via curl for debugging); still returns the
 *        refresh result synchronously since there's no external timeout
 *        involved.
 *
 * Protected by PULSE_REFRESH_SECRET query param or Authorization header.
 */

import { NextRequest, NextResponse, after } from "next/server";
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

async function runRefresh() {
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

  return {
    success: true,
    total: stories.length,
    saved,
    duplicates,
    errors,
    ...(errorMessages.length > 0 && { errorSample: errorMessages.slice(0, 3) }),
  };
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  after(() =>
    runRefresh().catch(err => console.error("[pulse/refresh] background error:", err?.message))
  );

  return NextResponse.json({ accepted: true }, { status: 202 });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 503 });
  }

  try {
    const result = await runRefresh();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[pulse/refresh] Error:", err?.message);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
