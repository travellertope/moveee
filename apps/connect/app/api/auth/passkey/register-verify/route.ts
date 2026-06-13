import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

async function resolveUserId(req: NextRequest): Promise<string | undefined> {
  const session = await getServerSession(authOptions as any) as any;
  if (session?.user?.id) return session.user.id;

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.replace(/^Bearer\s+/i, "");
  if (!bearerToken) return undefined;

  try {
    const meRes = await fetch(`${WP_URL}/wp-json/culture/v1/mobile/me`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
      cache: "no-store",
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      return meData.id?.toString();
    }
  } catch {}
  return undefined;
}

export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  // Mobile sends fields flat at top level; web (SimpleWebAuthn) nests under body.response.
  const flatResp = {
    clientDataJSON:    body.response?.clientDataJSON    ?? body.clientDataJSON,
    attestationObject: body.response?.attestationObject ?? body.attestationObject,
    device_name:       body.device_name,
    transports:        body.transports ?? body.response?.transports ?? [],
  };

  const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/register-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({ user_id: userId, response: flatResp }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok && !data.error && data.message) {
    data.error = data.message;
  }
  return NextResponse.json(data, { status: res.status });
}
