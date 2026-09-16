import { NextResponse } from "next/server";
import { getWPData, GET_PRODUCT_CATEGORIES, GET_SHOP_PRO_DISCOUNT_PERCENT } from "@/lib/wp";

const DEFAULT_PRO_DISCOUNT_PERCENT = 10;

// Powers ShopHeader.tsx's "Categories" dropdown and its ticker's live
// "Moveee Pro saves X% storewide" line — a site-wide slot (every route
// under /shop renders the same standalone header), independent of whatever
// product/category data an individual page may or may not have already
// fetched server-side. Same "small client-fetched slot" pattern as
// /api/header/featured-product. Cached 5 minutes since both change rarely.
export const dynamic = "force-dynamic";

export async function GET() {
  let categories: { name: string; slug: string; count: number }[] = [];
  let proDiscountPercent = DEFAULT_PRO_DISCOUNT_PERCENT;

  try {
    const data = await getWPData(GET_PRODUCT_CATEGORIES, {}, { revalidate: 300 });
    const nodes: any[] = data?.productCategories?.nodes || [];
    categories = nodes.map((c) => ({
      name: c.name,
      slug: c.slug,
      count: c.count ?? 0,
    }));
  } catch {
    // categories stays []
  }

  try {
    const data = await getWPData(GET_SHOP_PRO_DISCOUNT_PERCENT, {}, { revalidate: 300 });
    if (typeof data?.moveeeShopProDiscountPercent === "number") {
      proDiscountPercent = data.moveeeShopProDiscountPercent;
    }
  } catch {
    // proDiscountPercent stays at the default
  }

  return NextResponse.json({ categories, proDiscountPercent });
}
