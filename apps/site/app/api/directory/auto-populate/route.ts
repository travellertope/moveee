/**
 * POST /api/directory/auto-populate
 *
 * Background job that seeds the Culture Directory. Each run:
 *   1. Pulls SEED_TOPICS (hardcoded) + extra topics stored in WordPress.
 *   2. Filters out topics already published (by title) AND topics previously
 *      submitted (by original seed string — survives Gemini title changes).
 *   3. If pending topics remain, generates up to `batchSize` stubs via Gemini.
 *   4. If ALL topics are exhausted, asks Gemini to suggest 20 new ones,
 *      saves them to WordPress, and runs the first batch immediately.
 *   5. For a "book" or "film" stub, tries a real Google Books/TMDB match on
 *      the resolved title (+ year, when Gemini's infobox has one) before
 *      falling back to an Imagen-generated image — real cover art + real
 *      synopsis beats an AI illustration and AI-written blurb when the real
 *      thing is one API call away. Every other entry type (person, place,
 *      concept, genre, …) is unaffected — there's no equivalent external
 *      catalog for those, so they keep the Imagen path exactly as before.
 *
 * Auth: requires Authorization: Bearer {CRON_SECRET} header.
 *
 * Trigger: there is no Vercel-native cron in this project (apps/site/
 * vercel.json is `{}`) — this route is called by WP-Cron
 * (Culture_Cron::seed_directory(), culture-community/includes/core/
 * class-culture-cron.php), itself driven by a real Lightsail server
 * crontab hitting wp-cron.php every 30 minutes. A previous version of this
 * comment claimed "configured in vercel.json" — that was never true (see
 * CLAUDE.md's "Cron / scheduled jobs" section, which calls out exactly this
 * stale phrasing). If this job appears not to be running, check in order:
 * (1) WP Admin → Culture Community → Settings → General has both
 * "Frontend URL" and "Cron Secret" set (Culture_Settings::get() returning
 * empty makes Culture_Cron::call_nextjs() silently no-op — nothing is even
 * sent); (2) that Cron Secret matches this deployment's CRON_SECRET env var
 * exactly; (3) GEMINI_API_KEY is set. None of these failures are visible
 * from the WordPress side — the WP call is fire-and-forget
 * (wp_remote_post(..., ['blocking' => false, ...])) by design, so a 403/503
 * here never surfaces as an error anywhere in WP Admin.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  generateDirectoryStub,
  generateDirectoryImage,
  generateTopicSuggestions,
} from "@/lib/gemini";
import { uploadToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const maxDuration = 300;

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_GRAPHQL = `${WP_URL}/graphql`;

// ── Real-catalog cover/description lookup (book, film, place, food) ────────
// Google Books/TMDB mirror what /api/external/{google_books,tmdb}/search
// already proxy for the reactive composer flow — called directly here
// (server-to-server, not through those routes) since this is a background
// job, not a browser request. Google Places has no equivalent description
// field, and — unlike Books/TMDB cover URLs, which are already-public CDN
// links safe to hotlink — its Photo endpoint only serves an image when the
// request carries the API key, so that key would otherwise end up baked
// into a URL stored forever in the database and sent to every visitor's
// browser. findRealPlaceCover() fetches the photo bytes server-side (key
// never leaves this function) and re-hosts them on R2, same as the existing
// Imagen path already does for generated images.

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

interface RealCatalogMatch {
  externalId: string;
  coverUrl: string;
  description?: string;
}

async function findRealBookCover(title: string, yearPublished?: string): Promise<RealCatalogMatch | null> {
  try {
    const params = new URLSearchParams({ q: `intitle:${title}`, maxResults: "3" });
    if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const items: any[] = Array.isArray(data?.items) ? data.items : [];
    // Prefer a result whose publication year matches Gemini's infobox, when
    // we have one to check against; otherwise take the top hit.
    const match =
      (yearPublished && items.find((i) => String(i?.volumeInfo?.publishedDate ?? "").startsWith(yearPublished))) ||
      items[0];
    const info = match?.volumeInfo;
    const cover = info?.imageLinks?.thumbnail;
    if (!match?.id || !cover) return null;
    return {
      externalId: match.id,
      coverUrl: String(cover).replace(/^http:/, "https:"),
      description: typeof info.description === "string" ? info.description : undefined,
    };
  } catch {
    return null;
  }
}

async function findRealFilmCover(title: string, year?: string): Promise<RealCatalogMatch | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const params = new URLSearchParams({ api_key: TMDB_API_KEY, query: title, include_adult: "false" });
    if (year) params.set("year", year);
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const items: any[] = Array.isArray(data?.results) ? data.results : [];
    const match = items[0];
    if (!match?.id || !match?.poster_path) return null;
    return {
      externalId: String(match.id),
      coverUrl: `https://image.tmdb.org/t/p/w500${match.poster_path}`,
      description: typeof match.overview === "string" && match.overview.trim() ? match.overview : undefined,
    };
  } catch {
    return null;
  }
}

async function findRealPlaceCover(title: string, city?: string, postId?: number): Promise<RealCatalogMatch | null> {
  if (!GOOGLE_PLACES_API_KEY) return null;
  try {
    const query = city ? `${title}, ${city}` : title;
    const params = new URLSearchParams({ query, key: GOOGLE_PLACES_API_KEY });
    const res = await fetch(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`);
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    const place = (Array.isArray(data?.results) ? data.results : [])[0];
    const photoRef = place?.photos?.[0]?.photo_reference;
    if (!place?.place_id || !photoRef) return null;

    // Fetch the actual photo bytes with the key server-side, then re-host on
    // R2 — see the block comment above for why this can't just hotlink the
    // googleapis.com photo URL the way Books/TMDB covers do.
    const photoParams = new URLSearchParams({ maxwidth: "640", photoreference: photoRef, key: GOOGLE_PLACES_API_KEY });
    const photoRes = await fetch(`https://maps.googleapis.com/maps/api/place/photo?${photoParams}`);
    if (!photoRes.ok) return null;
    const photoBuffer = Buffer.from(await photoRes.arrayBuffer());
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const r2Url = await uploadToR2(`directory/${slug}-${postId ?? Date.now()}.jpg`, photoBuffer, "image/jpeg");

    return { externalId: place.place_id, coverUrl: r2Url };
  } catch {
    return null;
  }
}

/** Looks up a real cover (+ description, for book/film) for the entry types
 * that have an equivalent external catalog here. Every other entryType
 * (person, movement, genre, concept, artwork, fashion, tv-series) returns
 * null immediately and keeps the existing Imagen-generated image. */
