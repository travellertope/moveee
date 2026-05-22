import { getWPData, GET_CHAPTERS } from "@/lib/wp";
import ChapterHero from "./components/ChapterHero";
import ChapterCard from "./components/ChapterCard";
import Marquee from "@/components/Marquee";
import "@/app/chapters.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Chapters | The Moveee",
  description: "Find your local Moveee chapter — city-based communities for African and diaspora creatives, culture lovers, and professionals across the globe.",
};

export default async function ChaptersPage() {
  let chapters: any[] = [];
  try {
    const data = await getWPData(GET_CHAPTERS, { first: 100 }, { revalidate: 0 });
    chapters = data?.cultureChapters?.nodes ?? [];
  } catch (error) {
    console.error("Error fetching chapters:", error);
  }

  return (
    <div className="bg-paper pb-24">
      {/* ── HERO ── */}
      <ChapterHero 
        title="Moveee<br><em>Chapters</em>."
        subtitle="Our global footprint. Join a localized network of creators, thinkers, and explorers who are collective building the future of African identity in their cities."
      />

      <Marquee />

      {/* ── GRID ── */}
      <section className="chapters-section">
        {chapters.length === 0 ? (
          <p className="textAlign-center py-20 font-serif italic text-2xl text-mute">
            No chapters found yet. Check back soon!
          </p>
        ) : (
          <div className="chapters-grid">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.id} chapter={chapter} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA BAND ── */}
      <section className="connect-band">
        <div className="connect-inner">
          <div>
            <div className="connect-num">Collective Action</div>
            <h3>Community is <em>essential</em>.</h3>
            <p>Don't see a chapter in your city? Reach out to our community team to learn about the process of starting a new Moveee outpost and leading your local creative ecosystem.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <a href="mailto:community@themoveee.com" className="btn-gold">Start a Chapter →</a>
          </div>
        </div>
      </section>
    </div>
  );
}
