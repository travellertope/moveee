import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG, getDirectoryEntriesWithFallback, getDirectoryPosts, getDirectoryEvents, type DirectoryEvent } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ContentGate from "@/components/ContentGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessLevel, canViewContent } from "@/lib/access";
import "../../directory.css";
import { sanitizeHtml } from "@/lib/sanitize";
import DirectoryLightboxImage from "./DirectoryLightboxImage";

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
  "tv-series": "TV Series",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let data: any;
  try { data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug }); } catch {}
  const entry = data?.cultureDirectory;
  if (!entry) return { title: { absolute: "Culture Directory · The Moveee" } };
  const imageUrl = entry.featuredImage?.node?.sourceUrl || "/og-fallback.png";
  const desc = entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160);
  return {
    title: { absolute: `${entry.title} · Culture Directory · The Moveee` },
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
  const img = entry.featuredImage?.node?.sourceUrl;
  const interests: any[] = entry.cultureInterests?.nodes ?? [];
  const works: { title: string; imageUrl: string }[] = entry.selectedWorks ?? [];

  const date = entry.date
    ? new Date(entry.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  // Fetch related entries by pulling the full pool and scoring by type + shared interests.
  // This mirrors the proven approach used by the directory archive page and avoids
  // unreliable taxQuery GraphQL filtering on custom taxonomies.
  let relatedEntries: any[] = [];
  const interestSlugs = new Set(interests.map((i: any) => i.slug));

  try {
    const allEntries = await getDirectoryEntriesWithFallback(200);

    // Score each entry: 2 pts for same type, 1 pt per shared interest
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

  // Community posts + events linked to this entry
  const [communityData, directoryEvents] = await Promise.all([
    entry.databaseId
      ? getDirectoryPosts(entry.databaseId)
      : Promise.resolve({ posts: [], summary: { total_posts: 0, average_rating: null, by_template: {} } }),
    entry.databaseId
      ? getDirectoryEvents(entry.databaseId)
      : Promise.resolve([] as DirectoryEvent[]),
  ]);
  const { posts: communityPosts, summary: communitySummary } = communityData;

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
      { label: "Created By",        key: "creator" },
      { label: "Network / Platform",key: "network" },
      { label: "Seasons",           key: "seasons" },
      { label: "Years",             key: "years" },
      { label: "Country",           key: "country" },
      { label: "Language",          key: "language" },
      { label: "Genre",             key: "genre" },
      { label: "Starring",          key: "starring" },
    ],
  };
  const infoboxFields = INFOBOX_DEFS[typeSlug] ?? [];

  return (
    <div className="dir-wiki-page">
      {/* ── Back link ── */}
      <div className="dir-wiki-topbar">
        <Link href="/discover" className="dir-back">← Discover</Link>
      </div>

      {/* ── Three-column layout ── */}
      <div className="dir-wiki-layout">

        {/* LEFT SIDEBAR — Related entries */}
        <aside className="dir-wiki-left">
          <div className="dir-wiki-sidebar-card">
            <div className="dir-wiki-sidebar-heading">Related {typeLabel}s</div>
            {relatedEntries.length === 0 ? (
              <p className="dir-wiki-sidebar-empty">No related entries yet.</p>
            ) : (
              <ul className="dir-wiki-related-list">
                {relatedEntries.map((e: any) => (
                  <li key={e.slug}>
                    <Link href={`/directory/${e.slug}`} className="dir-wiki-related-link">
                      {e.featuredImage?.node?.sourceUrl && (
                        <DirectoryLightboxImage
                          className="dir-wiki-related-thumb"
                          src={e.featuredImage.node.sourceUrl}
                          alt={e.title}
                        >
                          <Image src={e.featuredImage.node.sourceUrl} alt={e.title} fill style={{ objectFit: "cover" }} />
                        </DirectoryLightboxImage>
                      )}
                      <span className="dir-wiki-related-title">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="dir-wiki-sidebar-footer">
              <Link href={`/discover?type=${typeSlug}`} className="dir-wiki-see-all">
                See all {typeLabel}s →
              </Link>
            </div>
          </div>

          {/* Improve CTA */}
          <div className="dir-wiki-improve">
            <div className="dir-wiki-improve-label">★ Community Wiki</div>
            <p>Know more? Help improve this entry.</p>
            <Link href={`/directory/submit?improve=${slug}`} className="dir-improve-btn">
              Improve →
            </Link>
          </div>
        </aside>

        {/* CENTRE — Main article */}
        <article className="dir-wiki-main">
          <div className="dir-wiki-article-header">
            <span className="dir-single-type">{typeLabel}</span>
            <h1 className="dir-wiki-title" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.title) }} />
            {entry.excerpt && (
              <p className="dir-wiki-lead" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.excerpt.replace(/<[^>]*>/g, "")) }} />
            )}
            {date && <div className="dir-wiki-date">Added to directory {date}</div>}
          </div>

          {/* Body content */}
          <div className="dir-wiki-divider" />

          {canView ? (
            entry.content ? (
              <div className="dir-single-body" dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.content) }} />
            ) : (
              <p className="dir-wiki-no-content">Full article coming soon. Know this subject? Help us build it.</p>
            )
          ) : (
            <ContentGate accessLevel={accessLevel as "member-only" | "patron-only"} isLoggedIn={isLoggedIn} callbackUrl={`/directory/${slug}`} />
          )}

          {/* Interests / tags */}
          {interests.length > 0 && (
            <div className="dir-single-tags" style={{ marginTop: "32px" }}>
              <div className="dir-tags-label">Topics</div>
              <div className="dir-tags-list">
                {interests.map((t: any) => (
                  <span key={t.slug} className="dir-tag">{t.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Selected Works */}
          {works.length > 0 && (
            <div className="dir-wiki-works">
              <h2 className="dir-wiki-section-heading">Selected Works</h2>
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

          {/* Community Reviews & Takes (Phase 3) */}
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

          {/* Upcoming Events organised by this entry */}
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
                    <Link key={ev.id} href={ev.href} style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start", background: "#fff", border: "1px solid #e8e2d8", borderRadius: "8px", padding: "0.85rem 1rem", textDecoration: "none", color: "inherit" }}>
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
        </article>

        {/* RIGHT SIDEBAR — Infobox */}
        <aside className="dir-wiki-right">
          <div className="dir-wiki-infobox">
            {/* Featured image */}
            {img && (
              <DirectoryLightboxImage className="dir-wiki-infobox-img" src={img} alt={entry.title ?? ""}>
                <Image src={img} alt={entry.title ?? ""} fill style={{ objectFit: "contain" }} />
              </DirectoryLightboxImage>
            )}

            {/* Title inside infobox */}
            <div className="dir-wiki-infobox-name">{entry.title}</div>

            {/* Type row */}
            <div className="dir-wiki-infobox-row">
              <span className="dir-wiki-infobox-label">Type</span>
              <span className="dir-wiki-infobox-value">{typeLabel}</span>
            </div>

            {/* Interests */}
            {interests.length > 0 && (
              <div className="dir-wiki-infobox-row">
                <span className="dir-wiki-infobox-label">Category</span>
                <span className="dir-wiki-infobox-value">{interests.map((t: any) => t.name).join(", ")}</span>
              </div>
            )}

            {/* Added date */}
            {date && (
              <div className="dir-wiki-infobox-row">
                <span className="dir-wiki-infobox-label">Added</span>
                <span className="dir-wiki-infobox-value">{date}</span>
              </div>
            )}

            {/* Per-type infobox fields */}
            {infoboxFields.length > 0 && infoboxFields.some(f => infobox[f.key]) && (
              <div className="dir-wiki-infobox-divider" />
            )}
            {infoboxFields.map(({ label, key }) =>
              infobox[key] ? (
                <div key={key} className="dir-wiki-infobox-row">
                  <span className="dir-wiki-infobox-label">{label}</span>
                  <span className="dir-wiki-infobox-value">{infobox[key]}</span>
                </div>
              ) : null
            )}

            {/* External links */}
            {(websiteUrl || instagramHandle || twitterHandle) && (
              <>
                <div className="dir-wiki-infobox-divider" />
                {websiteUrl && (
                  <div className="dir-wiki-infobox-row">
                    <span className="dir-wiki-infobox-label">Website</span>
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="dir-wiki-infobox-link">
                      {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                    </a>
                  </div>
                )}
                {instagramHandle && (
                  <div className="dir-wiki-infobox-row">
                    <span className="dir-wiki-infobox-label">Instagram</span>
                    <a href={`https://instagram.com/${instagramHandle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="dir-wiki-infobox-link">
                      @{instagramHandle.replace(/^@/, "")}
                    </a>
                  </div>
                )}
                {twitterHandle && (
                  <div className="dir-wiki-infobox-row">
                    <span className="dir-wiki-infobox-label">X / Twitter</span>
                    <a href={`https://x.com/${twitterHandle.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="dir-wiki-infobox-link">
                      @{twitterHandle.replace(/^@/, "")}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
