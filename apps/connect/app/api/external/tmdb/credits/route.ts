import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

// Lazily resolves the director for a film — called only when the user
// actually selects a search result, not for every row in the list.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get("movieId")?.trim() ?? "";
  if (!movieId || !TMDB_API_KEY) return NextResponse.json({ director: null });

  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${encodeURIComponent(movieId)}/credits?api_key=${TMDB_API_KEY}`
  ).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ director: null });

  const data = await res.json().catch(() => null);
  const crew: any[] = Array.isArray(data?.crew) ? data.crew : [];
  const director = crew.find((c) => c.job === "Director")?.name ?? null;

  return NextResponse.json({ director });
}
