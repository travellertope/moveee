"use client";
import { sanitizeHtml } from "@/lib/sanitize";

import React from "react";
import { MessageSquare } from "lucide-react";

interface InteractiveParagraphProps {
  index: number;
  htmlContent: string;
  commentCount: number;
  isActive: boolean;
  isFirst: boolean;
  onOpenComments: (index: number, text: string) => void;
}

export default function InteractiveParagraph({
  index,
  htmlContent,
  commentCount,
  isActive,
  isFirst,
  onOpenComments,
}: InteractiveParagraphProps) {
  // Strip HTML for the sidebar's "context" preview
  const plainText = htmlContent.replace(/<[^>]*>/g, "");

  return (
    <div className={`interactive-paragraph-wrapper ${isFirst ? 'is-first-paragraph' : ''}`}>
      <p 
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(htmlContent) }} 
        style={isActive ? { backgroundColor: 'rgba(189, 163, 121, 0.08)' } : {}}
      />
      
      <button
        className={`comment-bubble-trigger ${isActive ? 'active' : ''}`}
        onClick={() => onOpenComments(index, plainText)}
        aria-label={`View comments for paragraph ${index + 1}`}
        title={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
      >
        <MessageSquare size={14} />
        {commentCount > 0 && (
          <span className="comment-count-badge">{commentCount}</span>
        )}
      </button>
    </div>
  );
}
