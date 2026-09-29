import Link from "next/link";
import SubscribeForm from "@/components/SubscribeForm";

// Community/auth routes don't exist in apps/site — link straight to Site B,
// same reasoning as the sitewide Footer.tsx's own CONNECT_URL constant.
const CONNECT_URL = "https://web.themoveee.com";

export default function StoopFooter() {
  return (
    <footer className="stp-footer">
      <div className="stp-footer-top">
        <div className="stp-footer-nl">
          <label htmlFor="stp-email-footer">
            Stay close to culture. Get our weekly dispatch.
          </label>
          <div className="stp-footer-nl-row">
            <SubscribeForm
              placeholder="Your email address"
              buttonLabel="Subscribe"
              inputClassName="stp-footer-input"
              buttonClassName="stp-btn stp-btn-cream"
              list="culture-drop"
            />
          </div>
        </div>

        <div className="stp-footer-cols">
          <div className="stp-footer-col">
            <h5>Explore</h5>
            <ul>
              <li><Link href="/magazine">Magazine</Link></li>
              <li><Link href="/literary">The Moveee Literary</Link></li>
              <li><Link href="/commons">The Moveee Commons</Link></li>
              <li><Link href="/newsletter">Newsletter</Link></li>
              <li><Link href="/journeys">Origins</Link></li>
              <li><Link href="/visuals">Visuals</Link></li>
            </ul>
          </div>
          <div className="stp-footer-col">
            <h5>Moveee</h5>
            <ul>
              <li><a href={`${CONNECT_URL}/feed`}>Feed</a></li>
              <li><a href={`${CONNECT_URL}/events`}>Happenings</a></li>
              <li><a href={`${CONNECT_URL}/directory`}>Culture Directory</a></li>
              <li><a href={`${CONNECT_URL}/games`}>Games</a></li>
              <li><Link href="/lifestyle">Shop</Link></li>
            </ul>
          </div>
          <div className="stp-footer-col">
            <h5>Company</h5>
            <ul>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
              <li><Link href="/terms">Terms of Use</Link></li>
              <li><Link href="/cookie-policy">Cookie Policy</Link></li>
              <li><Link href="/ai-use">AI Use Policy</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="stp-footer-wordmark" aria-hidden="true">stoop.</div>

      <div className="stp-footer-bar">
        <span>© 2026 The Moveee. All rights reserved.</span>
        <span>themoveee.com/stoop</span>
      </div>
    </footer>
  );
}
