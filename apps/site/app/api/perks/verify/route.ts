import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/perks/verify?token=${encodeURIComponent(token)}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
