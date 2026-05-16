"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  price?: string;
  image?: { sourceUrl: string };
}

export default function ShopCarousel({ products }: { products: Product[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, moved: false });
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products, checkScroll]);

  const scroll = useCallback((dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardWidth = el.querySelector<HTMLElement>(".hp-carousel-card")?.offsetWidth ?? 280;
    el.scrollBy({ left: dir === "right" ? cardWidth + 20 : -(cardWidth + 20), behavior: "smooth" });
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, moved: false };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current.active) return;
    const el = trackRef.current;
    if (!el) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) drag.current.moved = true;
    el.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = trackRef.current;
    if (!el) return;
    drag.current.active = false;
    el.releasePointerCapture(e.pointerId);
    el.style.cursor = "";
  }, []);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }, []);

  if (!products.length) {
    return <div className="hp-empty-state">Our curated shop collection is launching soon.</div>;
  }

  return (
    <div className="hp-carousel-wrap">
      {/* Desktop-only overlay arrows */}
      <button
        className={`hp-carousel-btn hp-carousel-btn--prev${canScrollLeft ? "" : " hp-carousel-btn--hidden"}`}
        onClick={() => scroll("left")}
        aria-label="Previous products"
        tabIndex={canScrollLeft ? 0 : -1}
      >
        ←
      </button>

      <div
        className="hp-carousel-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
      >
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/shop/${product.slug}`}
            className="hp-carousel-card hp-product"
            draggable={false}
          >
            <div className="hp-product-image">
              {product.image && (
                <Image
                  src={product.image.sourceUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                  draggable={false}
                />
              )}
              <span className="hp-product-badge">MOVEEE VETTED</span>
            </div>
            <span className="hp-product-vendor">The Moveee Editions</span>
            <span className="hp-product-name">{product.name}</span>
            <span className="hp-product-price">{product.price || "Price on Request"}</span>
          </Link>
        ))}
      </div>

      <button
        className={`hp-carousel-btn hp-carousel-btn--next${canScrollRight ? "" : " hp-carousel-btn--hidden"}`}
        onClick={() => scroll("right")}
        aria-label="Next products"
        tabIndex={canScrollRight ? 0 : -1}
      >
        →
      </button>
    </div>
  );
}
