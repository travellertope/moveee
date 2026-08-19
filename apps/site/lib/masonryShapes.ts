// Shared with MasonryRandomSection.tsx (homepage) and
// MagazineArchiveWrapper.tsx (category/industry/country/tag filtered
// listings) — the mockup randomises each row's shape (3 squares, or a
// square+rectangle pair) client-side via Math.random() on every page load.
// A server-rendered page can't do that without a hydration mismatch, so
// shape is instead derived deterministically from each story's own id —
// same visual variety (never a flat uniform grid) without client/server
// disagreement or a client component just for this.
export type MasonryShape = "sq" | "rect";

const LAYOUTS: readonly (readonly MasonryShape[])[] = [
  ["sq", "sq", "sq"],
  ["sq", "rect"],
  ["rect", "sq"],
];

// `seed` comes straight from CMS data (`databaseId`, or an id string's
// length), so it must be treated as untrusted: a missing/non-numeric
// databaseId makes `seed % LAYOUTS.length` NaN, and a raw `LAYOUTS[NaN]`
// returns undefined — which then throws "not iterable" the moment it's
// spread at a call site (this exact bug took down the whole homepage once
// — see CLAUDE.md's homepage-crash entry). Normalise to a guaranteed-valid
// index so this function is total for ANY input.
export function shapeForRow(seed: unknown): readonly MasonryShape[] {
  const n = Number(seed);
  const index = Number.isFinite(n) ? Math.abs(Math.trunc(n)) % LAYOUTS.length : 0;
  return LAYOUTS[index];
}

export interface ShapedItem<T> {
  item: T;
  shape: MasonryShape;
}

// Tiles an arbitrary-length list into the same 3-column masonry rhythm as
// the homepage sections, rather than MasonryRandomSection's own fixed
// one-or-two-row preview — walks the list picking a whole shapeForRow()
// layout (2 or 3 items) at a time, seeded off the first story in that
// group, until every item has a shape. The last group is truncated to
// however many items remain, so an item count that isn't a multiple of 3
// never runs off the end of the list.
export function tileMasonryShapes<T extends { databaseId?: number | null; id?: string | number }>(
  items: readonly T[]
): ShapedItem<T>[] {
  const out: ShapedItem<T>[] = [];
  let i = 0;
  while (i < items.length) {
    const seedItem = items[i];
    const seed = seedItem?.databaseId ?? (typeof seedItem?.id === "string" ? seedItem.id.length : seedItem?.id) ?? i;
    const layout = shapeForRow(seed);
    const take = Math.min(layout.length, items.length - i);
    for (let j = 0; j < take; j++) {
      out.push({ item: items[i + j], shape: layout[j] });
    }
    i += take;
  }
  return out;
}
