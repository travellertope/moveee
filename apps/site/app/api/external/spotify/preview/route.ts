import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Lazily resolves a 30s preview clip for an album via iTunes Lookup API.
// Called only when the user actually selects a search result.
// albumId is in the form "itunes:<collectionId>" (set by the search route).
// iTunes preview_url availability varies by track/region — can return null.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const albumId = searchParams.get("albumId")?.trim() ?? "";
  if (!albumId) return NextResponse.json({ previewUrl: null });

  // Strip the "itunes:" prefix added by the search route
  const collectionId = albumId.startsWith("itunes:")
    ? albumId.slice("itunes:".length)
    : albumId;

  if (!collectionId || !/^\d+$/.test(collectionId)) {
    return NextResponse.json({ previewUrl: null });
  }

  const params = new URLSearchParams({ id: collectionId, entity: "song", limit: "1" });
  const res = await fetch(`https://itunes.apple.com/lookup?${params}`, {
    next: { revalidate: 3600 },
  }).catch((e) => {
    console.error("[itunes-preview] lookup threw:", e instanceof Error ? e.message : e);
    return null;
  });

  if (!res || !res.ok) return NextResponse.json({ previewUrl: null });

  const data = await res.json().catch(() => null);
  const results: any[] = Array.isArray(data?.results) ? data.results : [];
  // First result is the album itself (wrapperType: "collection"), second is the track
  const track = results.find((r) => r.wrapperType === "track");
  const previewUrl = track?.previewUrl ?? null;

  return NextResponse.json({ previewUrl });
}
