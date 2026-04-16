import { getWPData, GET_CULTURE_CHAPTER_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

export default async function ChapterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let chapter: any = null;
  try {
    const data = await getWPData(GET_CULTURE_CHAPTER_BY_SLUG, { slug });
    chapter = data?.cultureChapter ?? null;
  } catch { /* CMS unreachable */ }

  if (!chapter) notFound();

  const img = chapter.featuredImage?.node?.sourceUrl;
  const interests = chapter.cultureInterests?.nodes ?? [];

  return (
    <article className="bg-paper min-h-screen">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden flex items-end"
        style={{ minHeight: 480, background: "#14110d" }}
      >
        {img ? (
          <Image src={img} alt={chapter.title} fill className="object-cover opacity-50" priority />
        ) : (
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #2a1208, #14110d)" }} />
        )}
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, #14110d 20%, transparent 70%)" }} />

        <div className="relative z-10 max-w-4xl mx-auto px-6 pb-14 pt-24 w-full">
          <div className="flex gap-2 flex-wrap mb-4">
            <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-1"
              style={{ background: "#c5491f", color: "#f3ece0" }}>
              Chapter
            </span>
            {interests.map((i: any) => (
              <span key={i.slug} className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-paper/20 text-paper/60">
                {i.name}
              </span>
            ))}
          </div>
          <h1
            className="font-serif text-paper leading-tight mb-4"
            style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
            dangerouslySetInnerHTML={{ __html: chapter.title }}
          />
          {chapter.excerpt && (
            <p
              className="font-serif italic text-paper/60 text-lg max-w-2xl"
              dangerouslySetInnerHTML={{ __html: chapter.excerpt.replace(/<[^>]*>/g, "") }}
            />
          )}
        </div>
      </section>

      {/* ── BODY ── */}
      <div className="max-w-4xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_280px] gap-12">

        {/* Content */}
        <div>
          {chapter.content ? (
            <div
              className="prose-content font-serif text-lg leading-relaxed text-ink/80"
              dangerouslySetInnerHTML={{ __html: chapter.content }}
            />
          ) : (
            <p className="font-serif italic text-ink/40 text-lg">
              More details about this chapter coming soon.
            </p>
          )}
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-6">
          <div className="border border-rule/10 p-6">
            <div className="font-mono text-[9px] uppercase tracking-widest text-ochre mb-4">Chapter Info</div>

            {(chapter.lat && chapter.lng) && (
              <div className="mb-4">
                <div className="font-mono text-[9px] text-ink/40 uppercase mb-1">Coordinates</div>
                <p className="font-serif italic text-ink text-sm">
                  {parseFloat(chapter.lat).toFixed(4)}, {parseFloat(chapter.lng).toFixed(4)}
                </p>
              </div>
            )}

            {interests.length > 0 && (
              <div className="mb-4">
                <div className="font-mono text-[9px] text-ink/40 uppercase mb-2">Interests</div>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i: any) => (
                    <span key={i.slug}
                      className="font-mono text-[9px] uppercase tracking-widest px-2 py-1 border border-rule/20 text-ink/60">
                      {i.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link
              href="/connect"
              className="block w-full text-center font-mono text-[10px] uppercase tracking-widest px-4 py-3 mt-4 border border-ink hover:bg-ink hover:text-paper transition-colors"
            >
              Join this Chapter →
            </Link>
          </div>

          <Link
            href="/chapters"
            className="font-mono text-[10px] border-b border-ink/20 hover:border-ochre transition-colors self-start"
          >
            ← All Chapters
          </Link>
        </aside>
      </div>
    </article>
  );
}
