import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const userId = session.user.id;
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";

  const qs = new URLSearchParams({ user_id: String(userId) });
  if (status) qs.set("status", status);

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/redemptions?${qs}`, {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
