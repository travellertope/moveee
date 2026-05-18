import Link from "next/link";
import { SERVICES } from "./services-data";
import "./services.css";

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="services-shell">
      {/* Left sidebar nav */}
      <aside className="services-sidenav">
        <div className="sidenav-inner">
          <p className="sidenav-label">Our Services</p>
          <nav>
            {SERVICES.map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}`} className="sidenav-link">
                <span className="sidenav-link-name">{s.name}</span>
                <span className="sidenav-link-eyebrow">{s.eyebrow}</span>
              </Link>
            ))}
          </nav>
          <div className="sidenav-cta">
            <p>Not sure which service is right for you?</p>
            <a href="mailto:hello@themoveee.com" className="sidenav-cta-link">
              Talk to us →
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="services-main">{children}</div>
    </div>
  );
}
