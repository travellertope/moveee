import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;

  const profileRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/member/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!profileRes.ok) {
    return NextResponse.json({ pinned_posts: [], items: [] });
  }
  const profile = await profileRes.json();

  const portfolioRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/user/portfolio?user_id=${profile.id}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );
  if (!portfolioRes.ok) {
    return NextResponse.json({ pinned_posts: [], items: [] });
  }
  return NextResponse.json(await portfolioRes.json());
}
