/**
 * Serper-backed quote discovery for the Moveee Quote Archive.
 *
 * For each author in QUOTE_AUTHORS, runs targeted Google searches against
 * verified sources (Wikiquote, Goodreads, published interviews) and passes
 * the raw results to Gemini for strict verbatim extraction.
 *
 * Gemini is an extractor, not a generator — it may only return quotes whose
 * exact text appears in the search snippets. It cannot invent or recall from
 * training data.
 */

import { searchAndExtractQuotes } from "@/lib/gemini";

// ── Author roster ─────────────────────────────────────────────────────────────

export interface QuoteAuthor {
  name: string;
  domain: string;
}

export const QUOTE_AUTHORS: QuoteAuthor[] = [
  // Literature — African
  { name: "Chimamanda Ngozi Adichie", domain: "literature" },
  { name: "Chinua Achebe",            domain: "literature" },
  { name: "Wole Soyinka",             domain: "literature" },
  { name: "Ngugi wa Thiong'o",        domain: "literature" },
  { name: "Buchi Emecheta",           domain: "literature" },
  { name: "Ben Okri",                 domain: "literature" },
  { name: "Ama Ata Aidoo",            domain: "literature" },
  { name: "Tsitsi Dangarembga",       domain: "literature" },
  { name: "Maaza Mengiste",           domain: "literature" },
  { name: "Teju Cole",                domain: "literature" },
  { name: "Yaa Gyasi",                domain: "literature" },
  { name: "Nnedi Okofor",             domain: "literature" },
  { name: "NoViolet Bulawayo",        domain: "literature" },
  { name: "Leila Aboulela",           domain: "literature" },
  { name: "Aminatta Forna",           domain: "literature" },
  // Literature — Diaspora
  { name: "Toni Morrison",            domain: "literature" },
  { name: "James Baldwin",            domain: "literature" },
  { name: "Audre Lorde",              domain: "literature" },
  { name: "Octavia Butler",           domain: "literature" },
  { name: "Maya Angelou",             domain: "literature" },
  { name: "Langston Hughes",          domain: "literature" },
  { name: "Zadie Smith",              domain: "literature" },
  { name: "Bernardine Evaristo",      domain: "literature" },
  { name: "Edwidge Danticat",         domain: "literature" },
  { name: "Jamaica Kincaid",          domain: "literature" },
  { name: "Derek Walcott",            domain: "literature" },
  { name: "Claudia Rankine",          domain: "literature" },
  { name: "Colson Whitehead",         domain: "literature" },
  { name: "Jesmyn Ward",              domain: "literature" },
  // Philosophy / Activism / Politics
  { name: "Frantz Fanon",             domain: "philosophy" },
  { name: "Steve Biko",               domain: "activism" },
  { name: "Kwame Nkrumah",            domain: "politics" },
  { name: "Thomas Sankara",           domain: "politics" },
  { name: "Patrice Lumumba",          domain: "politics" },
  { name: "Aimé Césaire",             domain: "literature" },
  { name: "Édouard Glissant",         domain: "philosophy" },
  { name: "bell hooks",               domain: "philosophy" },
  { name: "W.E.B. Du Bois",           domain: "philosophy" },
  { name: "Achille Mbembe",           domain: "philosophy" },
  { name: "Angela Davis",             domain: "activism" },
  { name: "Wangari Maathai",          domain: "activism" },
  { name: "Nelson Mandela",           domain: "politics" },
  { name: "Desmond Tutu",             domain: "activism" },
  // Music
  { name: "Fela Kuti",                domain: "music" },
  { name: "Miriam Makeba",            domain: "music" },
  { name: "Hugh Masekela",            domain: "music" },
  { name: "Angélique Kidjo",          domain: "music" },
  { name: "Youssou N'Dour",           domain: "music" },
  { name: "Wizkid",                   domain: "music" },
  { name: "Burna Boy",                domain: "music" },
  { name: "Sade Adu",                 domain: "music" },
  { name: "Lauryn Hill",              domain: "music" },
  { name: "Nina Simone",              domain: "music" },
  { name: "Gil Scott-Heron",          domain: "music" },
  // Film / TV / Performance
  { name: "Issa Rae",                 domain: "film-tv" },
  { name: "Ava DuVernay",             domain: "film-tv" },
  { name: "Barry Jenkins",            domain: "film-tv" },
  { name: "Ousmane Sembène",          domain: "film-tv" },
  { name: "Michaela Coel",            domain: "film-tv" },
  { name: "Lupita Nyong'o",           domain: "film-tv" },
  { name: "Viola Davis",              domain: "film-tv" },
  { name: "Trevor Noah",              domain: "comedy" },
  { name: "Danai Gurira",             domain: "film-tv" },
  // Visual Art / Design / Photography
  { name: "Jean-Michel Basquiat",     domain: "visual-art" },
  { name: "Kehinde Wiley",            domain: "visual-art" },
  { name: "El Anatsui",               domain: "visual-art" },
  { name: "Yinka Shonibare",          domain: "visual-art" },
  { name: "Lubaina Himid",            domain: "visual-art" },
  { name: "Kara Walker",              domain: "visual-art" },
  { name: "Gordon Parks",             domain: "photography" },
  { name: "Carrie Mae Weems",         domain: "photography" },
  { name: "Malick Sidibé",            domain: "photography" },
  { name: "Virgil Abloh",             domain: "fashion-design" },
];

