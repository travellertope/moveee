import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** GET /api/vendor/shipping/zones — list all shipping zones */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const [zonesRes, methodsAll] = await Promise.all([
      fetch(`${CMS}/wp-json/wc/v3/shipping/zones?${wcAuth()}`, { cache: "no-store" }),
      fetch(`${CMS}/wp-json/wcfmmp/v1/store-vendors/${user.id}/shipping?${wcAuth()}`, { cache: "no-store" }),
    ]);

    if (!zonesRes.ok) return NextResponse.json({ error: "Could not load zones" }, { status: zonesRes.status });
    const zones = await zonesRes.json();

    // Fetch methods for each zone
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
