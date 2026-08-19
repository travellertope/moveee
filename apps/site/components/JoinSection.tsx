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
  // See FullBleedHero.tsx's identical guard — `excerpt` isn't reliably a
  // string, and `(x || "").replace` only catches falsy, not non-string.
  const excerpt = (typeof featureStory?.excerpt === "string" ? featureStory.excerpt : "").replace(/<[^>]*>/g, "").trim();

  return (
    <section className="join-section">
      <div className="wrap">
        <div className="join-grid">
          <div>
            <h2 className="join-title">
              Like our stories? You&rsquo;ll (probably) love <em>Culture Drop</em>.
            </h2>
            <SubscribeForm
              placeholder="Your email address"
              buttonLabel="Subscribe →"
              inputClassName="join-input"
              buttonClassName="join-submit"
              list="culture-drop"
            />
            <p className="join-note">Free · Weekly · Unsubscribe any time</p>
          </div>

          {featureStory && (
            <div>
              <span className="join-feature-badge">Latest Edition: {copy.kicker}</span>
              <a href={copy.href} className="wcard join-feature">
                <div className="wcard-photo">{image && <img src={image} alt={alt} />}</div>
                <p
                  className="wcard-caption"
                  dangerouslySetInnerHTML={{
                    __html: `${featureStory.title || ""}${excerpt ? ` — ${excerpt}` : ""}`,
                  }}
                />
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
