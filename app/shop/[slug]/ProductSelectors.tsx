"use client"

import { useState, useEffect, useCallback } from "react";

interface Variation {
  price?: string;
  stockStatus?: string;
  attributes?: { nodes: { name: string; value: string }[] };
}

interface ProductSelectorsProps {
  productId: number;
  price?: string;
  regularPrice?: string;
  variations?: Variation[];
}

const FALLBACK_COLORS = [
  { label: "Indigo", hex: "#1e2b42" },
  { label: "Ochre", hex: "#c5491f" },
  { label: "Moss", hex: "#3d4a2a" },
  { label: "Ink", hex: "#14110d" },
];

const FALLBACK_SIZES = [
  { label: "S", dim: "46–48 cm" },
  { label: "M", dim: "50–52 cm" },
  { label: "L", dim: "54–56 cm" },
];

type CartStatus = "idle" | "adding" | "added" | "error";

export default function ProductSelectors({
  productId,
  price,
  regularPrice,
  variations,
}: ProductSelectorsProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedSize, setSelectedSize] = useState(0);
  const [saved, setSaved] = useState(false);
  const [cartStatus, setCartStatus] = useState<CartStatus>("idle");
  const [nonce, setNonce] = useState<string | null>(null);

  // Fetch WooCommerce nonce on mount by hitting /api/cart (GET)
  useEffect(() => {
    fetch("/api/cart")
      .then((r) => r.json())
      .then((data) => {
        // WC Store API returns nonce in the cart response
        if (data?.extensions?.["woocommerce-blocks"]?.nonce) {
          setNonce(data.extensions["woocommerce-blocks"].nonce);
        }
      })
      .catch(() => {/* nonce unavailable — will fall back to direct link */});
  }, []);

  const colorAttrs = extractAttr(variations, "color");
  const sizeAttrs = extractAttr(variations, "size");

  const colors = colorAttrs.length
    ? colorAttrs.map((v) => ({ label: v, hex: null }))
    : FALLBACK_COLORS;

  const sizes = sizeAttrs.length
    ? sizeAttrs.map((v) => ({ label: v, dim: "" }))
    : FALLBACK_SIZES;

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
        setTimeout(() => setCartStatus("idle"), 2500);
      } else {
        throw new Error("add failed");
      }
    } catch {
      // Fall back to direct WooCommerce link when proxy unavailable
      window.location.href = `https://cms.themoveee.com/?add-to-cart=${productId}`;
    }
  }, [productId, nonce]);

  const btnLabel =
    cartStatus === "adding" ? "Adding…" :
    cartStatus === "added"  ? "Added ✓" :
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

      {/* Colour selector */}
      <div className="sp-selector-group">
        <div className="sp-selector-label">
          <span className="label">Colour</span>
          <span className="value">{colors[selectedColor]?.label}</span>
        </div>
        <div className="sp-swatches">
          {colors.map((c, i) => (
            <button
              key={i}
              className={`sp-swatch${i === selectedColor ? " active" : ""}`}
              onClick={() => setSelectedColor(i)}
              aria-label={c.label}
              style={{
                backgroundColor: c.hex ?? undefined,
                border: "1px solid var(--rule)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Size selector */}
      <div className="sp-selector-group">
        <div className="sp-selector-label">
          <span className="label">Size</span>
          <span className="value">{sizes[selectedSize]?.label}</span>
        </div>
        <div className="sp-sizes">
          {sizes.map((s, i) => (
            <button
              key={i}
              className={`sp-size-btn${i === selectedSize ? " active" : ""}`}
              onClick={() => setSelectedSize(i)}
            >
              {s.label}
              {s.dim && <span className="dim">{s.dim}</span>}
            </button>
          ))}
        </div>
      </div>

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
          onClick={() => setSaved((s: boolean) => !s)}
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
