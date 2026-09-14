import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWPData, GET_STORY_BY_SLUG } from "@/lib/wp";
import { getAccessLevel } from "@/lib/access";
import { sanitizeHtml } from "@/lib/sanitize";
import { LITERARY_TOKEN_COOKIE, verifyLiteraryToken, truncateHtmlByPercent } from "@/lib/literary-access";

const READ_PERCENT = 0.3;

/**
 * Returns the withheld remainder of a Magazine article's body once the
 * reader is authorized — same shape as /api/literary/remainder, called by
 * MagazinePieceGate.tsx after a successful email/OTP verification, so the
 * rest of the article appears in place without a full page reload.
 *
 * No free-read metering here (unlike /literary's public pieces) — a
 * member-only/patron-only Magazine article always gates on first visit, so
 * the only two authorization paths are a real session or a verified
 * magic-code token. Any verified token satisfies member-only outright
 * (per the decision to treat magic-code verification as equivalent to
 * having a free account); patron-only still requires the token's own
 * access level to be "pro" specifically, or a real Moveee Pro session.
 */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug") || "";
  if (!slug) {
    return NextResponse.json({ error: "Slug is required." }, { status: 400 });
  }

  let data;
  try {
    data = await getWPData(GET_STORY_BY_SLUG, { slug });
  } catch {}
  const post = data?.post;
  if (!post) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const accessLevel = getAccessLevel(post);
  const token = verifyLiteraryToken(request.cookies.get(LITERARY_TOKEN_COOKIE)?.value);

  let authorized = false;
  if (accessLevel === "patron-only") {
    authorized = session?.user?.tier === "patron" || token?.access === "pro";
  } else if (accessLevel === "member-only") {
    authorized = !!session?.user || !!token;
  } else {
    authorized = true;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const html = sanitizeHtml(post.content || "");
  const { remainderHtml } = truncateHtmlByPercent(html, READ_PERCENT);
  return NextResponse.json({ html: remainderHtml });
}
