import { NextRequest, NextResponse } from "next/server";

const WP = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const FIELDS = [
  "id", "slug", "title", "excerpt", "date",
  "meta", "culture_event_meta", "_links", "_embedded",
].join(",");

export async function GET(req: NextRequest) {
  const per_page = req.nextUrl.searchParams.get("per_page") ?? "50";
  const url = `${WP}/wp-json/wp/v2/culture_event?per_page=${per_page}&status=publish&_embed=wp:featuredmedia&_fields=${FIELDS}&orderby=date&order=asc`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 300 }, // cache 5 min on the edge
    });
    if (!res.ok) return NextResponse.json({ error: `WP ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Failed" }, { status: 502 });
  }
}
