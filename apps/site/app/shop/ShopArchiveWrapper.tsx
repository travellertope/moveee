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
import ShopProductGrid from "./components/ShopProductGrid";
import SubscribeForm from "@/components/SubscribeForm";
import { sanitizeHtml } from "@/lib/sanitize";
import "./shop.css";
import "./shop-lifestyle.css";

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
        moveeeMeta: extra.moveeeMeta,
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

  // Hero pick = the current Editor's Pick. Prefers WooCommerce-Featured
  // products (Products → Catalog visibility → Featured); falls back to the
  // first product in default catalog order when nothing is marked Featured,
  // so the hero never goes empty just because no one has curated it yet.
  const featuredProducts = products.filter((p: any) => p.featured);
  const heroPick = (featuredProducts.length > 0 ? featuredProducts : products)[0];

  const makerStoryHtml: string = heroPick?.moveeeMeta?.makerStory
    ? sanitizeHtml(heroPick.moveeeMeta.makerStory)
    : "";
  const makerBio: string = heroPick?.vendorProfile?.bio || "";
  const makerName: string = vendorName(heroPick || {});
  const makerLocation = [heroPick?.vendorProfile?.city, heroPick?.vendorProfile?.country]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      {/* No header-clearance spacer and no inline ticker here anymore — the
          Moveee Lifestyle's own standalone ShopHeader (app/shop/layout.tsx)
          renders the ticker once for the whole /shop route tree, and it
          sits in normal document flow (not fixed/floating), so there's no
          gap left to fill. */}

      {/* ── CATEGORY NAV — a dropdown beside the grid label instead of a
          horizontal strip, per the approved identity mockup. Desktop opens
          on hover/focus (pure CSS, no client component needed); mobile gets
          a <details> disclosure with the same links, since :hover doesn't
          fire on touch. ── */}
      <div className="lfs-nav-wrap">
        <div className="lfs-nav">
          <nav className="lfs-cat">
            <button type="button" className="lfs-cat-btn" aria-haspopup="true">
              Browse
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
            </button>
            <div className="lfs-cat-panel">
              {categories.map((c: any) => (
                <Link key={c.slug} href={`/shop/category/${c.slug}`} className="lfs-cat-item">
                  <span>{c.name}</span>
                  {typeof c.count === "number" && c.count > 0 && (
                    <span className="lfs-cat-count">{c.count}</span>
                  )}
                </Link>
              ))}
              <Link href="/shop" className="lfs-cat-all">All Products →</Link>
            </div>
          </nav>
          <details className="lfs-cat-mobile">
            <summary className="lfs-cat-btn" aria-label="Browse categories">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="7" x2="20" y2="7" /><circle cx="9" cy="7" r="2" fill="var(--paper)" /><line x1="4" y1="17" x2="20" y2="17" /><circle cx="16" cy="17" r="2" fill="var(--paper)" /></svg>
            </summary>
            <div className="lfs-cat-panel">
              {categories.map((c: any) => (
                <Link key={c.slug} href={`/shop/category/${c.slug}`} className="lfs-cat-item">
                  <span>{c.name}</span>
                  {typeof c.count === "number" && c.count > 0 && (
                    <span className="lfs-cat-count">{c.count}</span>
                  )}
                </Link>
              ))}
              <Link href="/shop" className="lfs-cat-all">All Products →</Link>
            </div>
          </details>
          <span className="lfs-nav-label">{isFiltered ? activeLabel : "The full Index"}</span>
        </div>
      </div>

      {/* ── HERO — centered, oxblood scrim over a fixed brand photo (never
          a product photo — the hero must read as the shop's own identity,
          not an ad for whichever item happens to be featured) ── */}
      {heroPick && (
        <section className="lfs-hero">
          <Image
            src="/shop-hero.jpg"
            alt="Inside a Moveee maker's studio"
            fill
            className="lfs-hero-bg"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="lfs-hero-scrim" />
          <div className="lfs-hero-copy">
            <h1 className="lfs-hero-title">
              The Index of things<br />worth <em>owning.</em>
            </h1>
            <p className="lfs-hero-dek">
              Curated lifestyle goods from vetted makers — objects and
              editions reviewed for craft, integrity, and lasting quality.
            </p>
            <div className="lfs-hero-ctas">
              <Link href="#lfs-grid" className="lfs-btn-primary">Shop the Index →</Link>
              <Link href="/register?tier=patron" className="lfs-btn-secondary">Moveee Pro Perks →</Link>
            </div>
            <p className="lfs-hero-trust">
              Secure Checkout by Stripe and Paystack. Moveee Pro members save {proDiscountPercent}% storewide.
            </p>
          </div>
        </section>
      )}

      <ShopFilterProvider products={products} categories={categories.slice(0, 8)} activeCategorySlug={category}>
        {/* ── 4. SLIM MAGAZINE BRIDGE — merges the old Magazine + Origins bridges ── */}
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

        {/* ── 5. MAIN PRODUCT GRID ── */}
        <ShopProductGrid isFiltered={isFiltered} activeLabel={activeLabel} />
      </ShopFilterProvider>

      {/* ── EMAIL CAPTURE — real Culture Drop subscribe form ── */}
      <section className="lfs-email">
        <div className="lfs-email-inner">
          <div className="lfs-email-copy">
            <h3>Be first to shop new drops.</h3>
            <p>
              New makers, limited runs, and Moveee Pro early access — through
              Culture Drop, Moveee&rsquo;s weekly newsletter.
            </p>
          </div>
          <div className="lfs-email-form">
            <SubscribeForm
              list="culture-drop"
              placeholder="you@email.com"
              buttonLabel="Subscribe →"
              inputClassName="lfs-email-input"
              buttonClassName="lfs-email-btn"
            />
          </div>
        </div>
      </section>

      {/* ── MAKER STORY — spotlights the current hero pick's own maker;
          deliberately not a bulk grid, see CLAUDE.md's "Shop by Category +
          Meet the Makers sections removed" for why that was retired. ── */}
      {heroPick && makerName && (
        <section className="lfs-maker">
          <div className="lfs-maker-inner">
            <div className="lfs-maker-media">
              {heroPick.vendorProfile?.avatarUrl ? (
                <Image
                  src={heroPick.vendorProfile.avatarUrl}
                  alt={makerName}
                  fill
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="lfs-maker-media-fallback">{makerName.charAt(0)}</div>
              )}
            </div>
            <div className="lfs-maker-body">
              <span className="lfs-maker-eyebrow">Meet the Maker</span>
              <h3>{makerName}</h3>
              {makerLocation && <p className="lfs-maker-loc">{makerLocation}</p>}
              {makerStoryHtml ? (
                <div className="lfs-maker-story" dangerouslySetInnerHTML={{ __html: makerStoryHtml }} />
              ) : makerBio ? (
                <p className="lfs-maker-story">{makerBio}</p>
              ) : null}
              {heroPick.vendorProfile?.slug && (
                <Link href={`/shop/brand/${heroPick.vendorProfile.slug}`} className="lfs-maker-link">
                  Shop {makerName} →
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── 6. MOVEEE PRO MEMBER BAND — rounded dark card, not a flush full-bleed strip ── */}
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

      {/* ── 7. LIFESTYLE EDIT CLOSING BRIDGE ── */}
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
