/**
 * POST /api/directory/wikipedia-import
 *
 * Imports directory entries from a Wikipedia category by:
 *   1. Fetching the list of page titles from the Wikipedia category API.
 *   2. Searching TMDB for each title to get real metadata (cover, director,
 *      year, overview). Titles that return no TMDB result are skipped.
 *   3. Calling the existing quick-create endpoint for each match —
 *      which deduplicates by TMDB ID, so re-running is safe. Any
 *      genre_slugs passed are applied whether the entry is new or already
 *      exists (upsert tagging — see the genre_slugs change to quick-create).
 *
 * Designed to be called in a loop until `done: true`. Each call processes
 * one batch. Pass the `cmcontinue` value from the previous response back
 * on the next call to advance through the category.
 *
 * Body params:
 *   category    {string}   Wikipedia category name, without the "Category:"
 *                          prefix, e.g. "Netflix_original_films".
 *   genre_slugs {string[]} culture_dir_genre slugs to apply to every entry
 *                          created or matched in this run.
 *   entry_type  {string}   "film" (default) | "tv-series". Controls whether
 *                          TMDB is searched as movie or TV.
 *   batch_size  {number}   How many Wikipedia titles to process per call
 *                          (default 20, max 50).
 *   cmcontinue  {string}   Opaque Wikipedia pagination cursor. Omit on the
 *                          first call; pass the value from the previous
 *                          response to continue where you left off.
 *
 * Response:
 *   {
 *     created:    number,   // new entries created this batch
 *     tagged:     number,   // existing entries that got genre tags applied
 *     skipped:    number,   // Wikipedia titles with no TMDB match
 *     total:      number,   // titles fetched from Wikipedia this batch
 *     done:       boolean,  // true when the category has no more pages
 *     cmcontinue: string | null  // pass back on next call; null when done
 *   }
 *
 * Auth: Authorization: Bearer {CRON_SECRET}
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET ?? "";
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? "";
  return !!secret && req.headers.get("Authorization") === `Bearer ${secret}`;
}

// Strips Wikipedia disambiguation suffixes like "(film)", "(TV series)", "(2024 film)" etc.
function stripDisambig(title: string): string {
  return title.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

interface TmdbFilmResult {
  id: number;
  title: string;
  overview?: string;
  release_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
}

interface TmdbTvResult {
  id: number;
  name: string;
  overview?: string;
  first_air_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
  original_language?: string;
}

async function fetchTmdbGenreMap(entryType: "film" | "tv-series"): Promise<Record<number, string>> {
  if (!TMDB_API_KEY) return {};
  const path = entryType === "tv-series" ? "genre/tv/list" : "genre/movie/list";
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${path}?api_key=${TMDB_API_KEY}`).catch(() => null);
    if (!res || !res.ok) return {};
    const data = await res.json().catch(() => null);
    const map: Record<number, string> = {};
    for (const g of data?.genres ?? []) {
      if (g?.id && g?.name) map[g.id as number] = g.name as string;
    }
    return map;
  } catch {
    return {};
  }
}

async function searchTmdb(
  title: string,
  entryType: "film" | "tv-series",
  genreMap: Record<number, string>
): Promise<{
  externalId: string;
  title: string;
  about?: string;
  coverUrl: string | null;
  description?: string;
  infobox?: Record<string, string>;
} | null> {
  if (!TMDB_API_KEY) return null;

  const clean = stripDisambig(title);
  const endpoint = entryType === "tv-series" ? "search/tv" : "search/movie";
  const params = new URLSearchParams({ api_key: TMDB_API_KEY, query: clean, page: "1" });

  try {
    const res = await fetch(`https://api.themoviedb.org/3/${endpoint}?${params}`).catch(() => null);
    if (!res || !res.ok) return null;
    const data = await res.json().catch(() => null);
    const results: (TmdbFilmResult | TmdbTvResult)[] = Array.isArray(data?.results) ? data.results : [];
    if (!results.length) return null;

    // Pick the best match — prefer an exact title match (case-insensitive),
    // fall back to the first result which TMDB ranks by relevance.
    const cleanLower = clean.toLowerCase();
    const best = results.find(
      (r) => ((r as TmdbFilmResult).title ?? (r as TmdbTvResult).name ?? "").toLowerCase() === cleanLower
    ) ?? results[0];

    if (!best?.id) return null;

    const resultTitle = (best as TmdbFilmResult).title ?? (best as TmdbTvResult).name ?? title;
    const dateField  = (best as TmdbFilmResult).release_date ?? (best as TmdbTvResult).first_air_date;
    const year       = dateField ? String(dateField).slice(0, 4) : undefined;
    const genreIds: number[] = Array.isArray(best.genre_ids) ? best.genre_ids : [];
    const genre      = genreIds.map((id) => genreMap[id]).filter(Boolean)[0];
    const language   = best.original_language && best.original_language !== "en"
      ? (best.original_language as string).toUpperCase()
      : undefined;

    const infobox: Record<string, string> = {};
    if (year)     infobox.year     = year;
    if (genre)    infobox.genre    = genre;
    if (language) infobox.language = language;

    return {
      externalId: String(best.id),
      title:      resultTitle,
      coverUrl:   best.poster_path ? `https://image.tmdb.org/t/p/w500${best.poster_path}` : null,
      description: typeof best.overview === "string" && best.overview.trim() ? best.overview : undefined,
      infobox:    Object.keys(infobox).length ? infobox : undefined,
    };
  } catch {
    return null;
  }
}

async function quickCreate(opts: {
  title: string;
  entryType: "film" | "tv-series";
  coverUrl: string | null;
  description?: string;
  externalId: string;
  genreSlugs: string[];
  infobox?: Record<string, string>;
}): Promise<{ isNew: boolean } | null> {
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${CULTURE_API_SECRET}` },
    body: JSON.stringify({
      user_id:          0,
      use_system_author: true,
      title:            opts.title,
      entry_type:       opts.entryType,
      cover_image_url:  opts.coverUrl || undefined,
      excerpt:          opts.description || undefined,
      external_source:  "tmdb",
      external_id:      opts.externalId,
      genre_slugs:      opts.genreSlugs.length ? opts.genreSlugs : undefined,
      skip_gamification: true,
      infobox:          opts.infobox || undefined,
    }),
    cache: "no-store",
  }).catch(() => null);

  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return { isNew: data.is_new !== false };
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!CULTURE_API_SECRET) {
    return NextResponse.json({ error: "CULTURE_API_SECRET not configured." }, { status: 503 });
  }
  if (!TMDB_API_KEY) {
    return NextResponse.json({ error: "TMDB_API_KEY not configured." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const category:   string   = (body.category ?? "").trim();
  const genreSlugs: string[] = Array.isArray(body.genre_slugs)
    ? body.genre_slugs.map((s: string) => String(s).trim()).filter(Boolean)
    : [];
  const rawType  = (body.entry_type ?? "film").trim();
  const entryType: "film" | "tv-series" = rawType === "tv-series" ? "tv-series" : "film";
  const batchSize = Math.min(50, Math.max(1, Number(body.batch_size) || 20));
  const cmcontinue: string | undefined = body.cmcontinue || undefined;

  if (!category) {
    return NextResponse.json({ error: "category is required." }, { status: 400 });
  }

  // ── 1. Fetch Wikipedia categorymembers ──────────────────────────────────
  const wpParams = new URLSearchParams({
    action:   "query",
    list:     "categorymembers",
    cmtitle:  `Category:${category}`,
    cmtype:   "page",
    cmlimit:  String(batchSize),
    format:   "json",
    origin:   "*",
  });
  if (cmcontinue) wpParams.set("cmcontinue", cmcontinue);

  const wikiRes = await fetch(`https://en.wikipedia.org/w/api.php?${wpParams}`).catch(() => null);
  if (!wikiRes || !wikiRes.ok) {
    return NextResponse.json({ error: "Failed to fetch Wikipedia category." }, { status: 502 });
  }
  const wikiData = await wikiRes.json().catch(() => null);
  if (!wikiData) {
    return NextResponse.json({ error: "Invalid response from Wikipedia." }, { status: 502 });
  }

  const members: { title: string }[] = Array.isArray(wikiData?.query?.categorymembers)
    ? wikiData.query.categorymembers
    : [];
  const nextCmcontinue: string | null = wikiData?.continue?.cmcontinue ?? null;
  const done = !nextCmcontinue;

  if (!members.length) {
    return NextResponse.json({ created: 0, tagged: 0, skipped: 0, total: 0, done: true, cmcontinue: null });
  }

  // ── 2. Fetch TMDB genre map once for this batch ──────────────────────────
  const genreMap = await fetchTmdbGenreMap(entryType);

  // ── 3. Search TMDB + quick-create for each title ────────────────────────
  // Sequential to avoid TMDB rate limits (40 req/10s on free tier).
  let created = 0;
  let tagged  = 0;
  let skipped = 0;

  for (const member of members) {
    // Skip Wikipedia meta-pages (sub-categories, file pages, talk pages etc.)
    if (member.title.startsWith("Category:") ||
        member.title.startsWith("File:") ||
        member.title.startsWith("Template:") ||
        member.title.startsWith("Wikipedia:")) {
      skipped++;
      continue;
    }

    const tmdb = await searchTmdb(member.title, entryType, genreMap);
    if (!tmdb) {
      skipped++;
      continue;
    }

    const result = await quickCreate({
      title:      tmdb.title,
      entryType,
      coverUrl:   tmdb.coverUrl,
      description: tmdb.description,
      externalId: tmdb.externalId,
      genreSlugs,
      infobox:    tmdb.infobox,
    });

    if (!result) {
      skipped++;
    } else if (result.isNew) {
      created++;
    } else {
      tagged++;
    }
  }

  return NextResponse.json({
    created,
    tagged,
    skipped,
    total:      members.length,
    done,
    cmcontinue: nextCmcontinue,
  });
}
