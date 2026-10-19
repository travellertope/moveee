import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any) as any;
  if (!session?.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const body = await req.json();
  // SimpleWebAuthn nests clientDataJSON/authenticatorData/signature inside body.response.
  // PHP's verify_assertion() expects them at the top level.
  const flatResp = {
    id:                body.id,
    rawId:             body.rawId,
    clientDataJSON:    body.response?.clientDataJSON,
    authenticatorData: body.response?.authenticatorData,
    signature:         body.response?.signature,
    userHandle:        body.response?.userHandle,
  };
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/step-up-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
    body: JSON.stringify({ user_id: session.user.id, response: flatResp }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok && !data.error && data.message) data.error = data.message;
  return NextResponse.json(data, { status: res.status });
}
