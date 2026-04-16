import React from "react";
import { getWPData, GET_PRODUCTS } from "@/lib/wp";
import Link from "next/link";
import Image from "next/image";
import "../sections.css";

interface ShopArchiveProps {
  category?: string;
  tag?: string;
  brand?: string;
}

export default async function ShopArchiveWrapper({ 
  category, 
  tag, 
  brand 
}: ShopArchiveProps) {
  let products: any[] = [];
  try {
    const data = await getWPData(GET_PRODUCTS, { 
      first: 24,
      category: category || null,
      tag: tag || null,
      brand: brand || null
    });
    products = data?.products?.nodes ?? [];
  } catch { /* CMS unreachable */ }

  const isFiltered = !!(category || tag || brand);
  const activeTitle = category || tag || brand || "";

  return (
    <>
      <div className="sec-head">
        <div className="sec-head-inner">
          <div className="sec-head-left">
            <div className="sec-eyebrow">N°04 · {isFiltered ? activeTitle : "Lifestyle"}</div>
            <h1 className="sec-title">{isFiltered ? <em>{activeTitle}</em> : <>The <em>Shop</em></>}</h1>
          </div>
          <p className="sec-desc">
            {isFiltered 
              ? `Browse our curated collection of ${activeTitle} goods from vetted makers.`
              : "Curated goods from vetted makers — things worth owning."
            }
          </p>
        </div>
      </div>

      <div className="sec-body">
        {products.length === 0 ? (
          <div className="sec-grid">
            <p className="sec-empty">No products found matching this filter.</p>
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