async function findRealCover(
  stub: any,
  postId?: number
): Promise<{ source: "google_books" | "tmdb" | "google_places"; match: RealCatalogMatch } | null> {
  if (stub.entryType === "book") {
    const match = await findRealBookCover(stub.title, stub.infobox?.yearPublished);
    return match ? { source: "google_books", match } : null;
  }
  if (stub.entryType === "film") {
    const match = await findRealFilmCover(stub.title, stub.infobox?.year);
    return match ? { source: "tmdb", match } : null;
  }
  if (stub.entryType === "place" || stub.entryType === "food") {
    const match = await findRealPlaceCover(stub.title, stub.infobox?.originCity, postId);
    return match ? { source: "google_places", match } : null;
  }
  return null;
}

// ── Hardcoded seed list ────────────────────────────────────────────────────
const SEED_TOPICS = [
  // People
  "Fela Kuti", "Miriam Makeba", "Chinua Achebe", "Wole Soyinka",
  "Chimamanda Ngozi Adichie", "Toni Morrison", "Langston Hughes",
  "Jean-Michel Basquiat", "Kwame Nkrumah", "Steve Biko",
  "Nina Simone", "James Baldwin", "Frantz Fanon", "Octavia Butler",
  "Wizkid", "Burna Boy", "Angélique Kidjo", "Hugh Masekela",
  "Aimé Césaire", "Édouard Glissant", "El Anatsui", "Malick Sidibé",
  "Yinka Shonibare", "Njideka Akunyili Crosby", "Kehinde Wiley",
  // Places
  "Lagos", "Accra", "Nairobi", "Dakar", "Harlem", "Brixton",
  "Johannesburg", "Kingston (Jamaica)", "Port-of-Spain",
  "Marrakech", "Cape Town", "Abidjan",
  // Movements & Genres
  "Afrobeats", "Highlife", "Afrobeat", "Jùjú music", "Afrofuturism",
  "Pan-Africanism", "Negritude", "Black Arts Movement",
  "Harlem Renaissance", "Nollywood", "New African Cinema",
  "Afropunk", "Amapiano",
  // Concepts & Practices
  "Ubuntu (philosophy)", "Sankofa", "Diaspora aesthetics",
  "African wax print", "Ankara fabric", "Kente cloth",
  "Adinkra symbols", "Djembe", "Griot tradition",
  // Food & Fashion
  "Jollof Rice", "Egusi soup", "Suya", "Thieboudienne",
  "Piri Piri", "Akara", "Sadza",
  // Artworks / Landmarks
  "Black Panther (film)", "I Am Not Your Negro (film)",
  "Things Fall Apart (novel)", "Song of Solomon (novel)",
  "Beloved (novel)", "Purple Hibiscus (novel)",
  "Sankofa (film)", "Beasts of No Nation (film)",
  // Film & TV — Nigerian Web Series (YouTube / Digital-First)
  "Skinny Girl in Transit (web series)", "The Men's Club (web series)",
  "Visa on Arrival (web series)", "Gidi Up (web series)",
  "Rumour Has It (web series)", "Little Black Book (web series)",
  "Bottom Line (web series)", "MTV Shuga Naija (TV series)",
  "Best Friends in the World (web series)", "Papa Benji (web series)",
  "This Thing Called Love (web series)", "The Olive (web series)",
  "Ajoche (TV series)", "Under the Influence (web series)",
  "Halita (TV series)",
  // Film & TV — South African Series
  "Blood & Water (TV series)", "Kings of Jo'Burg (TV series)",
  "Savage Beauty (TV series)", "Shaka iLembe (TV series)",
  "How to Ruin Love (TV series)", "Lioness (South African TV series)",
  "The River (South African TV series)", "Unseen (South African TV series)",
  // Film & TV — East African Series
  "Single Kiasi (TV series)", "Pepeta (Kenyan TV series)",
  "Igiza (TV series)", "Mpakani (TV series)", "Lazizi (TV series)",
  // Film & TV — Other African & Diaspora
  "An African City (web series)", "Iyanu: Child of Wonder (animated series)",
  "What's Left of Us (web series)",
  // Film & TV — Korean (K-Dramas)
  "Squid Game (TV series)", "All of Us Are Dead (TV series)",
  "The Glory (TV series)", "Extraordinary Attorney Woo (TV series)",
  // Film & TV — Indian
  "Sacred Games (TV series)", "Mirzapur (TV series)",
  "Panchayat (TV series)", "Kota Factory (TV series)",
  // Film & TV — Latin American
  "La Casa de Papel (TV series)", "Elite (Spanish TV series)",
  "Dark Desire (TV series)",
  // Film & TV — US / UK Streaming Era
  "Stranger Things (TV series)", "Breaking Bad (TV series)",
  "The Wire (TV series)", "Game of Thrones (TV series)",
  "Black Mirror (TV series)", "Insecure (TV series)",
  // Film & TV — Other Global
  "Dark (German TV series)", "Lupin (French TV series)",
];

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Titles of all published directory entries (lowercased).
 * Paginates through WPGraphQL 100 nodes at a time to bypass the default
 * connection limit — without this, any entry beyond #100 is invisible to
 * the duplicate check and gets re-seeded on every run.
 */
