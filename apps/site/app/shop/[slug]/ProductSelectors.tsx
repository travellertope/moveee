"use client";
import { sanitizeHtml } from "@/lib/sanitize";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { getCurrencyCode } from "../components/shopHelpers";

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
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [saved, setSaved]                 = useState(false);
  const [quantity, setQuantity]           = useState(1);

  const attrGroups = extractAttrGroups(variations);
  const selectAttr = (name: string, index: number) =>
    setSelected((prev) => ({ ...prev, [name]: index }));

  const showMemberPrice = memberPrice && isPro;
  const showMemberPriceTeaser = memberPrice && !isPro;
  // WooCommerce's price string already carries the store's actual currency
  // symbol (which is not reliably GBP — see shopHelpers.ts) — derive the
  // code label from it instead of assuming.
  const currencyCode = getCurrencyCode(showMemberPrice ? memberPrice : price);

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
        <span className="sp-price-sub">{currencyCode}</span>
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

      {/* Attribute selectors — one group per distinct variation attribute
          WooCommerce reports (Colour, Size, or anything else a vendor sets
          up, e.g. Material/Finish/Scent). Colour-named groups render as
          swatches; everything else renders as pill chips. */}
      {attrGroups.map((group) => {
        const activeIndex = selected[group.key] ?? 0;
        const isColor = group.key === "color" || group.key === "colour";
        return (
          <div className="sp-selector-group" key={group.key}>
            <div className="sp-selector-label">
              <span className="label">{group.label}</span>
              <span className="value">{group.values[activeIndex]}</span>
            </div>
            <div className={isColor ? "sp-swatches" : "sp-sizes"}>
              {group.values.map((val, i) =>
                isColor ? (
                  <button
                    key={i}
                    className={`sp-swatch${i === activeIndex ? " active" : ""}`}
                    onClick={() => selectAttr(group.key, i)}
                    aria-label={val}
                    style={{ background: val.toLowerCase(), border: "1px solid var(--rule)", cursor: "pointer" }}
                  />
                ) : (
                  <button
                    key={i}
                    className={`sp-size-btn${i === activeIndex ? " active" : ""}`}
                    onClick={() => selectAttr(group.key, i)}
                  >
                    {val}
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}

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

interface AttrGroup { key: string; label: string; values: string[]; }

function extractAttrGroups(variations: Variation[] | undefined): AttrGroup[] {
  if (!variations?.length) return [];
  const order: string[] = [];
  const labels = new Map<string, string>();
  const values = new Map<string, Set<string>>();
  for (const v of variations) {
    for (const attr of v.attributes?.nodes ?? []) {
      const key = attr.name.toLowerCase();
      if (!values.has(key)) {
        values.set(key, new Set());
        labels.set(key, attr.name);
        order.push(key);
      }
      values.get(key)!.add(attr.value);
    }
  }
  return order.map((key) => ({
    key,
    label: labels.get(key) ?? key,
    values: [...values.get(key)!],
  }));
}
