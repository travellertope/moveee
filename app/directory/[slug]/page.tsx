import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG, GET_DIRECTORY_ENTRIES_BY_TYPE } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ContentGate from "@/components/ContentGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessLevel, canViewContent } from "@/lib/access";
import "../../directory.css";

export const dynamic = "force-dynamic";

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
  if (!entry) return { title: "Culture Directory · The Moveee" };
  const imageUrl = entry.featuredImage?.node?.sourceUrl || "/og-fallback.png";
  const desc = entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160);
  return {
    title: `${entry.title} · Culture Directory · The Moveee`,
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

  // Fetch related entries of the same type (server-side)
  let relatedEntries: any[] = [];
  if (typeSlug) {
    try {
      const rel = await getWPData(GET_DIRECTORY_ENTRIES_BY_TYPE, { first: 8, typeSlug });
      relatedEntries = (rel?.cultureDirectories?.nodes ?? [])
        .filter((e: any) => e.slug !== slug)
        .slice(0, 5);
    } catch {}
  }

  const websiteUrl     = entry.websiteUrl     ?? "";
  const instagramHandle = entry.instagramHandle ?? "";
  const twitterHandle  = entry.twitterHandle   ?? "";

  return (
    <div className="dir-wiki-page">
      {/* ── Back link ── */}
      <div className="dir-wiki-topbar">
        <Link href="/directory" className="dir-back">← Culture Directory</Link>
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
                        <div className="dir-wiki-related-thumb">
                          <Image src={e.featuredImage.node.sourceUrl} alt={e.title} fill style={{ objectFit: "cover" }} />
                        </div>
                      )}
                      <span className="dir-wiki-related-title">{e.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="dir-wiki-sidebar-footer">
              <Link href={`/directory?type=${typeSlug}`} className="dir-wiki-see-all">
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
            <h1 className="dir-wiki-title" dangerouslySetInnerHTML={{ __html: entry.title }} />
            {entry.excerpt && (
              <p className="dir-wiki-lead" dangerouslySetInnerHTML={{ __html: entry.excerpt.replace(/<[^>]*>/g, "") }} />
            )}
            {date && <div className="dir-wiki-date">Added to directory {date}</div>}
          </div>

          {/* Body content */}
          <div className="dir-wiki-divider" />

          {canView ? (
            entry.content ? (
              <div className="dir-single-body" dangerouslySetInnerHTML={{ __html: entry.content }} />
            ) : (
              <p className="dir-wiki-no-content">Full article coming soon. Know this subject? Help us build it.</p>
            )
          ) : (
            <ContentGate accessLevel={accessLevel as "member-only" | "patron-only"} isLoggedIn={isLoggedIn} />
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
                      <div className="dir-wiki-work-img">
                        <Image src={w.imageUrl} alt={w.title} fill style={{ objectFit: "cover" }} />
                      </div>
                    )}
                    {w.title && <div className="dir-wiki-work-title">{w.title}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* RIGHT SIDEBAR — Infobox */}
        <aside className="dir-wiki-right">
          <div className="dir-wiki-infobox">
            {/* Featured image */}
            {img && (
              <div className="dir-wiki-infobox-img">
                <Image src={img} alt={entry.title ?? ""} fill style={{ objectFit: "cover" }} />
              </div>
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
