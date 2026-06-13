import { getWPData, GET_PRODUCT_BY_SLUG, GET_PRODUCT_EXTRA, GET_PRODUCTS, GET_POST_BY_ID } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductGallery from "./ProductGallery";
import ShopSessionSection from "./ShopSessionSection";
import ProductAccordion from "./ProductAccordion";
import "../shop.css";
import { sanitizeHtml } from "@/lib/sanitize";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: any = null;
  try {
    const data = await getWPData(GET_PRODUCT_BY_SLUG, { slug });
    product = data?.product ?? null;
  } catch { /* CMS unreachable */ }

  if (!product) return {};

  const title = `${product.name} — Moveee Magazine Shop`;
  const description = product.shortDescription
    ? product.shortDescription.replace(/<[^>]*>/g, "").trim().slice(0, 155)
    : `${product.name} — curated by Moveee Magazine.`;
  const image = product.image?.sourceUrl ?? "/og-fallback.png";

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `https://themoveee.com/shop/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://themoveee.com/shop/${slug}`,
      siteName: "Moveee Magazine",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],
    },
    twitter: {
      card: "summary_large_image" as const,
      site: "@moveeemedia",
      creator: "@moveeemedia",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: any = null;
  let relatedProducts: any[] = [];

  try {
    // Fetch core product and extra vendor/meta in parallel.
    // GET_PRODUCT_EXTRA silently returns null if moveee-graphql-bridge
    // is not yet active — the page still renders without vendor sections.
    const [coreData, extraData] = await Promise.all([
      getWPData(GET_PRODUCT_BY_SLUG, { slug }),
      getWPData(GET_PRODUCT_EXTRA, { slug }),
    ]);
    product = coreData?.product ?? null;
    if (product && extraData?.product) {
      product.vendorProfile = extraData.product.vendorProfile ?? null;
      product.moveeeMeta    = extraData.product.moveeeMeta    ?? null;
    }
  } catch { /* CMS unreachable */ }

  if (!product) notFound();

  // Fetch related products from same category
  const firstCategory = product.productCategories?.nodes?.[0]?.slug;
  try {
    if (firstCategory) {
      const rel = await getWPData(GET_PRODUCTS, { first: 6, category: firstCategory });
      relatedProducts = (rel?.products?.nodes ?? [])
        .filter((p: any) => p.slug !== slug)
        .slice(0, 4);
    }
  } catch { /* CMS unreachable */ }

  const mainImage = product.image;
  const gallery   = product.galleryImages?.nodes ?? [];
  const allImages = [...(mainImage ? [mainImage] : []), ...gallery].slice(0, 5);

  // ── Vendor profile (from WCFM via moveee-graphql-bridge) ──────────────────
  const vp = product.vendorProfile ?? {};
  const vname: string           = vp.storeName    || "";
  const vendorDesc: string      = vp.bio          || "";
  const vendorCity: string      = vp.city         || "";
  const vendorYears: string     = vp.yearsActive  || "";
  const vendorRating: string    = vp.rating       || "";
  const vendorProductCount: string = vp.productCount ? String(vp.productCount) : "";
  const vendorAvatarUrl: string = vp.avatarUrl    || "";

  // Session-dependent Pro perks are rendered client-side in ShopSessionSection

  // ── Product editorial meta (set as WooCommerce custom fields) ─────────────
  const pm = product.moveeeMeta ?? {};
  const makerStory: string       = pm.makerStory       || "";
  const careInstructions: string = pm.careInstructions || "";
  const deliveryInfo: string     = pm.deliveryInfo     || "";

  // ── Pro member perks ──────────────────────────────────────────────────────
  const memberPriceHtml: string  = pm.memberPrice      || "";
  const earlyAccessUntil: string = pm.earlyAccessUntil || "";
  const isEarlyAccessActive = earlyAccessUntil
    ? new Date(earlyAccessUntil) > new Date()
    : false;
  // isGated / isPro resolved client-side in ShopSessionSection

  const variations = product.variations?.nodes ?? [];

  // Process steps — only use if genuinely set in WordPress; never show generic fallback
  interface ProcessStep { title: string; desc: string; duration?: string }
  let processSteps: ProcessStep[] = [];
  try {
    if (pm.processSteps) processSteps = JSON.parse(pm.processSteps);
  } catch { /* malformed JSON */ }

  // "As Seen In" — only fetch if the post ID is actually set
  let asSeenInPost: any = null;
  try {
    if (pm.asSeenInPostId) {
      const postData = await getWPData(GET_POST_BY_ID, { id: pm.asSeenInPostId });
      asSeenInPost = postData?.post ?? null;
    }
  } catch { /* CMS unreachable */ }

  // ── Accordion — only include tabs that have real content ─────────────────
  const accordionItems = [
    {
      title: "Description",
      content: (
        <div
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(product.description || product.shortDescription || "<p>No description available.</p>"),
          }}
        />
      ),
    },
    // Materials & Care — only shown when the field is filled in WordPress
    ...(careInstructions ? [{
      title: "Materials & Care",
      content: <p>{careInstructions}</p>,
    }] : []),
    // Delivery & Returns — only shown when the field is filled in WordPress
    ...(deliveryInfo ? [{
      title: "Delivery & Returns",
      content: <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(deliveryInfo) }} />,
    }] : []),
    // About the Maker — only shown when vendor has a name or bio in WCFM
    ...(vname || vendorDesc ? [{
      title: "About the Maker",
      content: vendorDesc ? (
        <p>{vendorDesc}</p>
      ) : (
        <p>
          {vname} is a vetted Moveee partner. Every maker is personally reviewed
          for craft integrity, fair production practices, and lasting quality.
        </p>
      ),
    }] : []),
  ];

  const firstCat = product.productCategories?.nodes?.[0];

  return (
    <>
      {/* ── BREADCRUMB ── */}
      <nav className="sp-breadcrumb" aria-label="Breadcrumb">
        <div>
          <Link href="/shop">Shop</Link>
          {firstCat && (
            <>
              <span className="sep">→</span>
              <Link href={`/shop/category/${firstCat.slug}`}>{firstCat.name}</Link>
            </>
          )}
          <span className="sep">→</span>
          <span style={{ color: "var(--ink)" }}>{product.name}</span>
        </div>
        <nav className="sp-breadcrumb-nav" aria-label="Product navigation">
          <Link href="/shop">← Back to Shop</Link>
        </nav>
      </nav>

      {/* ── PRODUCT HERO ── */}
      <section className="sp-product-hero">
        {allImages.length > 0 ? (
          <ProductGallery images={allImages} productName={product.name} />
        ) : (
          <div className="sp-gallery-wrap">
            <div className="sp-main-image" style={{ background: "var(--ink)" }}>
              <div className="sp-vetted-seal"><span className="star">★</span> Vetted Maker</div>
            </div>
          </div>
        )}

        <div className="sp-product-info">
          {vname && (
            <Link href={vp.slug ? `/makers/${vp.slug}` : "/makers"} className="sp-vendor-link">{vname}</Link>
          )}

          <h1 className="sp-product-name">{product.name}</h1>

          {product.shortDescription && (
            <div
              className="sp-product-lede"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(product.shortDescription) }}
            />
          )}

          <ShopSessionSection
            productId={parseInt(product.databaseId)}
            price={product.price}
            regularPrice={product.regularPrice}
            variations={variations}
            memberPrice={memberPriceHtml}
            isEarlyAccessActive={isEarlyAccessActive}
            earlyAccessUntil={earlyAccessUntil}
          />

          <ProductAccordion items={accordionItems} />
        </div>
      </section>

      {/* ── AS SEEN IN — only when a linked magazine post is set ── */}
      {asSeenInPost && (
        <section className="sp-seen-in">
          <div className="sp-seen-in-inner">
            <div className="sp-seen-in-label">As Seen In</div>
            <div>
              <div className="sp-seen-in-title">
                <em>{asSeenInPost.title}</em>
                {asSeenInPost.categories?.nodes?.[0] && (
                  <span className="sp-seen-in-meta">
                    {asSeenInPost.categories.nodes[0].name}
                  </span>
                )}
              </div>
            </div>
            <Link href={`/magazine/${asSeenInPost.slug}`} className="sp-seen-in-cta">
              Read the Feature →
            </Link>
          </div>
        </section>
      )}

      {/* ── MAKER STORY — only when maker story text or vendor name exists ── */}
      {(makerStory || vname) && (
        <section className="sp-story">
          <div className="sp-story-header">
            <div className="sp-story-num">01</div>
            <div>
              <h2>The <em>maker</em> behind it</h2>
              {vname && (
                <p>A portrait of {vname} — their process, their place, their obsession with craft.</p>
              )}
            </div>
            <div className="sp-story-meta">Origins Journal</div>
          </div>
          <div className="sp-story-body">
            {(vendorAvatarUrl || mainImage?.sourceUrl) && (
              <div className="sp-story-image">
                <Image
                  src={vendorAvatarUrl || mainImage.sourceUrl}
                  alt={vname || product.name}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
            )}
            <div className="sp-story-text">
              {makerStory ? (
                <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(makerStory) }} />
              ) : (
                <p>
                  {vname} is a vetted Moveee partner — personally reviewed for craft
                  integrity, fair production practices, and lasting quality.
                  {vendorCity && ` Based in ${vendorCity}.`}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── PROCESS — only when process_steps is set in WordPress ── */}
      {processSteps.length > 0 && (
        <section className="sp-process">
          <div className="sp-process-header">
            <div className="sp-process-label">How It&rsquo;s Made</div>
            <h2>From raw material <em>to your door</em></h2>
            <p>A {processSteps.length}-stage process — each step overseen by the maker themselves.</p>
          </div>
          <div className="sp-process-grid">
            {processSteps.map((step, i) => (
              <div key={step.title} className="sp-process-step">
                <div className="step-img">
                  <div className="step-num">0{i + 1}</div>
                </div>
                <h4>{step.title}</h4>
                <p>{step.desc}</p>
                {step.duration && <span className="duration">{step.duration}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── VENDOR PROFILE — only when the vendor has a name in WCFM ── */}
      {vname && (
        <section className="sp-vendor-profile">
          <div className="sp-vendor-inner">
            <div className="sp-vendor-visual">
              {(vendorAvatarUrl || mainImage?.sourceUrl) && (
                <Image
                  src={vendorAvatarUrl || mainImage.sourceUrl}
                  alt={vname}
                  fill
                  style={{ objectFit: "cover" }}
                />
              )}
            </div>
            <div>
              <div className="sp-vendor-tag">
                Vetted Maker{vendorCity && ` · ${vendorCity}`}
              </div>
              <h2>{vname}</h2>
              {vendorDesc && <p className="sp-vendor-body">{vendorDesc}</p>}
              <div className="sp-vendor-stats">
                {vendorYears && (
                  <div className="sp-vendor-stat">
                    <div className="num">{vendorYears}</div>
                    <span className="label">Years making</span>
                  </div>
                )}
                <div className="sp-vendor-stat">
                  <div className="num">{vendorProductCount || relatedProducts.length + 1}</div>
                  <span className="label">Products in shop</span>
                </div>
                <div className="sp-vendor-stat">
                  <div className="num">{vendorRating ? `★ ${vendorRating}` : "★ Vetted"}</div>
                  <span className="label">Moveee rating</span>
                </div>
              </div>
              <div className="sp-vendor-cta-row">
                <Link href={vp.slug ? `/makers/${vp.slug}` : "/makers"} className="btn-outline">
                  View maker profile
                </Link>
                {firstCategory && (
                  <Link href={`/shop/category/${firstCategory}`} className="btn-filled">
                    More from {vname}
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── MORE FROM THIS CATEGORY ── */}
      {relatedProducts.length > 0 && (
        <section className="sp-more-from">
          <div className="sp-more-from-header">
            <h2>More from <em>{firstCat?.name ?? "the Shop"}</em></h2>
            <Link href={firstCat ? `/shop/category/${firstCat.slug}` : "/shop"}>
              View all →
            </Link>
          </div>
          <div className="sp-more-from-grid">
            {relatedProducts.map((p: any) => (
              <Link key={p.id} href={`/shop/${p.slug}`} className="mini-product">
                <div className="img">
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
                </div>
                {p.vendorProfile?.storeName && (
                  <div className="vendor-tag">{p.vendorProfile.storeName}</div>
                )}
                <div className="name">{p.name}</div>
                {p.price && <div className="price">{p.price}</div>}
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
