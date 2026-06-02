import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../makers.css";

export const revalidate = 3600;

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

async function fetchMaker(slug: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(slug)}`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (json && !json.code) return json;
    }
  } catch { /* fall through */ }
  return null;
}

async function fetchVendorProducts(slug: string): Promise<any[]> {
  try {
    const res = await fetch(
      `${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(slug)}/products?first=24`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) return json;
    }
  } catch { /* fall through */ }
  return [];
}

async function fetchEditorialCoverage(vendorUserId: number): Promise<any[]> {
  // Fetch posts that feature this vendor's products via _culture_featured_products meta
  // Falls back to a name search if no direct links exist
  try {
    const res = await fetch(
      `${CMS}/wp-json/wp/v2/posts?per_page=3&status=publish&meta_key=_culture_featured_products&_embed=1`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts) && posts.length > 0) return posts;
    }
  } catch { /* fall through */ }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const maker = await fetchMaker(slug);
  if (!maker) return { title: { absolute: "Maker Not Found | The Moveee" } };
  const name = maker.storeName || maker.store_name || maker.display_name || "Maker";
  return {
    title: { absolute: `${name} | Makers | The Moveee` },
    description: maker.bio || maker.shop_description || `Discover handcrafted pieces by ${name} on The Moveee.`,
  };
}

export default async function SingleMakerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [maker, products] = await Promise.all([
    fetchMaker(slug),
    fetchVendorProducts(slug),
  ]);

  if (!maker) notFound();

  // Normalise field names — REST endpoint may return snake_case or camelCase
  const storeName    = maker.storeName    || maker.store_name    || maker.display_name || "Unnamed Maker";
  const bio          = maker.bio          || maker.shop_description || "";
  const city         = maker.city         || maker.store_city    || "";
  const country      = maker.country      || maker.store_country || "";
  const avatarUrl    = maker.avatarUrl    || maker.gravatar?.url || "";
  const bannerUrl    = maker.bannerUrl    || maker.banner?.url   || "";
  const instagram    = maker.instagram    || "";
  const twitter      = maker.twitter      || "";
  const website      = maker.website      || maker.store_url     || "";
  const rating       = maker.rating       || "";
  const yearsActive  = maker.yearsActive  || maker.years_active  || "";
  const directorySlug = maker.directorySlug || "";
  const location     = [city, country].filter(Boolean).join(", ");
  const productCount = products.length;

  return (
    <div className="maker-single">
      {/* Breadcrumb */}
      <nav className="maker-breadcrumb" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span className="sep">→</span>
        <Link href="/makers">Makers</Link>
        <span className="sep">→</span>
        <span>{storeName}</span>
      </nav>

      {/* Hero */}
      <section className="maker-hero">
        <div className="maker-hero-visual">
          {bannerUrl || avatarUrl ? (
            <Image
              src={bannerUrl || avatarUrl}
              alt={storeName}
              fill
              style={{ objectFit: "cover" }}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="maker-hero-visual-placeholder">
              <span>{storeName.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="maker-hero-info">
          <div className="maker-vetted-badge">★ Vetted Maker</div>
          <h1 className="maker-hero-name">{storeName}</h1>
          {location && <div className="maker-hero-location">{location}</div>}
          {bio && <p className="maker-hero-bio">{bio}</p>}

          <div className="maker-stats">
            {yearsActive && (
              <div className="maker-stat">
                <div className="maker-stat-num">{yearsActive}</div>
                <div className="maker-stat-label">Maker since</div>
              </div>
            )}
            <div className="maker-stat">
              <div className="maker-stat-num">{productCount}</div>
              <div className="maker-stat-label">{productCount === 1 ? "Product" : "Products"}</div>
            </div>
            <div className="maker-stat">
              <div className="maker-stat-num">{rating ? `★ ${rating}` : "★ New"}</div>
              <div className="maker-stat-label">Moveee rating</div>
            </div>
          </div>

          <div className="maker-hero-actions">
            <Link href={`/shop/brand/${slug}`} className="maker-hero-cta">
              Shop all products →
            </Link>
            {directorySlug && (
              <Link href={`/directory/${directorySlug}`} className="maker-hero-cta-outline">
                View profile
              </Link>
            )}
          </div>

          {(website || instagram || twitter) && (
            <div className="maker-socials">
              {website && (
                <a href={website.startsWith("http") ? website : `https://${website}`} target="_blank" rel="noopener noreferrer" className="maker-social-link">
                  Website ↗
                </a>
              )}
              {instagram && (
                <a href={`https://instagram.com/${instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="maker-social-link">
                  Instagram ↗
                </a>
              )}
              {twitter && (
                <a href={`https://twitter.com/${twitter.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="maker-social-link">
                  X / Twitter ↗
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Products */}
      {products.length > 0 ? (
        <section className="maker-products-section">
          <div className="maker-products-header">
            <h2 className="maker-products-title">Work by <em>{storeName}</em></h2>
            <span className="maker-products-count">{productCount} {productCount === 1 ? "piece" : "pieces"}</span>
          </div>
          <div className="maker-products-grid">
            {products.map((p: any) => (
              <Link key={p.id || p.slug} href={`/shop/${p.slug}`} className="maker-product-card">
                <div className="maker-product-img">
                  {(p.imageUrl || p.image?.sourceUrl) && (
                    <Image
                      src={p.imageUrl || p.image.sourceUrl}
                      alt={p.imageAlt || p.image?.altText || p.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                </div>
                <div className="maker-product-body">
                  <div className="maker-product-name">{p.name}</div>
                  {p.price && (
                    <div className="maker-product-price" dangerouslySetInnerHTML={{ __html: p.price }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <section className="maker-products-section">
          <div className="maker-products-header">
            <h2 className="maker-products-title">Work by <em>{storeName}</em></h2>
          </div>
          <div className="maker-empty-products">
            <p>No products listed yet. Check back soon.</p>
          </div>
        </section>
      )}
    </div>
  );
}
