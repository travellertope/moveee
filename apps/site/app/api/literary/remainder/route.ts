import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWPData, GET_STORY_BY_SLUG, isLiteraryPost } from "@/lib/wp";
import { getAccessLevel } from "@/lib/access";
import { sanitizeHtml } from "@/lib/sanitize";
import {
  LITERARY_TOKEN_COOKIE,
  LITERARY_READS_COOKIE,
  LITERARY_FREE_READ_LIMIT,
  parseReadsCookie,
  verifyLiteraryToken,
  truncateHtmlByPercent,
} from "@/lib/literary-access";

const READ_PERCENT = 0.3;

/**
 * Returns the withheld remainder of a Literary piece's body once the reader
 * is authorized — called by LiteraryPieceGate.tsx after a successful
 * email/OTP verification, so the rest of the piece appears in place without
 * a full page reload (preserving scroll position/reading state, per the
 * "silently refreshed via AJAX" requirement).
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
  if (!post || !isLiteraryPost(post)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  const accessLevel = getAccessLevel(post);
  const litToken = verifyLiteraryToken(request.cookies.get(LITERARY_TOKEN_COOKIE)?.value);

  let authorized = false;
  if (accessLevel === "patron-only") {
    authorized = session?.user?.tier === "patron" || litToken?.access === "pro";
  } else {
    const isLoggedIn = !!session?.user;
    const reads = parseReadsCookie(request.cookies.get(LITERARY_READS_COOKIE)?.value);
    const hasFreeReadsLeft = reads.length < LITERARY_FREE_READ_LIMIT;
    authorized = isLoggedIn || !!litToken || hasFreeReadsLeft;
  }

  if (!authorized) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const html = sanitizeHtml(post.content || "");
  const { remainderHtml } = truncateHtmlByPercent(html, READ_PERCENT);
  return NextResponse.json({ html: remainderHtml });
}
