import type { FeedItem } from "../types";

/**
 * Builds the public web share URL for a feed item.
 *
 * `item.href` is a relative app path already shaped correctly per item type
 * by the PHP feed mapper (e.g. quotes are `/quotes/{id}-{slug}`, not a bare
 * slug) — build off it instead of hand-rolling a `/community/{slug}` path
 * from `item.slug`, which is wrong for any type whose real detail page isn't
 * `/community/[slug]` (quotes in particular: a native quote's slug never
 * resolves there, since that page only looks up `culture_post` entries, not
 * `culture_quote` ones — see CLAUDE.md's "Quote share/QR code 404" entry).
 */
export function shareUrlFor(item: FeedItem): string | undefined {
  if (!item.href) return undefined;
  const path = item.href.startsWith("/") ? item.href : `/${item.href}`;
  // Editorial (magazine) content lives on Site A (themoveee.com); everything
  // else — pulse, community, quotes, happenings, directory — is Site B.
  const domain = item.type === "editorial" ? "https://themoveee.com" : "https://web.themoveee.com";
  return `${domain}${path}`;
}
