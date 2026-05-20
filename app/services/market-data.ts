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
  | { id: string; label: string; audience?: string; kind: "cards"; cards: RateCard[]; crossSellTo?: string }
  | { id: string; label: string; audience?: string; kind: "tiers"; service: TierService; crossSellTo?: string }
  | { id: string; label: string; audience?: string; kind: "mixed"; cards: RateCard[]; service: TierService; serviceLabel?: string; crossSellTo?: string };

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
      price: "85", currency: "£",
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
      price: "140", currency: "£",
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
      price: "575", currency: "$",
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

// ── Media Partnership ─────────────────────────────────────────────────────────

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
        { label: "Book Review", included: "1×" },
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
        { label: "Exhibition Review", included: "1×" },
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
        { label: "Film Review", included: "1×" },
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

const moveeeProUK: TierService = {
  slug: "partnership",
  name: "Media Partnership UK",
  eyebrow: "Media Partnership",
  description:
    "A dedicated visibility package for Black British and diaspora creative organisations — independent publishers, art galleries, theatres, and filmmakers. We spotlight your work through reviews, interviews, news releases, and social content to the culturally engaged Black British audience most likely to engage, attend, and buy.",
  packages: [
    {
      name: "Publishers — Debut",
      billingNote: "Expires in 3 Months",
      price: "180", currency: "£",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Galleries — Preview",
      billingNote: "Expires in 3 Months",
      price: "280", currency: "£",
      features: [
        { label: "Exhibition Review", included: "1×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Filmmakers — Development",
      billingNote: "Expires in 3 Months",
      price: "220", currency: "£",
      features: [
        { label: "Film Review", included: "1×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
  ],
  addOns: [
    { icon: "🎥", price: "£250", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "£150", description: "Instagram Live Q&A — live session hosted on The Moveee UK Instagram, open to our full follower base." },
    { icon: "🎬", price: "£450", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const moveeeProUS: TierService = {
  slug: "partnership",
  name: "Media Partnership US",
  eyebrow: "Media Partnership",
  description:
    "A dedicated visibility package for African and Caribbean diaspora creative organisations in the US — independent publishers, art galleries, and filmmakers. We spotlight your work through reviews, interviews, news releases, and social content to the culturally engaged diaspora audience across NYC, Atlanta, Houston, DC, and LA.",
  packages: [
    {
      name: "Publishers — Debut",
      billingNote: "Expires in 3 Months",
      price: "280", currency: "$",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Galleries — Preview",
      billingNote: "Expires in 3 Months",
      price: "420", currency: "$",
      features: [
        { label: "Exhibition Review", included: "1×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
    {
      name: "Filmmakers — Development",
      billingNote: "Expires in 3 Months",
      price: "350", currency: "$",
      features: [
        { label: "Film Review", included: "1×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Start Partnership",
    },
  ],
  addOns: [
    { icon: "🎥", price: "$380", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "$230", description: "Instagram Live Q&A — live session hosted on The Moveee US Instagram, open to our full follower base." },
    { icon: "🎬", price: "$650", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
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
        crossSellTo: "amplify",
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
        id: "amplify", label: "Content Amplification", audience: "Add-on for Sponsored Content and Media Partnership — paid social, influencer reach, and ad placements", kind: "tiers",
        service: amplifyAfrica,
      },
      {
        id: "partnership", label: "Media Partnership", audience: "For publishers, galleries, and filmmakers with an ongoing programme", kind: "tiers",
        crossSellTo: "amplify",
        service: moveeeProAfrica,
      },
      {
        id: "presskit", label: "Presskit", audience: "For businesses, founders, and public figures building media presence", kind: "cards",
        cards: [
          {
            name: "Single Press Release",
            tag: "pr", tagLabel: "One-Off",
            description: "One professionally written and distributed press release — no subscription required. Ideal for product launches, funding announcements, or event news.",
            price: "₦80,000",
            priceNote: "one-off · no commitment",
            includes: [
              "1 press release (written, edited, formatted)",
              "Distribution to Nigerian digital news platforms",
              "GEO-optimised headline and body copy",
            ],
          },
          {
            name: "MoveeePR Africa — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for emerging Nigerian founders, creatives, and small businesses building their first media presence.",
            price: "₦150,000",
            priceNote: "per month · rolling subscription",
            includes: [
              "1 press release per month (written + edited)",
              "Distribution to Nigerian digital news platforms",
              "GEO (Generative Engine Optimisation) strategy",
              "Brand narrative development",
              "1 × Moveee news mention per quarter",
            ],
          },
          {
            name: "MoveeePR Africa — Growth",
            tag: "pr", tagLabel: "PR Subscription",
            description: "For established Nigerian businesses, brands, and public figures who need consistent media presence and strategic visibility.",
            price: "₦300,000",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 op-ed or thought leadership piece per month",
              "Media outreach to Nigerian and Pan-African publications",
              "Monthly strategy call + performance report",
              "1 × Moveee editorial feature per quarter",
            ],
          },
          {
            name: "MoveeePR Africa — Authority",
            tag: "pr", tagLabel: "PR Subscription",
            featured: true,
            featuredBadge: "Most Comprehensive",
            description: "For serious brands, agencies, and public figures that need heavyweight coverage — mainstream Nigerian media, thought leadership placement, and proactive reputation management.",
            price: "₦550,000",
            priceNote: "per month · 3-month minimum",
            includes: [
              "3+ press releases per month",
              "Thought leadership + op-ed placements",
              "Outreach to mainstream Nigerian and international publications",
              "Weekly strategy touchpoint",
              "Monthly Moveee editorial feature",
              "Crisis and reputation management support",
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
            name: "Happenings Partner — Single Day",
            tag: "events", tagLabel: "Events",
            description: "Official media partnership for one-night owambes, concerts, cultural evenings, and single-day events across Nigeria.",
            price: "₦450,000",
            priceNote: "per event",
            includes: [
              "Day-of event coverage & live social content",
              "Pre/post event editorial on Moveee Happenings",
              "Official Moveee media partner badge + logo placement",
            ],
          },
          {
            name: "Happenings Partner — Multi-Day Festival",
            tag: "events", tagLabel: "Events",
            description: "Extended media partnership for two-day events, weekend festivals, and multi-day cultural programmes across Nigeria.",
            price: "From ₦750,000",
            priceNote: "2-day from ₦750,000 · 3+ days from ₦1,200,000",
            includes: [
              "Full festival coverage across all days",
              "Daily social content + highlights recap",
              "Pre/post festival editorial on Moveee Happenings",
              "Official Moveee media partner badge + logo placement",
            ],
          },
          {
            name: "Pre-Event Rollout Campaign",
            tag: "events", tagLabel: "Events",
            description: "Build anticipation before the event — editorial, social, and newsletter coverage in the weeks and months leading up to your event. Ideal for ticket launches, artist announcements, and countdown campaigns.",
            price: "From ₦400,000",
            priceNote: "per month · minimum 1 month",
            includes: [
              "2× editorial features per month",
              "Social campaign & countdown content",
              "Moveee newsletter mention",
              "Can be bundled with day-of Happenings coverage",
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
        crossSellTo: "amplify",
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
        id: "amplify", label: "Content Amplification", audience: "Add-on for Sponsored Content and Media Partnership — paid social, influencer reach, and ad placements", kind: "tiers",
        service: amplifyUK,
      },
      {
        id: "partnership", label: "Media Partnership", audience: "For UK publishers, galleries, and filmmakers with an ongoing programme", kind: "tiers",
        crossSellTo: "amplify",
        service: moveeeProUK,
      },
      {
        id: "presskit", label: "Presskit", audience: "For UK-based founders, creatives, and brands building media presence", kind: "cards",
        cards: [
          {
            name: "Single Press Release",
            tag: "pr", tagLabel: "One-Off",
            description: "One professionally written and distributed press release — no subscription required. Ideal for product launches, funding announcements, or event news.",
            price: "£175",
            priceNote: "one-off · no commitment",
            includes: [
              "1 press release (written, edited, formatted)",
              "Distribution to UK digital news platforms",
              "GEO-optimised headline and body copy",
            ],
          },
          {
            name: "MoveeePR UK — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for UK-based African and Caribbean founders, creatives, and brands building their first media presence.",
            price: "£300",
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
            price: "£575",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 thought leadership piece per month",
              "Distribution to UK and international digital publications",
              "Monthly strategy call + performance report",
              "1 × Moveee UK editorial feature per quarter",
            ],
          },
          {
            name: "MoveeePR UK — Authority",
            tag: "pr", tagLabel: "PR Subscription",
            featured: true,
            featuredBadge: "Most Comprehensive",
            description: "For serious UK brands, agencies, and public figures that need heavyweight coverage — mainstream British media, thought leadership placement, and proactive reputation management.",
            price: "£1,050",
            priceNote: "per month · 3-month minimum",
            includes: [
              "3+ press releases per month",
              "Thought leadership + op-ed placements",
              "Outreach to mainstream UK and international publications",
              "Weekly strategy touchpoint",
              "Monthly Moveee UK editorial feature",
              "Crisis and reputation management support",
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
            name: "Happenings UK Partner — Single Day",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Afrobeats nights, Caribbean food festivals, concerts, and single-day diaspora events across Britain.",
            price: "£600",
            priceNote: "per event",
            includes: [
              "Day-of live social coverage + content creation",
              "Post-event editorial on Moveee Happenings UK",
              "Official Moveee UK media partner badge",
            ],
          },
          {
            name: "Happenings UK Partner — Multi-Day Festival",
            tag: "events", tagLabel: "Events",
            description: "Extended media partnership for weekend events, two-day festivals, and multi-day cultural programmes across Britain.",
            price: "From £1,000",
            priceNote: "2-day from £1,000 · 3+ days from £1,800",
            includes: [
              "Full festival coverage across all days",
              "Daily social content + highlights recap",
              "Pre/post festival editorial on Moveee Happenings UK",
              "Official Moveee UK media partner badge",
            ],
          },
          {
            name: "Pre-Event Rollout Campaign",
            tag: "events", tagLabel: "Events",
            description: "Build anticipation before the event — editorial, social, and newsletter coverage in the weeks and months leading up to your event. Ideal for ticket launches, artist announcements, and countdown campaigns.",
            price: "From £550",
            priceNote: "per month · minimum 1 month",
            includes: [
              "2× editorial features per month",
              "Social campaign & countdown content",
              "GetMeLit UK newsletter mention",
              "Can be bundled with day-of Happenings coverage",
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
        crossSellTo: "amplify",
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
        id: "amplify", label: "Content Amplification", audience: "Add-on for Sponsored Content and Media Partnership — paid social, influencer reach, and ad placements", kind: "tiers",
        service: amplifyUS,
      },
      {
        id: "partnership", label: "Media Partnership", audience: "For US publishers, galleries, and filmmakers with an ongoing programme", kind: "tiers",
        crossSellTo: "amplify",
        service: moveeeProUS,
      },
      {
        id: "presskit", label: "Presskit", audience: "For US-based African diaspora founders, creatives, and brands", kind: "cards",
        cards: [
          {
            name: "Single Press Release",
            tag: "pr", tagLabel: "One-Off",
            description: "One professionally written and distributed press release — no subscription required. Ideal for product launches, funding announcements, or event news.",
            price: "$280",
            priceNote: "one-off · no commitment",
            includes: [
              "1 press release (written, edited, formatted)",
              "Distribution to US digital news platforms",
              "GEO-optimised headline and body copy",
            ],
          },
          {
            name: "MoveeePR US — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Monthly PR subscription for African and diaspora-founded brands in the US building their first media presence.",
            price: "$500",
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
            price: "$950",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 thought leadership piece per month",
              "Distribution to US and international digital publications",
              "Monthly strategy call + performance report",
              "1 × Moveee US editorial feature per quarter",
            ],
          },
          {
            name: "MoveeePR US — Authority",
            tag: "pr", tagLabel: "PR Subscription",
            featured: true,
            featuredBadge: "Most Comprehensive",
            description: "For serious US brands, agencies, and public figures that need heavyweight coverage — mainstream American media, thought leadership placement, and proactive reputation management.",
            price: "$1,800",
            priceNote: "per month · 3-month minimum",
            includes: [
              "3+ press releases per month",
              "Thought leadership + op-ed placements",
              "Outreach to mainstream US and international publications",
              "Weekly strategy touchpoint",
              "Monthly Moveee US editorial feature",
              "Crisis and reputation management support",
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
            name: "Happenings US Partner — Single Day",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Nigerian community events, owambes, Afrobeats concerts, and single-day cultural galas across NYC, Atlanta, Houston, DC, and LA.",
            price: "$1,000",
            priceNote: "per event",
            includes: [
              "Day-of live coverage + content creation",
              "Post-event editorial on Moveee Happenings US",
              "Official Moveee US media partner badge",
            ],
          },
          {
            name: "Happenings US Partner — Multi-Day Festival",
            tag: "events", tagLabel: "Events",
            description: "Extended media partnership for weekend events, two-day festivals, and multi-day cultural programmes across the US.",
            price: "From $1,600",
            priceNote: "2-day from $1,600 · 3+ days from $2,800",
            includes: [
              "Full festival coverage across all days",
              "Daily social content + highlights recap",
              "Pre/post festival editorial on Moveee Happenings US",
              "Official Moveee US media partner badge",
            ],
          },
          {
            name: "Pre-Event Rollout Campaign",
            tag: "events", tagLabel: "Events",
            description: "Build anticipation before the event — editorial, social, and newsletter coverage in the weeks and months leading up to your event. Ideal for ticket launches, artist announcements, and countdown campaigns.",
            price: "From $900",
            priceNote: "per month · minimum 1 month",
            includes: [
              "2× editorial features per month",
              "Social campaign & countdown content",
              "GetMeLit US newsletter mention",
              "Can be bundled with day-of Happenings coverage",
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
