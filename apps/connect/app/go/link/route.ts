import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.redirect(new URL("/feed", req.url));

  // Basic safety: only redirect to http/https URLs
  try {
    const dest = new URL(url);
    if (dest.protocol !== "http:" && dest.protocol !== "https:") {
      return NextResponse.redirect(new URL("/feed", req.url));
    }
    return NextResponse.redirect(dest.href, { status: 302 });
  } catch {
    return NextResponse.redirect(new URL("/feed", req.url));
  }
}
