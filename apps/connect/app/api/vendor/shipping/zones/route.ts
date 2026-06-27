import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOwnedZoneIds, recordZoneOwner } from "@/lib/vendor-shipping";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** GET /api/vendor/shipping/zones — list all shipping zones with methods */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const zonesRes = await fetch(`${CMS}/wp-json/wc/v3/shipping/zones?${wcAuth()}`, { cache: "no-store" });
    if (!zonesRes.ok) return NextResponse.json({ error: "Could not load zones" }, { status: zonesRes.status });
    const allZones = await zonesRes.json();

    const ownedZoneIds = new Set(await getOwnedZoneIds(user.id));
    const zones = allZones.filter((zone: any) => ownedZoneIds.has(Number(zone.id)));

    const zonesWithMethods = await Promise.all(
      zones.map(async (zone: any) => {
        try {
          const mRes = await fetch(
            `${CMS}/wp-json/wc/v3/shipping/zones/${zone.id}/methods?${wcAuth()}`,
            { cache: "no-store" }
          );
          const methods = mRes.ok ? await mRes.json() : [];
          return { ...zone, methods };
        } catch {
          return { ...zone, methods: [] };
        }
      })
    );

    return NextResponse.json(zonesWithMethods);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** POST /api/vendor/shipping/zones — create a new shipping zone */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload: any = {};
  if (body.name)             payload.name  = String(body.name);
  if (body.order !== undefined) payload.order = Number(body.order);

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/shipping/zones?${wcAuth()}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed to create zone" }, { status: res.status });
    await recordZoneOwner(data.id, user.id);
    return NextResponse.json({ ...data, methods: [] }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
