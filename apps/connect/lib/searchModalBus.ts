// Minimal cross-component trigger for the single, globally-rendered
// SearchModal (mounted once in Header.tsx). Any page can call
// openSearchModal() to open it — e.g. /events' own search bar — without
// needing its own SearchModal instance or a React context/provider just
// for this one open() call.
const OPEN_SEARCH_EVENT = "moveee:open-search";

export function openSearchModal() {
  window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
}

export function onOpenSearchModal(handler: () => void): () => void {
  window.addEventListener(OPEN_SEARCH_EVENT, handler);
  return () => window.removeEventListener(OPEN_SEARCH_EVENT, handler);
}
