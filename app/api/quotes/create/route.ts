import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = "https://cms.themoveee.com/wp-json/culture/v1/quotes";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to submit a quote." }, { status: 401 });
  }

  let text, author, source;
  try {
    const body = await req.json();
    text = body?.text?.trim();
    author = body?.author?.trim();
    source = body?.source?.trim();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!text || !author) {
    return NextResponse.json({ error: "Quote text and author are required." }, { status: 400 });
  }

  try {
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CULTURE_API_SECRET}`
      },
      body: JSON.stringify({ 
        text, 
        author, 
        source, 
        user_id: parseInt((session.user as any).id) 
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({ error: data.message || "Failed to create quote" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
