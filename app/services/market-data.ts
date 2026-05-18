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
  | { id: string; label: string; kind: "cards"; cards: RateCard[] }
  | { id: string; label: string; kind: "tiers"; service: TierService }
  | { id: string; label: string; kind: "mixed"; cards: RateCard[]; service: TierService; serviceLabel?: string };

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
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 30k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: false },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "Newspaper Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "150k", currency: "₦",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 100k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "Newspaper Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "260k", currency: "₦",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 180k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "1 Week Pin to Top of Feed", included: true },
        { label: "Influencer Broadcast", included: false },
        { label: "Newspaper Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "650k", currency: "₦",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 400k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: true },
        { label: "1× Influencer Broadcast", included: true },
        { label: "1× Newspaper Broadcast", included: true },
        { label: "Full Reach Analytics Report", included: true },
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
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 30k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: false },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "UK Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "90", currency: "£",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 100k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "UK Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "145", currency: "£",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 180k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "1 Week Pin to Top of Feed", included: true },
        { label: "Influencer Broadcast", included: false },
        { label: "UK Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "350", currency: "£",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 400k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: true },
        { label: "1× Influencer Broadcast", included: true },
        { label: "1× UK Press Broadcast", included: true },
        { label: "Full Reach Analytics Report", included: true },
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
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 30k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: false },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "US Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored",
      billingNote: "Monthly Recurring Option Also Available",
      price: "190", currency: "$",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 100k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: false },
        { label: "Influencer Broadcast", included: false },
        { label: "US Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Sponsored+",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "300", currency: "$",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 180k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "1 Week Pin to Top of Feed", included: true },
        { label: "Influencer Broadcast", included: false },
        { label: "US Press Broadcast", included: false },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
    {
      name: "Invested",
      billingNote: "Monthly Recurring Option Also Available",
      price: "700", currency: "$",
      features: [
        { label: "Credible As-Seen-In Logo", included: true },
        { label: "Priority-Track Feature", included: true },
        { label: "Reach 400k Extra People", included: true },
        { label: "End-of-Article Call to Action", included: true },
        { label: "Audience Location Targeting", included: true },
        { label: "Pin to Instagram Feed", included: true },
        { label: "1× Influencer Broadcast", included: true },
        { label: "1× US Press Broadcast", included: true },
        { label: "Full Reach Analytics Report", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
};

// ── MoveeeePro (Africa only) ──────────────────────────────────────────────────

const moveeeProAfrica: TierService = {
  slug: "partnership",
  name: "MoveeeePro",
  eyebrow: "Partnership Program",
  description:
    "A dedicated visibility package for creative and cultural organisations — book publishers and authors, art galleries, theatres, museums, and cultural institutions. We spotlight your work through reviews, interviews, news releases, and multimedia social posts to the exact audience most likely to engage and buy.",
  packages: [
    {
      name: "Starter",
      billingNote: "Expires in 3 Months",
      price: "65k", currency: "₦",
      features: [
        { label: "Book Review", included: "0×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Buy Now",
    },
    {
      name: "Growth",
      billingNote: "Expires in 3 Months",
      price: "150k", currency: "₦",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: "Buy Once",
    },
    {
      name: "Momentum",
      highlight: true,
      billingNote: "Expires in 3 Months",
      price: "250k", currency: "₦",
      features: [
        { label: "Book Review", included: "2×" },
        { label: "Author Interview", included: "2×" },
        { label: "News Release", included: "4×" },
        { label: "Social Media Posts", included: "Multimedia" },
      ],
      cta: "Buy Once",
    },
    {
      name: "Visibility+",
      billingNote: "Expires in 3 Months",
      price: "580k", currency: "₦",
      features: [
        { label: "Book Review", included: "5×" },
        { label: "Author Interview", included: "5×" },
        { label: "News Release", included: "10×" },
        { label: "Social Media Posts", included: "Multimedia" },
      ],
      cta: "Buy Once",
    },
  ],
  addOns: [
    { icon: "🎥", price: "₦100k", description: "Video Interview (Virtual) — recorded long-form conversation with the author, published on The Moveee's video channels." },
    { icon: "📱", price: "₦65k", description: "Instagram Live Q&A — live session hosted on The Moveee's Instagram, open to our full follower base." },
    { icon: "🎬", price: "₦200k", description: "Basic Book Trailer — short-form video asset for your own channels to drive pre-orders and awareness." },
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
        id: "editorial", label: "Editorial & Amplification", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial", tagLabel: "Editorial",
            description: "Longform editorial feature + social amplification + GetMeLit newsletter placement. The fastest route to visibility — ideal for Nigerian fashion brands, music acts, food & lifestyle businesses.",
            price: "₦250,000",
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
        id: "lifestyle", label: "Lifestyle & Commerce", kind: "cards",
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
        id: "presskit", label: "Presskit", kind: "cards",
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
        id: "partnership", label: "Partnership Program", kind: "tiers",
        service: moveeeProAfrica,
      },
      {
        id: "events", label: "Events & Travel", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partnership for owambes, cultural festivals, concerts, and art shows across Nigeria.",
            price: "From ₦250,000",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Event coverage & live social content",
              "Pre/post event editorial on Moveee Happenings",
              "Official Moveee media partner badge + logo placement",
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
      {
        id: "connect", label: "Moveee Connect", kind: "cards",
        cards: [
          {
            name: "Moveee Connect — Nigeria/Africa",
            tag: "community", tagLabel: "Community",
            description: "Quarterly sponsorship inside The Moveee's curated community of Nigerian and Pan-African creatives, entrepreneurs, and professionals. Trust-transferred access — not a cold ad.",
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
        id: "editorial", label: "Editorial & Amplification", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial", tagLabel: "Editorial",
            description: "Longform editorial feature + social amplification + GetMeLit UK newsletter. Ideal for UK Afrobeats labels, Black-owned fashion brands, and events promoters.",
            price: "£850",
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
        id: "lifestyle", label: "Lifestyle & Commerce", kind: "cards",
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
        id: "presskit", label: "Presskit", kind: "cards",
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
        id: "events", label: "Events & Travel", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings UK Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Afrobeats nights, art shows, Caribbean food festivals, and diaspora film screenings across Britain.",
            price: "From £400",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Official Moveee UK media partner badge",
              "Live social coverage + event content creation",
              "Post-event editorial on Moveee Happenings UK",
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
      {
        id: "connect", label: "Moveee Connect", kind: "cards",
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
        id: "editorial", label: "Editorial & Amplification", kind: "mixed",
        serviceLabel: "Amplify your feature",
        cards: [
          {
            name: "Brand Culture Partnership",
            tag: "editorial", tagLabel: "Editorial",
            description: "Sponsored editorial + newsletter placement for US brands targeting African and Caribbean diaspora audiences. The culturally-specific alternative to The Root or Essence.",
            price: "$1,200",
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
        id: "lifestyle", label: "Lifestyle & Commerce", kind: "cards",
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
        id: "presskit", label: "Presskit", kind: "cards",
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
        id: "events", label: "Events & Travel", kind: "cards",
        cards: [
          {
            name: "Moveee Happenings US Partner",
            tag: "events", tagLabel: "Events",
            description: "Official media partner for Nigerian community events, owambes, Afrobeats concerts, and cultural galas across NYC, Atlanta, Houston, DC, and LA.",
            price: "From $750",
            priceNote: "per event · custom quotes on enquiry",
            includes: [
              "Official Moveee US media partner badge",
              "Live coverage + content creation",
              "Pre/post event editorial on Moveee Happenings US",
            ],
          },
        ],
      },
      {
        id: "connect", label: "Moveee Connect", kind: "cards",
        cards: [
          {
            name: "Moveee Connect — US",
            tag: "community", tagLabel: "Community",
            description: "Quarterly sponsorship inside The Moveee's curated community of African and Caribbean diaspora creatives, entrepreneurs, and professionals across the United States.",
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
    ],
  },
];

export function getMarket(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}
