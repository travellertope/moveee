import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

async function ownershipCheck(user: any, productId: string): Promise<boolean> {
  // Verify the product is authored by this vendor before allowing mutation
  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/products/${productId}?${wcAuth()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return false;
    const p = await res.json();
    const authorMeta = p.meta_data?.find((m: any) => m.key === "_wcfm_product_author");
    const authorId   = authorMeta?.value ?? String(p.post_author ?? "");
    return String(authorId) === String(user.id);
  } catch { return false; }
}

/** GET /api/vendor/products/[id] */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  try {
    const res = await fetch(`${CMS}/wp-json/wc/v3/products/${id}?${wcAuth()}`, {
      cache: "no-store",
    });
    if (!res.ok) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const p = await res.json();

    // Ownership guard
    const authorMeta = p.meta_data?.find((m: any) => m.key === "_wcfm_product_author");
    const authorId   = authorMeta?.value ?? String(p.post_author ?? "");
    if (String(authorId) !== String(user.id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const meta = (key: string) =>
      p.meta_data?.find((m: any) => m.key === key)?.value ?? "";

    return NextResponse.json({
      id:               p.id,
      name:             p.name,
      slug:             p.slug,
      status:           p.status,
      description:      p.description,
      shortDescription: p.short_description,
      regularPrice:     p.regular_price,
      salePrice:        p.sale_price,
      manageStock:      p.manage_stock,
      stockQty:         p.stock_quantity,
      stockStatus:      p.stock_status,
      type:             p.type,
      categories:       (p.categories ?? []).map((c: any) => ({ id: c.id, name: c.name })),
      images:           (p.images ?? []).map((img: any) => img.src),
      makerStory:       meta("maker_story"),
      careInstructions: meta("care_instructions"),
      deliveryInfo:     meta("delivery_info"),
      processSteps:     meta("process_steps"),
    });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** PATCH /api/vendor/products/[id] */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!(await ownershipCheck(user, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, any>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload: Record<string, any> = {};
  if (body.name             != null) payload.name              = body.name;
  if (body.status           != null) payload.status            = body.status;
  if (body.description      != null) payload.description       = body.description;
  if (body.shortDescription != null) payload.short_description = body.shortDescription;
  if (body.regularPrice     != null) payload.regular_price     = String(body.regularPrice);
  if (body.salePrice        != null) payload.sale_price        = body.salePrice ? String(body.salePrice) : "";
  if (body.manageStock      != null) payload.manage_stock      = body.manageStock;
  if (body.stockQty         != null) payload.stock_quantity    = Number(body.stockQty);
  if (body.stockStatus      != null) payload.stock_status      = body.stockStatus;
  if (body.categories       != null) payload.categories        = body.categories.map((id: number) => ({ id }));
  if (body.images           != null) payload.images            = body.images.map((src: string) => ({ src }));

  const extraMeta: any[] = [];
  if (body.makerStory       != null) extraMeta.push({ key: "maker_story",        value: body.makerStory       });
  if (body.careInstructions != null) extraMeta.push({ key: "care_instructions",  value: body.careInstructions });
  if (body.deliveryInfo     != null) extraMeta.push({ key: "delivery_info",      value: body.deliveryInfo     });
  if (body.processSteps     != null) extraMeta.push({ key: "process_steps",      value: body.processSteps     });
  if (extraMeta.length > 0) payload.meta_data = extraMeta;

  try {
    const res = await fetch(`${CMS}/wp-json/wc/v3/products/${id}?${wcAuth()}`, {
      method:  "PUT",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data.message ?? "Update failed" }, { status: res.status });
    }
    return NextResponse.json({ id: data.id, slug: data.slug });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}

/** DELETE /api/vendor/products/[id] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  if (!(await ownershipCheck(user, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // force=true moves to trash; use force=true to permanently delete if needed
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/products/${id}?force=false&${wcAuth()}`,
      { method: "DELETE" }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ error: data.message ?? "Delete failed" }, { status: res.status });
    }
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }
}
