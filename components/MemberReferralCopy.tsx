"use client";

import { useState } from "react";

export default function MemberReferralCopy({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback for older browsers
      const el = document.createElement("textarea");
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mem-referral-wrap">
      <code className="mem-referral-url">{url}</code>
      <button
        className={`mem-referral-copy${copied ? " copied" : ""}`}
        onClick={copy}
      >
        {copied ? "Copied ✓" : "Copy"}
      </button>
    </div>
  );
}
