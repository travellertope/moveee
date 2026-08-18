import { useIsTablet } from "./useIsTablet";

/**
 * Caps and centers a scroll/content container's width on tablet, leaving
 * phones untouched (returns undefined there, so spreading it into a style
 * array is a no-op). Same pattern established in ConnectFeedScreen.tsx's
 * `listContentTablet`/DiscoverScreen.tsx's `gridContentTablet` — pulled out
 * here once those two proved it out, so the other ~35 screens can reuse it
 * instead of redefining the same three properties per file.
 *
 * `maxWidth` defaults to 720 — a comfortable reading/form width. Pass a
 * wider value (e.g. 960+) for grid/browse screens that should use more of
 * a tablet's horizontal space.
 */
export function useTabletContentStyle(maxWidth = 720) {
  const isTablet = useIsTablet();
  return isTablet ? { maxWidth, width: "100%" as const, alignSelf: "center" as const } : undefined;
}
