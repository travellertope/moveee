import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket } from "../../market-data";
import { PARTNERSHIP_CATEGORIES } from "../../partnership-pages";
import MarketNav from "../../components/MarketNav";

export function generateStaticParams() {
  return [{ market: "africa" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;
  const data = getMarket(market);
  if (!data) return { title: "Partnership Program | The Moveee" };
  return {
    title: `Partnership Program — ${data.name} | The Moveee`,
    description:
      "A sustained editorial partnership for African cultural organisations — book publishers, art galleries, and filmmakers.",
  };
}

export default async function PartnershipHubPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (market !== "africa") redirect("/services");

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

  return (
    <div className="market-shell">
      <MarketNav sections={marketData.sections} mode="page" market={market} />

      <main className="market-main">

        {/* Breadcrumb */}
        <nav className="slug-breadcrumb" aria-label="Breadcrumb">
          <Link href="/services">Services</Link>
          <span className="slug-breadcrumb-sep">›</span>
          <Link href={`/services/${market}`}>{marketData.name}</Link>
          <span className="slug-breadcrumb-sep">›</span>
          <span>Partnership Program</span>
        </nav>

        {/* Hero */}
        <section className="slug-hero">
          <p className="market-eyebrow">
            <span className="market-flag">{marketData.flag}</span> {marketData.name} · Partnership Program
          </p>
          <h1 className="slug-headline">
            For the Organisations That Carry African Culture Forward
          </h1>
          <p className="slug-tagline">
            A sustained editorial partnership for publishers, galleries, and filmmakers — not a one-off feature, but a media relationship built around your programme.
          </p>
          <div className="slug-intro">
            <p>
              Moveee Atelier is a three-month editorial partnership designed for African cultural organisations that need more than a press release. Book publishers need reviews that travel and interviews that build author profiles. Art galleries need critical coverage that ends up in press kits and grant applications. Filmmakers need a press record that works for festival submissions and distribution pitches.
            </p>
            <p>
              We cover all three. Same programme structure, tailored to each discipline: reviews, interviews, news releases, and social content — sustained over three months, renewable around your programme calendar.
            </p>
          </div>
        </section>

        {/* Category grid */}
        <section className="partnership-hub-section">
          <p className="section-eyebrow">Choose your category</p>
          <h2 className="slug-section-title">What does your organisation do?</h2>
          <div className="partnership-hub-grid">
            {PARTNERSHIP_CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/${market}/partnership/${cat.id}`}
                className="partnership-hub-card"
              >
                <span className="partnership-hub-icon">{cat.icon}</span>
                <h3 className="partnership-hub-name">{cat.label}</h3>
                <p className="partnership-hub-desc">{cat.description}</p>
                <p className="partnership-hub-tagline">{cat.tagline}</p>
                <span className="partnership-hub-arrow">View packages →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Shared what's included */}
        <section className="partnership-hub-included">
          <p className="section-eyebrow">All categories include</p>
          <h2 className="slug-section-title">What every partnership delivers.</h2>
          <div className="partnership-hub-features">
            {[
              { title: "Editorial Reviews", body: "Critical coverage written with genuine opinion and cultural context — not promotional summaries." },
              { title: "Profile Interviews", body: "In-depth interviews with authors, artists, or filmmakers. Written and edited for publication, not just transcribed." },
              { title: "News Releases", body: "Professionally written press releases for launches, events, milestones, and announcements." },
              { title: "GetMeLit Distribution", body: "All editorial content distributes through GetMeLit, our newsletter read by Nigerian and diaspora professionals across Lagos, Abuja, London, and New York." },
              { title: "Social Amplification", body: "Social posts across The Moveee's channels for every piece of published content. Multimedia posts on higher tiers." },
              { title: "Three-Month Partnership Window", body: "Enough time to cover a launch properly, sustain a programme, and build a meaningful media record." },
            ].map((f) => (
              <div key={f.title} className="partnership-hub-feature">
                <h4>{f.title}</h4>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="slug-bottom-cta">
          <p className="section-eyebrow">Not sure which fits?</p>
          <h2>Talk to us first.</h2>
          <p>
            If your organisation spans more than one category — a publisher with a filmmaker in residence, a gallery with a bookshop — we can discuss a bespoke arrangement.
          </p>
          <a
            href={`mailto:hello@themoveee.com?subject=${encodeURIComponent("Partnership Program Enquiry")}`}
            className="btn-primary-service"
          >
            Get in touch →
          </a>
        </section>

      </main>
    </div>
  );
}
