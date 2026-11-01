"use client";

import { useState } from "react";
import ImageLightbox from "@/components/pulse/ImageLightbox";
import EventThumb from "./EventThumb";

interface Props {
  src?: string | null;
  title: string;
  categorySlug?: string;
}

// Click-to-lightbox wrapper around EventThumb, matching the exact pattern
// CommunityDetailModal.tsx already uses for a single post image.
export default function EventCoverImage({ src, title, categorySlug }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        onClick={() => src && setOpen(true)}
        style={{ position: "absolute", inset: 0, cursor: src ? "zoom-in" : "default" }}
      >
        <EventThumb src={src} title={title} categorySlug={categorySlug} fontSize={48} priority />
      </div>
      {open && src && (
        <ImageLightbox images={[src]} initialIndex={0} alt={title} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
