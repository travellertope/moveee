import { NextResponse } from "next/server";

const WP_API = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

// force-dynamic: this proxies a live WP REST call. Without it, `revalidate`
// alone causes Next to execute (and cache the result of) this handler at
// *build* time — which broke the Vercel build when the CMS response body
// was empty/non-JSON at that moment (`res.json()` threw and failed the
// whole build). Fetch caching is still handled by `next: { revalidate }`.
export const dynamic = "force-dynamic";

export async function GET() {
  const res = await fetch(`${WP_API}/wp-json/culture/v1/mobile/points-config`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return NextResponse.json({ error: "Failed to load config" }, { status: 502 });

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    return NextResponse.json({ error: "Invalid config response" }, { status: 502 });
  }
  return NextResponse.json(data);
}
