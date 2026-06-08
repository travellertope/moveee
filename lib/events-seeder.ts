/**
 * Shared logic for the events seeder — used by both the cron route
 * (auto-seed) and the manual admin route (admin-seed).
 */

import { evaluateAndExtractEvents, SerperResult, EventStub } from "@/lib/gemini";
import { scrapeOgTags } from "@/lib/og-scraper";

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
    `African diaspora cultural events ${city} ${monthYear} OR ${nextMonthYear}`,
    `art exhibition music film events ${city} ${monthYear} OR ${nextMonthYear}`,
    `Black culture events ${city} ${monthYear} site:eventbrite.com OR site:dice.fm OR site:ra.co`,
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
      title:    String(r.title    ?? ""),
      link:     String(r.link     ?? ""),
      snippet:  String(r.snippet  ?? ""),
      date:     String(r.date     ?? ""),
      imageUrl: r.imageUrl ? String(r.imageUrl) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Cross-reference stubs against Serper results by title similarity.
 * Attaches the source link as attribution when Gemini omitted it,
 * and the result thumbnail as image_url. Neither is stored on our servers.
 */
function attachSerperData(stubs: EventStub[], serperResults: SerperResult[]): EventStub[] {
  return stubs.map((stub) => {
    const words = stub.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const match = serperResults.find((r) => {
      const rt = r.title.toLowerCase() + " " + r.snippet.toLowerCase();
      return words.filter((w) => rt.includes(w)).length >= Math.min(2, words.length);
    });
    if (!match) return stub;
    return {
      ...stub,
      attribution: (stub.attribution && stub.attribution.startsWith("http"))
        ? stub.attribution
        : match.link,
      image_url: stub.image_url || match.imageUrl || undefined,
    };
  });
}

/**
 * Returns false for bare homepage/root URLs like https://www.eventbrite.com/
 * so we never link to a generic site — only to specific event pages.
 */
function isDeepEventUrl(url: string): boolean {
  if (!url || !url.startsWith("http")) return false;
  try {
    const { pathname } = new URL(url);
    // Reject if the path has fewer than 2 meaningful segments (i.e. it's a root or one-level page)
    const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
    return parts.length >= 2;
  } catch {
    return false;
  }
}

export function normalizeEventTitle(title: string): string {
  return title.toLowerCase().trim()
    .replace(/\b(tickets?|saturday|sunday|monday|tuesday|wednesday|thursday|friday|buy now|register|free)\b/g, "")
    .replace(/\b20\d{2}\b/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildDedupKey(title: string, eventDate: string, location: string): string {
  return `${normalizeEventTitle(title)}|${eventDate}|${location.toLowerCase().trim()}`;
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
      ticketing_url: isDeepEventUrl(stub.ticketing_url) ? stub.ticketing_url : "",
      tagline:       stub.tagline,
      attribution:   stub.attribution,
      source_url:    stub.attribution,
      image_url:     stub.image_url || "",
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
  maxEventsPerCity = 5
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

    // Attach source URLs and thumbnail images from the Serper results.
    stubs = attachSerperData(stubs, allRaw);

    detail[city.name].found = stubs.length;

    for (let stub of stubs) {
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
        // If Serper gave no image, try scraping OG image from the attribution URL.
        if (!stub.image_url && stub.attribution) {
          const og = await scrapeOgTags(stub.attribution);
          if (og.image) stub = { ...stub, image_url: og.image };
        }
        const r = await submitEvent(stub);
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
