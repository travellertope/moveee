import { NextResponse } from "next/server";
import { getProductsWithFallback, GET_PRODUCTS, GET_PRODUCTS_UNORDERED } from "@/lib/wp";

// Powers the header's menu-overlay "From the Shop" card — a small,
// site-wide slot (every page renders the same Header), independent of
// whatever product data an individual page may or may not have already
// fetched. Deliberately lean: 8 newest products, pick one at random,
// return only what the card needs. Cached 5 minutes since it's decorative,
// not transactional. force-dynamic so the random pick itself is never
// frozen by Next's route/full-page cache — only the underlying 8-product
// GraphQL fetch is cached (via getWPData's own revalidate option), not
// which one Math.random() lands on.
export const dynamic = "force-dynamic";

// GET_PRODUCTS/GET_PRODUCTS_UNORDERED (not GET_PRODUCTS_EXTRA) — this card
// only needs name/slug/image/price, all on the base ProductFields
// fragment. GET_PRODUCTS_EXTRA deliberately omits those (see its own
// comment in wp.ts): it's a bridge-plugin-isolation query meant to be
// merged with a base query by id, not used standalone. Used alone (as
// this route previously did), every product came back with no `name` and
// no `image` at all — the literal cause of the blank photo and the
// vendor-only " — {storeName}" caption (product.name was always
// undefined).
export async function GET() {
  try {
    const data = await getProductsWithFallback(
      GET_PRODUCTS,
      GET_PRODUCTS_UNORDERED,
      { first: 8 },
      { revalidate: 300 }
    );
    const nodes: any[] = data?.products?.nodes || [];
    if (nodes.length === 0) return NextResponse.json({ product: null });

    const pick = nodes[Math.floor(Math.random() * nodes.length)];
    const product = {
      name: pick.name,
      slug: pick.slug,
      price: pick.price || pick.regularPrice || "",
      image: pick.image?.sourceUrl || null,
    };
    return NextResponse.json({ product });
  } catch {
    return NextResponse.json({ product: null });
  }
}
