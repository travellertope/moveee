import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

function parseGoogleComponents(components: any[]): { street: string; city: string; country: string } {
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

async function searchGoogle(q: string) {
  const params = new URLSearchParams({ query: q, key: GOOGLE_PLACES_API_KEY });
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`,
    { next: { revalidate: 3600 } }
  ).catch(() => null);
  if (!res || !res.ok) return [];
  const data = await res.json().catch(() => null);
  const places: any[] = Array.isArray(data?.results) ? data.results : [];
  return places.slice(0, 8).map((place) => {
    const { street, city, country } = parseGoogleComponents(place.address_components ?? []);
    return {
      externalId: place.place_id as string,
      title: place.name as string,
      about: place.formatted_address as string | undefined,
      year: undefined as string | undefined,
      coverUrl: null as null,
      street: street || (place.name as string),
      city,
      country,
      lat: (place.geometry?.location?.lat as number) ?? null,
      lng: (place.geometry?.location?.lng as number) ?? null,
    };
  });
}

async function searchNominatim(q: string) {
  const params = new URLSearchParams({ q, format: "jsonv2", addressdetails: "1", limit: "8", dedupe: "1" });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: { "User-Agent": "Moveee/1.0 (themoveee.com)" },
      next: { revalidate: 3600 },
    }
  ).catch(() => null);
  if (!res || !res.ok) return [];
  const data: any[] = await res.json().catch(() => []);
  return (Array.isArray(data) ? data : []).slice(0, 8).map((place) => {
    const addr = place.address ?? {};
    const city = addr.city ?? addr.town ?? addr.village ?? addr.county ?? addr.state_district ?? addr.state ?? "";
    const country = addr.country ?? "";
    const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
    const name = place.name || (place.display_name as string)?.split(",")[0]?.trim() || q;
    return {
      externalId: `osm:${place.osm_type?.charAt(0).toUpperCase()}${place.osm_id}`,
      title: name,
      about: place.display_name as string | undefined,
      year: undefined as string | undefined,
      coverUrl: null as null,
      street: street || name,
      city,
      country,
      lat: place.lat ? parseFloat(place.lat) : null,
      lng: place.lon ? parseFloat(place.lon) : null,
    };
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);

  if (GOOGLE_PLACES_API_KEY) {
    const results = await searchGoogle(q);
    if (results.length > 0) return NextResponse.json(results);
  }

  // Nominatim (OpenStreetMap) — free fallback, no API key required
  const results = await searchNominatim(q);
  return NextResponse.json(results);
}
