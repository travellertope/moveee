/**
 * POST /api/events/backfill-images
 *
 * Session-authenticated admin endpoint.
 * Fetches all published events missing an image, scrapes OG image from their
 * attribution or ticketing URL, then patches _culture_event_image_url on each.
 *
 * Body (optional): { perPage?: number } — how many events to process per call (default 50).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { scrapeOgTags } from "@/lib/og-scraper";

export const runtime     = "nodejs";
export const maxDuration = 300;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function isAllowed(email: string): boolean {
  const list = process.env.PULSE_ADMIN_EMAILS;
  if (!list) return true;
  return list.split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Sign in to access Events Admin." }, { status: 401 });
  }
  if (!isAllowed(session.user.email)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const perPage = Math.min(Number(body.perPage) || 50, 100);

  const secret = process.env.CULTURE_API_SECRET ?? "";
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${secret}` };

  // 1. Fetch events missing images from WP
  const listRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/events/missing-images?per_page=${perPage}`,
    { headers, cache: "no-store" }
  );
  if (!listRes.ok) {
    return NextResponse.json({ error: "Failed to fetch events from WP." }, { status: 502 });
  }
  const { events, total } = await listRes.json();

  const results = { patched: 0, skipped: 0, errors: [] as string[], total };

  for (const event of events as Array<{ id: number; title: string; attribution: string; ticketing_url: string }>) {
    const sourceUrl = event.attribution || event.ticketing_url;
    if (!sourceUrl) { results.skipped++; continue; }

    try {
      const og = await scrapeOgTags(sourceUrl);
      if (!og.image) { results.skipped++; continue; }

      const patchRes = await fetch(`${WP_URL}/wp-json/culture/v1/events/update-image`, {
        method: "POST",
        headers,
        body: JSON.stringify({ id: event.id, image_url: og.image }),
        cache: "no-store",
      });
      if (patchRes.ok) {
        results.patched++;
      } else {
        results.errors.push(`#${event.id} "${event.title}": patch failed ${patchRes.status}`);
      }
    } catch (err: any) {
      results.errors.push(`#${event.id} "${event.title}": ${err?.message}`);
    }

    // Respect rate limits — don't hammer external sites
    await new Promise((r) => setTimeout(r, 400));
  }

  return NextResponse.json({ success: true, ...results });
}

// GET — just report how many events are missing images
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email || !isAllowed(session.user.email)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 403 });
  }
  const secret = process.env.CULTURE_API_SECRET ?? "";
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/events/missing-images?per_page=1`,
    { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: "WP unreachable." }, { status: 502 });
  const { total } = await res.json();
  return NextResponse.json({ missingImages: total });
}
