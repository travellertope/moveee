import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

// Trigger via: POST /api/admin/migrate-community-posts
// Authorization: Bearer {CULTURE_API_SECRET}
// Safe to run multiple times — idempotent.
export async function POST(req: NextRequest) {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/admin/migrate-community-posts`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${secret}`,
          "X-Culture-API-Secret": secret,
        },
        cache: "no-store",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return NextResponse.json(
        { error: (data as any).message ?? "Migration failed", wpStatus: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Could not reach WordPress" }, { status: 503 });
  }
}
