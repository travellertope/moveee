// Lets SearchModal's Industry/Location chips (shown only in People context)
// remote-control the independent People Near Me page's rails/grid — same
// event-bus pattern as discoverFiltersBus.ts, needed for the same reason:
// the modal is mounted once globally in Header.tsx, with no direct React
// relationship to whatever page happened to open it.
export interface PeopleFilters {
  industry: string | null;
  // null = "Near Me" (default — scope to the viewer's own city/country,
  // same fallback logic MemberDirectory.tsx already had), "all" = no
  // location scoping at all, or one of the region slugs below.
  region: string | null;
}

const PEOPLE_FILTERS_EVENT = "moveee:people-filters";

export function emitPeopleFilters(filters: PeopleFilters) {
  window.dispatchEvent(new CustomEvent<PeopleFilters>(PEOPLE_FILTERS_EVENT, { detail: filters }));
}

export function onPeopleFilters(handler: (filters: PeopleFilters) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<PeopleFilters>).detail);
  window.addEventListener(PEOPLE_FILTERS_EVENT, listener);
  return () => window.removeEventListener(PEOPLE_FILTERS_EVENT, listener);
}
