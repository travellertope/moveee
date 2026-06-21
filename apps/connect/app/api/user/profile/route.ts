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

  // Fetch the full live profile from WP (points, badges, credits, etc.)
  let live = {
    points:                u.points as number ?? 0,
    badges:                u.badges as string[] ?? [],
    credits:               u.credits as number ?? 0,
    reputation:            u.reputation as number ?? 0,
    reputationTier:        u.reputationTier as string ?? "member",
    dailyCreditsRemaining: u.dailyCreditsRemaining as number ?? 50,
    interests:             u.interests as string[] ?? [],
  };
  try {
    const res = await fetch(`${WP_URL}/wp-json/culture/v1/user/profile?user_id=${u.id}`, {
      headers: wpAuthHeaders(),
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (typeof data.points === 'number')                   live.points               = data.points;
      if (Array.isArray(data.badges))                        live.badges               = data.badges;
      if (typeof data.credits === 'number')                  live.credits              = data.credits;
      if (typeof data.reputation === 'number')               live.reputation           = data.reputation;
      if (typeof data.reputation_tier === 'string')          live.reputationTier       = data.reputation_tier;
      if (typeof data.daily_credits_remaining === 'number')  live.dailyCreditsRemaining = data.daily_credits_remaining;
      if (Array.isArray(data.interests))                     live.interests            = data.interests;
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
    credits: live.credits,
    reputation: live.reputation,
    reputationTier: live.reputationTier,
    dailyCreditsRemaining: live.dailyCreditsRemaining,
    interests: live.interests,
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
    "directory_opt_in", "directory_bio", "directory_disciplines",
    "directory_instagram", "directory_linkedin", "directory_website", "directory_twitter",
  ];

  const payload: Record<string, unknown> = { user_id: String(u.id) };
  for (const key of allowed) {
    if (body[key] !== undefined) {
      payload[key] = String(body[key]).trim();
    }
  }
  // Interests is an array — pass through directly.
  if (Array.isArray((body as any).interests)) {
    payload.interests = (body as any).interests;
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
