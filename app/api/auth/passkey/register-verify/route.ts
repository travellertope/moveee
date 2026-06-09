import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/register-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({ user_id: session.user.id, response: body }),
    cache: "no-store",
  });
  const data = await res.json();
  // WP_Error comes back as { code, message, data } — normalise to { error }
  if (!res.ok && !data.error && data.message) {
    data.error = data.message;
  }
  return NextResponse.json(data, { status: res.status });
}
