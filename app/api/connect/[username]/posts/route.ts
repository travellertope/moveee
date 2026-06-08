import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const { username } = params;
  const { searchParams } = new URL(req.url);
  const template = searchParams.get("template") ?? "";
  const page = searchParams.get("page") ?? "1";
  const perPage = searchParams.get("per_page") ?? "20";

  // Resolve username → user ID via public member profile endpoint
  const profileRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/member/${encodeURIComponent(username)}`,
    { cache: "no-store" }
  );
  if (!profileRes.ok) {
    return NextResponse.json({ error: "Member not found." }, { status: 404 });
  }
  const profile = await profileRes.json();
  const userId: number = profile.id;

  const qs = new URLSearchParams({
    author_id: String(userId),
    per_page:  perPage,
    page,
  });
  if (template) qs.set("template_type", template);

  const postsRes = await fetch(
    `${WP_URL}/wp-json/culture/v1/community/posts?${qs}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  );
  if (!postsRes.ok) {
    return NextResponse.json({ posts: [] });
  }
  const posts = await postsRes.json();
  return NextResponse.json({ posts: Array.isArray(posts) ? posts : [] });
}
