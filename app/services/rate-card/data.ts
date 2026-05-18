export type CardTag =
  | "editorial"
  | "lifestyle"
  | "pr"
  | "events"
  | "travel"
  | "consulting";

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

export type MarketSection = {
  label: string;
  cards: RateCard[];
};

export type Market = {
  id: string;
  label: string;
  flag: string;
  intro: string;
  sections: MarketSection[];
};

export type ConnectBar = {
  title: string;
  description: string;
  price: string;
  priceNote: string;
};

export const CONNECT_BAR: ConnectBar = {
  title: "Moveee Connect — Community Sponsorship",
  description:
    "Brands and service providers wanting direct access to The Moveee's Black and diaspora professional community. Available across all three markets as a quarterly sponsorship. Includes community feature, sponsored content slot, and member offer.",
  price: "₦100k · £200 · $250",
  priceNote: "per quarter, per market",
};

export const MARKETS: Market[] = [
  {
    id: "africa",
    label: "Moveee Africa",
    flag: "🌍",
    intro:
      "Moveee Africa is the origin platform — editorial, commerce, events, and travel for Nigerian and Pan-African audiences. Target clients include Nigerian fashion and lifestyle brands, music and entertainment companies, cultural events promoters, and African tour operators.",
    sections: [
      {
        label: "Editorial",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial",
            tagLabel: "Editorial",
            description:
              "Longform editorial feature + social amplification + GetMeLit newsletter placement. The fastest route to first revenue — ideal for Nigerian fashion brands, music acts, food & lifestyle businesses.",
            price: "₦150,000 – ₦500,000",
            priceNote: "per package · custom for campaigns",
            includes: [
              "1 × longform editorial feature (800–1,200 words)",
              "Social amplification across Moveee channels (3 posts)",
              "GetMeLit newsletter placement (dedicated section)",
              "Branded content label + archive on Moveee Magazine",
            ],
            featured: true,
            featuredBadge: "Most popular",
          },
        ],
      },
      {
        label: "Lifestyle & Commerce",
        cards: [
          {
            name: "Moveee Lifestyle — Brand Feature",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Curated "Shop African" product collections for Nigerian and African designers, artisans, beauty brands, and homeware makers on the Moveee Lifestyle shop hub.",
            price: "₦50,000 – ₦200,000",
            priceNote: "flat placement fee, or 5–15% affiliate commission per sale",
            includes: [
              "Curated shop collection listing on Moveee Lifestyle",
              "Editorial product write-up (brand story + product)",
              "GetMeLit newsletter + social promotion",
              "Seasonal "Shop the Culture" drop inclusion option",
            ],
          },
          {
            name: "Lifestyle Seasonal Drop Campaign",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Full editorial commerce campaign around key cultural moments — Detty December, Lagos Fashion Week, Afrobeats season. Brands get a dedicated drop feature across editorial + shop + newsletter.",
            price: "₦300,000 – ₦700,000",
            priceNote: "per seasonal campaign · limited slots per season",
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
        label: "PR",
        cards: [
          {
            name: "MoveeePR Africa — Starter",
            tag: "pr",
            tagLabel: "PR Subscription",
            description:
              "AI-powered PR subscription for emerging Nigerian individuals and small businesses. Recurring revenue anchor for The Moveee — Africa's first AI-focused PR offering.",
            price: "₦50,000 – ₦80,000",
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
            tag: "pr",
            tagLabel: "PR Subscription",
            description:
              "For established Nigerian businesses, brands, and public figures who need consistent media presence and strategic visibility across digital and traditional channels.",
            price: "₦100,000 – ₦150,000",
            priceNote: "per month · 3-month minimum",
            includes: [
              "2 press releases + 1 op-ed or thought leadership piece",
              "Media outreach to Nigerian publications",
              "Monthly strategy + reporting call",
              "Moveee editorial feature (quarterly)",
            ],
            featured: true,
            featuredBadge: "Recurring revenue",
          },
        ],
      },
      {
        label: "Events & Travel",
        cards: [
          {
            name: "Moveee Happenings Partner",
            tag: "events",
            tagLabel: "Events",
            description:
              "Official media partnership for owambes, cultural festivals, concerts, and art shows across Nigeria. First 3–5 events double as case studies.",
            price: "₦200,000 – ₦500,000",
            priceNote: "per event",
            includes: [
              "Event coverage & live social content",
              "Pre/post event editorial on Moveee Happenings",
              "Official Moveee media partner badge + logo placement",
            ],
          },
          {
            name: "Moveee Origins — Tour Partner",
            tag: "travel",
            tagLabel: "Travel",
            description:
              "Commission-based curated cultural and heritage tour packages. Zero inventory risk — partner with 2–3 Nigerian/Pan-African tour operators to start.",
            price: "10–15% commission",
            priceNote: "per booking + partner listing fee from ₦30,000/quarter",
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
    label: "Moveee UK",
    flag: "🇬🇧",
    intro:
      "Moveee UK is the diaspora edition for London, Birmingham, Manchester, and Bristol — serving Afro-Caribbean, Nigerian, and Ghanaian communities. Target clients include UK-based Black-owned brands, Afrobeats event promoters, and creatives priced out of mainstream London agencies.",
    sections: [
      {
        label: "Editorial",
        cards: [
          {
            name: "Cultural Spotlight Package",
            tag: "editorial",
            tagLabel: "Editorial",
            description:
              "Longform editorial feature + social amplification + GetMeLit UK newsletter. Low commitment for the buyer, quick to deliver — ideal cold pitch for UK Afrobeats labels, fashion brands, events promoters.",
            price: "£500 – £1,500",
            priceNote: "per package · custom for ongoing campaigns",
            includes: [
              "1 × longform editorial feature (800–1,200 words)",
              "3 social posts + Reel/TikTok option",
              "GetMeLit UK newsletter feature",
              "Archived on Moveee UK editorial hub",
            ],
            featured: true,
            featuredBadge: "Best for quick wins",
          },
        ],
      },
      {
        label: "Lifestyle & Commerce",
        cards: [
          {
            name: "Moveee Lifestyle UK — Shop the Diaspora",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Curated shop drops for UK-based Black-owned brands — fashion, beauty, natural hair, homeware, and food. "Discover culture, buy culture" positioning connects culturally fluent buyers with makers.",
            price: "£150 – £600",
            priceNote: "flat brand placement, or 5–15% affiliate commission per sale",
            includes: [
              "Curated shop collection listing on Moveee Lifestyle UK",
              "Editorial product write-up (brand + product story)",
              "GetMeLit UK newsletter + social promotion",
              "Eligible for seasonal campaign drops",
            ],
          },
          {
            name: "Lifestyle UK — Seasonal Shop Drop",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Full editorial commerce campaign timed to UK cultural moments — Black History Month (October), Carnival season, Christmas gifting. Priority placement across Moveee UK editorial + shop + newsletter.",
            price: "£400 – £900",
            priceNote: "per seasonal campaign · limited brand slots",
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
        label: "PR",
        cards: [
          {
            name: "MoveeePR UK",
            tag: "pr",
            tagLabel: "PR Subscription",
            description:
              "Affordable AI-powered PR for UK-based African and Caribbean creatives and entrepreneurs. London agency retainers start at £1,500–£3,000/month — MoveeePR UK is the culturally fluent alternative.",
            price: "£299 – £499",
            priceNote: "per month · rolling subscription",
            includes: [
              "2 press releases per month (AI-assisted + edited)",
              "UK media outreach (Black press + mainstream)",
              "Monthly strategy call + monthly report",
              "1 × Moveee UK editorial mention per quarter",
            ],
            featured: true,
            featuredBadge: "Strongest UK differentiator",
          },
        ],
      },
      {
        label: "Events & Travel",
        cards: [
          {
            name: "Moveee Happenings UK Partner",
            tag: "events",
            tagLabel: "Events",
            description:
              "Official media partner for Afrobeats nights, art shows, Caribbean food festivals, and diaspora film screenings in London, Birmingham, and Manchester.",
            price: "£300 – £800",
            priceNote: "per event",
            includes: [
              "Official Moveee UK media partner badge",
              "Live social coverage + event content creation",
              "Post-event editorial on Moveee Happenings UK",
            ],
          },
          {
            name: "Origins UK — Heritage Tours",
            tag: "travel",
            tagLabel: "Travel",
            description:
              "Roots tourism for UK diaspora Nigerians, Ghanaians, and Jamaicans — homecoming trips, owambes, cultural festivals. Commission model with zero inventory risk.",
            price: "10–15% commission",
            priceNote: "per booking · partner listing from £75/quarter",
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
    label: "Moveee US",
    flag: "🇺🇸",
    intro:
      "Moveee US is the diaspora edition for NYC, Houston, Atlanta, DC, and LA — serving African Americans + Nigerian, Ghanaian, Ethiopian, and Caribbean diaspora audiences. Target clients include US-based African founders, Black-owned DTC brands, Afrobeats-adjacent music labels, and event promoters.",
    sections: [
      {
        label: "Editorial",
        cards: [
          {
            name: "Brand Culture Partnership",
            tag: "editorial",
            tagLabel: "Editorial",
            description:
              "Sponsored editorial + newsletter placement for US brands targeting African and Caribbean diaspora audiences. Premium alternative to The Root or Essence for diaspora-specific reach.",
            price: "$500 – $2,000",
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
        label: "Lifestyle & Commerce",
        cards: [
          {
            name: "Moveee Lifestyle US — Shop the Culture",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Curated "Shop the Culture" collections featuring US Black-owned brands — DTC fashion, natural hair and beauty, food, and homeware. Culturally curated retail discovery for diaspora consumers.",
            price: "$300 – $800",
            priceNote: "flat brand placement, or 5–15% affiliate commission per sale",
            includes: [
              "Curated shop collection feature on Moveee Lifestyle US",
              "Editorial product write-up (brand story + product)",
              "GetMeLit US newsletter + social promotion",
              "Eligible for seasonal campaign drops",
            ],
          },
          {
            name: "Lifestyle US — Seasonal Shop Drop",
            tag: "lifestyle",
            tagLabel: "Lifestyle",
            description:
              "Full editorial commerce campaign around US cultural moments — Black History Month (Feb), Juneteenth, Holiday gifting. Connects Black-owned brands with the diaspora consumer base precisely when they're spending.",
            price: "$600 – $1,200",
            priceNote: "per seasonal campaign · limited brand slots",
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
        label: "Consulting & PR",
        cards: [
          {
            name: "Diaspora Brand Launchpad",
            tag: "consulting",
            tagLabel: "Consulting",
            description:
              "Full-service package for African founders entering the US market — market positioning + PR + editorial brand storytelling. One-off, high-margin, and easy to scale through referrals.",
            price: "$1,500 – $3,000",
            priceNote: "one-off project fee",
            includes: [
              "US market positioning strategy session",
              "Brand narrative for US diaspora audience",
              "1 × Moveee US editorial feature",
              "PR media outreach bundle (5–10 publications)",
            ],
            featured: true,
            featuredBadge: "Highest margin",
          },
        ],
      },
      {
        label: "Events & Travel",
        cards: [
          {
            name: "Moveee Happenings US Partner",
            tag: "events",
            tagLabel: "Events",
            description:
              "Official media partner for Nigerian community events, owambes, Afrobeats concerts, and cultural galas across NYC, Atlanta, Houston, DC, and LA.",
            price: "$500 – $1,500",
            priceNote: "per event",
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
