import Link from "next/link";
import { literaryGenreOfPost } from "@/lib/wp";

function plainExcerpt(html: string | undefined | null, max = 140): string {
  if (typeof html !== "string") return "";
  const text = html.replace(/<[^>]*>/g, "").trim();
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

// Genre accent classes (.lit-poetry/.lit-fiction/.lit-nonfiction/
// .lit-translation, see literary.css) set a --lit-accent custom property
// that every lit-* class reads from — applying one here colors this card's
// kicker/top-rule without each card needing its own inline color logic.
export default function LiteraryPieceCard({ piece }: { piece: any }) {
  const genre = literaryGenreOfPost(piece);
  const genreClass = genre ? `lit-${genre.slug}` : "";

  return (
    <Link href={`/literary/${piece.slug}`} className={`lit-card ${genreClass}`}>
      <div className="lit-card-kicker">{genre?.label || "The Moveee Literary"}</div>
      <h3 dangerouslySetInnerHTML={{ __html: piece.title || "" }} />
      <p className="lit-card-dek">{plainExcerpt(piece.excerpt)}</p>
      <div className="lit-card-byline">{piece.author?.node?.name || "The Moveee Literary"}</div>
    </Link>
  );
}
