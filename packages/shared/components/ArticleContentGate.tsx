"use client";

import { useSession } from "next-auth/react";
import ContentGate from "./ContentGate";
import { canViewContent, type AccessLevel } from "@/lib/access";

interface Props {
  accessLevel: AccessLevel;
  callbackUrl: string;
  /** Full rendered HTML — shown to authorized users. */
  fullContent: React.ReactNode;
  /** Preview HTML — shown below the gate for non-authorized users. */
  previewHtml?: string;
}

export default function ArticleContentGate({ accessLevel, callbackUrl, fullContent, previewHtml }: Props) {
  const { data: session, status } = useSession();

  if (accessLevel === "public") return <>{fullContent}</>;

  const user = session?.user as any;
  const canView = status !== "loading" && canViewContent(accessLevel, user);

  if (canView) return <>{fullContent}</>;

  return (
    <>
      {previewHtml && (
        <div style={{ position: "relative", marginBottom: 0 }}>
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 160,
              background: "linear-gradient(to bottom, transparent, var(--paper, #ffffff))",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      <ContentGate
        accessLevel={accessLevel as "member-only" | "patron-only"}
        isLoggedIn={!!user}
        callbackUrl={callbackUrl}
      />
    </>
  );
}
