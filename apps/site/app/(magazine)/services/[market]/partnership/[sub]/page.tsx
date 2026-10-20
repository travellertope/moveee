import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Metadata } from "next";
import { getMarket, type TierPackage } from "../../../market-data";
import { getPartnershipCategories, getPartnershipCategory } from "../../../partnership-pages";
import { isPayableTier } from "../../../payment-lookup";

const VALID_MARKETS = ["africa", "uk", "us"];

function checkoutHref(market: string, subCategoryId: string, itemName: string, label: string, price: string) {
  const params = new URLSearchParams({ market, partnership: subCategoryId, item: itemName, kind: "one_time", label, price });
  return `/services/checkout?${params.toString()}`;
}

export function generateStaticParams() {
  return VALID_MARKETS.flatMap((market) =>
    getPartnershipCategories(market).map((cat) => ({ market, sub: cat.id }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string; sub: string }>;
}): Promise<Metadata> {
  const { market, sub } = await params;
  const cat = getPartnershipCategory(market, sub);
  if (!cat) return { title: { absolute: "Media Partnership | Moveee" } };
  return {
    title: { absolute: `${cat.label} — Media Partnership | Moveee` },
    description: cat.page.tagline,
  };
}

function TierGrid({ packages, market, subCategoryId }: { packages: TierPackage[]; market: string; subCategoryId: string }) {
  return (
    <div className="svc-fgrid svc-fgrid--auto">
      {packages.map((pkg) => {
        const isHighlight = pkg.highlight ?? false;
        const priceLabel = `${pkg.currency}${pkg.price}`;
        const canBuy = isPayableTier(pkg, "one_time");
        return (
          <div key={pkg.name} className={`svc-price-card${isHighlight ? " svc-price-card--tint" : ""}`}>
            <div className="svc-price-top">
              <h3>{pkg.name}</h3>
              <span className={`svc-tag${isHighlight ? " svc-tag--ochre" : ""}`}>
                {isHighlight ? pkg.featuredBadge ?? "Most popular" : pkg.billingNote}
              </span>
            </div>
            {isHighlight && <p className="svc-price-desc">{pkg.billingNote}</p>}
            <div className="svc-price-row">
              <span className="svc-price-amount">{pkg.currency}{pkg.price}</span>
            </div>
            <ul className="svc-price-includes">
              {pkg.features.map((f) => {
                const isIncluded = typeof f.included === "string"
                  ? !f.included.startsWith("0")
                  : f.included;
                return (
                  <li key={f.label}>
                    <span className={`svc-check${isIncluded ? "" : " svc-check--no"}`}>{isIncluded ? "✓" : "–"}</span>
                    {typeof f.included === "string" ? `${f.label}: ${f.included}` : f.label}
                  </li>
                );
              })}
            </ul>
            {canBuy ? (
              <Link
                href={checkoutHref(market, subCategoryId, pkg.name, pkg.name, priceLabel)}
                className="svc-btn-primary svc-price-cta"
              >
                {pkg.cta}
              </Link>
            ) : (
              <a
                href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(`Partnership Enquiry — ${pkg.name}`)}`}
                className="svc-btn-primary svc-price-cta"
              >
                {pkg.cta}
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default async function PartnershipSubPage({
  params,
}: {
  params: Promise<{ market: string; sub: string }>;
}) {
  const { market, sub } = await params;

  if (!VALID_MARKETS.includes(market)) redirect("/services");

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

  const cat = getPartnershipCategory(market, sub);
  if (!cat) notFound();

  const content = cat.page;
  const otherCategories = getPartnershipCategories(market).filter((c) => c.id !== sub);

  const emailSubject = encodeURIComponent(
    `Partnership Enquiry — ${cat.label}`
  );

  return (
    <div className="svc-page">
      <main>

        {/* Breadcrumb */}
        <div className="svc-wrap svc-crumb">
          <Link href="/services">Services</Link>
          <span className="svc-crumb-sep">/</span>
          <Link href={`/services/${market}/partnership`}>Media Partnership</Link>
          <span className="svc-crumb-sep">/</span>
          <span className="svc-crumb-current">{cat.label}</span>
        </div>

        {/* Hero */}
        <section className="svc-wrap svc-detail-hero">
          <div className="svc-detail-hero-main">
            <h1 style={{ fontFamily: "var(--font-serif)", fontWeight: 500, fontSize: "clamp(32px, 4vw, 54px)", lineHeight: 1.08, margin: 0 }}>
              {content.headline}
            </h1>
            <p className="svc-detail-tagline">{content.tagline}</p>
            <div className="svc-hero-ctas">
              <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="svc-btn-primary">
                {content.ctaLabel ?? "Start a partnership →"}
              </a>
              {content.ctaSubtext && <span className="svc-cta-subtext">{content.ctaSubtext}</span>}
            </div>
          </div>
          <div className="svc-detail-hero-side">
            {content.intro.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="svc-wrap svc-section" id="how-it-works">
          <div className="svc-section-head">
            <h2 className="svc-section-title">From brief to published coverage.</h2>
          </div>
          <div className="svc-steps">
            {content.howItWorks.map((step) => (
              <div key={step.step} className="svc-step">
                <span className="svc-step-num">{step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Benefits */}
        <section className="svc-section svc-section--tint" id="benefits">
          <div className="svc-wrap">
            <div className="svc-section-head">
              <h2 className="svc-section-title">What you actually get.</h2>
            </div>
            <div className="svc-fgrid svc-fgrid--2">
              {content.benefits.map((benefit) => (
                <div key={benefit.title} className="svc-cell">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="svc-wrap svc-section" id="pricing">
          <div className="svc-section-head">
            <h2 className="svc-section-title">Three-month packages.</h2>
          </div>
          <TierGrid packages={cat.service.packages} market={market} subCategoryId={sub} />

          {cat.service.addOns && cat.service.addOns.length > 0 && (
            <div className="svc-addons">
              <p className="svc-addons-label">Add-ons</p>
              <div className="svc-fgrid svc-fgrid--3">
                {cat.service.addOns.map((addon) => (
                  <div key={addon.description} className="svc-cell svc-addon">
                    <span className="svc-cell-icon svc-addon-icon">{addon.icon}</span>
                    <span className="svc-addon-price">{addon.price}</span>
                    <p>{addon.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* FAQ */}
        <section className="svc-wrap svc-section" id="faq">
          <div className="svc-section-head">
            <h2 className="svc-section-title">Common questions.</h2>
          </div>
          <div className="svc-faq-list">
            {content.faqs.map((faq) => (
              <details key={faq.question} className="svc-faq-item">
                <summary>
                  {faq.question}
                  <span className="svc-faq-toggle" aria-hidden="true">+</span>
                </summary>
                <p className="svc-faq-answer">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="svc-wrap svc-section">
          <div className="svc-cta-inner">
            <div className="svc-cta-glow" />
            <div className="svc-cta-text">
              <h2>Let&rsquo;s build your media presence.</h2>
              <p>
                Tell us about your organisation, your upcoming programme, and what three months of coverage could look like.
              </p>
            </div>
            <a href={`mailto:hello@themoveee.com?subject=${emailSubject}`} className="svc-cta-btn">
              {content.ctaLabel ?? "Start a partnership →"}
            </a>
          </div>
        </section>

        {/* Other categories */}
        <section className="svc-wrap svc-section" style={{ paddingTop: 0 }}>
          <div className="svc-section-head">
            <h2 className="svc-section-title">Also in this programme.</h2>
          </div>
          <div className="svc-fgrid svc-fgrid-row svc-related">
            {otherCategories.map((c) => (
              <Link key={c.id} href={`/services/${market}/partnership/${c.id}`}>
                <span>{c.label}</span>
                <span>→</span>
              </Link>
            ))}
          </div>
        </section>

      </main>

      <div className="svc-wrap svc-foot">
        <span className="svc-foot-brand">The Moveee</span>
        <span className="svc-foot-note">Media services</span>
      </div>
    </div>
  );
}
