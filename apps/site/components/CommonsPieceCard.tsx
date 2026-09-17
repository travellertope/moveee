import Link from "next/link";
import { commonsPieceHref, commonsSectionOfPost } from "@/lib/wp";
import { decodeHtml } from "@/lib/decode-html";

function plainExcerpt(html: string | undefined | null, max = 140): string {
  if (typeof html !== "string") return "";
  const text = decodeHtml(html);
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

function formattedDate(date: string | undefined | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// The one card component every Commons grid reuses (homepage, section
// archives, "More in {section}"). Deliberately text-first by default — an
// image renders only when the piece actually has one (`.comm-card--image`),
// never a placeholder gradient standing in for a missing photo. See the
// "text-first by default" design decision in CLAUDE.md's Commons entry:
// some publications simply don't have a featured image, and the layout
// must not structurally depend on one.
export default function CommonsPieceCard({ piece }: { piece: any }) {
  const section = commonsSectionOfPost(piece);
  const imageUrl = piece.featuredImage?.node?.sourceUrl as string | undefined;
  const author = piece.author?.node?.name || "The Moveee Commons";

  return (
    <Link href={commonsPieceHref(piece)} className={`comm-card${imageUrl ? " comm-card--image" : ""}`}>
      {imageUrl && (
        <img className="comm-card-img" src={imageUrl} alt={piece.featuredImage?.node?.altText || ""} />
      )}
      <span className="comm-card-kicker">{section?.label || "The Moveee Commons"}</span>
      <h3 className="comm-card-title" dangerouslySetInnerHTML={{ __html: piece.title || "" }} />
      <p className="comm-card-dek">{plainExcerpt(piece.excerpt)}</p>
      <div className="comm-card-byline">
        {author} · {formattedDate(piece.date)}
      </div>
    </Link>
  );
}
