import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket } from "../market-data";

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
  if (!data) return { title: { absolute: "Media Services | Moveee" } };
  return {
    title: { absolute: `Media Services | Moveee` },
    description: data.tagline,
  };
}

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
    <div className="svc-page">
      <main>

        {/* Hero */}
        <section className="svc-wrap svc-hero svc-hero--first">
          <h1>
            Get seen by the people who <em>matter</em>.
          </h1>
          <p className="svc-hero-lead">{data.tagline}</p>
          <div className="svc-hero-ctas">
            <a href="mailto:hello@themoveee.com" className="svc-btn-primary">Talk to us →</a>
            <a href="#services" className="svc-btn-ghost">See pricing</a>
          </div>
        </section>

        {/* Trust strip */}
        <div className="svc-wrap svc-trust">
          <span className="svc-trust-item">{data.sections.length} services</span>
          <span className="svc-trust-dot" />
          <span className="svc-trust-item">Transparent, flat pricing</span>
          <span className="svc-trust-dot" />
          <span className="svc-trust-item">48-hour response time</span>
        </div>

        {/* Services overview grid */}
        <section className="svc-wrap svc-section" id="services">
          <div className="svc-section-head">
            <h2 className="svc-section-title">
              {data.sections.length} ways to reach the culture.
            </h2>
            <a href="mailto:hello@themoveee.com" className="svc-section-more">Need a bespoke package? →</a>
          </div>

          <div className="svc-fgrid svc-fgrid--3">
            {data.sections.map((section, i) => {
              const firstPrice =
                section.kind === "cards"
                  ? section.cards[0]?.price
                  : section.kind === "tiers"
                  ? `${section.service.packages[0]?.currency}${section.service.packages[0]?.price}`
                  : section.cards[0]?.price;

              return (
                <Link
                  key={section.id}
                  href={`/services/${market}/${section.id}`}
                  className="svc-card"
                >
                  <span className="svc-card-num">{String(i + 1).padStart(2, "0")}</span>
                  <h3 className="svc-card-name">{section.label}</h3>
                  {section.audience && <p className="svc-card-audience">{section.audience}</p>}
                  <div className="svc-card-foot">
                    <span className="svc-card-price">From {firstPrice}</span>
                    <span className="svc-card-arrow">View service →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Pull quote */}
        <section className="svc-section svc-section--tint">
          <div className="svc-wrap svc-quote">
            <span className="svc-quote-mark">&#8220;</span>
            <p className="svc-quote-text">
              We don&rsquo;t sell impressions. We introduce your brand to a community that already trusts our editorial judgement &mdash; and that trust does the selling for you.
            </p>
            <div className="svc-quote-attr">
              <span className="svc-quote-rule" />
              <span className="svc-quote-name">Moveee Editorial Team</span>
              <span className="svc-quote-rule" />
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="svc-wrap svc-section">
          <div className="svc-cta-inner">
            <div className="svc-cta-glow" />
            <div className="svc-cta-text">
              <h2>Need something tailored?</h2>
              <p>
                If none of the standard packages fit your brief, we can build a custom
                visibility plan around your goals, timeline, and budget.
              </p>
            </div>
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent("Bespoke Package Enquiry")}`}
              className="svc-cta-btn"
            >
              Get in touch →
            </a>
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
