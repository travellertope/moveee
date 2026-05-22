export type HowItWorksStep = {
  step: string;
  title: string;
  body: string;
};

export type Benefit = {
  title: string;
  body: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type ServicePageContent = {
  headline: string;
  tagline: string;
  intro: string[];
  howItWorks: HowItWorksStep[];
  benefits: Benefit[];
  faqs: FAQ[];
  ctaLabel?: string;
  ctaSubtext?: string;
};

export const SERVICE_PAGES: Record<string, Record<string, ServicePageContent>> = {
  africa: {
    editorial: {
      headline: "Tell Your Story Where It Actually Lands",
      tagline: "Longform editorial. Newsletter distribution. Social reach. For brands that know their audience is African.",
      intro: [
        "Most PR placements treat Nigeria and the wider continent as an afterthought — a single paragraph in a global roundup, a stock photo that could be anywhere. The Moveee Sponsored Content package is built differently. We write a 800–1,200 word feature that places your brand, product, or story in genuine cultural context, shaped by writers who actually live this market.",
        "Every editorial feature is distributed through GetMeLit, our newsletter read by Nigerian and Pan-African professionals across Lagos, Abuja, Accra, Nairobi, and the diaspora. Alongside that, three native social posts go out across our platforms — copy and creative direction included. You brief us, we handle the craft.",
        "If you need to push further, our Amplify tiers extend reach through paid social and influencer networks. But the foundation — the feature, the newsletter, the social — is complete on its own. ₦200,000 flat, no hidden add-ons.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Brief",
          body: "Fill in our brief form: what you're launching, who you want to reach, any key messages or angles, and your preferred tone. We'll ask a few follow-up questions if needed, then confirm scope and timeline within 48 hours.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our editorial team crafts a 800–1,200 word longform piece. We don't copy-paste press releases — we write original editorial that reads like journalism because that's what builds trust with our audience. You'll see a draft before it goes anywhere.",
        },
        {
          step: "03",
          title: "Publish & Distribute",
          body: "The feature goes live on The Moveee, drops into GetMeLit, and three social posts go out across our channels. You get links to everything and a traffic report within 72 hours of publication.",
        },
        {
          step: "04",
          title: "Amplify (Optional)",
          body: "Want to push the feature further? Amplify tiers start at ₦65,000 and add layers of paid social promotion, influencer shares, and editorial syndication. Priority, Sponsored, Sponsored+, and Invested options are available at briefing.",
        },
      ],
      benefits: [
        {
          title: "Culturally Grounded Writing",
          body: "Our writers know the difference between Lagos Island and the mainland, understand how Afrobeats, Nollywood, and fashion intersect, and won't flatten your brand into generic African-market clichés.",
        },
        {
          title: "Newsletter Distribution That Reaches Decision-Makers",
          body: "GetMeLit lands in inboxes across Nigeria's professional and creative class. These are readers who open, engage, and act — not scroll-past impressions.",
        },
        {
          title: "One Brief, Full Execution",
          body: "You submit a brief. We handle writing, editing, distribution, and social. No juggling multiple agencies or freelancers. No version control nightmares.",
        },
        {
          title: "Transparent Pricing",
          body: "₦200,000 covers the feature, newsletter placement, and three social posts. Amplify is clearly scoped and priced before you commit. No surprise invoices.",
        },
      ],
      faqs: [
        {
          question: "What's the turnaround time from brief to publication?",
          answer: "Standard turnaround is 7–10 business days from brief sign-off. If you have a hard launch date, tell us in the brief and we'll confirm whether we can meet it before you pay.",
        },
        {
          question: "What do I need to provide?",
          answer: "A completed brief (takes about 15 minutes), any existing press materials, high-resolution imagery if available, and a key contact we can reach for quick factual questions. We handle everything else.",
        },
        {
          question: "Will the content be labelled as sponsored?",
          answer: "Yes. All brand-commissioned editorial carries a 'Brand Feature' or 'Partner Content' label in line with editorial standards. This is non-negotiable and actually builds reader trust — our audience knows we don't write disguised ads.",
        },
        {
          question: "Can I approve the copy before it publishes?",
          answer: "You'll receive a review draft and have one round of factual corrections. We don't accept rewrites that change editorial voice or remove critical framing — that's what makes our editorial credible and worth paying for.",
        },
        {
          question: "Is the feature exclusive to The Moveee?",
          answer: "The feature as written by us is exclusive. You're welcome to repurpose quotes, excerpts, and the published URL in your own channels. You cannot republish the full text verbatim elsewhere without agreement.",
        },
        {
          question: "What if I also want influencer coverage or out-of-home?",
          answer: "That's what the Amplify tiers are for. Invested tier, our most comprehensive option, layers in influencer partnerships, press syndication, and extended paid social. Discuss this at the brief stage.",
        },
      ],
      ctaLabel: "Submit a brief →",
      ctaSubtext: "₦200,000 flat. Amplify from ₦65,000.",
    },

    lifestyle: {
      headline: "Your Brand, Inside the Culture",
      tagline: "Curated commerce and editorial for African consumer brands that deserve more than a product listing.",
      intro: [
        "The Moveee Lifestyle & Commerce offering works in three tiers. Start with a free Directory Listing — no editorial, no upfront fee, just your brand in the directory with a tracked shop link and 10% commission on sales. It's the lowest-friction way to get in front of our audience.",
        "When you're ready for more, upgrade to a Brand Feature: a curated shop listing with an editorial write-up that frames your product in genuine cultural context, plus GetMeLit newsletter distribution and social promotion. Seasonal Drop takes it further — at Detty December, Lagos Fashion Week, and other high-traffic cultural moments, we build full editorial commerce campaigns around a select group of brands.",
        "At every tier, we earn on conversions. Our incentives are aligned with yours.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "List for Free",
          body: "Submit your brand for a free Directory Listing — no editorial review required, just your category, product link, and brand name. We set up an affiliate link and you're live in the directory within three business days.",
        },
        {
          step: "02",
          title: "Apply for Brand Feature",
          body: "When you're ready for editorial, submit your brand profile: product category, price point, brand story, and any existing press. We review applications on a rolling basis and respond within five business days.",
        },
        {
          step: "03",
          title: "Editorial Onboarding",
          body: "Once accepted, we onboard you with a product brief and write-up intake. You send samples where relevant. We confirm the editorial angle, affiliate link setup, and live dates.",
        },
        {
          step: "04",
          title: "Go Live",
          body: "Your listing goes live in the shop, the editorial write-up publishes, GetMeLit drops the feature into subscribers' inboxes, and social posts go out across our channels.",
        },
        {
          step: "05",
          title: "Track & Earn Together",
          body: "Affiliate sales are tracked and reported monthly. Commission is invoiced against confirmed conversions. We share performance data so you can see exactly what the placement drove.",
        },
      ],
      benefits: [
        {
          title: "Start Free, Upgrade When Ready",
          body: "The free Directory Listing removes all upfront risk. Get into the directory, see if the audience responds, and upgrade to a Brand Feature when you're ready for full editorial treatment.",
        },
        {
          title: "Curation That Signals Quality",
          body: "A Brand Feature tells readers this product has been editorially reviewed. That signal matters more than a generic paid-for listing — it's what converts a browse into a purchase.",
        },
        {
          title: "Seasonal Campaign Moments",
          body: "Detty December, Lagos Fashion Week, and Afrobeats season are high-intent shopping moments for our audience. Seasonal Drops are coordinated campaigns built around them — not last-minute newsletter mentions.",
        },
        {
          title: "Aligned Incentives",
          body: "At every tier, we earn on conversions. Our copy, timing, and placement decisions are made to drive actual purchases, not just impressions.",
        },
      ],
      faqs: [
        {
          question: "What's the difference between Directory Listing and Brand Feature?",
          answer: "A Directory Listing is free — your brand name, category, and shop link in the directory, with 10% commission on traced sales. No editorial write-up, no newsletter, no social. A Brand Feature adds all of that: an editorial write-up, GetMeLit newsletter placement, and social posts, plus a ₦80,000 flat fee.",
        },
        {
          question: "What product categories do you accept?",
          answer: "Fashion, beauty, wellness, homeware, food & drink, books and media, and African-made tech accessories. We don't currently list services or digital-only products in the shop, though these may be featured editorially.",
        },
        {
          question: "Is there exclusivity — can competitors also be listed?",
          answer: "We don't offer category exclusivity on Directory Listings or Brand Features. Seasonal Drops may include exclusivity within a campaign window — this is discussed at the time of application.",
        },
        {
          question: "How long does a Brand Feature listing stay live?",
          answer: "Brand Features run for a minimum of three months from publication. After that, listings are reviewed and renewed based on performance and continued brand eligibility.",
        },
        {
          question: "How long from Brand Feature application to going live?",
          answer: "Application review takes up to five business days. After acceptance, onboarding and go-live typically takes two to three weeks depending on whether a product shoot is required.",
        },
      ],
      ctaLabel: "List your brand →",
      ctaSubtext: "Free Directory Listing available now. Brand Feature by application.",
    },

    presskit: {
      headline: "Nigerian Brands Deserve a Media Presence. Build One.",
      tagline: "Monthly PR subscription for brands, founders, and organisations serious about consistent visibility in Nigerian media.",
      intro: [
        "Most Nigerian brands are invisible in the press not because their story is weak, but because they've never had consistent media infrastructure. MoveeePR is a monthly subscription that changes that: press release writing, media outreach to Nigerian publications, strategy calls, and ongoing placement tracking.",
        "Starter is designed for individuals and emerging businesses — one press release per month, distribution infrastructure, and quarterly Moveee editorial coverage. Growth adds volume and depth: two releases plus a thought leadership piece, regular media outreach, and monthly strategy calls to keep momentum building.",
        "PR compounds. One announcement is a flicker. Twelve months of consistent coverage is a reputation. We're set up to help you build the latter.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Brief & Strategy Session",
          body: "We start with a 45-minute strategy call. What's your story, what's your timeline, who are you trying to reach, and what does success look like? We map a three-month media plan from that conversation.",
        },
        {
          step: "02",
          title: "We Write the Releases",
          body: "Our team, supported by AI drafting tools, produces press releases that are actually readable. We don't write corporate boilerplate. Every release is pitched with a genuine hook, a clear news peg, and publication-specific angles where required.",
        },
        {
          step: "03",
          title: "Media Outreach",
          body: "We send to our established contacts at Nigerian national and digital publications. Outreach is ongoing, reported monthly, and adjusted based on what's generating traction.",
        },
        {
          step: "04",
          title: "Placements Confirmed",
          body: "Live links delivered as coverage goes up. You receive every placement URL with context — which outlet, which section, estimated reach.",
        },
        {
          step: "05",
          title: "Monthly Reporting",
          body: "MoveeePR subscribers receive a monthly report: placements secured, outlets contacted, estimated reach, and recommendations for the following month. PR compounds — this is a record of the foundation you're building.",
        },
      ],
      benefits: [
        {
          title: "PR That Actually Sounds Like Journalism",
          body: "Our releases are written to be published, not just sent. Editors engage with them because they read like stories, not adverts — which means faster placements and better coverage.",
        },
        {
          title: "Consistent Monthly Presence",
          body: "A single press release is a one-day story. MoveeePR is a media presence — monthly output that builds name recognition across the publications your audience, partners, and investors actually read.",
        },
        {
          title: "Nigerian Media Relationships",
          body: "We have established contacts at Nigerian national newspapers and digital publications. A pitch from a known editorial partner is treated differently from a cold email.",
        },
        {
          title: "Strategy, Not Just Execution",
          body: "Every subscriber gets a strategy call. We help you identify news pegs, anticipate calendar moments, and build a narrative arc for your brand over time. Not a press release factory.",
        },
      ],
      faqs: [
        {
          question: "What exactly is a press release?",
          answer: "A press release is a 400–600 word formal announcement written for media consumption. It follows a standard format that editors recognise and can publish quickly. We write yours, pitch it, and handle follow-up.",
        },
        {
          question: "How fast can you turn around a press release?",
          answer: "Standard turnaround is 48–72 hours from brief completion. For urgent news — funding announcements, crisis response, event-driven news — contact us directly to discuss expedited options.",
        },
        {
          question: "What makes a good story for Nigerian media?",
          answer: "A genuine news peg (launch, funding, milestone, partnership, award, cultural tie-in), a named and quotable spokesperson, and relevance to a Nigerian readership. We'll tell you honestly if your story needs more development before it's ready to pitch.",
        },
        {
          question: "Can I choose which publications to target?",
          answer: "Yes. We advise on which publications suit your story and audience, but you have final say on where we pitch.",
        },
        {
          question: "Is the subscription month-to-month or minimum term?",
          answer: "Starter is rolling month-to-month. Growth has a 3-month minimum to allow media relationships and momentum to build. We recommend at least three months on any tier to see compounding results.",
        },
        {
          question: "Can I start on Starter and move to Growth later?",
          answer: "Yes. Many clients start on Starter to build their brand narrative and media relationships, then upgrade to Growth when they have more news to run and a clearer media strategy. Upgrade any time with 30 days notice.",
        },
      ],
      ctaLabel: "Book a strategy call →",
      ctaSubtext: "Starter from ₦100,000/month. Growth from ₦120,000/month.",
    },

    partnership: {
      headline: "For Publishers, Galleries, Theatres, and Institutions That Take Culture Seriously",
      tagline: "A sustained media partnership for African cultural organisations — not a one-off feature, but a media relationship.",
      intro: [
        "Books launched in Nigeria deserve reviews. Art exhibitions deserve critical attention. Theatre productions deserve audiences who knew the show was happening before opening night. The Moveee Media Partnership exists because cultural institutions — publishers, galleries, theatres, museums, literary festivals — are chronically underserved by media that reaches the audiences they need.",
        "This isn't a sponsorship arrangement where you pay for logo placement. It's an editorial partnership: book reviews written by readers who understand the genre, author interviews given proper length and context, news releases for your launches and events, and social media presence tied to your actual programming calendar.",
        "The Media Partnership has three dedicated categories — publishers, art galleries, and filmmakers — each with independent pricing tiers. Publishers start from ₦80,000 (Debut) through to ₦680,000 (Imprint). Galleries from ₦130,000 (Preview) to ₦900,000 (Institution). Filmmakers from ₦100,000 (Development) to ₦750,000 (Distribution). Literary festivals and arts nonprofits are also welcome — contact us.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Onboarding & Brief",
          body: "We schedule an onboarding call to understand your programming calendar, audience, and key moments for the partnership period. From that, we build a content schedule — which reviews publish when, which interviews are prioritised, which events get news releases.",
        },
        {
          step: "02",
          title: "Schedule Reviews & Interviews",
          body: "For books, review copies are sent to our editorial team. For galleries and theatres, our reviewers attend or receive access to works. Author and artist interviews are scheduled with your communications lead. Everything runs to the agreed content calendar.",
        },
        {
          step: "03",
          title: "Publish Across The Moveee",
          body: "Reviews, interviews, and news releases publish on The Moveee platform and are distributed through GetMeLit. Your institution gets sustained editorial coverage that accumulates into a meaningful media archive — not a single burst of attention.",
        },
        {
          step: "04",
          title: "Social Amplification",
          body: "Every piece of content gets social support. Higher-tier partnerships include dedicated social posts, Instagram Story features, and, at Visibility+ tier, Instagram Live Q&As with your authors or artists.",
        },
      ],
      benefits: [
        {
          title: "Sustained Coverage, Not a One-Off",
          body: "A single review is forgotten by next week. A partnership means recurring visibility across months — new releases reviewed, author interviews running alongside launch windows, and social content that keeps your institution in conversation.",
        },
        {
          title: "Editorial Credibility, Not Advertorial",
          body: "Our reviews are written as reviews. They have opinions. They contextualise a book or exhibition within the wider landscape. That's what makes them worth reading — and worth having attached to your institution's name.",
        },
        {
          title: "Reach Across Nigeria and the Diaspora",
          body: "GetMeLit reaches Nigerian readers at home and in the diaspora. If you're a Lagos gallery with international aspirations, or a publisher whose titles circulate in London and Houston, your coverage travels with your audience.",
        },
        {
          title: "Add-Ons for Landmark Moments",
          body: "Video interviews, Instagram Live Q&As, and book trailers are available as add-ons for specific launches or events within a partnership. These can be planned in advance or booked when a particularly significant moment arises.",
        },
      ],
      faqs: [
        {
          question: "Is this only for book publishers?",
          answer: "No. The Media Partnership is explicitly designed for any cultural institution with editorial merit — art galleries, theatres, museums, literary festivals, arts nonprofits, and cultural centres. If your organisation produces culture worth covering, we want to talk.",
        },
        {
          question: "What tier is right for an independent author?",
          answer: "The Debut tier (₦80,000) is the entry point — one author interview, two news releases, and basic social. Season (₦190,000) adds a book review and a second interview. For authors with a release or touring season, Catalogue (₦360,000) gives three reviews and multimedia social coverage.",
        },
        {
          question: "How long does it take to publish a review after we send the book?",
          answer: "We aim for review publication within three to four weeks of receiving a review copy. For time-sensitive launch windows, tell us the publication date and we'll schedule accordingly.",
        },
        {
          question: "Is the partnership recurring?",
          answer: "Partnerships can be set up for a defined term (three months, six months, a year) or on a per-project basis. Recurring partnerships receive priority scheduling and a dedicated editorial contact.",
        },
        {
          question: "Can we influence the editorial angle of a review?",
          answer: "No. Reviews are editorially independent — that's what makes them valuable. You can provide context, author notes, and press materials. The editorial team decides the angle, tone, and conclusion. Positive coverage is earned, not purchased.",
        },
        {
          question: "What does the top Imprint tier include?",
          answer: "Imprint (₦680,000) is the full-house package: six book reviews, five author interviews, eight news releases, quarterly GetMeLit newsletter features, multimedia social posts, and live Q&A or event coverage. It's designed for publishers with multiple authors and sustained annual output.",
        },
      ],
      ctaLabel: "Enquire about a partnership →",
      ctaSubtext: "Publishers from ₦80,000 · Galleries from ₦130,000 · Filmmakers from ₦100,000.",
    },

    events: {
      headline: "Your Event Deserves More Than a Mention.",
      tagline: "Official media partner status for Nigerian and Pan-African events — pre-event build-up, live coverage, and post-event editorial.",
      intro: [
        "Detty December. Lagos Fashion Week. Afropunk. GTCO Food & Drink Festival. The best events in Nigeria succeed in part because people knew about them, talked about them, and showed up ready. The Moveee Happenings partnership gives your event official media partner status — pre-event editorial build-up, live coverage, post-event write-up, and a media badge you can use in your own comms.",
        "This is media partnership, not advertising. The Moveee editorial team attends, covers, and writes about events we believe in — which is why our coverage means something to readers who've learned to trust our taste.",
        "Choose from single-day coverage, multi-day festival partnerships, a pre-event rollout campaign, or the full Cultural Institution Partner package for recurring events and institutions.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquiry & Scope",
          body: "Submit an event enquiry with your date, location, audience profile, and what you'd like from the partnership. We'll confirm whether the event fits our editorial criteria and discuss scope — live coverage only, or full pre/post editorial package.",
        },
        {
          step: "02",
          title: "Partnership Agreement",
          body: "We agree on deliverables: how many editorial pieces, whether there's live social coverage, whether a media badge is included, and what access we need (press passes, interviews, space). Everything is documented before we begin.",
        },
        {
          step: "03",
          title: "Pre-Event Build-Up",
          body: "In the weeks before your event, we publish editorial content — a feature on what the event is and why it matters, social posts directing our audience to ticketing, and newsletter placement in GetMeLit.",
        },
        {
          step: "04",
          title: "Live Coverage",
          body: "Our team attends. We produce real-time social content from the floor, capturing atmosphere, speakers, performers, and guests. This is the kind of coverage that makes people who didn't attend wish they had.",
        },
        {
          step: "05",
          title: "Post-Event Editorial",
          body: "After the event, we publish a longform write-up — the story of what happened, why it mattered, and what's next. This becomes a permanent record of your event on The Moveee and in the GetMeLit archive.",
        },
      ],
      benefits: [
        {
          title: "Official Media Partner Status",
          body: "The Moveee media partner badge signals editorial endorsement. Use it on your event page, in sponsor decks, and in marketing. It tells your audience the event has been covered by a credible Black media brand.",
        },
        {
          title: "Pre, During, and Post Coverage",
          body: "Most media coverage happens after an event. We build anticipation before it, document it during, and contextualise it after. That's three distinct editorial touchpoints for your audience.",
        },
        {
          title: "Commission Tracking for Tours",
          body: "Origins/Tours listings use affiliate tracking that integrates with standard booking platforms. Every confirmed booking traced to our coverage generates 12% commission. No ambiguity, no approximations.",
        },
        {
          title: "GetMeLit Distribution",
          body: "Your event or travel experience reaches GetMeLit subscribers — Nigerian and Pan-African professionals who travel, attend cultural events, and have disposable income. This is not a general-interest audience.",
        },
      ],
      faqs: [
        {
          question: "How far in advance do I need to enquire for an event partnership?",
          answer: "A minimum of four weeks before the event date for standard partnerships. For major events requiring extended editorial build-up and confirmed attendance, six to eight weeks is preferred. Last-minute enquiries are considered on availability.",
        },
        {
          question: "What kinds of events qualify for a Happenings partnership?",
          answer: "Music concerts, cultural festivals, owambes, conferences, creative industry gatherings, brand activations with genuine cultural programming, film premieres, and sports-adjacent entertainment events. If your primary need is sustained editorial coverage of an ongoing programme — a gallery, a publisher, a filmmaker — that's our Media Partnership rather than Happenings.",
        },
        {
          question: "Is the media partner relationship exclusive?",
          answer: "We don't require exclusivity as a default, but we don't partner with events that have conflicting official media partners with competing editorial mandates. Discuss your existing media partners on enquiry.",
        },
        {
          question: "Can I use The Moveee coverage in my own marketing?",
          answer: "Yes. You may quote from published editorial, share links, and use the media partner badge in your own materials. Republishing full articles requires written permission.",
        },
      ],
      ctaLabel: "Enquire about event coverage →",
      ctaSubtext: "Events media partnership by application. Minimum four weeks' notice required.",
    },

    travel: {
      headline: "Put Your Tour in Front of the People Most Likely to Book It.",
      tagline: "Commission-based listing and editorial coverage for cultural tour operators and heritage travel experiences across Nigeria and West Africa.",
      intro: [
        "Moveee Origins is the travel arm of The Moveee — curated cultural and heritage tour listings for Nigerian and Pan-African audiences who want to travel with intention. If you run homecoming trips, heritage trails, festival packages, or cultural immersion experiences, this is where your audience already comes to discover what's worth booking.",
        "The model works in two tiers. Start with a free Basic Listing — your tour in the Origins directory with a tracked booking link and 12% commission on confirmed bookings. No upfront cost, no editorial required. When you're ready for more reach, upgrade to an Editorial Feature: a ₦50,000 flat fee gets you a full write-up, GetMeLit newsletter promotion, and social distribution.",
        "We only list experiences we'd genuinely recommend to our readers — which is exactly why our listings convert.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Experience",
          body: "Tell us about your tour or travel experience — itinerary, target audience, price point, and available dates. We assess fit with our editorial standards and confirm listing eligibility within five working days.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our editorial team writes a feature on your experience — the story of where it goes, what it means culturally, and why it's worth booking. You review the facts before it goes live.",
        },
        {
          step: "03",
          title: "Listed, Promoted, Tracked",
          body: "Your experience goes live in the Origins directory with its editorial feature. A dedicated affiliate link tracks all bookings traced to our content. You receive monthly booking reports and commission is invoiced quarterly.",
        },
      ],
      benefits: [
        {
          title: "The Right Audience",
          body: "GetMeLit subscribers are Nigerian and Pan-African professionals with disposable income who travel for culture, family, and experience. They are not bargain hunters — they're the ideal customer for a meaningful heritage trip.",
        },
        {
          title: "Zero Inventory Risk",
          body: "You pay a flat quarterly listing fee. Commission is only earned on confirmed bookings. No upfront ad spend with uncertain returns.",
        },
        {
          title: "Editorial Credibility",
          body: "A Moveee Origins feature is editorial recommendation, not a paid ad listing. That distinction matters to our readers — and it matters to your booking conversion rate.",
        },
      ],
      faqs: [
        {
          question: "What kinds of experiences qualify for Origins listing?",
          answer: "Cultural and heritage tours, homecoming trips, festival travel packages, food and craft experiences, and immersive diaspora reconnection experiences across Nigeria and West Africa. We assess editorial fit on enquiry.",
        },
        {
          question: "How does booking tracking work?",
          answer: "We use a unique affiliate link specific to your listing. Bookings originating from that link are confirmed through your booking platform and reported monthly. Commission of 12% is invoiced quarterly.",
        },
        {
          question: "Can I list multiple experiences?",
          answer: "Yes. Each experience is listed separately with its own editorial feature and tracking link. Each listing carries the ₦30,000 quarterly fee.",
        },
      ],
      ctaLabel: "List your experience →",
      ctaSubtext: "Free Basic Listing available now. Editorial Feature by application.",
    },

    connect: {
      headline: "Inside the Room Where the Culture Happens",
      tagline: "Quarterly community sponsorship for brands that want trust-transferred access to Nigerian and Pan-African creatives, entrepreneurs, and professionals.",
      intro: [
        "Moveee Connect is the community layer of The Moveee — a curated, semi-private space where Nigerian and Pan-African creatives, entrepreneurs, professionals, and culture lovers gather. Not a general public audience. A self-selected, high-intent community of people who care about African and diaspora culture deeply enough to opt in.",
        "When you buy a Moveee Connect sponsorship, you're not buying an ad. You're buying trust-transferred access — the ability to show up inside a community that already has a relationship with The Moveee, in a way that feels curated rather than intrusive. The Moveee team introduces you. Your content has to earn its place. Your member offer has to genuinely serve the people receiving it.",
        "₦100,000 per quarter gets you a warm community introduction, one sponsored content slot, and an exclusive member offer. For brands that can't reach this audience through mainstream Nigerian media — and most can't — this is the most direct route in.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquire and Brief",
          body: "Tell us about your brand, what you want to offer the community, and what your goals are for the quarter. We assess editorial fit — not every brand is right for Moveee Connect, and we won't place a brand whose offer doesn't serve the community.",
        },
        {
          step: "02",
          title: "Community Introduction",
          body: "We write and post a community introduction: who you are, why we're partnering with you this quarter, and why we think you're relevant to this community. The Moveee's voice vouches for you. That warm intro is worth more than a cold ad.",
        },
        {
          step: "03",
          title: "Your Sponsored Content Slot",
          body: "One piece of genuinely useful content shared to the community — a guide, resource, offer, or insight that serves people first. A Nigerian fashion brand might share how to get stocked in Abuja concept stores. A fintech might share a practical guide to diaspora remittance options. Value-first, brand second.",
        },
        {
          step: "04",
          title: "Exclusive Member Offer",
          body: "An offer, discount, or experience available only to Moveee Connect members. This creates reciprocity — the community feels rewarded, and you drive real commercial action. Offer parameters are agreed at briefing.",
        },
      ],
      benefits: [
        {
          title: "Trust Transfer, Not Interruption",
          body: "A warm introduction from The Moveee team carries weight that a banner ad never will. The community already trusts The Moveee's editorial judgement — that trust extends, partially, to brands we choose to feature.",
        },
        {
          title: "Self-Selected, High-Intent Audience",
          body: "Moveee Connect members opted in. They're not passively scrolling a timeline. They're engaged participants in a space they chose to join — which means your message lands differently.",
        },
        {
          title: "Reach Buyers Mainstream Media Can't Reach",
          body: "Financial services targeting diaspora professionals, legal services, education providers, real estate developers marketing to diaspora buyers, event promoters, recruiters — these buyers can't easily find this audience through mainstream Nigerian media. Moveee Connect is the direct line.",
        },
        {
          title: "Value-First Commercial Format",
          body: "Your content slot has to be genuinely useful. This keeps community trust intact, ensures high engagement, and means your brand is remembered for the value it added — not the promotion it ran.",
        },
      ],
      faqs: [
        {
          question: "What exactly is Moveee Connect?",
          answer: "A curated, semi-private community — think a well-moderated Telegram group, Discord, or similar platform — where Nigerian and Pan-African creatives, entrepreneurs, and professionals gather around shared interest in African and diaspora culture. Membership is opt-in and deliberately kept high-quality.",
        },
        {
          question: "Who is in the community?",
          answer: "Nigerian and Pan-African creatives, entrepreneurs, professionals, and culture lovers — people who engage with The Moveee's editorial and care enough about the culture to join a dedicated space. Age range 20–40, career-building and culturally driven.",
        },
        {
          question: "What counts as a 'sponsored content slot'?",
          answer: "One post sharing something genuinely useful — a guide, resource, exclusive insight, experience, or offer. It shouldn't read like an ad. We'll advise on format and review the content before it goes out.",
        },
        {
          question: "Is this available across other Moveee markets?",
          answer: "Yes. Moveee Connect operates in Nigeria/Africa, the UK, and the US. Each market has its own community. You can sponsor one or multiple markets — pricing is per market, per quarter.",
        },
        {
          question: "How is this different from a sponsored post on social?",
          answer: "A sponsored social post reaches a broad, passive audience. Moveee Connect reaches a small, active, high-intent community. The format is conversational and contextualised, not a standard ad unit. The community knows who sponsors it and why.",
        },
        {
          question: "Can I renew after the first quarter?",
          answer: "Yes, and renewal is encouraged. Consistency builds familiarity — brands that show up every quarter are perceived as part of the ecosystem, not one-off advertisers. Renewal is confirmed before the next quarter begins.",
        },
      ],
      ctaLabel: "Apply for Connect sponsorship →",
      ctaSubtext: "₦100,000 per quarter. Subject to editorial fit review.",
    },
    amplify: {
      headline: "Push Your Moveee Feature Further",
      tagline: "Paid social promotion, influencer reach, and ad placements — exclusively for content already published on The Moveee.",
      intro: [
        "Content Amplification is an add-on service, not a standalone purchase. To use it, you need an active or recently published Sponsored Content feature or Media Partnership with The Moveee. We don't amplify external content — only work published on our own platform.",
        "Once your feature is live, Amplify extends its reach through paid social ads targeting Nigerian and Pan-African audiences, influencer shares within our network, and extended newsletter distribution. You choose the tier that matches your budget and reach objectives.",
        "Think of the editorial feature as the foundation — Amplify is what you build on top of it when you want the story to travel further and faster than organic reach alone will take it.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Confirm Your Moveee Feature",
          body: "Amplify requires a live Sponsored Content feature or an active Media Partnership on The Moveee. Share the link to your published piece when you enquire — we'll confirm eligibility within 24 hours.",
        },
        {
          step: "02",
          title: "Choose Your Amplify Tier",
          body: "Select Priority, Sponsored, or Sponsored+ based on your reach objectives and budget. Each tier adds layers of paid social promotion, influencer distribution, and editorial syndication. We'll advise which tier fits your goals.",
        },
        {
          step: "03",
          title: "We Run the Campaign",
          body: "Our team sets up and manages the paid social campaign, coordinates influencer shares, and handles any extended newsletter distribution. You get a brief report at the end of the campaign period.",
        },
      ],
      benefits: [
        {
          title: "Targeted Reach, Not Spray and Pray",
          body: "Every paid placement targets Nigerian and Pan-African audiences — the same people who already read The Moveee. No wasted impressions on audiences who don't care about your category.",
        },
        {
          title: "Influencer Network Built In",
          body: "Higher tiers include coordinated shares from influencers within our network. These are people our audience already follows and trusts — not cold sponsored posts.",
        },
        {
          title: "Your Feature Does the Heavy Lifting",
          body: "The editorial piece handles the story; Amplify just gets more people in front of it. The credibility of a Moveee feature lands differently than a standalone ad — that's the real value of amplification.",
        },
      ],
      faqs: [
        {
          question: "Can I buy Content Amplification without a Sponsored Content or Media Partnership package?",
          answer: "No. Content Amplification is exclusively available as an add-on to Sponsored Content or Media Partnership. The feature we amplify must be published on The Moveee.",
        },
        {
          question: "How long does an Amplify campaign run?",
          answer: "Campaign length varies by tier — Priority runs for one week, Sponsored for two weeks, Sponsored+ for three weeks. Invested campaigns are discussed on a case-by-case basis.",
        },
        {
          question: "Can I add Amplify after my feature has already been published?",
          answer: "Yes, within 30 days of publication. Features older than 30 days are assessed on a case-by-case basis — reach us at hello@themoveee.com.",
        },
        {
          question: "What's the difference between the basic social posts in Sponsored Content and an Amplify campaign?",
          answer: "The social posts included in Sponsored Content are organic — posted to our channels with no paid spend behind them. Amplify adds a paid budget, audience targeting, and extended distribution that organic posts can't match.",
        },
      ],
      ctaLabel: "Enquire about Amplify →",
      ctaSubtext: "Requires an active Sponsored Content or Media Partnership package.",
    },
  },

  uk: {
    editorial: {
      headline: "Black British Stories, Told With the Weight They Deserve",
      tagline: "Longform editorial. Newsletter distribution. Social reach. For brands that understand the Black British market isn't a segment — it's a culture.",
      intro: [
        "The Black British market — across London, Birmingham, Manchester, and Bristol — is one of the most culturally sophisticated and brand-conscious audiences in the UK. It is also one of the most consistently misread by mainstream media. The British Moveee Sponsored Content package exists for brands that want to get it right.",
        "We produce an 800–1,200 word feature that earns its place in front of this audience: well-researched, culturally informed, and written by writers who are part of the communities they're speaking to. The feature distributes through our UK newsletter and goes out across our social channels as three native posts.",
        "The flat rate is £600, which covers the feature, newsletter inclusion, and social content. If your campaign requires extended reach — paid social, influencer activation, or press syndication — Amplify tiers start at £45 and are scoped to your needs. Everything is agreed before you commit.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Brief",
          body: "Complete our brief form with your brand's story, campaign goals, target audience, and any cultural context we should know. We'll respond within 48 hours to confirm scope and timeline.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our UK editorial team writes a 800–1,200 word longform piece. This is original editorial — not a formatted press release. You'll review a draft for factual accuracy before publication.",
        },
        {
          step: "03",
          title: "Publish & Distribute",
          body: "The feature goes live on The British Moveee, drops into our newsletter, and three native social posts roll out. You receive all links and a performance summary within 72 hours of publication.",
        },
        {
          step: "04",
          title: "Amplify (Optional)",
          body: "Amplify tiers from £45 push reach further through paid social, influencer shares, and editorial syndication. Priority, Sponsored, Sponsored+, and Invested options are available at the brief stage.",
        },
      ],
      benefits: [
        {
          title: "Writing That Reflects the Audience",
          body: "Our UK writers understand the nuances of Black British identity — Caribbean heritage, African heritage, second and third generation experiences, and the institutions (Notting Hill Carnival, Black History Month, the grime-to-Afrobeats pipeline) that shape cultural reference.",
        },
        {
          title: "Newsletter Reach Across the UK",
          body: "Our UK newsletter reaches Black British professionals and creatives in London, Birmingham, Manchester, and Bristol. These are engaged readers, not passive scrollers.",
        },
        {
          title: "Full Execution From Brief to Distribution",
          body: "Writing, editing, distribution, and social content — all covered. You brief us once. We handle everything else.",
        },
        {
          title: "Editorial Integrity Included",
          body: "The 'Partner Content' label is part of the product, not a compromise. Our audience trusts us because we're transparent. That trust is what makes the placement worth paying for.",
        },
      ],
      faqs: [
        {
          question: "What's the turnaround from brief to publication?",
          answer: "7–10 business days from brief sign-off. If you have a specific go-live date, flag it in the brief and we'll confirm feasibility before you pay.",
        },
        {
          question: "What do I need to provide?",
          answer: "A completed brief, any press materials, high-resolution imagery if you have it, and a point of contact for quick factual questions. Everything else is on us.",
        },
        {
          question: "Will it be labelled as sponsored content?",
          answer: "Yes. All commissioned editorial carries a 'Partner Content' or 'Brand Feature' label. This is standard editorial practice and is not negotiable. It's also what keeps our editorial credibility intact — which is the whole point.",
        },
        {
          question: "How many rounds of revisions do I get?",
          answer: "One round of factual corrections after the review draft. We don't accept revisions that change editorial voice, remove critical framing, or rewrite the piece to read like advertising copy.",
        },
        {
          question: "Can I use the published piece in my own marketing?",
          answer: "You can share the URL, quote excerpts, and use it in digital marketing. Full text republication elsewhere requires written permission.",
        },
        {
          question: "What's the difference between Priority, Sponsored, Sponsored+ and Invested Amplify tiers?",
          answer: "Priority boosts the feature through paid social. Sponsored adds influencer shares. Sponsored+ extends to editorial syndication partners. Invested is a full-spectrum push — paid social, influencers, press, and extended newsletter placement. Pricing is confirmed at the brief stage based on your goals.",
        },
      ],
      ctaLabel: "Submit a brief →",
      ctaSubtext: "£600 flat. Amplify from £45.",
    },

    lifestyle: {
      headline: "Black British Shoppers Are Intentional. Meet Them Where They Are.",
      tagline: "Curated commerce and editorial for brands the Black British community actually wants — not brands that want to be seen in it.",
      intro: [
        "The British Moveee Lifestyle & Commerce offering works in three tiers. Start with a free Directory Listing — no editorial, no upfront fee, just your brand in the directory with a tracked shop link and 10% commission on sales. Zero risk, instant presence.",
        "When you're ready for more, upgrade to a Brand Feature: a curated shop listing with an editorial write-up, GetMeLit UK newsletter distribution, and social promotion for £250 flat. Seasonal Drop takes it further — at Black History Month, Christmas gifting season, and other high-intent cultural moments, we build coordinated editorial campaigns around a select group of brands.",
        "At every tier, we earn on conversions. Our incentives are aligned with yours.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Apply",
          body: "Submit your brand profile: category, price point, founding story, and what makes your product worth featuring. We review applications within five business days.",
        },
        {
          step: "02",
          title: "Review & Onboarding",
          body: "Selected brands go through a brief editorial intake. We set up your affiliate tracking, confirm the editorial angle, and schedule your live date.",
        },
        {
          step: "03",
          title: "Editorial Production",
          body: "We write your feature. For physical products, samples may be requested for photography. The goal is copy and imagery that fits our editorial environment, not a generic product description.",
        },
        {
          step: "04",
          title: "Go Live",
          body: "Shop listing, editorial write-up, newsletter placement, and social posts all go live on the agreed date. You can track affiliate activity from day one.",
        },
        {
          step: "05",
          title: "Track & Report",
          body: "Sales traced to our content are reported monthly. Commission is invoiced against confirmed conversions. You receive the performance data.",
        },
      ],
      benefits: [
        {
          title: "Editorial Selection Signals Quality",
          body: "A Moveee listing tells Black British consumers this brand has been reviewed and chosen — not paid for placement in a general directory. That distinction matters in a market with high brand literacy.",
        },
        {
          title: "Black History Month Campaign Placement",
          body: "October in the UK is the highest-intent Black commerce moment of the year. Our Seasonal Drop campaigns are planned months in advance. Applications for BHM are competitive and open early.",
        },
        {
          title: "Commission-Aligned Promotion",
          body: "We earn when you sell. Our copy, timing, and placement decisions are oriented toward conversion, not just clicks.",
        },
        {
          title: "Audience With Real Purchasing Power",
          body: "Black British consumers in London alone represent significant discretionary spending. Our newsletter audience skews professional, creative, and brand-aware. They buy from brands they trust, and they trust brands we feature.",
        },
      ],
      faqs: [
        {
          question: "What product categories do you list?",
          answer: "Fashion, beauty, wellness, homeware, food & drink, books and media, and Black British or African-founded lifestyle brands. We assess each application individually.",
        },
        {
          question: "How does the affiliate commission work?",
          answer: "A trackable affiliate link is set up at onboarding. Confirmed sales originating from our content generate commission at a rate agreed in advance. We invoice monthly against conversions.",
        },
        {
          question: "Do you offer exclusivity?",
          answer: "Standard Brand Features do not carry category exclusivity. Seasonal Drop campaigns may include exclusivity within the campaign window — this is discussed at application.",
        },
        {
          question: "How long does the listing stay live?",
          answer: "Minimum three months from publication. Renewal is assessed on performance and continued brand eligibility.",
        },
        {
          question: "What's the timeline from application to going live?",
          answer: "Application review takes up to five business days. From acceptance to live, allow two to three weeks.",
        },
      ],
      ctaLabel: "List your brand →",
      ctaSubtext: "Free Directory Listing available now. Brand Feature by application.",
    },

    presskit: {
      headline: "Build a Consistent Media Presence in the UK.",
      tagline: "Monthly PR subscription for UK-based Black brands, creatives, and founders who need steady press coverage — not a one-off announcement.",
      intro: [
        "Consistent press coverage doesn't happen by accident. It happens through regular, well-written press releases pitched to the right journalists and publications on an ongoing basis. MoveeePR UK gives you that infrastructure: press release writing, ongoing media outreach across UK digital news platforms, and monthly reporting on what's landing.",
        "Starter gives you one release per month and the foundational brand narrative work to make every pitch count. Growth doubles the output, adds thought leadership content, and includes monthly strategy calls to keep your media presence building over time.",
        "PR compounds. One announcement is a flicker. Consistent monthly output is how brands become familiar to journalists — and eventually, to their audiences.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Strategy Call",
          body: "A 45-minute onboarding call to map your story, your timeline, and your media goals. We build a three-month plan from that conversation.",
        },
        {
          step: "02",
          title: "We Write the Releases",
          body: "Our team produces press releases written to be published — a genuine news hook, a quotable spokesperson, and a clear angle for UK readers. Not corporate boilerplate.",
        },
        {
          step: "03",
          title: "Outreach to UK Publications",
          body: "We distribute to UK digital news platforms and pitch to relevant journalists. Outreach is ongoing and adjusted each month based on what's generating traction.",
        },
        {
          step: "04",
          title: "Placements Confirmed",
          body: "Live links delivered as coverage goes up. You receive every placement URL with context — which outlet, audience size, and section.",
        },
        {
          step: "05",
          title: "Monthly Reporting",
          body: "Placements secured, outlets contacted, estimated reach, and recommendations for the following month. You're building a media record — this is the log of it.",
        },
      ],
      benefits: [
        {
          title: "Press Releases Written to Be Published",
          body: "Our releases are written like editorial, not marketing copy. That means faster uptake from editors and coverage that reflects well on your brand rather than reading like a paid-for announcement.",
        },
        {
          title: "UK Digital Distribution Network",
          body: "We distribute across a network of UK digital news platforms. Not a single outlet — a broad distribution that maximises the chances of your story landing.",
        },
        {
          title: "Monthly Consistency",
          body: "One placement is a flicker. MoveeePR is a steady accumulation of coverage that makes your brand familiar to editors, journalists, and eventually their readers.",
        },
        {
          title: "Strategy Included",
          body: "We help you identify news pegs, anticipate calendar moments, and build a narrative arc over time. You're not just buying press releases — you're buying a media strategy.",
        },
      ],
      faqs: [
        {
          question: "What counts as newsworthy for a press release?",
          answer: "A product launch, funding round, award, significant partnership, cultural milestone, or executive appointment — anything with a genuine news peg. We'll advise if your story needs more development before pitching.",
        },
        {
          question: "How fast can you turn around a press release?",
          answer: "48–72 hours from brief completion. For time-sensitive announcements, contact us directly to discuss expedited options.",
        },
        {
          question: "Which publications do you distribute to?",
          answer: "We distribute to a network of UK digital news platforms and pitch to relevant journalists based on your story. We advise on which outlets suit your brand and audience — you have final say on targeting.",
        },
        {
          question: "Is the MoveeePR subscription flexible?",
          answer: "MoveeePR is available month-to-month with a recommended minimum of three months. Annual subscribers receive a discounted rate.",
        },
        {
          question: "Do you work with brands outside London?",
          answer: "Yes. We work with UK-based brands and organisations wherever they are — London, Birmingham, Manchester, Glasgow, Bristol. The distribution network covers the whole of the UK.",
        },
        {
          question: "Can I start on Starter and move to Growth later?",
          answer: "Yes. Start on Starter to build your brand narrative and outreach rhythm, then upgrade to Growth when you have more news volume and a clearer media strategy. Upgrade any time with 30 days notice.",
        },
      ],
      ctaLabel: "Book a strategy call →",
      ctaSubtext: "Starter from £250/month. Growth from £450/month.",
    },

    events: {
      headline: "Your Event Is Part of Black British Culture. Cover It Like It Is.",
      tagline: "Official media partnership for UK events — pre-event build-up, live coverage, and post-event editorial for the Black British community.",
      intro: [
        "Notting Hill Carnival. Africa Oyé. Afropunk London. Migrate Festival. The events that define Black British cultural life succeed because community media builds the anticipation, documents the moment, and tells the story after. The British Moveee Happenings partnership gives your event that editorial infrastructure — official media partner status, pre-event coverage, live documentation, and a post-event write-up that becomes part of the permanent record.",
        "We partner with events we believe in editorially. That selectivity is what makes our coverage credible — and what makes readers trust our recommendations enough to show up.",
        "Choose from single-day coverage, multi-day festival partnerships, a pre-event rollout campaign, or the full Cultural Institution Partner package for recurring events and institutions.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquiry & Editorial Assessment",
          body: "Submit your event enquiry with date, location, audience profile, and partnership scope. We assess cultural fit and confirm whether we can commit editorial resources to coverage.",
        },
        {
          step: "02",
          title: "Partnership Agreement",
          body: "We agree deliverables in writing: articles, social coverage, live presence, access requirements, and media badge usage. No ambiguity about what's included.",
        },
        {
          step: "03",
          title: "Pre-Event Build-Up",
          body: "We publish editorial in the weeks leading up to your event — a feature on why it matters, newsletter placement, and social posts pointing audiences toward ticketing.",
        },
        {
          step: "04",
          title: "Live Coverage",
          body: "Our team attends. We produce real-time social content from the event — atmosphere, performers, speakers, guests. The kind of content that makes people who missed it resolve to attend next year.",
        },
        {
          step: "05",
          title: "Post-Event Write-Up",
          body: "A longform editorial on what happened and why it mattered. This is the permanent record of your event on The Moveee — searchable, shareable, and part of the cultural archive.",
        },
      ],
      benefits: [
        {
          title: "Official Media Partner Badge",
          body: "Use the British Moveee media partner badge in your event marketing, sponsor packs, and press materials. It signals editorial endorsement from a respected Black British media brand.",
        },
        {
          title: "Three Editorial Touchpoints",
          body: "Pre-event build-up, live coverage, and post-event write-up. Most events get covered once. Ours get covered in three distinct editorial moments.",
        },
        {
          title: "Travel Listings for Black British Audiences",
          body: "Black British travellers are significant consumers of cultural travel — heritage tours, African city breaks, Caribbean diaspora journeys. Our audience is primed for culturally resonant travel content.",
        },
        {
          title: "Commission-Based Travel Listing",
          body: "We earn on confirmed bookings, so our promotion is oriented toward conversion. The £75 quarterly listing fee maintains your presence in the directory between editorial features.",
        },
      ],
      faqs: [
        {
          question: "How far in advance should I approach you for an event partnership?",
          answer: "Minimum four weeks before the event date. For large-scale events requiring extended editorial build-up, six to eight weeks is ideal.",
        },
        {
          question: "What kinds of events qualify?",
          answer: "Cultural events, music festivals, creative industry conferences, brand activations with cultural programming, art exhibitions, film premieres, and community gatherings that serve the Black British community. We assess editorial fit on enquiry.",
        },
        {
          question: "Can I use The Moveee coverage in my own marketing?",
          answer: "Yes — link sharing, excerpt quoting, and media badge use are all permitted. Full text republication requires written permission.",
        },
        {
          question: "Do you attend events outside London?",
          answer: "Yes. We cover events across the UK where editorial resource allows. Birmingham, Manchester, and Bristol events have been covered. Confirm location at enquiry and we'll advise on attendance feasibility.",
        },
      ],
      ctaLabel: "Enquire about event coverage →",
      ctaSubtext: "Events partnership by application. Minimum four weeks' notice required.",
    },

    travel: {
      headline: "Heritage Travel, Listed Where Your Audience Already Looks.",
      tagline: "Commission-based listing and editorial coverage for Black British cultural travel operators and diaspora heritage experiences.",
      intro: [
        "Black British travellers are significant consumers of culturally intentional travel — homecoming trips to Nigeria, Ghana, Jamaica, and beyond. Diaspora city breaks. Heritage trails. Festival packages built around Afropunk, GTCO, or carnival season. The Moveee Origins UK lists the experiences worth booking for an audience that travels with purpose.",
        "The model works in two tiers. Start with a free Basic Listing — your tour in the Origins UK directory with a tracked booking link and 12% commission on confirmed bookings. No upfront cost, no editorial required. When you're ready for more reach, upgrade to an Editorial Feature: a £120 flat fee gets you a full write-up, GetMeLit UK newsletter promotion, and social distribution.",
        "We only list experiences we'd genuinely recommend to our readers — which is exactly why our listings convert.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Experience",
          body: "Tell us about your tour — itinerary, target audience, price point, and available dates. We assess fit with our editorial standards and confirm listing eligibility within five working days.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our editorial team writes a feature on your experience — where it goes, what it means culturally, and why it's worth booking. You review the facts before publication.",
        },
        {
          step: "03",
          title: "Listed, Promoted, Tracked",
          body: "Your experience goes live in the Origins UK directory. A dedicated affiliate link tracks all bookings. You receive monthly booking reports and commission is invoiced quarterly.",
        },
      ],
      benefits: [
        {
          title: "The Right Audience",
          body: "GetMeLit UK subscribers are Black British professionals with disposable income who travel intentionally. They are looking for heritage and cultural experiences — your exact customer.",
        },
        {
          title: "Zero Inventory Risk",
          body: "A flat quarterly listing fee with commission only on confirmed bookings. No upfront ad spend with uncertain returns.",
        },
        {
          title: "Editorial Credibility",
          body: "A Moveee Origins feature reads as editorial recommendation, not a paid listing. That's the difference between a browse and a booking.",
        },
      ],
      faqs: [
        {
          question: "What kinds of experiences qualify?",
          answer: "Homecoming heritage tours, Afrobeats and carnival festival travel packages, roots tourism, cultural city breaks, and immersive diaspora reconnection experiences. We assess editorial fit on enquiry.",
        },
        {
          question: "How does booking tracking work?",
          answer: "Through a unique affiliate link specific to your listing. Bookings traced to that link are confirmed via your booking platform and reported monthly. Commission of 12% is invoiced quarterly.",
        },
        {
          question: "Can I list multiple experiences?",
          answer: "Yes. Each experience is listed and featured separately. Each carries its own £75 quarterly listing fee.",
        },
      ],
      ctaLabel: "List your experience →",
      ctaSubtext: "Free Basic Listing available now. Editorial Feature by application.",
    },

    connect: {
      headline: "The Room Where Black British Culture Does Business",
      tagline: "Quarterly community sponsorship for brands that want trust-transferred access to Black British and diaspora creatives, professionals, and entrepreneurs.",
      intro: [
        "Moveee Connect UK is the community layer of The Moveee — a curated, semi-private space where Black British and diaspora creatives, entrepreneurs, professionals, and culture lovers gather. Not a general social media audience. A self-selected community of people who care about Black culture enough to opt in and actively participate.",
        "A quarterly sponsorship isn't an ad placement. It's trust-transferred access — you show up inside a community that already has a relationship with The Moveee, introduced by the team, in a format that feels curated and useful rather than intrusive. The community knows who's in the room and why.",
        "£200 per quarter. A warm introduction, one sponsored content slot, one exclusive member offer. For brands that can't easily reach Black British professionals and creatives through mainstream UK media — which is most — Moveee Connect is the most direct route in.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquire and Brief",
          body: "Tell us about your brand, what you want to offer the community, and what your goals are for the quarter. We assess editorial fit — not every brand is right for Moveee Connect UK, and we won't place a brand whose offer doesn't genuinely serve the community.",
        },
        {
          step: "02",
          title: "Community Introduction",
          body: "We write and post an introduction to the community: who you are, why we're working with you this quarter, and why we think you're relevant to Black British and diaspora community members. Our voice vouches for you. That matters.",
        },
        {
          step: "03",
          title: "Your Sponsored Content Slot",
          body: "One piece of genuinely useful content shared to the community. A legal services firm might share '5 things diaspora entrepreneurs get wrong about UK company formation.' A fashion brand might share how to get stocked in UK independent boutiques. Value-first, brand second.",
        },
        {
          step: "04",
          title: "Exclusive Member Offer",
          body: "An offer, discount, or experience available only to Moveee Connect UK members. Creates reciprocity — the community feels rewarded, and you drive real commercial action. Offer parameters are agreed at briefing.",
        },
      ],
      benefits: [
        {
          title: "Trust Transfer, Not Interruption",
          body: "A warm introduction from The Moveee team carries weight that a display ad or sponsored post never will. The community trusts The Moveee's editorial judgement — that trust extends to brands we choose to endorse.",
        },
        {
          title: "Self-Selected, High-Intent Community",
          body: "These are people who chose to be here — not passive social scrollers. Black British and diaspora professionals who are culturally engaged, economically active, and receptive to brands that understand their context.",
        },
        {
          title: "Buyers Mainstream UK Media Struggles to Reach",
          body: "Financial services targeting diaspora professionals, immigration lawyers, Caribbean and African property, education providers, recruiters, fintechs — there's no efficient way to reach Black British and diaspora audiences in mainstream UK media. Moveee Connect is the direct line.",
        },
        {
          title: "Value-First Format That Builds Brand Memory",
          body: "Your content slot has to genuinely serve the community. This means higher engagement, stronger brand recall, and a relationship that persists beyond the quarter.",
        },
      ],
      faqs: [
        {
          question: "What is Moveee Connect UK?",
          answer: "A curated semi-private community — a moderated group space on Telegram, Discord, or a similar platform — for Black British and diaspora creatives, entrepreneurs, and professionals. Membership is opt-in and quality-controlled.",
        },
        {
          question: "Who are the members?",
          answer: "Black British and diaspora creatives, entrepreneurs, and professionals — people in the Black community in the UK who engage with The Moveee's editorial content. Age range 20–40, career-building and culturally engaged.",
        },
        {
          question: "What does the sponsored content slot look like in practice?",
          answer: "One post to the community from your brand — written in a way that serves community members first. We'll advise on the right format, review the content before it goes out, and make sure it fits the community's tone.",
        },
        {
          question: "Can I run this across multiple Moveee markets?",
          answer: "Yes. Connect operates in Africa/Nigeria, the UK, and the US. Sponsoring multiple markets gives you cross-market reach. Each market is priced independently per quarter.",
        },
        {
          question: "How is this different from a standard sponsored post?",
          answer: "A sponsored post on social reaches a passive, broad audience with no particular reason to trust you. Moveee Connect reaches an active, self-selected community that trusts The Moveee's endorsement. Very different starting point for a brand relationship.",
        },
        {
          question: "Can I renew quarter to quarter?",
          answer: "Yes. Consistent presence across multiple quarters deepens brand familiarity and signals genuine investment in the community. Renewal is offered before each new quarter.",
        },
      ],
      ctaLabel: "Apply for Connect sponsorship →",
      ctaSubtext: "£200 per quarter. Subject to editorial fit review.",
    },
    amplify: {
      headline: "Push Your Moveee Feature Further",
      tagline: "Paid social promotion, influencer reach, and ad placements — exclusively for content already published on The British Moveee.",
      intro: [
        "Content Amplification is an add-on service, not a standalone purchase. To use it, you need an active or recently published Sponsored Content feature or Media Partnership with The British Moveee. We don't amplify external content — only work published on our own platform.",
        "Once your feature is live, Amplify extends its reach through paid social ads targeting Black British audiences across the UK, influencer shares within our network, and extended GetMeLit UK newsletter distribution. Choose the tier that matches your budget and reach objectives.",
        "The editorial feature is the foundation — Amplify is what gets the story in front of more of the right people, faster than organic reach alone will manage.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Confirm Your Moveee Feature",
          body: "Amplify requires a live Sponsored Content feature or an active Media Partnership on The British Moveee. Share the link to your published piece when you enquire — we'll confirm eligibility within 24 hours.",
        },
        {
          step: "02",
          title: "Choose Your Amplify Tier",
          body: "Select Priority or Sponsored based on your reach objectives and budget. Each tier adds layers of paid social promotion and influencer distribution. We'll advise which tier fits your goals.",
        },
        {
          step: "03",
          title: "We Run the Campaign",
          body: "Our team sets up and manages the paid social campaign, coordinates influencer shares, and handles any extended newsletter distribution. You get a brief report at the end of the campaign period.",
        },
      ],
      benefits: [
        {
          title: "Black British Audience Targeting",
          body: "Every paid placement targets Black British and African Caribbean diaspora audiences — the same readership that already engages with The British Moveee. No wasted impressions on irrelevant demographics.",
        },
        {
          title: "Credibility That Travels",
          body: "Amplifying a Moveee feature lands differently from a cold ad. The audience already knows us, trusts our editorial voice, and is more likely to engage with promoted content they recognise.",
        },
        {
          title: "Influencer Reach Within the Community",
          body: "Higher tiers include coordinated shares from influencers connected to our network — people the Black British community already follows, not unfamiliar sponsored accounts.",
        },
      ],
      faqs: [
        {
          question: "Can I buy Content Amplification without a Sponsored Content or Media Partnership package?",
          answer: "No. Content Amplification is exclusively available as an add-on to Sponsored Content or Media Partnership. The feature we amplify must be published on The British Moveee.",
        },
        {
          question: "Can I add Amplify after my feature has already gone live?",
          answer: "Yes, within 30 days of publication. Features older than 30 days are assessed on enquiry — reach us at hello@themoveee.com.",
        },
        {
          question: "What's the difference between the social posts in Sponsored Content and an Amplify campaign?",
          answer: "The social posts included in Sponsored Content are organic. Amplify adds a paid budget behind those posts, audience targeting, influencer distribution, and extended newsletter reach — all of which organic posting cannot match.",
        },
      ],
      ctaLabel: "Enquire about Amplify →",
      ctaSubtext: "Requires an active Sponsored Content or Media Partnership package.",
    },
  },

  us: {
    editorial: {
      headline: "For Brands That Know the Diaspora Isn't One Story",
      tagline: "Longform editorial, newsletter distribution, and social reach for brands ready to engage Black American and diaspora communities with substance.",
      intro: [
        "The Black diaspora in the United States — in New York, Atlanta, Houston, DC, and Los Angeles — is not a monolith, and any brand treating it like one will be seen through immediately. The Moveee America Sponsored Content package is built around cultural specificity: writing that understands the difference between a Yoruba cultural reference and a Trinidadian one, between Atlanta's Black creative economy and the Nigerian American professional community in the DMV.",
        "An 800–1,200 word longform feature, distributed through our US newsletter and amplified by three native social posts, for $800 flat. The feature is written by writers who are part of these communities. You brief us, we handle the craft, and you get links and traffic data within 72 hours of publication.",
        "Amplify tiers start at $60 and extend reach through paid social, influencer networks, and press syndication — Priority, Sponsored, Sponsored+, and Invested options available at the brief stage. Everything is scoped before you commit.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Brief",
          body: "Complete our brief form with your brand story, campaign goals, target audience, and any cultural context we should be aware of. We respond within 48 hours to confirm scope and timeline.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our US editorial team produces an 800–1,200 word original piece. Not a formatted press release — original editorial that earns its place in front of a discerning diaspora audience. You review a draft for factual accuracy.",
        },
        {
          step: "03",
          title: "Publish & Distribute",
          body: "Feature goes live on The Moveee, newsletter drops, social posts roll out. Links and performance summary within 72 hours of publication.",
        },
        {
          step: "04",
          title: "Amplify (Optional)",
          body: "Amplify tiers from $100 push further through paid social, influencer shares, and editorial syndication. Options are scoped and priced at the brief stage.",
        },
      ],
      benefits: [
        {
          title: "Writers Who Understand the Landscape",
          body: "Our US editorial team knows how Afrobeats landed in Atlanta before it crossed over, how Caribbean heritage shapes Brooklyn's cultural institutions, and how the Nigerian American professional community in DC and Houston thinks about representation. That knowledge is in the writing.",
        },
        {
          title: "Newsletter Reach Across Five Diaspora Cities",
          body: "NYC, Atlanta, Houston, DC, and LA. Our US newsletter reaches Black diaspora readers who are professionally established, culturally engaged, and brand-literate.",
        },
        {
          title: "One Brief, Complete Execution",
          body: "You submit a brief. We produce the feature, handle distribution, and manage social. No juggling agencies or freelancers.",
        },
        {
          title: "Transparent Pricing, No Surprises",
          body: "$800 covers the feature, newsletter, and three social posts. Amplify is a separate, clearly priced add-on. No invoice you weren't expecting.",
        },
      ],
      faqs: [
        {
          question: "What's the turnaround time?",
          answer: "7–10 business days from brief sign-off. Hard launch dates are accommodated if flagged in the brief and confirmed feasible before payment.",
        },
        {
          question: "What do I need to provide?",
          answer: "A completed brief, any existing press materials, high-resolution imagery if available, and a point of contact for quick factual questions.",
        },
        {
          question: "Will the feature be labelled as paid content?",
          answer: "Yes. All commissioned editorial carries a 'Partner Content' or 'Brand Feature' label. This is editorial standard, non-negotiable, and the foundation of our reader trust.",
        },
        {
          question: "Can I review and approve the copy?",
          answer: "One round of factual corrections after the review draft. We don't accept rewrites that change editorial voice or flatten the piece into ad copy — that would defeat the purpose.",
        },
        {
          question: "Is the content exclusive to The Moveee?",
          answer: "The piece as written is exclusive to us. You may share the URL, quote excerpts, and use it in your own marketing. Full text republication requires written permission.",
        },
        {
          question: "What's the difference between the four Amplify tiers?",
          answer: "Priority adds paid social promotion. Sponsored adds influencer shares. Sponsored+ adds editorial syndication. Invested is the full spectrum — paid social, influencers, press, and extended newsletter placement. All are priced at the brief stage based on your goals and timeline.",
        },
      ],
      ctaLabel: "Submit a brief →",
      ctaSubtext: "$800 flat. Amplify from $100.",
    },

    lifestyle: {
      headline: "The Diaspora Shops With Intention. Be Worth Discovering.",
      tagline: "Curated commerce and editorial for brands that deserve a place in the Black diaspora's cultural conversation.",
      intro: [
        "The Moveee America Lifestyle & Commerce offering works in three tiers. Start with a free Directory Listing — no editorial, no upfront fee, just your brand in the directory with a tracked shop link and 10% commission on sales. It's how brands across NYC, Atlanta, Houston, DC, and LA get in front of the diaspora audience with zero risk.",
        "When you're ready for full editorial treatment, upgrade to a Brand Feature: a curated shop listing with an editorial write-up, GetMeLit US newsletter distribution, and social promotion for $450 flat. Seasonal Drop positions your brand inside Juneteenth, Black History Month, and holiday gifting season — coordinated editorial campaigns built around high-intent cultural moments.",
        "At every tier, we earn on confirmed conversions. Our incentives are aligned with yours.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Apply",
          body: "Submit your brand profile: category, price point, founding story, and any existing press or community recognition. We review within five business days.",
        },
        {
          step: "02",
          title: "Editorial Review & Onboarding",
          body: "Selected brands go through an editorial intake: affiliate link setup, shoot coordination if needed, and live date scheduling.",
        },
        {
          step: "03",
          title: "We Produce the Feature",
          body: "Our editorial team writes your brand up. For physical products, samples may be requested. The goal is copy that places your product in cultural context, not a product description that reads like a tag.",
        },
        {
          step: "04",
          title: "Go Live",
          body: "Shop listing, editorial write-up, newsletter feature, and social posts all launch on your confirmed date.",
        },
        {
          step: "05",
          title: "Track & Report",
          body: "Affiliate sales are tracked and reported monthly. Commission invoiced against confirmed conversions. You see the data.",
        },
      ],
      benefits: [
        {
          title: "Editorial Curation as a Quality Signal",
          body: "A Moveee listing means your brand has been reviewed and chosen. In a market where diaspora consumers have strong filters and high brand literacy, that editorial stamp means something.",
        },
        {
          title: "Juneteenth and Black History Month Campaigns",
          body: "These are the highest-intent Black commerce moments in the US calendar. Our Seasonal Drop campaigns are planned well in advance. Application spots are competitive.",
        },
        {
          title: "Commission-Aligned Promotion",
          body: "We earn on sales, not traffic. Our copy and placement decisions prioritise conversion.",
        },
        {
          title: "Five-City Diaspora Reach",
          body: "NYC, Atlanta, Houston, DC, LA. These are markets where diaspora purchasing power is concentrated and brand discovery through trusted community media is how buying decisions get made.",
        },
      ],
      faqs: [
        {
          question: "What product categories do you accept?",
          answer: "Fashion, beauty, wellness, homeware, food & drink, books and media, and African or Caribbean diaspora-founded lifestyle brands. Each application is assessed individually.",
        },
        {
          question: "How does the affiliate commission work?",
          answer: "A trackable affiliate link is set up at onboarding. Confirmed sales originating from our content earn commission at a rate agreed in advance. Monthly invoicing against conversions.",
        },
        {
          question: "Do you offer exclusivity?",
          answer: "Brand Features don't carry category exclusivity by default. Seasonal Drop campaigns may include exclusivity within the campaign window — discussed at the application stage.",
        },
        {
          question: "How long does a listing stay live?",
          answer: "Minimum three months. Renewal is assessed on performance and continued brand eligibility.",
        },
        {
          question: "How long from application to going live?",
          answer: "Application review takes up to five business days. From acceptance to live, allow two to three weeks.",
        },
      ],
      ctaLabel: "List your brand →",
      ctaSubtext: "Free Directory Listing available now. Brand Feature by application.",
    },

    presskit: {
      headline: "Build a Consistent Media Presence Across the US.",
      tagline: "Monthly PR subscription for Black diaspora brands who need steady press coverage — not a one-off announcement.",
      intro: [
        "Getting consistent press coverage as an African or Caribbean diaspora brand in the US requires a rhythm, not a one-off pitch. MoveeePR US gives you that rhythm: press release writing, ongoing media outreach to US digital news platforms, and monthly reporting on what's landing.",
        "Starter gives you one release per month and the brand narrative groundwork that makes every pitch more effective. Growth doubles the output, adds thought leadership content, and includes monthly strategy calls to keep your media presence building.",
        "PR compounds. A single press release is a single day's coverage. MoveeePR is the monthly infrastructure that makes your brand familiar to editors — and eventually, to the diaspora audiences they reach.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Strategy Call",
          body: "A 45-minute onboarding call to map your story, your goals, and your media calendar. We produce a three-month PR plan from that conversation.",
        },
        {
          step: "02",
          title: "We Write the Releases",
          body: "Our team writes press releases with a real news hook, a quotable spokesperson, and clear relevance to US readers. Not boilerplate. Not third-person corporate speak that editors delete on sight.",
        },
        {
          step: "03",
          title: "Outreach to US Publications",
          body: "We distribute to US digital news platforms and pitch to relevant journalists. Outreach is ongoing and adjusted each month based on what's generating traction.",
        },
        {
          step: "04",
          title: "Placements Confirmed",
          body: "Live links delivered as coverage goes up. You receive every placement URL with context — outlet, section, and estimated audience.",
        },
        {
          step: "05",
          title: "Monthly Reporting",
          body: "Placements secured, outlets contacted, estimated reach, and strategy recommendations for the following month. You're building a media record — this is the log of it.",
        },
      ],
      benefits: [
        {
          title: "Releases Written to Be Published",
          body: "We write for editors, not brand managers. That means fewer rewrites, faster placements, and coverage that reads like journalism rather than a paid-for announcement.",
        },
        {
          title: "US Digital Distribution Network",
          body: "We distribute across a network of US digital news platforms and pitch to relevant journalists. Broad distribution maximises the chance of your story finding the right editorial home.",
        },
        {
          title: "Monthly Media Presence",
          body: "Consistent coverage across months makes your brand familiar to editors and recognisable to their readers. That familiarity is what turns a press release into a story a journalist wants to write.",
        },
        {
          title: "Strategy Included",
          body: "We help you identify news pegs, anticipate the US media calendar, and build a narrative arc. You're not just buying press releases — you're buying a media strategy.",
        },
      ],
      faqs: [
        {
          question: "What makes a story newsworthy for US media?",
          answer: "A clear news peg (launch, funding, award, partnership, cultural milestone), a named and quotable source, and genuine relevance to US readers. We'll tell you if your story needs development before it's ready to pitch.",
        },
        {
          question: "How quickly can you turn around a press release?",
          answer: "48–72 hours from brief completion. Expedited options are available for time-sensitive announcements.",
        },
        {
          question: "Which publications do you distribute to?",
          answer: "We distribute to a network of US digital news platforms and pitch to relevant journalists. We advise on editorial fit based on your story and audience — you have final say on targeting.",
        },
        {
          question: "Is the subscription flexible?",
          answer: "Starter is rolling month-to-month. Growth has a 3-month minimum. We recommend at least three months on any tier to see compounding results.",
        },
        {
          question: "Can I start on Starter and upgrade later?",
          answer: "Yes. Start on Starter to build your brand narrative and outreach rhythm, then upgrade to Growth when you have more news volume. Upgrade any time with 30 days notice.",
        },
        {
          question: "Do you work with brands based outside the US?",
          answer: "Yes. Black diaspora brands targeting the US market are welcome. Many of our clients are headquartered elsewhere and use MoveeePR US to build name recognition with American diaspora audiences specifically.",
        },
      ],
      ctaLabel: "Book a strategy call →",
      ctaSubtext: "Starter from $350/month. Growth from $650/month.",
    },

    events: {
      headline: "Diaspora Events Deserve More Than an Instagram Post",
      tagline: "Official media partnership for US events — pre-event build-up, live coverage, and post-event editorial for the Black diaspora.",
      intro: [
        "Afropunk Brooklyn. One Africa Music Fest. Essence Festival. The African Festival of the Arts. Diaspora events in New York, Atlanta, Houston, DC, and LA have built cultural institutions out of community — and community media is how those events reach the people who need to be there. The Moveee America Happenings partnership gives your event official media partner status, editorial build-up, live coverage, and a post-event write-up that becomes part of the permanent cultural record.",
        "We partner with events editorially. That selectivity is the reason our coverage carries weight with readers who've learned to trust our recommendations.",
        "Choose from single-day coverage, multi-day festival partnerships, a pre-event rollout campaign, or the full Cultural Institution Partner package for recurring events and institutions.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquiry & Assessment",
          body: "Submit your event details: date, city, audience, and what kind of partnership you're looking for. We assess editorial fit and confirm whether we can commit coverage resources.",
        },
        {
          step: "02",
          title: "Partnership Agreement",
          body: "We document deliverables: editorial pieces, social coverage, live presence, access requirements (press passes, interviews), and media badge usage. Clear expectations before we begin.",
        },
        {
          step: "03",
          title: "Pre-Event Editorial Build-Up",
          body: "Weeks before your event, we publish a feature on why it matters, send newsletter placement, and run social posts pointing our audience to ticketing. We build anticipation, not just awareness.",
        },
        {
          step: "04",
          title: "Live Coverage",
          body: "Our team attends. Real-time social content from the floor — performers, speakers, crowd energy, the moments that define the event. The coverage that makes people resolve to attend next year.",
        },
        {
          step: "05",
          title: "Post-Event Write-Up",
          body: "A longform editorial on what happened, why it mattered, and what it says about the state of diaspora culture. The permanent record of your event on The Moveee.",
        },
      ],
      benefits: [
        {
          title: "Official Media Partner Badge",
          body: "Use the Moveee America media partner badge in your marketing, sponsor decks, and press materials. It signals editorial endorsement from a respected Black diaspora media brand.",
        },
        {
          title: "Editorial Across Three Time Horizons",
          body: "Before, during, and after. Most events get a single moment of coverage. Ours get three distinct editorial touchpoints that build anticipation, document the event, and extend its cultural life.",
        },
        {
          title: "Diaspora Travel Is a Growing Market",
          body: "Black diaspora travel — heritage journeys, cultural tours, homeland visits — is a growing sector. Our Origins/Tours listing puts your experience in front of an audience actively looking for it.",
        },
        {
          title: "Commission-Aligned Travel Promotion",
          body: "We earn 12% on confirmed bookings. Our promotion is oriented toward conversion. The $60 quarterly listing fee maintains your directory presence between editorial pushes.",
        },
      ],
      faqs: [
        {
          question: "How far in advance should I reach out for an event partnership?",
          answer: "Minimum four weeks before the event date. For major events requiring extended build-up editorial, six to eight weeks is preferred.",
        },
        {
          question: "What kinds of events qualify for Happenings coverage?",
          answer: "Cultural festivals, music events, creative industry conferences, art exhibitions, film premieres, brand activations with genuine cultural programming, and community gatherings serving the Black and diaspora community in the US. Editorial fit is assessed on enquiry.",
        },
        {
          question: "Do you cover events outside New York?",
          answer: "Yes. We cover events in Atlanta, Houston, DC, and LA where editorial resource allows. Confirm your city at enquiry and we'll advise on attendance feasibility and alternative coverage options.",
        },
        {
          question: "Can I use The Moveee coverage in my own marketing?",
          answer: "Yes — link sharing, excerpt quoting, and media badge use are all permitted. Full text republication requires written permission.",
        },
      ],
      ctaLabel: "Enquire about event coverage →",
      ctaSubtext: "Events partnership by application. Minimum four weeks' notice required.",
    },

    travel: {
      headline: "Heritage Travel, Listed Where the Diaspora Already Looks.",
      tagline: "Commission-based listing and editorial coverage for cultural travel operators serving the Black diaspora across the United States.",
      intro: [
        "Black diaspora Americans are among the most active heritage travellers in the world. Homeland trips to Nigeria, Ghana, Jamaica, and Trinidad. Cultural pilgrimages for Afropunk, GTCO, or carnival season. Reconnection journeys built around family, food, and roots. The Moveee Origins US lists the experiences worth booking for an audience that travels with purpose — not just for leisure.",
        "The model works in two tiers. Start with a free Basic Listing — your tour in the Origins US directory with a tracked booking link and 12% commission on confirmed bookings. No upfront cost, no editorial required. When you're ready for more reach, upgrade to an Editorial Feature: a $180 flat fee gets you a full write-up, GetMeLit US newsletter promotion, and social distribution.",
        "We only list experiences we'd genuinely recommend to our readers — which is exactly why our listings convert.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Submit Your Experience",
          body: "Tell us about your tour — itinerary, target audience, price point, and available dates. We assess fit with our editorial standards and confirm listing eligibility within five working days.",
        },
        {
          step: "02",
          title: "We Write the Feature",
          body: "Our editorial team writes a feature on your experience — where it goes, what it means culturally, and why it's worth booking for a diaspora traveller. You review the facts before publication.",
        },
        {
          step: "03",
          title: "Listed, Promoted, Tracked",
          body: "Your experience goes live in the Origins US directory. A dedicated affiliate link tracks all bookings. You receive monthly booking reports and commission is invoiced quarterly.",
        },
      ],
      benefits: [
        {
          title: "The Right Audience",
          body: "GetMeLit US subscribers are Black diaspora professionals with disposable income who travel intentionally — homecomings, cultural trips, festival travel. They are your exact customer.",
        },
        {
          title: "Massive Underserved Market",
          body: "Diaspora travel to West Africa and the Caribbean is a multi-billion dollar market that mainstream US travel media largely ignores. The Moveee speaks directly to the people making those bookings.",
        },
        {
          title: "Zero Inventory Risk",
          body: "A flat $80 quarterly listing fee with 12% commission only on confirmed bookings. No upfront ad spend with uncertain returns.",
        },
        {
          title: "Editorial Credibility",
          body: "A Moveee Origins feature reads as editorial recommendation, not a paid listing. That distinction matters to diaspora travellers who are discerning about who they trust with a significant trip.",
        },
      ],
      faqs: [
        {
          question: "What kinds of experiences qualify?",
          answer: "Heritage tours to West Africa or the Caribbean, Afrobeats and carnival festival travel packages, roots tourism, diaspora homecoming trips, cultural city breaks, and immersive reconnection experiences. We assess editorial fit on enquiry.",
        },
        {
          question: "How does booking tracking work?",
          answer: "Through a unique affiliate link specific to your listing. Bookings traced to that link are confirmed via your booking platform, reported monthly, and commission of 12% is invoiced quarterly.",
        },
        {
          question: "Can I list multiple experiences?",
          answer: "Yes. Each experience is listed and featured separately, each with its own $80 quarterly listing fee and dedicated tracking link.",
        },
        {
          question: "Do I need to be US-based to list?",
          answer: "No. Tour operators based in Nigeria, Ghana, Jamaica, or anywhere else can list on Origins US as long as the experience serves diaspora travellers departing from or returning to the US.",
        },
      ],
      ctaLabel: "List your experience →",
      ctaSubtext: "Free Basic Listing available now. Editorial Feature by application.",
    },

    connect: {
      headline: "Access the Diaspora Community That Mainstream Doesn't Reach",
      tagline: "Quarterly community sponsorship for brands targeting Black diaspora professionals and creatives across the United States.",
      intro: [
        "Moveee Connect US is the community layer of The Moveee — a curated, semi-private space where Black diaspora creatives, entrepreneurs, professionals, and culture lovers gather across New York, Atlanta, Houston, DC, and Los Angeles. Not a passive social media audience. A self-selected community of people who actively sought this space out because they care about their culture.",
        "A quarterly sponsorship is trust-transferred access. You're introduced to the community by The Moveee team — in a context where the audience already trusts our editorial judgement. Your content has to be genuinely useful. Your member offer has to serve the people receiving it. In exchange, you reach an audience that mainstream US media rarely gets to accurately.",
        "$250 per quarter. One warm community introduction, one sponsored content slot, one exclusive member offer. For financial services, professional firms, technology companies, and brands that need to reach diaspora professionals — and can't find them through mainstream channels — this is the most direct route.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Enquire and Brief",
          body: "Tell us about your brand, your offer for the community, and your goals for the quarter. We assess editorial fit — we won't place a brand whose product or offer doesn't genuinely serve the community. Diaspora fintech, professional services, cultural brands, education providers, and event promoters typically fit well.",
        },
        {
          step: "02",
          title: "Community Introduction",
          body: "We write and post an introduction to the community — who you are, why we're working together this quarter, why we think you're relevant to Black diaspora professionals in the US. Our voice vouches for you. That's the whole point.",
        },
        {
          step: "03",
          title: "Your Sponsored Content Slot",
          body: "One piece of genuinely useful content. A remittance platform might share a guide to transfer fee comparisons. A legal firm might share what Nigerian American entrepreneurs need to know about US entity formation. A creative education platform might share a scholarship opportunity. Value-first, brand second.",
        },
        {
          step: "04",
          title: "Exclusive Member Offer",
          body: "An offer, discount, or experience available only to Moveee Connect US members. Creates reciprocity — the community feels rewarded, and you create real commercial action. Offer parameters are confirmed at briefing.",
        },
      ],
      benefits: [
        {
          title: "Trust Transfer, Not Interruption",
          body: "A warm introduction from The Moveee team is a fundamentally different starting point than a cold ad. The community trusts The Moveee. That trust extends — partially, conditionally — to brands we choose to introduce.",
        },
        {
          title: "A Highly Specific Audience That's Hard to Buy Elsewhere",
          body: "Black diaspora professionals in the US aren't a meaningful targeting category in mainstream US digital advertising. Moveee Connect is a direct channel to exactly these people.",
        },
        {
          title: "Buyers No Other Channel Gets Right",
          body: "Diaspora remittance and fintech, immigration legal services, African property for diaspora buyers, Nigerian and Caribbean food and lifestyle brands, cultural education, diversity-focused employers — the buyer profile for this community is unusually broad. All of them need this audience and none of them can easily buy it.",
        },
        {
          title: "Value-First Format That Builds Real Brand Memory",
          body: "The community knows your content slot has to earn its place. When it does — when it's genuinely useful — the brand memory it creates is much stronger than an ad impression. This is a relationship-building format, not an awareness format.",
        },
      ],
      faqs: [
        {
          question: "What is Moveee Connect US?",
          answer: "A curated, semi-private community — a moderated group on Telegram, Discord, or a similar platform — for Black diaspora creatives, entrepreneurs, and professionals across the United States. Membership is opt-in, focused on New York, Atlanta, Houston, DC, and LA.",
        },
        {
          question: "Who are the members?",
          answer: "Black diaspora creatives, entrepreneurs, and professionals — people who engage with The Moveee America and care enough about diaspora culture to join a dedicated community. Age range 20–40, career-building and brand-aware.",
        },
        {
          question: "What does the sponsored content slot look like?",
          answer: "One post to the community from your brand — written to serve community members first. We'll advise on format, review the content before it goes out, and make sure it fits the community's tone and expectations.",
        },
        {
          question: "What kinds of brands fit well?",
          answer: "Diaspora fintech and remittance, legal and professional services targeting Black professionals, US real estate or Nigerian/Caribbean property for diaspora buyers, cultural education and training, event promoters, diversity-focused recruiters, and lifestyle brands with genuine diaspora cultural relevance.",
        },
        {
          question: "Can I sponsor multiple markets?",
          answer: "Yes. Moveee Connect operates in Africa/Nigeria, the UK, and the US. Sponsoring multiple markets gives you cross-market reach at scale. Each market is priced independently per quarter.",
        },
        {
          question: "Can I renew quarter to quarter?",
          answer: "Yes, and renewal is encouraged. Consistent quarter-on-quarter presence builds real familiarity — you go from 'that brand The Moveee mentioned' to a recognisable, trusted fixture of the community. Renewal is offered before each new quarter.",
        },
      ],
      ctaLabel: "Apply for Connect sponsorship →",
      ctaSubtext: "$250 per quarter. Subject to editorial fit review.",
    },
    amplify: {
      headline: "Push Your Moveee Feature Further",
      tagline: "Paid social promotion, influencer reach, and ad placements — exclusively for content already published on The Moveee America.",
      intro: [
        "Content Amplification is an add-on service, not a standalone purchase. To use it, you need an active or recently published Sponsored Content feature or Media Partnership with The Moveee America. We don't amplify external content — only work published on our own platform.",
        "Once your feature is live, Amplify extends its reach through paid social ads targeting Black diaspora audiences across NYC, Atlanta, Houston, DC, and LA, plus influencer shares within our network and extended GetMeLit US newsletter distribution.",
        "The editorial feature is the foundation — Amplify is what gets the story in front of more of the right diaspora audience, faster than organic reach alone will manage.",
      ],
      howItWorks: [
        {
          step: "01",
          title: "Confirm Your Moveee Feature",
          body: "Amplify requires a live Sponsored Content feature or an active Media Partnership on The Moveee America. Share the link to your published piece when you enquire — we'll confirm eligibility within 24 hours.",
        },
        {
          step: "02",
          title: "Choose Your Amplify Tier",
          body: "Select Priority or Invested based on your reach objectives and budget. Each tier adds layers of paid social promotion, influencer distribution, and extended newsletter reach. We'll advise which tier fits your goals.",
        },
        {
          step: "03",
          title: "We Run the Campaign",
          body: "Our team sets up and manages the paid social campaign, coordinates influencer shares, and handles extended newsletter distribution. You get a brief report at the end of the campaign period.",
        },
      ],
      benefits: [
        {
          title: "Diaspora-Specific Targeting",
          body: "Every paid placement targets Black diaspora audiences across US cities — the same readership that already engages with The Moveee America. Precise, culturally specific, zero wasted spend.",
        },
        {
          title: "Editorial Credibility Behind Every Promotion",
          body: "Amplifying a Moveee feature carries more weight than a cold ad. Diaspora audiences trust editorial recommendations — promoting something they might have already read in The Moveee has a different response rate.",
        },
        {
          title: "Influencer Distribution in Diaspora Spaces",
          body: "Higher tiers include coordinated shares from influencers connected to our Black diaspora network — authentic voices, not unfamiliar sponsored accounts.",
        },
      ],
      faqs: [
        {
          question: "Can I buy Content Amplification without a Sponsored Content or Media Partnership package?",
          answer: "No. Content Amplification is exclusively available as an add-on to Sponsored Content or Media Partnership. The feature we amplify must be published on The Moveee America.",
        },
        {
          question: "Can I add Amplify after my feature has already gone live?",
          answer: "Yes, within 30 days of publication. Features older than 30 days are assessed on enquiry — reach us at hello@themoveee.com.",
        },
        {
          question: "What's the difference between the social posts in Sponsored Content and an Amplify campaign?",
          answer: "The social posts included in Sponsored Content are organic. Amplify adds a paid budget, audience targeting, influencer distribution, and extended newsletter reach — all of which organic posting alone cannot match.",
        },
      ],
      ctaLabel: "Enquire about Amplify →",
      ctaSubtext: "Requires an active Sponsored Content or Media Partnership package.",
    },
  },
};

export function getServicePage(market: string, slug: string): ServicePageContent | undefined {
  return SERVICE_PAGES[market]?.[slug];
}
