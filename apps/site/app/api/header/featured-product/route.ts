import { NextResponse } from "next/server";
import { getWPData, GET_PRODUCTS_EXTRA } from "@/lib/wp";

// Powers the header's menu-overlay "From the Shop" card — a small,
// site-wide slot (every page renders the same Header), independent of
// whatever product data an individual page may or may not have already
// fetched. Deliberately lean: 8 newest products, pick one at random,
// return only what the card needs. Cached 5 minutes since it's decorative,
// not transactional.
export async function GET() {
  try {
    const data = await getWPData(GET_PRODUCTS_EXTRA, { first: 8 }, { revalidate: 300 });
    const nodes: any[] = data?.products?.nodes || [];
    if (nodes.length === 0) return NextResponse.json({ product: null });

    const pick = nodes[Math.floor(Math.random() * nodes.length)];
    const product = {
      name: pick.name,
      slug: pick.slug,
      price: pick.price || pick.regularPrice || "",
      image: pick.image?.sourceUrl || null,
      vendor: pick.vendorProfile?.storeName || null,
    };
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ product: null });
  }
}
