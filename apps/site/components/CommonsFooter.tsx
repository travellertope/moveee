import Link from "next/link";
import CommonsLogo from "./CommonsLogo";
import SubscribeForm from "./SubscribeForm";
import { COMMONS_SECTIONS } from "@/lib/wp";

// The Moveee Commons' own dark footer — replaces the sitewide Footer
// entirely on every /commons route (see ConditionalFooter.tsx's
// isCommonsPath check), same shape as LiteraryFooter.tsx. Reuses the real
// newsletter mechanism (SubscribeForm, list="culture-drop" — no dedicated
// Commons list exists yet) rather than fabricating a new one.
export default function CommonsFooter() {
  return (
    <footer className="comm-foot comm-page--inverted">
      <div className="comm-wrap comm-foot-top">
        <div>
          <CommonsLogo />
          <p className="comm-foot-tag">Opinion, reports and research on the systems that govern us.</p>
          <div className="comm-nl-form">
            <SubscribeForm
              placeholder="Email address"
              buttonLabel="Subscribe"
              inputClassName="comm-nl-input"
              buttonClassName="comm-nl-btn"
              list="culture-drop"
            />
          </div>
        </div>
        <div>
          <div className="comm-foot-h">Sections</div>
          <div className="comm-foot-links">
            {COMMONS_SECTIONS.map((s) => (
              <Link key={s.slug} href={`/commons/${s.slug}`}>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <div className="comm-foot-h">The Commons</div>
          <div className="comm-foot-links">
            <Link href="/commons">The Moveee Commons</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <div className="comm-foot-h">Legal</div>
          <div className="comm-foot-links">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Use</Link>
          </div>
        </div>
      </div>
      <div className="comm-wrap comm-foot-bottom">
        <span>&copy; {new Date().getFullYear()} Moveee Media Ltd. The Moveee Commons is published by The Moveee.</span>
        <Link href="/">themoveee.com</Link>
      </div>
    </footer>
  );
}
