import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WP_API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { title, entry_type, location_name, location_lat, location_lng } = body as {
    title?: string;
    entry_type?: string;
    location_name?: string;
    location_lat?: number;
    location_lng?: number;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const user = session.user as any;

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WP_API_SECRET}`,
    },
    body: JSON.stringify({
      user_id: user.id ?? user.userId ?? 0,
      title,
      entry_type,
      location_name,
      location_lat,
      location_lng,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data?.message ?? "Creation failed." }, { status: res.status });
  }

  return NextResponse.json(data);
}
