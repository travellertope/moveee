/**
 * POST /api/events/admin-seed
 *
 * Session-authenticated endpoint for the /events/admin UI.
 * Accepts an optional `cities` array to seed specific cities,
 * otherwise seeds all cities in a single run.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { CITIES, seedCities } from "@/lib/events-seeder";

export const runtime     = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to access Events Admin." }, { status: 401 });
  }

  const allowlist = process.env.PULSE_ADMIN_EMAILS;
  if (!allowlist) {
    return NextResponse.json({ error: "Events Admin is not configured." }, { status: 403 });
  }
  const allowed = allowlist.split(",").map((e) => e.trim().toLowerCase());
  if (!allowed.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Your account is not authorised for Events Admin." }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  if (!process.env.SERPER_API_KEY) return NextResponse.json({ error: "SERPER_API_KEY not configured." }, { status: 503 });

  const body = await req.json().catch(() => ({}));

  // If the UI passed specific city names, filter to those; otherwise run all.
  const requestedNames: string[] = Array.isArray(body.cities) ? body.cities : [];
  const citiesToRun = requestedNames.length
    ? CITIES.filter((c) => requestedNames.includes(c.name))
    : CITIES;

  if (!citiesToRun.length) {
    return NextResponse.json({ error: "No valid cities selected." }, { status: 400 });
  }

  const result = await seedCities(citiesToRun);
  return NextResponse.json({ success: true, ...result });
}
