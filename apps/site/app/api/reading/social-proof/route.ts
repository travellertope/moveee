import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// How many of the viewer's follows have logged this entry — requires a
// session (there's no follow graph to read for an anonymous visitor).

export async function GET(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";
  if (!directoryId) {
    return NextResponse.json({ error: "directory_id is required." }, { status: 400 });
  }

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/reading/social-proof?user_id=${session.user.id}&directory_id=${directoryId}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
