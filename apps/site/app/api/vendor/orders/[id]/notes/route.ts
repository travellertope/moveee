import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** POST /api/vendor/orders/[id]/notes — add a note to an order */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: { note: string; customerNote?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (!body.note?.trim()) {
    return NextResponse.json({ error: "Note text is required" }, { status: 422 });
  }

  try {
    const res = await fetch(`${CMS}/wp-json/wc/v3/orders/${id}/notes?${wcAuth()}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        note:          body.note.trim(),
        customer_note: body.customerNote ?? false,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Failed to add note" }, { status: res.status });
    }
    return NextResponse.json({
      id:           data.id,
      note:         data.note,
      dateCreated:  data.date_created,
      customerNote: data.customer_note,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
