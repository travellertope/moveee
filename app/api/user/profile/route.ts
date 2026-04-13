import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

/**
 * GET /api/user/profile
 * Returns the authenticated user's profile from the current session.
 * No WP call needed — data is already in the JWT.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    username: user.username,
    displayName: user.displayName ?? user.name,
    tier: user.tier,
    points: user.points ?? 0,
    primaryChapter: user.primaryChapter ?? null,
    secondaryChapter: user.secondaryChapter ?? null,
    referralCode: user.referralCode ?? null,
    badges: user.badges ?? [],
    referralCount: user.referralCount ?? 0,
  });
}

/**
 * PATCH /api/user/profile
 * Updates writable profile fields.
 * Currently supported: displayName
 * Future fields (once WP endpoints exist): email, phone, whatsapp, primaryChapter, secondaryChapter
 *
 * Body: { displayName?: string }
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { displayName?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const user = session.user as any;

  // Only send fields we're actually allowing for now
  const payload: Record<string, unknown> = { userId: user.id };
  if (body.displayName !== undefined) {
    const name = body.displayName.trim();
    if (!name || name.length > 60) {
      return NextResponse.json({ error: "Display name must be 1–60 characters" }, { status: 400 });
    }
    payload.displayName = name;
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Update failed" }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({ success: true, ...data });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
