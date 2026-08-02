// Lets SearchModal's City chips (shown only in Stoop context) remote-control
// the independent /connect/stoop page's rails/grid — same event-bus pattern
// as discoverFiltersBus.ts/peopleFiltersBus.ts, needed for the same reason:
// the modal is mounted once globally in Header.tsx, with no direct React
// relationship to whatever page happened to open it.
export interface StoopFilters {
  // null = viewer's own city/country (the default — same fallback
  // MemberDirectory.tsx/DiscoverBrowser.tsx already use elsewhere).
  city: string | null;
}

const STOOP_FILTERS_EVENT = "moveee:stoop-filters";

export function emitStoopFilters(filters: StoopFilters) {
  window.dispatchEvent(new CustomEvent<StoopFilters>(STOOP_FILTERS_EVENT, { detail: filters }));
}

export function onStoopFilters(handler: (filters: StoopFilters) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<StoopFilters>).detail);
  window.addEventListener(STOOP_FILTERS_EVENT, listener);
  return () => window.removeEventListener(STOOP_FILTERS_EVENT, listener);
}
