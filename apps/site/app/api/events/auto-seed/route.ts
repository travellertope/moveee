/**
 * GET/POST /api/events/auto-seed
 *
 * Cron-triggered seeder. Auth: Authorization: Bearer {CRON_SECRET}.
 * GET  — invoked by the external cron-job.org schedule ("moveee - events")
 *        with default citiesPerRun. cron-job.org is the live scheduler for
 *        this route, not Vercel cron — there is no vercel.json schedule.
 * POST — invoked manually; accepts { citiesPerRun } in request body.
 * Rotates through target cities so every city is covered over time.
 */

import { NextRequest, NextResponse } from "next/server";
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

async function run(citiesPerRun: number) {
  const day       = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const start     = (day * citiesPerRun) % CITIES.length;
  const cityBatch = [...CITIES.slice(start), ...CITIES.slice(0, start)].slice(0, citiesPerRun);
  const result    = await seedCities(cityBatch);
  return NextResponse.json(result);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const envErr = checkEnv();
  if (envErr) return envErr;
  return run(2);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  const envErr = checkEnv();
  if (envErr) return envErr;
  const body         = await req.json().catch(() => ({}));
  const citiesPerRun = Math.min(Number(body.citiesPerRun) || 3, CITIES.length);
  return run(citiesPerRun);
}
