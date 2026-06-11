import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.error("[Visuals Track] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!API_SECRET) {
      console.error("[Visuals Track] Server Configuration Error: CULTURE_API_SECRET is not set.");
      return NextResponse.json({ error: "Server Configuration Error" }, { status: 500 });
    }

    const user = session.user as any;
    const isPatron = user.tier === 'patron' || user.tier === 'leader';
    
    // Optional: Pre-check limit in session to save a WP hit
    if (!isPatron && user.visual_downloads_today >= 5) {
      return NextResponse.json({ 
        error: "Daily limit reached", 
        count: user.visual_downloads_today,
        limit_reached: true 
      }, { status: 403 });
    }

    const wpRes = await fetch(`${WP_URL}/wp-json/culture/v1/visuals/track-download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_SECRET}`,
      },
      body: JSON.stringify({
        user_id: user.id
      }),
      cache: 'no-store'
    });

    const data = await wpRes.json();

    if (!wpRes.ok) {
      console.error(`[Visuals Track] WordPress API Error (${wpRes.status}):`, data);
      return NextResponse.json({ 
        error: data.message || "Tracking failed", 
        limit_reached: wpRes.status === 403 
      }, { status: wpRes.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Visuals Track] Unexpected Error:", error.message);
    return NextResponse.json({ error: "Unexpected Tracking Error" }, { status: 500 });
  }
}
