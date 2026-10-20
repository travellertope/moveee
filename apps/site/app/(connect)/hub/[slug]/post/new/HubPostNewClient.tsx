"use client";

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SubmitPost, { TEMPLATES, type TemplateType } from "@/components/pulse/SubmitPost";
import TypePickerModal from "@/components/pulse/TypePickerModal";

/**
 * Hub-scoped mirror of /post/new's PostNewClient.tsx — same modal-picker →
 * dedicated-page flow, just carrying hubId/allowedTemplates through to
 * SubmitPost and TypePickerModal, and landing back on the Hub (not /feed)
 * if the user backs out without picking a template. Deliberately no
 * "Continue Draft" tile here — the saved-draft key is global (not
 * per-Hub), so resuming it from inside a Hub composer could silently drop
 * the user into an unrelated draft; out of scope for this pass.
 */
export default function HubPostNewClient({
  hubId, hubSlug, allowedTemplates,
}: {
  hubId: number;
  hubSlug: string;
  allowedTemplates: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const templateParam = searchParams.get("template") as TemplateType | null;
  const validTemplate =
    templateParam && TEMPLATES.some(t => t.slug === templateParam) && allowedTemplates.includes(templateParam)
      ? templateParam
      : null;

  const [template, setTemplate] = useState<TemplateType | null>(validTemplate);
  const [modalOpen, setModalOpen] = useState(!validTemplate);

  const selectTemplate = useCallback((t: TemplateType) => {
    setTemplate(t);
    setModalOpen(false);
    router.replace(`/hub/${hubSlug}/post/new?template=${t}`);
  }, [router, hubSlug]);

  function handlePosted(item: { id: string; slug?: string }) {
    // Same landing behavior as the main feed composer — the just-created
    // post's own page, not back to a list that may lag a beat behind.
    router.push(item.slug ? `/community/${item.slug}` : `/hub/${hubSlug}`);
  }

  return (
    <>
      {template && (
        <SubmitPost
          key={template}
          initialTemplate={template}
          hubId={hubId}
          hubAllowedTemplates={allowedTemplates}
          onChangeType={() => setModalOpen(true)}
          onPosted={handlePosted}
        />
      )}
      <TypePickerModal
        open={modalOpen}
        onClose={() => (template ? setModalOpen(false) : router.push(`/hub/${hubSlug}`))}
        onSelect={selectTemplate}
        allowedTemplates={allowedTemplates}
        prefetchHref={`/hub/${hubSlug}/post/new`}
      />
    </>
  );
}
