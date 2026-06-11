import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** GET /api/vendor/profile — fetch current vendor's WCFM store profile */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vendorId = String(user.id);

  try {
    const res = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/store-vendors/${vendorId}?${wcAuth()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return NextResponse.json({ error: "Could not load profile" }, { status: res.status });
    const data = await res.json();

    return NextResponse.json({
      storeName:  data.store_name  ?? "",
      bio:        data.shop_description ?? data.seller_info ?? "",
      city:       data.store_city    ?? "",
      country:    data.store_country ?? "",
      instagram:  data.instagram     ?? "",
      twitter:    data.twitter       ?? "",
      website:    data.store_url     ?? "",
      phone:      data.phone         ?? "",
      banner:     data.banner?.url   ?? "",
      avatar:     data.gravatar?.url ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** PATCH /api/vendor/profile — update vendor's WCFM store profile */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const vendorId = String(user.id);

  let body: Record<string, string>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Only allow safe profile fields
  const allowed = ["store_name", "shop_description", "store_city", "store_country",
                   "instagram", "twitter", "store_url", "phone"];
  const payload: Record<string, string> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) payload[key] = String(body[key]);
  }

  try {
    const res = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/store-vendors/${vendorId}?${wcAuth()}`,
      {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Update failed" }, { status: res.status });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
