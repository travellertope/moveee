"use client";
import { sanitizeHtml } from "@/lib/sanitize";

import { useState } from "react";
import Link from "next/link";
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
  memberPrice?: string;   // HTML price string for patron members
  isPro?: boolean;
  isLoggedIn?: boolean;
  isGated?: boolean;      // true = early access active and user is not Pro
}

export default function ProductSelectors({
  productId,
  price,
  regularPrice,
  variations,
  memberPrice,
  isPro,
  isLoggedIn,
  isGated,
}: ProductSelectorsProps) {
  const { addItem, isLoading } = useCart();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize]   = useState(0);
  const [saved, setSaved]                 = useState(false);
  const [quantity, setQuantity]           = useState(1);

  const colorAttrs = extractAttr(variations, "color");
  const sizeAttrs  = extractAttr(variations, "size");

  const showMemberPrice = memberPrice && isPro;
  const showMemberPriceTeaser = memberPrice && !isPro;

  return (
    <>
      {/* Price */}
      <div className="sp-price-row">
        <div className="sp-price-stack">
          {showMemberPrice ? (
            // Pro member sees the discounted price prominently
            <>
              <div className="sp-price-pro-label">★ Your Pro price</div>
              <div>
                {price && (
                  <span style={{ textDecoration: "line-through", color: "var(--mute)", fontSize: 14, marginRight: 10 }}>
                    {price}
                  </span>
                )}
                <span
                  className="sp-price"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(memberPrice) }}
                />
              </div>
            </>
          ) : (
            <div>
              {regularPrice && regularPrice !== price && (
                <span style={{ textDecoration: "line-through", color: "var(--mute)", fontSize: 14, marginRight: 10 }}>
                  {regularPrice}
                </span>
              )}
              <span className="sp-price">{price ?? "—"}</span>
            </div>
          )}
        </div>
        <span className="sp-price-sub">GBP</span>
        {showMemberPriceTeaser ? (
          // Non-Pro user: show teaser for the member price
          <div className="sp-price-member sp-price-member--teaser">
            <span>Pro member price available</span>
            <Link href="/connect/membership" className="sp-price-member-link">
              {isLoggedIn ? "Upgrade →" : "Join Pro →"}
            </Link>
          </div>
        ) : !showMemberPrice ? (
          <div className="sp-price-member">
            Moveee Pro members get exclusive pricing
          </div>
        ) : null}
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
      {!isGated && (
        <div className="sp-qty">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">–</button>
          <span>{quantity}</span>
          <button type="button" onClick={() => setQuantity((q) => q + 1)} aria-label="Increase quantity">+</button>
        </div>
      )}
      <div className="sp-cta-row">
        {isGated ? (
          // Early access gate — show upgrade CTA instead of add-to-cart
          <Link href="/connect/membership" className="sp-btn-add sp-btn-add--gated">
            <span>★</span> Get early access
          </Link>
        ) : (
          <button
            className="sp-btn-add"
            onClick={() => addItem(productId, quantity)}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? "Adding…" : "Add to Cart"}
            {!isLoading && <span>→</span>}
          </button>
        )}
        <button
          className="sp-btn-save"
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Remove from saved" : "Save item"}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      <div className="sp-buy-notes">
        <div className="sp-buy-note"><span className="ic">↺</span> Free returns within 30 days</div>
        <div className="sp-buy-note"><span className="ic">◇</span> Ships in 3–5 working days</div>
      </div>

      {/* Mobile-only sticky bar — mirrors the buy box, hidden ≥640px via CSS */}
      <div className="sp-mobile-bar">
        <div className="sp-mobile-bar-price">
          {showMemberPrice ? (
            <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(memberPrice!) }} />
          ) : (
            <span>{price ?? "—"}</span>
          )}
          {showMemberPriceTeaser && <span className="sub">Pro price available</span>}
        </div>
        {isGated ? (
          <Link href="/connect/membership" className="sp-mobile-bar-cta">
            Get early access
          </Link>
        ) : (
          <button
            className="sp-mobile-bar-cta"
            onClick={() => addItem(productId, quantity)}
            disabled={isLoading}
          >
            {isLoading ? "Adding…" : "Add to Cart"}
          </button>
        )}
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
