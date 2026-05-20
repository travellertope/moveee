import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket } from "../market-data";
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

const SECTION_ICONS: Record<string, string> = {
  editorial: "◈",
  amplify: "◉",
  lifestyle: "◉",
  presskit: "◎",
  partnership: "◆",
  events: "◇",
  connect: "⬡",
};

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
      <MarketNav sections={data.sections} mode="page" market={market} />

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

        {/* Services overview grid */}
        <section className="market-overview-grid-section">
          <p className="section-eyebrow">Services</p>
          <div className="market-overview-grid">
            {data.sections.map((section) => {
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
                  className="market-overview-card"
                >
                  <span className="market-overview-icon">
                    {SECTION_ICONS[section.id] ?? "◈"}
                  </span>
                  <h2 className="market-overview-name">{section.label}</h2>
                  {section.audience && (
                    <p className="market-overview-audience">{section.audience}</p>
                  )}
                  <p className="market-overview-price">From {firstPrice}</p>
                  <span className="market-overview-arrow">View service →</span>
                </Link>
              );
            })}
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
