import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Splits a server error message on the literal substring "Moveee Pro" and
 * turns it into a real link to the upgrade page — so a tier-restriction
 * rejection (e.g. "...upgrade to Moveee Pro to post links.") isn't just
 * naming the upgrade path in plain text, it's one tap away. A message
 * without that exact phrase renders unchanged.
 */
export function renderMessageWithUpgradeLink(message: string): ReactNode {
  const marker = "Moveee Pro";
  const idx = message.indexOf(marker);
  if (idx === -1) return message;
  return (
    <>
      {message.slice(0, idx)}
      <Link href="/connect/membership" className="upgrade-inline-link">{marker}</Link>
      {message.slice(idx + marker.length)}
    </>
  );
}
