import { getWPData, GET_CHAPTER_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ChapterHero from "../components/ChapterHero";
import ChapterMap from "../components/ChapterMap";
import EventCard from "../../events/components/EventCard";
import "@/app/chapters.css";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getWPData(GET_CHAPTER_BY_SLUG, { slug });
  const chapter = data?.cultureChapter;
  
  return {
    title: chapter?.title ? `${chapter.title} | Moveee Chapters` : "Chapter",
    description: chapter?.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || "Join a Moveee chapter.",
  };
}

export default async function ChapterSinglePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let chapter: any = null;
  
  try {
    const data = await getWPData(GET_CHAPTER_BY_SLUG, { slug });
    chapter = data?.cultureChapter ?? null;
  } catch (error) {
    console.error("Error fetching single chapter:", error);
  }

  if (!chapter) notFound();

  const featuredImg = chapter.featuredImage?.node?.sourceUrl;
  const upcomingEvents = chapter.relatedEvents || [];

  return (
    <article className="chapter-single bg-paper">
      {/* ── IMMERSIVE HERO ── */}
      <section className="chapter-single-hero">
        {featuredImg ? (
          <Image src={featuredImg} alt={chapter.title} fill className="object-cover" priority />
        ) : (
          <div className="absolute inset-0 bg-ink" />
        )}
        <div className="overlay" />
        <div className="content">
          <ChapterHero title={chapter.title} isSingle={true} />
        </div>
      </section>

      <div className="chapter-body-grid">
        {/* ── CONTENT AREA ── */}
        <div className="chapter-content-wrap">
          <div 
            className="chapter-content prose-content"
            dangerouslySetInnerHTML={{ __html: chapter.content }}
          />

          {chapter.latitude && chapter.longitude && (
            <div className="chapter-location-section mt-16">
              <h2 className="font-serif italic text-3xl mb-8">Location</h2>
              <ChapterMap 
                lat={chapter.latitude} 
                lng={chapter.longitude} 
                title={chapter.title} 
              />
            </div>
          )}

          {/* ── EVENTS INTEGRATION ── */}
          {upcomingEvents.length > 0 && (
            <div className="chapter-upcoming-events mt-16">
              <h2 className="font-serif italic text-3xl mb-8">Upcoming Events</h2>
              <div className="events-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {upcomingEvents.map((event: any) => (
                  <EventCard 
                    key={event.id}
                    slug={event.slug}
                    title={event.title}
                    date={new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
                    location={event.location || "Venue TBA"}
                    time="18:00" // Default time
                    category={event.cultureInterests?.nodes[0]?.name || "Chapter Event"}
                    image={event.featuredImage?.node?.sourceUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <aside className="chapter-sidebar">
          <div className="sidebar-widget chapter-stats">
            <h3>Community Stats</h3>
            <div className="stat">
              <span className="value">{chapter.memberCount || 0}</span>
              <span className="label">Registered Members</span>
            </div>
            {chapter.leaderName && (
              <div className="stat">
                <span className="value" style={{ fontSize: '24px' }}>{chapter.leaderName}</span>
                <span className="label">Chapter Leader</span>
              </div>
            )}
          </div>

          <div className="sidebar-widget">
            <h3>Interests</h3>
            <div className="cc-interests flex-wrap">
              {chapter.cultureInterests?.nodes.map((interest: any) => (
                <span key={interest.slug} className="cc-tag px-3 py-1 border border-rule mb-2">
                  {interest.name}
                </span>
              ))}
            </div>
          </div>

          <Link href="/chapters" className="font-mono text-[10px] uppercase border-b border-ink self-start mt-4">
            ← View All Chapters
          </Link>
        </aside>
      </div>
    </article>
  );
}
