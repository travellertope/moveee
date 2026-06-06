import { NextRequest, NextResponse } from "next/server";
import { scrapeOgTags } from "@/lib/og-scraper";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  try {
    const og = await scrapeOgTags(url);
    return NextResponse.json(og);
  } catch {
    return NextResponse.json({ title: "", description: "", image: "" });
  }
}
