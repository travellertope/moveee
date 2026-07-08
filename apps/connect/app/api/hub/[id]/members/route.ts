import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/hub/${id}/members${qs ? `?${qs}` : ""}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
