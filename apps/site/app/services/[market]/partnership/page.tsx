import Link from "next/link";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { getMarket } from "../../market-data";
import { PARTNERSHIP_CATEGORIES } from "../../partnership-pages";
import { ServiceSectionDetail, getServiceSectionMetadata } from "../[slug]/page";

const VALID_MARKETS = ["africa", "uk", "us"];

export function generateStaticParams() {
  return VALID_MARKETS.map((market) => ({ market }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ market: string }>;
}): Promise<Metadata> {
  const { market } = await params;

  // Only Africa has the richer, discipline-by-discipline Partnership Hub
  // below — UK/US have a single "Media Partnership" section instead (see
  // the routing note further down), so their metadata comes from the same
  // place [slug]/page.tsx already uses for every other section.
  if (market !== "africa") return getServiceSectionMetadata(market, "partnership");

  const data = getMarket(market);
  if (!data) return { title: { absolute: "Media Partnership | Moveee" } };
  return {
    title: { absolute: `Media Partnership | Moveee` },
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
  if (!VALID_MARKETS.includes(market)) redirect("/services");

  // The Africa-only, per-discipline Partnership Hub below (Publishers /
  // Galleries / Filmmakers, each with its own 3-month tiered packages) has
  // no UK/US equivalent in the data — those two markets each have one
  // plain "Media Partnership" section instead (market-data.ts). This
  // folder (`partnership/`) is a literal, static route segment, so it
  // always wins the URL match over the sibling `[slug]/` dynamic route,
  // for every market — without this branch, a UK/US visitor hitting
  // /services/{market}/partnership would 404 (or be redirected away)
  // rather than ever reaching their market's real "partnership" section
  // content, even though that content exists. Render it directly here.
  if (market !== "africa") {
    return <ServiceSectionDetail market={market} slug="partnership" />;
  }

  const marketData = getMarket(market);
  if (!marketData) redirect("/services");

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
            For the organisations that carry African culture forward.
          </h1>
          <p className="svc-hero-lead" style={{ maxWidth: 720 }}>
            A sustained editorial partnership for publishers, galleries, and filmmakers — not a one-off feature, but a media relationship built around your programme.
          </p>
          <p className="svc-detail-tagline" style={{ maxWidth: 720 }}>
            The Moveee media partnership is a three-month editorial programme designed for African cultural organisations that need more than a press release. Book publishers need reviews that travel and interviews that build author profiles. Art galleries need critical coverage that ends up in press kits and grant applications. Filmmakers need a press record that works for festival submissions and distribution pitches. We cover all three — same programme structure, tailored to each discipline, sustained over three months and renewable around your programme calendar.
          </p>
        </section>

        {/* Category grid */}
        <section className="svc-wrap svc-section" style={{ paddingTop: 0 }}>
          <div className="svc-section-head">
            <h2 className="svc-section-title">What does your organisation do?</h2>
          </div>
          <div className="svc-fgrid svc-fgrid--auto">
            {PARTNERSHIP_CATEGORIES.map((cat) => (
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
                { title: "GetMeLit Distribution", body: "All editorial content distributes through GetMeLit, our newsletter read by professionals across Lagos, Abuja, London, and New York." },
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
