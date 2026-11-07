import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG, getDirectoryEntriesWithFallback, getDirectoryPosts, getDirectoryEvents, type DirectoryEvent } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ContentGate from "@/components/ContentGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessLevel, canViewContent } from "@/lib/access";
import "../../../directory.css";
import { sanitizeHtml } from "@/lib/sanitize";
import DirectoryLightboxImage from "./DirectoryLightboxImage";
import BookMoodPace from "./BookMoodPace";
import EntryActionBar from "./EntryActionBar";
import SocialProofLine from "./SocialProofLine";
import SaveLineButton from "./SaveLineButton";
import DirectoryFollowButton from "./DirectoryFollowButton";
import StoopProximityBanner from "./StoopProximityBanner";
import { decodeHtml } from "@/lib/decode-html";

export const revalidate = 300;
export const dynamicParams = true;

const TYPE_LABELS: Record<string, string> = {
  person:   "Person",
  place:    "Place",
  movement: "Movement",
  genre:    "Genre",
  concept:  "Concept",
  artwork:  "Artwork",
  food:     "Food & Drink",
  fashion:  "Fashion",
  film:     "Film",
  book:     "Book",
  album:    "Music",
  "tv-series": "TV Series",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: any;
  try { data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug }); } catch {}
  const entry = data?.cultureDirectory;
  if (!entry) return { title: { absolute: "Culture Directory | Moveee" } };
  const imageUrl = entry.featuredImage?.node?.sourceUrl || "/og-fallback.png";
  const desc = entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160);
  return {
    title: { absolute: `${entry.title} | Culture Directory | Moveee` },
    description: desc,
    openGraph: { title: entry.title, description: desc, images: [{ url: imageUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: entry.title, description: desc, images: [imageUrl] },
  };
}

export default async function DirectoryEntryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let data: any;
  try { data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug }); } catch {}
  const entry = data?.cultureDirectory;
  if (!entry) notFound();

  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const accessLevel = getAccessLevel(entry);
  const canView = canViewContent(accessLevel, user);
  const isLoggedIn = !!user;

  const typeNode = entry.cultureDirectoryTypes?.nodes?.[0];
  const typeSlug = typeNode?.slug ?? "";
  const typeLabel = TYPE_LABELS[typeSlug] ?? typeNode?.name ?? "Entry";
  // Seeder-created entries store cover in _external_cover_url (not in WP media),
  // so externalCoverUrl is the fallback when no WP featured image attachment exists.
  const img = entry.featuredImage?.node?.sourceUrl || entry.externalCoverUrl || null;

  const LINE_SOURCE_TYPES: Record<string, string> = { book: "book", film: "film", album: "album", "tv-series": "film" };
  const quoteLinkRole = typeSlug === "person" ? "author" : "source";
  const quoteLinkType = typeSlug === "person" ? "" : LINE_SOURCE_TYPES[typeSlug] ?? "";
  const interests: any[] = entry.cultureInterests?.nodes ?? [];
  const works: { title: string; imageUrl: string }[] = entry.selectedWorks ?? [];

  const date = entry.date
    ? new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  let relatedEntries: any[] = [];
  const interestSlugs = new Set(interests.map((i: any) => i.slug));

  try {
    const allEntries = await getDirectoryEntriesWithFallback(200);
    const scored: { entry: any; score: number }[] = allEntries
      .filter((e: any) => e.slug !== slug)
      .map((e: any) => {
        const eType = e.cultureDirectoryTypes?.nodes?.[0]?.slug ?? "";
        const eInterests: string[] = (e.cultureInterests?.nodes ?? []).map((n: any) => n.slug);
        let score = 0;
        if (typeSlug && eType === typeSlug) score += 2;
        eInterests.forEach((s: string) => { if (interestSlugs.has(s)) score += 1; });
        return { entry: e, score };
      })
      .filter(({ score }: { score: number }) => score > 0)
      .sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    relatedEntries = scored.slice(0, 5).map(({ entry }) => entry);
  } catch (err) {
    console.error("[directory] related fetch failed:", err);
  }

  const websiteUrl      = entry.websiteUrl      ?? "";
  const instagramHandle = entry.instagramHandle ?? "";
  const twitterHandle   = entry.twitterHandle   ?? "";
  const infobox: Record<string, string> = entry.infobox ?? {};

  const [communityData, directoryEvents] = await Promise.all([
    entry.databaseId
      ? getDirectoryPosts(entry.databaseId)
      : Promise.resolve({ posts: [], quotes: [], summary: { total_posts: 0, average_rating: null, by_template: {}, total_quotes: 0 } }),
    entry.databaseId
      ? getDirectoryEvents(entry.databaseId)
      : Promise.resolve([] as DirectoryEvent[]),
  ]);
  const { posts: communityPosts, summary: communitySummary } = communityData;
  const directoryQuotes = communityData.quotes ?? [];

  type InfoboxField = { label: string; key: string };
  const INFOBOX_DEFS: Record<string, InfoboxField[]> = {
    person: [
      { label: "Born",                  key: "born" },
      { label: "Died",                  key: "died" },
      { label: "Nationality",           key: "nationality" },
      { label: "Occupation",            key: "occupation" },
      { label: "Known For",             key: "knownFor" },
      { label: "Origin",                key: "originCity" },
      { label: "Active Years",          key: "activeYears" },
      { label: "Labels / Affiliations", key: "labels" },
      { label: "Education",             key: "education" },
      { label: "Notable Awards",        key: "awards" },
    ],
    place: [
      { label: "Country",           key: "country" },
      { label: "Region / State",    key: "region" },
      { label: "Population",        key: "population" },
      { label: "Official Language", key: "officialLanguage" },
      { label: "Currency",          key: "currency" },
      { label: "Founded",           key: "founded" },
      { label: "Area",              key: "area" },
    ],
    movement: [
      { label: "Founded",           key: "founded" },
      { label: "Founders",          key: "founders" },
      { label: "Origin Country",    key: "originCountry" },
      { label: "Active Period",     key: "activePeriod" },
      { label: "Ideology",          key: "ideology" },
      { label: "Key Figures",       key: "keyFigures" },
      { label: "Related Movements", key: "relatedMovements" },
    ],
    genre: [
      { label: "Origin Country",  key: "originCountry" },
      { label: "Origin Decade",   key: "originDecade" },
      { label: "Key Instruments", key: "instruments" },
      { label: "Tempo (BPM)",     key: "tempoBpm" },
      { label: "Key Artists",     key: "keyArtists" },
      { label: "Related Genres",  key: "relatedGenres" },
      { label: "Subgenres",       key: "subgenres" },
    ],
    concept: [
      { label: "Origin Country",   key: "originCountry" },
      { label: "Period / Era",     key: "period" },
      { label: "Known For",        key: "knownFor" },
      { label: "Key Thinkers",     key: "keyThinkers" },
      { label: "Related Concepts", key: "relatedConcepts" },
    ],
    film: [
      { label: "Director",           key: "director" },
      { label: "Year",               key: "year" },
      { label: "Runtime",            key: "runtime" },
      { label: "Country",            key: "country" },
      { label: "Language",           key: "language" },
      { label: "Distributor",        key: "distributor" },
      { label: "Production Company", key: "productionCompany" },
      { label: "Cinematographer",    key: "cinematographer" },
      { label: "Starring",           key: "starring" },
    ],
    book: [
      { label: "Author",         key: "author" },
      { label: "Year Published", key: "yearPublished" },
      { label: "Genre",          key: "genre" },
      { label: "Publisher",      key: "publisher" },
      { label: "Language",       key: "language" },
      { label: "Pages",          key: "pages" },
      { label: "ISBN",           key: "isbn" },
    ],
    album: [
      { label: "Artist", key: "artist" },
      { label: "Year",   key: "year" },
      { label: "Genre",  key: "genre" },
    ],
    artwork: [
      { label: "Artist",           key: "artist" },
      { label: "Year",             key: "year" },
      { label: "Medium",           key: "medium" },
      { label: "Dimensions",       key: "dimensions" },
      { label: "Style / Movement", key: "style" },
      { label: "Current Location", key: "currentLocation" },
      { label: "Collection",       key: "artCollection" },
    ],
    food: [
      { label: "Origin Country",   key: "originCountry" },
      { label: "Food Type",        key: "foodType" },
      { label: "Also Known As",    key: "alsoKnownAs" },
      { label: "Cultural Context", key: "culturalContext" },
      { label: "Main Ingredients", key: "mainIngredients" },
    ],
    fashion: [
      { label: "Origin / Region",       key: "origin" },
      { label: "Era / Period",          key: "era" },
      { label: "Style / Category",      key: "style" },
      { label: "Materials / Fabric",    key: "materials" },
      { label: "Key Designers",         key: "keyDesigners" },
      { label: "Cultural Significance", key: "culturalSignificance" },
    ],
    "tv-series": [
      { label: "Created By",         key: "creator" },
      { label: "Network / Platform", key: "network" },
      { label: "Seasons",            key: "seasons" },
      { label: "Years",              key: "years" },
      { label: "Country",            key: "country" },
      { label: "Language",           key: "language" },
      { label: "Genre",              key: "genre" },
      { label: "Starring",           key: "starring" },
    ],
  };
  const infoboxFields = INFOBOX_DEFS[typeSlug] ?? [];

  // ── Derived display values ────────────────────────────────
  // Cover aspect ratio: square for music/album, portrait (2:3) for everything else
  const coverAspect = typeSlug === "album" ? "square" : "portrait";

  // Subtitle line below the title — varies by type
  const creatorLine = (() => {
    if (typeSlug === "book") return entry.aboutValue || infobox["author"] || null;
    if (typeSlug === "album") return entry.aboutValue || infobox["artist"] || null;
    if (typeSlug === "film") {
      const parts: string[] = [];
      if (infobox["director"]) parts.push(`Directed by ${infobox["director"]}`);
      if (infobox["year"]) parts.push(infobox["year"]);
      return parts.join(", ") || null;
    }
    if (typeSlug === "tv-series") {
      const parts: string[] = [];
      if (infobox["creator"]) parts.push(`Created by ${infobox["creator"]}`);
      if (infobox["years"] || infobox["year"]) parts.push(infobox["years"] || infobox["year"]);
      return parts.join(", ") || null;
    }
    if (typeSlug === "person") {
      return [infobox["nationality"], infobox["occupation"]].filter(Boolean).join(" · ") || null;
    }
    return null;
  })();

  // Which fields go in the type-specific details section
  const DETAILS_SECTION_LABEL: Record<string, string> = {
    book:        "Publication Info",
    film:        "Details",
    "tv-series": "Details",
    album:       "Details",
    person:      "About",
    place:       "About",
    movement:    "About",
    genre:       "About",
    concept:     "About",
    artwork:     "About",
    food:        "About",
    fashion:     "About",
  };
  const detailsHeading = DETAILS_SECTION_LABEL[typeSlug] ?? "About";

  // For the star rating display
  const avgRating = communitySummary.average_rating;
  const reviewCount = communitySummary.total_posts;
  const ratingStars = avgRating ? Math.round(avgRating) : 0;

  // Tag pills: interests + select infobox quick-facts
  const tagPills: string[] = [];
  if (typeSlug === "book") {
    if (infobox["genre"]) tagPills.push(infobox["genre"]);
    if (infobox["yearPublished"]) tagPills.push(infobox["yearPublished"]);
    if (infobox["pages"]) tagPills.push(`${infobox["pages"]} pages`);
  } else if (typeSlug === "film") {
    if (infobox["genre"] || interests[0]?.name) tagPills.push(infobox["genre"] || interests[0]?.name);
    if (infobox["year"]) tagPills.push(infobox["year"]);
    if (infobox["runtime"]) tagPills.push(infobox["runtime"]);
  } else if (typeSlug === "album") {
    if (infobox["genre"] || interests[0]?.name) tagPills.push(infobox["genre"] || interests[0]?.name);
    if (infobox["year"]) tagPills.push(infobox["year"]);
    if (infobox["tracks"]) tagPills.push(`${infobox["tracks"]} tracks`);
  } else if (typeSlug === "tv-series") {
    if (infobox["genre"]) tagPills.push(infobox["genre"]);
    if (infobox["seasons"]) tagPills.push(`${infobox["seasons"]} seasons`);
    if (infobox["years"] || infobox["year"]) tagPills.push(infobox["years"] || infobox["year"]);
  } else {
    interests.slice(0, 4).forEach((t: any) => tagPills.push(t.name));
  }

  return (
    <div className="dir-entry-page">

      {/* ── Main two-column grid ── */}
      <div className="dir-entry-grid">

        {/* LEFT — Cover image + rating + actions */}
        <div className="dir-entry-image-col">
          <div className={`dir-entry-cover dir-entry-cover--${coverAspect}${typeSlug === "book" ? " dir-entry-cover--book" : ""}`}>
            {img ? (
              <DirectoryLightboxImage className="dir-entry-cover-lightbox" src={img} alt={entry.title ?? ""}>
                <Image src={img} alt={entry.title ?? ""} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, 400px" />
              </DirectoryLightboxImage>
            ) : (
              <div className="dir-entry-cover-placeholder">
                <span>{typeLabel}</span>
              </div>
            )}
          </div>

          {/* Star rating */}
          <div className="dir-entry-rating-row">
            {[1,2,3,4,5].map(n => (
              <span key={n} className={n <= ratingStars ? "dir-entry-star dir-entry-star--filled" : "dir-entry-star"}>
                {n <= ratingStars ? "★" : "☆"}
              </span>
            ))}
          </div>
          {reviewCount > 0 ? (
            <p className="dir-entry-review-count">
              {avgRating?.toFixed(1)} based on {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
            </p>
          ) : (
            <p className="dir-entry-review-count">New · 0 reviews</p>
          )}

          {/* Social proof + follow */}
          {entry.databaseId && (
            <SocialProofLine directoryId={entry.databaseId} isLoggedIn={isLoggedIn} />
          )}
          {entry.databaseId && (
            <DirectoryFollowButton directoryId={entry.databaseId} entryType={typeSlug} isLoggedIn={isLoggedIn} />
          )}

          {/* Book mood/pace (books only) */}
          {typeSlug === "book" && entry.databaseId && (
            <BookMoodPace directoryId={entry.databaseId} isLoggedIn={isLoggedIn} />
          )}

          {/* Stoop proximity (places only) */}
          {entry.databaseId && typeSlug === "place" && (
            <StoopProximityBanner directoryId={entry.databaseId} isLoggedIn={isLoggedIn} />
          )}

          {/* External links */}
          {(websiteUrl || instagramHandle || twitterHandle) && (
            <div className="dir-entry-ext-links">
              {websiteUrl && (
                <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="dir-entry-ext-link">
                  {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {instagramHandle && (
                <a href={`https://instagram.com/${instagramHandle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="dir-entry-ext-link">
                  @{instagramHandle.replace(/^@/, "")}
                </a>
              )}
              {twitterHandle && (
                <a href={`https://x.com/${twitterHandle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="dir-entry-ext-link">
                  @{twitterHandle.replace(/^@/, "")} ↗
                </a>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — Entry details */}
        <div className="dir-entry-details-col">
          <span className="dir-entry-type-label">{typeLabel}</span>
          <h1 className="dir-entry-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.title) }} />
          {creatorLine && (
            <p className="dir-entry-creator">{creatorLine}</p>
          )}

          {/* Tag pills */}
          {tagPills.length > 0 && (
            <div className="dir-entry-tags">
              {tagPills.map((pill, i) => (
                <span key={i} className="dir-entry-tag">{pill}</span>
              ))}
            </div>
          )}

          {/* Excerpt / description */}
          {entry.excerpt && (
            <div className={`dir-entry-description${typeSlug === "book" ? " dir-entry-description--dropcap" : ""}`}>
              <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.excerpt.replace(/<[^>]*>/g, "")) }} />
            </div>
          )}

          {/* Action bar — Review / Save Line / Log / Improve */}
          {entry.databaseId && (
            <EntryActionBar
              directoryId={entry.databaseId}
              isLoggedIn={isLoggedIn}
              slug={slug}
              entryTitle={decodeHtml(entry.title ?? "").replace(/<[^>]*>/g, "")}
              quoteLinkRole={quoteLinkRole}
              quoteLinkType={quoteLinkType || undefined}
            />
          )}

          {/* Full body content (gated if needed) */}
          {canView ? (
            entry.content ? (
              <div className="dir-single-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }} />
            ) : null
          ) : (
            <ContentGate accessLevel={accessLevel as "member-only" | "patron-only"} isLoggedIn={isLoggedIn} callbackUrl={`/directory/${slug}`} />
          )}

          {/* Type-specific details section */}
          {infoboxFields.some(f => infobox[f.key]) && (
            <div className="dir-entry-specifics">
              <h3 className="dir-entry-specifics-heading">{detailsHeading}</h3>
              <div className="dir-entry-info-grid">
                {infoboxFields.map(({ label, key }) =>
                  infobox[key] ? (
                    <div key={key} className="dir-entry-info-cell">
                      <span className="dir-entry-info-label">{label}</span>
                      <span className="dir-entry-info-value">{infobox[key]}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}

          {/* Selected Works */}
          {works.length > 0 && (
            <div className="dir-entry-works">
              <h3 className="dir-entry-specifics-heading">Selected Works</h3>
              <div className="dir-wiki-works-grid">
                {works.map((w, i) => (
                  <div key={i} className="dir-wiki-work-card">
                    {w.imageUrl && (
                      <DirectoryLightboxImage className="dir-wiki-work-img" src={w.imageUrl} alt={w.title}>
                        <Image src={w.imageUrl} alt={w.title} fill style={{ objectFit: "contain" }} />
                      </DirectoryLightboxImage>
                    )}
                    {w.title && <div className="dir-wiki-work-title">{w.title}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Added date */}
          {date && <p className="dir-entry-added-date">Added to directory {date}</p>}

          {/* ── Community reviews, quotes, events & related ── */}
          <div className="dir-entry-lower">

        {/* Community Reviews & Takes */}
        {communitySummary.total_posts > 0 && (
          <div className="dir-community-section">
            <div className="dir-community-header">
              <h2 className="dir-wiki-section-heading" style={{ marginBottom: 0 }}>Community Reviews &amp; Takes</h2>
              {communitySummary.average_rating && (
                <div className="dir-community-rating">
                  <span className="dir-community-stars">{"★".repeat(Math.round(communitySummary.average_rating))}{"☆".repeat(5 - Math.round(communitySummary.average_rating))}</span>
                  <span className="dir-community-rating-num">{communitySummary.average_rating.toFixed(1)}</span>
                  <span className="dir-community-rating-count">({communitySummary.total_posts} {communitySummary.total_posts === 1 ? "review" : "reviews"})</span>
                </div>
              )}
            </div>

            <div className="dir-community-posts">
              {communityPosts.map((post) => (
                <div key={post.id} className={`dir-community-card dir-community-card--${post.template_type}`}>
                  <div className="dir-community-card-header">
                    <DirectoryLightboxImage
                      src={post.author.avatar}
                      alt={post.author.name}
                      style={{ display: "inline-block", width: 32, height: 32, flexShrink: 0 }}
                    >
                      <img
                        src={post.author.avatar}
                        alt=""
                        className="dir-community-avatar"
                        width={32}
                        height={32}
                      />
                    </DirectoryLightboxImage>
                    <div className="dir-community-card-meta">
                      <span className="dir-community-author">{post.author.name}</span>
                      {post.author.tier === "patron" && (
                        <span className="dir-community-pro-badge">Pro</span>
                      )}
                      <span className="dir-community-date">
                        · {new Date(post.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {post.star_rating && (
                      <div className="dir-community-star-rating">
                        {"★".repeat(post.star_rating)}{"☆".repeat(5 - post.star_rating)}
                      </div>
                    )}
                  </div>
                  <p className="dir-community-content">{post.content}</p>
                  <div className="dir-community-card-footer">
                    {Object.keys(post.reactions ?? {}).length > 0 && (
                      <div className="dir-community-reactions">
                        {Object.entries(post.reactions).map(([emoji, count]) =>
                          count > 0 ? (
                            <span key={emoji} className="dir-community-reaction">
                              {emoji} {count}
                            </span>
                          ) : null
                        )}
                      </div>
                    )}
                    {post.slug && (
                      <a href={`/community/${post.slug}`} className="dir-community-read-more">
                        Read full post →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quotes / Lines */}
        {(directoryQuotes.length > 0 || typeSlug === "person" || !!quoteLinkType) && (
          <div className="dir-community-section" style={{ marginTop: "2rem" }}>
            <div className="dir-community-header">
              <h2 className="dir-wiki-section-heading" style={{ marginBottom: 0 }}>
                {typeSlug === "person" ? "Lines people saved" : "Lines saved from this"}
              </h2>
              {directoryQuotes.length > 0 && (
                <span className="dir-community-rating-count">
                  {directoryQuotes.length} {directoryQuotes.length === 1 ? "line" : "lines"}
                </span>
              )}
            </div>
            <div className="dir-quotes">
              {directoryQuotes.length === 0 && (
                <p className="dir-quotes-empty">No lines saved yet.</p>
              )}
              {directoryQuotes.map((q) => (
                <figure key={q.id} className="dir-quote-card">
                  <blockquote className="dir-quote-text">{q.text}</blockquote>
                  <figcaption className="dir-quote-meta">
                    {typeSlug === "person"
                      ? q.source && <span className="dir-quote-source">{q.source}</span>
                      : q.author && <span className="dir-quote-source">{q.author}</span>}
                    <span className="dir-quote-saved">Saved by {q.saved_by.name}</span>
                    <a href={q.href} className="dir-community-read-more">Open →</a>
                  </figcaption>
                </figure>
              ))}
            </div>

            {entry.databaseId && (
              <SaveLineButton
                directoryId={entry.databaseId}
                entryTitle={decodeHtml(entry.title ?? "").replace(/<[^>]*>/g, "")}
                quoteLinkRole={quoteLinkRole}
                quoteLinkType={quoteLinkType || undefined}
                label={typeSlug === "person" ? "Save a line from them →" : "Save a line from this →"}
              />
            )}
          </div>
        )}

        {/* Upcoming Events */}
        {directoryEvents.length > 0 && (
          <div className="dir-community-section" style={{ marginTop: "2rem" }}>
            <div className="dir-community-header">
              <h2 className="dir-wiki-section-heading" style={{ marginBottom: 0 }}>Upcoming Events</h2>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
              {directoryEvents.map((ev) => {
                const evDate = ev.event_date
                  ? new Date(ev.event_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : null;
                const endDate = ev.end_date
                  ? new Date(ev.end_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                  : null;
                return (
                  <Link key={ev.id} href={ev.href} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "var(--paper, #f3ece0)", border: "1px solid var(--rule, #e8e2d8)", borderRadius: "8px", padding: "0.85rem 1rem", textDecoration: "none", color: "inherit" }}>
                    {ev.image && (
                      <DirectoryLightboxImage
                        src={ev.image}
                        alt={ev.title}
                        style={{ width: "72px", height: "72px", borderRadius: "4px", flexShrink: 0, overflow: "hidden" }}
                      >
                        <img src={ev.image} alt={ev.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                      </DirectoryLightboxImage>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                        <span style={{ background: "#eeedfe", color: "#3c3489", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0.15rem 0.4rem", borderRadius: "999px" }}>Happening</span>
                        {evDate && (
                          <span style={{ fontSize: "0.62rem", color: "#3c3489", fontWeight: 600 }}>
                            {evDate}{endDate && endDate !== evDate ? ` — ${endDate}` : ""}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 600, color: "#14110d", lineHeight: 1.35 }}>{ev.title}</p>
                      {(ev.location || ev.city) && (
                        <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#7a6f5c" }}>
                          {[ev.location, ev.city].filter(Boolean).join(", ")}
                          {ev.admission ? ` · ${ev.admission}` : ""}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Improve CTA ── */}
        <div className="dir-wiki-improve" style={{ marginTop: "2rem" }}>
          <div className="dir-wiki-improve-label">Community Wiki</div>
          <p>Know more? Help improve this entry.</p>
          <Link href={`/directory/submit?improve=${slug}`} className="dir-improve-btn">
            Improve →
          </Link>
        </div>

        {/* ── Related entries ── */}
        <div className="dir-entry-related">
          <h3 className="dir-entry-related-heading">More {typeLabel}s</h3>
          {relatedEntries.length === 0 ? (
            <p className="dir-wiki-sidebar-empty">No related entries yet.</p>
          ) : (
            <div className="dir-entry-related-grid">
              {relatedEntries.map((e: any) => (
                <Link key={e.slug} href={`/directory/${e.slug}`} className="dir-entry-related-card">
                  {e.featuredImage?.node?.sourceUrl && (
                    <div className="dir-entry-related-thumb">
                      <Image src={e.featuredImage.node.sourceUrl} alt={e.title} fill style={{ objectFit: "cover" }} />
                    </div>
                  )}
                  <span className="dir-entry-related-title">{e.title}</span>
                </Link>
              ))}
            </div>
          )}
          <div style={{ marginTop: "12px" }}>
            <Link href={`/discover?type=${typeSlug}`} className="dir-wiki-see-all">
              See all {typeLabel}s →
            </Link>
          </div>
        </div>

        {/* Footer links */}
        <p style={{ margin: "1.5rem 0 0", fontSize: "0.68rem", color: "#7a6f5c", lineHeight: 1.7 }}>
          © {new Date().getFullYear()} The Moveee. All Rights Reserved.
          <br />
          <Link href="/terms" style={{ color: "#7a6f5c" }}>Terms</Link>
          {" · "}
          <Link href="/privacy" style={{ color: "#7a6f5c" }}>Privacy</Link>
          {" · "}
          <Link href="/contact" style={{ color: "#7a6f5c" }}>Contact</Link>
        </p>
          </div>{/* end dir-entry-lower */}

        </div>{/* end dir-entry-details-col */}
      </div>{/* end dir-entry-grid */}

    </div>
  );
}
