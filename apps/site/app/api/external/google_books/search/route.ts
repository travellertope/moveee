import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Optional — Google Books works keyless at low volume, but a key raises the
// quota. Add GOOGLE_BOOKS_API_KEY in Vercel env vars if search gets rate-limited.
const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const params = new URLSearchParams({ q, maxResults: "8" });
  if (GOOGLE_BOOKS_API_KEY) params.set("key", GOOGLE_BOOKS_API_KEY);

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?${params}`, {
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json([]);

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.items) ? data.items : [];

  const results = items
    .filter((item) => item.volumeInfo?.title)
    .map((item) => {
      const info = item.volumeInfo ?? {};
      const ids: { type: string; identifier: string }[] = info.industryIdentifiers ?? [];
      const isbn13 = ids.find((i) => i.type === "ISBN_13")?.identifier;
      const isbn10 = ids.find((i) => i.type === "ISBN_10")?.identifier;
      return {
        // ISBN preferred for dedup stability across searches; falls back to
        // the Google volume ID for books with no ISBN on record.
        externalId: isbn13 || isbn10 || item.id,
        title: info.title as string,
        about: Array.isArray(info.authors) ? info.authors.join(", ") : undefined,
        year: info.publishedDate ? String(info.publishedDate).slice(0, 4) : undefined,
        // Google Books thumbnails come back as http:// — upgrade to https
        // so they don't get blocked as mixed content.
        coverUrl: info.imageLinks?.thumbnail
          ? String(info.imageLinks.thumbnail).replace(/^http:/, "https:")
          : null,
      };
    });

  return NextResponse.json(results);
}
