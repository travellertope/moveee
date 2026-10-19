import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const COMMUNITY_FEED = "https://web.themoveee.com/feed";
const MAGAZINE_HOME = "/";

/**
 * Smart PWA start_url handler.
 *
 * Installed PWAs on themoveee.com use /pwa-launch as their start_url.
 * Logged-in members are sent to the community feed on web.themoveee.com;
 * guests stay on the magazine homepage. The cross-origin redirect exits
 * standalone mode for members — unavoidable under Option 1 (two separate
 * domains). Resolves when the two apps eventually merge to one domain.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    return NextResponse.redirect(COMMUNITY_FEED, { status: 302 });
  }

  return NextResponse.redirect(new URL(MAGAZINE_HOME, "https://themoveee.com"), {
    status: 302,
  });
}
