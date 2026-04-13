import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

function wpAuthHeaders() {
  const secret = process.env.CULTURE_API_SECRET ?? "";
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${secret}`,
  };
}

/** GET /api/user/profile — returns current session data + LIVE points/badges from WP */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const u = session.user as any;

  // Fetch the full live profile from WP (points, badges, chapters, etc.)
  let live = {
    points: u.points as number,
    badges: u.badges as string[],
    primaryChapter: u.primaryChapter as { id: number; name: string } | null,
    secondaryChapter: u.secondaryChapter as { id: number; name: string } | null,
  };
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${u.id}`, {
      headers: wpAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.points === 'number') live.points = data.points;
      if (Array.isArray(data.badges)) live.badges = data.badges;
      if (data.primary_chapter) live.primaryChapter = data.primary_chapter;
      if (data.secondary_chapter) live.secondaryChapter = data.secondary_chapter;
    }
  } catch (err) {
    console.error("Failed to fetch live profile data:", err);
  }

  return NextResponse.json({
    id: u.id,
    email: u.email,
    name: u.name,
    username: u.username,
    displayName: u.displayName ?? u.name,
    phone: u.phone ?? "",
    whatsapp: u.whatsapp ?? "",
    gender: u.gender ?? "",
    dateOfBirth: u.dateOfBirth ?? "",
    nationality: u.nationality ?? "",
    countryOfResidence: u.countryOfResidence ?? "",
    city: u.city ?? "",
    occupation: u.occupation ?? "",
    tier: u.tier,
    points: live.points,
    badges: live.badges,
    primaryChapter: live.primaryChapter,
    secondaryChapter: live.secondaryChapter,
    referralCode: u.referralCode ?? null,
    referralCount: u.referralCount ?? 0,
  });
}

/**
 * PATCH /api/user/profile
 * Writable fields: display_name, phone, whatsapp, gender, date_of_birth,
 *                  nationality, country_of_residence, city, occupation.
 * Email changes require a separate confirmation flow (not supported here).
 */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, string>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const u = session.user as any;
  const allowed = [
    "display_name", "phone", "whatsapp", "gender",
    "date_of_birth", "nationality", "country_of_residence", "city", "occupation",
    "primary_chapter", "secondary_chapter",
  ];

  const payload: Record<string, string | number> = { user_id: String(u.id) };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      // Chapter IDs are integers; all other fields are strings
      if (key === "primary_chapter" || key === "secondary_chapter") {
        const id = parseInt(String(body[key]), 10);
        if (!isNaN(id)) payload[key] = id;
      } else {
        payload[key] = String(body[key]).trim();
      }
    }
  }

  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/update`, {
      method: "POST",
      headers: wpAuthHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err.message ?? "Update failed" }, { status: 502 });
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
