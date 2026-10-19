import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  const userId = (session.user as any).id ?? (session.user as any).userId;
  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/portfolio/pin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_SECRET}`,
    },
    body: JSON.stringify({ ...body, user_id: userId }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: data?.message ?? "Pin failed." }, { status: res.status });
  return NextResponse.json(data);
}
