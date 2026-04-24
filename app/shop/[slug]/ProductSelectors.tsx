"use client";

import { useState, useEffect, useCallback } from "react";

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

type CartStatus = "idle" | "adding" | "added" | "error";

export default function ProductSelectors({
  productId,
  price,
  regularPrice,
  variations,
}: ProductSelectorsProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize]   = useState(0);
  const [saved, setSaved]                 = useState(false);
  const [cartStatus, setCartStatus]       = useState<CartStatus>("idle");
  const [nonce, setNonce]                 = useState<string | null>(null);

  // Fetch WooCommerce nonce on mount.
  // WC Store API returns it as the X-WC-Store-API-Nonce response header;
  // some versions also include it in the JSON body as a fallback.
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => {
        const headerNonce = r.headers.get("x-wc-store-api-nonce");
        if (headerNonce) setNonce(headerNonce);
        return r.json().then((data) => ({ data, headerNonce }));
      })
      .then(({ data, headerNonce }) => {
        if (!headerNonce) {
          const bodyNonce = data?.extensions?.["woocommerce-blocks"]?.nonce;
          if (bodyNonce) setNonce(bodyNonce);
        }
      })
      .catch(() => { /* nonce unavailable — will fall back to direct link */ });
  }, []);

  // Only extract attributes that are actually set in WooCommerce.
  // When there are no variations, the selectors are hidden entirely.
  const colorAttrs = extractAttr(variations, "color");
  const sizeAttrs  = extractAttr(variations, "size");

  const addToCart = useCallback(async () => {
    setCartStatus("adding");
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (nonce) headers["X-WC-Store-Api-Nonce"] = nonce;

      const res = await fetch("/api/cart?action=add", {
        method: "POST",
        headers,
        body: JSON.stringify({ id: productId, quantity: 1 }),
      });

      if (res.ok) {
        setCartStatus("added");
        setTimeout(() => setCartStatus("idle"), 3000);
      } else {
        throw new Error("add failed");
      }
    } catch {
      // Direct WooCommerce fallback keeps the user's cart intact even if the
      // proxy fails (cross-domain session limitation).
      window.location.href = `https://cms.themoveee.com/?add-to-cart=${productId}`;
    }
  }, [productId, nonce]);

  const btnLabel =
    cartStatus === "adding" ? "Adding…"  :
    cartStatus === "added"  ? "Added ✓"  :
    cartStatus === "error"  ? "Try again" :
    "Add to Cart";

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
          onClick={addToCart}
          disabled={cartStatus === "adding"}
          style={{ opacity: cartStatus === "adding" ? 0.7 : 1 }}
        >
          {btnLabel}
          {cartStatus === "idle" && <span>→</span>}
        </button>
        <button
          className="sp-btn-save"
          onClick={() => setSaved((s) => !s)}
          aria-label={saved ? "Remove from saved" : "Save item"}
        >
          {saved ? "♥" : "♡"}
        </button>
      </div>

      {/* After add-to-cart success: show checkout link */}
      {cartStatus === "added" && (
        <div className="sp-checkout-prompt">
          <a
            href="https://cms.themoveee.com/checkout"
            className="sp-checkout-link"
          >
            Proceed to Checkout →
          </a>
        </div>
      )}

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