async function getExistingTitles(): Promise<Set<string>> {
  const titles = new Set<string>();
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const query = `
      query GetDirectoryTitles($after: String) {
        cultureDirectories(first: 100, after: $after, where: { status: PUBLISH }) {
          pageInfo { hasNextPage endCursor }
          nodes { title }
        }
      }
    `;
    try {
      const res: Response = await fetch(WP_GRAPHQL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { after: cursor } }),
        cache: "no-store",
      });
      const json: any = await res.json();
      const conn = json.data?.cultureDirectories;
      if (!conn) break;

      for (const node of (conn.nodes ?? []) as { title: string }[]) {
        titles.add(node.title.toLowerCase().trim());
      }

      hasNextPage = conn.pageInfo?.hasNextPage ?? false;
      cursor = conn.pageInfo?.endCursor ?? null;
    } catch {
      break;
    }
  }

  return titles;
}

/** Extra / AI-generated topics stored in WordPress. */
async function getExtraTopics(): Promise<string[]> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/extra-topics`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json.topics) ? json.topics : [];
  } catch {
    return [];
  }
}

/** Persist newly AI-generated topics back to WordPress. */
async function saveExtraTopics(topics: string[]): Promise<void> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/extra-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ topics }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal — the run continues even if the save fails.
  }
}

/**
 * Original seed topic strings already successfully submitted.
 * This is the primary duplicate guard: Gemini often changes the title
 * (e.g., "Fela Kuti" → "Fela Anikulapo-Kuti"), so a title-only check
 * would never match and the topic would be re-seeded every run.
 */
async function getProcessedTopics(): Promise<Set<string>> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/processed-topics`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) return new Set();
    const json = await res.json();
    return new Set(
      (json.topics ?? []).map((t: string) => t.toLowerCase().trim())
    );
  } catch {
    return new Set();
  }
}

/** Record the original seed topic strings that were successfully submitted. */
async function saveProcessedTopics(topics: string[]): Promise<void> {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/directory/processed-topics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ topics }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal.
  }
}

