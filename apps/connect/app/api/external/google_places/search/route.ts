import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  if (!GOOGLE_PLACES_API_KEY) return NextResponse.json([]);

  const params = new URLSearchParams({ query: q, key: GOOGLE_PLACES_API_KEY });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
    { next: { revalidate: 3600 } }
  ).catch(() => null);

  if (!res || !res.ok) return NextResponse.json([]);

  const data = await res.json().catch(() => null);
  const places: any[] = Array.isArray(data?.results) ? data.results : [];

  const results = places.slice(0, 8).map((place) => ({
    externalId: place.place_id as string,
    title: place.name as string,
    about: place.formatted_address as string | undefined,
    year: undefined as string | undefined,
    coverUrl: null as null,
  }));

  return NextResponse.json(results);
}
