// ── Shared types ─────────────────────────────────────────────────────────────

export type CardTag =
  | "editorial" | "lifestyle" | "pr" | "events" | "travel" | "consulting";

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
  | { id: string; label: string; kind: "tiers"; service: TierService };

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
      price: "60", currency: "$",
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
      price: "115", currency: "$",
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
      price: "180", currency: "$",
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
      price: "420", currency: "$",
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

// ── PressKit per market ───────────────────────────────────────────────────────

const presskitAfrica: TierService = {
  slug: "presskit",
  name: "Moveee PressKit",
  eyebrow: "PR & Press Coverage",
  description:
    "Get your story placed in Nigeria's most-read newspapers and digital publications. PressKit gives you guaranteed editorial placement across the outlets your audience already trusts — from Punch and Vanguard to Premium Times and Business Day.",
  packages: [
    {
      name: "Nigeria Media",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "100k", currency: "₦", unit: "Per Platform",
      features: [
        { label: "10% Discount on Bulk Buy (5+ Platforms)", included: true },
        { label: "Punch", included: true },
        { label: "Vanguard", included: true },
        { label: "Nation", included: true },
        { label: "Guardian", included: true },
        { label: "Blueprint", included: true },
        { label: "Tribune", included: true },
        { label: "Independent", included: true },
        { label: "Nigerian Pilot", included: true },
        { label: "Daily Trust", included: true },
        { label: "Daily Post", included: true },
        { label: "Business Day", included: true },
        { label: "PM News", included: true },
        { label: "Premium Times", included: true },
        { label: "New Telegraph", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
  addOns: [
    { icon: "📎", price: "₦320k", description: "Include contact details, images, logo, and artwork — or commission an extensive interview format." },
    { icon: "📅", price: "+₦130k", description: "Backdate your story to an earlier date than the original publication period." },
    { icon: "✍️", price: "+₦40k", description: "Commission a unique story angle per platform so each outlet gets an exclusive perspective." },
  ],
};

const presskitUK: TierService = {
  slug: "presskit",
  name: "Moveee PressKit UK",
  eyebrow: "PR & Press Coverage",
  description:
    "Get your story placed in trusted UK publications reaching the Black British and diaspora community. PressKit UK gives you guaranteed editorial placement across outlets covering London, Birmingham, Manchester, and beyond — putting your story where it will be seen and remembered.",
  packages: [
    {
      name: "UK Media",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "170", currency: "£", unit: "Per Platform",
      features: [
        { label: "10% Discount on Bulk Buy (5+ Platforms)", included: true },
        { label: "London Journal", included: true },
        { label: "Glasgow Report", included: true },
        { label: "Manchester Times", included: true },
        { label: "UK Herald", included: true },
        { label: "Birmingham Times", included: true },
        { label: "UK Reporter", included: true },
        { label: "UK Wire", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
  addOns: [
    { icon: "📎", price: "£220", description: "Include contact details, images, logo, and artwork — or commission an extensive interview format." },
    { icon: "📅", price: "+£100", description: "Backdate your story to an earlier date than the original publication period." },
    { icon: "✍️", price: "+£45", description: "Commission a unique story angle per platform so each outlet gets an exclusive perspective." },
  ],
};

const presskitUS: TierService = {
  slug: "presskit",
  name: "Moveee PressKit US",
  eyebrow: "PR & Press Coverage",
  description:
    "Get your story placed in trusted US publications reaching African and Caribbean diaspora audiences. PressKit US gives you guaranteed editorial placement in the digital and print outlets that Black American and diaspora communities actually read.",
  packages: [
    {
      name: "US Media",
      highlight: true,
      billingNote: "Monthly Recurring Option Also Available",
      price: "220", currency: "$", unit: "Per Platform",
      features: [
        { label: "10% Discount on Bulk Buy (5+ Platforms)", included: true },
        { label: "Atlanta Black Star", included: true },
        { label: "Blavity", included: true },
        { label: "Houston Defender", included: true },
        { label: "New York Amsterdam News", included: true },
        { label: "Afro News", included: true },
        { label: "The African Exponent", included: true },
        { label: "Diaspora Digest", included: true },
      ],
      cta: "Buy Once", ctaSecondary: "Subscribe to Monthly Plan",
    },
  ],
  addOns: [
    { icon: "📎", price: "$220", description: "Include contact details, images, logo, and artwork — or commission an extensive interview format." },
    { icon: "📅", price: "+$100", description: "Backdate your story to an earlier date than the original publication period." },
    { icon: "✍️", price: "+$45", description: "Commission a unique story angle per platform so each outlet gets an exclusive perspective." },
  ],
};

// ── MoveeeePro (Africa only) ──────────────────────────────────────────────────

const moveeeProAfrica: TierService = {
  slug: "book-publishers",
  name: "MoveeeePro",
  eyebrow: "For Book Publishers & Authors",
  description:
    "The premium feature package for publishers and authors who want their books not just read — but seen, discussed, and remembered. We spotlight your title through reviews, author interviews, news releases, and multimedia social posts to the exact audience most likely to buy it.",
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
        id: "editorial", label: "Editorial", kind: "cards",
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
        id: "amplify", label: "Media Amplification", kind: "tiers",
        service: amplifyAfrica,
      },
      {
        id: "pr", label: "PR", kind: "cards",
        cards: [
          {
            name: "MoveeePR Africa — Starter",
            tag: "pr", tagLabel: "PR Subscription",
            description: "AI-powered PR subscription for emerging Nigerian individuals and small businesses.",
            price: "₦65,000",
            priceNote: "per month · rolling subscription",
            includes: [
              "1 press release per month (AI-assisted + edited)",
              "GEO (Generative Engine Optimisation) strategy",
              "Brand narrative development",
              "1 × Moveee editorial mention per quarter",
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
              "Moveee editorial feature (quarterly)",
            ],
          },
        ],
      },
      {
        id: "presskit", label: "Press Coverage", kind: "tiers",
        service: presskitAfrica,
      },
      {
        id: "book-publishers", label: "Book Publishers", kind: "tiers",
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
        id: "editorial", label: "Editorial", kind: "cards",
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
        id: "amplify", label: "Media Amplification", kind: "tiers",
        service: amplifyUK,
      },
      {
        id: "pr", label: "PR", kind: "cards",
        cards: [
          {
            name: "MoveeePR UK",
            tag: "pr", tagLabel: "PR Subscription",
            description: "Affordable AI-powered PR for UK-based African and Caribbean creatives. London agency retainers start at £1,500–£3,000/month — MoveeePR UK is the culturally fluent alternative.",
            price: "£350",
            priceNote: "per month · rolling subscription",
            includes: [
              "2 press releases per month (AI-assisted + edited)",
              "UK media outreach (Black press + mainstream)",
              "Monthly strategy call + monthly report",
              "1 × Moveee UK editorial mention per quarter",
            ],
          },
        ],
      },
      {
        id: "presskit", label: "Press Coverage", kind: "tiers",
        service: presskitUK,
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
        id: "editorial", label: "Editorial", kind: "cards",
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
        id: "amplify", label: "Media Amplification", kind: "tiers",
        service: amplifyUS,
      },
      {
        id: "consulting", label: "Consulting & PR", kind: "cards",
        cards: [
          {
            name: "Diaspora Brand Launchpad",
            tag: "consulting", tagLabel: "Consulting",
            description: "Full-service package for African founders entering the US market — market positioning + PR + editorial brand storytelling.",
            price: "$2,500",
            priceNote: "one-off project fee",
            includes: [
              "US market positioning strategy session",
              "Brand narrative for US diaspora audience",
              "1 × Moveee US editorial feature",
              "PR media outreach bundle (5–10 publications)",
            ],
          },
        ],
      },
      {
        id: "presskit", label: "Press Coverage", kind: "tiers",
        service: presskitUS,
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
    ],
  },
];

export function getMarket(id: string): Market | undefined {
  return MARKETS.find((m) => m.id === id);
}
