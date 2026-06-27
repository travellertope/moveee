import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

function guardVendor(user: any) {
  if (!user)          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isVendor) return NextResponse.json({ error: "Forbidden"    }, { status: 403 });
  return null;
}

/** Normalise a WC order into the shape the UI needs.
 *  Filters line_items to only those belonging to this vendor. */
function normaliseOrder(o: any, vendorId: string) {
  const allItems: any[] = o.line_items ?? [];
  // Keep only items assigned to this vendor (WCFM stores vendor_id in meta)
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
    subtotal:      o.currency_symbol + (o.subtotal ?? o.total),
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
      name:     `${o.shipping?.first_name ?? ""} ${o.shipping?.last_name ?? ""}`.trim(),
      address1: o.shipping?.address_1 ?? "",
      address2: o.shipping?.address_2 ?? "",
      city:     o.shipping?.city      ?? "",
      state:    o.shipping?.state     ?? "",
      postcode: o.shipping?.postcode  ?? "",
      country:  o.shipping?.country   ?? "",
    },
    items: items.map((li) => ({
      id:       li.id,
      name:     li.name,
      quantity: li.quantity,
      total:    o.currency_symbol + li.total,
      sku:      li.sku ?? "",
      image:    li.image?.src ?? null,
      productId: li.product_id,
      slug:      (li.meta_data ?? []).find((m: any) => m.key === "_product_slug")?.value ?? "",
    })),
    paymentMethod: o.payment_method_title ?? "",
    customerNote:  o.customer_note ?? "",
    notes:         [], // fetched separately on detail view
  };
}

/** GET /api/vendor/orders?page=1&per_page=20&status=any&search= */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  const err     = guardVendor(user);
  if (err) return err;

  const sp      = req.nextUrl.searchParams;
  const page    = sp.get("page")     ?? "1";
  const perPage = sp.get("per_page") ?? "20";
  const status  = sp.get("status")   ?? "";
  const search  = sp.get("search")   ?? "";

  // Try WCFM vendor orders endpoint first (returns only this vendor's orders)
  try {
    const wcfmParams = new URLSearchParams({
      vendor_id: String(user.id),
      page,
      per_page: perPage,
      ...(status && status !== "any" ? { status } : {}),
    });

    const wcfmRes = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/orders?${wcfmParams}&${wcAuth()}`,
      { cache: "no-store" }
    );

    if (wcfmRes.ok) {
      const raw    = await wcfmRes.json();
      const orders = Array.isArray(raw) ? raw : raw.orders ?? [];
      const total  = parseInt(wcfmRes.headers.get("X-WP-Total") ?? String(orders.length), 10);
      const pages  = parseInt(wcfmRes.headers.get("X-WP-TotalPages") ?? "1", 10);

      return NextResponse.json({
        items: orders.map((o: any) => normaliseOrder(o, String(user.id))),
        total,
        pages,
      });
    }
  } catch { /* fall through to WC API */ }

  // Fallback: standard WC orders endpoint filtered by customer meta
  try {
    const wcParams = new URLSearchParams({
      page,
      per_page: perPage,
      ...(status && status !== "any" ? { status } : {}),
      ...(search ? { search } : {}),
    });

    const wcRes = await fetch(
      `${CMS}/wp-json/wc/v3/orders?${wcParams}&${wcAuth()}`,
      { cache: "no-store" }
    );

    if (!wcRes.ok) {
      return NextResponse.json({ error: "Could not fetch orders" }, { status: wcRes.status });
    }

    const all    = await wcRes.json();
    const total  = parseInt(wcRes.headers.get("X-WP-Total") ?? "0", 10);
    const pages  = parseInt(wcRes.headers.get("X-WP-TotalPages") ?? "1", 10);

    // Filter to only orders that include at least one item from this vendor
    const vendorId = String(user.id);
    const mine = all.filter((o: any) =>
      (o.line_items ?? []).some((li: any) => {
        const meta = (li.meta_data ?? []).find(
          (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
        );
        return !!meta && String(meta.value) === vendorId;
      })
    );

    return NextResponse.json({
      items: mine.map((o: any) => normaliseOrder(o, vendorId)),
      total,
      pages,
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
