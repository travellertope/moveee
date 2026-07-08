"use client";

import { useState } from "react";

interface Props {
  clusterId: number;
  clusterName: string;
  variant?: "banner" | "inline";
}

export default function ClusterShareButton({ clusterId, clusterName, variant = "inline" }: Props) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `https://web.themoveee.com/cluster/${clusterId}/invite`;

  const handleShare = async () => {
    if (typeof navigator === "undefined") return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${clusterName}`,
          text: `Join my Stoop "${clusterName}" on Moveee!`,
          url: inviteUrl,
        });
      } catch {
        // user cancelled — no-op
      }
      return;
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable — show the URL in a prompt
      window.prompt("Copy this invite link:", inviteUrl);
    }
  };

  if (variant === "banner") {
    return (
      <div className="clu-share-banner">
        <div className="clu-share-banner-body">
          <p className="clu-share-banner-title">Share your invite link</p>
          <p className="clu-share-banner-sub">
            You need 4 members to activate. Invite neighbours and friends in your area.
          </p>
          <div className="clu-share-url-row">
            <span className="clu-share-url-text">{inviteUrl}</span>
          </div>
        </div>
        <button type="button" className="clu-share-btn" onClick={handleShare}>
          {copied ? "Copied ✓" : "Share invite link →"}
        </button>
      </div>
    );
  }

  return (
    <button type="button" className="clu-share-inline-btn" onClick={handleShare}>
      {copied ? "Link copied ✓" : "Copy invite link"}
    </button>
  );
}
