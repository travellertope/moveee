import { getWPData, GET_MOVEEE_EDIT } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../shop.css";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 1800;

export const metadata = {
  title: "The Moveee Edit — Curated Shop",
  description: "Products handpicked by the Moveee editorial team — straight from the stories we love.",
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").slice(0, 140).trim();
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export default async function MoveeeEditPage() {
  let editorials: any[] = [];
  try {
    const data = await getWPData(GET_MOVEEE_EDIT, { first: 20, tag: "moveee-edit" });
    editorials = (data?.posts?.nodes ?? []).filter((p: any) => (p.featuredProducts ?? []).length > 0);
  } catch { /* CMS unreachable */ }

  return (
    <div className="edit-page">
      {/* Hero */}
      <section className="edit-hero">
        <div className="edit-hero-inner">
          <p className="edit-eyebrow">Moveee Lifestyle · The Edit</p>
          <h1 className="edit-headline">The Moveee Edit</h1>
          <p className="edit-lede">
            Products picked by our writers and editors — straight from the stories we tell.
            Every item is connected to a piece of culture.
          </p>
          <Link href="/shop" className="edit-hero-link">Browse the full shop →</Link>
        </div>
      </section>

      {!editorials.length ? (
        <section className="edit-empty">
          <div className="edit-empty-inner">
            <div className="edit-empty-icon">✦</div>
            <h2>Curation coming soon</h2>
            <p>Our editors are building the first edit. Check back shortly — or browse the full shop.</p>
            <Link href="/shop" className="edit-btn-primary">Browse the shop →</Link>
          </div>
        </section>
      ) : (
        <section className="edit-stream">
          <div className="edit-stream-inner">
            {editorials.map((post: any) => {
              const img = post.featuredImage?.node;
              const cat = post.categories?.nodes?.[0];
              const products: any[] = post.featuredProducts ?? [];
              return (
                <div key={post.id} className="edit-feature">
                  <div className="edit-feature-story">
                    {img && (
                      <div className="edit-feature-cover">
                        <Image src={img.sourceUrl} alt={img.altText || post.title} fill style={{ objectFit: "cover" }} sizes="480px" />
                      </div>
                    )}
                    <div className="edit-feature-meta">
                      {cat && <span className="edit-feature-cat">{cat.name}</span>}
                      <Link href={`/magazine/${post.slug}`} className="edit-feature-title">
                        {post.title}
                      </Link>
                      {post.excerpt && (
                        <p className="edit-feature-excerpt">{stripHtml(post.excerpt)}</p>
                      )}
                      <div className="edit-feature-date">{fmtDate(post.date)}</div>
                      <Link href={`/magazine/${post.slug}`} className="edit-read-link">
                        Read the story →
                      </Link>
                    </div>
                  </div>

                  <div className="edit-feature-products">
                    <div className="edit-products-label">From this story</div>
                    <div className="edit-products-grid">
                      {products.slice(0, 4).map((p: any) => (
                        <Link key={p.id} href={`/shop/${p.slug}`} className="edit-product-card">
                          <div className="edit-product-img">
                            {p.imageUrl ? (
                              <Image src={p.imageUrl} alt={p.imageAlt || p.name} fill style={{ objectFit: "cover" }} sizes="160px" />
                            ) : (
                              <div className="edit-product-img-placeholder" />
                            )}
                          </div>
                          <div className="edit-product-name">{p.name}</div>
                          <div className="edit-product-price" dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.price) }} />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Browse more CTA */}
      <section className="edit-browse-cta">
        <div className="edit-browse-inner">
          <h2 className="edit-browse-title">Want more?</h2>
          <p className="edit-browse-sub">Explore everything in the Moveee shop — vetted makers, all culture-connected.</p>
          <div className="edit-browse-actions">
            <Link href="/shop" className="edit-btn-primary">Browse the shop</Link>
            <Link href="/makers" className="edit-btn-outline">Meet the makers</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
