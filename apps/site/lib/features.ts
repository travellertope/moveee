export interface FeaturePageMeta {
  slug: string;
  label: string;
}

// Canonical registry of Moveee (app) feature marketing pages at
// themoveee.com/features/* — used to cross-link pages to each other.
// Keep in sync with the directories under app/features/.
export const FEATURE_PAGES: FeaturePageMeta[] = [
  { slug: "pulse-feed", label: "Pulse Feed" },
  { slug: "discover", label: "Discover" },
  { slug: "literati-connect", label: "Literati Connect" },
  { slug: "events", label: "Events" },
  { slug: "culture-credits", label: "Culture Credits & Reputation" },
  { slug: "perks-wallet", label: "Partner Perks & Wallet" },
  { slug: "games", label: "Daily Games" },
  { slug: "shop", label: "Lifestyle Shop" },
  { slug: "membership", label: "Membership" },
];
