import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

async function fetchOrder(id: string) {
  const res = await fetch(`${CMS}/wp-json/wc/v3/orders/${id}?${wcAuth()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function vendorOwnsOrder(order: any, vendorId: string): Promise<boolean> {
  if (!order) return false;
  const items: any[] = order.line_items ?? [];
  if (items.length === 0) return false;
  return items.some((li) => {
    const meta = (li.meta_data ?? []).find(
      (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
    );
    return !!meta && String(meta.value) === vendorId;
  });
}

function normaliseOrder(o: any, vendorId: string) {
  const allItems: any[] = o.line_items ?? [];
  const items = allItems.filter((li) => {
    const meta = (li.meta_data ?? []).find(
      (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
    );
    return !!meta && String(meta.value) === vendorId;
  });

  return {
    id:            o.id,
    number:        o.number,
    status:        o.status,
    dateCreated:   o.date_created,
    dateModified:  o.date_modified,
    total:         o.currency_symbol + o.total,
    shippingTotal: o.currency_symbol + (o.shipping_total ?? "0.00"),
    currency:      o.currency,
    customer: {
      id:        o.customer_id,
      firstName: o.billing?.first_name ?? "",
      lastName:  o.billing?.last_name  ?? "",
      email:     o.billing?.email      ?? "",
      phone:     o.billing?.phone      ?? "",
    },
    billing: {
      address1: o.billing?.address_1 ?? "",
      address2: o.billing?.address_2 ?? "",
      city:     o.billing?.city      ?? "",
      state:    o.billing?.state     ?? "",
      postcode: o.billing?.postcode  ?? "",
      country:  o.billing?.country   ?? "",
    },
    shipping: {
      name:     `${o.shipping?.first_name ?? ""} ${o.shipping?.last_name ?? ""}`.trim()
                || `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim(),
      address1: o.shipping?.address_1 ?? o.billing?.address_1 ?? "",
      address2: o.shipping?.address_2 ?? o.billing?.address_2 ?? "",
      city:     o.shipping?.city      ?? o.billing?.city      ?? "",
      state:    o.shipping?.state     ?? o.billing?.state     ?? "",
      postcode: o.shipping?.postcode  ?? o.billing?.postcode  ?? "",
      country:  o.shipping?.country   ?? o.billing?.country   ?? "",
    },
    items: items.map((li) => ({
      id:        li.id,
      name:      li.name,
      quantity:  li.quantity,
      total:     o.currency_symbol + li.total,
      unitPrice: o.currency_symbol + (parseFloat(li.total) / li.quantity).toFixed(2),
      sku:       li.sku ?? "",
      image:     li.image?.src ?? null,
      productId: li.product_id,
    })),
    paymentMethod: o.payment_method_title ?? "",
    customerNote:  o.customer_note ?? "",
    metaData:      o.meta_data ?? [],
  };
}

/** GET /api/vendor/orders/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id }  = await params;
  const order   = await fetchOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!(await vendorOwnsOrder(order, String(user.id)))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch order notes in parallel
  let notes: any[] = [];
  try {
    const notesRes = await fetch(
      `${CMS}/wp-json/wc/v3/orders/${id}/notes?${wcAuth()}`,
      { cache: "no-store" }
    );
    if (notesRes.ok) {
      const raw = await notesRes.json();
      notes = raw.map((n: any) => ({
        id:           n.id,
        note:         n.note,
        dateCreated:  n.date_created,
        customerNote: n.customer_note,
        addedByUser:  n.added_by_user,
      }));
    }
  } catch { /* notes are non-critical */ }

  return NextResponse.json({ ...normaliseOrder(order, String(user.id)), notes });
}

/** PATCH /api/vendor/orders/[id] — update status or add tracking meta */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id }  = await params;
  const order   = await fetchOrder(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await vendorOwnsOrder(order, String(user.id)))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, any>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Vendors may only move orders to these statuses
  const allowedStatuses = ["processing", "completed", "on-hold", "cancelled"];
  const payload: Record<string, any> = {};

  if (body.status) {
    if (!allowedStatuses.includes(body.status)) {
      return NextResponse.json({ error: "Status not allowed" }, { status: 422 });
    }
    payload.status = body.status;
  }

  // Tracking info stored as order meta
  if (body.trackingCarrier || body.trackingNumber) {
    payload.meta_data = [
      ...(body.trackingCarrier ? [{ key: "_tracking_carrier", value: body.trackingCarrier }] : []),
      ...(body.trackingNumber  ? [{ key: "_tracking_number",  value: body.trackingNumber  }] : []),
      ...(body.trackingUrl     ? [{ key: "_tracking_url",     value: body.trackingUrl     }] : []),
    ];
  }

  try {
    const res = await fetch(`${CMS}/wp-json/wc/v3/orders/${id}?${wcAuth()}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Update failed" }, { status: res.status });
    }
    return NextResponse.json({ id: data.id, status: data.status });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
