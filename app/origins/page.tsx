import { getWPData, GET_JOURNEYS } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../sections.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Origins · The Moveee",
  description: "Journeys through culture, place, and identity.",
};

export default async function OriginsPage() {
  let journeys: any[] = [];
  try {
    const data = await getWPData(GET_JOURNEYS, { first: 24 });
    journeys = data?.posts?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  return (
    <>
      <div className="sec-head">
        <div className="sec-head-inner">
          <div className="sec-head-left">
            <div className="sec-eyebrow">N°03 · Origins</div>
            <h1 className="sec-title">Where We <em>Come From</em></h1>
          </div>
          <p className="sec-desc">
            Journeys through culture, place, and identity.
          </p>
        </div>
      </div>

      <div className="sec-body">
        {journeys.length === 0 ? (
          <div className="sec-grid">
            <p className="sec-empty">No journeys published yet — check back soon.</p>
          </div>
        ) : (
          <div className="sec-grid">
            {journeys.map((j: any) => {
              const img = j.featuredImage?.node?.sourceUrl;
              const cat = j.categories?.nodes?.[0]?.name;
              return (
                <Link key={j.id} href={`/origins/${j.slug}`} className="sec-card">
                  <div className="sec-card-img sec-card-img--portrait">
                    {img ? (
                      <Image src={img} alt={j.title} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  {cat && <div className="sec-card-kicker">{cat}</div>}
                  <h2 className="sec-card-title" dangerouslySetInnerHTML={{ __html: j.title }} />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
