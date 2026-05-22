import { getWPData, GET_ALL_MAKERS } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import "./makers.css";

export const metadata = {
  title: { absolute: "Meet the Makers | The Moveee" },
  description:
    "Discover the vetted craftspeople behind every piece in the Moveee shop — personally reviewed for craft integrity, fair production, and lasting quality.",
};

export const revalidate = 3600;

const CMS = "https://cms.themoveee.com";

async function fetchMakers(): Promise<any[]> {
  // Try GraphQL first.
  try {
    const data = await getWPData(GET_ALL_MAKERS, { first: 60 });
    const gql = (data?.moveeeVendors ?? []) as any[];
    if (gql.length > 0) return gql;
  } catch { /* fall through */ }

  // Fall back to the plain REST endpoint added in plugin v1.4.6.
  try {
    const res = await fetch(`${CMS}/wp-json/moveee/v1/vendors?first=60`, {
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) return json;
    }
  } catch { /* fall through */ }

  return [];
}

export default async function MakersArchivePage() {
  const makers = await fetchMakers();

  return (
    <div className="makers-page">
      {/* ── Header ── */}
      <div className="makers-header">
        <div className="makers-header-left">
          <h1 className="makers-title">Meet the <em>Makers</em></h1>
        </div>
        <div className="makers-header-right">
          <p className="makers-desc">
            Every maker on Moveee is personally vetted for craft integrity,
            fair production practices, and lasting quality. These are the
            people behind the pieces.
          </p>
        </div>
      </div>

      {/* ── Grid ── */}
      {makers.length > 0 ? (
        <div className="makers-grid">
          {makers.map((maker: any) => {
            const location = [maker.city, maker.country].filter(Boolean).join(", ");
            const name     = maker.storeName || maker.display_name || "Unnamed Maker";
            return (
              <Link
                key={maker.slug}
                href={`/makers/${maker.slug}`}
                className="maker-card"
              >
                <div className="maker-card-img">
                  {maker.avatarUrl && (
                    <Image
                      src={maker.avatarUrl}
                      alt={name}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  <div className="maker-card-vetted">★ Vetted Maker</div>
                </div>
                <div className="maker-card-body">
                  <div className="maker-card-name">{name}</div>
                  {location && <div className="maker-card-loc">{location}</div>}
                  {maker.bio && <p className="maker-card-desc">{maker.bio}</p>}
                  <div className="maker-card-footer">
                    <span className="maker-card-count">
                      {maker.productCount ?? 0}{" "}
                      {maker.productCount === 1 ? "product" : "products"}
                    </span>
                    <span className="maker-card-cta">View maker →</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="makers-empty">
          <p>No makers found — check back soon.</p>
        </div>
      )}
    </div>
  );
}
