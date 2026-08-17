import React from "react";
import {
  getWPData,
  getProductsWithFallback,
  GET_PRODUCTS,
  GET_PRODUCTS_UNORDERED,
  GET_PRODUCTS_BY_VENDOR,
  GET_PRODUCTS_BY_VENDOR_UNORDERED,
  GET_PRODUCT_CATEGORIES,
  GET_PRODUCTS_EXTRA,
  GET_PRODUCTS_EXTRA_UNORDERED,
  GET_PRODUCTS_BY_VENDOR_EXTRA,
  GET_PRODUCTS_BY_VENDOR_EXTRA_UNORDERED,
  GET_SHOP_PRO_DISCOUNT_PERCENT,
} from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import { ShopFilterProvider } from "./components/ShopFilterContext";
import { getShopCountryParam } from "./components/shopCountry";
import ShopFilterBar from "./components/ShopFilterBar";
import ShopProductGrid from "./components/ShopProductGrid";
import "./shop.css";

const DEFAULT_PRO_DISCOUNT_PERCENT = 10;

interface ShopArchiveProps {
  category?: string;
  tag?: string;
  brand?: string;
}

function vendorName(p: any): string {
  return p.vendorProfile?.storeName || "";
}

interface VendorCard {
  slug: string;
  name: string;
  location: string;
  desc: string;
  count: number;
  image: string | null;
}

function extractVendors(products: any[]): VendorCard[] {
  const map = new Map<string, VendorCard>();
  for (const p of products) {
    const name = vendorName(p);
    if (!name) continue;
    if (map.has(name)) {
      map.get(name)!.count += 1;
    } else {
      map.set(name, {
        slug:     p.vendorProfile?.slug    || "",
        name,
        location: p.vendorProfile?.city   || "",
        desc:     p.vendorProfile?.bio    || "",
        count: 1,
        image: p.vendorProfile?.avatarUrl || p.image?.sourceUrl || null,
      });
    }
  }
  return [...map.values()].slice(0, 4);
}

function isNew(p: any): boolean {
  return p.productTags?.nodes?.some((t: any) => t.slug === "new") ?? false;
}

const FALLBACK_CATEGORIES = [
  { name: "Ceramics",   slug: "ceramics",   count: 0, image: null },
  { name: "Textiles",   slug: "textiles",   count: 0, image: null },
  { name: "Leather",    slug: "leather",    count: 0, image: null },
  { name: "Jewellery",  slug: "jewellery",  count: 0, image: null },
  { name: "Objects",    slug: "objects",    count: 0, image: null },
  { name: "Paper",      slug: "paper",      count: 0, image: null },
];

