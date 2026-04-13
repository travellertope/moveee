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

/** GET /api/user/profile — returns current session data (no extra WP call needed) */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const u = session.user as any;
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
    points: u.points ?? 0,
    badges: u.badges ?? [],
    primaryChapter: u.primaryChapter ?? null,
    secondaryChapter: u.secondaryChapter ?? null,
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
  ];

  const payload: Record<string, string> = { user_id: String(u.id) };
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = String(body[key]).trim();
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
