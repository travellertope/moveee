import type { TierService } from "./market-data";
import type { ServicePageContent } from "./service-pages";

export type PartnershipCategory = {
  id: "publishers" | "galleries" | "filmmakers";
  label: string;
  icon: string;
  tagline: string;
  description: string;
  service: TierService;
  page: ServicePageContent;
};

const BILLING = "Expires in 3 Months";
const CTA = "Start Partnership";

// ── Publishers & Authors ──────────────────────────────────────────────────────
// Tiers: Debut → Season → Catalogue → Imprint
// Pricing reflects title volume and author campaign depth.

const publishersService: TierService = {
  slug: "publishers",
  name: "Media Partnership — Publishers",
  eyebrow: "Publishers & Authors",
  description:
    "A sustained editorial partnership for Nigerian and African book publishers, independent authors, and literary organisations. We review titles, interview authors, publish news releases, and keep your work in conversation with the audience most likely to read and recommend it.",
  packages: [
    {
      name: "Debut",
      billingNote: BILLING,
      price: "80k", currency: "₦",
      features: [
        { label: "Book Review", included: "0×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
    {
      name: "Season",
      billingNote: BILLING,
      price: "190k", currency: "₦",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "2×" },
        { label: "News Release", included: "3×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
    {
      name: "Catalogue",
      highlight: true,
      billingNote: BILLING,
      price: "360k", currency: "₦",
      features: [
        { label: "Book Review", included: "3×" },
        { label: "Author Interview", included: "3×" },
        { label: "News Release", included: "5×" },
        { label: "GetMeLit Newsletter Feature", included: "1×" },
        { label: "Social Media Posts", included: "Multimedia" },
      ],
      cta: CTA,
    },
    {
      name: "Imprint",
      billingNote: BILLING,
      price: "680k", currency: "₦",
      features: [
        { label: "Book Review", included: "6×" },
        { label: "Author Interview", included: "5×" },
        { label: "News Release", included: "8×" },
        { label: "GetMeLit Newsletter Feature", included: "Quarterly" },
        { label: "Social Media Posts", included: "Multimedia" },
        { label: "Live Q&A / Event Coverage", included: "1×" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "₦100k", description: "Video Interview (Virtual) — recorded long-form conversation with the author, published on The Moveee's video channels." },
    { icon: "📱", price: "₦65k", description: "Instagram Live Q&A — live session hosted on The Moveee's Instagram, open to our full follower base." },
    { icon: "🎬", price: "₦200k", description: "Book Trailer — short-form video asset for your own channels to drive pre-orders and awareness." },
  ],
};

const publishersPage: ServicePageContent = {
  headline: "Books Launch. Careers Are Built. Stories Deserve Readers.",
  tagline: "A sustained editorial partnership for Nigerian and African publishers, authors, and literary organisations.",
  intro: [
    "A book launch without media infrastructure is a tree falling in an empty forest. The Media Partnership for Publishers gives you the editorial scaffolding that turns a publication date into a media moment: reviews written by readers who care about African literature, author interviews given proper length and context, news releases for launch events, and social content that keeps the title in conversation beyond its first week.",
    "We serve independent Nigerian authors, Lagos and Accra-based publishers, Pan-African imprints, and literary festival organisers. Tiers run across three months — enough time to cover a launch properly, sustain a backlist title, or build an author's presence around a touring season.",
    "This isn't a logo placement deal. It's an editorial relationship: we read your books, we form opinions, and we cover your work the way it deserves to be covered.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Onboarding & Content Calendar",
      body: "We schedule a call to understand your titles, your authors, your publishing calendar, and what success looks like. From that, we build a content schedule for the three-month window — which reviews publish when, which interviews are prioritised, which events get news releases.",
    },
    {
      step: "02",
      title: "Send Review Copies",
      body: "For titles being reviewed, physical or digital review copies are sent to our editorial team. We confirm receipt and give a read window of three to four weeks before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "Reviews are written as reviews — with opinions, with context, with reference to the wider literary landscape. Author interviews are conducted and edited for publication. News releases are written and distributed for events and launches.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes through GetMeLit to our newsletter audience across Nigeria and the diaspora. Social posts go out across our channels. You receive live links as each piece goes up.",
    },
  ],
  benefits: [
    {
      title: "Reviews Written as Reviews",
      body: "Our literary coverage has opinions. We don't write promotional summaries dressed up as criticism. That's what makes a Moveee review credible — and worth having attached to a title.",
    },
    {
      title: "Reach Beyond Lagos Book Club Circles",
      body: "GetMeLit reaches Nigerian and diaspora readers across Lagos, Abuja, Accra, London, and New York. These are readers who buy books, attend events, and recommend titles — not just social media engagement.",
    },
    {
      title: "Sustained Coverage, Not a Single Spike",
      body: "A three-month partnership means multiple editorial touchpoints. A review, an interview, a news release, social content. The title stays in conversation long after publication week.",
    },
    {
      title: "Video and Live Add-Ons Available",
      body: "Virtual video interviews, Instagram Live Q&As, and book trailers are bookable as add-ons for specific launch moments or touring events.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all genres?",
      answer: "We cover fiction, non-fiction, poetry, and creative non-fiction by African and diaspora authors. Literary fiction, Afrofuturism, memoir, cultural criticism, and business titles with cultural relevance are particularly strong fits for our audience.",
    },
    {
      question: "What if a review is negative?",
      answer: "Our reviews are editorial — they have genuine assessments. We won't publish a purely negative takedown, but we won't inflate praise either. If a title genuinely isn't landing with our reviewer, we'll discuss with you before publishing.",
    },
    {
      question: "Can I use the published reviews in my own marketing?",
      answer: "Yes. You can quote excerpts, share links, and use the published URL in press materials and marketing. Full text republication requires written permission.",
    },
    {
      question: "What's the turnaround from receiving a review copy to publication?",
      answer: "Three to four weeks from receipt of the review copy. Expedited review timelines can be discussed at onboarding for launch-critical windows.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals are available, and many publishers use consecutive terms to cover multiple titles or sustained author campaigns. Renewal is confirmed before the end of the current term.",
    },
    {
      question: "Can I book add-ons like the Instagram Live outside of a partnership?",
      answer: "Some add-ons are available to existing subscribers only. Contact us to discuss standalone options for significant one-off moments.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "Debut from ₦80,000. Three-month visibility package.",
};

// ── Art Galleries ─────────────────────────────────────────────────────────────
// Tiers: Preview → Exhibition → Programme → Institution
// Higher price band reflecting gallery budgets and the prestige value of critical art coverage.

const galleriesService: TierService = {
  slug: "galleries",
  name: "Media Partnership — Galleries",
  eyebrow: "Art Galleries",
  description:
    "A sustained editorial partnership for Nigerian and African art galleries, independent exhibition spaces, and art fair organisers. We review exhibitions, profile artists, cover openings, and publish news releases that keep your programme in front of the collectors, critics, and culture lovers who matter.",
  packages: [
    {
      name: "Preview",
      billingNote: BILLING,
      price: "130k", currency: "₦",
      features: [
        { label: "Exhibition Review", included: "0×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
        { label: "Opening Night Coverage", included: "0×" },
      ],
      cta: CTA,
    },
    {
      name: "Exhibition",
      billingNote: BILLING,
      price: "280k", currency: "₦",
      features: [
        { label: "Exhibition Review", included: "1×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "3×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
        { label: "Opening Night Coverage", included: "0×" },
      ],
      cta: CTA,
    },
    {
      name: "Programme",
      highlight: true,
      billingNote: BILLING,
      price: "500k", currency: "₦",
      features: [
        { label: "Exhibition Review", included: "2×" },
        { label: "Artist Spotlight", included: "3×" },
        { label: "News Release", included: "4×" },
        { label: "GetMeLit Newsletter Feature", included: "1×" },
        { label: "Social Media Posts", included: "Multimedia" },
        { label: "Opening Night Coverage", included: "1×" },
      ],
      cta: CTA,
    },
    {
      name: "Institution",
      billingNote: BILLING,
      price: "900k", currency: "₦",
      features: [
        { label: "Exhibition Review", included: "4×" },
        { label: "Artist Spotlight", included: "5×" },
        { label: "News Release", included: "6×" },
        { label: "GetMeLit Newsletter Feature", included: "Quarterly" },
        { label: "Social Media Posts", included: "Multimedia" },
        { label: "Opening Night Coverage", included: "2×" },
        { label: "Editorial Photo Essay", included: "1×" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "₦120k", description: "Video Gallery Walkthrough — filmed tour of an active exhibition, published on The Moveee's video channels." },
    { icon: "📱", price: "₦80k", description: "Instagram Live Opening Night — live coverage of a vernissage or special event hosted on The Moveee's Instagram." },
    { icon: "📷", price: "₦180k", description: "Editorial Photo Essay — professional photography + editorial write-up for a flagship exhibition or artist retrospective." },
  ],
};

const galleriesPage: ServicePageContent = {
  headline: "Nigerian Art Belongs in the Cultural Conversation. We Put It There.",
  tagline: "A sustained editorial partnership for galleries, exhibition spaces, and art fair organisers who take Nigerian and African art seriously.",
  intro: [
    "The Nigerian and Pan-African art scene is producing some of the most significant work on the continent — and most of it goes undercovered. The Media Partnership for Galleries gives exhibition spaces the editorial infrastructure they need: exhibition reviews written with critical seriousness, artist spotlights that go beyond the bio, opening night coverage, and news releases for new shows and acquisitions.",
    "We serve Lagos galleries, Abuja exhibition spaces, art fairs, and independent curators running programmes worth covering. Tiers run across three months and can be renewed around exhibition calendars.",
    "The goal isn't to generate promotional content. It's to build a media record for your programme and your artists — the kind of coverage that ends up in press kits, grant applications, and collector due diligence.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Programme Briefing",
      body: "We start with a call to understand your exhibition calendar, your represented artists, and the editorial moments you most want covered over the three months. We build a content plan from there.",
    },
    {
      step: "02",
      title: "Access & Invitations",
      body: "For exhibitions being reviewed, we attend opening nights or arrange access during the show's run. For artist spotlights, we interview the artist directly — in person where possible, by call or written exchange where not.",
    },
    {
      step: "03",
      title: "Critical Editorial Production",
      body: "Reviews are written as criticism — contextualised within the wider Nigerian and African art landscape, not as promotional copy. Artist spotlights go beyond the bio to the work, the process, and the thinking behind it.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes via GetMeLit to our newsletter audience. Social posts go across our channels. Live links sent as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Critical Coverage, Not Press Releases Dressed as Reviews",
      body: "Our exhibition reviews are written with editorial independence. They situate work in context, make assessments, and treat your programme as serious art — which is precisely what makes the coverage worth having.",
    },
    {
      title: "Reach Collectors, Curators, and the Cultural Class",
      body: "GetMeLit reaches Nigerian and diaspora professionals who engage with culture intentionally. Collectors, architects, creative directors, and the professionally curious — the people who attend and acquire.",
    },
    {
      title: "A Permanent Editorial Record",
      body: "Coverage on The Moveee becomes part of the searchable archive. When journalists, collectors, or curators research an artist or gallery, this is what they find. That has long-term value beyond the publication date.",
    },
    {
      title: "Photography and Video Add-Ons",
      body: "For flagship exhibitions, opening night live coverage and editorial photo essays are available as add-ons — the kind of visual documentation that travels across press kits and grant applications.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all types of visual art?",
      answer: "Painting, sculpture, photography, installation, textile art, digital and new media art, ceramics — we cover the range. The requirement is that the work is by Nigerian or African artists, or is being shown in a Nigerian or African context.",
    },
    {
      question: "Will exhibition reviews always be positive?",
      answer: "Our reviews are editorial. They won't be dismissive or hostile, but they're not promotional copy either. If our critic has genuine reservations, the review will reflect that. We believe serious coverage — even with caveats — does more for a gallery's reputation than uncritical praise.",
    },
    {
      question: "Can you cover gallery openings outside Lagos?",
      answer: "Yes. We cover Abuja and other Nigerian cities where editorial resource allows. International coverage for Nigerian galleries showing abroad is also possible — contact us to discuss.",
    },
    {
      question: "Can I use The Moveee coverage in my gallery's press materials?",
      answer: "Yes. Quoting reviews, sharing links, and referencing coverage in press kits and grant applications is actively encouraged. Full text republication requires written permission.",
    },
    {
      question: "Is the partnership renewable around our exhibition calendar?",
      answer: "Yes, and we encourage planning renewals in advance around your programme's peak moments — an anniversary show, a major new artist, an art fair participation.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "Preview from ₦130,000. Three-month exhibition coverage partnership.",
};

// ── Filmmakers & Producers ────────────────────────────────────────────────────
// Tiers: Development → Release → Festival → Distribution
// Named after production phases so filmmakers can self-select based on where they are.

const filmmakersService: TierService = {
  slug: "filmmakers",
  name: "Media Partnership — Film",
  eyebrow: "Filmmakers & Producers",
  description:
    "A sustained editorial partnership for Nigerian and African filmmakers, independent production companies, and film festival organisers. We review films and series, profile filmmakers, cover festival moments, and publish news releases — building the press record your work deserves.",
  packages: [
    {
      name: "Development",
      billingNote: BILLING,
      price: "100k", currency: "₦",
      features: [
        { label: "Film / Series Review", included: "0×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
        { label: "Trailer Editorial Feature", included: "0×" },
      ],
      cta: CTA,
    },
    {
      name: "Release",
      billingNote: BILLING,
      price: "230k", currency: "₦",
      features: [
        { label: "Film / Series Review", included: "1×" },
        { label: "Filmmaker Profile", included: "2×" },
        { label: "News Release", included: "3×" },
        { label: "GetMeLit Newsletter Mention", included: "1×" },
        { label: "Social Media Sync", included: "Basic" },
        { label: "Trailer Editorial Feature", included: "0×" },
      ],
      cta: CTA,
    },
    {
      name: "Festival",
      highlight: true,
      billingNote: BILLING,
      price: "420k", currency: "₦",
      features: [
        { label: "Film / Series Review", included: "2×" },
        { label: "Filmmaker Profile", included: "3×" },
        { label: "News Release", included: "4×" },
        { label: "GetMeLit Newsletter Feature", included: "1×" },
        { label: "Social Media Posts", included: "Multimedia" },
        { label: "Trailer Editorial Feature", included: "1×" },
      ],
      cta: CTA,
    },
    {
      name: "Distribution",
      billingNote: BILLING,
      price: "750k", currency: "₦",
      features: [
        { label: "Film / Series Review", included: "4×" },
        { label: "Filmmaker Profile", included: "4×" },
        { label: "News Release", included: "8×" },
        { label: "GetMeLit Newsletter Feature", included: "Quarterly" },
        { label: "Social Media Posts", included: "Multimedia" },
        { label: "Trailer Editorial Feature", included: "1×" },
        { label: "Festival / Premiere Coverage", included: "1×" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "₦120k", description: "Video Filmmaker Interview — long-form on-camera conversation published on The Moveee's video channels." },
    { icon: "📱", price: "₦80k", description: "Instagram Live Premiere Coverage — live hosting of a premiere night or screening event on The Moveee's Instagram." },
    { icon: "🎬", price: "₦150k", description: "Trailer Editorial Feature — editorial piece built around your official trailer release, timed to premiere or festival entry." },
  ],
};

const filmmakersPage: ServicePageContent = {
  headline: "Nollywood Is Not a Monolith. Neither Is Our Coverage.",
  tagline: "A sustained editorial partnership for Nigerian and African filmmakers, producers, and film festival organisers who want critical coverage that travels.",
  intro: [
    "Nollywood is the third-largest film industry in the world and still largely self-covered. Critical coverage of independent Nigerian and African cinema — the kind that ends up in international press packets, streaming negotiations, and festival submissions — is scarce. The Media Partnership for Filmmakers closes that gap: film and series reviews, filmmaker profiles, festival coverage, and news releases that build a press record your distribution team can actually use.",
    "We serve independent Nigerian filmmakers, Lagos and Abuja production companies, diaspora filmmakers with Nigerian projects, and film festival organisers. Tiers are named after production phases — Development, Release, Festival, Distribution — so you can enter at the moment that makes sense for your project.",
    "This is not promotional recap coverage. We write film criticism, director profiles with depth, and news releases for productions worth announcing.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Project Briefing & Content Plan",
      body: "We start with a call to understand your project, your release timeline, and the editorial moments you need covered. A three-month content plan is built from that conversation — reviews timed to release, interviews to key announcements, news releases to festival entries.",
    },
    {
      step: "02",
      title: "Screening Access",
      body: "For titles being reviewed, a screener or private link is provided to our critic. We confirm receipt and give a two-week watch window before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "Reviews are written as film criticism — situating the work within Nigerian and African cinema, assessing craft, performance, and cultural significance. Filmmaker profiles go beyond the making-of to the ideas behind the work.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Reviews and profiles publish on The Moveee and distribute via GetMeLit to our newsletter audience. Social posts go across our channels. Live links delivered as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Press Coverage That Works for Submissions and Pitches",
      body: "A Moveee review creates a citable, linkable press record. For festival submissions, streaming negotiations, and international co-production pitches, that coverage matters more than social media numbers.",
    },
    {
      title: "An Audience That Watches Intentionally",
      body: "GetMeLit readers are the Nigerian and diaspora professional and creative class. They stream, they attend screenings, they argue about films. These are the people whose word-of-mouth actually moves ticket sales and streaming numbers.",
    },
    {
      title: "Critical Coverage, Not Synopses",
      body: "We don't rewrite your press release as a review. Our critics watch, form views, and write criticism that has context and opinion. That's what makes the coverage worth something beyond your own channels.",
    },
    {
      title: "Festival and Premiere Add-Ons",
      body: "Instagram Live premiere coverage, long-form video filmmaker interviews, and trailer editorial features are available as add-ons for key release moments.",
    },
  ],
  faqs: [
    {
      question: "Do you cover Nollywood studio releases as well as independent films?",
      answer: "We cover both, with a particular focus on independent Nigerian cinema, diaspora productions, and African films that don't get mainstream coverage. Studio releases are covered when there's genuine editorial interest.",
    },
    {
      question: "Can you review a series, not just a feature film?",
      answer: "Yes. We review series — full seasons or significant episode batches — as well as short films and documentaries. Confirm format at onboarding.",
    },
    {
      question: "Will the review be positive?",
      answer: "Our reviews are critical assessments, not promotional summaries. We won't publish a hatchet job, but we write honest criticism. If a project genuinely isn't landing with our critic, we discuss with you before any review publishes.",
    },
    {
      question: "Can I use The Moveee coverage in festival submissions and press packs?",
      answer: "Yes — and this is one of the primary use cases. Quote excerpts, include review links in submission materials, and reference Moveee coverage in pitch decks. Full text republication requires written permission.",
    },
    {
      question: "How far in advance should I book for a release window?",
      answer: "Four to six weeks before your target publication date is ideal. For festival-timed releases with hard deadlines, contact us as early as possible to confirm feasibility.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals allow you to continue coverage across multiple projects or a sustained release campaign. Renewal is confirmed before the current term ends.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "Development from ₦100,000. Three-month film coverage partnership.",
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const PARTNERSHIP_CATEGORIES: PartnershipCategory[] = [
  {
    id: "publishers",
    label: "Publishers & Authors",
    icon: "◈",
    tagline: "Book reviews, author interviews, news releases, and social content for publishers, authors, and literary organisations.",
    description: "For book publishers, independent authors, literary festivals, and publishing imprints.",
    service: publishersService,
    page: publishersPage,
  },
  {
    id: "galleries",
    label: "Art Galleries",
    icon: "◉",
    tagline: "Exhibition reviews, artist spotlights, opening coverage, and press releases for galleries and exhibition spaces.",
    description: "For art galleries, independent curators, exhibition spaces, and art fair organisers.",
    service: galleriesService,
    page: galleriesPage,
  },
  {
    id: "filmmakers",
    label: "Filmmakers & Producers",
    icon: "◎",
    tagline: "Film reviews, filmmaker profiles, festival coverage, and news releases for independent filmmakers and production companies.",
    description: "For independent filmmakers, production companies, and film festival organisers.",
    service: filmmakersService,
    page: filmmakersPage,
  },
];

export function getPartnershipCategory(id: string): PartnershipCategory | undefined {
  return PARTNERSHIP_CATEGORIES.find((c) => c.id === id);
}
