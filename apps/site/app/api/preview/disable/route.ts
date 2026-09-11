import { draftMode, cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

/** Exits preview — used by the "Exit preview" banner on the previewed page. */
export async function GET(request: NextRequest) {
  const draft = await draftMode();
  draft.disable();

  const cookieStore = await cookies();
  cookieStore.delete("culture_preview_token");

  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(redirectTo, request.url));
}
