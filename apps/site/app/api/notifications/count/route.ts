import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ unread: 0 });

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/notifications/count?user_id=${session.user.id}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  );
  const data = await res.json();
  // private: browser-level cache only (not shared/CDN). 30s TTL absorbs rapid
  // re-renders without delaying notification delivery beyond the 120s poll cycle.
  return NextResponse.json(data, {
    status: res.status,
    headers: { "Cache-Control": "private, max-age=30" },
  });
}
