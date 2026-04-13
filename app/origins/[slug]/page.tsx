import { getWPData, GET_JOURNEY_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ContentGate from "@/components/ContentGate";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAccessLevel, canViewContent } from "@/lib/access";
import "../../sections.css";

export const dynamic = "force-dynamic";

export default async function OriginPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let journey: any = null;
  try {
    const data = await getWPData(GET_JOURNEY_BY_SLUG, { slug });
    journey = data?.post ?? null;
  } catch { /* CMS unreachable */ }

  if (!journey) notFound();

  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  const accessLevel = getAccessLevel(journey);
  const canView = canViewContent(accessLevel, user);
  const isLoggedIn = !!user;

  const img = journey.featuredImage?.node?.sourceUrl;
  const cat = journey.categories?.nodes?.[0]?.name;
  const date = journey.date
    ? new Date(journey.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="sec-single">
      <Link href="/origins" className="sec-back">← All Origins</Link>

      {cat && <div className="sec-card-kicker" style={{ marginBottom: 16 }}>{cat}</div>}
      <h1 className="sec-single-title" dangerouslySetInnerHTML={{ __html: journey.title }} />

      <div className="sec-single-meta">
        {date && <span>{date}</span>}
        {journey.author?.node?.name && <span>By {journey.author.node.name}</span>}
        {journey.countries?.nodes?.[0]?.name && <span>{journey.countries.nodes[0].name}</span>}
      </div>

      {img && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", marginBottom: 36 }}>
          <Image src={img} alt={journey.title} fill style={{ objectFit: "cover" }} />
        </div>
      )}

      {canView ? (
        journey.content && (
          <div
            className="sec-single-body"
            dangerouslySetInnerHTML={{ __html: journey.content }}
          />
        )
      ) : (
        <ContentGate
          accessLevel={accessLevel as "member-only" | "patron-only"}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
