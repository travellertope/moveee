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
    { icon: "🎥", price: "₦120k", description: "Video Interview (Virtual) — recorded long-form conversation with the author, published on The Moveee's video channels." },
    { icon: "📱", price: "₦80k", description: "Instagram Live Q&A — live session hosted on The Moveee's Instagram, open to our full follower base." },
    { icon: "🎬", price: "₦220k", description: "Book Trailer — short-form video asset for your own channels to drive pre-orders and awareness." },
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
      body: "Content publishes on The Moveee and distributes through GetMeLit to our newsletter audience. Social posts go out across our channels. You receive live links as each piece goes up.",
    },
  ],
  benefits: [
    {
      title: "Reviews Written as Reviews",
      body: "Our literary coverage has opinions. We don't write promotional summaries dressed up as criticism. That's what makes a Moveee review credible — and worth having attached to a title.",
    },
    {
      title: "Reach Beyond Lagos Book Club Circles",
      body: "GetMeLit reaches readers across Lagos, Abuja, Accra, London, and New York. These are readers who buy books, attend events, and recommend titles — not just social media engagement.",
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
      answer: "We cover fiction, non-fiction, poetry, and creative non-fiction by authors from every region. Literary fiction, Afrofuturism, memoir, cultural criticism, and business titles with cultural relevance are particularly strong fits for our audience.",
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
    "A sustained editorial partnership for Nigerian and African art galleries, independent exhibition spaces, and art fair organisers. We review exhibitions, profile artists, cover openings, and publish news releases that keep your programme in front of the early collectors, critics, and culture lovers who matter.",
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
      body: "GetMeLit reaches professionals who engage with culture intentionally. Early collectors, architects, creative directors, and the culturally curious — the people who attend, follow artists, and start acquiring in their twenties and thirties.",
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
    "We serve independent filmmakers, production companies, and film festival organisers. Tiers are named after production phases — Development, Release, Festival, Distribution — so you can enter at the moment that makes sense for your project.",
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
      body: "GetMeLit readers are the professional and creative class. They stream, they attend screenings, they argue about films. These are the people whose word-of-mouth actually moves ticket sales and streaming numbers.",
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
      answer: "We cover both, with a particular focus on independent and international cinema that doesn't get mainstream coverage. Studio releases are covered when there's genuine editorial interest.",
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

// ── UK — Publishers & Authors ─────────────────────────────────────────────────
// Single package (mirrors moveeeProUK's "Publishers — Debut" in market-data.ts
// exactly — no fabricated multi-tier ladder like Africa's, since the UK Media
// Partnership only has one real tier per discipline).

const ukPublishersService: TierService = {
  slug: "publishers",
  name: "Media Partnership — Publishers",
  eyebrow: "Publishers & Authors",
  description:
    "A three-month editorial partnership for UK book publishers, independent authors, and literary organisations. We review titles, interview authors, publish news releases, and keep your work in conversation with the audience most likely to read and recommend it.",
  packages: [
    {
      name: "Publishers — Debut",
      billingNote: BILLING,
      price: "180", currency: "£",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "£250", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "£150", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "£450", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const ukPublishersPage: ServicePageContent = {
  headline: "UK Book Launches Deserve Readers Who Actually Show Up",
  tagline: "A three-month editorial partnership for independent publishers, authors, and literary organisations across Britain.",
  intro: [
    "A book launch without media infrastructure is a tree falling in an empty forest. The Publishers — Debut package gives you the editorial scaffolding that turns a publication date into a media moment: a review written by a reader who cares about the genre, an author interview given proper length and context, two news releases for your launch, and social content that keeps the title in conversation.",
    "We serve independent UK authors, London and Birmingham-based publishers, and literary festival organisers. The three-month window is enough time to cover a launch properly or build an author's presence around a touring season.",
    "This isn't a logo placement deal. It's an editorial relationship: we read your books, we form opinions, and we cover your work the way it deserves to be covered.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Onboarding & Content Calendar",
      body: "We schedule a call to understand your title, your author, and your launch calendar. From that, we build a content schedule for the three-month window — when the review and interview publish, and which moments get news releases.",
    },
    {
      step: "02",
      title: "Send a Review Copy",
      body: "A physical or digital review copy comes to our editorial team. We confirm receipt and give a read window of three to four weeks before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "The review is written as a review — with opinions, with context, with reference to the wider literary landscape. The author interview is conducted and edited for publication. News releases are written and distributed for your launch.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes through our UK newsletter. Social posts go out across our channels. You receive live links as each piece goes up.",
    },
  ],
  benefits: [
    {
      title: "A Review Written as a Review",
      body: "Our literary coverage has an opinion. We don't write promotional summaries dressed up as criticism. That's what makes a Moveee review credible — and worth having attached to a title.",
    },
    {
      title: "Reach Across the UK's Culturally Engaged Readers",
      body: "Our UK newsletter reaches readers and creatives across London, Birmingham, Manchester, and Bristol — engaged readers who buy books and recommend titles, not just scroll-past impressions.",
    },
    {
      title: "Sustained Coverage, Not a Single Spike",
      body: "A three-month partnership means multiple editorial touchpoints — a review, an interview, two news releases, and social content — keeping the title in conversation long after launch week.",
    },
    {
      title: "Video and Live Add-Ons Available",
      body: "A virtual video interview, an Instagram Live Q&A, or a promo trailer can be booked as an add-on for a specific launch moment or touring event.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all genres?",
      answer: "We cover fiction, non-fiction, poetry, and creative non-fiction. Literary fiction, memoir, cultural criticism, and titles with cultural relevance to our UK readership are particularly strong fits.",
    },
    {
      question: "What if the review is negative?",
      answer: "Our reviews are editorial — they have genuine assessments. We won't publish a purely negative takedown, but we won't inflate praise either. If a title genuinely isn't landing with our reviewer, we'll discuss with you before publishing.",
    },
    {
      question: "Can I use the published review in my own marketing?",
      answer: "Yes. You can quote excerpts, share links, and use the published URL in press materials and marketing. Full text republication requires written permission.",
    },
    {
      question: "What's the turnaround from receiving a review copy to publication?",
      answer: "Three to four weeks from receipt of the review copy. Expedited timelines can be discussed at onboarding for launch-critical windows.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals are available, and many publishers use consecutive terms to cover multiple titles or a sustained author campaign.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "£180. Three-month visibility package.",
};

// ── UK — Art Galleries ────────────────────────────────────────────────────────

const ukGalleriesService: TierService = {
  slug: "galleries",
  name: "Media Partnership — Galleries",
  eyebrow: "Art Galleries",
  description:
    "A three-month editorial partnership for UK art galleries, independent exhibition spaces, and art fair organisers. We review exhibitions, profile artists, and publish news releases that keep your programme in front of the early collectors, critics, and culture lovers who matter.",
  packages: [
    {
      name: "Galleries — Preview",
      billingNote: BILLING,
      price: "280", currency: "£",
      features: [
        { label: "Exhibition Review", included: "1×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "£250", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "£150", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "£450", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const ukGalleriesPage: ServicePageContent = {
  headline: "UK Exhibitions Deserve Critical Attention, Not Just a Listing",
  tagline: "A three-month editorial partnership for galleries, exhibition spaces, and art fair organisers across Britain.",
  intro: [
    "The UK's independent gallery scene is producing work worth talking about — and much of it goes undercovered outside the trade press. The Galleries — Preview package gives exhibition spaces the editorial infrastructure they need: an exhibition review written with critical seriousness, two artist spotlights that go beyond the bio, and news releases for your show.",
    "We serve London galleries, Birmingham and Manchester exhibition spaces, and independent curators running programmes worth covering. The three-month window can be renewed around your exhibition calendar.",
    "The goal isn't promotional content. It's a media record for your programme and your artists — the kind of coverage that ends up in press kits and grant applications.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Programme Briefing",
      body: "We start with a call to understand your exhibition, your represented artists, and the editorial moments you most want covered. We build a content plan from there.",
    },
    {
      step: "02",
      title: "Access & Invitations",
      body: "For the exhibition being reviewed, we attend the opening or arrange access during the show's run. For artist spotlights, we interview the artist directly.",
    },
    {
      step: "03",
      title: "Critical Editorial Production",
      body: "The review is written as criticism — contextualised within the wider UK art landscape, not as promotional copy. Artist spotlights go beyond the bio to the work and the thinking behind it.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes via our UK newsletter. Social posts go across our channels. Live links sent as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Critical Coverage, Not a Press Release Dressed as a Review",
      body: "Our exhibition review is written with editorial independence. It situates work in context and treats your programme as serious art — which is precisely what makes the coverage worth having.",
    },
    {
      title: "Reach Collectors, Curators, and the Cultural Class",
      body: "Our UK newsletter reaches professionals across London, Birmingham, Manchester, and Bristol who engage with culture intentionally — early collectors, creative directors, and the culturally curious.",
    },
    {
      title: "A Permanent Editorial Record",
      body: "Coverage on The Moveee becomes part of the searchable archive. When journalists, collectors, or curators research an artist or gallery, this is what they find.",
    },
    {
      title: "Video and Live Add-Ons Available",
      body: "A virtual video interview, an Instagram Live opening-night session, or a promo trailer can be booked as an add-on for a flagship show.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all types of visual art?",
      answer: "Painting, sculpture, photography, installation, textile art, digital and new media art, ceramics — we cover the range, wherever the work is being shown in the UK.",
    },
    {
      question: "Will the exhibition review always be positive?",
      answer: "Our review is editorial. It won't be dismissive or hostile, but it isn't promotional copy either. If our critic has genuine reservations, the review will reflect that.",
    },
    {
      question: "Can you cover openings outside London?",
      answer: "Yes. We cover Birmingham, Manchester, Bristol, and other UK cities where editorial resource allows.",
    },
    {
      question: "Can I use The Moveee coverage in my gallery's press materials?",
      answer: "Yes. Quoting the review, sharing the link, and referencing coverage in press kits and grant applications is actively encouraged. Full text republication requires written permission.",
    },
    {
      question: "Is the partnership renewable around our exhibition calendar?",
      answer: "Yes, and we encourage planning renewals in advance around your programme's peak moments.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "£280. Three-month exhibition coverage partnership.",
};

// ── UK — Filmmakers & Producers ───────────────────────────────────────────────

const ukFilmmakersService: TierService = {
  slug: "filmmakers",
  name: "Media Partnership — Film",
  eyebrow: "Filmmakers & Producers",
  description:
    "A three-month editorial partnership for UK filmmakers, independent production companies, and film festival organisers. We review films and series, profile filmmakers, and publish news releases — building the press record your work deserves.",
  packages: [
    {
      name: "Filmmakers — Development",
      billingNote: BILLING,
      price: "220", currency: "£",
      features: [
        { label: "Film Review", included: "1×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "£250", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "£150", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "£450", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const ukFilmmakersPage: ServicePageContent = {
  headline: "Independent British Film Deserves Critics, Not Just Listings",
  tagline: "A three-month editorial partnership for UK filmmakers, producers, and film festival organisers who want coverage that travels.",
  intro: [
    "Critical coverage of independent UK cinema — the kind that ends up in press packets and festival submissions — is scarce. The Filmmakers — Development package closes that gap: a film or series review, a filmmaker profile, and news releases that build a press record your distribution team can actually use.",
    "We serve independent filmmakers, production companies, and film festival organisers across Britain. The three-month window covers a release, a premiere, or a festival run.",
    "This is not promotional recap coverage. We write film criticism, filmmaker profiles with real depth, and news releases for productions worth announcing.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Project Briefing & Content Plan",
      body: "We start with a call to understand your project and release timeline. A three-month content plan is built from that conversation — the review timed to release, the interview to key announcements.",
    },
    {
      step: "02",
      title: "Screening Access",
      body: "For the title being reviewed, a screener or private link is provided to our critic, with a two-week watch window before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "The review is written as film criticism — situating the work within UK independent cinema, assessing craft, performance, and cultural significance. The filmmaker profile goes beyond the making-of to the ideas behind the work.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "The review and profile publish on The Moveee and distribute via our UK newsletter. Social posts go across our channels. Live links delivered as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Press Coverage That Works for Submissions and Pitches",
      body: "A Moveee review creates a citable, linkable press record. For festival submissions and pitches, that coverage matters more than social media numbers.",
    },
    {
      title: "An Audience That Watches Intentionally",
      body: "Our UK newsletter reaches creatives and professionals across London, Birmingham, Manchester, and Bristol who stream, attend screenings, and talk about films.",
    },
    {
      title: "Critical Coverage, Not a Synopsis",
      body: "We don't rewrite your press release as a review. Our critic watches, forms a view, and writes criticism with context and opinion.",
    },
    {
      title: "Premiere and Trailer Add-Ons",
      body: "An Instagram Live premiere session, a long-form video filmmaker interview, or a promo trailer can be booked as an add-on for a key release moment.",
    },
  ],
  faqs: [
    {
      question: "Can you review a series, not just a feature film?",
      answer: "Yes. We review series — full seasons or significant episode batches — as well as short films and documentaries. Confirm format at onboarding.",
    },
    {
      question: "Will the review be positive?",
      answer: "Our review is a critical assessment, not a promotional summary. We won't publish a hatchet job, but we write honest criticism. If a project genuinely isn't landing with our critic, we discuss with you before it publishes.",
    },
    {
      question: "Can I use The Moveee coverage in festival submissions and press packs?",
      answer: "Yes — this is one of the primary use cases. Quote excerpts, include the review link in submission materials, and reference the coverage in pitch decks.",
    },
    {
      question: "How far in advance should I book for a release window?",
      answer: "Four to six weeks before your target publication date is ideal. For festival-timed releases with hard deadlines, contact us as early as possible.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals allow you to continue coverage across multiple projects or a sustained release campaign.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "£220. Three-month film coverage partnership.",
};

// ── US — Publishers & Authors ─────────────────────────────────────────────────

const usPublishersService: TierService = {
  slug: "publishers",
  name: "Media Partnership — Publishers",
  eyebrow: "Publishers & Authors",
  description:
    "A three-month editorial partnership for US book publishers, independent authors, and literary organisations. We review titles, interview authors, publish news releases, and keep your work in conversation with the audience most likely to read and recommend it.",
  packages: [
    {
      name: "Publishers — Debut",
      billingNote: BILLING,
      price: "280", currency: "$",
      features: [
        { label: "Book Review", included: "1×" },
        { label: "Author Interview", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "$380", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "$230", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "$650", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const usPublishersPage: ServicePageContent = {
  headline: "US Book Launches Deserve Readers Who Actually Show Up",
  tagline: "A three-month editorial partnership for independent publishers, authors, and literary organisations across the United States.",
  intro: [
    "A book launch without media infrastructure is a tree falling in an empty forest. The Publishers — Debut package gives you the editorial scaffolding that turns a publication date into a media moment: a review written by a reader who cares about the genre, an author interview given proper length and context, two news releases for your launch, and social content that keeps the title in conversation.",
    "We serve independent US authors and publishers across New York, Atlanta, Houston, DC, and LA. The three-month window is enough time to cover a launch properly or build an author's presence around a touring season.",
    "This isn't a logo placement deal. It's an editorial relationship: we read your books, we form opinions, and we cover your work the way it deserves to be covered.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Onboarding & Content Calendar",
      body: "We schedule a call to understand your title, your author, and your launch calendar. From that, we build a content schedule for the three-month window — when the review and interview publish, and which moments get news releases.",
    },
    {
      step: "02",
      title: "Send a Review Copy",
      body: "A physical or digital review copy comes to our editorial team. We confirm receipt and give a read window of three to four weeks before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "The review is written as a review — with opinions, with context, with reference to the wider literary landscape. The author interview is conducted and edited for publication. News releases are written and distributed for your launch.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes through our US newsletter. Social posts go out across our channels. You receive live links as each piece goes up.",
    },
  ],
  benefits: [
    {
      title: "A Review Written as a Review",
      body: "Our literary coverage has an opinion. We don't write promotional summaries dressed up as criticism. That's what makes a Moveee review credible — and worth having attached to a title.",
    },
    {
      title: "Reach Across US Cities",
      body: "Our US newsletter reaches readers and creatives across New York, Atlanta, Houston, DC, and LA — engaged readers who buy books and recommend titles, not just scroll-past impressions.",
    },
    {
      title: "Sustained Coverage, Not a Single Spike",
      body: "A three-month partnership means multiple editorial touchpoints — a review, an interview, two news releases, and social content — keeping the title in conversation long after launch week.",
    },
    {
      title: "Video and Live Add-Ons Available",
      body: "A virtual video interview, an Instagram Live Q&A, or a promo trailer can be booked as an add-on for a specific launch moment or touring event.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all genres?",
      answer: "We cover fiction, non-fiction, poetry, and creative non-fiction. Literary fiction, memoir, cultural criticism, and titles with cultural relevance to our US readership are particularly strong fits.",
    },
    {
      question: "What if the review is negative?",
      answer: "Our reviews are editorial — they have genuine assessments. We won't publish a purely negative takedown, but we won't inflate praise either. If a title genuinely isn't landing with our reviewer, we'll discuss with you before publishing.",
    },
    {
      question: "Can I use the published review in my own marketing?",
      answer: "Yes. You can quote excerpts, share links, and use the published URL in press materials and marketing. Full text republication requires written permission.",
    },
    {
      question: "What's the turnaround from receiving a review copy to publication?",
      answer: "Three to four weeks from receipt of the review copy. Expedited timelines can be discussed at onboarding for launch-critical windows.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals are available, and many publishers use consecutive terms to cover multiple titles or a sustained author campaign.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "$280. Three-month visibility package.",
};

// ── US — Art Galleries ────────────────────────────────────────────────────────

const usGalleriesService: TierService = {
  slug: "galleries",
  name: "Media Partnership — Galleries",
  eyebrow: "Art Galleries",
  description:
    "A three-month editorial partnership for US art galleries, independent exhibition spaces, and art fair organisers. We review exhibitions, profile artists, and publish news releases that keep your programme in front of the early collectors, critics, and culture lovers who matter.",
  packages: [
    {
      name: "Galleries — Preview",
      billingNote: BILLING,
      price: "420", currency: "$",
      features: [
        { label: "Exhibition Review", included: "1×" },
        { label: "Artist Spotlight", included: "2×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "$380", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "$230", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "$650", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const usGalleriesPage: ServicePageContent = {
  headline: "US Exhibitions Deserve Critical Attention, Not Just a Listing",
  tagline: "A three-month editorial partnership for galleries, exhibition spaces, and art fair organisers across the United States.",
  intro: [
    "The US independent gallery scene is producing work worth talking about — and much of it goes undercovered outside the trade press. The Galleries — Preview package gives exhibition spaces the editorial infrastructure they need: an exhibition review written with critical seriousness, two artist spotlights that go beyond the bio, and news releases for your show.",
    "We serve galleries and exhibition spaces across New York, Atlanta, Houston, DC, and LA, and independent curators running programmes worth covering. The three-month window can be renewed around your exhibition calendar.",
    "The goal isn't promotional content. It's a media record for your programme and your artists — the kind of coverage that ends up in press kits and grant applications.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Programme Briefing",
      body: "We start with a call to understand your exhibition, your represented artists, and the editorial moments you most want covered. We build a content plan from there.",
    },
    {
      step: "02",
      title: "Access & Invitations",
      body: "For the exhibition being reviewed, we attend the opening or arrange access during the show's run. For artist spotlights, we interview the artist directly.",
    },
    {
      step: "03",
      title: "Critical Editorial Production",
      body: "The review is written as criticism — contextualised within the wider US art landscape, not as promotional copy. Artist spotlights go beyond the bio to the work and the thinking behind it.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "Content publishes on The Moveee and distributes via our US newsletter. Social posts go across our channels. Live links sent as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Critical Coverage, Not a Press Release Dressed as a Review",
      body: "Our exhibition review is written with editorial independence. It situates work in context and treats your programme as serious art — which is precisely what makes the coverage worth having.",
    },
    {
      title: "Reach Collectors, Curators, and the Cultural Class",
      body: "Our US newsletter reaches professionals across New York, Atlanta, Houston, DC, and LA who engage with culture intentionally — early collectors, creative directors, and the culturally curious.",
    },
    {
      title: "A Permanent Editorial Record",
      body: "Coverage on The Moveee becomes part of the searchable archive. When journalists, collectors, or curators research an artist or gallery, this is what they find.",
    },
    {
      title: "Video and Live Add-Ons Available",
      body: "A virtual video interview, an Instagram Live opening-night session, or a promo trailer can be booked as an add-on for a flagship show.",
    },
  ],
  faqs: [
    {
      question: "Do you cover all types of visual art?",
      answer: "Painting, sculpture, photography, installation, textile art, digital and new media art, ceramics — we cover the range, wherever the work is being shown in the US.",
    },
    {
      question: "Will the exhibition review always be positive?",
      answer: "Our review is editorial. It won't be dismissive or hostile, but it isn't promotional copy either. If our critic has genuine reservations, the review will reflect that.",
    },
    {
      question: "Can you cover openings outside New York?",
      answer: "Yes. We cover Atlanta, Houston, DC, LA, and other US cities where editorial resource allows.",
    },
    {
      question: "Can I use The Moveee coverage in my gallery's press materials?",
      answer: "Yes. Quoting the review, sharing the link, and referencing coverage in press kits and grant applications is actively encouraged. Full text republication requires written permission.",
    },
    {
      question: "Is the partnership renewable around our exhibition calendar?",
      answer: "Yes, and we encourage planning renewals in advance around your programme's peak moments.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "$420. Three-month exhibition coverage partnership.",
};

// ── US — Filmmakers & Producers ───────────────────────────────────────────────

const usFilmmakersService: TierService = {
  slug: "filmmakers",
  name: "Media Partnership — Film",
  eyebrow: "Filmmakers & Producers",
  description:
    "A three-month editorial partnership for US filmmakers, independent production companies, and film festival organisers. We review films and series, profile filmmakers, and publish news releases — building the press record your work deserves.",
  packages: [
    {
      name: "Filmmakers — Development",
      billingNote: BILLING,
      price: "350", currency: "$",
      features: [
        { label: "Film Review", included: "1×" },
        { label: "Filmmaker Profile", included: "1×" },
        { label: "News Release", included: "2×" },
        { label: "Social Media Sync", included: "Basic" },
      ],
      cta: CTA,
    },
  ],
  addOns: [
    { icon: "🎥", price: "$380", description: "Video Interview (Virtual) — recorded long-form conversation published on The Moveee's video channels." },
    { icon: "📱", price: "$230", description: "Instagram Live Q&A — live session hosted on The Moveee Instagram, open to our full follower base." },
    { icon: "🎬", price: "$650", description: "Promo Trailer — short-form video asset for your own channels to drive pre-orders, ticket sales, or awareness." },
  ],
};

const usFilmmakersPage: ServicePageContent = {
  headline: "Independent American Film Deserves Critics, Not Just Listings",
  tagline: "A three-month editorial partnership for US filmmakers, producers, and film festival organisers who want coverage that travels.",
  intro: [
    "Critical coverage of independent US cinema — the kind that ends up in press packets and festival submissions — is scarce outside the trade press. The Filmmakers — Development package closes that gap: a film or series review, a filmmaker profile, and news releases that build a press record your distribution team can actually use.",
    "We serve independent filmmakers, production companies, and film festival organisers across New York, Atlanta, Houston, DC, and LA. The three-month window covers a release, a premiere, or a festival run.",
    "This is not promotional recap coverage. We write film criticism, filmmaker profiles with real depth, and news releases for productions worth announcing.",
  ],
  howItWorks: [
    {
      step: "01",
      title: "Project Briefing & Content Plan",
      body: "We start with a call to understand your project and release timeline. A three-month content plan is built from that conversation — the review timed to release, the interview to key announcements.",
    },
    {
      step: "02",
      title: "Screening Access",
      body: "For the title being reviewed, a screener or private link is provided to our critic, with a two-week watch window before the review publishes.",
    },
    {
      step: "03",
      title: "Editorial Production",
      body: "The review is written as film criticism — situating the work within independent US cinema, assessing craft, performance, and cultural significance. The filmmaker profile goes beyond the making-of to the ideas behind the work.",
    },
    {
      step: "04",
      title: "Publish & Distribute",
      body: "The review and profile publish on The Moveee and distribute via our US newsletter. Social posts go across our channels. Live links delivered as each piece publishes.",
    },
  ],
  benefits: [
    {
      title: "Press Coverage That Works for Submissions and Pitches",
      body: "A Moveee review creates a citable, linkable press record. For festival submissions and pitches, that coverage matters more than social media numbers.",
    },
    {
      title: "An Audience That Watches Intentionally",
      body: "Our US newsletter reaches creatives and professionals across New York, Atlanta, Houston, DC, and LA who stream, attend screenings, and talk about films.",
    },
    {
      title: "Critical Coverage, Not a Synopsis",
      body: "We don't rewrite your press release as a review. Our critic watches, forms a view, and writes criticism with context and opinion.",
    },
    {
      title: "Premiere and Trailer Add-Ons",
      body: "An Instagram Live premiere session, a long-form video filmmaker interview, or a promo trailer can be booked as an add-on for a key release moment.",
    },
  ],
  faqs: [
    {
      question: "Can you review a series, not just a feature film?",
      answer: "Yes. We review series — full seasons or significant episode batches — as well as short films and documentaries. Confirm format at onboarding.",
    },
    {
      question: "Will the review be positive?",
      answer: "Our review is a critical assessment, not a promotional summary. We won't publish a hatchet job, but we write honest criticism. If a project genuinely isn't landing with our critic, we discuss with you before it publishes.",
    },
    {
      question: "Can I use The Moveee coverage in festival submissions and press packs?",
      answer: "Yes — this is one of the primary use cases. Quote excerpts, include the review link in submission materials, and reference the coverage in pitch decks.",
    },
    {
      question: "How far in advance should I book for a release window?",
      answer: "Four to six weeks before your target publication date is ideal. For festival-timed releases with hard deadlines, contact us as early as possible.",
    },
    {
      question: "Is the partnership renewable?",
      answer: "Yes. Three-month renewals allow you to continue coverage across multiple projects or a sustained release campaign.",
    },
  ],
  ctaLabel: "Start a partnership →",
  ctaSubtext: "$350. Three-month film coverage partnership.",
};

// ── Exports ───────────────────────────────────────────────────────────────────

const AFRICA_CATEGORIES: PartnershipCategory[] = [
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

const UK_CATEGORIES: PartnershipCategory[] = [
  {
    id: "publishers",
    label: "Publishers & Authors",
    icon: "◈",
    tagline: "A book review, an author interview, news releases, and social content for publishers, authors, and literary organisations.",
    description: "For book publishers, independent authors, literary festivals, and publishing imprints.",
    service: ukPublishersService,
    page: ukPublishersPage,
  },
  {
    id: "galleries",
    label: "Art Galleries",
    icon: "◉",
    tagline: "An exhibition review, artist spotlights, and press releases for galleries and exhibition spaces.",
    description: "For art galleries, independent curators, exhibition spaces, and art fair organisers.",
    service: ukGalleriesService,
    page: ukGalleriesPage,
  },
  {
    id: "filmmakers",
    label: "Filmmakers & Producers",
    icon: "◎",
    tagline: "A film review, a filmmaker profile, and news releases for independent filmmakers and production companies.",
    description: "For independent filmmakers, production companies, and film festival organisers.",
    service: ukFilmmakersService,
    page: ukFilmmakersPage,
  },
];

const US_CATEGORIES: PartnershipCategory[] = [
  {
    id: "publishers",
    label: "Publishers & Authors",
    icon: "◈",
    tagline: "A book review, an author interview, news releases, and social content for publishers, authors, and literary organisations.",
    description: "For book publishers, independent authors, literary festivals, and publishing imprints.",
    service: usPublishersService,
    page: usPublishersPage,
  },
  {
    id: "galleries",
    label: "Art Galleries",
    icon: "◉",
    tagline: "An exhibition review, artist spotlights, and press releases for galleries and exhibition spaces.",
    description: "For art galleries, independent curators, exhibition spaces, and art fair organisers.",
    service: usGalleriesService,
    page: usGalleriesPage,
  },
  {
    id: "filmmakers",
    label: "Filmmakers & Producers",
    icon: "◎",
    tagline: "A film review, a filmmaker profile, and news releases for independent filmmakers and production companies.",
    description: "For independent filmmakers, production companies, and film festival organisers.",
    service: usFilmmakersService,
    page: usFilmmakersPage,
  },
];

const PARTNERSHIP_CATEGORIES_BY_MARKET: Record<string, PartnershipCategory[]> = {
  africa: AFRICA_CATEGORIES,
  uk: UK_CATEGORIES,
  us: US_CATEGORIES,
};

export function getPartnershipCategories(market: string): PartnershipCategory[] {
  return PARTNERSHIP_CATEGORIES_BY_MARKET[market] ?? [];
}

export function getPartnershipCategory(market: string, id: string): PartnershipCategory | undefined {
  return getPartnershipCategories(market).find((c) => c.id === id);
}
