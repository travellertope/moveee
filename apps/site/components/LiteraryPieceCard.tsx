import Link from "next/link";
import { literaryGenreOfPost } from "@/lib/wp";
import { decodeHtml } from "@/lib/decode-html";

function plainExcerpt(html: string | undefined | null, max = 140): string {
  if (typeof html !== "string") return "";
  const text = decodeHtml(html);
  return text.length > max ? text.slice(0, max).trim() + "…" : text;
}

export default function LiteraryPieceCard({ piece }: { piece: any }) {
  const genre = literaryGenreOfPost(piece);
  const imageUrl = piece.featuredImage?.node?.sourceUrl as string | undefined;

  return (
    <Link href={`/literary/${piece.slug}`} className="piece">
      {imageUrl ? (
        <img className="piece-img" src={imageUrl} alt={piece.featuredImage?.node?.altText || ""} />
      ) : (
        <div className="piece-img piece-img--placeholder" aria-hidden="true" />
      )}
      <div className="lit-tag">{genre?.label || "The Moveee Literary"}</div>
      <h3 className="piece-title" dangerouslySetInnerHTML={{ __html: piece.title || "" }} />
      <p className="piece-dek">{plainExcerpt(piece.excerpt)}</p>
      <div className="piece-byline">{piece.author?.node?.name || "The Moveee Literary"}</div>
    </Link>
  );
}
