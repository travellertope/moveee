export type Feature = { label: string; included: boolean | string };

export type Package = {
  name: string;
  badge?: string;
  highlight?: boolean;
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

export type Benefit = {
  title: string;
  body: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type Service = {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  tagline: string;
  intro: string[];
  benefits?: Benefit[];
  packages: Package[];
  addOns?: AddOn[];
  faqs?: FAQ[];
  ctaEmail: string;
};

export const SERVICES: Service[] = [
  {
    slug: "amplify",
    name: "Moveee Amplify",
    eyebrow: "Media Amplification",
    headline: "Take Your Brand to the Next Level with Moveee Amplify",
    tagline: "Unlock the power of amplified impact and reach hundreds of thousands of people with a boosted feature.",
    intro: [
      "At The Moveee, we believe every great story deserves to be heard — not just published and forgotten. That's why we built Moveee Amplify: a dedicated media amplification engine that puts your feature in front of the exact audience it was made for.",
      "Most press features disappear within 48 hours of going live. The algorithm moves on. The moment passes. Moveee Amplify changes that. Once your story is live on The Moveee, we deploy a targeted, multi-channel distribution strategy that extends its life and dramatically expands its reach — from social media amplification and audience retargeting to influencer broadcasting and national newspaper syndication.",
      "We've helped artists, founders, cultural organisations, and public figures turn a single editorial feature into a months-long visibility campaign. The result isn't just more views — it's the right people discovering you: bookers, collaborators, investors, communities, and fans who actually care about what you do.",
      "Whether you're launching a new project, building a public profile, or trying to cement your brand as a credible force in your industry, Moveee Amplify gives you the infrastructure to be seen, remembered, and sought after.",
    ],
    benefits: [
      {
        title: "Guaranteed Reach",
        body: "Unlike traditional PR pitches that might get ignored, Amplify is a confirmed distribution — your story goes out, every time, to real audiences.",
      },
      {
        title: "Credibility By Association",
        body: "The Moveee As-Seen-In logo on your feature signals editorial credibility. Use it across your own platforms, pitch decks, and bio.",
      },
      {
        title: "Precision Targeting",
        body: "We don't blast your story to everyone. Higher-tier plans include audience location targeting so your reach lands where it matters most.",
      },
      {
        title: "Lasting Impact",
        body: "From Instagram pins to influencer broadcasts and newspaper features, your story lives in multiple channels long after the publish date.",
      },
      {
        title: "Full Transparency",
        body: "Every plan includes a Full Reach Analytics Report so you can see exactly how many people were reached, on which platforms, and how they engaged.",
      },
      {
        title: "Scalable Plans",
        body: "Start with Priority for 65k reach, or go all-in with Invested for 400k+. Monthly recurring options let you maintain consistent visibility year-round.",
      },
    ],
    packages: [
      {
        name: "Priority",
        billingNote: "Monthly Recurring Option Also Available",
        price: "65k",
        currency: "₦",
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
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
      {
        name: "Sponsored",
        billingNote: "Monthly Recurring Option Also Available",
        price: "150k",
        currency: "₦",
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
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
      {
        name: "Sponsored+",
        highlight: true,
        billingNote: "Monthly Recurring Option Also Available",
        price: "260k",
        currency: "₦",
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
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
      {
        name: "Invested",
        billingNote: "Monthly Recurring Option Also Available",
        price: "650k",
        currency: "₦",
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
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
    ],
    faqs: [
      {
        question: "What is Moveee Amplify?",
        answer: "Moveee Amplify is the media amplification and visibility arm of The Moveee. It is dedicated to boosting the reach, relevance, and resonance of stories published on The Moveee by ensuring they get the attention they deserve across targeted platforms, communities, and audiences.",
      },
      {
        question: "What exactly does Moveee Amplify do?",
        answer: "Moveee Amplify distributes your feature across social media, newsletters, and partner channels — driving real impressions from real audiences. Depending on your plan, this includes audience location targeting, influencer broadcasting, Instagram pinning, and newspaper syndication.",
      },
      {
        question: "How much does it cost to use Moveee Amplify?",
        answer: "Plans start at ₦65,000 for the Priority tier and go up to ₦650,000 for the fully Invested package. Monthly recurring options are available at all tiers for sustained visibility.",
      },
      {
        question: "What kind of results can I expect?",
        answer: "Results vary by package — from 30,000 to 400,000+ extra people reached. All plans include a Full Reach Analytics Report so you can measure the exact impact of your amplification.",
      },
      {
        question: "How is Moveee Amplify different from traditional PR?",
        answer: "Traditional PR means pitching journalists and hoping for coverage. Moveee Amplify is guaranteed distribution — your story is already live on The Moveee, and we amplify it to defined, targeted audiences. No uncertainty, no waiting rooms.",
      },
      {
        question: "How do I sign up for Moveee Amplify?",
        answer: "Get in touch via the button above and our team will walk you through the right plan for your goals, budget, and timeline.",
      },
      {
        question: "Can I use Moveee Amplify if I am not yet featured on Moveee?",
        answer: "Moveee Amplify is designed as an add-on to an existing feature or article on The Moveee. Contact us if you'd like to discuss a combined feature + amplification package — we offer bundled pricing.",
      },
      {
        question: "Do I pay less if I subscribe for the monthly package?",
        answer: "The monthly recurring option provides consistent amplification over time and is ideal for brands that want to maintain a steady public presence. Contact us for monthly pricing details tailored to your chosen plan.",
      },
    ],
    ctaEmail: "hello@themoveee.com",
  },

  {
    slug: "presskit",
    name: "Moveee PressKit",
    eyebrow: "PR & Press Coverage",
    headline: "Get Featured in Top Newspapers and Magazines",
    tagline: "Take your story to the masses with The Moveee's proven PR network. PressKit places you in the publications your audience already trusts.",
    intro: [
      "Being featured in a newspaper or magazine is one of the most credible things you can do for your personal brand or business. It builds trust instantly. It opens doors. It tells the world — and every future collaborator, investor, or customer who Googles you — that your story was worth publishing.",
      "Moveee PressKit is our end-to-end press placement service, built on years of media relationships across Nigeria and the UK. We don't pitch and pray. We work directly with our network of publications to ensure your story gets placed — in the outlets that matter to your audience, in a format that represents you well.",
      "Whether you're a founder launching a product, a creative building a public profile, an organisation driving community impact, or a professional cementing their industry standing, a press placement can change the trajectory of how the world perceives you. One article in Punch, Vanguard, or the London Journal can shift conversations, unlock partnerships, and establish credibility that no amount of social media posting can replicate.",
      "With PressKit, you choose the platforms. We handle everything else — from story development and editorial formatting to submission, follow-up, and confirmation. You get a clip you can use forever.",
    ],
    benefits: [
      {
        title: "Guaranteed Placement",
        body: "We don't pitch speculatively. PressKit is built on confirmed editorial relationships with named publications across Nigeria and the UK.",
      },
      {
        title: "Evergreen Credibility",
        body: "A newspaper feature lives online indefinitely. It shows up in Google searches, backs up bio claims, and outlasts any social campaign.",
      },
      {
        title: "Choose Your Platforms",
        body: "Pick the exact outlets that fit your audience — from Punch and Vanguard in Nigeria to the Manchester Times and UK Herald in Britain.",
      },
      {
        title: "Bulk Savings",
        body: "Reaching 5 or more platforms? Get 10% off across your entire order. The more outlets you cover, the more value you unlock.",
      },
      {
        title: "Cross-Market Reach",
        body: "With Nigeria and UK coverage under one service, diaspora brands and internationally-minded organisations can tell their story on both sides of the Atlantic.",
      },
      {
        title: "Story Customisation",
        body: "Add-ons let you include media assets, backdate publications, or commission unique stories per platform — giving each outlet an exclusive angle.",
      },
    ],
    packages: [
      {
        name: "In Nigeria Media",
        billingNote: "Monthly Recurring Option Also Available",
        price: "100k",
        currency: "₦",
        unit: "Per Platform",
        features: [
          { label: "10% Discount On Bulk Buy (5+ Platforms)", included: true },
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
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
      {
        name: "In UK Media",
        highlight: true,
        billingNote: "Monthly Recurring Option Also Available",
        price: "150",
        currency: "$",
        unit: "Per Platform",
        features: [
          { label: "10% Discount On Bulk Buy (5+ Platforms)", included: true },
          { label: "London Journal", included: true },
          { label: "Glasgow Report", included: true },
          { label: "Manchester Times", included: true },
          { label: "UK Herald", included: true },
          { label: "Birmingham Times", included: true },
          { label: "UK Reporter", included: true },
          { label: "UK Wire", included: true },
        ],
        cta: "Buy Once",
        ctaSecondary: "Subscribe to Monthly Plan",
      },
    ],
    addOns: [
      {
        icon: "📎",
        price: "₦320k",
        description: "Include contact details, images, logo, and artwork in your story, or commission an extensive interview format with richer editorial depth.",
      },
      {
        icon: "📅",
        price: "+₦130k",
        description: "Backdate your story to an earlier date than the period you're originally being published — ideal for quarterly retrospectives or launch anniversaries.",
      },
      {
        icon: "✍️",
        price: "+₦40k",
        description: "Commission a unique story angle for each platform so you don't repeat content — allowing you to cover multiple perspectives across outlets.",
      },
    ],
    ctaEmail: "hello@themoveee.com",
  },

  {
    slug: "book-publishers",
    name: "MoveeeePro",
    eyebrow: "For Book Publishers & Authors",
    headline: "Premium Coverage for Book Publishers",
    tagline: "The premium feature package for publishers and authors who want their books not just read — but seen, discussed, and remembered.",
    intro: [
      "Publishing a book is an act of courage. Getting it the attention it deserves is a strategy. In a world where thousands of titles launch every week, visibility is no longer optional — it's the difference between a book that quietly disappears and one that builds a readership, sparks conversations, and earns a lasting place in the culture.",
      "The Moveee is a digital culture magazine curating bold, authentic voices across Africa and the diaspora. Our readers are curious, culturally engaged, and actively looking for their next great read. When we spotlight a book — through a review, an author interview, a news release, or a social media push — that book enters a conversation with the exact audience most likely to buy it, recommend it, and remember it.",
      "MoveeeePro is our dedicated package for publishers and authors who want more than a one-line mention. We treat your book as the cultural object it is: worthy of in-depth engagement, multiple touchpoints, and sustained coverage across editorial and social channels.",
      "From a single author interview for debut writers to ten news releases and five full reviews for established publishers managing major releases — MoveeeePro scales to the ambition of your launch.",
    ],
    benefits: [
      {
        title: "Editorial Credibility",
        body: "A genuine book review from The Moveee carries weight. Our readers trust our editorial voice, which means they trust the books we spotlight.",
      },
      {
        title: "Author Spotlight",
        body: "Author interviews go beyond the book — they introduce the person behind the pages and build the kind of parasocial connection that turns browsers into loyal readers.",
      },
      {
        title: "Multi-Format Coverage",
        body: "From written reviews and news releases to multimedia social posts, MoveeeePro gives your title exposure across every content format our audience consumes.",
      },
      {
        title: "African & Diaspora Audience",
        body: "If your book speaks to Black stories, African experiences, or diaspora life, there is no better-matched platform. Our audience is primed to receive it.",
      },
      {
        title: "Package Flexibility",
        body: "Whether you're a first-time author or a major publishing house managing a slate of releases, there's a MoveeeePro tier designed for your scale.",
      },
      {
        title: "Social Amplification",
        body: "Higher-tier plans include multimedia social posts — not just links, but crafted content designed to drive engagement and shares across our social channels.",
      },
    ],
    packages: [
      {
        name: "Starter",
        billingNote: "Expires in 3 Months",
        price: "65k",
        currency: "₦",
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
        price: "150k",
        currency: "₦",
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
        price: "250k",
        currency: "₦",
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
        price: "580k",
        currency: "₦",
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
      {
        icon: "🎥",
        price: "₦100k",
        description: "Video Interview (Virtual) — a recorded long-form conversation with the author, published on The Moveee's video channels.",
      },
      {
        icon: "📱",
        price: "₦65k",
        description: "Instagram Live Q&A — a live session with the author hosted on The Moveee's Instagram, open to our full follower base.",
      },
      {
        icon: "🎬",
        price: "₦200k",
        description: "Basic Book Trailer — a professionally produced short-form video asset you can use across all your own channels to drive pre-orders and awareness.",
      },
    ],
    ctaEmail: "hello@themoveee.com",
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
