import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

function parseComponents(components: any[]): { street: string; city: string; country: string } {
  let streetNum = "";
  let route = "";
  let city = "";
  let country = "";
  for (const c of components) {
    const types: string[] = c.types ?? [];
    if (types.includes("street_number")) streetNum = c.long_name;
    if (types.includes("route")) route = c.long_name;
    if (!city && types.includes("locality")) city = c.long_name;
    if (!city && types.includes("postal_town")) city = c.long_name;
    if (!city && types.includes("administrative_area_level_2")) city = c.long_name;
    if (!city && types.includes("administrative_area_level_1")) city = c.long_name;
    if (types.includes("country")) country = c.long_name;
  }
  return { street: [streetNum, route].filter(Boolean).join(" "), city, country };
}

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

  const results = places.slice(0, 8).map((place) => {
    const { street, city, country } = parseComponents(place.address_components ?? []);
    return {
      externalId: place.place_id as string,
      title: place.name as string,
      about: place.formatted_address as string | undefined,
      year: undefined as string | undefined,
      coverUrl: null as null,
      // Extended fields used by StoopPlacesInput (ignored by DirectorySearch)
      street: street || (place.name as string),
      city,
      country,
      lat: (place.geometry?.location?.lat as number) ?? null,
      lng: (place.geometry?.location?.lng as number) ?? null,
    };
  });

  return NextResponse.json(results);
}
