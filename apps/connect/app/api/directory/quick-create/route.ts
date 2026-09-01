import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions as any)) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/directory/quick-create`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, user_id: session.user.id }),
  }).catch(() => null);

  // This call authenticates with the server's own CULTURE_API_SECRET, not
  // the signed-in user — a 401/403 here means the secret is misconfigured,
  // not that the user is unauthorized, so don't forward it as 401.
  if (!res || !res.ok) {
    const status = !res ? 502 : res.status === 401 || res.status === 403 ? 502 : res.status;
    return NextResponse.json({ error: "Could not create directory entry." }, { status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}
