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
    tagline: "Unlock the power of amplified impact and reach thousands of people with a boosted feature.",
    intro: [
      "At The Moveee, we're passionate about spotlighting game-changers in culture across industries. That's why we're always dedicated to providing Free Press/Feature to credible individuals and organisations driving meaningful change.",
      "Our flagship add-on is designed to supercharge your personal or corporate brand awareness through the unstoppable force of social media. With Moveee Amplify, you'll reach a wider audience, build your reputation, and make a lasting impact.",
      "Don't miss out on this opportunity to elevate your brand and make your voice heard. Partner with The Moveee to unlock your full potential and shine in the spotlight.",
    ],
    packages: [
      {
        name: "Priority",
        billingNote: "Monthly Recurring Option Also Available",
        price: "50k",
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
        price: "120k",
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
        price: "200k",
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
        price: "500k",
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
        answer: "Moveee Amplify is the media amplification and visibility arm of Moveee Media. It is dedicated to boosting the reach, relevance, and resonance of stories published on Moveee by ensuring they get the attention they deserve across targeted platforms, communities, and audiences.",
      },
      {
        question: "What exactly does Moveee Amplify do?",
        answer: "Moveee Amplify distributes your feature across social media, newsletters, and partner channels — driving real impressions from real audiences. Depending on your plan, this includes audience targeting, influencer broadcasting, and newspaper syndication.",
      },
      {
        question: "How much does it cost to use Moveee Amplify?",
        answer: "Plans start at ₦50,000 for the Priority tier and go up to ₦500,000 for the fully Invested package. Monthly recurring options are available at all tiers.",
      },
      {
        question: "What kind of results can I expect?",
        answer: "Results vary by package — from 30,000 to 400,000 extra people reached. All plans include a Full Reach Analytics Report so you can measure the impact.",
      },
      {
        question: "How is Moveee Amplify different from traditional PR?",
        answer: "Traditional PR focuses on pitching journalists and hoping for coverage. Moveee Amplify is guaranteed distribution — your story is already on The Moveee and we amplify it to defined, targeted audiences.",
      },
      {
        question: "How do I sign up for Moveee Amplify?",
        answer: "Get in touch via the button above and our team will walk you through the right plan for your goals.",
      },
      {
        question: "Can I use Moveee Amplify if I am not yet featured on Moveee?",
        answer: "Moveee Amplify is designed as an add-on to a feature or article published on The Moveee. Contact us if you'd like to discuss a combined feature + amplification package.",
      },
      {
        question: "Do I pay less if I subscribe for the monthly package?",
        answer: "The monthly recurring option provides consistent amplification over time. Contact us for monthly pricing details tailored to your plan.",
      },
    ],
    ctaEmail: "hello@themoveee.com",
  },
  {
    slug: "presskit",
    name: "Moveee PressKit",
    eyebrow: "PR & Press Coverage",
    headline: "Get Featured in Top Newspapers and Magazines",
    tagline: "Take your story to the masses with The Moveee's sure PR. PressKit ensures you get the coverage you deserve.",
    intro: [
      "PressKit showcases your story, product, or service to media outlets. It increases your chances of getting featured in prominent publications across Nigeria and the UK.",
    ],
    packages: [
      {
        name: "In Nigeria Media",
        billingNote: "Monthly Recurring Option Also Available",
        price: "80k",
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
        price: "120",
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
        price: "₦250k",
        description: "Include contact details, images, logo, and artwork in your story, or make it an extensive interview.",
      },
      {
        icon: "📅",
        price: "+₦100k",
        description: "Backdate your story to a former date earlier than the period you are originally getting it published.",
      },
      {
        icon: "✍️",
        price: "+₦30k",
        description: "Write a unique story for each platform so you don't repeat stories and can cover multiple perspectives.",
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
      "The Moveee is a digital culture magazine curating bold, authentic voices across Africa and the diaspora. With MoveeeePro, we spotlight your book through reviews, interviews, and press features — giving it the visibility and credibility it deserves.",
    ],
    packages: [
      {
        name: "Starter",
        billingNote: "Expires in 3 Months",
        price: "50k",
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
        price: "120k",
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
        price: "200k",
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
        price: "450k",
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
        price: "₦75k",
        description: "Video Interview (Virtual)",
      },
      {
        icon: "📱",
        price: "₦50k",
        description: "Instagram Live Q&A",
      },
      {
        icon: "🎬",
        price: "₦150k",
        description: "Basic Book Trailer",
      },
    ],
    ctaEmail: "hello@themoveee.com",
  },
];

export function getService(slug: string): Service | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
