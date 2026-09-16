import { NextRequest, NextResponse } from "next/server";

const WP_BASE = process.env.NEXT_PUBLIC_WORDPRESS_API_URL?.replace(/\/graphql\/?$/, "") ?? "https://cms.themoveee.com";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!code) {
    return NextResponse.json({ error: "missing_code" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `${WP_BASE}/wp-json/culture/v1/literary/submission/status?code=${encodeURIComponent(code)}`,
      { cache: "no-store" }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
