/**
 * GET/POST /api/events/auto-seed
 *
 * Cron-triggered seeder. Auth: Authorization: Bearer {CRON_SECRET}.
 * GET  — invoked by the external cron-job.org schedule ("moveee - events").
 *        cron-job.org is the live scheduler for this route, not Vercel cron —
 *        there is no vercel.json schedule. Responds 202 immediately and runs
 *        the actual seeding in the background via next/server's after() —
 *        cron-job.org's own request timeout (commonly 30s on its dashboard)
 *        is far shorter than this route's 300s maxDuration, so waiting on the
 *        full seed synchronously made cron-job.org report false "Failed
 *        (timeout)" results even when seeding completed fine server-side.
 * POST — invoked manually (e.g. via curl for debugging); accepts
 *        { citiesPerRun } in request body, and still returns the seeding
 *        result synchronously since there's no external timeout involved.
 * Rotates through target cities so every city is covered over time.
 */

import { NextRequest, NextResponse, after } from "next/server";
import { CITIES, seedCities } from "@/lib/events-seeder";

export const runtime  = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

function checkEnv() {
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  if (!process.env.SERPER_API_KEY) return NextResponse.json({ error: "SERPER_API_KEY not configured." }, { status: 503 });
  return null;
}

function pickCityBatch(citiesPerRun: number) {
  const day   = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const start = (day * citiesPerRun) % CITIES.length;
  return [...CITIES.slice(start), ...CITIES.slice(0, start)].slice(0, citiesPerRun);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const envErr = checkEnv();
  if (envErr) return envErr;

  const cityBatch = pickCityBatch(2);
  after(() =>
    seedCities(cityBatch).catch(err => console.error("[events/auto-seed] background error:", err))
  );

  return NextResponse.json({ accepted: true, cities: cityBatch }, { status: 202 });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const envErr = checkEnv();
  if (envErr) return envErr;
  const body         = await req.json().catch(() => ({}));
  const citiesPerRun = Math.min(Number(body.citiesPerRun) || 3, CITIES.length);
  const result        = await seedCities(pickCityBatch(citiesPerRun));
  return NextResponse.json(result);
}
