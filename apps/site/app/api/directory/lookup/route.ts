import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Unified catalog lookup for the directory submission form.
// Routes by ?type= to the appropriate catalog:
//   book  → Google Books API + Wikipedia
//   film  → iTunes Search API (media=movie) + Wikipedia
//   album → iTunes Search API (media=music, entity=album) + Wikipedia
//   place → Google Places Text Search
//   food  → Google Places Text Search (biased to food/restaurant types)
// Wikipedia runs in parallel for film/book/album and fills gaps when catalog
// has thin results (e.g. very new releases not yet indexed by iTunes/Books).

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

async function lookupBooks(q: string) {
  const params = new URLSearchParams({ q, maxResults: "8" });
  if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];

  return items
    .filter((item) => item.volumeInfo?.title)
    .map((item) => {
      const info = item.volumeInfo ?? {};
      const ids: { type: string; identifier: string }[] = info.industryIdentifiers ?? [];
      const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
      const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;

      const infobox: Record<string, string> = {};
      const author = Array.isArray(info.authors) ? info.authors[0] : undefined;
      if (author) infobox.author = author;
      const year = info.publishedDate ? String(info.publishedDate).slice(0, 4) : undefined;
      if (year) infobox.year_published = year;
      if (info.pageCount) infobox.pages = String(info.pageCount);
      if (info.publisher) infobox.publisher = String(info.publisher);
      if (info.language) infobox.language = String(info.language).toUpperCase();
      const genre = Array.isArray(info.categories) ? info.categories[0] : undefined;
      if (genre) infobox.genre = genre;
      const isbn = isbn13 || isbn10;
      if (isbn) infobox.isbn = isbn;

      return {
        externalId: isbn13 || isbn10 || item.id,
        title: info.title as string,
        about: Array.isArray(info.authors) ? info.authors.join(", ") : undefined,
        year,
        coverUrl: info.imageLinks?.thumbnail
          ? String(info.imageLinks.thumbnail).replace(/^http:/, "https:")
          : null,
        description: typeof info.description === "string" ? info.description : undefined,
        infobox: Object.keys(infobox).length ? infobox : undefined,
      };
    })
    .slice(0, 8);
}

