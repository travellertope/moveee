import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// One entry's own log state, for the shelf control on a directory entry page.
//
// The session is optional here, which every other reading/* route is not: a
// logged-out visitor still gets the entry's medium back so the page can label
// its buttons with the right verbs ("Want to Go" on a restaurant, "Want to
// Read" on a book) before prompting them to sign in. Status and rating stay
// empty without a session — user_id is still resolved server-side and never
// read from the query string.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";
  if (!directoryId) {
    return NextResponse.json({ error: "directory_id is required." }, { status: 400 });
  }

  const session = (await getServerSession(authOptions as any).catch(() => null)) as any;
  const userIdParam = session?.user?.id ? `&user_id=${session.user.id}` : "";

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/reading/entry?directory_id=${directoryId}${userIdParam}`,
    { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
