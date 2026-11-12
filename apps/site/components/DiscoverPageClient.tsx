"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import DiscoverBrowser, { type DiscoverEntry } from "@/components/DiscoverBrowser";
import "@/app/pulse-layout.css";

const ComposerModal = dynamic(() => import("@/components/pulse/ComposerModal"), { ssr: false });
const QuickLogModal = dynamic(() => import("@/components/QuickLogModal"), { ssr: false });

type ReviewSubtype = "place" | "food" | "book" | "film" | "music";

const REVIEW_SUBTYPES: Partial<Record<string, ReviewSubtype>> = {
  place: "place",
  food: "food",
  book: "book",
  album: "music",
  film: "film",
  "tv-series": "film",
};

interface ReviewTarget {
  entry: DiscoverEntry;
  subtype: ReviewSubtype;
}

interface LogTarget {
  id: number;
  title: string;
  thumbnail: string | null;
}

interface Props {
  initialType?: string | null;
  initialRegion?: string | null;
  viewerInterests?: string[];
}

export default function DiscoverPageClient({ initialType, initialRegion, viewerInterests }: Props) {
  const { data: session } = useSession();
  const [reviewTarget, setReviewTarget] = useState<ReviewTarget | null>(null);
  const [pendingReview, setPendingReview] = useState<ReviewTarget | null>(null);
  const [logTarget, setLogTarget] = useState<LogTarget | null>(null);

  useEffect(() => {
    if (session && pendingReview) {
      setReviewTarget(pendingReview);
      setPendingReview(null);
    }
  }, [session, pendingReview]);

  function handleReview(entry: DiscoverEntry) {
    const subtype = REVIEW_SUBTYPES[entry.type];
    if (!subtype) return;
    if (!session) {
      setPendingReview({ entry, subtype });
      window.dispatchEvent(new Event("open-auth-modal"));
      return;
    }
    setReviewTarget({ entry, subtype });
  }

  function handleLog(entry: DiscoverEntry) {
    setLogTarget({ id: entry.id, title: entry.title, thumbnail: entry.thumbnail ?? null });
  }

  return (
    <>
      <DiscoverBrowser
        initialType={initialType}
        initialRegion={initialRegion}
        viewerInterests={viewerInterests}
        onReview={handleReview}
        onLog={handleLog}
      />

      {reviewTarget && (
        <ComposerModal
          open={!!reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
          initialTab="review"
          initialReview={{
            subtype: reviewTarget.subtype,
            entry: {
              id: reviewTarget.entry.id,
              title: reviewTarget.entry.title,
              slug: reviewTarget.entry.slug,
              thumbnail: reviewTarget.entry.thumbnail,
              city: reviewTarget.entry.city,
            },
          }}
        />
      )}

      <QuickLogModal
        entry={logTarget}
        isLoggedIn={!!session}
        onClose={() => setLogTarget(null)}
      />
    </>
  );
}
