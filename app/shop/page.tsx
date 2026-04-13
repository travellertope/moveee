import { getWPData, GET_PRODUCTS } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../sections.css";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop · The Moveee",
  description: "Curated lifestyle goods from vetted makers.",
};

export default async function ShopPage() {
  let products: any[] = [];
  try {
    const data = await getWPData(GET_PRODUCTS, { first: 24 });
    products = data?.products?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  return (
    <>
      <div className="sec-head">
        <div className="sec-head-inner">
          <div className="sec-head-left">
            <div className="sec-eyebrow">N°04 · Lifestyle</div>
            <h1 className="sec-title">The <em>Shop</em></h1>
          </div>
          <p className="sec-desc">
            Curated goods from vetted makers — things worth owning.
          </p>
        </div>
      </div>

      <div className="sec-body">
        {products.length === 0 ? (
          <div className="sec-grid">
            <p className="sec-empty">Shop coming soon.</p>
          </div>
        ) : (
          <div className="sec-grid">
            {products.map((p: any) => {
              const img = p.image?.sourceUrl;
              return (
                <Link key={p.id} href={`/shop/${p.slug}`} className="sec-card">
                  <div className="sec-card-img">
                    {img ? (
                      <Image src={img} alt={p.name} fill style={{ objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", background: "var(--ink)" }} />
                    )}
                  </div>
                  <h2 className="sec-card-title">{p.name}</h2>
                  {p.price && <div className="sec-card-price">{p.price}</div>}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
