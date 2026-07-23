import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

function getBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

// Proxied here (not hit directly from the mobile app) because WordPress's
// quick-create endpoint is gated by CULTURE_API_SECRET, not a per-user JWT —
// that secret must stay server-side. The endpoint also needs an explicit
// user_id (it has no session of its own to derive one from), so it's
// resolved first from the caller's own mobile JWT.
export async function POST(req: NextRequest) {
  const token = getBearerToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const meRes = await fetch(`${WP_URL}/wp-json/culture/v1/mobile/me`, {
    headers: { Authorization: `Bearer ${token}` },
  }).catch(() => null);
  const userId = meRes?.ok ? (await meRes.json().catch(() => ({})))?.id : null;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, user_id: userId }),
  }).catch(() => null);

  if (!res || !res.ok) {
    return NextResponse.json({ error: "Could not create directory entry." }, { status: res?.status ?? 502 });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
