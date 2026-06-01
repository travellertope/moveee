import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuthParams() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

/** GET /api/vendor/stats?vendor_id=123 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = session.user as any;
  if (!user.isVendor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const vendorId = req.nextUrl.searchParams.get("vendor_id");
  if (!vendorId || vendorId !== String(user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch vendor product count, pending orders, earnings, and recent orders
  // in parallel via WooCommerce REST API.
  try {
    const [productsRes, ordersRes, reportRes] = await Promise.allSettled([
      fetch(
        `${CMS}/wp-json/wc/v3/products?author=${vendorId}&per_page=1&${wcAuthParams()}`,
        { cache: "no-store" }
      ),
      fetch(
        `${CMS}/wp-json/wc/v3/orders?status=pending&per_page=5&${wcAuthParams()}`,
        { cache: "no-store" }
      ),
      fetch(
        `${CMS}/wp-json/wcfmmp/v1/reports/vendor_sales?vendor_id=${vendorId}&${wcAuthParams()}`,
        { cache: "no-store" }
      ),
    ]);

    // Product count from X-WP-Total header
    const totalProducts =
      productsRes.status === "fulfilled" && productsRes.value.ok
        ? parseInt(productsRes.value.headers.get("X-WP-Total") ?? "0", 10)
        : 0;

    // Recent orders
    let recentOrders: any[] = [];
    let pendingOrders = 0;
    if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
      const orders = await ordersRes.value.json();
      // Filter to vendor's orders — WCFM splits line items by vendor
      const vendorOrders = Array.isArray(orders)
        ? orders.filter((o: any) =>
            o.line_items?.some((li: any) => String(li.meta_data?.find((m: any) => m.key === "_vendor_id")?.value) === vendorId)
          )
        : [];
      pendingOrders = vendorOrders.filter((o: any) => o.status === "pending").length;
      recentOrders = vendorOrders.slice(0, 5).map((o: any) => ({
        id:       o.id,
        date:     o.date_created,
        status:   o.status,
        total:    o.currency_symbol + o.total,
        customer: `${o.billing?.first_name ?? ""} ${o.billing?.last_name ?? ""}`.trim() || "Guest",
      }));
    }

    // Earnings from WCFM report
    let totalEarnings = "£0.00";
    if (reportRes.status === "fulfilled" && reportRes.value.ok) {
      const report = await reportRes.value.json();
      if (report?.total_sales) {
        totalEarnings = String(report.total_sales);
      }
    }

    // Vendor rating from GraphQL bridge
    let rating = "";
    try {
      const ratingRes = await fetch(
        `${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(user.vendorSlug)}`,
        { cache: "no-store" }
      );
      if (ratingRes.ok) {
        const vData = await ratingRes.json();
        rating = vData.rating ?? "";
      }
    } catch { /* not critical */ }

    return NextResponse.json({
      totalProducts,
      pendingOrders,
      totalEarnings,
      rating,
      recentOrders,
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
