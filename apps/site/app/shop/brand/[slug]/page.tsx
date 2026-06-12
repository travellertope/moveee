import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import "../../shop.css";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 3600;

const CMS = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

async function fetchVendor(slug: string): Promise<any | null> {
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
      `${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(slug)}/products?first=48`,
      { next: { revalidate: 3600 } }
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) return json;
    }
  } catch { /* fall through */ }
  return [];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await fetchVendor(slug);
  if (!vendor) return { title: { absolute: "Brand Not Found | The Moveee" } };
  const name = vendor.storeName || vendor.store_name || vendor.display_name || "Brand";
  return {
    title: { absolute: `${name} | Shop | The Moveee` },
    description: vendor.bio || vendor.shop_description || `Shop all products by ${name} on The Moveee.`,
  };
}

export default async function ShopBrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [vendor, products] = await Promise.all([
    fetchVendor(slug),
    fetchVendorProducts(slug),
  ]);

  if (!vendor) notFound();

  const storeName  = vendor.storeName  || vendor.store_name  || vendor.display_name || "Brand";
  const bio        = vendor.bio        || vendor.shop_description || "";
  const city       = vendor.city       || vendor.store_city    || "";
  const country    = vendor.country    || vendor.store_country || "";
  const avatarUrl  = vendor.avatarUrl  || vendor.gravatar?.url || "";
  const bannerUrl  = vendor.bannerUrl  || vendor.banner?.url   || "";
  const location   = [city, country].filter(Boolean).join(", ");

  return (
    <div className="brand-page">
      {/* Breadcrumb */}
      <nav className="brand-breadcrumb" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span className="sep">→</span>
        <span>{storeName}</span>
      </nav>

      {/* Header */}
      <header className="brand-header">
        <div className="brand-header-visual">
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt={storeName}
              fill
              style={{ objectFit: "cover" }}
              priority
              sizes="(max-width: 768px) 100vw, 60vw"
            />
          ) : (
            <div className="brand-header-placeholder">
              <span>{storeName.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="brand-header-meta">
          {avatarUrl && (
            <div className="brand-avatar">
              <Image
                src={avatarUrl}
                alt={storeName}
                width={72}
                height={72}
                style={{ objectFit: "cover", borderRadius: "50%" }}
              />
            </div>
          )}
          <div className="brand-header-text">
            <h1 className="brand-name">{storeName}</h1>
            {location && <div className="brand-location">{location}</div>}
            {bio && <p className="brand-bio">{bio}</p>}
            <Link href={`/makers/${slug}`} className="brand-maker-link">
              View maker profile →
            </Link>
          </div>
        </div>
      </header>

      {/* Products */}
      <section className="brand-products">
        <div className="brand-products-bar">
          <h2 className="brand-products-heading">
            All products <span className="brand-products-count">({products.length})</span>
          </h2>
        </div>

        {products.length > 0 ? (
          <div className="brand-products-grid">
            {products.map((p: any) => (
              <Link key={p.id || p.slug} href={`/shop/${p.slug}`} className="brand-product-card">
                <div className="brand-product-img">
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
                <div className="brand-product-body">
                  <div className="brand-product-name">{p.name}</div>
                  {p.price && (
                    <div className="brand-product-price" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.price) }} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="brand-empty">
            <p>No products listed yet. Check back soon.</p>
            <Link href="/shop" className="brand-empty-link">Browse all products →</Link>
          </div>
        )}
      </section>
    </div>
  );
}
