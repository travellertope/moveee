import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const token = await getSpotifyToken();
  if (!token) return NextResponse.json([]);

  const params = new URLSearchParams({ q, type: "album", limit: "8" });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json([]);

  const data = await res.json().catch(() => null);
  const items: any[] = data?.albums?.items ?? [];

  // No preview_url here — album search results don't include track data.
  // The lead-track preview is resolved lazily via /preview, only for the
  // album the user actually picks (avoids an N+1 fan-out across every
  // search result).
  const results = items
    .filter((a) => a?.id && a?.name)
    .map((a) => ({
      externalId: a.id as string,
      title: a.name as string,
      about: Array.isArray(a.artists) ? a.artists.map((ar: any) => ar.name).join(", ") : undefined,
      year: a.release_date ? String(a.release_date).slice(0, 4) : undefined,
      coverUrl: a.images?.[0]?.url ?? null,
    }));

  return NextResponse.json(results);
}
