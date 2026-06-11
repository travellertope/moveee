import { NextRequest, NextResponse } from "next/server";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // SimpleWebAuthn nests clientDataJSON/authenticatorData/signature inside body.response.
  // PHP's verify_assertion() expects them at the top level.
  const flatResp = {
    id:                body.id,
    rawId:             body.rawId,
    clientDataJSON:    body.response?.clientDataJSON,
    authenticatorData: body.response?.authenticatorData,
    signature:         body.response?.signature,
    userHandle:        body.response?.userHandle,
    _challenge_key:    body._challenge_key,
  };
  const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/login-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(flatResp),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok && !data.error && data.message) data.error = data.message;
  return NextResponse.json(data, { status: res.status });
}
