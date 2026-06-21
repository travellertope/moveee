import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_KEY = process.env.CULTURE_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ products: [], total: 0 });

  const upstream = `${WP_URL}/wp-json/culture/v1/mobile/shop/products?s=${encodeURIComponent(q)}&per_page=20`;
  const res = await fetch(upstream, {
    headers: { "x-api-key": API_KEY },
    next: { revalidate: 0 },
  });

  if (!res.ok) return NextResponse.json({ products: [], total: 0 }, { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
