import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = "https://cms.themoveee.com/wp-json/culture/v1/user/interactions";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET;

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({
      liked_articles: [],
      bookmarked_articles: [],
      liked_quotes: [],
      bookmarked_quotes: [],
    });
  }

  const user = session.user as any;

  try {
    const res = await fetch(`${WP_URL}?user_id=${user.id}`, {
      headers: {
        "Authorization": `Bearer ${CULTURE_API_SECRET}`,
        "X-Culture-API-Secret": CULTURE_API_SECRET || "",
      },
      next: { revalidate: 0 },
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
