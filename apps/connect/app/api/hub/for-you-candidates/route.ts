import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  const hubIds = req.nextUrl.searchParams.get("hub_ids") ?? "";
  if (!hubIds) {
    return NextResponse.json({ items: [] });
  }

  const params = new URLSearchParams({ hub_ids: hubIds });
  const limit = req.nextUrl.searchParams.get("limit");
  if (limit) params.set("limit", limit);
  if (session?.user?.id) params.set("user_id", String(session.user.id));

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/hub/for-you-candidates?${params}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
