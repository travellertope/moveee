import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> }
) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const { postId } = await params;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  let res: Response;
  try {
    res = await fetch(
      `${WP_URL}/wp-json/culture/v1/community/event/attendees?user_id=${session.user.id}&post_id=${encodeURIComponent(postId)}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store", signal: ctrl.signal }
    );
  } catch {
    clearTimeout(timer);
    return NextResponse.json({ error: "CMS unavailable." }, { status: 503 });
  }
  clearTimeout(timer);

  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    return NextResponse.json({ error: "CMS returned an unexpected response." }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
