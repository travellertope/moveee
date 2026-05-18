import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket, MARKETS, CONNECT_BAR, Section, RateCard, TierService } from "../market-data";
import MarketNav from "../components/MarketNav";

const VALID_MARKETS = ["africa", "uk", "us"];

export function generateStaticParams() {
  return VALID_MARKETS.map((id) => ({ market: id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;
  const data = getMarket(market);
  if (!data) return { title: "Services | The Moveee" };
  return {
    title: `${data.name} — Media Services | The Moveee`,
    description: data.tagline,
  };
}

// ── Card section ──────────────────────────────────────────────────────────────

function CardGrid({ cards }: { cards: RateCard[] }) {
  return (
    <div className="market-cards-grid">
      {cards.map((card, i) => (
        <div key={i} className={`market-card ${card.featured ? "market-card--featured" : ""}`}>
          <div className="market-card-top">
            <div className="market-card-tags">
              <span className="market-card-tag">{card.tagLabel}</span>
              {card.featured && card.featuredBadge && (
                <span className="market-card-badge">{card.featuredBadge}</span>
              )}
            </div>
            <h3 className="market-card-name">{card.name}</h3>
            <p className="market-card-desc">{card.description}</p>
          </div>
          <div className="market-card-body">
            <div className="market-card-price">
              <span className="market-card-price-amount">{card.price}</span>
              <span className="market-card-price-note">{card.priceNote}</span>
            </div>
            <ul className="market-card-includes">
              {card.includes.map((item, ii) => (
                <li key={ii}>{item}</li>
              ))}
            </ul>
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(card.name + " Enquiry")}`}
              className="btn-market-card"
            >
              Enquire →
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tier section ─────────────────────────────────────────────────────────────

function TierGrid({ service }: { service: TierService }) {
  return (
    <div className="tier-section">
      <p className="tier-service-desc">{service.description}</p>
      <div className={`rate-card-grid cols-${service.packages.length}`}>
        {service.packages.map((pkg, i) => {
          const isExcluded = (val: boolean | string) => typeof val === "boolean" && !val;
          return (
            <div key={i} className={`rate-card ${pkg.highlight ? "rate-card--highlight" : ""}`}>
              {pkg.highlight && pkg.featuredBadge && (
                <div className="rate-card-badge-strip">{pkg.featuredBadge}</div>
              )}
              <div className="rate-card-header">
                <h3>{pkg.name}</h3>
                <span className="rate-card-billing">{pkg.billingNote}</span>
              </div>
              <div className="rate-card-price">
                <span className="price-currency">{pkg.currency}</span>
                <span className="price-amount">{pkg.price}</span>
                {pkg.unit && <span className="price-unit">{pkg.unit}</span>}
              </div>
              <ul className="rate-card-features">
                {pkg.features.map((f, fi) => {
                  const isString = typeof f.included === "string";
                  const excluded = isExcluded(f.included as boolean | string);
                  return (
                    <li key={fi} className={`feature-item ${excluded ? "feature-item--no" : "feature-item--yes"}`}>
                      <span className="feature-icon">{excluded ? "✕" : "✓"}</span>
                      <span className="feature-label">
                        {isString && (
                          <strong className="feature-qty">{f.included as string} </strong>
                        )}
                        {f.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="rate-card-ctas">
                <a
                  href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(service.name + " — " + pkg.name)}`}
                  className="btn-rate-primary"
                >
                  {pkg.cta}
                </a>
                {pkg.ctaSecondary && (
                  <a
                    href={`mailto:hello@themoveee.com?subject=${encodeURIComponent(service.name + " — " + pkg.name + " Monthly")}`}
                    className="btn-rate-secondary"
                  >
                    {pkg.ctaSecondary}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {service.addOns && service.addOns.length > 0 && (
        <div className="tier-addons">
          <p className="tier-addons-label">Add-Ons</p>
          <div className="addons-grid">
            {service.addOns.map((addon, i) => (
              <div key={i} className="addon-card">
                <div className="addon-icon">{addon.icon}</div>
                <p className="addon-price">{addon.price}</p>
                <p className="addon-desc">{addon.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Market section ────────────────────────────────────────────────────────────

function MarketSection({ section }: { section: Section }) {
  return (
    <section id={section.id} className="market-section">
      <div className="market-section-header">
        <p className="section-eyebrow">{section.label}</p>
      </div>
      {section.kind === "cards" ? (
        <CardGrid cards={section.cards} />
      ) : (
        <TierGrid service={section.service} />
      )}
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function MarketPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (!VALID_MARKETS.includes(market)) redirect("/services");

  const data = getMarket(market);
  if (!data) redirect("/services");

  return (
    <div className="market-shell">
      <MarketNav sections={data.sections} />

      <main className="market-main">

        {/* Hero */}
        <section className="market-hero">
          <p className="market-eyebrow">
            <span className="market-flag">{data.flag}</span> {data.name}
          </p>
          <h1 className="market-headline">
            Get seen by the people who <em>matter</em>.
          </h1>
          <p className="market-intro">{data.tagline}</p>
          <a href="mailto:hello@themoveee.com" className="btn-primary-service">
            Talk to us →
          </a>
        </section>

        {/* All sections */}
        {data.sections.map((section) => (
          <MarketSection key={section.id} section={section} />
        ))}

        {/* Connect bar */}
        <section className="connect-bar">
          <div className="connect-bar-inner">
            <div className="connect-bar-text">
              <p className="connect-bar-title">{CONNECT_BAR.title}</p>
              <p className="connect-bar-desc">{CONNECT_BAR.description}</p>
            </div>
            <div className="connect-bar-price-block">
              <p className="connect-bar-price">{CONNECT_BAR.price}</p>
              <p className="connect-bar-price-note">{CONNECT_BAR.priceNote}</p>
              <a
                href={`mailto:hello@themoveee.com?subject=${encodeURIComponent("Moveee Connect Sponsorship Enquiry")}`}
                className="btn-primary-service"
              >
                Enquire →
              </a>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="market-bottom-cta">
          <p className="section-eyebrow">Bespoke packages</p>
          <h2>Need something tailored?</h2>
          <p>
            If none of the standard packages fit your brief, we can build a custom
            visibility plan around your goals, timeline, and budget.
          </p>
          <a
            href={`mailto:hello@themoveee.com?subject=${encodeURIComponent("Bespoke Package Enquiry — " + data.name)}`}
            className="btn-primary-service"
          >
            Get in touch →
          </a>
        </section>

      </main>
    </div>
  );
}
