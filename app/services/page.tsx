import Link from "next/link";
import { Metadata } from "next";
import { SERVICES } from "./services-data";

export const metadata: Metadata = {
  title: "Services | The Moveee",
  description: "Media amplification, PR, and brand visibility services from The Moveee — designed to get your story seen.",
};

const SERVICE_ICONS: Record<string, string> = {
  amplify: "◈",
  presskit: "◉",
  "book-publishers": "◎",
};

export default function ServicesPage() {
  return (
    <div className="services-index">
      {/* Hero */}
      <section className="services-index-hero">
        <p className="services-index-eyebrow">The Moveee · Media Services</p>
        <h1 className="services-index-headline">
          Visibility, reach, and <em>credibility</em> — built for culture makers.
        </h1>
        <p className="services-index-sub">
          From social amplification to newspaper placements, every service is designed to put the right story in front of the right people.
        </p>
      </section>

      {/* Services grid */}
      <section className="services-index-grid">
        {SERVICES.map((service) => {
          const lowestPrice = service.packages[0].price;
          const highestPrice = service.packages[service.packages.length - 1].price;
          return (
            <Link key={service.slug} href={`/services/${service.slug}`} className="service-card">
              <div className="service-card-icon">{SERVICE_ICONS[service.slug] || "◈"}</div>
              <p className="service-card-eyebrow">{service.eyebrow}</p>
              <h2 className="service-card-name">{service.name}</h2>
              <p className="service-card-tagline">{service.tagline}</p>
              <div className="service-card-footer">
                <span className="service-card-price">
                  From {service.packages[0].currency}{lowestPrice}
                  {lowestPrice !== highestPrice && ` — ${service.packages[service.packages.length - 1].currency}${highestPrice}`}
                </span>
                <span className="service-card-arrow">View rates →</span>
              </div>
            </Link>
          );
        })}
      </section>

      {/* Bottom CTA */}
      <section className="services-index-contact">
        <p className="services-index-contact-label">Bespoke packages</p>
        <h2>Need something tailored?</h2>
        <p>If none of the standard packages fit your brief, we can build a custom visibility plan around your goals, timeline, and budget.</p>
        <a href="mailto:hello@themoveee.com" className="btn-primary-service">
          Get in touch →
        </a>
      </section>
    </div>
  );
}
