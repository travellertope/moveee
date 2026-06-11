import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

type RouteParams = { params: Promise<{ zoneId: string; instanceId: string }> };

/** PATCH /api/vendor/shipping/zones/[zoneId]/methods/[instanceId] — update method settings */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { zoneId, instanceId } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload: any = {};
  if (body.enabled !== undefined) payload.enabled = Boolean(body.enabled);
  if (body.settings)              payload.settings = body.settings;
  if (body.order !== undefined)   payload.order    = Number(body.order);

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/shipping/zones/${zoneId}/methods/${instanceId}?${wcAuth()}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Update failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** DELETE /api/vendor/shipping/zones/[zoneId]/methods/[instanceId] — remove method */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { zoneId, instanceId } = await params;

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/shipping/zones/${zoneId}/methods/${instanceId}?force=true&${wcAuth()}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({ error: data.message ?? "Delete failed" }, { status: res.status });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
