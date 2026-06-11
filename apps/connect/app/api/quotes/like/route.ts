import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = "https://cms.themoveee.com/wp-json/culture/v1/quotes/like";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let quoteId: number;
  try {
    const body = await req.json();
    quoteId = body?.quoteId;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!quoteId) {
    return NextResponse.json({ error: "Missing quote ID" }, { status: 400 });
  }

  try {
    // Note: In a production environment, you should add a shared secret header 
    // to authenticate requests from Next.js to WordPress.
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quote_id: quoteId, user_id: (session.user as any).id }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || "Action failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
