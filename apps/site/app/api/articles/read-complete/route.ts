import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = "https://cms.themoveee.com/wp-json/culture/v1/articles/read-complete";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  let body: { post_id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.post_id) {
    return NextResponse.json({ error: "post_id is required" }, { status: 400 });
  }

  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CULTURE_API_SECRET}`,
      },
      body: JSON.stringify({ user_id: parseInt(user.id), post_id: body.post_id }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
