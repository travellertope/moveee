// Lets SearchModal's Region/Sort chips (shown only in Directory context)
// remote-control the independent Discover page's grid/rails — same
// event-bus pattern as searchModalBus.ts, needed for the same reason: the
// modal is mounted once globally in Header.tsx, with no direct React
// relationship to whatever page happened to open it.
export interface DiscoverFilters {
  region: string | null;
  sort: "relevant" | "recent" | "rating";
}

const DISCOVER_FILTERS_EVENT = "moveee:discover-filters";

export function emitDiscoverFilters(filters: DiscoverFilters) {
  window.dispatchEvent(new CustomEvent<DiscoverFilters>(DISCOVER_FILTERS_EVENT, { detail: filters }));
}

export function onDiscoverFilters(handler: (filters: DiscoverFilters) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<DiscoverFilters>).detail);
  window.addEventListener(DISCOVER_FILTERS_EVENT, listener);
  return () => window.removeEventListener(DISCOVER_FILTERS_EVENT, listener);
}
