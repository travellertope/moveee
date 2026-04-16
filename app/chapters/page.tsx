import Link from "next/link";
import Image from "next/image";
import { getWPData, GET_CULTURE_CHAPTERS } from "@/lib/wp";
import Marquee from "@/components/Marquee";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chapters",
  description: "Moveee Chapters — local cultural communities across Africa and the diaspora.",
};

export default async function ChaptersPage() {
  let chapters: any[] = [];
  try {
    const data = await getWPData(GET_CULTURE_CHAPTERS, { first: 100 });
    chapters = data?.cultureChapters?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  return (
    <div className="bg-paper pb-24">

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(to bottom, #2a1208 0%, #14110d 60%, #0c0805 100%)", minHeight: 420 }}
      >
        <svg viewBox="0 0 1440 420" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="6" stroke="#f3ece0" strokeWidth=".4" opacity=".06"/>
            </pattern>
            <radialGradient id="g1" cx="20%" cy="50%" r="40%">
              <stop offset="0%" stopColor="#c5491f" stopOpacity=".3"/>
              <stop offset="100%" stopColor="#14110d" stopOpacity="0"/>
            </radialGradient>
            <radialGradient id="g2" cx="80%" cy="50%" r="35%">
              <stop offset="0%" stopColor="#3d4a2a" stopOpacity=".25"/>
              <stop offset="100%" stopColor="#14110d" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <rect width="1440" height="420" fill="url(#hatch)"/>
          <rect width="1440" height="420" fill="url(#g1)"/>
          <rect width="1440" height="420" fill="url(#g2)"/>
          <g opacity=".06" stroke="#f3ece0" strokeWidth="1">
            <line x1="240" y1="0" x2="240" y2="420"/>
            <line x1="480" y1="0" x2="480" y2="420"/>
            <line x1="720" y1="0" x2="720" y2="420"/>
            <line x1="960" y1="0" x2="960" y2="420"/>
            <line x1="1200" y1="0" x2="1200" y2="420"/>
          </g>
        </svg>

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 flex flex-col gap-6">
          <div className="font-mono text-[11px] text-ochre uppercase tracking-widest">
            N°01 · Global Network
          </div>
          <h1
            className="font-serif text-paper leading-tight"
            style={{ fontSize: "clamp(2.5rem, 6vw, 5rem)" }}
          >
            Moveee<br /><em>Chapters</em>.
          </h1>
          <p className="font-serif italic text-paper/60 text-xl max-w-2xl">
            Local nodes of the global Moveee network. Find your city, join a chapter, and connect with culture-curious people near you.
          </p>
          <div className="flex gap-10 mt-4">
            <div>
              <div className="font-mono text-ochre text-3xl font-bold">{chapters.length || "—"}</div>
              <div className="font-mono text-[10px] text-paper/40 uppercase tracking-widest mt-1">Active Chapters</div>
            </div>
            <div>
              <div className="font-mono text-ochre text-3xl font-bold">Global</div>
              <div className="font-mono text-[10px] text-paper/40 uppercase tracking-widest mt-1">Network</div>
            </div>
          </div>
        </div>
      </section>

      <Marquee />

      {/* ── GRID ── */}
      <section className="max-w-6xl mx-auto px-6 py-16">

        {chapters.length === 0 ? (
          <p className="text-center py-20 font-serif italic text-2xl text-mute">
            No chapters yet — check back soon.
          </p>
        ) : (
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}
          >
            {chapters.map((chapter) => {
              const img = chapter.featuredImage?.node?.sourceUrl;
              const interest = chapter.cultureInterests?.nodes?.[0]?.name;

              return (
                <Link
                  key={chapter.id}
                  href={`/chapters/${chapter.slug}`}
                  className="group block bg-white border border-rule/10 overflow-hidden hover:border-ochre/40 transition-colors"
                >
                  <div className="relative" style={{ paddingBottom: "60%", background: "#1a1410" }}>
                    {img ? (
                      <Image
                        src={img}
                        alt={chapter.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 400 240"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute inset-0 w-full h-full"
                      >
                        <rect width="400" height="240" fill="#14110d"/>
                        <circle cx="200" cy="120" r="70" fill="#c5491f" opacity=".08"/>
                        <circle cx="200" cy="120" r="40" fill="#b38238" opacity=".1"/>
                        <text x="200" y="128" textAnchor="middle" fill="#f3ece0" opacity=".15"
                          fontFamily="serif" fontSize="48">✦</text>
                      </svg>
                    )}
                    {interest && (
                      <span
                        className="absolute top-3 left-3 font-mono text-[9px] uppercase tracking-widest px-2 py-1"
                        style={{ background: "#c5491f", color: "#f3ece0" }}
                      >
                        {interest}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3
                      className="font-serif italic text-xl text-ink leading-snug mb-2 group-hover:text-ochre transition-colors"
                      dangerouslySetInnerHTML={{ __html: chapter.title }}
                    />
                    {chapter.excerpt && (
                      <p
                        className="font-serif text-sm text-ink/60 line-clamp-2 mb-4"
                        dangerouslySetInnerHTML={{
                          __html: chapter.excerpt.replace(/<[^>]*>/g, ""),
                        }}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-ochre">
                        {chapter.lat && chapter.lng ? "📍 Located" : "Global"}
                      </span>
                      <span className="font-mono text-[10px] border-b border-ink/20 group-hover:border-ochre transition-colors">
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* ── CTA BAND ── */}
      <section
        className="mx-auto max-w-6xl px-6 py-16 border-t border-rule/10 mt-8"
      >
        <div className="flex flex-col md:flex-row gap-10 items-start md:items-center justify-between">
          <div>
            <div className="font-mono text-[10px] text-ochre uppercase tracking-widest mb-3">Don&rsquo;t see your city?</div>
            <h3 className="font-serif italic text-3xl text-ink mb-2">
              Start a <em>Chapter</em>.
            </h3>
            <p className="font-serif text-ink/60 text-base max-w-md">
              Moveee Chapters are member-led. If you&rsquo;re building culture in your city, get in touch and we&rsquo;ll help you launch.
            </p>
          </div>
          <Link
            href="/connect"
            className="inline-block font-mono text-[11px] uppercase tracking-widest px-6 py-3 border border-ink hover:bg-ink hover:text-paper transition-colors whitespace-nowrap"
          >
            Become a Member →
          </Link>
        </div>
      </section>
    </div>
  );
}
