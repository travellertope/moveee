// ── Shared types ─────────────────────────────────────────────────────────────

export type CardTag =
  | "editorial" | "lifestyle" | "pr" | "events" | "travel" | "consulting" | "community";

export type Feature = { label: string; included: boolean | string };

export type TierPackage = {
  name: string;
  highlight?: boolean;
  featuredBadge?: string;
  billingNote: string;
  price: string;
  currency: string;
  unit?: string;
  features: Feature[];
  cta: string;
  ctaSecondary?: string;
};

export type AddOn = {
  icon: string;
  price: string;
  description: string;
};

export type TierService = {
  slug: string;
  name: string;
  eyebrow: string;
  description: string;
  packages: TierPackage[];
  addOns?: AddOn[];
};

export type RateCard = {
  name: string;
  tag: CardTag;
  tagLabel: string;
  description: string;
  price: string;
  priceNote: string;
  includes: string[];
  featured?: boolean;
  featuredBadge?: string;
};

export type Section =
  | { id: string; label: string; audience?: string; kind: "cards"; cards: RateCard[] }
  | { id: string; label: string; audience?: string; kind: "tiers"; service: TierService }
  | { id: string; label: string; audience?: string; kind: "mixed"; cards: RateCard[]; service: TierService; serviceLabel?: string };

export type Market = {
  id: "africa" | "uk" | "us";
  name: string;
  flag: string;
  tagline: string;
  currency: string;
  sections: Section[];
};

export type ConnectBar = {
  title: string;
  description: string;
  price: string;
  priceNote: string;
};

// ── Connect bar (shared) ──────────────────────────────────────────────────────

export const CONNECT_BAR: ConnectBar = {
  title: "Moveee Connect — Community Sponsorship",
  description:
    "Brands and service providers wanting direct access to The Moveee's Black and diaspora professional community. Available across all three markets as a quarterly sponsorship. Includes community feature, sponsored content slot, and member offer.",
  price: "₦100k · £200 · $250",
  priceNote: "per quarter, per market",
};

// ── Amplify per market ────────────────────────────────────────────────────────

const AMPLIFY_FEATURES_BASE = [
  "Credible As-Seen-In Logo",
  "Priority-Track Feature",
  "End-of-Article Call to Action",
  "Audience Location Targeting",
  "Full Reach Analytics Report",
];

