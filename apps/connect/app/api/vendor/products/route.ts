import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS     = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

function guardVendor(user: any) {
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

/** GET /api/vendor/products?page=1&per_page=20&status=any */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  const err     = guardVendor(user);
  if (err) return err;

  const sp       = req.nextUrl.searchParams;
  const page     = sp.get("page")     ?? "1";
  const perPage  = sp.get("per_page") ?? "20";
  const status   = sp.get("status")   ?? "any";
  const search   = sp.get("search")   ?? "";

  const params = new URLSearchParams({
    author:   String(user.id),
    page,
    per_page: perPage,
    status,
    ...(search ? { search } : {}),
  });

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/products?${params}&${wcAuth()}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return NextResponse.json({ error: body.message ?? "WooCommerce error" }, { status: res.status });
    }

    const products = await res.json();
    const total    = parseInt(res.headers.get("X-WP-Total")      ?? "0", 10);
    const pages    = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);

    // Normalize to the shape the UI needs
    const items = products.map((p: any) => ({
      id:          p.id,
      name:        p.name,
      slug:        p.slug,
      status:      p.status,
      price:       p.price,
      regularPrice: p.regular_price,
      salePrice:   p.sale_price,
      stockStatus: p.stock_status,
      stockQty:    p.stock_quantity,
      image:       p.images?.[0]?.src ?? null,
      categories:  (p.categories ?? []).map((c: any) => c.name),
      type:        p.type,
      dateCreated: p.date_created,
    }));

    return NextResponse.json({ items, total, pages });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** POST /api/vendor/products — create a new product */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  const err     = guardVendor(user);
  if (err) return err;

  let body: Record<string, any>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Build WC product payload — only allow safe fields
  const payload: Record<string, any> = {
    name:          body.name        ?? "",
    status:        body.status      ?? "draft",
    description:   body.description ?? "",
    short_description: body.shortDescription ?? "",
    regular_price: String(body.regularPrice ?? ""),
    sale_price:    body.salePrice ? String(body.salePrice) : "",
    manage_stock:  body.manageStock ?? false,
    stock_quantity: body.stockQty != null ? Number(body.stockQty) : null,
    stock_status:  body.stockStatus ?? "instock",
    categories:    (body.categories ?? []).map((id: number) => ({ id })),
    images:        (body.images ?? []).map((src: string) => ({ src })),
    meta_data: [
      { key: "_wcfm_product_author", value: String(user.id) },
      ...(body.makerStory       ? [{ key: "maker_story",        value: body.makerStory       }] : []),
      ...(body.careInstructions ? [{ key: "care_instructions",  value: body.careInstructions }] : []),
      ...(body.deliveryInfo     ? [{ key: "delivery_info",      value: body.deliveryInfo     }] : []),
      ...(body.processSteps     ? [{ key: "process_steps",      value: body.processSteps     }] : []),
    ],
  };

  if (!payload.name) {
    return NextResponse.json({ error: "Product name is required" }, { status: 422 });
  }

  try {
    const res = await fetch(`${CMS}/wp-json/wc/v3/products?${wcAuth()}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Create failed" }, { status: res.status });
    }
    return NextResponse.json({ id: data.id, slug: data.slug }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
