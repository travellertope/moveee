/**
 * Serper search helper for the Moveee Quote Archive's audit job
 * (`/api/quotes/audit`).
 *
 * The automatic quote-seeding pipeline this file used to also power
 * (`/api/quotes/auto-populate`, a curated-list + Serper/Gemini discovery
 * job triggered weekly by WP-Cron) was retired in September 2026 — see
 * "Quotes seed (weekly)" in class-culture-cron.php and the quotes/feed-merge
 * entry in CLAUDE.md. It never actually ran autonomously in practice, so
 * `QUOTE_AUTHORS`, `buildQuoteQueries()`, `fetchVerifiedQuotesForAuthor()`,
 * and `runVerifiedQuotesBatch()` were deleted along with it. `searchSerper()`
 * is kept — the audit job still uses it to fact-check *existing* quotes,
 * which is a distinct, still-live concern from seeding new ones.
 */

export interface SerperQuoteResult {
  title: string;
  link: string;
  snippet: string;
}

/**
 * Run a single Serper query and return organic results.
 */
export async function searchSerper(query: string): Promise<SerperQuoteResult[]> {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify({ q: query, num: 10 }),
      cache: "no-store",
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.organic ?? []).map((r: any) => ({
      title:   String(r.title   ?? ""),
      link:    String(r.link    ?? ""),
      snippet: String(r.snippet ?? ""),
    }));
  } catch {
    return [];
  }
}