const amplifyAfrica: TierService = {
  slug: "amplify",
  name: "Moveee Amplify",
  eyebrow: "Media Amplification",
  description:
    "Supercharge your feature across Nigeria and Pan-Africa. Moveee Amplify distributes your story to a targeted, culturally engaged audience through social media, newsletters, influencer networks, and newspaper syndication — putting your brand in front of the exact people who matter most to you.",
  packages: [
    {
      name: "Priority",
      billingNote: "Monthly Recurring Option Also Available",
      price: "65k", currency: "₦",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Moveee Nigeria channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: false },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit newsletter premium slot", included: false },
        { label: "Nigeria micro-influencer broadcast", included: false },
        { label: "Nigeria digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "150k", currency: "₦",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Nigeria + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit newsletter premium slot", included: false },
        { label: "Nigeria micro-influencer broadcast", included: false },
        { label: "Nigeria digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "260k", currency: "₦",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Nigeria + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit newsletter premium slot", included: true },
        { label: "Nigeria micro-influencer broadcast", included: false },
        { label: "Nigeria digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "650k", currency: "₦",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Nigeria + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit newsletter premium slot", included: true },
        { label: "1× Nigeria micro-influencer broadcast", included: true },
        { label: "1× Nigeria digital press syndication", included: true },
        { label: "Full demographic analytics breakdown", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
};

const amplifyUK: TierService = {
  slug: "amplify",
  name: "Moveee Amplify UK",
  eyebrow: "Media Amplification",
  description:
    "Amplify your story across the UK's African and Caribbean diaspora. From London to Birmingham and Manchester, Moveee Amplify UK distributes your feature to the Black British audiences who are actively shaping culture — through targeted social, newsletter, influencer, and press channels.",
  packages: [
    {
      name: "Priority",
      billingNote: "Monthly Recurring Option Also Available",
      price: "45", currency: "£",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Moveee UK channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: false },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit UK newsletter premium slot", included: false },
        { label: "Black British micro-influencer broadcast", included: false },
        { label: "UK digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "90", currency: "£",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — UK + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit UK newsletter premium slot", included: false },
        { label: "Black British micro-influencer broadcast", included: false },
        { label: "UK digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "145", currency: "£",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — UK + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit UK newsletter premium slot", included: true },
        { label: "Black British micro-influencer broadcast", included: false },
        { label: "UK digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "350", currency: "£",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — UK + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit UK newsletter premium slot", included: true },
        { label: "1× Black British micro-influencer broadcast", included: true },
        { label: "1× UK digital press syndication", included: true },
        { label: "Full demographic analytics breakdown", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
};

const amplifyUS: TierService = {
  slug: "amplify",
  name: "Moveee Amplify US",
  eyebrow: "Media Amplification",
  description:
    "Put your story in front of the African and Caribbean diaspora across the United States. Moveee Amplify US reaches Black American, Nigerian-American, Ghanaian-American, and Caribbean audiences in NYC, Atlanta, Houston, DC, and LA — through targeted social, newsletter, influencer, and press distribution.",
  packages: [
    {
      name: "Priority",
      billingNote: "Monthly Recurring Option Also Available",
      price: "100", currency: "$",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — Moveee US channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: false },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit US newsletter premium slot", included: false },
        { label: "US diaspora micro-influencer broadcast", included: false },
        { label: "US diaspora digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "190", currency: "$",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — US + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: false },
        { label: "GetMeLit US newsletter premium slot", included: false },
        { label: "US diaspora micro-influencer broadcast", included: false },
        { label: "US diaspora digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "300", currency: "$",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — US + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit US newsletter premium slot", included: true },
        { label: "US diaspora micro-influencer broadcast", included: false },
        { label: "US diaspora digital press syndication", included: false },
        { label: "Performance analytics report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "450", currency: "$",
      features: [
        { label: '"As Seen In The Moveee" logo rights', included: true },
        { label: "Priority publish slot (48-hour turnaround)", included: true },
        { label: "Paid social boost — US + diaspora channels", included: true },
        { label: "Branded in-article call to action", included: true },
        { label: "Audience location & interest targeting", included: true },
        { label: "1-week Instagram Feed pin", included: true },
        { label: "GetMeLit US newsletter premium slot", included: true },
        { label: "1× US diaspora micro-influencer broadcast", included: true },
        { label: "1× US diaspora digital press syndication", included: true },
        { label: "Full demographic analytics breakdown", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
};

// ── Media Partnership (Africa only) ──────────────────────────────────────────

const moveeeProAfrica: TierService = {
  slug: "partnership",
  name: "Media Partnership",
  eyebrow: "Media Partnership",
  description:
    "A dedicated visibility package for creative and cultural organisations — book publishers and authors, art galleries, theatres, museums, and cultural institutions. We spotlight your work through reviews, interviews, news releases, and multimedia social posts to the exact audience most likely to engage and buy.",
  packages: [
    {
      name: "Publishers — Debut",
      billingNote: "Expires in 3 Months",
      price: "80k", currency: "₦",
      features: [
        { label: "Book Review", included: "0×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Galleries — Preview",
      billingNote: "Expires in 3 Months",
      price: "130k", currency: "₦",
      features: [
        { label: "Exhibition Review", included: "0×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Filmmakers — Development",
      billingNote: "Expires in 3 Months",
      price: "100k", currency: "₦",
      features: [
        { label: "Film Review", included: "0×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
  ],
  addOns: [
    { icon: "🎥", price: "₦120k", description: "Video Interview (Virtual) — recorded long-form conversation with the author, published on The Moveee's video channels." },
    { icon: "📱", price: "₦80k", description: "Instagram Live Q&A — live session hosted on The Moveee's Instagram, open to our full follower base." },
    { icon: "🎬", price: "₦220k", description: "Book Trailer — short-form video asset for your own channels to drive pre-orders and awareness." },
  ],
};

// ── Markets ───────────────────────────────────────────────────────────────────

export const MARKETS: Market[] = [
  {
    id: "africa",
    name: "Moveee Africa",
    flag: "🌍",
    tagline: "Editorial, commerce, events, and media services for Nigerian and Pan-African audiences.",
    currency: "₦",
    sections: [
      {
        id: "editorial", label: "Sponsored Content", audience: "For brands and businesses targeting Nigerian and Pan-African audiences", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial", tagLabel: "Sponsored Content",
            description: "Longform editorial feature + social amplification + GetMeLit newsletter placement. The fastest route to visibility — ideal for Nigerian fashion brands, music acts, food & lifestyle businesses.",
            price: "₦200,000",
            priceNote: "per package",
            includes: [
              "1 × longform editorial feature (800–1,200 words)",
              "Social amplification across Moveee channels (3 posts)",
              "GetMeLit newsletter placement (dedicated section)",
              "Branded content label + archive on Moveee Magazine",
            ],
          },
        ],
        service: amplifyAfrica,
      },
      {
        id: "partnership", label: "Media Partnership", audience: "For publishers, galleries, and filmmakers with an ongoing programme", kind: "tiers",
        service: moveeeProAfrica,
      },
      {
        id: "presskit", label: "Presskit", audience: "For businesses, founders, and public figures building media presence", kind: "cards",
        cards: [
          {
            name: "MoveeePR Africa — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for emerging Nigerian individuals and small businesses.",
            price: "₦100,000",
            priceNote: "per month · rolling subscription",
            includes: [
              "1 press release per month (written + edited)",
              "GEO (Generative Engine Optimisation) strategy",
              "Brand narrative development",
              "1 × Moveee news mention per quarter",
            ],
          },
          {
            name: "MoveeePR Africa — Growth",
            tag: "pr", tagLabel: "PR Subscription",
            description: "For established Nigerian businesses, brands, and public figures who need consistent media presence and strategic visibility.",
            price: "₦120,000",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 op-ed or thought leadership piece",
              "Media outreach to Nigerian publications",
              "Monthly strategy + reporting call",
              "Quarterly editorial news coverage on The Moveee",
            ],
          },
        ],
      },
      {
        id: "connect", label: "Moveee Connect", audience: "For brands seeking community-level access to Nigerian creative professionals", kind: "cards",
        cards: [
          {
            name: "Moveee Connect — Nigeria/Africa",
            tag: "community", tagLabel: "Community",
            description: "Quarterly sponsorship inside The Moveee’s curated community of Nigerian and Pan-African creatives, entrepreneurs, and professionals. Trust-transferred access — not a cold ad.",
            price: "₦100,000",
            priceNote: "per quarter",
            includes: [
              "Community introduction post by The Moveee team",
              "One sponsored content slot (resource, offer, or insight)",
              "Exclusive member offer for Moveee Connect community",
              "Access to self-selected, high-intent Black/diaspora audience",
            ],
          },
        ],
      },
      {
        id: "lifestyle", label: "Lifestyle & Commerce", audience: "For consumer product brands, retailers, and artisans", kind: "cards",
        cards: [
          {
            name: "Moveee Lifestyle — Brand Feature",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Curated ‘Shop African’ product collections for Nigerian and African designers, artisans, beauty brands, and homeware makers on the Moveee Lifestyle shop hub.",
            price: "₦80,000",
            priceNote: "flat placement fee · 10% affiliate commission per sale",
            includes: [
              "Curated shop collection listing on Moveee Lifestyle",
              "Editorial product write-up (brand story + product)",
              "GetMeLit newsletter + social promotion",
              "Seasonal ‘Shop the Culture’ drop inclusion option",
            ],
          },
          {
            name: "Lifestyle Seasonal Drop Campaign",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Full editorial commerce campaign around key cultural moments — Detty December, Lagos Fashion Week, Afrobeats season.",
            price: "₦450,000",
            priceNote: "per seasonal campaign · 3 brand slots per season",
            includes: [
              "Dedicated seasonal campaign feature",
              "Multi-post social series (5–8 posts)",
              "Priority GetMeLit placement (top-of-edition)",
              "Moveee Connect community promotion",
            ],
          },
        ],
      },
      {
        id: "events", label: "Events & Travel", audience: "For event promoters, festival organisers, and tour operators", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partnership for owambes, cultural festivals, concerts, and entertainment events across Nigeria. Single-day from ₦450,000 · two-day from ₦750,000 · multi-day festivals from ₦1,200,000.",
            price: "From ₦450,000",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Event coverage & live social content",
              "Pre/post event editorial on Moveee Happenings",
              "Official Moveee media partner badge + logo placement",
            ],
          },
          {
            name: "Cultural Institution Partner",
            tag: "events", tagLabel: "Events",
            featured: true,
            featuredBadge: "Campaign Package",
            description: "For recurring cultural events, festivals, and institutions that need more than coverage — a full editorial campaign that builds anticipation, spotlights the people behind the work, and sustains the story before, during, and after the event.",
            price: "From ₦2,500,000",
            priceNote: "3-month campaign · custom scoping on enquiry",
            includes: [
              "2× comeback / transition editorial features",
              "4× individual artist or designer spotlights",
              "Pre-event social campaign & countdown content",
              "Full Happenings event coverage (day-of)",
              "Post-event wrap editorial",
              "Additional spotlights at ₦200,000 each",
            ],
          },
          {
            name: "Moveee Origins — Tour Partner",
            tag: "travel", tagLabel: "Travel",
            description: "Commission-based curated cultural and heritage tour packages. Zero inventory risk.",
            price: "12% commission",
            priceNote: "per booking · ₦30,000/quarter listing fee",
            includes: [
              "Curated itinerary feature on Moveee Origins",
              "Origins editorial feature + photography",
              "Moveee Connect community promotion",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "uk",
    name: "Moveee UK",
    flag: "🇬🇧",
    tagline: "Editorial, commerce, and media services for the African and Caribbean diaspora across Britain.",
    currency: "£",
    sections: [
      {
        id: "editorial", label: "Sponsored Content", audience: "For brands targeting the African and Caribbean diaspora across Britain", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial", tagLabel: "Sponsored Content",
            description: "Longform editorial feature + social amplification + GetMeLit UK newsletter. Ideal for UK Afrobeats labels, Black-owned fashion brands, and events promoters.",
            price: "£600",
            priceNote: "per package",
            includes: [
              "1 × longform editorial feature (800–1,200 words)",
              "3 social posts + Reel/TikTok option",
              "GetMeLit UK newsletter feature",
              "Archived on Moveee UK editorial hub",
            ],
          },
        ],
        service: amplifyUK,
      },
      {
        id: "presskit", label: "Presskit", audience: "For UK-based founders, creatives, and brands building media presence", kind: "cards",
        cards: [
          {
            name: "MoveeePR UK — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for UK-based African and Caribbean creatives, founders, and brands. Press release writing and distribution to UK digital news platforms.",
            price: "£250",
            priceNote: "per month · rolling subscription",
            includes: [
              "1 press release per month (written + edited)",
              "Distribution to UK digital news platforms",
              "GEO (Generative Engine Optimisation) strategy",
              "Brand narrative development",
              "1 × Moveee UK editorial mention per quarter",
            ],
          },
          {
            name: "MoveeePR UK — Growth",
            tag: "pr", tagLabel: "PR Subscription",
            description: "For established UK-based African and Caribbean brands and public figures needing consistent media presence and strategic visibility.",
            price: "£450",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 thought leadership piece per month",
              "Distribution to UK and international digital publications",
              "Monthly strategy call + performance report",
              "1 × Moveee UK editorial feature per quarter",
            ],
          },
        ],
      },
      {
        id: "connect", label: "Moveee Connect", audience: "For brands seeking community-level access to Black British and diaspora professionals", kind: "cards",
        cards: [
          {
            name: "Moveee Connect — UK",
            tag: "community", tagLabel: "Community",
            description: "Quarterly sponsorship inside The Moveee's curated community of Black British and diaspora creatives, entrepreneurs, and professionals. Trusted access — not a cold ad.",
            price: "£200",
            priceNote: "per quarter",
            includes: [
              "Community introduction post by The Moveee team",
              "One sponsored content slot (resource, offer, or insight)",
              "Exclusive member offer for Moveee Connect UK community",
              "Access to self-selected, high-intent Black British/diaspora audience",
            ],
          },
        ],
      },
      {
        id: "lifestyle", label: "Lifestyle & Commerce", audience: "For Black-owned consumer brands, retailers, and artisans in the UK", kind: "cards",
        cards: [
          {
            name: "Moveee Lifestyle UK — Shop the Diaspora",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Curated shop drops for UK-based Black-owned brands — fashion, beauty, natural hair, homeware, and food.",
            price: "£250",
            priceNote: "flat placement fee · 10% affiliate commission per sale",
            includes: [
              "Curated shop collection listing on Moveee Lifestyle UK",
              "Editorial product write-up (brand + product story)",
              "GetMeLit UK newsletter + social promotion",
              "Eligible for seasonal campaign drops",
            ],
          },
          {
            name: "Lifestyle UK — Seasonal Shop Drop",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Full editorial commerce campaign timed to UK cultural moments — Black History Month, Carnival season, Christmas gifting.",
            price: "£600",
            priceNote: "per seasonal campaign · 3 brand slots per season",
            includes: [
              "Dedicated seasonal campaign feature",
              "Multi-post social series (5–8 posts)",
              "Top-of-edition GetMeLit UK placement",
              "Moveee Connect UK community promotion",
            ],
          },
        ],
      },
      {
        id: "events", label: "Events & Travel", audience: "For event promoters, entertainment organisers, and tour operators in the UK", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings UK Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Afrobeats nights, Caribbean food festivals, concerts, and diaspora entertainment events across Britain. Single-day from £600 · two-day from £1,000 · multi-day festivals from £1,800.",
            price: "From £600",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Official Moveee UK media partner badge",
              "Live social coverage + event content creation",
              "Post-event editorial on Moveee Happenings UK",
            ],
          },
          {
            name: "Cultural Institution Partner",
            tag: "events", tagLabel: "Events",
            featured: true,
            featuredBadge: "Campaign Package",
            description: "For recurring cultural events, festivals, and institutions that need more than coverage — a full editorial campaign that builds anticipation, spotlights the people behind the work, and sustains the story before, during, and after the event.",
            price: "From £3,200",
            priceNote: "3-month campaign · custom scoping on enquiry",
            includes: [
              "2× comeback / transition editorial features",
              "4× individual artist or designer spotlights",
              "Pre-event social campaign & countdown content",
              "Full Happenings event coverage (day-of)",
              "Post-event wrap editorial",
              "Additional spotlights at £280 each",
            ],
          },
          {
            name: "Origins UK — Heritage Tours",
            tag: "travel", tagLabel: "Travel",
            description: "Roots tourism for UK diaspora Nigerians, Ghanaians, and Jamaicans — homecoming trips, owambes, cultural festivals.",
            price: "12% commission",
            priceNote: "per booking · £75/quarter listing fee",
            includes: [
              "Heritage itinerary featured on Moveee Origins",
              "Editorial spotlight + photography",
              "GetMeLit UK + Moveee Connect promotion",
            ],
          },
        ],
      },
    ],
  },

  {
    id: "us",
    name: "Moveee US",
    flag: "🇺🇸",
    tagline: "Editorial, commerce, and media services for the African and Caribbean diaspora across the United States.",
    currency: "$",
    sections: [
      {
        id: "editorial", label: "Sponsored Content", audience: "For brands targeting the African and Caribbean diaspora across the US", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Brand Culture Partnership",
            tag: "editorial", tagLabel: "Sponsored Content",
            description: "Sponsored editorial + newsletter placement for US brands targeting African and Caribbean diaspora audiences. The culturally-specific alternative to The Root or Essence.",
            price: "$800",
            priceNote: "per package",
            includes: [
              "Sponsored editorial feature (branded)",
              "GetMeLit US newsletter placement",
              "Social amplification across Moveee US channels",
              "Archived on Moveee US editorial hub",
            ],
          },
        ],
        service: amplifyUS,
      },
      {
        id: "presskit", label: "Presskit", audience: "For US-based African diaspora founders, creatives, and brands", kind: "cards",
        cards: [
          {
            name: "MoveeePR US — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for African and diaspora-founded brands in the US. Press release writing and distribution to US digital news platforms.",
            price: "$350",
            priceNote: "per month · rolling subscription",
            includes: [
              "1 press release per month (written + edited)",
              "Distribution to US digital news platforms",
              "GEO (Generative Engine Optimisation) strategy",
              "Brand narrative development",
              "1 × Moveee US editorial mention per quarter",
            ],
          },
          {
            name: "MoveeePR US — Growth",
            tag: "pr", tagLabel: "PR Subscription",
            description: "For established US-based African diaspora brands and public figures who need consistent media presence and strategic visibility.",
            price: "$650",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 thought leadership piece per month",
              "Distribution to US and international digital publications",
              "Monthly strategy call + performance report",
              "1 × Moveee US editorial feature per quarter",
            ],
          },
        ],
      },
      {
        id: "connect", label: "Moveee Connect", audience: "For brands seeking community-level access to African diaspora professionals in the US", kind: "cards",
        cards: [
          {
            name: "Moveee Connect — US",
            tag: "community", tagLabel: "Community",
            description: "Quarterly sponsorship inside The Moveee’s curated community of African and Caribbean diaspora creatives, entrepreneurs, and professionals across the United States.",
            price: "$250",
            priceNote: "per quarter",
            includes: [
              "Community introduction post by The Moveee team",
              "One sponsored content slot (resource, offer, or insight)",
              "Exclusive member offer for Moveee Connect US community",
              "Access to self-selected, high-intent diaspora audience in NYC, Atlanta, Houston, DC, and LA",
            ],
          },
        ],
      },
      {
        id: "lifestyle", label: "Lifestyle & Commerce", audience: "For Black-owned consumer brands, retailers, and artisans in the US", kind: "cards",
        cards: [
          {
            name: "Moveee Lifestyle US — Shop the Culture",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Curated ‘Shop the Culture’ collections featuring US Black-owned brands — DTC fashion, natural hair and beauty, food, and homeware.",
            price: "$450",
            priceNote: "flat placement fee · 10% affiliate commission per sale",
            includes: [
              "Curated shop collection feature on Moveee Lifestyle US",
              "Editorial product write-up (brand story + product)",
              "GetMeLit US newsletter + social promotion",
              "Eligible for seasonal campaign drops",
            ],
          },
          {
            name: "Lifestyle US — Seasonal Shop Drop",
            tag: "lifestyle", tagLabel: "Lifestyle",
            description: "Full editorial commerce campaign around US cultural moments — Black History Month, Juneteenth, Holiday gifting.",
            price: "$900",
            priceNote: "per seasonal campaign · 3 brand slots per season",
            includes: [
              "Dedicated seasonal campaign editorial",
              "Multi-post social series (5–8 posts)",
              "Top-of-edition GetMeLit US placement",
              "Moveee Connect US community promotion",
            ],
          },
        ],
      },
      {
        id: "events", label: "Events & Travel", audience: "For event promoters, entertainment organisers, and tour operators in the US", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings US Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Nigerian community events, owambes, Afrobeats concerts, and cultural galas across NYC, Atlanta, Houston, DC, and LA. Single-day from $1,000 · two-day from $1,600 · multi-day festivals from $2,800.",
            price: "From $1,000",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Official Moveee US media partner badge",
              "Live coverage + content creation",
              "Pre/post event editorial on Moveee Happenings US",
            ],
          },
          {
            name: "Cultural Institution Partner",
            tag: "events", tagLabel: "Events",
            featured: true,
            featuredBadge: "Campaign Package",
            description: "For recurring cultural events, festivals, and institutions that need more than coverage — a full editorial campaign that builds anticipation, spotlights the people behind the work, and sustains the story before, during, and after the event.",
            price: "From $5,500",
            priceNote: "3-month campaign · custom scoping on enquiry",
            includes: [
              "2× comeback / transition editorial features",
              "4× individual artist or designer spotlights",
              "Pre-event social campaign & countdown content",
              "Full Happenings event coverage (day-of)",
              "Post-event wrap editorial",
              "Additional spotlights at $450 each",
            ],
          },
        ],
      },
    ],
  },
];

export function getMarket(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}
