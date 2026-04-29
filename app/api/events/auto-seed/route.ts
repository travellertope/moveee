/**
 * POST /api/events/auto-seed
 *
 * Cron-triggered seeder. Auth: Authorization: Bearer {CRON_SECRET}.
 * Runs daily at 02:00 UTC (vercel.json). Rotates through target cities
 * so every city is covered across the week.
 */

import { NextRequest, NextResponse } from "next/server";
import { CITIES, seedCities } from "@/lib/events-seeder";

export const runtime  = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  if (!cronSecret || req.headers.get("Authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!process.env.GEMINI_API_KEY)  return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  if (!process.env.SERPER_API_KEY)  return NextResponse.json({ error: "SERPER_API_KEY not configured." }, { status: 503 });

  const body         = await req.json().catch(() => ({}));
  const citiesPerRun = Math.min(Number(body.citiesPerRun) || 3, CITIES.length);

  // Rotate by day-of-year so all cities get covered over the week.
  const day       = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const start     = (day * citiesPerRun) % CITIES.length;
  const cityBatch = [...CITIES.slice(start), ...CITIES.slice(0, start)].slice(0, citiesPerRun);

  const result = await seedCities(cityBatch);
  return NextResponse.json(result);
}
