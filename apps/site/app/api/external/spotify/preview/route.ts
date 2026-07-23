import { NextRequest, NextResponse } from "next/server";
import { getSpotifyToken } from "@/lib/spotify";

export const runtime = "nodejs";

// Lazily resolves a 30s preview clip for an album — called only when the
// user actually selects a search result, not for every row in the list.
// Spotify's preview_url has gotten less reliable over the last couple of
// years (a meaningful share of tracks now return null due to licensing),
// so this can legitimately come back empty.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("albumId")?.trim() ?? "";
  if (!albumId) return NextResponse.json({ previewUrl: null });

  const token = await getSpotifyToken();
  if (!token) return NextResponse.json({ previewUrl: null });

  const res = await fetch(`https://api.spotify.com/v1/albums/${encodeURIComponent(albumId)}/tracks?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ previewUrl: null });

  const data = await res.json().catch(() => null);
  const previewUrl = data?.items?.[0]?.preview_url ?? null;

  return NextResponse.json({ previewUrl });
}
