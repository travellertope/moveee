import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({ q });
  if (type) params.set("type", type);

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/directory/search?${params}`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    return NextResponse.json([], { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
