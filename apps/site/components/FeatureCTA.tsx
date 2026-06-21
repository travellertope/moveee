"use client";

import { useState } from "react";
import Link from "next/link";
import WaitlistModal from "@/components/WaitlistModal";
import { FEATURE_PAGES } from "@/lib/features";

interface Props {
  heading: string;
  body: string;
  /** Current page's slug — excluded from the related-features strip. */
  currentSlug?: string;
}

export default function FeatureCTA({ heading, body, currentSlug }: Props) {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const related = FEATURE_PAGES.filter((f) => f.slug !== currentSlug);

  return (
    <section className="fp-section">
      <div className="fp-section-inner">
        <div className="fp-cta-strip" id="download">
          <WaitlistModal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
          <p className="fp-row-eyebrow">Join Moveee</p>
          <h3 className="fp-cta-h3">{heading}</h3>
          <p className="fp-body fp-body--centred" style={{ maxWidth: 520 }}>
            {body}
          </p>
          <div className="fp-cta-buttons">
            <button type="button" className="mz-btn-primary" onClick={() => setWaitlistOpen(true)}>
              Download for iOS
            </button>
            <button type="button" className="mz-btn-secondary" onClick={() => setWaitlistOpen(true)}>
              Download for Android
            </button>
          </div>
          <p className="fp-trust">Free to join · No spam, ever</p>
        </div>

        {related.length > 0 && (
          <div className="fp-related">
            {related.map((f) => (
              <Link key={f.slug} href={`/features/${f.slug}`} className="fp-related-link">
                {f.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
