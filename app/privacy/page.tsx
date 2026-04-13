import Link from "next/link";
import "@/app/legal.css";

export const metadata = {
  title: "Privacy Policy · The Moveee",
  description: "How The Moveee collects, uses, and protects your personal data.",
};

export default function PrivacyPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">Company · Legal</div>
      <h1>Privacy <em>Policy</em></h1>
      <p className="legal-meta">Last updated: April 2026 &nbsp;·&nbsp; Moveee Media Ltd</p>

      <div className="legal-body">
        <p>
          Moveee Media Ltd ("<strong>The Moveee</strong>", "we", "us", "our") is committed to protecting
          your privacy. This policy explains what personal data we collect, how we use it, and your
          rights in relation to it. It applies to all users of <strong>themoveee.com</strong> and any
          associated services, newsletters, events, and community platforms.
        </p>
        <p>
          By using our site or subscribing to any of our services, you agree to the collection and
          use of information in accordance with this policy.
        </p>

        <h2>1. Information We Collect</h2>
        <h3>Information you give us directly</h3>
        <ul>
          <li><strong>Newsletter registration</strong> — your email address when you subscribe to our weekly dispatch or any editorial series.</li>
          <li><strong>Community membership</strong> — name, email, and profile information when you join The Moveee Connect community.</li>
          <li><strong>Shop & orders</strong> — billing and shipping address, payment details (processed securely by our payment provider; we do not store card data), and order history.</li>
          <li><strong>Events</strong> — name, contact details, and any accessibility or dietary preferences submitted during event registration.</li>
          <li><strong>Contact forms</strong> — any information you voluntarily provide when reaching out to us.</li>
        </ul>

        <h3>Information collected automatically</h3>
        <ul>
          <li><strong>Usage data</strong> — pages visited, time on site, referring URLs, device type, browser, and operating system, collected via Google Analytics and similar tools.</li>
          <li><strong>Cookies</strong> — session and persistent cookies used to maintain your preferences and improve site performance. See our <Link href="/cookie-policy">Cookie Policy</Link> for full details.</li>
          <li><strong>IP address</strong> — used for security, fraud prevention, and aggregated geographic reporting.</li>
        </ul>

        <hr className="legal-divider" />

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To deliver newsletters, editorial series, and event communications you have opted into.</li>
          <li>To process shop orders and manage your purchases and returns.</li>
          <li>To personalise your experience on site and surface relevant content.</li>
          <li>To analyse site usage and improve the quality of our editorial and platform.</li>
          <li>To comply with legal obligations and prevent fraud or misuse.</li>
          <li>To respond to enquiries, feedback, and customer service requests.</li>
        </ul>
        <p>
          We will not sell, rent, or trade your personal data to third parties for their own marketing
          purposes.
        </p>

        <hr className="legal-divider" />

        <h2>3. Legal Basis for Processing (UK & EU Users)</h2>
        <p>
          Where the UK GDPR or EU GDPR applies, we process your data on the following lawful bases:
        </p>
        <ul>
          <li><strong>Consent</strong> — for newsletters and optional communications (you may withdraw at any time).</li>
          <li><strong>Contract</strong> — to fulfil orders and membership obligations.</li>
          <li><strong>Legitimate interests</strong> — for site analytics, fraud prevention, and service improvement, balanced against your rights.</li>
          <li><strong>Legal obligation</strong> — where required by law.</li>
        </ul>

        <hr className="legal-divider" />

        <h2>4. Sharing Your Data</h2>
        <p>We may share your information with trusted third-party service providers who assist us in operating our platform, including:</p>
        <ul>
          <li><strong>Email delivery platforms</strong> (e.g. Mailchimp, Klaviyo) — for newsletter dispatch.</li>
          <li><strong>Analytics providers</strong> (e.g. Google Analytics) — for aggregated site usage reporting.</li>
          <li><strong>Payment processors</strong> (e.g. Stripe) — for secure transaction handling.</li>
          <li><strong>Event platforms</strong> — for ticket management and guest communications.</li>
          <li><strong>Hosting and infrastructure providers</strong> — for secure data storage and platform operation.</li>
        </ul>
        <p>
          All third-party processors are contractually required to handle your data in compliance with
          applicable data protection laws and only for the purposes we specify.
        </p>

        <hr className="legal-divider" />

        <h2>5. International Transfers</h2>
        <p>
          The Moveee operates across Lagos, London, Accra, and New York. Your data may be processed
          in countries outside the UK or EEA. Where this occurs, we ensure appropriate safeguards are
          in place (such as Standard Contractual Clauses) to protect your information.
        </p>

        <hr className="legal-divider" />

        <h2>6. Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary for the purposes set out in this
          policy, or as required by law. Newsletter subscriber data is retained until you unsubscribe.
          Order data is retained for seven years for tax and legal compliance. You may request deletion
          at any time (see Your Rights below).
        </p>

        <hr className="legal-divider" />

        <h2>7. Your Rights</h2>
        <p>Depending on your location, you have the right to:</p>
        <ul>
          <li><strong>Access</strong> the personal data we hold about you.</li>
          <li><strong>Rectify</strong> inaccurate or incomplete data.</li>
          <li><strong>Erase</strong> your data ("right to be forgotten") in certain circumstances.</li>
          <li><strong>Restrict</strong> or object to processing.</li>
          <li><strong>Data portability</strong> — receive your data in a machine-readable format.</li>
          <li><strong>Withdraw consent</strong> at any time where processing is based on consent.</li>
        </ul>
        <p>
          To exercise any of these rights, contact us at{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a>. We will respond within
          30 days.
        </p>

        <hr className="legal-divider" />

        <h2>8. Security</h2>
        <p>
          We implement appropriate technical and organisational measures to protect your personal data
          against unauthorised access, loss, or alteration. Our site operates over HTTPS. Payment
          processing is handled by PCI-DSS-compliant providers — we never store card numbers.
        </p>

        <hr className="legal-divider" />

        <h2>9. Children</h2>
        <p>
          The Moveee is not directed at children under 16. We do not knowingly collect personal data
          from anyone under 16. If you believe a child has provided us with personal information,
          please contact us immediately.
        </p>

        <hr className="legal-divider" />

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of significant
          changes via email or a prominent notice on our website. Continued use of our services after
          changes constitutes acceptance of the updated policy.
        </p>

        <hr className="legal-divider" />

        <h2>Contact</h2>
        <p>
          For privacy-related enquiries, contact our data team at{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a>, or write to:
          Moveee Media Ltd, London, United Kingdom.
        </p>
        <p>
          If you are unsatisfied with our response, you have the right to lodge a complaint with the
          UK Information Commissioner's Office (ICO) at{" "}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a>.
        </p>
      </div>
    </div>
  );
}
