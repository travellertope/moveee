import { getWPData, GET_PRODUCT_BY_SLUG, GET_PRODUCTS, GET_POST_BY_ID } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ProductGallery from "./ProductGallery";
import ProductSelectors from "./ProductSelectors";
import ProductAccordion from "./ProductAccordion";
import "../shop.css";

export const dynamic = "force-dynamic";

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

const PROCESS_STEPS = [
  { title: "Source", desc: "Materials are chosen for provenance, sustainability, and sensory quality.", duration: "1–4 weeks" },
  { title: "Shape", desc: "Each piece is formed by hand — no two are exactly alike.", duration: "2–8 weeks" },
  { title: "Finish", desc: "Surfaces are treated, fired, or polished to the maker's exacting standard.", duration: "1–3 weeks" },
  { title: "Inspect", desc: "Every item is individually checked before it leaves the studio.", duration: "1–2 days" },
];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let product: any = null;
  let relatedProducts: any[] = [];

  try {
    const data = await getWPData(GET_PRODUCT_BY_SLUG, { slug });
    product = data?.product ?? null;
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
  const gallery = product.galleryImages?.nodes ?? [];
  const allImages = [
    ...(mainImage ? [mainImage] : []),
    ...gallery,
  ].slice(0, 5);

  const vname = vendorName(product);
  const variations = product.variations?.nodes ?? [];

  // ACF + vendor fields from moveee-graphql-bridge plugin
  const makerStory: string = meta(product.metaData, "maker_story") || "";
  const careInstructions: string = meta(product.metaData, "care_instructions") || "";
  const vendorCity: string = meta(product.metaData, "vendor_city") || meta(product.metaData, "_vendor_city") || "";
  const vendorDesc: string = meta(product.metaData, "vendor_description") || meta(product.metaData, "_vendor_description") || "";
  const vendorYears: string = meta(product.metaData, "vendor_years") || meta(product.metaData, "_vendor_years") || "";
  const vendorRating: string = meta(product.metaData, "vendor_rating") || meta(product.metaData, "_vendor_rating") || "";
  const vendorProductCount: string = meta(product.metaData, "vendor_product_count") || meta(product.metaData, "_vendor_product_count") || "";

  // Parse process_steps JSON (array of { title, desc, duration })
  interface ProcessStep { title: string; desc: string; duration?: string }
  let processSteps: ProcessStep[] = [];
  try {
    const raw = meta(product.metaData, "process_steps");
    if (raw) processSteps = JSON.parse(raw);
  } catch { /* malformed JSON — fall back to static */ }
  if (!processSteps.length) processSteps = PROCESS_STEPS;

  // Fetch the "As Seen In" linked magazine post if ID is set
  let asSeenInPost: any = null;
  const asSeenInId = meta(product.metaData, "as_seen_in_post_id");
  try {
    if (asSeenInId) {
      const postData = await getWPData(GET_POST_BY_ID, { id: asSeenInId });
      asSeenInPost = postData?.post ?? null;
    }
  } catch { /* CMS unreachable */ }

  const accordionItems = [
    {
      title: "Description",
      content: (
        <div
          dangerouslySetInnerHTML={{
            __html: product.description || product.shortDescription || "<p>No description available.</p>",
          }}
        />
      ),
    },
    {
      title: "Materials & Care",
      content: careInstructions ? (
        <p>{careInstructions}</p>
      ) : (
        <dl>
          <dt>Material</dt><dd>Natural fibres — specific composition varies by piece</dd>
          <dt>Care</dt><dd>Spot clean or hand wash in cold water</dd>
          <dt>Origin</dt><dd>{vendorCity || "Handmade by a vetted maker"}</dd>
        </dl>
      ),
    },
    {
      title: "Delivery & Returns",
      content: (
        <>
          <p>Free UK delivery on all orders. Delivered in 3–5 working days.</p>
          <p>Free returns within 30 days of receipt. Items must be unused and in original condition.</p>
        </>
      ),
    },
    {
      title: "About the Maker",
      content: vendorDesc ? (
        <p>{vendorDesc}</p>
      ) : (
        <p>
          {vname || "This maker"} is a vetted Moveee partner. Every maker is personally reviewed
          for craft integrity, fair production practices, and lasting quality.
        </p>
      ),
    },
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
        {/* Gallery */}
        {allImages.length > 0 ? (
          <ProductGallery images={allImages} productName={product.name} />
        ) : (
          <div className="sp-gallery-wrap">
            <div className="sp-main-image" style={{ background: "var(--ink)" }}>
              <div className="sp-vetted-seal"><span className="star">★</span> Vetted Maker</div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="sp-product-info">
          {vname && (
            <Link href="/origins" className="sp-vendor-link">{vname}</Link>
          )}

          <h1 className="sp-product-name">{product.name}</h1>

          {product.shortDescription && (
            <div
              className="sp-product-lede"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <ProductSelectors
            productId={product.databaseId}
            price={product.price}
            regularPrice={product.regularPrice}
            variations={variations}
          />

          <ProductAccordion items={accordionItems} />
        </div>
      </section>

      {/* ── AS SEEN IN ── */}
      <section className="sp-seen-in">
        <div className="sp-seen-in-inner">
          <div className="sp-seen-in-label">As Seen In</div>
          <div>
            <div className="sp-seen-in-title">
              {asSeenInPost ? (
                <>
                  <em>{asSeenInPost.title}</em>
                  {asSeenInPost.categories?.nodes?.[0] && (
                    <span className="sp-seen-in-meta">{asSeenInPost.categories.nodes[0].name}</span>
                  )}
                </>
              ) : (
                <>
                  <em>The Moveee Edit</em>
                  <span className="sp-seen-in-meta">Issue 014 · Craft &amp; Makers</span>
                </>
              )}
            </div>
          </div>
          <Link
            href={asSeenInPost ? `/magazine/${asSeenInPost.slug}` : "/magazine"}
            className="sp-seen-in-cta"
          >
            Read the Feature →
          </Link>
        </div>
      </section>

      {/* ── MAKER STORY ── */}
      <section className="sp-story">
        <div className="sp-story-header">
          <div className="sp-story-num">01</div>
          <div>
            <h2>
              The <em>maker</em> behind it
            </h2>
            {vname && <p>A portrait of {vname} — their process, their place, their obsession with craft.</p>}
          </div>
          <div className="sp-story-meta">Origins Journal</div>
        </div>
        <div className="sp-story-body">
          {mainImage?.sourceUrl && (
            <div className="sp-story-image">
              <Image
                src={mainImage.sourceUrl}
                alt={mainImage.altText || product.name}
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          )}
          <div className="sp-story-text">
            {makerStory ? (
              <div dangerouslySetInnerHTML={{ __html: makerStory }} />
            ) : (
              <>
                <p>
                  Every object in the Moveee shop is the result of a deliberate choice —
                  a maker who decided to do it properly, to take the slower path, to
                  refuse the shortcut.
                </p>
                <blockquote>
                  "We don&rsquo;t make things quickly. We make them right."
                  <cite>
                    <span className="name">{vname || "The Maker"}</span>
                    {vendorCity && ` · ${vendorCity}`}
                  </cite>
                </blockquote>
                <p>
                  Moveee vets every maker personally — visiting studios, understanding
                  supply chains, and ensuring every piece meets our standard for
                  craft integrity and fair production.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── PROCESS ── */}
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

      {/* ── VENDOR PROFILE ── */}
      <section className="sp-vendor-profile">
        <div className="sp-vendor-inner">
          <div className="sp-vendor-visual">
            {mainImage?.sourceUrl && (
              <Image
                src={mainImage.sourceUrl}
                alt={vname || product.name}
                fill
                style={{ objectFit: "cover" }}
              />
            )}
          </div>
          <div>
            <div className="sp-vendor-tag">Vetted Maker{vendorCity && ` · ${vendorCity}`}</div>
            <h2>{vname || <em>The Maker</em>}</h2>
            <p className="sp-vendor-body">
              {vendorDesc ||
                "A maker chosen for their commitment to craft integrity, sustainable materials, and timeless design. Personally vetted by the Moveee team."}
            </p>
            <div className="sp-vendor-stats">
              <div className="sp-vendor-stat">
                <div className="num">{vendorYears ? `${vendorYears}` : "7+"}</div>
                <span className="label">Years making</span>
              </div>
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
              <Link href="/origins" className="btn-outline">Read their story</Link>
              {firstCategory && (
                <Link href={`/shop/category/${firstCategory}`} className="btn-filled">
                  More from {vname || "this maker"}
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MORE FROM STUDIO ── */}
      {relatedProducts.length > 0 && (
        <section className="sp-more-from">
          <div className="sp-more-from-header">
            <h2>
              More from <em>{firstCat?.name ?? "the Shop"}</em>
            </h2>
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
                {vendorName(p) && (
                  <div className="vendor-tag">{vendorName(p)}</div>
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
