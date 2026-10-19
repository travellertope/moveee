import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

/** GET /api/vendor/categories — returns WooCommerce product categories */
export async function GET() {
  const session = await getServerSession(authOptions);
  const user    = session?.user as any;
  if (!user?.isVendor) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const res = await fetch(
      `${CMS}/wp-json/wc/v3/products/categories?per_page=50&hide_empty=false` +
      `&consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return NextResponse.json([], { status: 200 });
    const cats = await res.json();
    return NextResponse.json(
      cats.map((c: any) => ({ id: c.id, name: c.name, parent: c.parent }))
    );
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
