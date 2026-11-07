import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const TMDB_API_KEY = process.env.TMDB_API_KEY ?? "";

// Lazily resolves the director + runtime for a film — called only when the
// user actually selects a search result, not for every row in the list.
// Both calls run in parallel since they're independent endpoints on TMDB.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const movieId = searchParams.get("movieId")?.trim() ?? "";
  if (!movieId || !TMDB_API_KEY) return NextResponse.json({ director: null, runtime: null });

  const [creditsRes, detailRes] = await Promise.all([
    fetch(
      `https://api.themoviedb.org/3/movie/${encodeURIComponent(movieId)}/credits?api_key=${TMDB_API_KEY}`
    ).catch(() => null),
    fetch(
      `https://api.themoviedb.org/3/movie/${encodeURIComponent(movieId)}?api_key=${TMDB_API_KEY}`
    ).catch(() => null),
  ]);

  const creditsData = creditsRes?.ok ? await creditsRes.json().catch(() => null) : null;
  const detailData = detailRes?.ok ? await detailRes.json().catch(() => null) : null;

  const crew: any[] = Array.isArray(creditsData?.crew) ? creditsData.crew : [];
  const director = crew.find((c) => c.job === "Director")?.name ?? null;
  const runtimeMins = typeof detailData?.runtime === "number" && detailData.runtime > 0
    ? detailData.runtime
    : null;
  const runtime = runtimeMins ? `${runtimeMins} min` : null;

  return NextResponse.json({ director, runtime });
}
