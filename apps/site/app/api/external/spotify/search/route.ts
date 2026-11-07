import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Uses the iTunes Search API — no API key required, returns albums with
// cover art, artist, and release year. externalId uses the iTunes collectionId
// (stable numeric ID) prefixed with "itunes:" to avoid collision with any
// legacy Spotify IDs that may exist in the directory.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  const params = new URLSearchParams({
    term: q,
    entity: "album",
    limit: "10",
    media: "music",
  });

  const res = await fetch(`https://itunes.apple.com/search?${params}`, {
    next: { revalidate: 3600 },
  }).catch((e) => {
    console.error("[itunes-search] request threw:", e instanceof Error ? e.message : e);
    return null;
  });

  if (!res) return NextResponse.json([]);
  if (!res.ok) {
    console.error(`[itunes-search] rejected: ${res.status} ${res.statusText}`);
    return NextResponse.json([]);
  }

  const data = await res.json().catch(() => null);
  const items: any[] = Array.isArray(data?.results) ? data.results : [];

  const seen = new Set<string>();
  const results = items
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

  return NextResponse.json(results);
}
