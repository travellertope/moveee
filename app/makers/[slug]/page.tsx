import { getWPData, GET_MAKER_BY_SLUG, GET_PRODUCTS_BY_VENDOR } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../makers.css";

export const revalidate = 3600;

const CMS = "https://cms.themoveee.com";

async function fetchMaker(slug: string): Promise<any | null> {
  try {
    const data = await getWPData(GET_MAKER_BY_SLUG, { slug });
    const m = data?.moveeeVendorBySlug;
    if (m) return m;
  } catch { /* fall through */ }
  try {
    const res = await fetch(`${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (json && !json.code) return json;
    }
  } catch { /* fall through */ }
  return null;
}

async function fetchVendorProducts(slug: string): Promise<any[]> {
  try {
    const data = await getWPData(GET_PRODUCTS_BY_VENDOR, { first: 24, vendor: slug });
    const nodes = data?.products?.nodes ?? [];
    if (nodes.length > 0) return nodes;
  } catch { /* fall through */ }
  try {
    const res = await fetch(
      `${CMS}/wp-json/moveee/v1/vendors/${encodeURIComponent(slug)}/products?first=24`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json)) {
        return json.map((p: any) => ({
          id:    p.id,
          slug:  p.slug,
          name:  p.name,
          price: p.price,
          image: p.imageUrl ? { sourceUrl: p.imageUrl, altText: p.imageAlt || "" } : null,
        }));
      }
    }
  } catch { /* fall through */ }
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const maker = await fetchMaker(slug);
  if (!maker) return { title: { absolute: "Maker Not Found | The Moveee" } };
  const name = maker.storeName || maker.display_name || "Maker";
  return {
    title: { absolute: `${name} | Makers | The Moveee` },
    description:
      maker.bio ||
      `Discover handcrafted pieces by ${name} on The Moveee.`,
  };
}

export default async function SingleMakerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [maker, products] = await Promise.all([
    fetchMaker(slug),
    fetchVendorProducts(slug),
  ]);

  if (!maker) notFound();

  const storeName = maker.storeName || maker.display_name || "Unnamed Maker";
  const location = [maker.city, maker.country].filter(Boolean).join(", ");
  const productCount = maker.productCount ?? products.length;

  return (
    <div className="maker-single">
      {/* ── Breadcrumb ── */}
      <nav className="maker-breadcrumb" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span className="sep">→</span>
        <Link href="/makers">Makers</Link>
        <span className="sep">→</span>
        <span>{storeName}</span>
      </nav>

      {/* ── Hero ── */}
      <section className="maker-hero">
        <div className="maker-hero-visual">
          {maker.avatarUrl && (
            <Image
              src={maker.avatarUrl}
              alt={storeName}
              fill
              style={{ objectFit: "cover" }}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>

        <div className="maker-hero-info">
          <div className="maker-vetted-badge">★ Vetted Maker</div>
          <h1 className="maker-hero-name">{storeName}</h1>
          {location && (
            <div className="maker-hero-location">{location}</div>
          )}
          {maker.bio && <p className="maker-hero-bio">{maker.bio}</p>}

          <div className="maker-stats">
            {maker.yearsActive && (
              <div className="maker-stat">
                <div className="maker-stat-num">{maker.yearsActive}</div>
                <div className="maker-stat-label">Maker since</div>
              </div>
            )}
            <div className="maker-stat">
              <div className="maker-stat-num">{productCount}</div>
              <div className="maker-stat-label">
                {productCount === 1 ? "Product" : "Products"}
              </div>
            </div>
            <div className="maker-stat">
              <div className="maker-stat-num">
                {maker.rating ? `★ ${maker.rating}` : "★ Vetted"}
              </div>
              <div className="maker-stat-label">Moveee rating</div>
            </div>
          </div>

          <Link href="/shop" className="maker-hero-cta">
            Browse the shop →
          </Link>
        </div>
      </section>

      {/* ── Products ── */}
      {products.length > 0 && (
        <section className="maker-products-section">
          <div className="maker-products-header">
            <h2 className="maker-products-title">
              Work by <em>{storeName}</em>
            </h2>
            <span className="maker-products-count">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </span>
          </div>
          <div className="maker-products-grid">
            {products.map((p: any) => (
              <Link
                key={p.id}
                href={`/shop/${p.slug}`}
                className="maker-product-card"
              >
                <div className="maker-product-img">
                  {p.image?.sourceUrl && (
                    <Image
                      src={p.image.sourceUrl}
                      alt={p.image.altText || p.name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                </div>
                <div className="maker-product-body">
                  <div className="maker-product-name">{p.name}</div>
                  {p.price && (
                    <div
                      className="maker-product-price"
                      dangerouslySetInnerHTML={{ __html: p.price }}
                    />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
