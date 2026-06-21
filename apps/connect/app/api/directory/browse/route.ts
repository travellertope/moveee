import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();

  for (const key of ["q", "type", "region", "sort", "page", "per_page"]) {
    const v = searchParams.get(key);
    if (v) params.set(key, v);
  }

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/directory/browse?${params.toString()}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json({ entries: [], total: 0, page: 1, perPage: 20 }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
