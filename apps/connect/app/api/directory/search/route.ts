import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

// Public WP endpoint (no secret needed) — proxied only because
// components/composer/DirectorySearch.tsx expects a same-origin relative path.
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
  ).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json([], { status: res?.status ?? 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
