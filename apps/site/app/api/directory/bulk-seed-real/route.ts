/**
 * POST /api/directory/bulk-seed-real
 *
 * One-time bulk import of real (not AI-generated) directory entries —
 * 1000 total, split across film/music/book, sourced from each type's real
 * trending/chart/bestseller-shaped endpoint:
 *   - Film:  TMDB, cycling through trending/week, top_rated, and
 *            now_playing (covers "trending", "most important", and
 *            "latest" in one rotation).
 *   - Music: Apple's public chart RSS (no key needed), "most played
 *            albums" across 4 storefronts (us/gb/ng/za) for a mix that
 *            isn't purely US-centric.
 *   - Book:  Google Books, cycling through a fixed set of subject/genre
 *            queries. No real "trending" endpoint exists for books here;
 *            this is a best-effort "broad, popular coverage" substitute.
 *            Google Books' keyless tier has a low shared daily quota — if
 *            GOOGLE_BOOKS_API_KEY isn't set on this deployment, expect
 *            this leg to stall quickly and report 0 created per call
 *            rather than fail.
 *
 * Each call processes ONE category (round-robin) and one bounded chunk of
 * it, to stay well inside any Vercel maxDuration ceiling regardless of
 * plan. Call this repeatedly (a simple curl loop; see the response's
 * `done` flag) until it reports done:true. All state (per-category
 * cursors/counts, the cached Apple Music candidate queue) lives in a
 * single WP option via /directory/bulk-seed-state, so calls can be spread
 * across any amount of time safely.
 *
 * Every create goes through the existing /directory/quick-create endpoint
 * with external_source/external_id set — same dedup path a real user's
 * review-flow quick-create already uses — so re-running past the target,
 * or after a partial run, never creates duplicates. Entries are attributed
 * to the same system "Moveee" account seeded quotes use (user_id=0,
 * use_system_author:true), with skip_gamification:true so this doesn't
 * award reputation/credits to anyone.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header — same secret
 * and check as /api/directory/auto-populate.
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET ?? "";
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";

const TARGET = { film: 334, music: 333, book: 333 };
const BATCH = { film: 20, music: 15, book: 15 };
const TMDB_LANES = ["trending", "top_rated", "now_playing"] as const;
const APPLE_STOREFRONTS = ["us", "gb", "ng", "za"];
const BOOK_QUERIES = [
  "subject:fiction", "subject:african+literature", "subject:biography",
  "subject:history", "subject:poetry", "subject:fantasy",
  "subject:science+fiction", "subject:memoir", "subject:young+adult",
  "bestseller", "subject:nigeria", "subject:black+history",
];

interface Candidate {
  externalId: string;
  title: string;
  about?: string;
  coverUrl: string | null;
  description?: string;
}

interface BulkSeedState {
  turn: number;
  film: { created: number; lanePages: number[]; laneTurn: number; laneDone: boolean[] };
  music: { created: number; queue: Candidate[]; fetchedAll: boolean; exhausted: boolean };
  book: { created: number; queryIdx: number; startIndex: number; exhausted: boolean };
}

function freshState(): BulkSeedState {
  return {
    turn: 0,
    film: { created: 0, lanePages: [1, 1, 1], laneTurn: 0, laneDone: [false, false, false] },
    music: { created: 0, queue: [], fetchedAll: false, exhausted: false },
    book: { created: 0, queryIdx: 0, startIndex: 0, exhausted: false },
  };
}

async function loadState(): Promise<BulkSeedState> {
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/bulk-seed-state`, {
      headers: { Authorization: `Bearer ${CULTURE_API_SECRET}` },
      cache: "no-store",
    });
    if (!res.ok) return freshState();
    const data = await res.json().catch(() => null);
    if (!data || typeof data !== "object" || !data.film) return freshState();
    return data as BulkSeedState;
  } catch {
    return freshState();
  }
}

async function saveState(state: BulkSeedState): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/bulk-seed-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${CULTURE_API_SECRET}` },
      body: JSON.stringify(state),
      cache: "no-store",
    });
  } catch {
    // Next call will just re-fetch the same chunk — safe, dedup handles it.
  }
}

async function fetchTmdbLane(lane: (typeof TMDB_LANES)[number], page: number): Promise<{ items: Candidate[]; hasMore: boolean }> {
  if (!TMDB_API_KEY) return { items: [], hasMore: false };
  const path = lane === "trending" ? "trending/movie/week" : lane === "top_rated" ? "movie/top_rated" : "movie/now_playing";
  const params = new URLSearchParams({ api_key: TMDB_API_KEY, page: String(page) });
  const res = await fetch(`https://api.themoviedb.org/3/${path}?${params}`).catch(() => null);
  if (!res || !res.ok) return { items: [], hasMore: false };
  const data = await res.json().catch(() => null);
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  const totalPages = Number(data?.total_pages) || 1;
  return {
    items: results
      .filter((m) => m?.id && m?.title)
      .map((m) => ({
        externalId: String(m.id),
        title: m.title as string,
        coverUrl: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
        description: typeof m.overview === "string" && m.overview.trim() ? m.overview : undefined,
      })),
    hasMore: page < Math.min(totalPages, 500),
  };
}

async function fetchAppleTopAlbums(storefront: string): Promise<Candidate[]> {
  const res = await fetch(`https://rss.marketingtools.apple.com/api/v2/${storefront}/music/most-played/100/albums.json`).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  const results: any[] = Array.isArray(data?.feed?.results) ? data.feed.results : [];
  return results
    .filter((a) => a?.id && a?.name)
    .map((a) => ({
      externalId: `itunes:${a.id}`,
      title: a.name as string,
      about: a.artistName as string | undefined,
      coverUrl: a.artworkUrl100 ? String(a.artworkUrl100).replace("100x100bb", "600x600bb") : null,
    }));
}

async function fetchGoogleBooksPage(
  queryIdx: number,
  startIndex: number
): Promise<{ items: Candidate[]; exhausted: boolean; rateLimited: boolean }> {
  const query = BOOK_QUERIES[queryIdx % BOOK_QUERIES.length];
  const params = new URLSearchParams({ q: query, startIndex: String(startIndex), maxResults: "20", orderBy: "relevance" });
  if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`).catch(() => null);
  if (!res) return { items: [], exhausted: false, rateLimited: false };
  if (res.status === 429) return { items: [], exhausted: false, rateLimited: true };
  if (!res.ok) return { items: [], exhausted: true, rateLimited: false };

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];
  return {
    items: items
      .filter((b) => b?.id && b?.volumeInfo?.title)
      .map((b) => {
        const info = b.volumeInfo;
        const ids: any[] = info.industryIdentifiers ?? [];
        const isbn = ids.find((i) => i.type === "ISBN_13")?.identifier || ids.find((i) => i.type === "ISBN_10")?.identifier || b.id;
        return {
          externalId: isbn,
          title: info.title as string,
          about: Array.isArray(info.authors) ? info.authors.join(", ") : undefined,
          coverUrl: info.imageLinks?.thumbnail ? String(info.imageLinks.thumbnail).replace(/^http:/, "https:") : null,
          description: typeof info.description === "string" ? info.description : undefined,
        };
      }),
    exhausted: items.length < 20,
    rateLimited: false,
  };
}

async function createRealEntry(opts: {
  title: string;
  entryType: "film" | "book" | "album";
  aboutLabel?: string;
  aboutValue?: string;
  coverUrl: string | null;
  description?: string;
  externalSource: string;
  externalId: string;
}): Promise<{ isNew: boolean } | null> {
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${CULTURE_API_SECRET}` },
    body: JSON.stringify({
      user_id: 0,
      use_system_author: true,
      title: opts.title,
      entry_type: opts.entryType,
      about_label: opts.aboutLabel,
      about_value: opts.aboutValue,
      cover_image_url: opts.coverUrl || undefined,
      excerpt: opts.description || undefined,
      external_source: opts.externalSource,
      external_id: opts.externalId,
      skip_gamification: true,
    }),
    cache: "no-store",
  }).catch(() => null);
  if (!res || !res.ok) return null;
  const data = await res.json().catch(() => ({}));
  return { isNew: data.is_new !== false };
}

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!CULTURE_API_SECRET) {
    return NextResponse.json({ error: "CULTURE_API_SECRET not configured." }, { status: 503 });
  }

  const state = await loadState();
  const order: Array<"film" | "music" | "book"> = ["film", "music", "book"];

  let category: "film" | "music" | "book" | null = null;
  for (let i = 0; i < 3; i++) {
    const idx = (state.turn + i) % 3;
    const cat = order[idx];
    const notDone = state[cat].created < TARGET[cat] && !(cat === "film" ? state.film.laneDone.every(Boolean) : state[cat].exhausted);
    if (notDone) {
      category = cat;
      state.turn = (idx + 1) % 3;
      break;
    }
  }

  if (!category) {
    return NextResponse.json({
      done: true,
      progress: { film: state.film.created, music: state.music.created, book: state.book.created, total: state.film.created + state.music.created + state.book.created },
      message: "All categories reached their target or ran out of source data.",
    });
  }

  let createdThisCall = 0;
  let note = "";

  if (category === "film") {
    const laneIdx = state.film.laneTurn % 3;
    const lane = TMDB_LANES[laneIdx];
    const page = state.film.lanePages[laneIdx];
    const { items, hasMore } = await fetchTmdbLane(lane, page);
    state.film.lanePages[laneIdx] = page + 1;
    state.film.laneTurn++;
    if (items.length === 0) state.film.laneDone[laneIdx] = !hasMore;

    for (const item of items) {
      if (state.film.created >= TARGET.film) break;
      const result = await createRealEntry({
        title: item.title, entryType: "film", coverUrl: item.coverUrl, description: item.description,
        externalSource: "tmdb", externalId: item.externalId,
      });
      if (result?.isNew) { state.film.created++; createdThisCall++; }
    }
    note = `lane=${lane} page=${page} fetched=${items.length}`;
  } else if (category === "music") {
    if (!state.music.fetchedAll) {
      const queue: Candidate[] = [];
      for (const sf of APPLE_STOREFRONTS) {
        queue.push(...(await fetchAppleTopAlbums(sf)));
      }
      const seen = new Set<string>();
      state.music.queue = queue.filter((c) => (seen.has(c.externalId) ? false : (seen.add(c.externalId), true)));
      state.music.fetchedAll = true;
      note = `fetched ${state.music.queue.length} candidates across ${APPLE_STOREFRONTS.length} storefronts`;
    }

    const batch = state.music.queue.splice(0, BATCH.music);
    for (const item of batch) {
      if (state.music.created >= TARGET.music) break;
      const result = await createRealEntry({
        title: item.title, entryType: "album", aboutLabel: "Artist", aboutValue: item.about, coverUrl: item.coverUrl,
        externalSource: "itunes", externalId: item.externalId,
      });
      if (result?.isNew) { state.music.created++; createdThisCall++; }
    }
    if (state.music.queue.length === 0) state.music.exhausted = true;
  } else {
    const { items, exhausted, rateLimited } = await fetchGoogleBooksPage(state.book.queryIdx, state.book.startIndex);
    if (rateLimited) {
      note = "Google Books rate-limited this call — will retry the same page next call.";
    } else {
      state.book.startIndex += 20;
      if (exhausted) {
        state.book.queryIdx++;
        state.book.startIndex = 0;
        if (state.book.queryIdx >= BOOK_QUERIES.length) state.book.exhausted = true;
      }
      for (const item of items) {
        if (state.book.created >= TARGET.book) break;
        const result = await createRealEntry({
          title: item.title, entryType: "book", aboutLabel: "Author", aboutValue: item.about, coverUrl: item.coverUrl,
          description: item.description, externalSource: "google_books", externalId: item.externalId,
        });
        if (result?.isNew) { state.book.created++; createdThisCall++; }
      }
      note = `query="${BOOK_QUERIES[state.book.queryIdx % BOOK_QUERIES.length]}" fetched=${items.length}`;
    }
  }

  await saveState(state);

  const total = state.film.created + state.music.created + state.book.created;
  const filmDone = state.film.created >= TARGET.film || state.film.laneDone.every(Boolean);
  const musicDone = state.music.created >= TARGET.music || state.music.exhausted;
  const bookDone = state.book.created >= TARGET.book || state.book.exhausted;
  const done = total >= 1000 || (filmDone && musicDone && bookDone);

  return NextResponse.json({
    category,
    createdThisCall,
    note,
    progress: { film: state.film.created, music: state.music.created, book: state.book.created, total },
    target: TARGET,
    done,
  });
}
