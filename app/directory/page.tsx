import { getWPData, GET_DIRECTORY_ENTRIES } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../directory.css";

export const revalidate = 3600;

const TYPE_LABELS: Record<string, string> = {
  person: "Person",
  place: "Place",
  movement: "Movement",
  genre: "Genre",
  concept: "Concept",
  artwork: "Artwork",
  food: "Food & Drink",
  fashion: "Fashion",
};

export const metadata = {
  title: "Culture Directory · The Moveee",
  description:
    "A living wiki of African and diaspora culture — people, places, movements, genres, and more.",
};

export default async function DirectoryPage() {
  let entries: any[] = [];
  try {
    const data = await getWPData(GET_DIRECTORY_ENTRIES, { first: 100 });
    entries = data?.cultureDirectories?.nodes ?? [];
  } catch {}

  return (
    <>
      {/* ── HERO ── */}
      <section className="dir-hero">
        <div className="dir-hero-inner">
          <div className="dir-eyebrow">★ The Moveee</div>
          <h1 className="dir-heading">Culture Directory</h1>
          <p className="dir-subheading">
            A living wiki of African and diaspora culture — people, places,
            movements, genres, and more. Community-built. AI-assisted.
          </p>
          <Link href="/directory/submit" className="dir-hero-cta">
            Add an Entry →
          </Link>
        </div>
      </section>

      {/* ── GRID ── */}
      <div className="dir-wrap">
        {entries.length === 0 ? (
          <div className="dir-empty">
            <p>
              No entries yet.{" "}
              <Link href="/directory/submit">Be the first to add one →</Link>
            </p>
          </div>
        ) : (
          <div className="dir-grid">
            {entries.map((entry: any) => {
              const type = entry.cultureDirectoryTypes?.nodes?.[0];
              const img = entry.featuredImage?.node?.sourceUrl;
              const rawExcerpt = (entry.excerpt ?? "")
                .replace(/<[^>]*>/g, "")
                .trim();
              const excerpt =
                rawExcerpt.length > 120
                  ? rawExcerpt.slice(0, 120) + "…"
                  : rawExcerpt;

              return (
                <Link
                  key={entry.slug}
                  href={`/directory/${entry.slug}`}
                  className="dir-card"
                >
                  <div className={`dir-card-img${img ? "" : " dir-card-img--placeholder"}`}>
                    {img && (
                      <Image
                        src={img}
                        alt={entry.title ?? ""}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    )}
                  </div>
                  <div className="dir-card-body">
                    {type && (
                      <span className="dir-card-type">
                        {TYPE_LABELS[type.slug] ?? type.name}
                      </span>
                    )}
                    <h3
                      className="dir-card-title"
                      dangerouslySetInnerHTML={{ __html: entry.title }}
                    />
                    {excerpt && (
                      <p className="dir-card-excerpt">{excerpt}</p>
                    )}
                    {entry.cultureInterests?.nodes?.length > 0 && (
                      <div className="dir-card-tags">
                        {entry.cultureInterests.nodes
                          .slice(0, 3)
                          .map((t: any) => (
                            <span key={t.slug} className="dir-tag">
                              {t.name}
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="dir-submit-cta">
          <p>Know something we&rsquo;re missing?</p>
          <Link href="/directory/submit" className="dir-submit-link">
            Submit a new entry →
          </Link>
        </div>
      </div>
    </>
  );
}
