import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page     = searchParams.get("page")     ?? "1";
  const perPage  = searchParams.get("perPage")  ?? "12";
  const arm      = searchParams.get("arm");
  const region   = searchParams.get("region");
  const category = searchParams.get("category");

  let url =
    `${WP_URL}/wp-json/wp/v2/pulse-stories` +
    `?per_page=${perPage}&page=${page}&orderby=date&order=desc&_embed=1`;

  if (arm)      url += `&pulse_arm=${encodeURIComponent(arm)}`;
  if (region)   url += `&pulse_region=${encodeURIComponent(region)}`;
  if (category) url += `&pulse_category=${encodeURIComponent(category)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });

    if (!res.ok) {
      // WP returns 400 when page is out of range — treat as empty, not an error.
      if (res.status === 400 || res.status === 404) {
        return NextResponse.json({ stories: [], hasMore: false });
      }
      return NextResponse.json({ stories: [], hasMore: false }, { status: res.status });
    }

    const stories = await res.json();
    const total      = parseInt(res.headers.get("X-WP-Total")      ?? "0");
    const totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "0");
    const hasMore    = parseInt(page) < totalPages;

    return NextResponse.json({ stories, hasMore, total, totalPages });
  } catch (err: any) {
    console.error("[pulse/stories] fetch error:", err?.message);
    return NextResponse.json({ stories: [], hasMore: false }, { status: 502 });
  }
}
