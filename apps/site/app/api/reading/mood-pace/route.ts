import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

// Reading aggregated mood/pace for a book — Phase 3, see
// docs/reading-tracker-plan.md §1.3/§3.4. Deliberately public (aggregate
// moods/pace is a community-visible property of the book, same as
// _average_rating) — the session, when present, is only used to also return
// the viewer's own current vote so the UI can show "edit your vote" instead
// of the initial voting prompt.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directory_id") ?? "";
  if (!directoryId) {
    return NextResponse.json({ error: "directory_id is required." }, { status: 400 });
  }

  const session = (await getServerSession(authOptions as any).catch(() => null)) as any;
  const userIdParam = session?.user?.id ? `&user_id=${session.user.id}` : "";

  const res = await fetch(
    `${WP_URL}/wp-json/culture/v1/reading/mood-pace?directory_id=${directoryId}${userIdParam}`,
    {
      headers: { Authorization: `Bearer ${API_SECRET}` },
      cache: "no-store",
    }
  ).catch(() => null);

  if (!res) return NextResponse.json({ error: "Could not reach the server." }, { status: 502 });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}
