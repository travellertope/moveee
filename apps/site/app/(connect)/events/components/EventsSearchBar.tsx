"use client";

import { openSearchModal } from "@/lib/searchModalBus";

// Opens the same shared SearchModal every other search entry point in the
// app uses (rail search bar, ⌘K) — SearchModal itself defaults its Content
// Type filter to "Event" when the current route is /events, so this button
// doesn't need to pass any context explicitly.
export default function EventsSearchBar() {
  return (
    <button type="button" className="evt-search-btn" onClick={() => openSearchModal()}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
      </svg>
      Search happenings by city, category, format…
    </button>
  );
}
