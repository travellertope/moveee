import { getWPData, GET_EVENT_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../../sections.css";

export const dynamic = "force-dynamic";

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let event: any = null;
  try {
    const data = await getWPData(GET_EVENT_BY_SLUG, { slug });
    event = data?.post ?? null;
  } catch { /* CMS unreachable */ }

  if (!event) notFound();

  const img = event.featuredImage?.node?.sourceUrl;
  const cat = event.categories?.nodes?.[0]?.name;
  const date = event.date
    ? new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="sec-single">
      <Link href="/events" className="sec-back">← All Events</Link>

      {cat && <div className="sec-card-kicker" style={{ marginBottom: 16 }}>{cat}</div>}
      <h1 className="sec-single-title" dangerouslySetInnerHTML={{ __html: event.title }} />

      <div className="sec-single-meta">
        {date && <span>{date}</span>}
        {event.author?.node?.name && <span>By {event.author.node.name}</span>}
        {event.countries?.nodes?.[0]?.name && <span>{event.countries.nodes[0].name}</span>}
      </div>

      {img && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", marginBottom: 36 }}>
          <Image src={img} alt={event.title} fill style={{ objectFit: "cover" }} />
        </div>
      )}

      {event.content && (
        <div
          className="sec-single-body"
          dangerouslySetInnerHTML={{ __html: event.content }}
        />
      )}
    </div>
  );
}
