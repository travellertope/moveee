import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const country_iso = searchParams.get("country_iso");

  if (!country_iso) return NextResponse.json({ error: "country_iso required." }, { status: 400 });

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/reloadly/products?country_iso=${encodeURIComponent(country_iso)}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` } }
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
