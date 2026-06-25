import React from "react";
import {
  getWPData,
  GET_PRODUCTS,
  GET_PRODUCTS_BY_VENDOR,
  GET_PRODUCT_CATEGORIES,
  GET_ALL_MAKERS,
  GET_PRODUCTS_EXTRA,
  GET_PRODUCTS_BY_VENDOR_EXTRA,
} from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import { ShopFilterProvider } from "./components/ShopFilterContext";
import ShopFilterBar from "./components/ShopFilterBar";
import ShopProductGrid from "./components/ShopProductGrid";
import "./shop.css";

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

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

const FALLBACK_VENDORS: VendorCard[] = [
  { slug: "", name: "Studio Fern",   location: "Oaxaca, Mexico",     desc: "Ceramic vessels shaped by hand from local terracotta clay.",          count: 14, image: null },
  { slug: "", name: "Atelier Moor",  location: "Marrakech, Morocco",  desc: "Brass and copper objects forged using centuries-old techniques.",     count: 9,  image: null },
  { slug: "", name: "Rye Workshop",  location: "Rye, East Sussex",    desc: "Handwoven baskets and textiles from natural British materials.",      count: 11, image: null },
  { slug: "", name: "Kiso Forestry", location: "Nagano, Japan",       desc: "Joinery and woodwork from sustainably managed Kiso hinoki cypress.", count: 7,  image: null },
];

function isNew(p: any): boolean {
  return p.productTags?.nodes?.some((t: any) => t.slug === "new") ?? false;
}

