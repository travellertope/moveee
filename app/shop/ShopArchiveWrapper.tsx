import React from "react";
import { getWPData, GET_PRODUCTS, GET_PRODUCT_CATEGORIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import ShopFilterBar from "./components/ShopFilterBar";
import "./shop.css";

interface ShopArchiveProps {
  category?: string;
  tag?: string;
  brand?: string;
}

const meta = (data: any[], key: string) =>
  data?.find((m: any) => m.key === key)?.value ?? null;

function vendorName(p: any): string {
  return (
    meta(p.metaData, "_vendor_name") ||
    meta(p.metaData, "vendor_store_name") ||
    meta(p.metaData, "_wcfm_vendor") ||
    ""
  );
}

function isNew(p: any): boolean {
  return p.productTags?.nodes?.some((t: any) => t.slug === "new") ?? false;
}

function isOutOfStock(p: any): boolean {
  return p.stockStatus === "OUT_OF_STOCK";
}

const TICKER_ITEMS = [
  "Vetted Makers", "★", "Ethical Production", "★",
  "Free Returns", "★", "Connect Members Save 10%", "★",
  "Vetted Makers", "★", "Ethical Production", "★",
  "Free Returns", "★", "Connect Members Save 10%", "★",
];

const FALLBACK_CATEGORIES = [
  { name: "Ceramics", slug: "ceramics", count: 0, image: null },
  { name: "Textiles", slug: "textiles", count: 0, image: null },
  { name: "Leather", slug: "leather", count: 0, image: null },
  { name: "Jewellery", slug: "jewellery", count: 0, image: null },
  { name: "Objects", slug: "objects", count: 0, image: null },
  { name: "Paper", slug: "paper", count: 0, image: null },
];

export default async function ShopArchiveWrapper({
  category,
  tag,
  brand,
}: ShopArchiveProps) {
  let products: any[] = [];
  let categories: any[] = [];

  try {
    const [prodData, catData] = await Promise.all([
      getWPData(GET_PRODUCTS, {
        first: 24,
        category: category || null,
        tag: tag || null,
        brand: brand || null,
      }),
      getWPData(GET_PRODUCT_CATEGORIES, {}),
    ]);
    products = prodData?.products?.nodes ?? [];
    categories = catData?.productCategories?.nodes ?? [];
  } catch {
    /* CMS unreachable — render with empty data */
  }

  if (!categories.length) categories = FALLBACK_CATEGORIES;

  const isFiltered = !!(category || tag || brand);
  const activeLabel = category || tag || brand || "Lifestyle";

  // Featured = first 4, grid = rest
  const featured = products.slice(0, 4);
  const gridProducts = products.slice(4);

  return (
    <>
      {/* ── 1. SHOP HEAD ── */}
      <section className="shop-head">
        <div className="shop-head-inner">
          <div className="shop-head-left">
            <div className="sh-tag">N°04 · {activeLabel}</div>
            <h1>
              {isFiltered ? (
                <em>{activeLabel}</em>
              ) : (
                <>Things worth <em>living with.</em></>
              )}
            </h1>
            <p className="sh-desc">
              {isFiltered
                ? `A curated collection of ${activeLabel} goods from vetted makers.`
                : "Every piece chosen for craft, longevity, and the story behind it."}
            </p>
          </div>
          <div className="shop-head-right">
            <div className="vetting-pledge">
              <div className="vp-label">★ The Vetting Pledge</div>
              <p className="vp-text">
                Every maker on Moveee is personally vetted for craft integrity,
                fair production, and lasting quality.
              </p>
              <a href="/about#vetting" className="vp-link">
                How we vet →
              </a>
            </div>
          </div>
        </div>
        <div className="issue-ghost">014</div>
      </section>

      {/* ── 2. FILTER BAR ── */}
      <ShopFilterBar
        categories={categories.slice(0, 8)}
        productCount={products.length}
      />

      {/* ── 3. TICKER ── */}
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
        <section className="featured-section">
          <div className="featured-header">
            <h2 className="feat-title">
              Editorial <em>Picks</em>
            </h2>
            <Link href="/shop" className="feat-all">
              View all →
            </Link>
          </div>
          <div className="featured-grid">
            {/* Large card */}
            {featured[0] && (
              <Link href={`/shop/${featured[0].slug}`} className="feat-card feat-large">
                <div className="feat-img-wrap">
                  {featured[0].image?.sourceUrl ? (
                    <Image
                      src={featured[0].image.sourceUrl}
                      alt={featured[0].image.altText || featured[0].name}
                      fill
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "var(--indigo-deep, #0f1826)" }} />
                  )}
                  <div className="feat-pip"><span>★</span> Vetted</div>
                  {isNew(featured[0]) && <div className="feat-new">New</div>}
                </div>
                <div className="feat-info">
                  {vendorName(featured[0]) && (
                    <span className="feat-vendor">{vendorName(featured[0])}</span>
                  )}
                  <span className="feat-name">
                    {featured[0].name}
                  </span>
                  {featured[0].price && (
                    <span className="feat-price">{featured[0].price}</span>
                  )}
                </div>
              </Link>
            )}

            {/* Stacked small cards */}
            <div className="feat-stack">
              {featured.slice(1, 4).map((p) => (
                <Link key={p.id} href={`/shop/${p.slug}`} className="feat-card feat-small">
                  <div className="feat-img-wrap">
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
                    {isNew(p) && <div className="feat-new">New</div>}
                  </div>
                  <div className="feat-info">
                    {vendorName(p) && (
                      <span className="feat-vendor">{vendorName(p)}</span>
                    )}
                    <span className="feat-name">{p.name}</span>
                    {p.price && <span className="feat-price">{p.price}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 5. EDITORIAL BRIDGE ── */}
      <div className="ed-bridge">
        <div className="ed-bridge-inner">
          <div className="eb-label">As Seen In</div>
          <div className="eb-title">
            <em>The Moveee Edit</em>
            <span className="eb-meta">Issue 014 · Craft &amp; Makers</span>
          </div>
          <Link href="/magazine" className="eb-cta">
            Read the Issue →
          </Link>
        </div>
      </div>

      {/* ── 6. MAIN PRODUCT GRID ── */}
      <section className="shop-grid-section">
        <div className="sec-label">
          {isFiltered ? activeLabel : "All Products"} — {products.length} pieces
        </div>
        {products.length === 0 ? (
          <p style={{ color: "var(--mute)", fontFamily: "'Fraunces', serif", fontStyle: "italic" }}>
            No products found.
          </p>
        ) : (
          <div className="product-grid">
            {(isFiltered ? products : gridProducts).map((p: any) => {
              const vname = vendorName(p);
              const outOfStock = isOutOfStock(p);
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="pcard" style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="pimg">
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
                    <div className="vetted-pip"><span className="s">★</span> Vetted</div>
                    {isNew(p) && <div className="new-pip">New</div>}
                    {outOfStock && (
                      <div className="sold-pip"><span>Sold Out</span></div>
                    )}
                  </div>
                  {vname && <div className="pvendor">{vname}</div>}
                  <div className="pname">{p.name}</div>
                  {p.price && (
                    <div className="pprice">
                      <span className="main">{p.price}</span>
                    </div>
                  )}
                  <button className="padd" tabIndex={-1}>Add to Cart →</button>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 7. SECOND EDITORIAL BRIDGE ── */}
      <div className="ed-bridge">
        <div className="ed-bridge-inner">
          <div className="eb-label">Origins Journal</div>
          <div className="eb-title">
            Where things <em>come from</em>
            <span className="eb-meta">Stories from the makers behind the objects</span>
          </div>
          <Link href="/origins" className="eb-cta">
            Explore Origins →
          </Link>
        </div>
      </div>

      {/* ── 8. CATEGORY GRID ── */}
      <section className="shop-cat-grid">
        <div className="sec-hdr">
          <h3>Shop by <em>Category</em></h3>
        </div>
        <div className="cat-grid">
          {categories.slice(0, 6).map((cat: any) => (
            <Link key={cat.slug} href={`/shop/category/${cat.slug}`} className="cat-item">
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
              <div className="cat-overlay">
                <div className="cat-name">{cat.name}</div>
                {cat.count != null && (
                  <div className="cat-count">{cat.count} pieces</div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 9. VENDOR STRIP (static — TODO: wire to multivendor API) ── */}
      <section className="shop-vendor-cards">
        <div className="sec-hdr">
          <h3>Meet the <em>Makers</em></h3>
          <Link href="/origins">All makers →</Link>
        </div>
        <div className="vendor-cards">
          {[
            { name: "Studio Fern", location: "Oaxaca, Mexico", desc: "Ceramic vessels shaped by hand from local terracotta clay.", count: 14 },
            { name: "Atelier Moor", location: "Marrakech, Morocco", desc: "Brass and copper objects forged using centuries-old techniques.", count: 9 },
            { name: "Rye Workshop", location: "Rye, East Sussex", desc: "Handwoven baskets and textiles from natural British materials.", count: 11 },
            { name: "Kiso Forestry", location: "Nagano, Japan", desc: "Joinery and woodwork from sustainably managed Kiso hinoki cypress.", count: 7 },
          ].map((v) => (
            <div key={v.name} className="vc">
              <div className="vc-img" />
              <div className="vc-vetted">★ Vetted Maker</div>
              <h4>{v.name}</h4>
              <div className="vc-loc">{v.location}</div>
              <p className="vc-desc">{v.desc}</p>
              <div className="vc-count">{v.count} products</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 10. CONNECT MEMBER BAND ── */}
      <section className="shop-member-band">
        <div className="member-band-inner">
          <div className="mb-left">
            <h3>Connect <em>Members</em></h3>
            <p>
              Join Moveee Connect for early access to new makers, exclusive
              editions, and 10% off every purchase in the shop.
            </p>
            <div className="mb-perks">
              {[
                { icon: "◈", title: "Early Access", desc: "First look at new makers and limited drops." },
                { icon: "◇", title: "10% Off", desc: "Applied automatically to every shop order." },
                { icon: "○", title: "Free Delivery", desc: "On all UK orders, always." },
                { icon: "△", title: "Maker Events", desc: "Invitations to studio visits and openings." },
              ].map((perk) => (
                <div key={perk.title} className="perk">
                  <div className="pk-icon">{perk.icon}</div>
                  <div className="pk-title">{perk.title}</div>
                  <p className="pk-desc">{perk.desc}</p>
                </div>
              ))}
            </div>
            <Link href="/connect" className="mb-btn">Join Connect →</Link>
          </div>
          <div className="mb-right">
            <div className="mb-img" />
            <div className="mb-float">
              <div className="fl-num">2,400</div>
              <div className="fl-label">Members &amp; growing</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 11. ORIGINS BRIDGE ── */}
      <section className="shop-origins-bridge">
        <div className="ob-inner">
          <div className="ob-img" />
          <div className="ob-content">
            <div className="ob-label">Origins Journal</div>
            <h3>The stories <em>behind</em> the objects</h3>
            <p>
              Every maker in the shop has a story. We travel to document them —
              from mountain workshops to coastal studios.
            </p>
            <Link href="/origins" className="ob-cta">
              Read Origins →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
