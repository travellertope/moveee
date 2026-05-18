import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { getService, SERVICES } from "../services-data";
import { PackagePrice, AddOnPrice } from "../components/PriceDisplay";

export async function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return { title: "Service Not Found | The Moveee" };
  return {
    title: `${service.name} — ${service.eyebrow} | The Moveee`,
    description: service.tagline,
  };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) notFound();

  return (
    <article className="service-page">

      {/* ── HERO ── */}
      <section className="service-hero">
        <p className="service-eyebrow">{service.eyebrow}</p>
        <h1 className="service-headline">{service.headline}</h1>
        <p className="service-tagline">{service.tagline}</p>
        <div className="service-intro">
          {service.intro.map((p, i) => <p key={i}>{p}</p>)}
        </div>
        <a href={`mailto:${service.ctaEmail}`} className="btn-primary-service">
          Get started →
        </a>
      </section>

      {/* ── BENEFITS ── */}
      {service.benefits && service.benefits.length > 0 && (
        <section className="benefits-section">
          <div className="benefits-grid">
            {service.benefits.map((b, i) => (
              <div key={i} className="benefit-card">
                <div className="benefit-num">0{i + 1}</div>
                <h3 className="benefit-title">{b.title}</h3>
                <p className="benefit-body">{b.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── RATE CARD ── */}
      <section className="rate-card-section">
        <p className="section-eyebrow">Rate Card</p>
        <div className={`rate-card-grid cols-${service.packages.length}`}>
          {service.packages.map((pkg, i) => (
            <div key={i} className={`rate-card ${pkg.highlight ? "rate-card--highlight" : ""}`}>
              <div className="rate-card-header">
                <h3>{pkg.name}</h3>
                <span className="rate-card-billing">{pkg.billingNote}</span>
              </div>
              <PackagePrice
                priceNGN={pkg.priceNGN}
                priceUSD={pkg.priceUSD}
                unit={pkg.unit}
              />
              <ul className="rate-card-features">
                {pkg.features.map((f, fi) => {
                  const isString = typeof f.included === "string";
                  const isBool = typeof f.included === "boolean";
                  const included = isBool ? f.included : true;
                  const excluded = isBool && !f.included;
                  return (
                    <li key={fi} className={`feature-item ${excluded ? "feature-item--no" : "feature-item--yes"}`}>
                      <span className="feature-icon">{excluded ? "✕" : "✓"}</span>
                      <span className="feature-label">
                        {isString && <strong className="feature-qty">{f.included as string} </strong>}
                        {f.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="rate-card-ctas">
                <a href={`mailto:${service.ctaEmail}?subject=${encodeURIComponent(`${service.name} — ${pkg.name}`)}`}
                   className="btn-rate-primary">
                  {pkg.cta}
                </a>
                {pkg.ctaSecondary && (
                  <a href={`mailto:${service.ctaEmail}?subject=${encodeURIComponent(`${service.name} — ${pkg.name} Monthly`)}`}
                     className="btn-rate-secondary">
                    {pkg.ctaSecondary}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ADD-ONS ── */}
      {service.addOns && service.addOns.length > 0 && (
        <section className="addons-section">
          <p className="section-eyebrow">Add-Ons</p>
          <div className="addons-grid">
            {service.addOns.map((addon, i) => (
              <div key={i} className="addon-card">
                <div className="addon-icon">{addon.icon}</div>
                <AddOnPrice priceNGN={addon.priceNGN} priceUSD={addon.priceUSD} />
                <p className="addon-desc">{addon.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ── */}
      {service.faqs && service.faqs.length > 0 && (
        <section className="faq-section">
          <p className="section-eyebrow">Frequently Asked Questions</p>
          <div className="faq-list">
            {service.faqs.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary className="faq-question">{faq.question}</summary>
                <p className="faq-answer">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* ── BOTTOM CTA ── */}
      <section className="service-bottom-cta">
        <p className="section-eyebrow">Ready to amplify?</p>
        <h2>Let's put your story in front of the right people.</h2>
        <a href={`mailto:${service.ctaEmail}?subject=${encodeURIComponent(`${service.name} Enquiry`)}`}
           className="btn-primary-service">
          Contact us →
        </a>
        <p className="service-bottom-nav">
          Explore other services:{" "}
          {SERVICES.filter((s) => s.slug !== service.slug).map((s, i, arr) => (
            <span key={s.slug}>
              <Link href={`/services/${s.slug}`}>{s.name}</Link>
              {i < arr.length - 1 && " · "}
            </span>
          ))}
        </p>
      </section>

    </article>
  );
}
