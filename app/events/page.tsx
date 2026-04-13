import { getWPData, GET_EVENTS } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../sections.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events · The Moveee",
  description: "Culture events across our chapters — RSVP, show up, earn points.",
};

export default async function EventsPage() {
  let events: any[] = [];
  try {
    const data = await getWPData(GET_EVENTS, { first: 24 });
    events = data?.posts?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  return (
    <>
      <div className="sec-head">
        <div className="sec-head-inner">
          <div className="sec-head-left">
            <div className="sec-eyebrow">N°02 · Events</div>
            <h1 className="sec-title">What&rsquo;s <em>On</em></h1>
          </div>
          <p className="sec-desc">
            Culture events across our chapters. RSVP, show up, earn points.
          </p>
        </div>
      </div>

      <div className="sec-body">
        {events.length === 0 ? (
          <div className="sec-grid">
            <p className="sec-empty">No upcoming events — check back soon.</p>
          </div>
        ) : (
          <div className="sec-grid">
            {events.map((event: any) => {
              const img = event.featuredImage?.node?.sourceUrl;
              const cat = event.categories?.nodes?.[0]?.name;
              const date = event.date
                ? new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                : null;
              return (
                <Link key={event.id} href={`/events/${event.slug}`} className="sec-card">
                  <div className="sec-card-img">
                    {img ? (
                      <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  {cat && <div className="sec-card-kicker">{cat}</div>}
                  <h2 className="sec-card-title" dangerouslySetInnerHTML={{ __html: event.title }} />
                  {date && <div className="sec-card-meta">{date}</div>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
