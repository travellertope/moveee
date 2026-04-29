/**
 * POST /api/events/auto-seed
 *
 * Background job that discovers and seeds the Happenings (culture_event) archive.
 * Each run:
 *   1. Picks a rotating subset of target cities for this run.
 *   2. Runs several Serper (Google Search) queries per city to surface events.
 *   3. Passes raw results to Gemini, which filters for community relevance
 *      and extracts structured event fields.
 *   4. Deduplicates against events already in WordPress.
 *   5. Submits new events via POST /wp-json/culture/v1/events/submit.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 * Configured in vercel.json to run daily at 02:00 UTC.
 */

import { NextRequest, NextResponse } from "next/server";
import { evaluateAndExtractEvents, SerperResult } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

const WP_URL     = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_GRAPHQL = `${WP_URL}/graphql`;

// ── Target cities ──────────────────────────────────────────────────────────

const CITIES = [
  { name: "London",   gl: "gb", hl: "en" },
  { name: "Lagos",    gl: "ng", hl: "en" },
  { name: "Accra",    gl: "gh", hl: "en" },
  { name: "New York", gl: "us", hl: "en" },
  { name: "Nairobi",  gl: "ke", hl: "en" },
  { name: "Paris",    gl: "fr", hl: "en" },
  { name: "Johannesburg", gl: "za", hl: "en" },
  { name: "Toronto",  gl: "ca", hl: "en" },
];

// Query templates per city — mix broad and diaspora-specific.
function buildQueries(city: string, monthYear: string): string[] {
  return [
    `African diaspora cultural events ${city} ${monthYear}`,
    `art exhibition music film events ${city} ${monthYear}`,
    `Black culture events ${city} ${monthYear} site:eventbrite.com OR site:dice.fm OR site:ra.co`,
    `gallery opening supper club pop-up cultural event ${city} ${monthYear}`,
  ];
}

// ── Serper search ──────────────────────────────────────────────────────────

async function searchSerper(
  query: string,
  gl: string,
  hl: string
): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, gl, hl, num: 10 }),
      cache: "no-store",
    });

    if (!res.ok) return [];
    const data = await res.json();

    const organic: any[] = data.organic ?? [];
    return organic.map((r: any) => ({
      title:   String(r.title   ?? ""),
      link:    String(r.link    ?? ""),
      snippet: String(r.snippet ?? ""),
      date:    String(r.date    ?? ""),
    }));
  } catch {
    return [];
  }
}

// ── WordPress helpers ──────────────────────────────────────────────────────

/** Fetch existing event dedup hashes to skip known events. */
async function getExistingHashes(): Promise<Set<string>> {
  const query = `
    query GetEventHashes {
      cultureEvents(first: 500) {
        nodes {
          eventMeta { dedupHash }
        }
      }
    }
  `;
  try {
    const res = await fetch(WP_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    const json = await res.json();
    const nodes: any[] = json.data?.cultureEvents?.nodes ?? [];
    const hashes = new Set<string>();
    nodes.forEach((n: any) => {
      const h = n.eventMeta?.dedupHash;
      if (h) hashes.add(h);
    });
    return hashes;
  } catch {
    return new Set();
  }
}

/** Build the dedup hash the same way the PHP endpoint does. */
function buildDedupHash(title: string, eventDate: string, location: string): string {
  // Mirrors: md5(strtolower(trim(title)) . '|' . event_date . '|' . strtolower(trim(location)))
  // We can't run PHP's md5 here, so we just use a normalized string key for
  // in-memory dedup within this run. The PHP endpoint will catch true cross-run dupes.
  return `${title.toLowerCase().trim()}|${eventDate}|${location.toLowerCase().trim()}`;
}

/** Submit a single event to WordPress. */
async function submitEvent(
  stub: Awaited<ReturnType<typeof evaluateAndExtractEvents>>[number]
): Promise<{ success: boolean; post_id?: number; title: string }> {
  const secret = process.env.CULTURE_API_SECRET ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/events/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      title:         stub.title,
      excerpt:       stub.excerpt,
      content:       stub.content,
      event_date:    stub.event_date,
      end_date:      stub.end_date,
      location:      stub.location,
      city:          stub.city,
      admission:     stub.admission,
      ticketing_url: stub.ticketing_url,
      tagline:       stub.tagline,
      attribution:   stub.attribution,
      interests:     stub.interests,
      ai_generated:  true,
      auto_publish:  true,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // 409 = duplicate — not a real error.
    if (res.status === 409) return { success: false, title: stub.title };
    throw new Error(`WP submit failed (${res.status}): ${JSON.stringify(body)}`);
  }

  const data = await res.json();
  return { success: true, post_id: data.post_id, title: stub.title };
}

// ── Route handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }

  if (!process.env.SERPER_API_KEY) {
    return NextResponse.json({ error: "SERPER_API_KEY not configured." }, { status: 503 });
  }

  const body        = await req.json().catch(() => ({}));
  const citiesPerRun: number = Math.min(Number(body.citiesPerRun) || 3, CITIES.length);

  // Rotate cities based on day-of-year so every city gets covered over a week.
  const dayOfYear  = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const startIndex = (dayOfYear * citiesPerRun) % CITIES.length;
  const cityBatch  = [
    ...CITIES.slice(startIndex),
    ...CITIES.slice(0, startIndex),
  ].slice(0, citiesPerRun);

  const now       = new Date();
  const monthYear = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentDate = now.toISOString().slice(0, 10);

  // In-run dedup set (covers duplicates within this run before WP checks).
  const seenThisRun = new Set<string>();

  const cityResults: Record<string, { found: number; submitted: number; errors: string[] }> = {};
  let totalSubmitted = 0;

  for (const city of cityBatch) {
    cityResults[city.name] = { found: 0, submitted: 0, errors: [] };

    // 1. Run all search queries for this city, collect unique results.
    const queries  = buildQueries(city.name, monthYear);
    const allRaw: SerperResult[] = [];
    const seenUrls = new Set<string>();

    for (const q of queries) {
      const hits = await searchSerper(q, city.gl, city.hl);
      for (const h of hits) {
        if (!seenUrls.has(h.link)) {
          seenUrls.add(h.link);
          allRaw.push(h);
        }
      }
      await new Promise((r) => setTimeout(r, 400)); // Serper rate limit
    }

    if (!allRaw.length) continue;

    // 2. Gemini filters + extracts structured events.
    let stubs: Awaited<ReturnType<typeof evaluateAndExtractEvents>> = [];
    try {
      stubs = await evaluateAndExtractEvents(allRaw, city.name, currentDate, 10);
    } catch (err: any) {
      cityResults[city.name].errors.push(`Gemini: ${err?.message}`);
      continue;
    }

    cityResults[city.name].found = stubs.length;

    // 3. Submit each stub, skipping in-run dupes.
    for (const stub of stubs) {
      const key = buildDedupHash(stub.title, stub.event_date, stub.location);
      if (seenThisRun.has(key)) continue;
      seenThisRun.add(key);

      try {
        const result = await submitEvent(stub);
        if (result.success) {
          cityResults[city.name].submitted++;
          totalSubmitted++;
        }
      } catch (err: any) {
        cityResults[city.name].errors.push(`Submit "${stub.title}": ${err?.message}`);
      }

      await new Promise((r) => setTimeout(r, 1000)); // WP write throttle
    }

    await new Promise((r) => setTimeout(r, 2000)); // Between cities
  }

  return NextResponse.json({
    cities:   cityBatch.map((c) => c.name),
    submitted: totalSubmitted,
    detail:   cityResults,
  });
}
