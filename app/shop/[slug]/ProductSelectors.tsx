"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

interface VariationAttribute { name: string; value: string; }
interface Variation {
  price?: string;
  stockStatus?: string;
  attributes?: { nodes: VariationAttribute[] };
}

interface ProductSelectorsProps {
  productId: number;
  price?: string;
  regularPrice?: string;
  variations?: Variation[];
}

export default function ProductSelectors({
  productId,
  price,
  regularPrice,
  variations,
}: ProductSelectorsProps) {
  const { addItem, isLoading } = useCart();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize]   = useState(0);
  const [saved, setSaved]                 = useState(false);

  const colorAttrs = extractAttr(variations, "color");
  const sizeAttrs  = extractAttr(variations, "size");

  return (
    <>
      {/* Price */}
      <div className="sp-price-row">
        <div>
          {regularPrice && regularPrice !== price && (
            <span style={{ textDecoration: "line-through", color: "var(--mute)", fontSize: 14, marginRight: 10 }}>
              {regularPrice}
            </span>
          )}
          <span className="sp-price">{price ?? "—"}</span>
        </div>
        <span className="sp-price-sub">GBP</span>
        <div className="sp-price-member">
          Connect members save <strong>10%</strong>
        </div>
      </div>

      {/* Colour selector — only rendered when WooCommerce has colour variations */}
      {colorAttrs.length > 0 && (
        <div className="sp-selector-group">
          <div className="sp-selector-label">
            <span className="label">Colour</span>
            <span className="value">{colorAttrs[selectedColor]}</span>
          </div>
          <div className="sp-swatches">
            {colorAttrs.map((c, i) => (
              <button
                key={i}
                className={`sp-swatch${i === selectedColor ? " active" : ""}`}
                onClick={() => setSelectedColor(i)}
                aria-label={c}
                style={{ border: "1px solid var(--rule)", cursor: "pointer" }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Size selector — only rendered when WooCommerce has size variations */}
      {sizeAttrs.length > 0 && (
        <div className="sp-selector-group">
          <div className="sp-selector-label">
            <span className="label">Size</span>
            <span className="value">{sizeAttrs[selectedSize]}</span>
          </div>
          <div className="sp-sizes">
            {sizeAttrs.map((s, i) => (
              <button
                key={i}
                className={`sp-size-btn${i === selectedSize ? " active" : ""}`}
                onClick={() => setSelectedSize(i)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="sp-cta-row">
        <button
          className="sp-btn-add"
          onClick={() => addItem(productId)}
          disabled={isLoading}
          style={{ opacity: isLoading ? 0.7 : 1 }}
        >
          {isLoading ? "Adding…" : "Add to Cart"}
          {!isLoading && <span>→</span>}
        </button>
        <button
          className="sp-btn-save"
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Remove from saved" : "Save item"}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <div className="sp-delivery-note">
        <div>
          <span className="label">Delivery</span>
          <strong>3–5 working days</strong>
        </div>
        <div style={{ textAlign: "right" }}>
          <span className="label">Returns</span>
          <strong>Free within 30 days</strong>
        </div>
      </div>
    </>
  );
}

function extractAttr(variations: Variation[] | undefined, name: string): string[] {
  if (!variations?.length) return [];
  const seen = new Set<string>();
  for (const v of variations) {
    for (const attr of v.attributes?.nodes ?? []) {
      if (attr.name.toLowerCase() === name) seen.add(attr.value);
    }
  }
  return [...seen];
}
