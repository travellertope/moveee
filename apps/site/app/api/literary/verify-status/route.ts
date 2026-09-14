import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LITERARY_TOKEN_COOKIE, verifyLiteraryToken } from "@/lib/literary-access";

/**
 * Lets a page (e.g. /literary/submit/form) skip the email/OTP gate when the
 * visitor already carries a valid moveee_lit_token cookie from verifying
 * elsewhere on the site (e.g. unlocking a gated /literary or /magazine
 * piece earlier in the same browser). Verified locally, same as every other
 * literary-access check on this side — no round trip to WordPress needed.
 */
export async function GET() {
  const token = (await cookies()).get(LITERARY_TOKEN_COOKIE)?.value;
  const verified = verifyLiteraryToken(token);
  if (!verified) {
    return NextResponse.json({ verified: false });
  }
  return NextResponse.json({ verified: true, email: verified.email });
}
