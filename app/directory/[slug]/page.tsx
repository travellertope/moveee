import { getWPData, GET_DIRECTORY_ENTRY_BY_SLUG } from "@/lib/wp";
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
  person: "Person",
  place: "Place",
  movement: "Movement",
  genre: "Genre",
  concept: "Concept",
  artwork: "Artwork",
  food: "Food & Drink",
  fashion: "Fashion",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let data;
  try {
    data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  } catch {}
  const entry = data?.cultureDirectory;
  if (!entry) return { title: "Culture Directory · The Moveee" };

  const imageUrl = entry.featuredImage?.node?.sourceUrl || "/og-fallback.png";

  return {
    title: `${entry.title} · Culture Directory · The Moveee`,
    description: entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
    openGraph: {
      title: entry.title,
      description: entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
      images: [imageUrl],
    },
  };
}

export default async function DirectoryEntryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await getWPData(GET_DIRECTORY_ENTRY_BY_SLUG, { slug });
  } catch (err: any) {
    console.error("DirectoryEntryPage getWPData error:", err);
  }

  const entry = data?.cultureDirectory;
  if (!entry) notFound();

  // Access control (supports member-only / patron-only entries)
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const accessLevel = getAccessLevel(entry);
  const canView = canViewContent(accessLevel, user);
  const isLoggedIn = !!user;

  const type = entry.cultureDirectoryTypes?.nodes?.[0];
  const img = entry.featuredImage?.node?.sourceUrl;
  const date = entry.date
    ? new Date(entry.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="dir-single">
      <Link href="/directory" className="dir-back">
        ← Culture Directory
      </Link>

      {/* ── ENTRY HERO ── */}
      <div className="dir-single-hero">
        {img && (
          <div className="dir-single-img">
            <Image
              src={img}
              alt={entry.title ?? ""}
              fill
              style={{ objectFit: "cover" }}
            />
          </div>
        )}

        {type && (
          <span className="dir-single-type">
            {TYPE_LABELS[type.slug] ?? type.name}
          </span>
        )}

        <h1
          className="dir-single-title"
          dangerouslySetInnerHTML={{ __html: entry.title }}
        />

        {entry.excerpt && (
          <p
            className="dir-single-standfirst"
            dangerouslySetInnerHTML={{
              __html: entry.excerpt.replace(/<[^>]*>/g, ""),
            }}
          />
        )}

        {date && <div className="dir-single-date">Added {date}</div>}
      </div>

      {/* ── BODY ── */}
      {canView ? (
        entry.content && (
          <div
            className="dir-single-body"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        )
      ) : (
        <ContentGate
          accessLevel={accessLevel as "member-only" | "patron-only"}
          isLoggedIn={isLoggedIn}
        />
      )}

      {/* ── TAGS ── */}
      {entry.cultureInterests?.nodes?.length > 0 && (
        <div className="dir-single-tags">
          <div className="dir-tags-label">Topics</div>
          <div className="dir-tags-list">
            {entry.cultureInterests.nodes.map((t: any) => (
              <span key={t.slug} className="dir-tag">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── IMPROVE CTA ── */}
      <div className="dir-improve-cta">
        <div className="dir-improve-label">★ Community Wiki</div>
        <p>Know more about this entry? Help improve it.</p>
        <Link
          href={`/directory/submit?improve=${slug}`}
          className="dir-improve-btn"
        >
          Improve this entry →
        </Link>
      </div>
    </div>
  );
}
