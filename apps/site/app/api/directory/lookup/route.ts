import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Unified catalog lookup for the directory submission form.
// Routes by ?type= to the appropriate catalog:
//   book  → Google Books API
//   film  → iTunes Search API (media=movie)
//   album → iTunes Search API (media=music, entity=album)

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) return NextResponse.json([]);

  if (type === "book") {
    return NextResponse.json(await lookupBooks(q));
  }
  if (type === "film") {
    return NextResponse.json(await lookupITunes(q, "movie"));
  }
  if (type === "album") {
    return NextResponse.json(await lookupITunes(q, "music"));
  }

  return NextResponse.json({ error: "Invalid type. Use book, film, or album." }, { status: 400 });
}
