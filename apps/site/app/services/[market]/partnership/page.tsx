import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket } from "../../market-data";
import { getPartnershipCategories } from "../../partnership-pages";

const VALID_MARKETS = ["africa", "uk", "us"];

const HUB_COPY: Record<
  string,
  { headline: string; lead: string; body: string; cities: string }
> = {
  africa: {
    headline: "For the organisations that carry African culture forward.",
    lead: "A sustained editorial partnership for publishers, galleries, and filmmakers — not a one-off feature, but a media relationship built around your programme.",
    body: "The Moveee media partnership is a three-month editorial programme designed for African cultural organisations that need more than a press release. Book publishers need reviews that travel and interviews that build author profiles. Art galleries need critical coverage that ends up in press kits and grant applications. Filmmakers need a press record that works for festival submissions and distribution pitches. We cover all three — same programme structure, tailored to each discipline, sustained over three months and renewable around your programme calendar.",
    cities: "Lagos, Abuja, London, and New York",
  },
  uk: {
    headline: "For the organisations that carry British culture forward.",
    lead: "A three-month editorial partnership for publishers, galleries, and filmmakers — not a one-off feature, but a media relationship built around your programme.",
    body: "The Moveee media partnership is a three-month editorial package designed for UK cultural organisations that need more than a press release. Publishers and authors need a review and an interview that build a real author profile. Galleries need critical coverage that ends up in press kits and funding applications. Filmmakers need a press record that works for festival submissions and distribution pitches. We cover all three — same package structure, tailored to each discipline.",
    cities: "London, Birmingham, Manchester, and Bristol",
  },
  us: {
    headline: "For the organisations that carry American culture forward.",
    lead: "A three-month editorial partnership for publishers, galleries, and filmmakers — not a one-off feature, but a media relationship built around your programme.",
    body: "The Moveee media partnership is a three-month editorial package designed for US cultural organisations that need more than a press release. Publishers and authors need a review and an interview that build a real author profile. Galleries need critical coverage that ends up in press kits and funding applications. Filmmakers need a press record that works for festival submissions and distribution pitches. We cover all three — same package structure, tailored to each discipline.",
    cities: "New York, Atlanta, Houston, DC, and LA",
  },
};

export function generateStaticParams() {
  return VALID_MARKETS.map((market) => ({ market }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;
  const data = getMarket(market);
  if (!data) return { title: { absolute: "Media Partnership | Moveee" } };
  const copy = HUB_COPY[market] ?? HUB_COPY.africa;
  return {
    title: { absolute: `Media Partnership | Moveee` },
    description: copy.lead,
  };
}

export default async function PartnershipHubPage({
  params,
}: {
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (!VALID_MARKETS.includes(market)) redirect("/services");

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

  const copy = HUB_COPY[market] ?? HUB_COPY.africa;
  const categories = getPartnershipCategories(market);

  return (
    <div className="svc-page">
      <main>

        {/* Breadcrumb */}
        <div className="svc-wrap svc-crumb">
          <Link href="/services">Services</Link>
          <span className="svc-crumb-sep">/</span>
          <span className="svc-crumb-current">Media Partnership</span>
        </div>

        {/* Hero */}
        <section className="svc-wrap svc-hero" style={{ padding: "8px 0 72px" }}>
          <h1 style={{ fontSize: "clamp(32px, 4vw, 54px)" }}>
            {copy.headline}
          </h1>
          <p className="svc-hero-lead" style={{ maxWidth: 720 }}>
            {copy.lead}
          </p>
          <p className="svc-detail-tagline" style={{ maxWidth: 720 }}>
            {copy.body}
          </p>
        </section>

        {/* Category grid */}
        <section className="svc-wrap svc-section" style={{ paddingTop: 0 }}>
          <div className="svc-section-head">
            <h2 className="svc-section-title">What does your organisation do?</h2>
          </div>
          <div className="svc-fgrid svc-fgrid--auto">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/services/${market}/partnership/${cat.id}`}
                className="svc-cell"
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <span className="svc-cell-icon">{cat.icon}</span>
                <h3>{cat.label}</h3>
                <p className="svc-cell-flex">{cat.description}</p>
                <p className="svc-cell-tagline">{cat.tagline}</p>
                <span className="svc-cell-more">View packages →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Shared what's included */}
        <section className="svc-section svc-section--tint">
          <div className="svc-wrap">
            <div className="svc-section-head">
              <h2 className="svc-section-title">What every partnership delivers.</h2>
            </div>
            <div className="svc-fgrid svc-fgrid--3">
              {[
                { title: "Editorial Reviews", body: "Critical coverage written with genuine opinion and cultural context — not promotional summaries." },
                { title: "Profile Interviews", body: "In-depth interviews with authors, artists, or filmmakers. Written and edited for publication, not just transcribed." },
                { title: "News Releases", body: "Professionally written press releases for launches, events, milestones, and announcements." },
                { title: "GetMeLit Distribution", body: `All editorial content distributes through GetMeLit, our newsletter read by professionals across ${copy.cities}.` },
                { title: "Social Amplification", body: "Social posts across Moveee's channels for every piece of published content. Multimedia posts on higher tiers." },
                { title: "Three-Month Partnership Window", body: "Enough time to cover a launch properly, sustain a programme, and build a meaningful media record." },
              ].map((f) => (
                <div key={f.title} className="svc-cell">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="svc-wrap svc-section" id="faq">
          <div className="svc-section-head">
            <h2 className="svc-section-title">Worth clarifying.</h2>
          </div>
          <div className="svc-faq-list">
            <details className="svc-faq-item">
              <summary>
                What if I only have one event — an opening night, a book launch, or a film premiere?
                <span className="svc-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p className="svc-faq-answer">A single event is better served by our Events &amp; Travel partnership. Media Partnership is designed for organisations with an ongoing programme — a gallery's quarterly exhibition calendar, a publisher's seasonal title slate, a filmmaker's release and festival circuit. If your need is a one-off moment rather than a sustained relationship, talk to us about Happenings instead.</p>
            </details>
            <details className="svc-faq-item">
              <summary>
                How is Media Partnership different from Sponsored Content?
                <span className="svc-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p className="svc-faq-answer">Sponsored Content is for brands commissioning a feature about their product or service — it is brand-initiated, commercially framed, and clearly labelled as such. Media Partnership is for cultural organisations whose work we cover editorially over three months. The coverage is genuine criticism, not branded content. Publishers, galleries, and filmmakers are cultural producers, not brands buying advertising.</p>
            </details>
            <details className="svc-faq-item">
              <summary>
                My organisation spans more than one category — a gallery with a film programme, a publisher that also runs events.
                <span className="svc-faq-toggle" aria-hidden="true">+</span>
              </summary>
              <p className="svc-faq-answer">Choose the category that best describes your primary programme, or contact us to discuss a bespoke arrangement. We can build a package that covers multiple disciplines where the breadth genuinely warrants it.</p>
            </details>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="svc-wrap svc-section">
          <div className="svc-cta-inner">
            <div className="svc-cta-glow" />
            <div className="svc-cta-text">
              <h2>Not sure which fits? Talk to us first.</h2>
              <p>
                If your organisation spans more than one category — a publisher with a filmmaker in residence, a gallery with a bookshop — we can discuss a bespoke arrangement.
              </p>
            </div>
            <a
              href={`mailto:hello@themoveee.com?subject=${encodeURIComponent("Media Partnership Enquiry")}`}
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