// ── Search ────────────────────────────────────────────────────────────────────

export interface SerperQuoteResult {
  title: string;
  link: string;
  snippet: string;
}

/**
 * Build targeted Serper queries for an author.
 * Prioritises Wikiquote and Goodreads — the most reliably verified sources.
 */
export function buildQuoteQueries(authorName: string): string[] {
  return [
    `"${authorName}" quotes site:wikiquote.org`,
    `"${authorName}" quotes site:goodreads.com`,
    `"${authorName}" quotes interview speech`,
  ];
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

// ── Main orchestrator ─────────────────────────────────────────────────────────

/**
 * Fetch and verify quotes for one author using Serper + Gemini.
 *
 * Runs 3 Serper queries, deduplicates results, then asks Gemini to extract
 * only quotes it can see verbatim in the search snippets.
 */
export async function fetchVerifiedQuotesForAuthor(
  author: QuoteAuthor,
  maxQuotes: number = 4
): Promise<Array<{ text: string; author: string; source: string; source_url: string }>> {
  const queries    = buildQuoteQueries(author.name);
  const seen       = new Set<string>();
  const allResults: SerperQuoteResult[] = [];

  for (const query of queries) {
    const results = await searchSerper(query);
    for (const r of results) {
      if (!seen.has(r.link)) {
        seen.add(r.link);
        allResults.push(r);
      }
    }
    // Gentle rate-limiting between Serper calls.
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  if (allResults.length === 0) return [];

  return searchAndExtractQuotes(allResults, author.name, maxQuotes);
}

/**
 * Run a full batch: pick `authorsPerRun` authors by day-of-year rotation,
 * fetch verified quotes for each, and return all results.
 *
 * Day-of-year rotation means every author is covered within a predictable
 * window without needing persistent state.
 */
export async function runVerifiedQuotesBatch(
  authorsPerRun: number = 3,
  quotesPerAuthor: number = 4
): Promise<Array<{ text: string; author: string; source: string; source_url: string }>> {
  const total     = QUOTE_AUTHORS.length;
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  );
  const startIdx  = (dayOfYear * authorsPerRun) % total;

  const batch = [...QUOTE_AUTHORS.slice(startIdx), ...QUOTE_AUTHORS.slice(0, startIdx)]
    .slice(0, authorsPerRun);

  const allQuotes: Array<{ text: string; author: string; source: string; source_url: string }> = [];

  for (const author of batch) {
    const quotes = await fetchVerifiedQuotesForAuthor(author, quotesPerAuthor);
    allQuotes.push(...quotes);
    // Pause between authors to stay within rate limits.
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return allQuotes;
}
