import SubscribeForm from "./SubscribeForm";
import type { EditionSlug } from "@/lib/editions";

const EDITION_COPY: Record<EditionSlug, { kicker: string; href: string }> = {
  global: { kicker: "Culture Drop", href: "/newsletter" },
  uk: { kicker: "UK Edition", href: "/newsletter/uk" },
  us: { kicker: "US Edition", href: "/newsletter/us" },
  africa: { kicker: "Africa Edition", href: "/newsletter/africa" },
};

// "Join the club" — a real subscribe form on the left, and on the right a
// single feature card previewing the latest issue, scoped to the
// visitor's own edition (server-resolved via the `edition` prop, same
// geo/cookie detection the front page already does — no client-side
// timezone guess, unlike the mockup's static prototype).
export default function JoinSection({
  edition,
  featureStory,
}: {
  edition: EditionSlug;
  featureStory: any | null;
}) {
  const copy = EDITION_COPY[edition] || EDITION_COPY.global;
  const image = featureStory?.featuredImage?.node?.sourceUrl || null;
  const alt = featureStory?.featuredImage?.node?.altText || featureStory?.title || "";
  // See FullBleedHero.tsx's identical guard — `title` isn't reliably a
  // string, and `(x || "")` only catches falsy, not non-string (a
  // non-string title interpolated into the caption below would render as
  // the literal text "[object Object]").
  const title = typeof featureStory?.title === "string" ? featureStory.title : "";
  // The card links to the actual latest newsletter issue, not a generic
  // archive route — featureStory is now always a real culture_newsletter
  // post (see loadHomeSections() in app/page.tsx), so its own slug is
  // always the right target.
  const href = featureStory?.slug ? `/newsletter/${featureStory.slug}` : copy.href;

  return (
    <section className="join-section">
      <div className="wrap">
        <div className="join-grid">
          <div>
            <h2 className="join-title">
              Like our stories? You&rsquo;ll (probably) love <em>Culture Drop</em>.
            </h2>
            {/* SubscribeForm renders its <input>/<button> as bare siblings
                (no wrapper of its own) — this div is what actually applies
                .join-form's margin-top/gap/column layout; without it the
                two elements had no spacing from the heading above them at
                all and just flowed inline. */}
            <div className="join-form">
              <SubscribeForm
                placeholder="Your email address"
                buttonLabel="Subscribe →"
                inputClassName="join-input"
                buttonClassName="join-submit"
                list="culture-drop"
              />
            </div>
            <p className="join-note">Free · Weekly · Unsubscribe any time</p>
          </div>

          {featureStory && (
            <div>
              <span className="join-feature-badge">Latest Edition: {copy.kicker}</span>
              <a href={href} className="wcard join-feature">
                <div className="wcard-photo">{image && <img src={image} alt={alt} />}</div>
                {/* Title only — matches every other card on this page
                    (MasonryRandomSection/HeroCarousel), not a merged
                    "title — excerpt" caption. */}
                <p className="wcard-caption" dangerouslySetInnerHTML={{ __html: title }} />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
