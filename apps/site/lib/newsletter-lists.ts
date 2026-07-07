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
    cadence: "Daily Mon–Fri + Saturdays",
    eyebrow: "★ GetMeLit · A story a day, more every Saturday",
    tagline: "A story a day. A full literary dispatch every Saturday.",
    standfirst:
      "A new short story or poem in your inbox every weekday — plus books worth reading, opportunities for writers, and an in-depth author spotlight, every Saturday.",
    signupNote: "Free · Daily · Unsubscribe anytime",
    pillars: [
      {
        num: "01",
        name: "Stories",
        desc: "The week's featured fiction or poetry — a story from PREE, Lolwe, Brittle Paper, or beyond. The kind you'll want to pass on.",
      },
      {
        num: "02",
        name: "Books",
        desc: "New releases, essential reads, and editor picks for the literary mind — debuts, prize winners, and the novels worth clearing your weekend for.",
      },
      {
        num: "03",
        name: "Opps",
        desc: "Submissions windows, grants, residencies, and writing prizes worth your time — for writers at every stage, from every corner of the world.",
      },
      {
        num: "04",
        name: "Spotlight",
        desc: "One writer, in depth. Their work, their influences, what they're working on next — for the reader who wants more than a recommendation.",
      },
    ],
    pullQuote:
      "A story lands in your inbox every morning. On Saturday, the full picture: books, opportunities, and a writer worth knowing. Literature, delivered daily.",
    pullCite: "— The editorial mission of GetMeLit",
  },
};

export function isNewsletterListId(value: string): value is NewsletterListId {
  return value === "culture-drop" || value === "getmelit";
}
