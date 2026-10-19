import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = Number(session.user.id);

  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/user/referrals?user_id=${userId}`,
      {
        headers: { Authorization: `Bearer ${API_SECRET}` },
        cache: "no-store",
      }
    );
    if (!res.ok) throw new Error("upstream error");
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Failed to load referral data" }, { status: 502 });
  }
}
