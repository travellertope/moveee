"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import SubmitPost, { TEMPLATES, type TemplateType } from "@/components/pulse/SubmitPost";
import TypePickerModal from "@/components/pulse/TypePickerModal";

interface StoredDraft {
  template: TemplateType;
  text: string;
  tag: string;
  savedAt: number;
}

function draftKey(userId: string | number): string {
  return `moveee_post_draft_${userId}`;
}

function readDraft(userId: string | number): StoredDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.template || typeof parsed.text !== "string") return null;
    return parsed as StoredDraft;
  } catch {
    return null;
  }
}

export default function PostNewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id as string | number | undefined;

  const templateParam = searchParams.get("template") as TemplateType | null;
  const wantsDraft = searchParams.get("draft") === "1";
  const validTemplate = templateParam && TEMPLATES.some(t => t.slug === templateParam) ? templateParam : null;

  const [template, setTemplate] = useState<TemplateType | null>(validTemplate);
  const [draftFields, setDraftFields] = useState<{ text: string; tag: string } | null>(null);
  const [modalOpen, setModalOpen] = useState(!validTemplate && !wantsDraft);
  const [hasDraft, setHasDraft] = useState(false);

  // Resolve any saved draft once we know who's logged in — either to power
  // the modal's "Continue Draft" tile, or (when ?draft=1 was passed, e.g.
  // from that same tile) to load it straight into the page.
  useEffect(() => {
    if (!userId) return;
    const draft = readDraft(userId);
    setHasDraft(!!draft);
    if (wantsDraft && draft) {
      setTemplate(draft.template);
      setDraftFields({ text: draft.text, tag: draft.tag });
      setModalOpen(false);
    }
  }, [userId, wantsDraft]);

  const selectTemplate = useCallback((t: TemplateType) => {
    setTemplate(t);
    setDraftFields(null);
    setModalOpen(false);
    router.replace(`/post/new?template=${t}`);
  }, [router]);

  const selectDraftTile = useCallback(() => {
    if (!userId) return;
    const draft = readDraft(userId);
    if (!draft) return;
    setTemplate(draft.template);
    setDraftFields({ text: draft.text, tag: draft.tag });
    setModalOpen(false);
    router.replace(`/post/new?template=${draft.template}&draft=1`);
  }, [userId, router]);

  function handleSaveDraft(draft: { template: TemplateType; text: string; tag: string }) {
    if (!userId || !draft.text.trim()) return;
    localStorage.setItem(draftKey(userId), JSON.stringify({ ...draft, savedAt: Date.now() }));
    setHasDraft(true);
  }

  function handlePosted() {
    if (userId) localStorage.removeItem(draftKey(userId));
    router.push("/feed");
  }

  return (
    <>
      {template && (
        <SubmitPost
          key={template}
          initialTemplate={template}
          initialDraft={draftFields ?? undefined}
          onChangeType={() => setModalOpen(true)}
          onSaveDraft={handleSaveDraft}
          onPosted={handlePosted}
        />
      )}
      <TypePickerModal
        open={modalOpen}
        onClose={() => (template ? setModalOpen(false) : router.push("/feed"))}
        onSelect={selectTemplate}
        hasDraft={hasDraft}
        onSelectDraft={selectDraftTile}
      />
    </>
  );
}
