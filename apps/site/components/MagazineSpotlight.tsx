import Link from "next/link";
import Image from "next/image";

interface Props {
  latestIssue?: any;
}

/*
  DEV: Wire the Latest Issue card to the same data source as the existing Latest Issue
  module further down the page (getNewslettersWithFallback / latest culture_edition query
  in lib/wp.ts) — do not duplicate the fetch, reuse the already-fetched latest-issue data
  passed into HomepageContent.tsx so this card and the existing Latest Issue module never
  go out of sync.
*/
export default function MagazineSpotlight({ latestIssue }: Props) {
  if (!latestIssue) return null;

  const editorialExcerpt = (() => {
    const src = latestIssue.meta?.issue_editorial_note || "";
    const plain = src.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return plain.length > 180 ? plain.slice(0, 180).replace(/\s\S+$/, "") + "…" : plain;
  })();

  return (
    <section className="ms-section">
      <div className="ms-intro">
        <p className="ms-eyebrow">Moveee Magazine</p>
        <h2 className="ms-h2">The reporting behind the community.</h2>
        <p className="ms-body">
          Everything Moveee&apos;s community surfaces starts somewhere — Moveee Magazine is our
          independent editorial team covering the music, film, art, fashion, food and ideas
          worth knowing about.
        </p>
      </div>

      <div className="ms-issue-card">
        {latestIssue.meta?.issue_cover_image_url && (
          <Link href={`/magazine/issues/${latestIssue.slug}`} className="ms-issue-cover">
            <Image
              src={latestIssue.meta.issue_cover_image_url}
              alt={latestIssue.name}
              fill
              className="object-cover"
            />
          </Link>
        )}
        <div className="ms-issue-text">
          <span className="ms-issue-label">
            {latestIssue.meta?.issue_number ? `Issue ${latestIssue.meta.issue_number}` : latestIssue.name}
          </span>
          <h3 className="ms-issue-title">{latestIssue.name}</h3>
          {latestIssue.meta?.issue_subtitle && (
            <p className="ms-issue-dek">{latestIssue.meta.issue_subtitle}</p>
          )}
          {editorialExcerpt && (
            <p className="ms-issue-excerpt">{editorialExcerpt}</p>
          )}
          <Link href={`/magazine/issues/${latestIssue.slug}`} className="ms-btn-primary">
            Read the latest issue
          </Link>
          <Link href="/magazine/issues" className="ms-archive-link">Browse the archive →</Link>
        </div>
      </div>
    </section>
  );
}
