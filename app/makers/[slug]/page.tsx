import { getWPData, GET_MAKER_BY_SLUG, GET_PRODUCTS_BY_VENDOR } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import "../makers.css";

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getWPData(GET_MAKER_BY_SLUG, { slug }).catch(() => null);
  const maker = data?.moveeeVendorBySlug;
  if (!maker) return { title: "Maker Not Found | The Moveee" };
  return {
    title: `${maker.storeName} | Makers | The Moveee`,
    description:
      maker.bio ||
      `Discover handcrafted pieces by ${maker.storeName} on The Moveee.`,
  };
}

export default async function SingleMakerPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [vendorData, productsData] = await Promise.all([
    getWPData(GET_MAKER_BY_SLUG, { slug }).catch(() => null),
    getWPData(GET_PRODUCTS_BY_VENDOR, { first: 24, vendor: slug }).catch(
      () => null
    ),
  ]);

  const maker = vendorData?.moveeeVendorBySlug;
  if (!maker) notFound();

  const products: any[] = productsData?.products?.nodes ?? [];
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
        <span>{maker.storeName}</span>
      </nav>

      {/* ── Hero ── */}
      <section className="maker-hero">
        <div className="maker-hero-visual">
          {maker.avatarUrl && (
            <Image
              src={maker.avatarUrl}
              alt={maker.storeName}
              fill
              style={{ objectFit: "cover" }}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>

        <div className="maker-hero-info">
          <div className="maker-vetted-badge">★ Vetted Maker</div>
          <h1 className="maker-hero-name">{maker.storeName}</h1>
          {location && (
            <div className="maker-hero-location">{location}</div>
          )}
          {maker.bio && <p className="maker-hero-bio">{maker.bio}</p>}

          <div className="maker-stats">
            {maker.yearsActive && (
              <div className="maker-stat">
                <div className="maker-stat-num">{maker.yearsActive}</div>
                <div className="maker-stat-label">Years making</div>
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
              Work by <em>{maker.storeName}</em>
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
