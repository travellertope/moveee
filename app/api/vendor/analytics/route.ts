import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

type Period = "7d" | "30d" | "90d" | "1y";

function periodDays(p: Period): number {
  return { "7d": 7, "30d": 30, "90d": 90, "1y": 365 }[p];
}

function dateFrom(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function groupByDay(orders: any[], vendorId: string, days: number) {
  // Build a map of date → revenue
  const map = new Map<string, number>();
  // Pre-fill every day in range with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    map.set(d.toISOString().slice(0, 10), 0);
  }

  for (const o of orders) {
    const day = (o.date_created ?? "").slice(0, 10);
    if (!map.has(day)) continue;
    const items: any[] = o.line_items ?? [];
    let total = 0;
    for (const li of items) {
      const meta = (li.meta_data ?? []).find(
        (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
      );
      if (!meta || String(meta.value) === vendorId) {
        total += parseFloat(li.total ?? "0");
      }
    }
    map.set(day, (map.get(day) ?? 0) + total);
  }

  return [...map.entries()].map(([date, revenue]) => ({ date, revenue }));
}

function topProducts(orders: any[], vendorId: string, limit = 5) {
  const map = new Map<number, { name: string; revenue: number; qty: number; image: string | null }>();
  for (const o of orders) {
    for (const li of o.line_items ?? []) {
      const meta = (li.meta_data ?? []).find(
        (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
      );
      if (meta && String(meta.value) !== vendorId) continue;
      const pid = li.product_id as number;
      const existing = map.get(pid);
      if (existing) {
        existing.revenue += parseFloat(li.total ?? "0");
        existing.qty     += li.quantity ?? 1;
      } else {
        map.set(pid, {
          name:    li.name,
          revenue: parseFloat(li.total ?? "0"),
          qty:     li.quantity ?? 1,
          image:   li.image?.src ?? null,
        });
      }
    }
  }
  return [...map.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

function statusBreakdown(orders: any[]) {
  const map: Record<string, number> = {};
  for (const o of orders) {
    map[o.status] = (map[o.status] ?? 0) + 1;
  }
  return Object.entries(map)
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

/** GET /api/vendor/analytics?period=30d */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const period    = (req.nextUrl.searchParams.get("period") ?? "30d") as Period;
  const days      = periodDays(period);
  const afterDate = dateFrom(days);
  const vendorId  = String(user.id);
  const currency  = req.nextUrl.searchParams.get("currency") ?? "£";

  // Fetch all orders in period for this vendor — we'll paginate up to 200
  let orders: any[] = [];

  try {
    // Try WCFM vendor orders first
    const wcfmRes = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/orders?vendor_id=${vendorId}&after=${afterDate}&per_page=100&${wcAuth()}`,
      { cache: "no-store" }
    );
    if (wcfmRes.ok) {
      const raw = await wcfmRes.json();
      orders = Array.isArray(raw) ? raw : raw.orders ?? [];
    }
  } catch { /* fall through */ }

  if (!orders.length) {
    // Fallback: standard WC orders
    try {
      const p1 = await fetch(
        `${CMS}/wp-json/wc/v3/orders?after=${afterDate}T00:00:00&per_page=100&page=1&${wcAuth()}`,
        { cache: "no-store" }
      );
      if (p1.ok) orders = await p1.json();
    } catch { /* best-effort */ }
  }

  // Filter to vendor's orders only
  const vendorOrders = orders.filter((o) =>
    (o.line_items ?? []).some((li: any) => {
      const meta = (li.meta_data ?? []).find(
        (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
      );
      return !meta || String(meta.value) === vendorId;
    })
  );

  // Aggregate
  let totalRevenue   = 0;
  let totalQty       = 0;
  for (const o of vendorOrders) {
    for (const li of o.line_items ?? []) {
      const meta = (li.meta_data ?? []).find(
        (m: any) => m.key === "_vendor_id" || m.key === "vendor_id"
      );
      if (meta && String(meta.value) !== vendorId) continue;
      totalRevenue += parseFloat(li.total ?? "0");
      totalQty     += li.quantity ?? 1;
    }
  }

  const orderCount  = vendorOrders.length;
  const avgOrderVal = orderCount > 0 ? totalRevenue / orderCount : 0;

  // Fetch commission rate from WCFM
  let commissionRate = 0.10; // default 10%
  try {
    const commRes = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/store-vendors/${vendorId}?${wcAuth()}`,
      { cache: "no-store" }
    );
    if (commRes.ok) {
      const vendor = await commRes.json();
      const rate   = parseFloat(vendor.commission?.type === "percent"
        ? vendor.commission.amount ?? "10"
        : "10");
      commissionRate = rate / 100;
    }
  } catch { /* use default */ }

  const commissionAmount = totalRevenue * commissionRate;
  const netEarnings      = totalRevenue - commissionAmount;

  // Fetch WCFM payout balance
  let pendingPayout = 0;
  try {
    const balRes = await fetch(
      `${CMS}/wp-json/wcfmmp/v1/withdrawal?vendor_id=${vendorId}&${wcAuth()}`,
      { cache: "no-store" }
    );
    if (balRes.ok) {
      const bal = await balRes.json();
      pendingPayout = parseFloat(bal.current_balance ?? bal.balance ?? "0");
    }
  } catch { /* non-critical */ }

  return NextResponse.json({
    period,
    currency,
    summary: {
      totalRevenue:   parseFloat(totalRevenue.toFixed(2)),
      orderCount,
      avgOrderValue:  parseFloat(avgOrderVal.toFixed(2)),
      itemsSold:      totalQty,
    },
    earnings: {
      gross:        parseFloat(totalRevenue.toFixed(2)),
      commission:   parseFloat(commissionAmount.toFixed(2)),
      commissionRate: Math.round(commissionRate * 100),
      net:          parseFloat(netEarnings.toFixed(2)),
      pendingPayout: parseFloat(pendingPayout.toFixed(2)),
    },
    chart:          groupByDay(vendorOrders, vendorId, days),
    topProducts:    topProducts(vendorOrders, vendorId),
    statusBreakdown: statusBreakdown(vendorOrders),
  });
}
