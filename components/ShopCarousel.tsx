"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  price?: string;
  image?: { sourceUrl: string };
}

interface ShopCarouselProps {
  products: Product[];
}

const ShopCarousel: React.FC<ShopCarouselProps> = ({ products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => el.removeEventListener("scroll", checkScroll);
  }, [products]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.querySelector(".hp-carousel-card")?.clientWidth || 280;
    el.scrollBy({ left: dir === "right" ? cardWidth * 2 : -(cardWidth * 2), behavior: "smooth" });
  };

  if (!products.length) {
    return <div className="hp-empty-state">Our curated shop collection is launching soon.</div>;
  }

  return (
    <div className="hp-carousel-wrap">
      <button
        className={`hp-carousel-btn hp-carousel-btn--prev ${!canScrollLeft ? "hp-carousel-btn--hidden" : ""}`}
        onClick={() => scroll("left")}
        aria-label="Previous products"
      >
        ←
      </button>

      <div className="hp-carousel-track" ref={scrollRef}>
        {products.map((product) => (
          <Link key={product.id} href={`/shop/${product.slug}`} className="hp-carousel-card hp-product">
            <div className="hp-product-image">
              {product.image && (
                <Image
                  src={product.image.sourceUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
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
        className={`hp-carousel-btn hp-carousel-btn--next ${!canScrollRight ? "hp-carousel-btn--hidden" : ""}`}
        onClick={() => scroll("right")}
        aria-label="Next products"
      >
        →
      </button>
    </div>
  );
};

export default ShopCarousel;
