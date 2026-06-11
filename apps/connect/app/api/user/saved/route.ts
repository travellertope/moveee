import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
    "X-Culture-API-Secret": secret,
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = session.user as any;

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/user/saved?user_id=${u.id}`,
      { headers: wpAuthHeaders(), cache: "no-store" }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed" }, { status: 502 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