async function lookupITunes(q: string, media: "movie" | "music") {
  const entity = media === "movie" ? "movie" : "album";
  const params = new URLSearchParams({ term: q, media, entity, limit: "10" });

  const res = await fetch(`https://itunes.apple.com/search?${params}`, {
    next: { revalidate: 3600 },
  }).catch(() => null);
  if (!res || !res.ok) return [];

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.results) ? data.results : [];

  if (media === "movie") {
    const seen = new Set<string>();
    return items
      .filter((m) => m?.trackId && m?.trackName)
      .map((m) => {
        const year = m.releaseDate ? String(m.releaseDate).slice(0, 4) : undefined;
        const infobox: Record<string, string> = {};
        if (year) infobox.year = year;
        if (m.primaryGenreName) infobox.genre = String(m.primaryGenreName);
        // director not available from iTunes search; kept empty

        return {
          externalId: `itunes:movie:${m.trackId}`,
          title: m.trackName as string,
          about: m.artistName as string | undefined, // director-ish label
          year,
          coverUrl: m.artworkUrl100
            ? String(m.artworkUrl100).replace("100x100bb", "600x600bb")
            : null,
          description: typeof m.longDescription === "string" ? m.longDescription
            : typeof m.shortDescription === "string" ? m.shortDescription
            : undefined,
          infobox: Object.keys(infobox).length ? infobox : undefined,
        };
      })
      .filter((m) => {
        if (seen.has(m.title)) return false;
        seen.add(m.title);
        return true;
      })
      .slice(0, 8);
  }

  // music / album
  const seen = new Set<string>();
  return items
    .filter((a) => a?.collectionId && a?.collectionName)
    .map((a) => {
      const year = a.releaseDate ? String(a.releaseDate).slice(0, 4) : undefined;
      const infobox: Record<string, string> = {};
      if (year) infobox.year = year;
      if (a.trackCount) infobox.tracks = String(a.trackCount);
      if (a.primaryGenreName) infobox.genre = String(a.primaryGenreName);

      return {
        externalId: `itunes:${a.collectionId}`,
        title: a.collectionName as string,
        about: a.artistName as string | undefined,
        year,
        coverUrl: a.artworkUrl100
          ? String(a.artworkUrl100).replace("100x100bb", "600x600bb")
          : null,
        infobox: Object.keys(infobox).length ? infobox : undefined,
      };
    })
    .filter((a) => {
      const key = `${a.title}||${a.about}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

const PLACE_TYPE_BIAS: Record<string, string> = {
  food: "restaurant",
};

// Clean up Places API type strings into readable labels
function formatPlaceType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function lookupPlaces(q: string, entryType: "place" | "food") {
  if (!GOOGLE_PLACES_API_KEY) return [];

  const params = new URLSearchParams({ query: q, key: GOOGLE_PLACES_API_KEY });
  if (PLACE_TYPE_BIAS[entryType]) params.set("type", PLACE_TYPE_BIAS[entryType]);

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
    { next: { revalidate: 300 } }
  ).catch(() => null);
  if (!res || !res.ok) return [];

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.results) ? data.results : [];

  return items
    .filter((p) => p?.place_id && p?.name)
    .map((p) => {
      const photoRef: string | undefined = p.photos?.[0]?.photo_reference;
      const address: string | undefined = p.formatted_address || p.vicinity;

      const infobox: Record<string, string> = {};
      if (address) infobox.address = address;
      const primaryType = Array.isArray(p.types)
        ? (p.types as string[]).find((t) => !["point_of_interest", "establishment"].includes(t))
        : undefined;
      if (primaryType) infobox.category = formatPlaceType(primaryType);
      if (p.rating != null) infobox.rating = String(p.rating);
      if (entryType === "food" && p.price_level != null) {
        infobox.price_level = "£".repeat(Number(p.price_level));
      }

      return {
        externalId: p.place_id as string,
        title: p.name as string,
        about: address,
        year: undefined,
        // Proxy URL — key stays server-side, browser loads /api/directory/places-photo
        coverUrl: photoRef ? `/api/directory/places-photo?ref=${encodeURIComponent(photoRef)}` : null,
        // Pass the raw ref separately so the submit route can upload to R2
        photoRef: photoRef ?? null,
        infobox: Object.keys(infobox).length ? infobox : undefined,
      };
    })
    .slice(0, 8);
}

// Wikipedia search type hints — same as the enrichment endpoint
const WP_TYPE_HINT: Record<string, string> = {
  film:  "film",
  book:  "novel",
  album: "album",
};

// Suffixes added by Wikipedia to disambiguate articles — strip before dedup
const WP_DISAMBIG_SUFFIX = /\s*\([^)]+\)\s*$/;

function normalizeTitle(t: string): string {
  return t.replace(WP_DISAMBIG_SUFFIX, "").toLowerCase().trim();
}

async function lookupWikipedia(q: string, type: string) {
  const hint = WP_TYPE_HINT[type];
  const query = hint ? `${q} ${hint}` : q;

  // 1. Opensearch: get up to 5 candidate article titles
  const osRes = await fetch(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
      action: "opensearch",
      search: query,
      limit: "5",
      redirects: "resolve",
      format: "json",
      origin: "*",
    })}`,
    { next: { revalidate: 1800 } }
  ).catch(() => null);
  if (!osRes?.ok) return [];

  const osData = await osRes.json().catch(() => null);
  const titles: string[] = Array.isArray(osData?.[1]) ? osData[1] : [];
  if (!titles.length) return [];

  // 2. Batch page fetch: intro extract + thumbnail for all candidates at once
  const pageRes = await fetch(
    `https://en.wikipedia.org/w/api.php?${new URLSearchParams({
      action: "query",
      prop: "extracts|pageimages",
      exintro: "1",
      exsentences: "3",
      titles: titles.join("|"),
      pithumbsize: "600",
      redirects: "1",
      pilicense: "any",
      format: "json",
      origin: "*",
    })}`,
    { next: { revalidate: 1800 } }
  ).catch(() => null);
  if (!pageRes?.ok) return [];

  const pageData = await pageRes.json().catch(() => null);
  const pages: Record<string, any> = pageData?.query?.pages ?? {};

  return Object.values(pages)
    .filter((p: any) => p && !("missing" in p) && p.title)
    .map((p: any) => {
      const rawExtract: string = p.extract ?? "";
      const plainText = rawExtract.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      const description = plainText || undefined;

      return {
        source: "wikipedia" as const,
        externalId: `wikipedia:${(p.title as string).replace(/ /g, "_")}`,
        title: p.title as string,
        about: undefined,
        year: undefined,
        coverUrl: (p.thumbnail?.source as string) ?? null,
        description,
        infobox: undefined,
      };
    })
    .slice(0, 5);
}

function mergeWithWiki(
  catalogResults: { title: string }[],
  wikiResults: { title: string }[]
) {
  const catalogTitles = new Set(catalogResults.map((r) => normalizeTitle(r.title)));
  const wikiOnly = wikiResults.filter(
    (r) => !catalogTitles.has(normalizeTitle(r.title))
  );
  return [...catalogResults, ...wikiOnly].slice(0, 10);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  if (type === "book" || type === "film" || type === "album") {
    const [catalogResults, wikiResults] = await Promise.all([
      type === "book"
        ? lookupBooks(q)
        : lookupITunes(q, type === "film" ? "movie" : "music"),
      lookupWikipedia(q, type),
    ]);
    return NextResponse.json(mergeWithWiki(catalogResults, wikiResults));
  }

  if (type === "place" || type === "food") {
    const [catalogResults, wikiResults] = await Promise.all([
      lookupPlaces(q, type as "place" | "food"),
      lookupWikipedia(q, type),
    ]);
    return NextResponse.json(mergeWithWiki(catalogResults, wikiResults));
  }

  // All other types (person, movement, genre, concept, artwork, fashion…)
  // have no dedicated catalog — Wikipedia only.
  if (type) {
    return NextResponse.json(await lookupWikipedia(q, type));
  }

  return NextResponse.json([]);
}
