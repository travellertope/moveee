import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_API_URL = (process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com") + "/wp-json/culture/v1";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, post_id } = await request.json();

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  try {
    const user = session.user as any;
    const res = await fetch(`${WP_API_URL}/points/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CULTURE_API_SECRET}`,
      },
      body: JSON.stringify({
        user_id: parseInt(user.id),
        action,
        post_id: post_id ? parseInt(post_id) : undefined,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
