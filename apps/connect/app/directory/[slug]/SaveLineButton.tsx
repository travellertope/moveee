"use client";

import { useState } from "react";
import ComposerModal from "@/components/pulse/ComposerModal";

const QUOTE_TYPE_MAP: Record<string, string> = {
  book:  "Book",
  film:  "Film",
  album: "Song",
};

interface Props {
  directoryId: number;
  entryTitle: string;
  quoteLinkRole: "author" | "source";
  quoteLinkType?: string;
  label: string;
}

export default function SaveLineButton({ directoryId, entryTitle, quoteLinkRole, quoteLinkType, label }: Props) {
  const [open, setOpen] = useState(false);

  const authorEntry = quoteLinkRole === "author" ? { id: directoryId, title: entryTitle } : undefined;
  const sourceEntry = quoteLinkRole === "source" ? { id: directoryId, title: entryTitle } : undefined;
  const quoteType   = quoteLinkRole === "author"
    ? "Person"
    : (quoteLinkType ? QUOTE_TYPE_MAP[quoteLinkType] : undefined);

  return (
    <>
      <button type="button" className="dir-save-line" onClick={() => setOpen(true)}>
        {label}
      </button>
      <ComposerModal
        open={open}
        onClose={() => setOpen(false)}
        initialTab="quote"
        initialQuote={{ authorEntry, sourceEntry, quoteType }}
      />
    </>
  );
}
