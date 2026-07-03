export type NewsletterListId = "culture-drop" | "getmelit";

interface NewsletterListMeta {
  id: NewsletterListId;
  label: string;
  emphasisLabel: string;
  titlePrefix: string;
  titleEmphasis: string;
  titleSuffix: string;
  titleInline: boolean;
  cadence: string;
  eyebrow: string;
  tagline: string;
  standfirst: string;
  signupNote: string;
  pillars: { num: string; name: string; desc: string }[];
  pullQuote: string;
  pullCite: string;
}

export const NL_LABELS: Record<NewsletterListId, string> = {
  "culture-drop": "Culture Drop",
  getmelit: "GetMeLit",
};

export const NL_META: Record<NewsletterListId, NewsletterListMeta> = {
  "culture-drop": {
    id: "culture-drop",
    label: "Culture Drop",
    emphasisLabel: "Drop",
    titlePrefix: "Culture",
    titleEmphasis: "Drop",
    titleSuffix: "",
    titleInline: false,
    cadence: "Weekly",
    eyebrow: "★ Culture Drop · Every Tuesday",
    tagline: "The weekly dispatch on contemporary global culture.",
    standfirst:
      "One deep essay, curated picks, a music dispatch, and what's happening across Lagos, London, New York, and Accra. Written to make you think, not just scroll.",
    signupNote: "Free · Weekly · Unsubscribe anytime",
    pillars: [
      {
        num: "01",
        name: "The Deep Dive",
        desc: "One long-form cultural essay or commentary — the thing you'll forward to a friend. Art, identity, ambition, the modern global cultural experience. Written to make you think.",
      },
      {
        num: "02",
        name: "The List",
        desc: "A curated five-pick of what to read, watch, listen to, or visit before the next issue. Books, films, albums, exhibitions — things worth your time.",
      },
      {
        num: "03",
        name: "What's Playing",
        desc: "A sound dispatch. New releases, overlooked gems, playlists, and the occasional hot take on what's moving in global music right now.",
      },
      {
        num: "04",
        name: "The Calendar",
        desc: "What's happening this week and next across Lagos, Accra, London, and New York — openings, screenings, readings, dinners. The events worth leaving the house for.",
      },
    ],
    pullQuote:
      "We don't just tell you what's happening — we explore why it matters. Sharp cultural commentary on the modern global cultural experience, delivered every week.",
    pullCite: "— The editorial mission of Culture Drop",
  },
  getmelit: {
    id: "getmelit",
    label: "GetMeLit",
    emphasisLabel: "Me",
    titlePrefix: "Get",
    titleEmphasis: "Me",
    titleSuffix: "Lit",
    titleInline: true,
    cadence: "Weekly",
    eyebrow: "★ GetMeLit · For readers & writers",
    tagline: "A weekly letter for the literary mind.",
    standfirst:
      "Stories, poems, essay excerpts, and opportunities for writers and authors from around the world — curated to keep you reading, writing, and discovering.",
    signupNote: "Free · Weekly · Unsubscribe anytime",
    pillars: [
      {
        num: "01",
        name: "Stories",
        desc: "Fiction and poetry from voices around the world — the kind you'll want to share.",
      },
      {
        num: "02",
        name: "Books",
        desc: "New releases, essential reads, and editor picks for the literary mind.",
      },
      {
        num: "03",
        name: "Opps",
        desc: "Submissions, grants, residencies, and writing prizes worth your time.",
      },
      {
        num: "04",
        name: "Spotlight",
        desc: "Author spotlight — voices shaping world literature, in conversation and excerpt.",
      },
    ],
    pullQuote:
      "Literature, curated weekly — the stories, poems, and reads that feed the literary mind, sent straight to your inbox.",
    pullCite: "— The editorial mission of GetMeLit",
  },
};

export function isNewsletterListId(value: string): value is NewsletterListId {
  return value === "culture-drop" || value === "getmelit";
}
