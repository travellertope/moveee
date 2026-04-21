"use client"

import Image from "next/image";
import { useState } from "react";

interface GalleryImage {
  sourceUrl: string;
  altText?: string;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  const all = images.slice(0, 5);
  const main = all[activeIdx] ?? all[0];

  return (
    <div className="sp-gallery-wrap">
      <div className="sp-main-image">
        {main && (
          <Image
            src={main.sourceUrl}
            alt={main.altText || productName}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        )}
        <div className="sp-vetted-seal">
          <span className="star">★</span> Vetted Maker
        </div>
        {all.length > 1 && (
          <div className="sp-image-counter">
            {activeIdx + 1} / {all.length}
          </div>
        )}
      </div>

      {all.length > 1 && (
        <div className="sp-thumbnails">
          {all.map((img, i) => (
            <button
              key={i}
              className={`sp-thumb${i === activeIdx ? " active" : ""}`}
              onClick={() => setActiveIdx(i)}
              aria-label={`View image ${i + 1}`}
              style={{ border: "none", padding: 0, cursor: "pointer", background: "none" }}
            >
              <Image
                src={img.sourceUrl}
                alt={img.altText || `${productName} ${i + 1}`}
                fill
                style={{ objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