const TICKER_ITEMS = [
  "Vetted Makers", "★", "Ethical Production", "★",
  "Free Returns", "★", "Moveee Pro Members Save 10%", "★",
  "Vetted Makers", "★", "Ethical Production", "★",
  "Free Returns", "★", "Moveee Pro Members Save 10%", "★",
];

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
  let makers: any[] = [];

  const [prodResult, catResult, makersResult, extraResult] = await Promise.allSettled([
    brand
      ? getWPData(GET_PRODUCTS_BY_VENDOR, { first: 24, vendor: brand })
      : getWPData(GET_PRODUCTS, { first: 24, category: category || null, tag: tag || null }),
    getWPData(GET_PRODUCT_CATEGORIES, {}),
    getWPData(GET_ALL_MAKERS, { first: 4 }),
    // Separate, isolated fetch for moveee-graphql-bridge-dependent fields
    // (vendor location, ratings, materials) — see GET_PRODUCTS_EXTRA's own
    // comment for why this must never be merged into the main products query.
    brand
      ? getWPData(GET_PRODUCTS_BY_VENDOR_EXTRA, { first: 24, vendor: brand })
      : getWPData(GET_PRODUCTS_EXTRA, { first: 24, category: category || null, tag: tag || null }),
  ]);

  if (prodResult.status === "fulfilled") products = prodResult.value?.products?.nodes ?? [];
  if (catResult.status === "fulfilled")  categories = catResult.value?.productCategories?.nodes ?? [];
  if (makersResult.status === "fulfilled") {
    makers = (makersResult.value?.moveeeVendors ?? []).filter((m: any) => m.storeName).slice(0, 4);
  }
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
          }
        : p;
    });
  }

  // REST fallback for vendor strip when GraphQL returns nothing.
  if (makers.length === 0) {
    try {
      const res = await fetch(`${CMS}/wp-json/moveee/v1/vendors?first=4`, {
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json)) {
          makers = json.filter((m: any) => m.storeName).slice(0, 4);
        }
      }
    } catch { /* fall through to FALLBACK_VENDORS */ }
  }

  if (!categories.length) categories = FALLBACK_CATEGORIES;

  const isFiltered = !!(category || tag || brand);
  const activeLabel = category || tag || brand || "Lifestyle";

  // Featured = first 5 (1 large + 2×2 grid)
  const featured = products.slice(0, 5);

  const display = makers.length >= 1 ? makers : FALLBACK_VENDORS;
  const isFallback = display === FALLBACK_VENDORS;

  return (
    <>
      {/* ── 1. MASTHEAD ── */}
      <section className="sl-masthead">
        <div className="sl-masthead-inner">
          <h1>
            {isFiltered ? (
              <em>{activeLabel}</em>
            ) : (
              <>Moveee <em>Lifestyle</em></>
            )}
          </h1>
          <div className="sl-masthead-rule" aria-hidden />
          <p className="sl-masthead-desc">
            {isFiltered
              ? `A curated collection of ${activeLabel} goods from vetted makers.`
              : "Every piece chosen for craft, longevity, and the story behind it. Every maker on Moveee is personally vetted for craft integrity, fair production, and lasting quality."}
          </p>
        </div>
      </section>

      {/* ── 2. TRUST STRIP ── */}
      <section className="sl-trust">
        <div className="sl-trust-inner">
          <div className="sl-trust-item">
            <span className="sl-trust-icon">✓</span>
            <div>
              <div className="sl-trust-title">Vetted Makers</div>
              <div className="sl-trust-desc">Every maker personally reviewed before listing.</div>
            </div>
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">★</span>
            <div>
              <div className="sl-trust-title">4.8 average rating</div>
              <div className="sl-trust-desc">Across 1,200+ verified buyer reviews.</div>
            </div>
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">↺</span>
            <div>
              <div className="sl-trust-title">Free Returns</div>
              <div className="sl-trust-desc">30 days, no questions asked.</div>
            </div>
          </div>
          <div className="sl-trust-item">
            <span className="sl-trust-icon">◇</span>
            <div>
              <div className="sl-trust-title">Moveee Pro saves 10%</div>
              <div className="sl-trust-desc">Automatically applied at checkout for members.</div>
            </div>
          </div>
        </div>
      </section>

      <ShopFilterProvider products={products}>
        {/* ── 3. FILTER BAR ── */}
        <ShopFilterBar categories={categories.slice(0, 8)} activeCategorySlug={category} />

        {/* ── 3b. TICKER ── */}
        <div className="ticker-wrap">
          <div className="ticker-track" aria-hidden>
            {TICKER_ITEMS.map((item, i) => (
              <span key={i} className={item === "★" ? "a" : undefined}>
                {item}
              </span>
            ))}
            {TICKER_ITEMS.map((item, i) => (
              <span key={`b${i}`} className={item === "★" ? "a" : undefined}>
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* ── 4. FEATURED EDITORIAL PICKS ── */}
        {featured.length > 0 && (
          <section className="sl-picks">
            <div className="sl-picks-inner">
              <div className="sl-picks-header">
                <h2>Editorial <em>Picks</em></h2>
                <Link href="/shop/edit" className="sl-picks-all">
                  The Moveee Edit →
                </Link>
              </div>
              <div className="sl-picks-grid">
                {/* Large hero card */}
                {featured[0] && (
                  <Link href={`/shop/${featured[0].slug}`} className="sl-pick-card">
                    <div className="sl-pick-large-img">
                      {featured[0].image?.sourceUrl ? (
                        <Image
                          src={featured[0].image.sourceUrl}
                          alt={featured[0].image.altText || featured[0].name}
                          fill
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                      )}
                      <div className="sl-pip">
                        <span className="sl-pip-star">★</span> Vetted
                      </div>
                      {isNew(featured[0]) && <div className="sl-pip-new">New</div>}
                    </div>
                    <div className="sl-pick-info">
                      {vendorName(featured[0]) && (
                        <span className="sl-pick-vendor">{vendorName(featured[0])}</span>
                      )}
                      <div className="sl-pick-name-price">
                        <span className="sl-pick-name">{featured[0].name}</span>
                        {featured[0].price && (
                          <span className="sl-pick-price">{featured[0].price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )}

                {/* 2×2 sub-grid */}
                <div className="sl-pick-sub-grid">
                  {featured.slice(1, 5).map((p) => (
                    <Link key={p.id} href={`/shop/${p.slug}`} className="sl-pick-card">
                      <div className="sl-pick-small-img">
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
                        {isNew(p) && <div className="sl-pip-new">New</div>}
                      </div>
                      <div className="sl-pick-info">
                        {vendorName(p) && (
                          <span className="sl-pick-vendor">{vendorName(p)}</span>
                        )}
                        <div className="sl-pick-name-price">
                          <span className="sl-pick-name">{p.name}</span>
                          {p.price && <span className="sl-pick-price">{p.price}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── 5. EDITORIAL BRIDGE — Magazine ── */}
        <div className="sl-bridge">
          <div className="sl-bridge-inner">
            <div className="sl-bridge-label">As Seen In</div>
            <div className="sl-bridge-sep" aria-hidden />
            <div className="sl-bridge-title">
              <em>The Moveee Edit</em>
              <span className="sl-bridge-meta">Issue 014 · Craft &amp; Makers</span>
            </div>
            <Link href="/magazine" className="sl-bridge-cta">
              Read the Issue →
            </Link>
          </div>
        </div>

        {/* ── 6. MAIN PRODUCT GRID ── */}
        <ShopProductGrid isFiltered={isFiltered} activeLabel={activeLabel} />

        {/* ── 7. EDITORIAL BRIDGE — Origins ── */}
        <div className="sl-bridge">
          <div className="sl-bridge-inner">
            <div className="sl-bridge-label">Origins Journal</div>
            <div className="sl-bridge-sep" aria-hidden />
            <div className="sl-bridge-title">
              Where things <em>come from</em>
              <span className="sl-bridge-meta">Stories from the makers behind the objects</span>
            </div>
            <Link href="/journeys" className="sl-bridge-cta">
              Explore Origins →
            </Link>
          </div>
        </div>
      </ShopFilterProvider>

      {/* ── 8. CATEGORY GRID ── */}
      <section className="sl-cat">
        <div className="sl-cat-inner">
          <h3 className="sl-cat-title">Shop by <em>Category</em></h3>
          <div className="sl-cat-grid">
            {categories.slice(0, 6).map((cat: any) => (
              <Link key={cat.slug} href={`/shop/category/${cat.slug}`} className="sl-cat-item">
                <div className="sl-cat-bg">
                  {cat.image?.sourceUrl ? (
                    <Image
                      src={cat.image.sourceUrl}
                      alt={cat.image.altText || cat.name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                  )}
                </div>
                <div className="sl-cat-overlay">
                  <div className="sl-cat-name">{cat.name}</div>
                  {cat.count != null && (
                    <div className="sl-cat-count">{cat.count} pieces</div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. MAKERS STRIP ── */}
      <section className="sl-makers">
        <div className="sl-makers-inner">
          <div className="sl-makers-head">
            <h3 className="sl-makers-label">Meet the <em>Makers</em></h3>
            <Link href="/makers" className="sl-makers-all">All makers →</Link>
          </div>
          <div className="sl-makers-grid">
            {display.map((v: any) => {
              const name  = isFallback ? v.name      : v.storeName;
              const loc   = isFallback ? v.location  : [v.city, v.country].filter(Boolean).join(", ");
              const desc  = isFallback ? v.desc      : v.bio;
              const count = isFallback ? v.count     : (v.productCount ?? 0);
              const img   = isFallback ? v.image     : v.avatarUrl;
              const href  = isFallback ? "/makers"   : `/makers/${v.slug}`;
              return (
                <Link key={name} href={href} className="sl-mcard">
                  <div className="sl-mcard-img">
                    {img && (
                      <Image src={img} alt={name} fill style={{ objectFit: "cover" }} />
                    )}
                  </div>
                  <div className="sl-mcard-vetted">
                    <span className="sl-mcard-vetted-star">★</span> Vetted Maker
                  </div>
                  <div className="sl-mcard-body">
                    <div className="sl-mcard-name">{name}</div>
                    {loc && <div className="sl-mcard-loc">{loc}</div>}
                    {desc && <p className="sl-mcard-desc">{desc}</p>}
                  </div>
                  <div className="sl-mcard-footer">
                    <span className="sl-mcard-count">
                      {count} {count === 1 ? "product" : "products"}
                    </span>
                    <span className="sl-mcard-view">View shop →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 10. MOVEEE PRO MEMBER BAND ── */}
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

      {/* ── 11. ORIGINS CLOSING BRIDGE ── */}
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
