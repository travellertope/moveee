import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/register-options`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({ user_id: session.user.id }),
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
