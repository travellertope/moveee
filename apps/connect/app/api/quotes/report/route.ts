import { NextRequest, NextResponse } from "next/server";

const WP_URL = "https://cms.themoveee.com/wp-json/culture/v1/quotes/report";

export async function POST(req: NextRequest) {
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
    const res = await fetch(WP_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ quote_id: quoteId }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json({ error: errorData.message || "Report failed" }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
