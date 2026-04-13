import Link from "next/link";

export const metadata = {
  title: "Cookie Policy · The Moveee",
  description: "How The Moveee uses cookies and tracking technologies.",
};

export default function CookiePolicyPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">Company · Legal</div>
      <h1>Cookie <em>Policy</em></h1>
      <p className="legal-meta">Last updated: April 2026 &nbsp;·&nbsp; Moveee Media Ltd</p>

      <div className="legal-body">
        <p>
          This Cookie Policy explains how Moveee Media Ltd ("<strong>The Moveee</strong>") uses cookies
          and similar tracking technologies when you visit <strong>themoveee.com</strong>. It should be
          read alongside our <Link href="/privacy">Privacy Policy</Link>.
        </p>

        <h2>What Are Cookies?</h2>
        <p>
          Cookies are small text files placed on your device by websites you visit. They are widely used
          to make sites work more efficiently, to remember your preferences, and to provide information
          to site owners. Cookies do not contain executable code or viruses.
        </p>
        <p>
          We also use similar technologies such as web beacons, pixel tags, and local storage where
          appropriate. For simplicity, we refer to all these technologies as "cookies" in this policy.
        </p>

        <h2>Types of Cookies We Use</h2>

        <h3>
          <span className="cookie-type cookie-type--required">Required</span>
          Strictly Necessary Cookies
        </h3>
        <p>
          These cookies are essential for our website to function and cannot be switched off. They are
          typically set in response to actions you take, such as logging in, adding items to your cart,
          or completing a form. Without these cookies, the services you have asked for cannot be
          provided.
        </p>
        <ul>
          <li><strong>Session management</strong> — maintains your session state as you navigate the site.</li>
          <li><strong>Security tokens</strong> — prevents cross-site request forgery (CSRF) attacks.</li>
          <li><strong>Cart persistence</strong> — retains your shop basket between pages.</li>
        </ul>

        <h3>
          <span className="cookie-type cookie-type--analytics">Analytics</span>
          Performance & Analytics Cookies
        </h3>
        <p>
          These cookies allow us to count visits and traffic sources so we can measure and improve the
          performance of our site. All information collected is aggregated and therefore anonymous.
        </p>
        <ul>
          <li>
            <strong>Google Analytics</strong> — we use Google Analytics to understand how visitors
            interact with our site, which pages are most popular, how long users spend reading, and
            where they come from. Google&apos;s privacy policy is available at{" "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
              policies.google.com/privacy
            </a>.
          </li>
        </ul>

        <h3>
          <span className="cookie-type">Functional</span>
          Functional Cookies
        </h3>
        <p>
          These cookies enable enhanced functionality and personalisation, such as remembering your
          language preference, newsletter subscription status, or previously viewed articles.
        </p>

        <h3>
          <span className="cookie-type">Targeting</span>
          Targeting & Advertising Cookies
        </h3>
        <p>
          We may use targeting cookies to deliver advertising that is relevant to you and your interests,
          and to limit the number of times you see an advertisement. We do not share personal information
          with advertising partners without your consent.
        </p>

        <h2>Third-Party Cookies</h2>
        <p>
          Some content on our site — including embedded videos, social media widgets, and maps — is
          served by third-party providers who may set their own cookies. We have no direct control over
          these cookies. Please refer to the respective third parties&apos; privacy and cookie policies
          for more information.
        </p>

        <h2>How Long Are Cookies Retained?</h2>
        <ul>
          <li><strong>Session cookies</strong> — deleted when you close your browser.</li>
          <li><strong>Persistent cookies</strong> — remain on your device for a set period (typically between 30 days and 2 years depending on the cookie).</li>
        </ul>

        <h2>Managing Your Cookie Preferences</h2>
        <p>
          You can control and/or delete cookies at any time. You can remove all cookies already on your
          device, and you can configure most browsers to prevent them from being placed. If you do this,
          you may have to manually adjust some preferences each time you visit our site and some
          functionality may not work as expected.
        </p>
        <p>Browser-specific instructions for managing cookies:</p>
        <ul>
          <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
          <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
          <li><a href="https://support.apple.com/en-gb/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Apple Safari</a></li>
          <li><a href="https://support.microsoft.com/en-us/windows/manage-cookies-in-microsoft-edge" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
        </ul>
        <p>
          To opt out of Google Analytics across all websites, you can install the{" "}
          <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">
            Google Analytics Opt-out Browser Add-on
          </a>.
        </p>

        <h2>Nigerian Data Protection</h2>
        <p>
          Our use of cookies is governed by the Nigeria Data Protection Regulation (NDPR) 2019. If you
          have concerns about how your data is handled, you may contact NITDA (National Information
          Technology Development Agency) at{" "}
          <a href="https://nitda.gov.ng" target="_blank" rel="noopener noreferrer">nitda.gov.ng</a>.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Cookie Policy from time to time. Any changes will be posted on this page
          with an updated date. We encourage you to review this policy periodically.
        </p>

        <h2>Contact</h2>
        <p>
          If you have questions about our use of cookies, please contact us at{" "}
          <a href="mailto:privacy@themoveee.com">privacy@themoveee.com</a> or visit our{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
      </div>
    </div>
  );
}
