import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// TMDB has no keyless tier — a free API key is required. Degrades to empty
// results (not an error) when absent, same as the Google Books/Spotify
// routes, so the manual "add anyway" fallback in DirectorySearch still works.
const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

// TMDB's movie genre IDs are a small, stable, well-known set — no need for
// a live /genre/movie/list call. Mapped down to the composer's own curated
// FILM_GENRES vocabulary (SubmitPost.tsx); a TMDB genre with no match here
// (Adventure, Crime, Family, Fantasy, History, Horror, Music, Mystery,
// TV Movie, War, Western) is simply dropped, not force-mapped to something
// close — this only ever pre-selects the chip UI's existing "+ Other" list,
// never invents a genre value that isn't already offered.
const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action", 16: "Animation", 35: "Comedy", 99: "Documentary",
  18: "Drama", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller",
};

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
      genres: Array.isArray(m.genre_ids)
        ? Array.from(new Set(m.genre_ids.map((id: number) => TMDB_GENRE_MAP[id]).filter(Boolean)))
        : undefined,
    }));

  return NextResponse.json(results);
}
