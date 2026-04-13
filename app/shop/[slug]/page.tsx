import { getWPData, GET_PRODUCT_BY_SLUG } from "@/lib/wp";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "../../sections.css";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: any = null;
  try {
    const data = await getWPData(GET_PRODUCT_BY_SLUG, { slug });
    product = data?.product ?? null;
  } catch { /* CMS unreachable */ }

  if (!product) notFound();

  const img = product.image?.sourceUrl;
  const gallery: any[] = product.galleryImages?.nodes ?? [];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "56px 60px 100px" }}>
      <Link href="/shop" className="sec-back">← Shop</Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "start" }}>
        {/* Images */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {img && (
            <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: "var(--ink)" }}>
              <Image src={img} alt={product.name} fill style={{ objectFit: "cover" }} />
            </div>
          )}
          {gallery.slice(0, 3).map((g: any, i: number) => (
            <div key={i} style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
              <Image src={g.sourceUrl} alt={g.altText || product.name} fill style={{ objectFit: "cover" }} />
            </div>
          ))}
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingTop: 8 }}>
          <h1 className="sec-single-title" style={{ margin: 0 }}>{product.name}</h1>
          {product.price && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, letterSpacing: ".04em", color: "var(--ink)" }}>
              {product.regularPrice && product.regularPrice !== product.price && (
                <span style={{ textDecoration: "line-through", color: "var(--mute)", marginRight: 12, fontSize: 14 }}>
                  {product.regularPrice}
                </span>
              )}
              {product.price}
            </div>
          )}
          {product.shortDescription && (
            <div
              style={{ fontSize: 15, color: "var(--ink-soft)", lineHeight: 1.6 }}
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}
          {product.description && (
            <div
              className="sec-single-body"
              style={{ fontSize: 15 }}
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
