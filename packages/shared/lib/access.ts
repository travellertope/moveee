/**
 * Content access-level helpers.
 *
 * The WordPress `culture_access` taxonomy drives what a piece of content
 * requires from the reader:
 *
 *   (no term)    → public  — visible to everyone, including visitors
 *   member-only  → any logged-in user (Citizen or Patron)
 *   patron-only  → Patron-tier members only
 *
 * These utilities are used by server components to decide whether to render
 * full content or show a ContentGate paywall/login prompt.
 */

export type AccessLevel = "public" | "member-only" | "patron-only";

/**
 * Derive the access level from a post's cultureAccesses taxonomy terms.
 * Returns "public" when no restricting term is present.
 */
export function getAccessLevel(post: {
  cultureAccesses?: { nodes: Array<{ slug: string }> } | null;
}): AccessLevel {
  const slugs = post?.cultureAccesses?.nodes?.map((n) => n.slug) ?? [];
  if (slugs.includes("patron-only")) return "patron-only";
  if (slugs.includes("member-only")) return "member-only";
  return "public";
}

/**
 * Returns true when the given user may read content at this access level.
 *
 * @param accessLevel - The required tier for this piece of content.
 * @param user        - The session user object (null/undefined = visitor).
 */
export function canViewContent(
  accessLevel: AccessLevel,
  user?: { tier?: string } | null
): boolean {
  if (accessLevel === "public") return true;
  if (!user) return false;                        // must be logged in
  if (accessLevel === "member-only") return true; // any member
  return user.tier === "patron";                  // patron-only
}
