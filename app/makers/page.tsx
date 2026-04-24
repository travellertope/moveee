import { getWPData, GET_ALL_MAKERS } from "@/lib/wp";
import Image from "next/image";
import Link from "next/link";
import "./makers.css";

export const metadata = {
  title: "Meet the Makers | The Moveee",
  description:
    "Discover the vetted craftspeople behind every piece in the Moveee shop — personally reviewed for craft integrity, fair production, and lasting quality.",
};

export const dynamic = "force-dynamic";

export default async function MakersArchivePage() {
  let makers: any[] = [];
  try {
    const data = await getWPData(GET_ALL_MAKERS, { first: 60 });
    makers = (data?.moveeeVendors ?? []).filter((m: any) => m.storeName);
  } catch { /* CMS unreachable — render empty state */ }

  return (
    <div className="makers-page">
      {/* ── Header ── */}
      <div className="makers-header">
        <div className="makers-header-left">
          <div className="makers-eyebrow">N°05 · The Makers</div>
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
                      alt={maker.storeName}
                      fill
                      style={{ objectFit: "cover" }}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  )}
                  <div className="maker-card-vetted">★ Vetted Maker</div>
                </div>
                <div className="maker-card-body">
                  <div className="maker-card-name">{maker.storeName}</div>
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
