import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/hub/slug/${slug}`, {
    headers: { Authorization: `Bearer ${API_SECRET}` },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
