import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  try {
    // Note: We don't need the API_SECRET here because we are just fetching the user profile 
    // which the WP REST API already handles via its own authentication or internal logic 
    // if we use a specific public -but-identity-verified endpoint.
    // However, to keep it simple, we'll hit the /user/profile if it exists or use our tracking endpoint without count++
    
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${user.id}`, {
      headers: {
        "Authorization": `Bearer ${process.env.CULTURE_API_SECRET}`,
      },
      cache: 'no-store'
    });

    const data = await res.json();
    return NextResponse.json({
      count: data.visual_downloads_today ?? 0
    });
  } catch (error) {
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
