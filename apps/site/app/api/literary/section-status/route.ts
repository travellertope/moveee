import { NextResponse } from "next/server";

const WP_GRAPHQL_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

/**
 * Per-section open/closed state for the Literary submission form — see
 * Culture_Literary_Submissions::handle_section_status() in
 * class-culture-literary-submissions.php. Public, no auth needed (mirrors
 * request-code's own reasoning — nothing sensitive here, just which
 * sections are currently taking submissions).
 */
export async function GET() {
  try {
    const res = await fetch(`${WP_BASE_URL}/wp-json/culture/v1/literary/section-status`, {
      cache: "no-store",
    });
    if (!res.ok) {
      // Fail open — an unreachable WP shouldn't hide the whole form, just
      // means every section shows as open until the status can be checked.
      return NextResponse.json({});
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({});
  }
}