export default async function ShopArchiveWrapper({
  category,
  tag,
  brand,
}: ShopArchiveProps) {
  let products: any[] = [];
  let categories: any[] = [];

  // "nigeria" (or null for everyone else) — see shopCountry.ts for why this
  // exact string, not an ISO code. Threaded into the extra-data fetch below
  // so displayPrice comes back already converted to the shopper's currency.
  const shopCountry = await getShopCountryParam();

  const [prodResult, catResult, extraResult, percentResult] = await Promise.allSettled([
    brand
      ? getProductsWithFallback(GET_PRODUCTS_BY_VENDOR, GET_PRODUCTS_BY_VENDOR_UNORDERED, { first: 24, vendor: brand })
      : getProductsWithFallback(GET_PRODUCTS, GET_PRODUCTS_UNORDERED, { first: 24, category: category || null, tag: tag || null }),
    getWPData(GET_PRODUCT_CATEGORIES, {}),
    // Separate, isolated fetch for moveee-graphql-bridge-dependent fields
    // (vendor location, ratings, materials, currency-converted displayPrice
    // incl. the computed Pro price) — see GET_PRODUCTS_EXTRA's own comment
    // for why this must never be merged into the main products query.
    brand
      ? getProductsWithFallback(GET_PRODUCTS_BY_VENDOR_EXTRA, GET_PRODUCTS_BY_VENDOR_EXTRA_UNORDERED, { first: 24, vendor: brand, country: shopCountry })
      : getProductsWithFallback(GET_PRODUCTS_EXTRA, GET_PRODUCTS_EXTRA_UNORDERED, { first: 24, category: category || null, tag: tag || null, country: shopCountry }),
    // Sitewide default, for page-level "Moveee Pro saves X%" copy that isn't
    // about one specific product.
    getWPData(GET_SHOP_PRO_DISCOUNT_PERCENT, {}),
  ]);

  if (prodResult.status === "fulfilled") products = prodResult.value?.products?.nodes ?? [];
  if (catResult.status === "fulfilled")  categories = catResult.value?.productCategories?.nodes ?? [];
  if (extraResult.status === "fulfilled" && products.length) {
    const extraNodes = extraResult.value?.products?.nodes ?? [];
    const extraById = new Map<number, any>(extraNodes.map((n: any) => [n.databaseId, n]));
    products = products.map((p: any) => {
      const extra = extraById.get(p.databaseId);
      if (!extra) return p;
      // displayPrice is only present when the bridge plugin resolved it —
      // fall back to the raw (GBP) price/regularPrice/salePrice otherwise,
      // same degrade-gracefully pattern as every other extra field here.
      // proPrice is precomputed server-side (base price × the effective
      // Pro discount %) — never derived client-side anymore.
      const dp = extra.displayPrice;
      return {
        ...p,
        vendorProfile: extra.vendorProfile,
        averageRating: extra.averageRating,
        reviewCount: extra.reviewCount,
        productMaterials: extra.productMaterials,
        featured: extra.featured,
        price: dp?.price ?? p.price,
        regularPrice: dp?.regularPrice ?? p.regularPrice,
        salePrice: dp?.salePrice ?? p.salePrice,
        proPrice: dp?.proPrice ?? null,
        proDiscountPercent: dp?.proDiscountPercent ?? null,
      };
    });
  }

  const proDiscountPercent =
    percentResult.status === "fulfilled" && typeof percentResult.value?.moveeeShopProDiscountPercent === "number"
      ? percentResult.value.moveeeShopProDiscountPercent
      : DEFAULT_PRO_DISCOUNT_PERCENT;

  if (!categories.length) categories = FALLBACK_CATEGORIES;

  const isFiltered = !!(category || tag || brand);
  const activeLabel = category || tag || brand || "Lifestyle";

  // Editor's Pick = 1 hero + 2 companions in "Featured Products". Prefers
  // WooCommerce-Featured products (Products → Catalog visibility → Featured);
  // falls back to the first 3 in default catalog order when nothing is
  // marked Featured, so the section never goes empty just because no one
  // has curated it yet.
  const featuredProducts = products.filter((p: any) => p.featured);
  const editorialPicks = (featuredProducts.length > 0 ? featuredProducts : products).slice(0, 3);
  const heroPick = editorialPicks[0];
  const companionPicks = editorialPicks.slice(1);
  const heroLede = heroPick?.shortDescription
    ? heroPick.shortDescription.replace(/<[^>]*>/g, "").trim()
    : "";
  const heroProPrice: string = heroPick?.proPrice ?? "";

  return (
    <>
      {/* ── 1. COMPACT SHOP HEAD (replaces the old centered masthead) ── */}
      <section className="sl-head">
        <div className="sl-head-inner">
          <div>
            <h1>
              {isFiltered ? (
                <em>{activeLabel}</em>
              ) : (
                <><em>Lifestyle</em> Shop</>
              )}
            </h1>
          </div>
          <p className="sl-head-desc">
            {isFiltered
              ? `A curated collection of ${activeLabel} goods from vetted makers.`
              : "Every piece chosen for craft, longevity, and the story behind it — from makers personally vetted for craft integrity and fair production."}
          </p>
        </div>
      </section>

      {/* ── 2. EDITOR'S PICK — single split strip, hairline rules ── */}
      {heroPick && (
        <section className="sl-pick">
          <div className="sl-pick-inner">
            <div className="sl-pick-body">
              <span className="sl-pick-eyebrow">Editor&rsquo;s Pick</span>
              <Link href={`/shop/${heroPick.slug}`}>
                <h2 className="sl-pick-title">{heroPick.name}</h2>
              </Link>
              {heroLede && <p className="sl-pick-desc">{heroLede}</p>}
              {heroPick.price && (
                <div className="sl-pick-price-row">
                  <span className="sl-pick-price">{heroPick.price}</span>
                  {heroProPrice && <span className="sl-pick-pro-price">{heroProPrice} with Pro</span>}
                </div>
              )}
              <Link href={`/shop/${heroPick.slug}`} className="sl-pick-cta">
                Shop this piece →
              </Link>
            </div>
            <Link href={`/shop/${heroPick.slug}`} className="sl-pick-media-link">
              <div className="sl-pick-media">
                {heroPick.image?.sourceUrl ? (
                  <Image
                    src={heroPick.image.sourceUrl}
                    alt={heroPick.image.altText || heroPick.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "var(--paper-deep)" }} />
                )}
                {vendorName(heroPick) && (
                  <span className="sl-pick-media-tag">{vendorName(heroPick)}</span>
                )}
                {isNew(heroPick) && <span className="sl-pick-media-new">New</span>}
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── 3. FEATURED PRODUCTS — flush 2-up grid, no card chrome ── */}
      {companionPicks.length > 0 && (
        <section className="sl-featured">
          <div className="sl-featured-inner">
            <div className="sl-sec-head">
              <p className="sl-sec-title">Featured Products</p>
              <span className="sl-sec-count">{companionPicks.length} pieces</span>
            </div>
            <div className="sl-featured-grid">
              {companionPicks.map((p) => {
                const proPrice: string = p.proPrice ?? "";
                return (
                  <Link key={p.id} href={`/shop/${p.slug}`} className="sl-featured-card">
                    <div className="sl-featured-img">
                      {p.image?.sourceUrl ? (
                        <Image
                          src={p.image.sourceUrl}
                          alt={p.image.altText || p.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--paper-deep)" }} />
                      )}
                      {isNew(p) && <span className="sl-featured-new">New</span>}
                    </div>
                    {vendorName(p) && <p className="sl-featured-kicker">{vendorName(p)}</p>}
                    <p className="sl-featured-name">{p.name}</p>
                    {p.price && (
                      <p className="sl-featured-price">
                        {p.price}
                        {proPrice && <span className="sl-featured-pro"> · {proPrice} Pro</span>}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. TRUST LINE — single slim mono line ── */}
      <section className="sl-trust">
        <p className="sl-trust-line">
          <strong>Vetted Makers</strong> · <strong>4.8 average rating</strong> · <strong>Free Returns</strong> in 30 days · <strong>Moveee Pro</strong> saves {proDiscountPercent}%
        </p>
      </section>

      <ShopFilterProvider products={products}>
        {/* ── 5. FILTER BAR ── */}
        <ShopFilterBar categories={categories.slice(0, 8)} activeCategorySlug={category} />

        {/* ── 6. SLIM MAGAZINE BRIDGE — merges the old Magazine + Origins bridges ── */}
        <div className="sl-bridge">
          <div className="sl-bridge-inner">
            <div className="sl-bridge-left">
              <span className="sl-bridge-label">From The Magazine</span>
              <span className="sl-bridge-title">Issue 014 · Craft &amp; Makers</span>
            </div>
            <div className="sl-bridge-links">
              <Link href="/magazine" className="sl-bridge-cta">
                Read The Edit →
              </Link>
              <Link href="/journeys" className="sl-bridge-cta">
                Explore Origins Journal →
              </Link>
            </div>
          </div>
        </div>

        {/* ── 7. MAIN PRODUCT GRID ── */}
        <ShopProductGrid isFiltered={isFiltered} activeLabel={activeLabel} />
      </ShopFilterProvider>

      {/* ── 8. MOVEEE PRO MEMBER BAND — rounded dark card, not a flush full-bleed strip ── */}
      <div className="sl-member-wrap">
        <section className="sl-member">
          <div className="sl-member-left">
            <div className="sl-member-eyebrow">Moveee Pro</div>
            <h3>Shop smarter, <em>save more</em></h3>
            <p>
              Upgrade to Moveee Pro for early access to new makers, exclusive
              editions, and {proDiscountPercent}% off every purchase in the shop.
            </p>
            <div className="sl-member-perks">
              {[
                { icon: "◈", title: "Early Access",    desc: "First look at new makers and limited drops." },
                { icon: "◇", title: `${proDiscountPercent}% Off`, desc: "Applied automatically to every shop order." },
                { icon: "○", title: "Patron Stories",  desc: "Exclusive maker interviews and behind-the-scenes." },
                { icon: "△", title: "Maker Events",    desc: "Invitations to studio visits and openings." },
              ].map((perk) => (
                <div key={perk.title} className="sl-mperk">
                  <div className="sl-mperk-icon">{perk.icon}</div>
                  <div className="sl-mperk-title">{perk.title}</div>
                  <p className="sl-mperk-desc">{perk.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/register?tier=patron" className="sl-member-cta">
              Join Moveee Pro →
            </Link>
          </div>
          <div className="sl-member-right">
            <div className="sl-member-stat">
              <div className="sl-member-stat-num">2,400</div>
              <div className="sl-member-stat-label">Members &amp; growing</div>
            </div>
          </div>
          <span className="sl-member-photo-credit">Photo: Gannu03 / Wikimedia Commons, CC BY-SA 4.0</span>
        </section>
      </div>

      {/* ── 9. LIFESTYLE EDIT CLOSING BRIDGE ── */}
      <section className="sl-origins">
        <div className="sl-origins-inner">
          {/* Photo: "Woodworking workshop" by wengenroad on Unsplash, CC0, via Wikimedia Commons — no attribution required under CC0. */}
          <div className="sl-origins-img" />
          <div className="sl-origins-content">
            <div className="sl-origins-label">The Lifestyle Edit</div>
            <h3>The stories <em>behind</em> the objects</h3>
            <p>
              Every maker in the shop has a story. We travel to document them —
              from mountain workshops to coastal studios.
            </p>
            <Link href="/shop/edit" className="sl-origins-cta">
              Read The Edit →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
