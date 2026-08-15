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
} from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import { ShopFilterProvider, formatGBP, parsePrice } from "./components/ShopFilterContext";
import ShopFilterBar from "./components/ShopFilterBar";
import ShopProductGrid from "./components/ShopProductGrid";
import "./shop.css";

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

  const [prodResult, catResult, extraResult] = await Promise.allSettled([
    brand
      ? getProductsWithFallback(GET_PRODUCTS_BY_VENDOR, GET_PRODUCTS_BY_VENDOR_UNORDERED, { first: 24, vendor: brand })
      : getProductsWithFallback(GET_PRODUCTS, GET_PRODUCTS_UNORDERED, { first: 24, category: category || null, tag: tag || null }),
    getWPData(GET_PRODUCT_CATEGORIES, {}),
    // Separate, isolated fetch for moveee-graphql-bridge-dependent fields
    // (vendor location, ratings, materials) — see GET_PRODUCTS_EXTRA's own
    // comment for why this must never be merged into the main products query.
    brand
      ? getProductsWithFallback(GET_PRODUCTS_BY_VENDOR_EXTRA, GET_PRODUCTS_BY_VENDOR_EXTRA_UNORDERED, { first: 24, vendor: brand })
      : getProductsWithFallback(GET_PRODUCTS_EXTRA, GET_PRODUCTS_EXTRA_UNORDERED, { first: 24, category: category || null, tag: tag || null }),
  ]);

  if (prodResult.status === "fulfilled") products = prodResult.value?.products?.nodes ?? [];
  if (catResult.status === "fulfilled")  categories = catResult.value?.productCategories?.nodes ?? [];
  if (extraResult.status === "fulfilled" && products.length) {
    const extraNodes = extraResult.value?.products?.nodes ?? [];
    const extraById = new Map<number, any>(extraNodes.map((n: any) => [n.databaseId, n]));
    products = products.map((p: any) => {
      const extra = extraById.get(p.databaseId);
      return extra
        ? {
            ...p,
            vendorProfile: extra.vendorProfile,
            averageRating: extra.averageRating,
            reviewCount: extra.reviewCount,
            productMaterials: extra.productMaterials,
            featured: extra.featured,
          }
        : p;
    });
  }

  if (!categories.length) categories = FALLBACK_CATEGORIES;

  const isFiltered = !!(category || tag || brand);
  const activeLabel = category || tag || brand || "Lifestyle";

  // Editorial Picks = 1 hero + 3 companions in "More From The Edit". Prefers
  // WooCommerce-Featured products (Products → Catalog visibility → Featured);
  // falls back to the first 4 in default catalog order when nothing is
  // marked Featured, so the section never goes empty just because no one
  // has curated it yet.
  const featuredProducts = products.filter((p: any) => p.featured);
  const editorialPicks = (featuredProducts.length > 0 ? featuredProducts : products).slice(0, 4);
  const heroPick = editorialPicks[0];
  const companionPicks = editorialPicks.slice(1);
  const heroLede = heroPick?.shortDescription
    ? heroPick.shortDescription.replace(/<[^>]*>/g, "").trim()
    : "";
  const heroProPrice = heroPick?.price
    ? formatGBP(parsePrice(heroPick.price) * 0.9)
    : "";

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

      {/* ── 2. HERO PICK + "MORE FROM THE EDIT" ── */}
      {heroPick && (
        <section className="sl-picks">
          <div className="sl-picks-inner">
            <div className="sl-picks-header">
              <h2>Editorial <em>Picks</em></h2>
              <Link href="/shop/edit" className="sl-picks-all">
                The Edit →
              </Link>
            </div>

            <div className="sl-hero-grid">
              <Link href={`/shop/${heroPick.slug}`} className="sl-hero-img-link">
                <div className="sl-hero-img">
                  {heroPick.image?.sourceUrl ? (
                    <Image
                      src={heroPick.image.sourceUrl}
                      alt={heroPick.image.altText || heroPick.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                  )}
                  <div className="sl-pip">
                    <span className="sl-pip-star">★</span> Vetted Maker
                  </div>
                  {isNew(heroPick) && <div className="sl-pip-new">New</div>}
                </div>
              </Link>
              <div className="sl-hero-body">
                <span className="sl-hero-kicker">Editor&rsquo;s Pick</span>
                {vendorName(heroPick) && (
                  <span className="sl-hero-vendor">{vendorName(heroPick)}</span>
                )}
                <Link href={`/shop/${heroPick.slug}`}>
                  <h3 className="sl-hero-name">{heroPick.name}</h3>
                </Link>
                {heroLede && <p className="sl-hero-desc">{heroLede}</p>}
                {heroPick.price && (
                  <div className="sl-hero-price-row">
                    <span className="sl-hero-price">{heroPick.price}</span>
                    <span className="sl-hero-pro-price">{heroProPrice} with Pro</span>
                  </div>
                )}
                <Link href={`/shop/${heroPick.slug}`} className="sl-hero-cta">
                  Shop this piece →
                </Link>
              </div>
            </div>

            {companionPicks.length > 0 && (
              <div className="sl-week-row">
                {companionPicks.map((p) => (
                  <Link key={p.id} href={`/shop/${p.slug}`} className="sl-week-card">
                    <div className="sl-week-thumb">
                      {p.image?.sourceUrl ? (
                        <Image
                          src={p.image.sourceUrl}
                          alt={p.image.altText || p.name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                      )}
                      {isNew(p) && <div className="sl-week-new">New</div>}
                    </div>
                    <div className="sl-week-body">
                      {vendorName(p) && <span className="sl-week-vendor">{vendorName(p)}</span>}
                      <span className="sl-week-title">{p.name}</span>
                      {p.price && <span className="sl-week-price">{p.price}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── 3. TRUST BAR — single slim line, replaces trust-strip + scrolling ticker ── */}
      <section className="sl-trust">
        <div className="sl-trust-inner">
          <div className="sl-trust-item">
            <span className="sl-trust-icon">✓</span> <strong>Vetted Makers</strong> — reviewed before listing
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">★</span> <strong>4.8 average rating</strong> — 1,200+ reviews
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">↺</span> <strong>Free Returns</strong> — 30 days
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">◇</span> <strong>Moveee Pro saves 10%</strong> — applied at checkout
          </div>
        </div>
      </section>

      <ShopFilterProvider products={products}>
        {/* ── 4. FILTER BAR ── */}
        <ShopFilterBar categories={categories.slice(0, 8)} activeCategorySlug={category} />

        {/* ── 5. SLIM MAGAZINE BRIDGE — merges the old Magazine + Origins bridges ── */}
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

        {/* ── 6. MAIN PRODUCT GRID ── */}
        <ShopProductGrid isFiltered={isFiltered} activeLabel={activeLabel} />
      </ShopFilterProvider>

      {/* ── 7. MOVEEE PRO MEMBER BAND — rounded dark card, not a flush full-bleed strip ── */}
      <div className="sl-member-wrap">
        <section className="sl-member">
          <div className="sl-member-left">
            <div className="sl-member-eyebrow">Moveee Pro</div>
            <h3>Shop smarter, <em>save more</em></h3>
            <p>
              Upgrade to Moveee Pro for early access to new makers, exclusive
              editions, and 10% off every purchase in the shop.
            </p>
            <div className="sl-member-perks">
              {[
                { icon: "◈", title: "Early Access",    desc: "First look at new makers and limited drops." },
                { icon: "◇", title: "10% Off",         desc: "Applied automatically to every shop order." },
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
        </section>
      </div>

      {/* ── 8. ORIGINS CLOSING BRIDGE ── */}
      <section className="sl-origins">
        <div className="sl-origins-inner">
          <div className="sl-origins-img" />
          <div className="sl-origins-content">
            <div className="sl-origins-label">Origins Journal</div>
            <h3>The stories <em>behind</em> the objects</h3>
            <p>
              Every maker in the shop has a story. We travel to document them —
              from mountain workshops to coastal studios.
            </p>
            <Link href="/journeys" className="sl-origins-cta">
              Read Origins →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
