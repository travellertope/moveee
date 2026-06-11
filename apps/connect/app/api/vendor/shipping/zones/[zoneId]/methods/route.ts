import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** POST /api/vendor/shipping/zones/[zoneId]/methods — add a shipping method */
export async function POST(req: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { zoneId } = await params;
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const allowed: Record<string, any> = {};
  if (body.method_id)   allowed.method_id   = String(body.method_id);
  if (body.order !== undefined) allowed.order = Number(body.order);

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/shipping/zones/${zoneId}/methods?${wcAuth()}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(allowed) }
    );
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.message ?? "Failed to add method" }, { status: res.status });
    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
