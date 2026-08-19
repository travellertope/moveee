// Shared by MasonryRandomSection.tsx and ShopRail.tsx — the mockup rolls a
// random light pastel background per card (`pick(LIGHT_COLORS)` in
// mockups/web/moveee_homepage_wepresent_concept.html), which is what makes
// the homepage read as colourful rather than a wall of plain cards. Colour
// is derived deterministically from each card's own id/slug instead of
// Math.random(), so it's stable across server/client renders instead of
// reshuffling on every request (same convention as MasonryRandomSection's
// own shapeForRow()).
export const LIGHT_COLORS: readonly string[] = [
  "#dcdcda", // grey
  "#d9e6a0", // sage
  "#f0dda0", // gold
  "#eeb49c", // terracotta
  "#e3c9ae", // clay
  "#f4c9d6", // pink
  "#c9dce0", // blue-grey
  "#e4d6f0", // lavender
];

export function colorForCard(seed: unknown): string {
  const n = Number(seed);
  const index = Number.isFinite(n)
    ? Math.abs(Math.trunc(n)) % LIGHT_COLORS.length
    : 0;
  return LIGHT_COLORS[index];
}
