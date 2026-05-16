"use client";

import { useRouter } from "next/navigation";
import HashtagText from "@/components/pulse/HashtagText";
import ReactionBar from "@/components/pulse/ReactionBar";

interface Props {
  text: string;
  hashtags: string[];
  wpId: string;
  initialReactions: { love: number; fire: number; clap: number };
  shareUrl: string;
}

export default function CommunityPostClient({ text, wpId, initialReactions, shareUrl }: Props) {
  const router = useRouter();

  const handleHashtagClick = (hashtag: string) => {
    router.push(`/pulse?hashtag=${encodeURIComponent(hashtag.replace(/^#/, ""))}`);
  };

  return (
    <div>
      <p
        style={{
          color: "#e8e8e8",
          fontFamily: "var(--font-fraunces), serif",
          fontSize: "1.15rem",
          lineHeight: 1.7,
          margin: "0 0 1.5rem",
          whiteSpace: "pre-wrap",
        }}
      >
        <HashtagText text={text} onHashtagClick={handleHashtagClick} />
      </p>

      <ReactionBar
        itemId={wpId}
        itemType="community"
        initialCounts={initialReactions}
        shareUrl={shareUrl}
      />
    </div>
  );
}
