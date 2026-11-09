import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY ?? "";

// Server-side proxy for Google Places photos. The Places photo endpoint
// requires the API key in the request URL, so it cannot be called directly
// from the browser without exposing the key. This route fetches the image
// server-side and streams the bytes back so the submission form can preview
// cover art without the key ever reaching the client.
export async function GET(req: NextRequest) {
  if (!GOOGLE_PLACES_API_KEY) {
    return new NextResponse(null, { status: 503 });
  }

  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref || ref.length < 10) {
    return new NextResponse(null, { status: 400 });
  }

  const params = new URLSearchParams({
    photoreference: ref,
    maxwidth: "600",
    key: GOOGLE_PLACES_API_KEY,
  });

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/photo?${params}`
  ).catch(() => null);

  if (!res || !res.ok) {
    return new NextResponse(null, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const body = await res.arrayBuffer();

  return new NextResponse(body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, immutable",
    },
  });
}