async function submitEntry(
  stub: any,
  generateImage: boolean
): Promise<{ success: boolean; postId?: number; title: string }> {
  const secret = process.env.CULTURE_API_SECRET ?? "";

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      user_id:      0,
      title:        stub.title,
      excerpt:      stub.excerpt,
      content:      stub.content,
      entry_type:   stub.entryType,
      interests:    stub.interests,
      infobox:      stub.infobox ?? {},
      ai_generated: true,
      auto_publish: true,
    }),
    cache: "no-store",
  });

  if (!res.ok) return { success: false, title: stub.title };
  const data = await res.json();
  const postId: number = data.post_id;

  if (generateImage && postId) {
    try {
      // Try the real catalog first for book/film/place/food — a real cover
      // photo + real synopsis beats an AI illustration and AI-written
      // blurb, and skips the Imagen call + R2 upload entirely when it
      // matches (Places still uses R2, but only once, for the one photo
      // actually picked — not for Imagen generation).
      const real = await findRealCover(stub, postId);

      if (real) {
        const sourceLabel = { google_books: "Google Books", tmdb: "TMDB", google_places: "Google Places" }[real.source];
        await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            post_id: postId,
            image_url: real.match.coverUrl,
            image_title: stub.title,
            image_description: `Real photo/cover art from ${sourceLabel}.`,
            image_alt: stub.title,
            external_source: real.source,
            external_id: real.match.externalId,
          }),
          cache: "no-store",
        });

        if (real.match.description) {
          await fetch(`${WP_URL}/wp-json/culture/v1/directory/${postId}/enrich`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${secret}`,
            },
            body: JSON.stringify({
              content: real.match.description,
              excerpt: real.match.description,
            }),
            cache: "no-store",
          }).catch(() => {});
        }
      } else {
        const image = await generateDirectoryImage(
          stub.title,
          stub.entryType,
          stub.excerpt
        );
        const slug = stub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
        const key = `directory/${slug}-${postId}.jpg`;
        const imageBuffer = Buffer.from(image.data, "base64");
        const imageUrl = await uploadToR2(key, imageBuffer, "image/jpeg");

        // Save the R2 URL as post meta on the directory entry
        await fetch(`${WP_URL}/wp-json/culture/v1/directory/attach-image`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secret}`,
          },
          body: JSON.stringify({
            post_id: postId,
            image_url: imageUrl,
            image_title: image.title,
            image_description: image.description,
            image_alt: image.altText,
          }),
          cache: "no-store",
        });
      }
    } catch {
      // Image failure is best-effort; never blocks the entry.
    }
  }

  return { success: true, postId, title: stub.title };
}

// ── Route handler ──────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET ?? "";
  return !!cronSecret && req.headers.get("Authorization") === `Bearer ${cronSecret}`;
}

async function runPopulate(batchSize: number, generateImages: boolean): Promise<NextResponse> {
  const [existing, extraTopics, processed] = await Promise.all([
    getExistingTitles(),
    getExtraTopics(),
    getProcessedTopics(),
  ]);

  const allTopics = [...SEED_TOPICS, ...extraTopics];

  let pending = allTopics.filter((t) => {
    const key = t.toLowerCase().trim();
    return !existing.has(key) && !processed.has(key);
  });

  let aiGeneratedNewTopics = false;
  if (pending.length === 0) {
    let newTopics: string[] = [];
    try {
      newTopics = await generateTopicSuggestions([...existing]);
    } catch (err: any) {
      return NextResponse.json(
        { error: `All topics seeded. Topic generation failed: ${err?.message}` },
        { status: 500 }
      );
    }

    if (newTopics.length === 0) {
      return NextResponse.json({
        message: "All topics seeded and Gemini returned no new suggestions.",
        created: 0,
      });
    }

    await saveExtraTopics(newTopics);
    pending = newTopics.filter((t) => {
      const key = t.toLowerCase().trim();
      return !existing.has(key) && !processed.has(key);
    });
    aiGeneratedNewTopics = true;
  }

  const batch = [...pending].sort(() => Math.random() - 0.5).slice(0, batchSize);

  const results: Array<{ title: string; success: boolean; postId?: number }> = [];
  const successfulTopics: string[] = [];

  for (const topic of batch) {
    try {
      const stub = await generateDirectoryStub(topic);
      const result = await submitEntry(stub, generateImages);
      results.push(result);
      if (result.success) successfulTopics.push(topic);
    } catch (err: any) {
      results.push({
        title: topic,
        success: false,
        error: err?.message || "Unknown error during generation",
      } as any);
    }
    await new Promise((r) => setTimeout(r, 3500));
  }

  if (successfulTopics.length > 0) {
    await saveProcessedTopics(successfulTopics);
  }

  const created = results.filter((r) => r.success).length;
  return NextResponse.json({
    created,
    remaining: pending.length - created,
    aiGeneratedNewTopics,
    results,
  });
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }
  return runPopulate(5, true);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const batchSize: number = Math.min(Number(body.batchSize) || 5, 20);
  const generateImages: boolean = body.generateImages !== false;
  return runPopulate(batchSize, generateImages);
}
