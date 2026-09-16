import { draftMode, cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPreviewItem } from "@/lib/wp";

/**
 * Entry point for the "Preview" button WordPress's own Culture_Preview class
 * points at (see culture-community/includes/core/class-culture-preview.php)
 * — the token itself is the credential, verified server-side by WordPress
 * when we hand it to /culture/v1/preview/resolve. This route never trusts
 * the `type`/`slug` query params on their own; it only redirects to a path
 * built from what the verified response actually says the content is.
 *
 * On success: enables Next.js Draft Mode, stashes the raw token in its own
 * httpOnly cookie (Draft Mode's own cookie only marks "draft mode is on" —
 * it carries no payload, so the actual page still needs the token to refetch
 * the draft content on its own request), then redirects to the real page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";

  const resolved = await getPreviewItem(token);
  if (!resolved?.item) {
    return new NextResponse(
      "This preview link is invalid or has expired — reopen it from the WP Admin edit screen.",
      { status: 403 }
    );
  }

  const { type, item } = resolved;
  const slug = item.slug || request.nextUrl.searchParams.get("slug") || "";
  if (!slug) {
    return new NextResponse("Preview item has no slug yet — save the draft once in WP Admin first.", { status: 400 });
  }

  const path = type === "product" ? `/lifestyle/${slug}` : `/magazine/${slug}`;

  const draft = await draftMode();
  draft.enable();

  const cookieStore = await cookies();
  cookieStore.set("culture_preview_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });

  return NextResponse.redirect(new URL(path, request.url));
}
