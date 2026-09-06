import Link from "next/link";
import LiteraryLogo from "./LiteraryLogo";
import SubscribeForm from "./SubscribeForm";
import { LITERARY_GENRES } from "@/lib/wp";

// The Moveee Literary's own dark footer — replaces the sitewide Footer
// entirely on every /literary route (see ConditionalFooter.tsx). Reuses
// the real newsletter mechanism (SubscribeForm, list="culture-drop" — no
// dedicated literary list exists yet) and the same social links the
// sitewide footer carries, rather than fabricating new ones.
export default function LiteraryFooter() {
  return (
    <footer className="lit-foot">
      <div className="lit-wrap lit-foot-top">
        <div>
          <LiteraryLogo inverted />
          <p className="lit-foot-tag">Writing that shapes the world.</p>
          <div className="lit-nl-form">
            <SubscribeForm
              placeholder="Email address"
              buttonLabel="Subscribe"
              inputClassName="lit-nl-input"
              buttonClassName="lit-nl-btn"
              list="culture-drop"
            />
          </div>
        </div>
        <div>
          <div className="lit-foot-h">Sections</div>
          <div className="lit-foot-links">
            {LITERARY_GENRES.map((g) => (
              <Link key={g.slug} href={`/literary/${g.slug}`}>
                {g.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="lit-foot-h">The Magazine</div>
          <div className="lit-foot-links">
            <Link href="/literary/submit">Submit Your Work</Link>
            <Link href="/literary">The Moveee Literary</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <div className="lit-foot-h">Legal</div>
          <div className="lit-foot-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
      </div>
      <div className="lit-wrap lit-foot-bottom">
        <span>&copy; {new Date().getFullYear()} Moveee Media Ltd. The Moveee Literary is published by The Moveee.</span>
        <Link href="/">themoveee.com</Link>
      </div>
    </footer>
  );
}
