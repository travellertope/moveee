import Link from "next/link";
import { getCommonsAuthorArchive, COMMONS_AUTHOR_NAME } from "@/lib/wp";
import CommonsPieceCard from "@/components/CommonsPieceCard";

// A static route, not a third meaning for /commons/[slug] — Next.js
// resolves static segments before dynamic ones, so this can't collide with
// that route's section-archive/piece-lookup branching (same reasoning
// Literary's own [slug] route documents for its own static children, e.g.
// /literary/submit).
//
// The exhaustive, paginated counterpart to the homepage's small "Latest"
// rail — see getCommonsAuthorArchive()'s own doc comment in wp.ts for why
// that one exists separately from getCommonsPieces(). Plain `?page=`
// search-param pagination, server-rendered — no client JS needed since the
// merged list is already fully in memory by the time this renders.
export const metadata = {
  title: { absolute: `Reporting by ${COMMONS_AUTHOR_NAME} | The Moveee Commons` },
  description: `Every piece published by ${COMMONS_AUTHOR_NAME} for The Moveee Commons.`,
};

export default async function CommonsWriterArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const resolvedParams = await searchParams;
  const page = Math.max(1, parseInt(resolvedParams?.page || "1", 10) || 1);
  const { pieces, total, hasMore } = await getCommonsAuthorArchive(page, 20);

  return (
    <div className="comm-wrap">
      <section className="comm-section-head" style={{ marginTop: 32 }}>
        <h2>
          Reporting by <em>{COMMONS_AUTHOR_NAME}</em>
        </h2>
        <span className="comm-view-all comm-archive-count">
          {total} piece{total === 1 ? "" : "s"}
        </span>
      </section>

      {pieces.length === 0 ? (
        <div className="comm-empty">
          <p>{page > 1 ? "No more pieces to show." : "Nothing published yet."}</p>
        </div>
      ) : (
        <div className="comm-grid">
          {pieces.map((piece: any) => (
            <CommonsPieceCard key={piece.slug} piece={piece} />
          ))}
        </div>
      )}

      <nav className="comm-archive-pagination">
        {page > 1 ? (
          <Link href={page === 2 ? "/commons/writer" : `/commons/writer?page=${page - 1}`}>&larr; Newer</Link>
        ) : (
          <span />
        )}
        {hasMore && <Link href={`/commons/writer?page=${page + 1}`}>Older &rarr;</Link>}
      </nav>
    </div>
  );
}
