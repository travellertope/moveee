import Link from "next/link";
import "@/app/legal.css";

export const metadata = {
  title: "Contact Us · The Moveee",
  description: "Get in touch with The Moveee editorial, partnerships, events, and community teams.",
};

export default function ContactPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">Company</div>
      <h1>Get in <em>Touch</em></h1>
      <p className="legal-meta">Lagos · London · Accra · New York</p>

      <div className="legal-body">
        <p>
          We are a small, independent editorial team operating across four cities. Whether you have
          a story pitch, a partnership idea, a press enquiry, or just want to say hello — we want to
          hear from you. Use the contacts below to reach the right team directly.
        </p>

        <h2>Editorial</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-label">Pitches & Commissions</div>
            <h3>Editorial Team</h3>
            <p>Story pitches, essay proposals, photo essays, and contributor enquiries for the magazine.</p>
            <a href="mailto:editorial@themoveee.com">editorial@themoveee.com</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-label">Corrections & Feedback</div>
            <h3>Reader Relations</h3>
            <p>Factual corrections, editorial feedback, and reader responses to published work.</p>
            <a href="mailto:letters@themoveee.com">letters@themoveee.com</a>
          </div>
        </div>

        <h2>Partnerships & Advertising</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-label">Brand Partnerships</div>
            <h3>Commercial Team</h3>
            <p>Sponsorships, branded content, advertising, and co-production opportunities.</p>
            <a href="mailto:partnerships@themoveee.com">partnerships@themoveee.com</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-label">Shop & Vetted Makers</div>
            <h3>Commerce</h3>
            <p>For independent makers and brands interested in being stocked or featured in The Moveee Shop.</p>
            <a href="mailto:shop@themoveee.com">shop@themoveee.com</a>
          </div>
        </div>

        <h2>Events & Origins</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-label">Events</div>
            <h3>Events Team</h3>
            <p>Cultural events, screenings, talks, and community gatherings. Venue and production partnerships welcome.</p>
            <a href="mailto:events@themoveee.com">events@themoveee.com</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-label">Travel & Journeys</div>
            <h3>Origins</h3>
            <p>Cultural travel, origins programmes, and destination partnerships across the continent and diaspora.</p>
            <a href="mailto:origins@themoveee.com">origins@themoveee.com</a>
          </div>
        </div>

        <h2>Press & Media</h2>
        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-label">Press</div>
            <h3>Media Enquiries</h3>
            <p>Interview requests, press accreditation, and media relations for journalists and broadcasters.</p>
            <a href="mailto:press@themoveee.com">press@themoveee.com</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-label">General</div>
            <h3>Everything Else</h3>
            <p>General enquiries, technical issues, and anything that doesn't fit neatly elsewhere.</p>
            <a href="mailto:hello@themoveee.com">hello@themoveee.com</a>
          </div>
        </div>

        <hr className="legal-divider" />

        <h2>Data & Privacy</h2>
        <p>
          For privacy-related enquiries, data subject access requests, or to exercise your rights
          under UK GDPR, please contact{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a>. See our{" "}
          <Link href="/privacy">Privacy Policy</Link> for full details.
        </p>

        <h2>Response Times</h2>
        <p>
          We aim to respond to all enquiries within <strong>3–5 working days</strong>. Editorial
          pitches are reviewed on a rolling basis — if your pitch is a strong fit we will be in touch,
          but volume prevents us from responding to every submission individually.
        </p>
        <p>
          For urgent press or broadcast enquiries, please mark your subject line{" "}
          <strong>URGENT — PRESS</strong>.
        </p>
      </div>
    </div>
  );
}
