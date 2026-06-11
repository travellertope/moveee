import Link from "next/link";

export const metadata = {
  title: { absolute: "Terms of Use | The Moveee" },
  description: "The terms and conditions governing your use of The Moveee platform, membership, and community.",
};

export default function TermsPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">Company · Legal</div>
      <h1>Terms of <em>Use</em></h1>
      <p className="legal-meta">Last updated: April 2026 &nbsp;·&nbsp; Moveee Media Ltd</p>

      <div className="legal-body">
        <p>
          Please read these Terms of Use carefully before using <strong>themoveee.com</strong> (the
          "Site") or any services offered by Moveee Media Ltd ("The Moveee", "we", "us"). By accessing
          or using our Site, you agree to be bound by these terms. If you do not agree, please do not
          use our Site.
        </p>

        <h2>1. About The Moveee</h2>
        <p>
          The Moveee is an independent editorial and lifestyle platform dedicated to African and
          diaspora culture. We publish long-form journalism, curate cultural events, facilitate origin
          journeys, and operate a vetted commerce platform. Moveee Media Ltd is registered and
          primarily operates in the Federal Republic of Nigeria, with presence across Lagos, London,
          Accra, and New York.
        </p>

        <h2>2. Intellectual Property</h2>
        <p>
          All editorial content published on the Site — including articles, photographs, illustrations,
          graphics, video, audio, and design — is the exclusive intellectual property of Moveee Media
          Ltd or its respective rights holders. All rights are reserved.
        </p>
        <p>
          You may not reproduce, distribute, republish, transmit, display, adapt, or create derivative
          works from any content on the Site without prior written permission from Moveee Media Ltd,
          except for personal, non-commercial use. For licensing or republication enquiries, contact{" "}
          <a href="mailto:editorial@themoveee.com">editorial@themoveee.com</a>.
        </p>
        <p>
          The Moveee name, wordmark, and logo are trademarks of Moveee Media Ltd and may not be used
          without written consent.
        </p>

        <h2>3. Permitted Use</h2>
        <p>You may use the Site to:</p>
        <ul>
          <li>Read and share links to editorial content for personal, non-commercial purposes.</li>
          <li>Subscribe to our newsletter services.</li>
          <li>Register for events and purchase tickets.</li>
          <li>Make purchases through our shop.</li>
          <li>Participate in community features where available.</li>
        </ul>

        <h2>4. Prohibited Use</h2>
        <p>You must not use the Site to:</p>
        <ul>
          <li>Scrape, crawl, or harvest content for commercial purposes without permission.</li>
          <li>Reproduce or republish our editorial content on other platforms without a licence.</li>
          <li>Use automated tools to access, index, or download content at scale.</li>
          <li>Engage in any activity that disrupts or damages our infrastructure.</li>
          <li>Submit false, misleading, or fraudulent information in any form.</li>
          <li>Violate any applicable Nigerian law or regulation, including the Cybercrimes (Prohibition, Prevention, Etc.) Act 2015.</li>
        </ul>

        <h2>5. User-Generated Content</h2>
        <p>
          Where The Moveee allows you to submit comments, reviews, or other contributions, you grant
          us a non-exclusive, royalty-free, worldwide licence to use, display, and distribute that
          content in connection with our services. You represent that you own the rights to any content
          you submit and that it does not infringe third-party rights or violate applicable law.
        </p>
        <p>
          We reserve the right to remove any user-generated content at our discretion, without notice.
        </p>

        <h2>6. External Links</h2>
        <p>
          The Site may contain links to third-party websites. These links are provided for convenience
          only. We have no control over the content of those sites and accept no responsibility for
          them or for any loss or damage arising from your use of them.
        </p>

        <h2>7. Shop & Commerce</h2>
        <p>
          Products available through The Moveee Shop are sold subject to our separate{" "}
          <Link href="/shop/shipping">Shipping & Returns policy</Link>. Prices are displayed in NGN (₦)
          unless otherwise stated. We reserve the right to refuse or cancel any order at our discretion.
        </p>

        <h2>8. Events</h2>
        <p>
          Event tickets purchased through The Moveee are subject to the specific terms and conditions
          of each event. Refunds and transfers are governed by the cancellation policy stated at the
          time of purchase. The Moveee reserves the right to cancel or reschedule events, in which
          case ticket holders will be notified and offered a refund or alternative.
        </p>

        <h2>9. Membership</h2>
        <p>
          Paid membership tiers grant access to exclusive content, events, and community features.
          Memberships are personal and non-transferable. Cancellations can be made at any time and
          will take effect at the end of the current billing period.
        </p>

        <h2>10. Disclaimer of Warranties</h2>
        <p>
          The Site and all content are provided "as is" and "as available" without warranty of any
          kind, express or implied. While we strive for accuracy, we do not warrant that editorial
          content is complete, current, or error-free. We are not liable for any reliance placed on
          content published on the Site.
        </p>

        <h2>11. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by Nigerian law, Moveee Media Ltd shall not be liable for
          any indirect, incidental, special, or consequential damages arising from your use of the
          Site or services, even if we have been advised of the possibility of such damages.
        </p>

        <h2>12. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes
          arising under these Terms shall be subject to the exclusive jurisdiction of the courts of
          Nigeria, with Lagos State as the preferred venue.
        </p>

        <h2>13. Changes to These Terms</h2>
        <p>
          We may update these Terms from time to time. Continued use of the Site following any changes
          constitutes acceptance of the updated Terms. We will notify users of material changes via
          email or a notice on the Site.
        </p>

        <h2>14. Contact</h2>
        <p>
          For questions about these Terms, contact us at{" "}
          <a href="mailto:legal@themoveee.com">legal@themoveee.com</a> or visit our{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
      </div>
    </div>
  );
}
