import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// TMDB has no keyless tier — a free API key is required. Degrades to empty
// results (not an error) when absent, same as the Google Books/Spotify
// routes, so the manual "add anyway" fallback in DirectorySearch still works.
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || !TMDB_API_KEY) return NextResponse.json([]);

  const params = new URLSearchParams({ api_key: TMDB_API_KEY, query: q, include_adult: "false" });
  const res = await fetch(`https://api.themoviedb.org/3/search/movie?${params}`, {
    next: { revalidate: 3600 },
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json([]);

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.results) ? data.results : [];

  // No director here — TMDB's search endpoint carries no crew data. Resolved
  // lazily via /credits, only for the film the user actually picks (mirrors
  // Spotify's preview-clip lookup, avoids an N+1 fan-out across every result).
  const results = items
    .filter((m) => m?.id && m?.title)
    .slice(0, 8)
    .map((m) => ({
      externalId: String(m.id),
      title: m.title as string,
      year: m.release_date ? String(m.release_date).slice(0, 4) : undefined,
      coverUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
    }));

  return NextResponse.json(results);
}
