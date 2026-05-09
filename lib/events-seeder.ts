/**
 * Shared logic for the events seeder — used by both the cron route
 * (auto-seed) and the manual admin route (admin-seed).
 */

import { evaluateAndExtractEvents, enrichEventContent, SerperResult } from "@/lib/gemini";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export const CITIES = [
  { name: "London",       gl: "gb", hl: "en" },
  { name: "Lagos",        gl: "ng", hl: "en" },
  { name: "Accra",        gl: "gh", hl: "en" },
  { name: "New York",     gl: "us", hl: "en" },
  { name: "Nairobi",      gl: "ke", hl: "en" },
  { name: "Paris",        gl: "fr", hl: "en" },
  { name: "Johannesburg", gl: "za", hl: "en" },
  { name: "Toronto",      gl: "ca", hl: "en" },
];

export type CityResult = { found: number; submitted: number; skipped: number; errors: string[] };
export type SeedResult = { cities: string[]; submitted: number; detail: Record<string, CityResult> };

export function buildQueries(city: string, monthYear: string, nextMonthYear: string): string[] {
  return [
    `African diaspora cultural events ${city} ${monthYear}`,
    `African diaspora cultural events ${city} ${nextMonthYear}`,
    `art exhibition music film events ${city} ${monthYear} OR ${nextMonthYear}`,
    `Black culture events ${city} ${monthYear} site:eventbrite.com OR site:dice.fm OR site:ra.co`,
    `gallery opening supper club pop-up cultural event ${city} ${nextMonthYear}`,
  ];
}

export async function searchSerper(query: string, gl: string, hl: string): Promise<SerperResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-KEY": apiKey },
      body: JSON.stringify({ q: query, gl, hl, num: 10 }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic ?? []).map((r: any) => ({
      title:   String(r.title   ?? ""),
      link:    String(r.link    ?? ""),
      snippet: String(r.snippet ?? ""),
      date:    String(r.date    ?? ""),
    }));
  } catch {
    return [];
  }
}

export function buildDedupKey(title: string, eventDate: string, location: string): string {
  return `${title.toLowerCase().trim()}|${eventDate}|${location.toLowerCase().trim()}`;
}

export async function submitEvent(
  stub: Awaited<ReturnType<typeof evaluateAndExtractEvents>>[number]
): Promise<{ success: boolean; duplicate?: boolean; title: string }> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/events/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${secret}` },
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
  if (res.status === 409) return { success: false, duplicate: true, title: stub.title };
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`WP ${res.status}: ${JSON.stringify(body)}`);
  }
  return { success: true, title: stub.title };
}

export async function seedCities(
  citiesToRun: typeof CITIES,
  maxEventsPerCity = 10
): Promise<SeedResult> {
  const now         = new Date();
  const monthYear   = now.toLocaleString("en-US", { month: "long", year: "numeric" });
  const nextMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonthYear = nextMonth.toLocaleString("en-US", { month: "long", year: "numeric" });
  const currentDate = now.toISOString().slice(0, 10);
  const today       = new Date(); today.setHours(0, 0, 0, 0);
  const maxDate     = new Date(); maxDate.setMonth(maxDate.getMonth() + 18);

  const seenThisRun = new Set<string>();
  const detail: Record<string, CityResult> = {};
  let totalSubmitted = 0;

  for (const city of citiesToRun) {
    detail[city.name] = { found: 0, submitted: 0, skipped: 0, errors: [] };

    // Collect unique search results across all queries.
    const allRaw: SerperResult[] = [];
    const seenUrls = new Set<string>();
    for (const q of buildQueries(city.name, monthYear, nextMonthYear)) {
      const hits = await searchSerper(q, city.gl, city.hl);
      for (const h of hits) {
        if (!seenUrls.has(h.link)) { seenUrls.add(h.link); allRaw.push(h); }
      }
      await new Promise((r) => setTimeout(r, 400));
    }

    if (!allRaw.length) continue;

    let stubs: Awaited<ReturnType<typeof evaluateAndExtractEvents>> = [];
    try {
      stubs = await evaluateAndExtractEvents(allRaw, city.name, currentDate, maxEventsPerCity);
    } catch (err: any) {
      detail[city.name].errors.push(`Gemini: ${err?.message}`);
      continue;
    }

    detail[city.name].found = stubs.length;

    for (const stub of stubs) {
      const parsed = stub.event_date ? new Date(stub.event_date) : null;
      if (!parsed || isNaN(parsed.getTime()) || parsed < today || parsed > maxDate) {
        detail[city.name].skipped++;
        detail[city.name].errors.push(`Bad date "${stub.event_date}" → "${stub.title}"`);
        continue;
      }
      const key = buildDedupKey(stub.title, stub.event_date, stub.location);
      if (seenThisRun.has(key)) { detail[city.name].skipped++; continue; }
      seenThisRun.add(key);

      try {
        // Enrich content with deeper Gemini research before submitting.
        const richContent = await enrichEventContent(
          stub.title,
          stub.city || city.name,
          stub.event_date,
          stub.excerpt || stub.content
        );
        const enrichedStub = { ...stub, content: richContent };
        const r = await submitEvent(enrichedStub);
        if (r.success)        { detail[city.name].submitted++; totalSubmitted++; }
        else if (r.duplicate) { detail[city.name].skipped++; }
      } catch (err: any) {
        detail[city.name].errors.push(`"${stub.title}": ${err?.message}`);
      }
      await new Promise((r) => setTimeout(r, 800));
    }

    await new Promise((r) => setTimeout(r, 1500));
  }

  return { cities: citiesToRun.map((c) => c.name), submitted: totalSubmitted, detail };
}
