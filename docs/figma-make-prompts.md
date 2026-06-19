# Figma Make Prompts — Moveee Connect Mobile App
## Complete UI/UX Design System & Screen Prompts for iOS & Android

> **Important — Read First:**
> Figma Make generates **interactive React/TypeScript prototypes** (running code), not static Figma frames.
> It is a prompt-to-prototype tool — ideal for click-through testing and stakeholder demos.
>
> If your goal is **editable Figma design files** with native components (for design handoff),
> use **Figma First Draft / Figma Agent** instead and paste these same prompts there.
> Both tools live inside Figma — First Draft is in the Plugins/AI menu; Make is a separate canvas.
>
> This guide covers both workflows. The prompts work for either tool.

---

## TOOL CHOICE GUIDE

| Goal | Tool |
|------|------|
| Click-through prototype, stakeholder demo, code export | **Figma Make** |
| Editable design file, component library, design system | **Figma First Draft / Figma Agent** |
| Best of both | Generate with First Draft → link frames into a Make prototype |

**For this guide, all prompts are optimised for Figma Make (interactive prototypes).**
They follow Figma's recommended TC-EBC framework: **Task · Context · Elements · Behaviour · Constraints.**

---

## HOW TO USE THIS GUIDE

1. Open Figma → Click **"Make"** in the left sidebar (or Plugins → Figma AI → First Draft for editable frames)
2. **Start with the Design System prompt (Section 0).** Run it first, review, then move forward.
3. Work through screens **one section at a time** — paste each prompt block as a new Make session.
4. After generation, use **short targeted follow-up prompts** to refine (see Section 14).
5. The **point-and-edit tool** in Make lets you adjust individual elements without spending a prompt.

**Credit efficiency:** Each prompt costs Make credits. Detailed first prompts = fewer corrections needed.
Target: 1–3 screens per prompt, never 10+ at once.

---

## QUICK REFERENCE — MOVEEE CONNECT BRAND TOKENS

| Token | Value | Usage |
|-------|-------|-------|
| paper-warm | `#F3ECE0` | App background |
| paper | `#FFFFFF` | Card surfaces |
| paper-deep | `#F5F5F5` | Subtle card backgrounds |
| ink | `#14110D` | Primary text, icons |
| ink-soft | `#3A342B` | Body text |
| mute | `#7A6F5C` | Secondary text |
| ghost | `#C8BFB0` | Placeholders, borders |
| ochre | `#C5491F` | Primary CTA, actions |
| gold | `#B38238` | Pro tier only |
| success | `#2D6A4F` | Success states |
| error | `#C62828` | Error states |
| Headline font | Fraunces (serif) | Titles, display text |
| Body font | DM Sans | UI labels, body |
| Mono font | JetBrains Mono | Timestamps, codes, data |
| Base spacing | 4px | Grid unit |
| Card radius | 12px | Standard cards |
| Pill radius | 9999px | Tags, buttons, badges |
| Min touch target | 44×44px | All interactive elements |
| Horizontal margin | 16px | Content padding |
| Frame width | 390px | iPhone 14 Pro |

---

## 0. DESIGN SYSTEM FOUNDATION

*Run this prompt first. It establishes the token system referenced by all subsequent prompts.*

---

### PROMPT 0 — Global Design System

```
You are a senior mobile UX designer working on "Moveee Connect" — a premium cultural
community app for Black and African diaspora audiences worldwide. It combines a social
feed, cultural magazine, events, games, and a member dashboard with a points/perks economy.

Create a complete mobile design system foundation for this app. Platform: iOS and Android.
Base frame: 390px wide (iPhone 14 Pro). Design language: editorial, sophisticated, warm —
think a high-quality print magazine on mobile. Not corporate, not playful — culturally rich
and contemporary.

COLOR TOKENS (exact hex values — do not invent new colours):
Primary background: #F3ECE0 (paper-warm — warm off-white)
Card surface: #FFFFFF (paper — white cards on warm background)
Elevated surface: #F5F5F5 (paper-deep)
Community card bg: #EDF7ED (light green, for community posts only)
Primary text: #14110D (ink — near-black with warm undertone)
Body text: #3A342B (ink-soft)
Secondary text: #7A6F5C (mute)
Disabled/hint text: #C8BFB0 (ghost)
Primary action: #C5491F (ochre — warm terracotta-orange, NOT a generic red or orange)
Pro tier accent: #B38238 (gold — used ONLY for Connect Pro member UI)
Success: #2D6A4F
Error: #C62828
Warning: #E65100

TYPOGRAPHY:
Display/hero: Fraunces 36px, weight 700, line-height 1.15, tracking -0.5px
Display/title: Fraunces 28px, weight 700, line-height 1.2
Display/subtitle: Fraunces 22px, weight 400, line-height 1.3
Body/large: DM Sans 17px, weight 400, line-height 1.5
Body/medium: DM Sans 15px, weight 400, line-height 1.5
Body/small: DM Sans 13px, weight 400, line-height 1.4
Body/medium-bold: DM Sans 15px, weight 700
Body/small-bold: DM Sans 13px, weight 700
Label/eyebrow: DM Sans 9px, weight 700, letter-spacing 1.5px, ALL CAPS
Label/mono: JetBrains Mono 11px, weight 400
Label/mono-bold: JetBrains Mono 11px, weight 700

SPACING (4px base grid):
4, 8, 12, 16, 20, 24, 32, 40, 48, 64px

BORDER RADIUS:
2px (sm), 4px (md), 6px (lg), 12px (xl — standard cards), 20px (2xl — modals), 9999px (full — pills)

SHADOWS:
Card shadow: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)
Modal shadow: 0px 20px 60px rgba(20,17,13,0.18)
FAB shadow: 0px 4px 12px rgba(197,73,31,0.35)

MEMBERSHIP TIERS:
Connect Pro (patron): gold (#B38238) accent, star ★ icon, "CONNECT PRO" label
Connect Citizen (citizen): ghost (#C8BFB0) accent, "CONNECT CITIZEN" label

BADGE COLOURS (community post template types):
Hidden Gem: bg #FEF3C7, text #92400E
Cultural Take: bg #E0F2FE, text #075985
Food Review: bg #FCE7F3, text #9D174D
Creative Showcase: bg #F3E8FF, text #6B21A8
Itinerary: bg #D1FAE5, text #065F46
Poll: bg #EDE9FE, text #4C1D95
Event post: bg #FEE2E2, text #991B1B
Quote: bg #FEF3C7, text #78350F

FEED ITEM TYPE BADGES:
Pulse: bg #14110D, text #FFFFFF
Editorial: bg #F3ECE0, text #14110D
Happening: bg #EDE9FE, text #4C1D95
Directory: bg #EDF7ED, text #065F46
Quote: bg #FEF3C7, text #78350F

Generate a design system showcase screen at 390×844px showing:
1. All colour swatches labelled with name and hex value
2. Typography specimen with all styles applied to sample text
3. Spacing reference strip (4px to 64px labelled)
4. All badge types (template + feed type) as pill components
5. Shadow reference showing card, modal, and FAB elevation

The showcase should use the paper-warm background (#F3ECE0).
Do not invent any additional colours or type styles beyond those listed above.
```

---

## 1. CORE UI COMPONENTS

*Generate these before any screens — they will be reused throughout.*

---

### PROMPT 1A — Buttons, Inputs & Avatars

```
You are a senior mobile UX designer for Moveee Connect (cultural community app).
Brand: paper-warm bg #F3ECE0, ochre primary #C5491F, gold Pro tier #B38238,
ink text #14110D, DM Sans UI font, Fraunces display font.

Create a component showcase at 390×1600px showing all core UI components with their states.
Use paper-warm (#F3ECE0) background. Label every component and state clearly.

BUTTONS — show all 4 types × all states in a grid:
Type A — Primary: ochre fill (#C5491F), white DM Sans 15px bold text,
  52px height, radius-full (pill), 24px horizontal padding.
  States: Default | Loading (spinner replaces text, same bg) | Disabled (40% opacity) | Destructive (error #C62828 fill)
Type B — Secondary: white fill, ink 1px border, ink text. Same dimensions.
Type C — Ghost: no border, no fill, ochre text only. Same dimensions.
Type D — Icon Button: 40×40px circle, paper-deep fill, icon centred.

INPUTS — show 5 states:
Standard field: 52px height, radius-lg (6px), ghost border 1px, white fill.
DM Sans 15px ink text. Left icon area (16px icon, ghost colour). 16px horizontal padding.
States: Empty (placeholder visible, DM Sans 15px ghost) | Focused (ink border 1.5px) |
Filled (ink text) | Error (error border + 12px DM Sans error text below) | Disabled (50% opacity)
Also show: Textarea variant (120px min-height) + character counter (JetBrains Mono 11px mute, right-aligned below)

AVATARS — show 4 sizes × 3 variants:
Sizes: XS 24px, SM 32px, MD 44px, LG 64px, XL 96px
Variants: Default (photo placeholder), Initials fallback (ghost bg, ink 2-letter initials),
  Citizen (ghost 2px border ring), Pro (gold #B38238 2px border ring with subtle outer glow)

TIER BADGES — 2 variants:
CONNECT PRO: gold fill (#B38238), white DM Sans 9px bold uppercase, ★ star icon before text,
  4px vertical / 8px horizontal padding, radius-full
CONNECT CITIZEN: ghost fill, ink-soft text, same sizing

NOTIFICATION BELL — 2 states:
Clean: 24×24px bell outline icon, ink colour
Unread: ochre (#C5491F) circle badge top-right corner, 8px diameter, white "3" in 8px JetBrains Mono

REACTION BAR — show full component (horizontal, 44px height):
Left cluster: ❤️ Love (emoji + count 13px DM Sans mute) · 🔥 Fire · 👏 Clap (same style, 16px gaps)
Right: share icon (arrow-up-right, ghost colour)
Active/tapped state: Love count increments + turns error red, Fire → warning orange, Clap → success green

BOTTOM NAVIGATION BAR — full width, 2 platform variants:
iOS: 83px height (includes 34px home indicator padding), white fill, top ghost 1px border
Android: 64px height, white fill, top ghost 1px border
5 tabs: Connect (people icon) · Magazine (book icon) · Games (puzzle icon) · Events (calendar icon) · Me (person icon)
Active tab: icon + label in ochre. Inactive: icon + label in mute (DM Sans 11px labels).
Pro member variant: "Me" tab shows gold star-person icon.

All components should use exact hex values from the Moveee Connect design system.
No generic greys or blues — this brand has very specific warm neutral tones.
```

---

### PROMPT 1B — Feed Cards & Badge System

```
Senior mobile UX designer for Moveee Connect. Brand tokens:
ochre #C5491F, gold #B38238, paper-warm #F3ECE0, ink #14110D,
DM Sans (UI) + Fraunces (display) + JetBrains Mono (meta).

Create a feed card component showcase at 390×3200px.
Background: paper-warm #F3ECE0. All cards at 358px width (390 − 16px × 2 margins).

UNIVERSAL CARD RULE: every card — community, editorial, happening, quote, directory —
uses white #FFFFFF fill, radius-xl (12px), shadow-card
(0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04)),
16px horizontal margin. No separator-style cards anywhere. No bottom-border-only treatment.

Template badge pills: radius-full, DM Sans 9px bold uppercase, 4px vertical 10px horizontal padding.
Feed type badges: same pill style.
Reaction icons: outline only (not filled). Counts in JetBrains Mono 10px mute.

════════════════════════════════════════════
SECTION A — EDITORIAL & PULSE CARDS
════════════════════════════════════════════

CARD A1 — EDITORIAL (with hero image):
White card, shadow-card, radius-xl, 16px margin.
Top: full card-width image, 180px height, radius-xl top corners, object-fit cover.
Category badge overlaid bottom-left of image: "FASHION" — bg #fff0eb, text #c5491f, radius-full pill.
Below image (16px padding):
  Section label: "THE CULTURE BRIEF" JetBrains Mono 9px bold #C5491F uppercase, letter-spacing 0.1em.
  Headline: Fraunces 17px bold ink, 2 lines, line-height 1.2. 4px top.
  Excerpt: DM Sans 13px ink-soft, 2 lines. 4px top.
  Author row: 24px avatar circle + "Funmi Osei" DM Sans 12px bold + "· 6 min read" JetBrains Mono 10px ghost right.
  Reaction bar (12px top): outline icons ❤️ 24  🔥 9  👏 16  🔗 share icon right — JetBrains Mono 10px mute.

CARD A2 — EDITORIAL (text-only, no image):
White card, shadow-card, radius-xl.
16px padding all sides.
  Section label: "FROM THE EDITORS" JetBrains Mono 9px bold #C5491F, letter-spacing 0.1em.
  Headline: Fraunces 20px bold ink, 3 lines. 4px top.
  Excerpt: DM Sans 14px ink-soft, 2 lines. 6px top.
  Author row: 24px avatar + author name + read time. 8px top.
  Reaction bar: same as A1.

CARD A3 — PULSE / BREAKING (inline story with icon):
White card, shadow-card, radius-xl.
16px padding all sides.
  Left: "⚡" icon 20px in #C5491F, top-aligned.
  Right (12px left gap): all content.
  Type badge: "PULSE" — bg #14110D, text #FFFFFF, radius-full. + "· 30m ago" mono 10px ghost.
  Headline: DM Sans 16px bold ink, 2 lines. 4px top.
  Source: 🌐 "The Guardian" JetBrains Mono 11px ghost. 4px top.
  Reaction bar. 8px top.

════════════════════════════════════════════
SECTION B — COMMUNITY TEMPLATE CARDS
(All: white card, shadow-card, radius-xl, 16px margin, 16px padding)
════════════════════════════════════════════

CARD B1 — STANDARD POST:
AUTHOR ROW: 44px avatar (Citizen ghost border) + "Kemi Adeyemi" DM Sans 14px bold ink + "@kemi.a" 12px mute + "· 2h" mono right.
Section tag chip: "Music" — ink fill, white 11px DM Sans, radius-full, 28px height. 8px top.
Body: DM Sans 14px ink-soft, 3 lines. 8px top.
2-image grid: two equal images, 140px height, radius-md, 4px gap. 8px top. (Show photos attached to post.)
Hashtags: "#Lagos #LiveMusic" DM Sans 13px #C5491F. 4px top.
Reaction bar + comment count. 8px top.

CARD B2 — HIDDEN GEM:
AUTHOR ROW: 44px avatar (Pro gold border) + name + handle + CONNECT PRO badge + "· 3d" mono right.
Template badge: "💎 HIDDEN GEM" — bg rgba(179,130,56,0.10), text #B38238, radius-full.
Place name: Fraunces 16px bold ink. "Bisi Ceramics — Lagos Island" 4px top.
Location: 📍 "Balogun Market area" JetBrains Mono 11px ghost. 2px top.
Body: DM Sans 13px ink-soft, 2 lines. 6px top.
2-image grid: two equal images, 140px height, radius-md, 4px gap. 8px top.
Reaction bar + comment count.

CARD B3 — CULTURAL TAKE:
AUTHOR ROW: 44px avatar + name + handle + "· 5h" mono right.
Template badge: "🔥 CULTURAL TAKE" — bg rgba(107,72,168,0.08), text #6B48A8, radius-full.
Take statement: Fraunces 18px bold ink, 2 lines. "Streaming killed the African album format." 8px top.
Body: DM Sans 13px ink-soft, 2 lines. 6px top.
Reaction bar (prominent 🔥 count). ❤️ 91  🔥 67  👏 14  💬 43

CARD B4 — FOOD REVIEW:
AUTHOR ROW: 44px avatar (Pro) + name + CONNECT PRO badge + "· 1w" right.
Template badge: "🍽️ FOOD REVIEW" — bg rgba(197,73,31,0.08), text #C5491F, radius-full.
Restaurant: "Nok by Alara" Fraunces 16px bold ink + 📍 "Victoria Island" mono 11px ghost right. 6px top.
Image gallery strip: 3 images horizontal, 110px height each, radius-md, 4px gap. 8px top.
Ratings (3 rows, 8px gap):
  Each: label DM Sans 12px ink-soft (56px wide) + 5 stars (16px each, filled ochre / outline) + score JetBrains Mono 11px gold right.
  Taste ★★★★★ 5.0 · Value ★★★★☆ 4.0 · Vibe ★★★★★ 5.0
Reaction bar.

CARD B5 — CREATIVE SHOWCASE:
AUTHOR ROW: 44px avatar (Pro) + name + CONNECT PRO badge + "· 2w" right.
Template badge: "🎨 CREATIVE SHOWCASE" — bg rgba(25,118,210,0.08), text #1976D2, radius-full.
Work title: "Zaria Music Visuals — Vol. 2" Fraunces 16px bold ink. 6px top.
Medium chip: "Photography" ghost border pill, DM Sans 11px bold. 4px top.
Primary image: full card width, 200px, radius-md. Below: two equal thumbnails, 100px height, 4px gap.
"3 of 12 photos" JetBrains Mono 10px ghost centred. 4px top.
Reaction bar.

CARD B6 — POLL:
AUTHOR ROW: 44px avatar + name + "· Closes in 1d" JetBrains Mono 10px ghost right.
Template badge: "📊 POLL" — bg rgba(107,72,168,0.08), text #6B48A8, radius-full.
Poll question: DM Sans 15px bold ink, 2 lines. "What's the greatest era of Afrobeats?" 8px top.
4 option bars (each 44px, white fill, ghost border, radius-lg, 12px padding, 6px gap):
  Option text DM Sans 13px ink left + percentage JetBrains Mono 11px gold right.
  Filled bg: ochre 12% opacity from left edge (width = % of votes).
  Option B leading: slightly darker bar + "👑" emoji appended.
  A: 12%  B: 38% (leading)  C: 35%  D: 15%
"342 votes" JetBrains Mono 10px ghost left. "You voted: 2010s ✓" DM Sans 11px gold right. 6px top.
Reaction bar.

CARD B7 — ITINERARY:
AUTHOR ROW: 44px avatar + name + "· 4d" mono right.
Template badge: "🗺️ ITINERARY" — bg rgba(46,125,50,0.08), text #2E7D32, radius-full.
Trip title: Fraunces 16px bold ink. "48 Hours in Lagos: The Culture Route" 6px top.
Meta row: 🗂 "6 stops" · ⏱ "2 days" · 💰 "££" · ☀️ "Oct–Mar" — JetBrains Mono 10px ghost, 12px gap. 4px top.
3 stop rows (40px height each, ghost bottom border, 0 outer padding):
  Number bubble (20px circle, ghost border, mono 10px mute) + place name DM Sans 13px bold ink + "→ Directory" 12px ochre right.
  Stops: "1 Nike Art Gallery" · "2 Nok by Alara" · "3 Terra Kulture"
"+ 3 more stops" DM Sans 12px ochre link. 4px top.
Reaction bar.

CARD B8 — COMMUNITY EVENT:
AUTHOR ROW: 44px avatar + "Moveee Lagos" + "@moveee.lagos" + "· 2d" right.
Template badge: "📅 EVENT" — bg rgba(0,137,123,0.08), text #00695C, radius-full.
Event image: full card width, 160px, radius-md. 6px top.
Event name: Fraunces 16px bold ink. "Amapiano Night — The Jazz Cafe" 8px top.
Meta (2 rows): 📅 "Fri 20 Jun · 9PM" · 📍 "London" — DM Sans 13px mute, 14px icon ghost.
Pro perk strip: ★ "Pro members: early entry 8:30PM" DM Sans 12px gold. 4px top.
RSVP button: "RSVP Now" — ochre fill, white DM Sans 13px bold, radius-full, 36px height, right-aligned. 8px top.

CARD B9 — BOOK REVIEW:
AUTHOR ROW: 44px avatar (Citizen ghost border) + "Seun Adeyemi" DM Sans 14px bold + "@seun.reads" 12px mute + "· 3h" mono right.
Template badge: "📚 BOOK REVIEW" — bg rgba(120,53,15,0.08), text #78350F, radius-full. 6px top.
BOOK IDENTITY ROW (8px top, white bg, ghost border 1px, radius-md, 10px padding):
  Book cover: 36×48px, radius-sm, shadow-card, left.
  Right (10px gap): "Things Fall Apart" DM Sans 14px bold ink. "Chinua Achebe · 1958" DM Sans 12px mute. 2px top.
  Star row: ★★★★★ + "5.0" JetBrains Mono 12px gold. 2px top.
STATUS + RECOMMEND CHIPS (row, 8px top, 8px gap):
  "✓ Finished" — #2D6A4F fill, white DM Sans 11px bold, radius-full, 24px height.
  "👍 Recommended" — paper-warm bg, gold border, DM Sans 11px bold gold, radius-full.
REVIEW EXCERPT: DM Sans 13px ink-soft, 2 lines. 8px top.
  "Achebe dismantles the colonial narrative with the very language of the coloniser. Essential reading."
RATINGS ROW (3 of 4 shown inline, 8px top, 8px gap between items):
  "Writing ★★★★★" · "Story ★★★★★" · "Pacing ★★★★☆" — DM Sans 11px ink-soft + stars 13px each.
  (Condensed single-row preview — tap card to see full breakdown in sheet.)
Reaction bar. ❤️ 88  🔥 43  👏 55  💬 31

════════════════════════════════════════════
SECTION C — STANDALONE FEED CARDS
════════════════════════════════════════════

CARD C1 — QUOTE (curated feed card):
White card, shadow-card, radius-xl, 16px padding.
(No type badge — quote cards are visually self-evident.)
Decorative " mark: Fraunces 52px, #C8BFB0 (ghost warm), absolute top-left of card, 16px inset.
Quote text: Fraunces 18px bold ink, 3 lines, line-height 1.4, indented past " mark.
  "African culture doesn't need validation from the West. It needs infrastructure,
  documentation, and distribution. The rest will follow."
Author: "— Ngozi Adichie" DM Sans 13px ink-soft, 12px top.
Source: "Lagos Book & Art Festival · 2024" JetBrains Mono 10px ghost, 2px top.
Reaction bar: ❤️ 48  🔖 22  🔗 share — outline icons, JetBrains Mono 10px mute. 12px top.
(No reaction for 🔥 or 👏 — quote cards have Love, Bookmark, Share only.)

CARD C2 — DIRECTORY ENTRY (appearing in feed):
White card, shadow-card, radius-xl, 16px padding.
Type badge: "DIRECTORY" — bg #e8f5ee, text #085041, radius-full, 9px bold.
Entry image: full card width, 120px, radius-md. (Optional — some entries are text-only.) 8px top.
Entry name: Fraunces 16px bold ink. "Bisi Ceramics" 8px top.
Entry type chip: "STUDIO" JetBrains Mono 9px ghost border pill right of name.
City: "📍 Lagos, Nigeria" DM Sans 12px mute. 2px top.
Vetted badge (if partner): "✓ Vetted" — success green pill, DM Sans 9px bold white. 4px top.
Excerpt: DM Sans 13px ink-soft, 2 lines. 6px top.
"View entry →" DM Sans 13px ochre right-aligned. 8px top.

════════════════════════════════════════════
FOR YOU BADGE — show as a standalone component after the cards:
"✦ FOR YOU" — outline style only: #B38238 border 1px, #B38238 text, NO fill background.
radius-full, DM Sans 9px bold. Used on community cards when the For You feed mode is active.
Show it overlaid top-right on a copy of Card B1 to demonstrate placement.

Show each card in its own labelled section. All cards must use exact brand token values.
Total canvas: 390×3200px. Paper-warm background.
```

---

## 2. AUTHENTICATION FLOW

---

### PROMPT 2A — Splash & Onboarding (3 screens)

```
You are a senior mobile UX/UI designer. Create 4 sequential screens for the
Moveee Connect app onboarding flow. Platform: iOS mobile, 390×844px frames.

Brand: Fraunces serif for headlines, DM Sans for body, background paper-warm #F3ECE0,
primary ochre #C5491F, gold accent #B38238, ink #14110D. Editorial, sophisticated aesthetic.
No gradients except where specified. Warm off-white is the dominant tone.

SCREEN 1 — SPLASH SCREEN:
Full paper-warm (#F3ECE0) background, nothing else.
Centred vertically and horizontally:
— Wordmark: "moveee" in Fraunces 36px bold ink (#14110D), letter-spacing -1px
— Below wordmark 4px gap: "connect" in DM Sans 10px bold gold (#B38238) uppercase, 2px letter-spacing
— Below both: thin ochre (#C5491F) line, 40px wide, 2px height, centred
— 40px below line: ochre circular spinner animation ring (32px diameter, 2px stroke, 270° arc)
— "Loading" in JetBrains Mono 10px mute, centred, 8px below spinner

SCREEN 2 — ONBOARDING: "Your cultural home."
Top 55%: editorial collage image area (full-width, richly coloured — suggest a warm mosaic
  of terracotta, deep brown, and ochre geometric patterns, African textile-inspired)
Bottom 45%: white card with radius-2xl top-only corners (20px), padding 32px:
— "Your cultural home." — Fraunces 30px bold ink (#14110D), left-aligned
— "Discover, connect and create with people who share your cultural vision." — 
  DM Sans 15px ink-soft, left-aligned, max-width 300px, 8px top margin
— Progress dots row (24px top margin): 3 dots, 
  active = ochre filled 8px circle, inactive = ghost 6px circle. Radius-full each.
— "Get started" — primary button, full width, ochre fill, pill, 52px height (24px top margin)
— "Already a member? Sign in" — DM Sans 13px mute, centred, "Sign in" underlined, 16px top margin

SCREEN 3 — ONBOARDING: "Built for your world."
Top 52%: 2-column grid of 6 mini feed card thumbnails with colourful placeholder images,
  each showing a type badge label (EDITORIAL, HAPPENING, HIDDEN GEM, PULSE, QUOTE, POLL)
  Cards: white fill, radius-lg, shadow-card. 4px gap between cards. Edge-to-edge layout.
Bottom 48%: same white card structure as screen 2:
— "Built for your world." — Fraunces 30px bold ink
— "Magazine stories, community posts, events, games — all in one place." — DM Sans 15px ink-soft
— Progress dots (dot 2 active)
— "Continue" primary ochre button
— "Skip" ghost button (no fill, no border, ochre text) below with 12px gap

SCREEN 4 — ONBOARDING: "Earn as you create."
Top 48%: paper-warm background with floating UI illustration:
  — Central circle 80px: ink fill, white "C" Fraunces 36px bold centred
  — Surrounding it: 4 floating badge chips at 12/3/6/9 o'clock positions:
    "+10 CR" "+30 CR" "🏆 Badge" "+50 CR" — each: gold fill pill chip, white DM Sans 12px bold
  — Connecting lines (ochre dashed, 1px) from badges to central circle
  — Background: subtle concentric circle rings (ghost, 1px, paper-warm)
Bottom 52%: white card:
— "Earn as you create." — Fraunces 30px bold ink
— "Post, engage, and earn Culture Points™ redeemable for real-world perks and cash." — DM Sans 15px ink-soft
— Progress dots (dot 3 active)
— "Create my account" primary button (ochre)
— "Sign in instead" ghost button

Output all 4 frames in a horizontal row, 32px gap between them. Label each frame.
Do not use stock photo placeholders — use coloured shapes and patterns.
Strictly use only the brand colours specified above.
```

---

### PROMPT 2B — Login & Register Screens

```
Senior mobile UX/UI designer — Moveee Connect app. iOS, 390×844px.
Brand: paper-warm bg #F3ECE0, ochre #C5491F, ink #14110D, DM Sans UI font, Fraunces display font.
Ghost border colour: #C8BFB0. Card bg: white #FFFFFF. Mute text: #7A6F5C.

Create 5 frames: Login Default, Login Error, Login Loading, Register Default, Verify Email.

FRAME 1 — LOGIN DEFAULT:
Background: paper-warm (#F3ECE0)
Status bar: standard iOS, 59px, ink icons

TOP HEADER AREA (centred, 120px from top):
"moveee" Fraunces 22px bold ink + 3px below "connect" DM Sans 9px bold gold uppercase letter-spacing 2px
Ochre line decoration: 32px wide, 2px height, centred, 8px below text

FORM AREA (starts 40px below header, 32px horizontal padding):
"Welcome back." — Fraunces 26px bold ink, left-aligned
"Sign in to your Moveee account." — DM Sans 14px mute, 4px below, left-aligned

24px gap, then input fields:
Email input: 52px height, white fill, ghost 1px border, radius-lg (6px), 16px padding.
  Left: mail icon 16px mute. Placeholder: "you@example.com" DM Sans 14px ghost.
  Label above: "Email address" DM Sans 11px mute, 4px gap.
Password input: same style. Left: lock icon. Right: eye icon (toggle).
  Label: "Password".
"Forgot password?" — right-aligned DM Sans 12px ochre link, 8px below password field.

24px gap:
"Sign in" — primary button, full width, ochre fill (#C5491F), pill (radius-full), 52px height,
  white DM Sans 15px bold text.

OR divider: thin ghost line + "or" centred label DM Sans 12px mute, 20px vertical margin.

"Continue with passkey" — 52px height, white fill, ink 1px border, radius-full, 16px padding.
  Left: fingerprint icon 20px ink. DM Sans 14px ink text centred.

Bottom (fixed to safe area): "Don't have an account? Create one" DM Sans 13px mute centred,
  "Create one" in ochre, underlined.

FRAME 2 — LOGIN ERROR STATE:
Same as default. Changes:
— Email field: error border (#C62828, 1.5px), red fill tint (very subtle #FEF2F2)
— Below email field: "Incorrect email or password. Please try again." DM Sans 12px error red, left-aligned, 4px gap
— Sign in button: remains active state

FRAME 3 — LOGIN LOADING STATE:
Same as default. Changes:
— Sign in button: ochre fill, shows white circular spinner (20px, 2px stroke) centred instead of text
— Email and password inputs: ghost border maintained, no disabled state on inputs
— "Forgot password?" and passkey button: 50% opacity

FRAME 4 — REGISTER DEFAULT:
Background: paper-warm. Same header as Login.
Back chevron left of header (ink, 44×44px tap target).
"Create your account." — Fraunces 26px bold ink
"Just three fields to get started." — DM Sans 14px mute

Inputs (24px gap):
Email: same style as login
Username: left: "@" character DM Sans 14px ink-soft (not an icon, actual @ sign).
  Below field (4px gap): "Letters, numbers and underscores only" JetBrains Mono 10px ghost, left-aligned.
Password:
  Below field: password strength bar (full width, 8px height, radius-full, 4-segment):
  Strength 0: all segments ghost. Strength 1: 1 segment error red. Strength 2: 2 segments warning. 
  Strength 3: 3 segments gold. Strength 4: all 4 segments success green.
  Label right: "Weak" / "Fair" / "Strong" / "Very strong" — DM Sans 11px matching segment colour.

Requirements checklist (shows once user starts typing password):
4 items with dot icons (✓ green when met, ○ ghost when not):
"At least 8 characters" · "One uppercase letter" · "One number" · "One special character"
DM Sans 12px, 4px line gap, 12px top margin below strength bar.

"Create account" primary ochre button (52px height, full width, pill).
Disabled state: 40% opacity when fields not valid.

Terms line (centred, below button): "By creating an account you agree to our Terms & Privacy Policy"
DM Sans 10px mute. "Terms" and "Privacy Policy" in ochre.
"Already have an account? Sign in" centred, bottom safe area.

FRAME 5 — VERIFY EMAIL:
Background: paper-warm. No back button.
Content centred vertically:
Large envelope icon (72×72px area): ochre outline stroke style envelope illustration,
  small ochre star badge (+4px) overlapping top-right corner.
"Check your inbox." — Fraunces 26px bold ink, centred, 24px top margin.
"We've sent a verification link to:" DM Sans 14px mute, centred, 8px below.
Email chip: "you@example.com" DM Sans 14px bold ink, ghost border 1px pill, centred, 12px padding.
"Click the link to continue setting up your profile. The link expires in 24 hours."
DM Sans 13px mute, centred, max-width 280px, 20px top margin.
"Resend email" — secondary button (ink border, pill, 48px height, full width 280px max), 24px below text.
"Sign in with a different account" — ghost link DM Sans 12px mute centred, bottom area.

Output all 5 frames in a 2-3 grid layout. Label each clearly.
```

---

## 3. CONNECT FEED (Main Home Screen)

---

### PROMPT 3 — Connect Feed Screen

```
Senior mobile UX/UI designer — Moveee Connect. Platform iOS, 390×844px.
Brand: paper-warm bg #F3ECE0, cards white #FFFFFF, ochre #C5491F, ink #14110D,
DM Sans 15px body, Fraunces display, JetBrains Mono data/timestamps.

Design the Connect Feed — the main social screen showing a unified feed of cultural
content: news articles, community posts, events, quotes, and directory items.

Generate 2 frames: Default State and "For You" State (personalised ranking active).

HEADER (white bg, shadow-card, 64px including status bar):
Left: "moveee" Fraunces 16px bold ink + "connect" DM Sans 8px bold gold uppercase, 3px below
Right: notification bell icon (24px ink) with ochre unread badge "3" + 
  ochre filled circle (32px, white + icon) for new post

FILTER ROW (white bg, 52px height, horizontally scrollable):
First pill: "✦ For You" — when active: ochre fill #C5491F white DM Sans 13px bold pill.
  When inactive: ghost border ink-soft text.
Then category filter pills (inactive state): All · Music · Film · Art · Fashion · Food · Tech · Sport · Travel · Design · Literature
Pills: 32px height, radius-full, 10px horizontal padding, 8px gap. DM Sans 13px bold.

FRAME 1 — DEFAULT STATE (newest-first feed, For You pill = inactive):
Show 4 different card types in the feed:

CARD 1 (Editorial): bottom-border separator card, no shadow, 16px horizontal padding:
Badge "EDITORIAL" (bg #F3ECE0 border ink) + "· 4h ago" JetBrains Mono 11px mute right
Headline: "The New Wave of Lagos Street Style Taking Over Global Fashion" DM Sans 16px bold ink 2 lines
Excerpt: "From Tejuosho to Tokyo, a generation of Lagos designers is rewriting..." DM Sans 13px ink-soft 2 lines
Image: full-width 16:9, radius-md
Source: "📰 Vogue Africa" JetBrains Mono 11px mute
Reaction bar: ❤️ 234 · 🔥 89 · 👏 145 + share icon

CARD 2 (Community — Hidden Gem): white card, shadow-card, radius-xl 12px, 16px margin:
Author: Avatar MD (44px, citizen border) + "Kemi Adeyemi" bold + "@kemiad" mute + CONNECT CITIZEN badge + "· 5h" mono
Template badge: "💎 HIDDEN GEM" (bg #FEF3C7 text #92400E)
Location: "📍 Peckham, London" JetBrains Mono 11px mute
Content: "Finally found the dopest vinyl shop in South London. If you know you know 🎵"
2-image grid (equal width, square, radius-md, 4px gap)
Star rating: 4 ochre stars + 1 empty + "4/5" JetBrains Mono 11px gold
Reaction bar + "12 💬"

CARD 3 (Happening) — superseded by Prompt 3B's spotlight carousel; kept here for
historical reference only. Same full-width separator style:
Badge "HAPPENING" (bg #EDE9FE text #4C1D95) + "· Tonight"
Event image 16:9, top-right overlay: "⭐ PRO" gold small badge
"Amapiano Night at Jazz Cafe" DM Sans 16px bold ink
"📅 Fri 13 Jun · 9PM · 📍 Camden, London" DM Sans 13px mute (on 2 lines)
"Free · Limited spots" + "RSVP →" small ochre ghost pill button right

CARD 4 (Quote): paper-warm fill card, no shadow:
Large decorative " (double quote mark): Fraunces 72px gold #B38238 15% opacity background element
Quote: Fraunces 20px italic ink: "The world doesn't need another copycat. It needs you, 
fully and specifically yourself." — centred on top of decorative mark
"— Chimamanda Ngozi Adichie" DM Sans 13px mute
"We Do This 'Til We Free Us" JetBrains Mono 10px ghost
Reaction bar

Floating pencil FAB: 56×56px ochre circle (shadow-fab), white ✏️ pencil 24px icon.
Position: bottom-right, 16px from edge, 16px above bottom nav.

Bottom navigation: Connect tab active (ochre). iOS variant with 83px height.

FRAME 2 — "FOR YOU" STATE (For You pill = active, ochre fill):
Add TRENDING STRIP between filter row and feed:
Row header: "Trending now" DM Sans 9px bold uppercase ochre, 16px padding
Horizontal scroll of 3 trending mini-cards (160×80px each):
  Image fill with gradient (bottom 50% ink to transparent)
  Type badge top-left (small pill, 9px DM Sans)
  Title 2 lines DM Sans 12px bold white, bottom-left
4px gap between mini-cards, 16px start padding

Feed is same content but with "✦ For You" label on matching-interest cards:
Community card gains a small "✦ For You" badge: ochre bg, white DM Sans 9px bold, top-right of card.

Add PULL TO REFRESH STATE annotation on Frame 1:
Show ochre spinner at top of feed area + "Refreshing..." JetBrains Mono 10px mute below.
```

---

### PROMPT 3B — Happenings Spotlight Carousel (replaces inline Happening cards)

```
Senior mobile UX/UI designer — Moveee Connect feed. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D,
ghost #C8BFB0, mute #7A6F5C, success #2D6A4F. DM Sans + Fraunces + JetBrains Mono.

CONTEXT FOR THE DESIGNER: Today, "Happening" (event) items appear as regular inline
cards mixed in with posts/articles/quotes (see Prompt 3, Card 3). They get lost in the
scroll. This prompt replaces that inline treatment with a single horizontal spotlight
module — "Upcoming Near You" — inserted once into the feed, after the 4th–5th item, never
repeated again on the same feed load. Plain Happening cards are removed from the normal
inline stream entirely; this carousel is now the only place events surface in-feed (the
full Events tab is unaffected and keeps its own list/calendar views — see Prompt 6B).

The carousel pools events from TWO sources and ranks them together as one list — it does
NOT separate "official" vs "community" rails, and it does NOT treat AI-seeded official
events as inherently more trustworthy than community-submitted ones (our Happenings are
AI-seeded, not editorially curated, so they get no automatic trust bonus). Both sources
are scored by the same signals: a manual "featured" flag, listing completeness (image +
venue + date + price all present), RSVP/attendee count, and — for community submissions
only — whether the organiser is linked to a verified Directory entry rather than free text.
Events missing 2+ of: image, venue, price get filtered out of the carousel entirely (they
can still exist on the full Events tab, just not spotlighted).

⚠️ DEV ANNOTATION REQUIREMENT — IMPORTANT FOR HANDOFF:
This screen wires up data from two different post types and a ranking formula that does
not fully exist in the API yet. When generating the code, add inline HTML/JSX comments
at the exact points listed below so the engineer wiring this up doesn't have to guess.
Use this format for each: <!-- DEV: <note> --> in HTML, or {/* DEV: <note> */} in JSX.
Place these comments directly above the relevant component/element — do not put them all
in one block at the top of the file.

  1. Above the carousel container:
     "DEV: Source = merge of culture_event CPT (getEventsWithFallback) + community posts
     where templateType==='event' (getCommunityPosts). These are two separate fetch calls
     today — merge client-side until a unified backend endpoint exists."
  2. Above the ranking/sort logic (even if mocked with static order in this prototype):
     "DEV: Rank by score = isFeatured(40) + completeness(0-30) + rsvpCount(0-20, log scale)
     + organiserIsDirectoryLinked(10). isFeatured (_culture_is_featured) and rsvpCount are
     NOT currently exposed on FeedItem — backend gap, see unified-feed.ts. Until wired,
     fall back to soonest-upcoming-first sort."
  3. Above the filter that drops incomplete listings:
     "DEV: Hide any event missing 2+ of {image, venue, price/admission} — compute from
     existing FeedItem fields (venueAddress/location, admission), no backend change needed
     for this part."
  4. Above the insertion-point logic in the parent feed list:
     "DEV: Insert this module once, after the 5th feed item, on initial load only — do not
     re-insert on pagination/infinite scroll. Track via a boolean ref, not state, to avoid
     re-render loops."
  5. Above the "See all events" CTA:
     "DEV: Routes to the Events tab (Prompt 6B Timeline View), not a new screen."
  6. Above each event mini-card:
     "DEV: Tapping opens the existing Event Detail screen/sheet — no new detail UI needed
     here, reuse what Prompt 6/6B Frame 2 already defines."

---

FRAME 1 — FEED WITH SPOTLIGHT CAROUSEL INSERTED:

Show a vertical slice of the feed: 2 ordinary cards (editorial + community post, condensed/
greyed slightly to indicate "context only, not the focus of this frame") — then the
SPOTLIGHT MODULE — then 1 more ordinary card below it.

SPOTLIGHT MODULE (full-bleed width, paper-deep bg #F5F0E6 — a half-step darker than the
page bg so it visually separates from the feed without using a hard border, 16px vertical
padding):

  HEADER ROW (16px horizontal padding, 12px bottom):
    Left: "📅 Upcoming Near You" DM Sans 14px bold ink.
    Right: "See all →" DM Sans 12px bold ochre.

  HORIZONTAL SCROLL ROW (16px left padding, 12px gap between cards, last card partially
  visible to hint scrollability):

    SPOTLIGHT EVENT CARD (236px wide, white fill, radius-xl, shadow-card, no image at this
    size — text-forward, matches the "no large images until opened" principle used in
    Prompt 6B):
      Top row (12px padding, 12px horizontal): category dot (6px, category colour per
        Prompt 6B's colour table) + category label DM Sans 10px bold mute uppercase +
        FEATURED star (★, gold, only if isFeatured) right-aligned.
      DATE BADGE (inline, 8px top): "FRI 13 JUN" JetBrains Mono 11px bold ochre uppercase +
        "9:00 PM" DM Sans 11px mute, same row.
      Title: "Amapiano Night at Jazz Cafe" DM Sans 15px bold ink, 2 lines max, 6px top.
      Venue: "📍 Jazz Cafe, Camden" DM Sans 12px mute, 4px top.
      Bottom row (10px top, ghost top border, 8px top padding):
        Price "Free" or "£15" DM Sans 12px ink-soft left.
        Attendance "👥 47 going" DM Sans 11px mute right (omit this element entirely if
          rsvpCount is unavailable — do not show a fake/zero count).
      COMMUNITY-SUBMITTED badge (only on community-sourced cards, small, bottom-left under
        the price row): "🌱 Community" DM Sans 9px bold #2D6A4F, pale green bg, radius-full,
        16px height — signals provenance without implying lower quality.

    Show 4 spotlight cards: 2 unbadged (pooled/ranked normally), 1 with the FEATURED star,
    1 with the "🌱 Community" badge — to demonstrate all states in one frame.

  EMPTY/FALLBACK STATE (annotate separately, small inset note below the frame): "If fewer
  than 2 qualifying events exist, hide the entire module for that feed load — do not show
  a single lonely card or an empty carousel."

---

FRAME 2 — SPOTLIGHT EVENT CARD STATES (component sheet, isolated):
Show the same 236px card 4 times side by side, labelled below each:
  "Default" · "Featured (★ + gold top border accent, 2px)" · "Community-sourced (🌱 badge)" ·
  "Free vs Paid price styling (ink-soft vs ochre-bold for paid)"

Output 2 frames stacked vertically: Frame 1 (in-feed context), Frame 2 (component states).
```

---

## 4. POST COMPOSER & TEMPLATE PICKER

---

### PROMPT 4A — Template Picker Sheet

```
Senior mobile UX/UI designer — Moveee Connect new post template picker. iOS, 390×844px.
Brand: white bg, paper-warm #F3ECE0 accents, ochre #C5491F, gold #B38238, ink #14110D.
DM Sans (UI) + Fraunces (display) + JetBrains Mono (meta).

Design 2 frames — the bottom sheet that appears when a user taps the compose (+) button
on the Connect Feed. The picker replaces the old in-composer horizontal template scroll strip.

════════════════════════════════════════════
BOTTOM SHEET STRUCTURE (both frames):
  White surface, radius-2xl top corners (20px), shadow 0 -4px 32px rgba(20,17,13,0.18).
  Drag handle: 4×28px rounded pill, #C8BFB0, centred, 8px from top.
  Sheet height: ~76% of viewport (content-driven, enough for 5-row grid + header).
  Scrim beneath: rgba(20,17,13,0.40).

SHEET HEADER (16px horizontal padding, 20px from top under drag handle):
  "New Post" DM Sans 17px bold ink left.
  × close button — 36px circle, paper-warm bg, DM Sans 16px ink centred — top-right.

SUBTITLE: "Choose a format" DM Sans 13px mute, 4px below header.

TEMPLATE GRID (2-column, 12px gap, 16px horizontal padding, 16px top):
  10 template cards arranged in 5 rows × 2 columns.
  Each card: white fill, radius-xl (12px), 1px ghost border, 12px padding, auto height.
  Card interior (vertical layout, 8px gap):
    EMOJI CIRCLE: 40px × 40px, radius-full, paper-warm #F3ECE0 fill. Emoji 20px centred.
    TEMPLATE NAME: DM Sans 14px bold ink.
    TEMPLATE DESC: DM Sans 12px mute, 2-line max (line-height 1.4), wraps naturally.

TEMPLATES (row order, top to bottom):
  Row 1: ✏️ Post — "Share a thought, opinion, or moment"
          💎 Hidden Gem — "Recommend a place worth knowing"
  Row 2: 🔥 Cultural Take — "Drop a hot take and defend it"
          🍽️ Food Review — "Review a dish or restaurant"
  Row 3: 🎨 Creative Showcase — "Show your creative work"
          📚 Book Review — "Review a book with ratings"
  Row 4: 📊 Poll — "Ask the community to vote"
          🗺️ Itinerary — "Share a cultural route or trip"
  Row 5: 📅 Event — "Post an event for the community"
          ❝ Quote — "Share a quote that moved you"

════════════════════════════════════════════
FRAME 1 — DEFAULT STATE (no selection)
════════════════════════════════════════════
All 10 cards in default state: white fill, ghost border, no highlight.

════════════════════════════════════════════
FRAME 2 — "HIDDEN GEM" SELECTED (pressed/highlight state)
════════════════════════════════════════════
"Hidden Gem" card shows selected state:
  Paper-warm #F3ECE0 fill (not white).
  #C5491F border (1.5px, ochre).
  Template name DM Sans 14px bold #C5491F (ochre, not ink).
  Emoji circle border: #C5491F 1.5px ring.
All other 9 cards remain in default white state.

Output 2 frames side by side. Label each below in JetBrains Mono 11px mute:
  "Default — choose a format" · "Hidden Gem selected"
```

---

### PROMPT 4B — Post Composer (All 10 Templates)

```
Senior mobile UX/UI designer — Moveee Connect new post composer. iOS, 390×844px.
Brand: white bg, paper-warm #F3ECE0 accents, ochre #C5491F, gold #B38238, ink #14110D.
DM Sans (UI) + Fraunces (display) + JetBrains Mono (meta).

Design 10 frames — one per post template. Each frame shows the composer in a partially-filled
state for that template so all unique fields are visible.

NOTE: There is NO horizontal template scroll strip in any frame. Users pick the template
from the picker sheet (Prompt 4A) BEFORE reaching the composer. The only template UI
inside the composer is the template indicator row described below.

════════════════════════════════════════════
SHARED HEADER (identical on all 10 frames):
  White fill, 56px, ghost bottom border.
  "Cancel" DM Sans 14px ochre left (44px tap target).
  Title centred: the template name, DM Sans 15px bold ink
    (e.g. "New Post", "New Hidden Gem", "New Food Review", etc.)
  "Post" DM Sans 14px bold ochre right (disabled/greyed until content filled).

TEMPLATE INDICATOR ROW (36px, paper-warm #F3ECE0 bg, ghost bottom border):
  Left: emoji (16px) + template name DM Sans 13px bold #B38238 (gold) — e.g. "💎 Hidden Gem"
  Right: "Change format" DM Sans 12px #C5491F ochre — tapping returns user to Prompt 4A picker sheet.
  16px horizontal padding.

SHARED MEDIA TOOLBAR (pinned above keyboard, 48px, ghost top border, white bg):
  Left: 📷 · 📎 · 📍 · 😊 · @ — each 24px icon, ghost mute, 16px padding, 16px gap.
  Right: character remaining count JetBrains Mono 11px mute.

MULTI-IMAGE UPLOAD PATTERN (used by Standard Post, Hidden Gem, Food Review, Itinerary, Event):
  Label "Photos (optional)" DM Sans 11px bold mute.
  Upload row (horizontal scroll, 80px height, 8px gap):
    ADD tile (80×80px, dashed ghost border 1.5px, radius-lg):
      📷 icon 20px ghost centred + "Add" DM Sans 10px mute below.
    ADDED IMAGE tiles (80×80px each, radius-lg, object-fit cover):
      Each has ✕ remove button — 18px circle, white fill, ink ×, top-right corner.
    Show 2–3 added images + the ADD tile in the row to demonstrate multi-select.
  Below row: "Up to 4 photos" DM Sans 11px ghost mute.

All text inputs: white bg, ghost border 1px, radius-lg, DM Sans 14–15px ink, 16px horizontal padding.
All field labels: DM Sans 11px bold mute, displayed above each input.
All section dividers: ghost rule 1px #EEE8DF.
════════════════════════════════════════════

════════════════════════════════════════════
FRAME 1 — STANDARD POST
════════════════════════════════════════════
Header title: "New Post"
Template indicator row: ✏️ "Post" gold left · "Change format" ochre right.

SECTION TAGS (horizontal scroll, 40px height, 16px padding):
  Active: "Music" — ink fill, white DM Sans 11px bold, radius-full, 28px.
  Inactive: "Film" · "Art" · "Fashion" · "Food" — ghost border, ink-soft.

GUIDE CHIPS row (3 chips, 8px gap):
  "🎵 What I'm listening to" · "🎬 Film reaction" · "✨ Discovery"
  Paper-warm bg, radius-full, DM Sans 12px ink-soft, 8px vertical 12px horizontal padding.

MAIN TEXTAREA (no border, 16px padding, 200px min height):
  Filled text (DM Sans 15px ink):
  "Saw Tems perform at an intimate venue last night and I'm still not over it. She didn't say a
  word between songs — just let the music breathe. The crowd was completely silent."
  Character counter: "184 / 1000" JetBrains Mono 11px mute, bottom-right of textarea.

MULTI-IMAGE UPLOAD. [Use shared pattern. Show 2 images added + ADD tile.]

MEDIA TOOLBAR. [Shared layout.]

════════════════════════════════════════════
FRAME 2 — HIDDEN GEM
════════════════════════════════════════════
Header title: "New Hidden Gem"
Template indicator row: 💎 "Hidden Gem" gold left · "Change format" ochre right.

PLACE NAME input (48px): Label "Place name *" · Filled: "Bisi Ceramics Studio"

LOCATION input (48px): Label "Location" · 📍 left icon · Filled: "Balogun Market area · Lagos Island"

DIRECTORY LINK (40px row):
  "Link this place in the Directory" DM Sans 13px mute.
  Search input (40px, ghost border, 🔍 left): "Bisi Ceramics" filled.
  Matched chip below: 🗂 "Bisi Ceramics · Lagos" DM Sans 13px ink + ✕ remove right.

DESCRIPTION TEXTAREA (120px min):
  Label "Tell us about it *"
  Filled: "Tucked behind Balogun Market — ceramics studio using Ondo-state clay. Afternoon workshops
  (₦8,000, 3hrs) worth every minute."

STAR RATING row (optional, 36px):
  Label "Rating (optional)" · 5 stars (20px, outline ghost) · "Tap to rate" DM Sans 12px ghost.

PRICE RANGE CHIPS (row, 32px, 8px gap):
  Label "Price range (optional)"
  4 chips: ₦ · ₦₦ · ₦₦₦ (active, ink fill white) · ₦₦₦₦ — radius-full, DM Sans 12px.

OPENING HOURS input (48px, optional):
  Label "Opening hours (optional)" · 🕐 left icon · Placeholder "e.g. Tues–Sat, 10am–6pm"

MULTI-IMAGE UPLOAD. [Use shared pattern. Show 3 images added (venue exterior, interior, product) + ADD tile.]

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 3 — CULTURAL TAKE
════════════════════════════════════════════
Header title: "New Cultural Take"
Template indicator row: 🔥 "Cultural Take" gold left · "Change format" ochre right.

TAKE INPUT (80px min, no border, Fraunces 20px bold ink placeholder style):
  Label "Your take *"
  Filled (Fraunces 20px bold ink):
  "Streaming killed the African album as an art form."

ARGUMENT TEXTAREA (200px min):
  Label "Explain your take *"
  Filled (DM Sans 14px ink):
  "We've spent a decade celebrating Afrobeats going global. But look at what's actually being
  released: endless singles, loosely stitched 'albums' built for playlists. Fela never needed a
  playlist algorithm. We're losing narrative depth and calling it progress."

SECTION TAGS row (horizontal scroll, same as Standard Post):
  Active: "Music" · Inactive: "Culture" · "Film" · "Ideas"

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 4 — FOOD REVIEW
════════════════════════════════════════════
Header title: "New Food Review"
Template indicator row: 🍽️ "Food Review" gold left · "Change format" ochre right.

DISH NAME input (48px): Label "Dish / Item *" · Filled: "Suya Platter for Two"

RESTAURANT LINK:
  Label "Restaurant or venue"
  Search input (40px, 🔍): "Nok by Alara" filled.
  Matched chip: 🗂 "Nok by Alara · Victoria Island" DM Sans 13px ink + ✕ right.

RATINGS BLOCK (label "Ratings *"):
  3 rows (44px each, ghost bottom border):
  Layout: label DM Sans 13px ink-soft (72px wide) + 5 stars (20px, ochre filled / outline ghost) + score JetBrains Mono 12px gold right.
  Taste  ★★★★★  5.0
  Value  ★★★★☆  4.0
  Vibe   ★★★★★  5.0
  (Stars filled = ochre #C5491F. Empty = outline ghost.)

REVIEW TEXTAREA (120px min):
  Label "Your review *"
  Filled: "The suya spice rub is fresh — you can taste the yaji. The grilled plantain sides
  are the best in Lagos. Worth every naira."

CUISINE CHIPS (horizontal scroll, 32px, 8px gap):
  Label "Cuisine (optional)"
  Active: "Nigerian" — ink fill white, radius-full.
  Inactive: "Pan-African" · "West African" · "Continental" · "Fusion" · "Seafood" — ghost border, DM Sans 12px.

PRICE TIER (row, 36px):
  Label "Price range (optional)"
  4 chips: ₦ · ₦₦ · ₦₦₦ (active, ink fill white) · ₦₦₦₦ — radius-full, DM Sans 12px.

MULTI-IMAGE UPLOAD. [Use shared pattern. Show 2 images added (dish close-up, restaurant interior) + ADD tile.]

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 5 — CREATIVE SHOWCASE
════════════════════════════════════════════
Header title: "New Creative Showcase"
Template indicator row: 🎨 "Creative Showcase" gold left · "Change format" ochre right.

WORK TITLE input (48px): Label "Title of your work *" · Filled: "Zaria Music Visuals — Vol. 2"

MEDIUM CHIPS (horizontal scroll, 32px height, 8px gap):
  Label "Medium"
  Active: "Photography" — ink fill white, radius-full.
  Inactive: "Film" · "Digital Art" · "Illustration" · "Music" · "Writing" — ghost border.

DESCRIPTION TEXTAREA (160px min):
  Label "About this work *"
  Filled: "This series explores the space between performance and stillness — the moment after
  the last note. Shot over two months on film, no digital corrections."

COLLABORATION input (40px, optional):
  Label "Collaborator (optional)" · @ icon left · Filled: "@zaria.official"

IMAGE UPLOAD AREA (full width, 120px, dashed ghost border, radius-xl):
  Centred: 📷 icon 24px ghost + "Add photos or video" DM Sans 13px mute.
  Below: "1 photo added" chip — thumbnail 32px + filename JetBrains Mono 11px + ✕.

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 6 — POLL
════════════════════════════════════════════
Header title: "New Poll"
Template indicator row: 📊 "Poll" gold left · "Change format" ochre right.

POLL QUESTION textarea (80px, ghost border, radius-lg):
  Label "Poll question *"
  Filled: "What's the greatest era of Afrobeats?"

POLL OPTIONS (auto-layout vertical, 8px gap):
  Label "Options *" (min 2, max 4)
  Each option row (48px, ghost border, radius-lg, 16px padding):
    ⠿ drag handle 16px ghost left + text input DM Sans 14px flex + × delete 16px ghost right.
  Option 1: "90s Fela era" (filled)
  Option 2: "Wizkid / Davido 2010s" (filled)
  Option 3: "Burna Boy / Tems era" (filled)
  Option 4: empty placeholder "Option 4..." (greyed)
  "+ Add option" DM Sans 13px ochre link row below. Dimmed (already at 4).

DURATION (row, space-between, 36px):
  "Poll duration" DM Sans 13px mute left.
  Segmented control right: "1d" · "3d" (active, ink fill white) · "7d" — radius-lg, 32px height, ghost border.

DESCRIPTION TEXTAREA (80px, optional):
  Label "Add a description (optional)"
  Placeholder: "Give context for your poll..."

MEDIA TOOLBAR. [Shared — character counter not shown for poll.]

════════════════════════════════════════════
FRAME 7 — ITINERARY
════════════════════════════════════════════
Header title: "New Itinerary"
Template indicator row: 🗺️ "Itinerary" gold left · "Change format" ochre right.

TRIP TITLE input (48px): Label "Trip title *" · Filled: "48 Hours in Lagos: The Culture Route"

CITY input (48px): Label "City / Region" · 📍 left · Filled: "Lagos, Nigeria"

STOPS (label "Stops *" — min 2):
  Each stop row (80px min, white fill, ghost border, radius-lg, 16px padding, 8px gap):
    Left: number bubble (24px circle, ghost bg, mono 12px mute) + content right.
    Content: place name input DM Sans 14px bold ink (filled).
              🗂 "Link to Directory →" DM Sans 12px ochre, 2px below name.
              notes input DM Sans 13px ink (optional, placeholder "Add a note...").
    × remove button top-right of row.

  STOP 1: "Nike Art Gallery" linked "Nike Art Gallery · Ikoyi" note: "Go early for the rooftop."
  STOP 2: "Nok by Alara" linked "Nok by Alara · Victoria Island" note: "Book in advance."
  STOP 3: empty — name placeholder "Place name..." + 🗂 "Search directory..." greyed.

"+ Add stop" DM Sans 13px ochre link, centred, 8px top.

DURATION input (48px, optional): Label "Estimated duration" · ⏱ left · Placeholder "e.g. 2 days"

BUDGET CHIPS (row, 32px, 8px gap):
  Label "Budget level (optional)"
  4 chips: £ · ££ (active, ink fill white) · £££ · ££££ — radius-full, DM Sans 12px.
  (Note: use local currency symbol relevant to each stop's city — show £ as default.)

BEST TIME input (48px, optional):
  Label "Best time to visit (optional)" · ☀️ left · Placeholder "e.g. Oct–Mar, avoid rainy season"

MULTI-IMAGE UPLOAD. [Use shared pattern. Show 2 images (route highlight shots) + ADD tile.]

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 8 — EVENT
════════════════════════════════════════════
Header title: "New Event"
Template indicator row: 📅 "Event" gold left · "Change format" ochre right.

EVENT TITLE input (48px): Label "Event name *" · Filled (DM Sans 17px bold ink): "Amapiano Night at The Jazz Cafe"

DATE/TIME ROWS (ghost border, radius-lg, 48px each, 8px gap):
  Row 1: 📅 "Start date" field "Fri 20 Jun 2026" | 🕐 "Start time" field "9:00 PM"
  Row 2: "End date" field "Sat 21 Jun 2026" | "End time" field "3:00 AM"

VENUE input (48px): Label "Venue name" · 🏛 left · Filled: "The Jazz Cafe"
LOCATION input (48px): Label "Full address" · 📍 left · Filled: "Chalk Farm Road, Camden, London"
CITY input (48px): Label "City *" · Filled: "London"

ADMISSION input (48px): Label "Admission" · Currency prefix "£" · Filled: "15 adv / 20 door"
TICKET URL input (48px): Label "Ticket link (optional)" · 🔗 left · Filled: "https://dice.fm/..."

CATEGORY chips (horizontal, 32px height, radius-full):
  Active: "Music" — ink fill white. Inactive: "Art" · "Food" · "Sport" · "Culture" — ghost border.

ORGANISER LINK (row):
  Label "Organiser (optional)"
  DirectorySearch chip — avatar 24px + "Moveee Events" DM Sans 13px ink + ✕ right. (Already linked.)

MULTI-IMAGE UPLOAD. [Use shared pattern. Show 1 image added (event flyer) + ADD tile. Label below: "Event flyer, venue photos…"]

MEDIA TOOLBAR. [Shared.]

════════════════════════════════════════════
FRAME 9 — QUOTE
════════════════════════════════════════════
Header title: "New Quote"
Template indicator row: ❝ "Quote" gold left · "Change format" ochre right.

QUOTE TEXT textarea (200px min, large):
  Label "The quote *"
  Filled (Fraunces 18px italic ink — use italic style in this field to preview the quote):
  "African culture doesn't need validation from the West. It needs infrastructure,
  documentation, and distribution. The rest will follow."
  Character counter: "148 / 500" JetBrains Mono 11px mute, bottom-right.

ATTRIBUTION (label "Who said it *"):
  PERSON NAME input (48px): Filled: "Ngozi Adichie"
  SOURCE input (48px): Label "Source (optional)" · Filled: "Lagos Book & Art Festival · 2024"

POSTER'S NOTE textarea (80px, optional):
  Label "Why are you sharing this? (optional)"
  Filled: "Been sitting with this all week. The infrastructure piece is what we need to build."

QUOTE TYPE chips (row, 32px, radius-full):
  Label "Quote type"
  Active: "Person" — ink fill white.
  Inactive: "Book" · "Film" · "Speech" · "Song" — ghost border, DM Sans 12px ink-soft.

MEDIA TOOLBAR. [Shared — no image upload for Quote template.]

════════════════════════════════════════════
FRAME 10 — BOOK REVIEW
════════════════════════════════════════════
Header title: "New Book Review"
Template indicator row: 📚 "Book Review" gold left · "Change format" ochre right.

BOOK SEARCH FIELD (composite, 16px padding):
  Label "Book *"
  Search input (48px, ghost border, radius-lg, 🔍 left): "Things Fall Apart" filled.
  DROPDOWN RESULTS (white card, shadow-card, radius-lg, below input, 8px gap, 16px padding):
    3 result rows (48px each, ghost bottom border):
      [Book cover thumbnail 36×48px, radius-sm] [right: title DM Sans 14px bold ink · author+year DM Sans 12px mute]
    Row 1: "Things Fall Apart" · "Chinua Achebe · 1958" ← SELECTED (ochre left border 2px on row)
    Row 2: "Things Fall Apart (Graphic Novel)" · "Chinua Achebe · 2021"
    Row 3: "The Famished Road" · "Ben Okri · 1991"
    Divider, then: "+ Add new book" DM Sans 13px ochre with + icon (creates stacked Add Book sheet).

LINKED BOOK CARD (shows after selection, 16px padding, top):
  White card, ghost border, radius-lg, 12px padding.
  Left: book cover thumbnail 48×64px, radius-sm, shadow-card.
  Right: "Things Fall Apart" DM Sans 15px bold ink. "Chinua Achebe" DM Sans 13px mute.
  "View in Directory →" DM Sans 12px ochre, underline.
  ✕ remove link top-right DM Sans 12px mute.

READ STATUS CHIPS (row, 32px, 8px gap):
  Label "Status *"
  "Finished" (active, ink fill white, radius-full) · "Reading" · "Want to Read" — ghost border.

OVERALL RATING (row, 44px, space-between):
  Label "Overall rating *" DM Sans 13px ink-soft.
  5 stars (24px, ochre #C5491F filled) + "5.0" JetBrains Mono 14px bold gold right.

RATINGS BREAKDOWN (label "Ratings *", required):
  4 rows (44px each, ghost bottom border):
  Layout: label DM Sans 13px ink-soft (100px wide) + 5 stars (18px) + score JetBrains Mono 12px gold right.
  Writing      ★★★★★  5.0
  Story        ★★★★★  5.0
  Characters   ★★★★★  5.0
  Pacing       ★★★★☆  4.0
  (Stars filled = ochre #C5491F. Empty = outline ghost.)

REVIEW TEXTAREA (120px min):
  Label "Your review *"
  Filled (DM Sans 14px ink):
  "Achebe dismantles the colonial narrative with the very language of the coloniser. Every
  character is fully realised — Okonkwo's tragedy feels earned, not imposed."

FAVOURITE QUOTE (optional, 80px):
  Label "Favourite quote (optional)"
  Left border 3px #C5491F. 16px left padding.
  Filled (DM Sans 14px italic ink): "Things fall apart; the centre cannot hold."

RECOMMEND CHIPS (row, 32px, 8px gap):
  Label "Would you recommend it? *"
  "Yes ✓" (active, success green #2D6A4F fill, white text, radius-full) · "No" — ghost border.

GENRE TAGS (horizontal scroll, 32px):
  Label "Genres (optional)"
  Active: "Classic Literature" ink fill white, radius-full, DM Sans 12px bold.
  Inactive: "African Lit" · "Post-Colonial" · "Fiction" · "Historical" — ghost border.

MEDIA TOOLBAR. [Shared — no image upload for Book Review template.]

════════════════════════════════════════════
Output 10 frames in a grid. Arrange as 2 rows × 5 columns (landscape layout) or
3 rows × 4 columns (3+3+4 portrait layout — use whatever fits the canvas best).
Label each frame below in JetBrains Mono 11px mute:
  "Standard Post" · "Hidden Gem" · "Cultural Take" · "Food Review" · "Creative Showcase"
  "Book Review" · "Poll" · "Itinerary" · "Event" · "Quote"
```

---

## 5. ARTICLE DETAIL (Magazine)

---

### PROMPT 5A — Magazine Home & Browse

```
Senior mobile UX/UI designer — Moveee Connect magazine section. iOS, 390×844px.
Brand: paper-warm #F3ECE0 bg, white cards, ochre #C5491F, gold #B38238, ink #14110D.
Fraunces (editorial headlines) + DM Sans (UI) + JetBrains Mono (metadata/labels).

Design 3 frames covering the full magazine browsing experience.

════════════════════════════════════════════
FRAME 1 — MAGAZINE HOME (full-scroll layout)
════════════════════════════════════════════
HEADER (white, 56px, ghost bottom border):
  "Magazine" Fraunces 20px bold ink, left 16px.
  🔍 search icon + 🔔 bell (ochre unread dot), right 16px.

FEATURED HERO (full-bleed, 390×260px):
  Warm editorial photo placeholder (terracotta/ochre tones, portrait editorial feel).
  Gradient overlay bottom 50%: ink to transparent.
  Bottom-left (16px padding):
    "FASHION · NIGERIA" DM Sans 9px bold uppercase #C5491F, letter-spacing 0.1em. 8px above title.
    "The New Wave of Lagos Street Style" Fraunces 24px bold white, 2 lines.
    "By Funmi Osei · 8 min read" DM Sans 12px white mute, 6px below title.
  Top-right: "★ PRO EARLY ACCESS" gold pill, DM Sans 9px bold white — Pro-gated article badge.

CATEGORY FILTER STRIP (horizontal scroll, 40px, paper-warm bg):
  Active "All": ochre fill, white DM Sans 12px bold, radius-full.
  Inactive: "Fashion" · "Music" · "Film" · "Food" · "Interview" · "Visuals" · "Ideas" — ghost border.

SECTION 1 — "FROM THE EDITORS" (16px horizontal padding, 16px top):
  Header: "From the Editors" DM Sans 15px bold ink left + "See all →" DM Sans 13px ochre right.
  Horizontal scroll cards (200×250px, 12px gap, 16px start):
    3 cards (white fill, radius-xl, shadow-card):
      Image: 200×120px, radius-xl top, editorial placeholder.
      Category badge overlaid bottom-left: #fff0eb bg, #c5491f text, DM Sans 9px bold pill.
      Below (12px padding): title DM Sans 14px bold ink 2 lines + "Funmi Osei · 6 min" mono 10px ghost.
    Titles: "The New Wave of Lagos Street Style" · "What Afrobeats Owes to Jazz" · "The Architecture of Cool"

SECTION 2 — "INTERVIEWS" (16px padding, 20px top):
  Header + same 3-card horizontal scroll.
  Titles: "Adekunle Gold: A Conversation" · "Tems on Freedom" · "The Makers Behind the Movement"

SECTION 3 — CURRENT ISSUE CARD (16px margin, 20px top):
  White fill, radius-xl, shadow-card, 16px padding.
  Row: issue cover thumbnail (80×100px, radius-md) LEFT + content RIGHT (12px gap):
    "LATEST ISSUE" JetBrains Mono 9px bold #C5491F uppercase.
    "Issue #7: The Maker Edition" Fraunces 18px bold ink, 4px below.
    "9 articles · June 2026" DM Sans 13px mute, 4px below.
    "Explore this issue →" DM Sans 13px ochre, 8px below.

SECTION 4 — "SERIES" (16px padding, 20px top):
  Header: "Series" DM Sans 15px bold ink left + "Browse all →" ochre right.
  Horizontal scroll — series chips (160×80px, 12px gap, white fill, radius-xl, shadow-card, 12px padding):
    Series name DM Sans 13px bold ink + "N articles" mono 10px ghost.
    Series: "Culture Economy · 5" · "Visuals from the Continent · 8" · "The Maker Files · 6" · "Sound & City · 4"

SECTION 5 — "VISUALS" (16px padding, 20px top):
  Header: "Visuals" DM Sans 15px bold ink left + "See all →" ochre right.
  Full-width stacked cards (white fill, radius-xl, shadow-card, 12px gap):
    Image 200px height, radius-xl top. Below: "VISUALS" badge + Fraunces 16px bold title + author + read time.
    2 cards visible.

Bottom nav (Magazine tab active, book icon ochre).

════════════════════════════════════════════
FRAME 2 — ISSUES ARCHIVE
════════════════════════════════════════════
HEADER (white, 56px, ghost border):
  Back chevron + "Issues" Fraunces 18px bold ink centred.

LATEST ISSUE HERO CARD (16px margin, radius-xl, shadow-card):
  Cover image: full card width × 200px, radius-xl top, warm editorial cover placeholder.
  "LATEST" ochre pill badge, DM Sans 9px bold white, top-left over image.
  Below (16px padding):
    "Issue #7" JetBrains Mono 11px bold #C5491F uppercase.
    "The Maker Edition" Fraunces 22px bold ink, 4px below.
    "9 articles exploring African makers, craft culture, and the economics of creation."
    DM Sans 13px mute, 4px below.
    "Explore this issue →" DM Sans 14px bold ochre, 8px below.

"Past Issues" DM Sans 14px bold ink, 16px padding, 20px top.

2-COLUMN ISSUE GRID (8px gap, 16px margin, 12px top):
  6 past issue cards (3 rows × 2 cols), each white fill, radius-xl, shadow-card:
    Cover: full card width × 130px, radius-xl top, editorial cover placeholder.
    Below (10px padding):
      "Issue #N" JetBrains Mono 10px bold #C5491F.
      Issue name DM Sans 13px bold ink 2 lines. 2px top.
      "N articles · Month Year" DM Sans 11px mute. 2px top.
      "Read →" DM Sans 12px ochre. 4px top.
  Issues: #6 "The Sound Issue" May · #5 "Cities & Culture" Apr · #4 "Fashion Forward" Mar
          #3 "The Film Edit" Feb · #2 "Food & Identity" Jan · #1 "Origins" Dec 2025

════════════════════════════════════════════
FRAME 3 — CATEGORY BROWSE & SEARCH
════════════════════════════════════════════
HEADER (white, 56px):
  Back chevron + "Magazine" Fraunces 18px bold ink centred + 🔍 right.

SEARCH BAR (active, 44px, radius-full, ghost border, 16px margin):
  🔍 ghost left + "Interviews" DM Sans 14px ink (typed query) + × clear right.

CATEGORY STRIP (same pills, "Interview" active — ochre fill).

RESULTS LABEL (16px padding, 12px top):
  "14 results in Interviews" DM Sans 13px bold ink left.
  "Latest ▾" DM Sans 12px mute right.

RESULTS LIST (vertical stack, 12px gap, 12px top, 16px margin):
  Each result card (white fill, radius-xl, shadow-card, 16px padding):
    Thumbnail LEFT (80×80px, radius-md) + content RIGHT (12px gap):
      "INTERVIEW · NIGERIA" DM Sans 9px bold #C5491F uppercase.
      Article title DM Sans 14px bold ink, 2 lines. 4px top.
      "Author · N min" JetBrains Mono 10px ghost. 4px top.
      Series badge if applicable: "Culture Economy Pt. 3" ghost pill DM Sans 9px. 4px top.
    PRO ONLY gold pill overlaid top-right of thumbnail if gated.

  4 results:
    1. "Afrobeats at the Crossroads: Adekunle Gold" · Fola Olawale · 12 min · PRO ONLY
    2. "Tems on Freedom, Fame, and Finding Her Sound" · Amaka Osei · 9 min
    3. "The Makers Behind the Movement" · Seun Adeleke · 7 min
    4. "Lagos Fashion Week: Behind the Runway" · Kemi Adeyemi · 5 min

RELATED SERIES (16px padding, 20px top):
  "Related series" DM Sans 13px bold ink.
  2 series rows (44px height, white fill, ghost border, radius-xl, 12px padding, 8px gap):
    Series name DM Sans 13px bold ink + "N articles →" JetBrains Mono 10px ghost right.
    "Culture Economy" · 5 articles  ·  "Sound & City" · 4 articles

Output 3 frames: Frame 1 alone top, Frames 2–3 side by side below.
```

---

### PROMPT 5B — Article Detail (Full Scroll States)

```
Senior mobile UX/UI designer — Moveee Connect article detail page. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white content card, ochre #C5491F, gold #B38238, ink #14110D.
Fraunces (headlines/pull quotes) + DM Sans (body/UI) + JetBrains Mono (meta/labels).

Article subject: "Afrobeats at the Crossroads: A Conversation with Adekunle Gold"
Category: INTERVIEW · MUSIC. Country: Nigeria. Author: Fola Olawale. 12 min read.
Series: "Culture Economy" (part 3 of 5). Issue: Issue #7 "The Maker Edition".
This is a member-only article (patron tier required for full access).

Design 5 frames showing the complete scroll journey and key UI states.

════════════════════════════════════════════
SHARED ELEMENTS (present in all frames where applicable):
  SCROLL PROGRESS BAR: 3px height, full width, pinned at very top of screen (above status bar).
    Ochre #C5491F fill from left. Shows % read. Frame 1: 5% filled. Frame 2: 45%. Frame 3: 80%.
    Frame 4: 100% (complete). Frame 5: 45% (mid-article state, TOC open).
  FLOATING TOC BUTTON: 44×44px circle, white fill, shadow-card, ink list icon.
    Pinned bottom-right, 20px from right, 100px from bottom. Visible in Frames 1–4.
════════════════════════════════════════════

════════════════════════════════════════════
FRAME 1 — ARTICLE TOP (above the fold / initial load)
════════════════════════════════════════════
HERO IMAGE (full bleed, 390×260px):
  Warm editorial photo placeholder (ochre/terracotta tones, portrait photography feel).
  Dark gradient overlay bottom 50%: ink to transparent.
  FLOATING BACK BUTTON (top-left, 56px from top): 40px white circle, ink chevron.
  FLOATING ACTIONS (top-right, 56px from top): two 40px white circles — 🔖 bookmark (outline) + 🔗 share. 8px gap.
  Status bar: white icons.

CONTENT CARD (white #FFFFFF, radius-2xl top corners 24px, starts 32px overlap with hero):
  Starts at ~228px from top. 20px horizontal padding.

  BREADCRUMB (8px top):
    "Magazine" JetBrains Mono 10px ghost → "›" → "Interview" JetBrains Mono 10px ochre.

  CATEGORY EYEBROW (10px top):
    "★ INTERVIEW" DM Sans 9px bold #C5491F uppercase, letter-spacing 0.12em.
    "· NIGERIA" JetBrains Mono 9px ghost, 4px left gap.

  ARTICLE TITLE (Fraunces 26px bold ink, line-height 1.15, 8px top):
    "Afrobeats at the Crossroads: A Conversation with Adekunle Gold"

  STANDFIRST (DM Sans 15px ink-soft italic, 8px top, line-height 1.5):
    "On globalisation, authenticity, and what it means to make music that travels."

  OCHRE DIVIDER: 48px wide, 2px height, ochre #C5491F, 16px top.

  BYLINE BLOCK (16px top, 56px height):
    Left: 44px avatar circle (Pro gold border) + name + meta block:
      "Words by Fola Olawale" DM Sans 13px bold ink.
      "Jun 9, 2026  ·  12 min read" JetBrains Mono 10px ghost, 2px below.
    Right: SERIES badge — "Culture Economy Pt. 3" DM Sans 9px bold, ghost border pill.

  ARTICLE ACTIONS BAR (40px, ghost top+bottom border, 12px top):
    ❤️ "847" DM Sans 13px mute · 🔥 "234" · (divider) · 🔖 Bookmark · 🔗 Share
    Icons: outline, 20px. JetBrains Mono 10px counts. 16px gap between groups.

  ARTICLE BODY (DM Sans 16px ink-soft, line-height 1.7, 20px top):
    Paragraph 1 (full):
    "There's a particular brand of artistic confidence that Adekunle Gold carries into every
    room. At 34, the Yoruba pop architect has stopped explaining himself to anyone — and the
    music is louder for it."

    Paragraph 2 (partial, continues below fold):
    "He's speaking to me from his Lagos studio, and I can hear the city in the background —
    motorcycle engines, the distant singsong of market hawkers..."

════════════════════════════════════════════
FRAME 2 — MID-ARTICLE (scrolled, body content + access gate)
════════════════════════════════════════════
STICKY HEADER (appears on scroll, 52px, white fill, ghost bottom border):
  Back chevron #14110D left (44px tap) + "Adekunle Gold Interview" DM Sans 13px bold ink centred (truncated) + 🔖 outline right.

ARTICLE BODY (continuing from Frame 1):
  Paragraph 3:
  "When I ask about the international label deal that fell through in 2023, he doesn't flinch.
  'They wanted to erase the Lagos in my voice. I said no. Some deals aren't worth making.'"

  PULL QUOTE BLOCK (24px vertical margin):
    Left accent bar: 3px solid #C5491F, full height of block.
    12px left gap from bar.
    Quote text (Fraunces 20px italic ink, line-height 1.35):
      "The world wants Afrobeats but sometimes I wonder if it knows what Afrobeats actually is."
    Attribution: "— Adekunle Gold" DM Sans 12px mute, 6px top.

  Paragraph 4 (DM Sans 16px):
  "The question of authenticity in a globalised music economy is not academic — it is the
  defining creative tension of his generation. Burna Boy wrestled with it. Tems navigated it
  with instinct. Gold approaches it philosophically."

  INLINE IMAGE (full card width, 200px, radius-md, warm portrait placeholder):
    Caption: "Adekunle Gold photographed in Lagos, 2026." DM Sans 11px mute italic, centred, 4px below.

  Paragraph 5 (fading out — ACCESS GATE):
  "He pulls out a tattered notebook filled with lyrics from his upcoming record. He reads one
  aloud — and it is unlike anything I've heard from him. Quieter. More interior..."
    → Last 40px of this paragraph has white-to-transparent gradient overlay (fade to gate).

  CONTENT GATE CARD (white fill, gold border 1.5px #B38238, radius-xl, 20px padding, centred):
    🔒 icon 28px gold, centred top.
    "Members-only article" Fraunces 18px bold ink, centred, 8px below.
    "This article is available to Connect Pro members. Upgrade to read the full interview,
    including exclusive quotes and unreleased track details." DM Sans 14px mute centred, 8px below, max 280px.
    "Upgrade to Connect Pro" gold fill button, radius-full, 52px, full width. White DM Sans 14px bold. 16px top.
    "Sign in if you're already a member →" DM Sans 12px ochre centred, 8px below.

════════════════════════════════════════════
FRAME 3 — ARTICLE END (post-body, member-unlocked view)
════════════════════════════════════════════
(This frame shows the view AFTER a member/Pro user has read the full article.)
Sticky header same as Frame 2.

FINISH READING BANNER (ochre #C5491F fill, full width, 72px, 20px horizontal padding):
  ✓ checkmark circle (white, 24px) left.
  "Article complete!" DM Sans 14px bold white.
  "+ 15 Culture Points earned" JetBrains Mono 11px white, 2px below.
  "Collect Points" white fill, ochre text, radius-full, 36px height, right-aligned button.

GHOST RULE.

SERIES CONTEXT STRIP (paper-warm bg, 56px, 20px horizontal padding):
  📖 icon 16px ochre left.
  "Part of the 'Culture Economy' series" DM Sans 14px bold ink, inline.
  "Explore the series (5 articles) →" DM Sans 13px ochre, 4px below.

GHOST RULE.

FROM THIS ISSUE CARD (white fill, radius-xl, shadow-card, 16px margin, 12px padding):
  Layout: issue cover thumbnail (64×80px, radius-md, warm editorial cover placeholder) LEFT +
  content RIGHT (12px left gap):
    "Issue #7" JetBrains Mono 10px bold ochre uppercase.
    "The Maker Edition" Fraunces 17px bold ink, 4px below.
    "9 articles in this issue" DM Sans 12px mute, 4px below.
    "Browse issue →" DM Sans 13px ochre, 4px below.

AUTHOR BIO CARD (white fill, radius-xl, shadow-card, 16px margin, 20px padding):
  AUTHOR HEADER ROW:
    64px avatar circle + column right:
    "Fola Olawale" Fraunces 18px bold ink.
    "Culture Editor" DM Sans 13px mute, 2px below.
  BIO (DM Sans 14px ink-soft, line-height 1.6, 12px top):
    "Fola covers music, fashion, and cultural politics for Moveee. Her interviews
    have appeared in The Guardian, i-D, and Essence. Based in Lagos and London."
  "More articles by Fola →" DM Sans 13px ochre, 12px top.

════════════════════════════════════════════
FRAME 4 — SHOP THE EDIT + NEWSLETTER + KEEP READING
════════════════════════════════════════════
Sticky header same as Frame 2.

NEWSLETTER CTA CARD (paper-warm #F3ECE0 fill, full width, 20px padding, ghost top+bottom border):
  ✉️ icon 20px ochre left row.
  "Culture in your inbox, every Friday." DM Sans 14px bold ink.
  "Subscribe to GetMeLit — our weekly cultural briefing." DM Sans 13px mute, 4px below.
  EMAIL INPUT ROW (ghost border, radius-full, 44px):
    "Your email address" DM Sans 14px ghost placeholder.
    "Subscribe" ochre pill (inset right, 80px, white DM Sans 13px bold).

GHOST RULE (16px vertical margin).

SHOP THE EDIT SECTION (16px horizontal padding):
  SECTION HEADER ROW:
    "SHOP THE EDIT" DM Sans 11px bold ink uppercase letter-spacing 0.1em left.
    "As seen in this article" DM Sans 11px mute right.

  PRODUCT GRID (2 columns, 8px gap, 12px top):
  Show 4 product cards (2×2):

  PRODUCT CARD (white fill, radius-xl, shadow-card):
    Product image: full card width × 120px, radius-xl top corners, warm product photo placeholder.
    AS SEEN IN badge (optional, top-left of image): "★ FEATURED" — ochre pill, DM Sans 8px bold white.
    Below image (10px padding):
      Maker name: "Bisi Ceramics" DM Sans 10px bold mute uppercase. 4px top.
      Product name: "Terracotta Ritual Bowl" DM Sans 13px bold ink, 2 lines. 2px top.
      Price row: "£68.00" DM Sans 13px bold ink. If Pro pricing: "Pro: £54" DM Sans 11px gold right.
      "View product →" DM Sans 12px ochre, 4px top.

  Products shown:
    1. Bisi Ceramics — Terracotta Ritual Bowl — £68.00
    2. Bisi Ceramics — Clay Water Carafe — £95.00 / Pro: £76
    3. Loom Lagos — Kente Cap — £42.00
    4. Zara Mensah Studio — Lagos Print Tote — £55.00

  "Browse all products featured in Moveee →" ghost border button, full width (16px margin), radius-full, 44px, ink text DM Sans 14px. 12px top.

GHOST RULE (20px vertical margin).

KEEP READING SECTION (16px horizontal padding):
  "Keep reading" Fraunces 20px bold ink left + "See all →" DM Sans 13px ochre right. 0px top.
  3 article cards (vertical stack, 12px gap, 12px top):
    Each: white fill, radius-xl, shadow-card.
    Image: full card width × 140px, radius-xl top, editorial photo placeholder.
    Below (16px padding):
      Category badge pill (ochre, DM Sans 9px bold). 8px top.
      Title: DM Sans 14px bold ink, 2 lines. 4px top.
      Author + read time: "Funmi Osei · 6 min" JetBrains Mono 10px ghost. 4px top.

  Article titles:
    1. "Why Nigerian Fashion Is Rewriting the Rules of Luxury"
    2. "The Economics of Cool: How African Creatives Are Building on Their Own Terms"
    3. "Music, Markets, and Meaning: A Year in African Sound"

════════════════════════════════════════════
FRAME 5 — TABLE OF CONTENTS BOTTOM SHEET (overlay state)
════════════════════════════════════════════
Show the article at Frame 2 scroll position (body content visible behind) with the TOC
bottom sheet open on top. Backdrop: ink at 25% opacity (lighter than main modal backdrop —
reader can still see the article behind).

BOTTOM SHEET (white fill, radius-2xl top corners 24px, height ~70% of screen, ~590px):
  Drag handle: 4×28px, radius-full, #C8BFB0, centred, 10px top.
  × close: 36×36px circle, paper-warm fill, ink ×, 14px top, 16px right.

  SHEET HEADER (16px padding, 16px top):
    "Contents" DM Sans 16px bold ink left.
    Article title truncated: "Adekunle Gold Interview" JetBrains Mono 10px ghost, 4px below.

  METADATA SIDEBAR (paper-warm bg strip, full width, 20px padding, 12px top, 8px gap between rows):
    4 meta rows (32px each, ghost bottom border):
      Row: label (DM Sans 10px bold mute uppercase, 80px wide) + value (DM Sans 13px ink).
      WRITER:    "Fola Olawale"
      LOCATION:  "Lagos, Nigeria"
      SECTION:   "Interviews"
      INDUSTRY:  "Music & Entertainment"

  GHOST RULE (12px top).

  "In this article" DM Sans 13px bold ink, 16px padding, 12px top.

  TOC HEADING LIST (16px padding, 8px gap):
    Each row (44px, ghost bottom border):
      h2 items: DM Sans 14px bold ink, tap to scroll to section.
      h3 items: DM Sans 13px ink-soft, 12px left indent.
      Active/current section: ochre left dot 6px + #C5491F text.

    Items:
      ● "On the Label Deal That Fell Through" — ochre (current)
        "The Authenticity Question"
      "What Globalisation Takes From You"
        "The Language of the Record"
      "What Comes Next"

    Scroll indicator on right edge (the list is scrollable).

Output 5 frames. Layout: Frame 1 alone, Frames 2–3 side by side, Frames 4–5 side by side.
```

---

## 6. EVENTS SCREENS

---

### PROMPT 6 — Events List & Event Detail

```
Senior mobile UX/UI designer — Moveee Connect events section. iOS, 390×844px.
Brand: paper-warm #F3ECE0 bg, white cards, ochre #C5491F, gold #B38238, ink #14110D,
DM Sans + Fraunces + JetBrains Mono.

FRAME 1 — EVENTS LIST:
Header (white, 64px): "Events" Fraunces 20px bold ink, 16px left + filter icon right.

FILTER TABS (horizontal scroll, 44px height, white bg, ghost bottom border):
Pills: All · Upcoming · Online · Pro Only
Active: ink fill white DM Sans 13px bold. Inactive: ghost border ink-soft. Radius-full, 32px height.

EVENT CARDS (vertical list, 16px gap, 16px horizontal padding, 16px top padding):

CARD 1 (Free live event, white fill, radius-xl, shadow-card):
Image (390-32px wide × 180px, radius-xl top corners):
  Overlay badges: "🟢 UPCOMING" small success green pill top-left + "MUSIC" grey pill below it.
Content (16px padding):
"Amapiano Night at Jazz Cafe" DM Sans 17px bold ink
"📅 Fri 13 Jun · 9:00 PM" + "📍 Jazz Cafe, Camden, London" DM Sans 13px mute (2 rows)
"Free entry · Limited spots" DM Sans 13px ink-soft
Footer row: "👥 47 attending" DM Sans 13px mute left + "RSVP" small ochre pill button right.

CARD 2 (Pro-only paid event):
Image with "⭐ PRO ONLY" gold fill overlay badge top-right.
"Exclusive Industry Mixer — Spring Edition" DM Sans 17px bold
"📅 Sat 14 Jun · 7:00 PM · 📍 Shoreditch, London" 2 rows
"£25 advance / £35 door"
Footer: avatar stack (3 overlapping 24px circles) + "Zara +24 others" mute + "Get Tickets →" ink border button.

CARD 3 (Online event):
Image with "🔗 ONLINE" blue pill overlay.
"Diasporic Futures: An Open Conversation" 
"📅 Sun 15 Jun · 3:00 PM · 🔗 Zoom Webinar"
"Free · 200 spots available"
Capacity bar: full width, 8px height, radius-full. paper-deep bg, ochre fill at 67%.
"134 attending" below bar.

Bottom nav: Events tab active.

FRAME 2 — EVENT DETAIL:
HERO IMAGE (390×260px, full-bleed):
Floating back button: white 40px circle, ink chevron, top-left, 16px.
Category badge bottom-left: "MUSIC" pill with blurred backdrop.

WHITE CONTENT AREA (radius-2xl top corners, starts 40px overlap with hero):
24px horizontal padding.

"Amapiano Night at Jazz Cafe" Fraunces 24px bold ink.
"👥 Kemi, Zara, Michael +24 attending" DM Sans 13px mute, avatar stack inline, 12px top margin.

META CARD (paper-deep bg #F5F5F5, radius-lg, 16px padding, 20px vertical margin):
4 rows, 12px gap:
📅 "Friday, 13 June 2026 · 9:00 PM – Late" DM Sans 14px ink-soft
📍 "Jazz Cafe · 5 Parkway, Camden, London NW1 7PG" 14px ink-soft
💳 "Free entry / £15 advance" 14px ink-soft
👤 "Organised by: Moveee Events" 14px ochre underlined (link)
Each: 20px left padding for text, icon 16px ochre left.

DESCRIPTION (DM Sans 15px ink-soft, line-height 1.6):
"Join us for a legendary night of Amapiano and Afro house at one of London's most iconic live music venues..."

"Get Tickets / Find Out More" primary button: full width, ochre, pill, 52px height, 20px top margin.

DIVIDER ghost line, 24px margin.

RSVP SECTION (free events):
"RSVP to secure your spot" DM Sans 15px bold ink
"Name" input + "Email" input (same standard style)
"Confirm RSVP" primary ochre button, full width.

FRAME 3 — RSVP SUCCESS:
Full paper-warm bg. Centred content.
Success circle: 72px, success green fill (#2D6A4F), white ✓ checkmark (32px, 3px stroke).
"You're on the list! 🎉" Fraunces 24px bold ink, centred, 20px top margin.
"A confirmation will be sent to kemi@example.com" DM Sans 14px mute, centred.
"Add to Calendar" secondary button (ink border, 48px, full width max 280px), 24px below.
"Back to Events" DM Sans 13px ochre link, centred.

Output 3 frames in a row. Label each.
```

---

### PROMPT 6B — Events: Timeline + Calendar View, Filter Sheet (Redesign)

```
Senior mobile UX/UI designer — Moveee Connect events section redesign. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D, ghost #C8BFB0, mute #7A6F5C, success #2D6A4F.
Typography: Fraunces (display), DM Sans (body/UI), JetBrains Mono (dates/meta/counts).
Radius: sm=2px, md=4px, lg=6px, xl=12px, 2xl=20px, full=9999px.
Shadow-card: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04).

DESIGN PRINCIPLE: this is a list of facts, not a photo wall. No large hero images
on the list — events are scanned by date, time and place. Photography is reserved
for the detail screen once a user commits to opening an event. The list optimises
for density and scan speed: date markers, time, venue, category colour, RSVP state.

EVENT CATEGORY COLOUR SYSTEM (used as a 4px left-edge accent bar + small dot, never
as a full-card fill — keeps the list calm):
  Live Music → #C5491F (ochre)   Nightlife → #7B1FA2 (purple)
  Food & Drink → #B38238 (gold)   Film → #1976D2 (blue)
  Visual Art → #6B48A8 (violet)   Literature → #78350F (sepia)
  Community → #2D6A4F (forest)   Performance → #00695C (teal)
  Tech & Ideas → #3A342B (dark warm)

---

FRAME 1 — EVENTS: TIMELINE VIEW (default):

HEADER (64px, white bg, shadow-card bottom):
  "Events" Fraunces 20px bold ink, 16px left.
  Right side (16px inset, 12px gap): 
    FILTER BUTTON — 36px circle, ghost border, ⚙︎/sliders icon 16px ink. Small ochre dot badge (6px,
      top-right of icon) shown when ≥1 filter active.
    VIEW TOGGLE — segmented control, 2 segments, 32px height, radius-full, paper-deep bg track:
      "☰ List" (active: white pill fill, shadow-card, DM Sans 12px bold ink) /
      "▦ Calendar" (inactive: DM Sans 12px mute, no fill).

ACTIVE FILTER CHIPS ROW (only shown when filters are applied, 40px, horizontal scroll, 16px
  horizontal padding, 8px gap): e.g. "Live Music ✕" and "London ✕" — ochre fill white text,
  radius-full, 28px height, DM Sans 12px bold. "Clear all" ghost text link at the end.

TIMELINE (vertical scroll, 16px horizontal padding):
  DATE GROUP HEADER (sticky-style, 32px, 12px top margin per new group):
    Left: day-of-week + date, JetBrains Mono 11px bold mute uppercase, e.g. "FRI 13 JUN".
    Right: thin ghost rule filling remaining width.

  TIMELINE ROW (each event — 8px vertical gap between rows within a date group):
    Structure: 56px TIME COLUMN (left) + connecting dot/line + EVENT CARD (right).
    TIME COLUMN: "9:00" DM Sans 12px bold ink + "PM" JetBrains Mono 9px mute below, right-aligned,
      8px right padding.
    TIMELINE RAIL: 2px vertical ghost line running through all rows in the group, with a 8px
      filled dot (category colour) at each event's time marker, centred on the rail.
    EVENT CARD (white fill, radius-lg, shadow-card, 4px LEFT EDGE ACCENT BAR in category colour,
      12px padding, no image):
      Top row: category dot (6px, category colour) + category label DM Sans 10px bold mute
        uppercase letter-spacing + RSVP STATUS chip right (only if relevant):
          "✓ Going" — success green text, pale green bg, radius-full, 18px height, DM Sans 10px bold.
      Title: "Amapiano Night at Jazz Cafe" DM Sans 15px bold ink, 1–2 lines, 4px top.
      Meta row (4px top): "📍 Jazz Cafe, Camden" DM Sans 12px mute + "· London" mute.
      Bottom row (8px top): price/admission "Free" or "£15" DM Sans 12px ink-soft left +
        attendance "👥 47 going" DM Sans 11px mute right.
      PRO-ONLY events: small gold ★ badge inline after title, no other change (no large overlay).
      ONLINE events: 🔗 icon replaces 📍 in meta row, "Zoom Webinar" instead of venue.

  Show 3 date groups: "FRI 13 JUN" (2 rows), "SAT 14 JUN" (2 rows), "SUN 15 JUN" (1 row) — 5
  event rows total, mixing free/paid/online/pro examples used in Prompt 6.

  Empty state (sketch separately, small inline note): centred icon + "No events match your
  filters" DM Sans 14px mute + "Clear filters" ochre link.

  Bottom nav: Events tab active.

---

FRAME 2 — EVENTS: CALENDAR VIEW:

Same HEADER as Frame 1, but "▦ Calendar" segment active (white pill fill).
Same ACTIVE FILTER CHIPS ROW state (show with "Live Music ✕" applied, for variety).

MONTH STRIP (56px, white bg, shadow-card bottom, 16px horizontal padding):
  "← June 2026 →" Fraunces 15px bold ink centred, ghost chevrons either side (32px tap targets).

WEEK CALENDAR GRID (white bg, 16px padding, 8px bottom shadow-card):
  7 day-of-week labels (Mon–Sun) JetBrains Mono 10px mute uppercase, centred, equal columns.
  Date cells below (44×44px, centred, 4px gap): plain DM Sans 14px ink number.
    TODAY: ghost border ring.
    SELECTED DAY (13): ink fill circle, white bold number.
    DAYS WITH EVENTS: 4px dot below the number, category colour (mix of colours across the
      week to show variety) — multiple dots (max 3, then "+") if multiple categories that day.
  Swipe affordance note: "Swipe to change week" JetBrains Mono 9px ghost, centred, 4px below grid.

SELECTED DAY EVENTS (16px padding, 12px top):
  "Friday 13 June" DM Sans 13px bold mute uppercase, 8px bottom, with "3 events" JetBrains Mono
    11px ghost right-aligned on same row.
  Same TIMELINE ROW card style as Frame 1 (time column + dot + no-image card with left accent bar),
    but no date group headers needed since already scoped to one day. 8px gap between rows.
  Show 3 rows: morning food event, afternoon talk, evening live music — vary category colours.

  If selected day has zero events: centred "No events on this day" DM Sans 13px mute, 32px
    vertical padding, small calendar-with-x icon above.

  Bottom nav: Events tab active.

---

FRAME 3 — FILTER SHEET (bottom sheet, slides up from Filter button tap):

SCRIM: ink @ 40% opacity behind sheet.
SHEET (white bg, radius-2xl top corners, ~70% screen height, shadow-card):
  DRAG HANDLE: 36×4px ghost pill, centred, 8px top margin.
  HEADER ROW (16px padding): "Filter Events" Fraunces 18px bold ink left + "Reset" ochre
    DM Sans 13px right.

  SECTION — EVENT TYPE (16px padding, 12px bottom):
    "Event Type" DM Sans 12px bold mute uppercase, 10px bottom.
    Chip grid (wrap, 8px gap): "Live Music" (selected: ink fill white text) · "Nightlife" ·
      "Food & Drink" · "Film" · "Visual Art" · "Literature" · "Community" · "Performance" ·
      "Tech & Ideas" — ghost border pills when inactive, radius-full, DM Sans 12px bold, 32px height.

  SECTION — CITY (16px padding, ghost top border, 12px bottom):
    "City" DM Sans 12px bold mute uppercase, 10px bottom.
    Search input (44px, ghost border, radius-lg): 🔍 + "Search city" placeholder.
    Quick chips below (8px top, 8px gap): "London" (selected) · "Lagos" · "Accra" · "Toronto" ·
      "New York" — same chip style as above.

  SECTION — PRICE (16px padding, ghost top border, 12px bottom):
    "Price" DM Sans 12px bold mute uppercase, 10px bottom.
    3 chips: "Free" · "Paid" · "Any" (selected, ink fill) — same chip style.

  SECTION — WHEN (16px padding, ghost top border, 12px bottom):
    "When" DM Sans 12px bold mute uppercase, 10px bottom.
    4 chips: "Today" · "This Weekend" (selected) · "This Month" · "Custom range…" — same style.

  SECTION — ACCESS (16px padding, ghost top border):
    "Access" DM Sans 12px bold mute uppercase, 10px bottom.
    2 chips: "All Members" (selected) · "⭐ Pro Only" (gold border when inactive, gold fill when active).

  FOOTER (sticky bottom, white bg, shadow-card top, 16px padding):
    "Show 12 events" primary ochre button, full width, radius-full, 52px height, DM Sans 15px bold white.

---

Output 3 frames side by side: Timeline View, Calendar View, Filter Sheet.
Reuse Prompt 6's Frame 2 (Event Detail) and Frame 3 (RSVP Success) unchanged — this prompt
replaces only Prompt 6's Frame 1 (Events List) with the timeline/calendar system above.
```

---

## 7. GAMES SCREENS

---

### PROMPT 7 — Games Hub & Trivia Gameplay

```
Senior mobile UX/UI designer — Moveee Connect games section. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D, DM Sans + Fraunces + JetBrains Mono.

FRAME 1 — GAMES HUB:
Header (white, 64px): "Games" Fraunces 20px bold ink + small gold ★ icon.
Subheader: "Daily challenges · Earn culture points" DM Sans 13px mute right.

STREAK BANNER (paper-warm bg with ochre left accent border 3px, 64px height, 16px horizontal padding, row):
Left: 🔥 emoji 24px + "4 day streak!" DM Sans 14px bold ink
Right: "Keep it up" DM Sans 12px mute

GAMES GRID (2×2, 16px gap, 16px horizontal padding, 16px top margin):
All cards: white fill, radius-xl, shadow-card.

CARD 1 — Daily Trivia (available, not yet played today):
Top half (120px): ochre warm patterned background. Large "?" in Fraunces 48px bold white, centred.
Bottom (16px padding):
  "Daily Trivia" DM Sans 15px bold ink
  "10 questions · cultural knowledge" JetBrains Mono 10px mute
  "Earn up to 50 CR" DM Sans 12px ochre
  "Play now →" DM Sans 13px bold ochre link, bottom-left.

CARD 2 — Who Said It (available):
Top half: ink (#14110D) background. Large " " Fraunces 48px gold, centred.
"Who Said It?" DM Sans 15px bold ink
"Match quotes to their authors" JetBrains Mono 10px mute
"Earn up to 30 CR" DM Sans 12px ochre
"Play now →"

CARD 3 — Crossword (coming soon):
Top half: paper-deep bg. Crossword grid illustration (4×4 letter boxes, ghost outlines).
"Crossword" DM Sans 15px mute
"Coming soon" ghost pill badge (paper-deep, ghost border, DM Sans 11px mute)
Overall card opacity: 60%

CARD 4 — Sudoku (coming soon):
Top half: paper-deep bg. 9×9 sudoku grid illustration (mini numbers in grid cells, ghost).
"Sudoku" DM Sans 15px mute
"Coming soon" ghost pill
Card opacity: 60%

Bottom nav: Games tab active.

FRAME 2 — TRIVIA QUESTION IN PROGRESS:
White background.
Header (64px, white, bottom ghost border):
  "Daily Trivia" DM Sans 15px bold ink centred
  "Exit" DM Sans 14px ghost right (44px tap target)

PROGRESS BAR (full width, 8px height, radius-full, 16px horizontal padding, 12px top margin):
Background: ghost (#C8BFB0). Fill: ochre (#C5491F), width = 30% (question 3 of 10).
"Question 3 of 10" JetBrains Mono 11px mute centred, 8px below bar.
"Score: 2" DM Sans 14px bold ink, right-aligned, same row as "Q 3 of 10"

QUESTION CARD (white fill, radius-xl, shadow-card, 24px padding, 20px horizontal margin, 20px top margin):
Category: "MUSIC HISTORY" DM Sans 9px bold uppercase ochre, 4px below = thin ochre line 32px.
Question: "Which Nigerian artist was the first African to headline Coachella's main stage?"
Fraunces 22px bold ink, leading 1.3, centred. (Allow 3 lines)

ANSWER OPTIONS (4 buttons, 12px gap, 20px horizontal margin, 16px top margin):
Each: full width, 52px height, white fill, ghost 1px border, radius-lg (6px), row layout.
Left: letter chip (DM Sans 11px bold ink, 24×24px, paper-deep bg, radius-full).
Text: DM Sans 15px ink. 12px gap between chip and text.
A: "Burna Boy" · B: "Wizkid" · C: "Fela Kuti" · D: "Davido"

"Next Question →" primary ochre button (full width, 52px, radius-full, 20px horizontal margin, disabled = 40% opacity)
Show as disabled (no option selected yet).

FRAME 3 — ANSWER REVEALED:
Same as Frame 2 but with option states:
A "Burna Boy" — CORRECT: success green border (#2D6A4F, 2px), success green bg tint (#EDF7ED).
  Green ✓ checkmark (16px) right side of row.
C "Fela Kuti" — WRONG: error red border (#C62828, 2px), error red bg tint (#FEF2F2).
  Red × (16px) right side.
B, D: ghost/unselected unchanged.

EXPLANATION BOX (below answer options, 16px margin):
paper-deep bg, radius-lg, 16px padding.
"💡 Burna Boy headlined Coachella's main stage in April 2023, making history as the 
first African artist to perform at the festival's main stage." DM Sans 13px ink-soft.

"Next Question →" button: now active (ochre fill, white text).

FRAME 4 — GAME COMPLETE / SCORE SCREEN:
Paper-warm background, centred content.
Score display: "7 / 10" Fraunces 56px bold ink, centred, large.
"70% correct" DM Sans 16px mute, centred.
Message: "Solid knowledge! Keep exploring." Fraunces 20px italic gold, centred.
"+35 CR earned" gold fill pill (DM Sans 14px bold white), centred, 12px top margin.

Divider: ghost line, 24px vertical margin.
"Question Review" DM Sans 14px bold ink centred.
10-dot row (5px gap each): 7 ochre filled circles (correct) + 3 error red filled circles (wrong).

"Share result" secondary button (ink border, 48px height, max 200px width, centred).
"Back to Games" DM Sans 13px ochre link, centred, 16px below.

FRAME 5 — ALREADY PLAYED TODAY:
Paper-warm background.
Completion circle: 72px diameter, ochre fill, white ✓ checkmark 32px centred.
"Already played today!" Fraunces 22px bold ink, centred.
"You scored 7/10 · +35 CR earned" DM Sans 14px mute, centred.
Countdown: "Next game available in" DM Sans 13px mute + "14:32:07" JetBrains Mono 28px bold ink (large, centred).
"Browse the feed while you wait →" DM Sans 13px ochre link.

Output 5 frames. Layout: Frame 1 alone top row, Frames 2-3-4 bottom row, Frame 5 small below.
```

---

## 8. MEMBER DASHBOARD

---

### PROMPT 8 — Member Dashboard (Pro & Citizen Variants)

```
Senior mobile UX/UI designer — Moveee Connect member dashboard. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D,
DM Sans + Fraunces + JetBrains Mono. CONNECT PRO = patron tier (gold).

Generate 2 frames: Connect Pro dashboard and Connect Citizen dashboard.

SHARED LAYOUT STRUCTURE:

HEADER (white, 64px):
"moveee connect" wordmark centred (Fraunces 16px bold ink + DM Sans 8px bold gold "connect")
"Sign out" DM Sans 13px ochre, right-aligned.

CONTENT SCROLL (paper-warm bg, 16px horizontal padding, 16px gap between cards):

CARD 1 — HERO PROFILE (white fill, radius-xl, shadow-card, 24px padding):
Row layout: Avatar XL (96px) left + text stack right (16px gap between).
Avatar LEFT: circular crop, Pro = 3px gold border ring (#B38238), Citizen = 2px ghost ring.
Text RIGHT (vertical stack, 8px gap):
  Display name: Fraunces 22px bold ink
  Tier badge: CONNECT PRO (gold, ★ icon) or CONNECT CITIZEN (ghost)
  "📍 Lagos, Nigeria" DM Sans 13px mute
  "Member since Jan 2024" JetBrains Mono 10px ghost

CARD 2 — PASSKEY BANNER (paper-deep bg, ochre left border 3px, radius-lg, 12px padding):
Row: fingerprint icon 20px ochre left + text middle + arrow right.
Text: "Set up passkey login" DM Sans 14px bold ink + "Log in faster with biometrics" 12px mute below.
Arrow: chevron right 16px ink.
(Only show if user doesn't have passkey. Annotate: "hidden once passkey set up")

CARD 3 — STATS BAR (white fill, radius-xl, 16px padding, 4-column row with ghost dividers):
Each stat centred:
  Number: DM Sans 20px bold (credits in ochre, reputation in gold, others in ink)
  Label: DM Sans 9px bold uppercase mute, 4px below number
Stats Pro: 1,240 CREDITS · 385 REPUTATION · 6 BADGES · 48 DAILY LEFT
Stats Citizen: 340 CREDITS · 120 REPUTATION · 2 BADGES · 38 DAILY LEFT

CARD 4 — UPGRADE BANNER (CITIZEN VERSION ONLY):
Ochre fill (#C5491F), radius-lg, 16px padding. Row layout.
"Upgrade to Connect Pro" Fraunces 16px bold white left + 
"Unlock perks, earn more" DM Sans 12px white below title.
"Upgrade →" white outline pill button (DM Sans 12px bold white, 36px height, ink border white) right.

CARD 5 — BADGES (white fill, radius-xl, 16px padding):
"My Badges" DM Sans 14px bold ink left + "See all →" 13px ochre right.
Badge chips (horizontal wrap, 2 rows max, 8px gap):
Each chip: white fill, ghost border 1px, radius-full, 6px vertical 10px horizontal padding.
  Emoji 14px + label DM Sans 12px bold ink.
Pro badges: 🎨 Taste Maker · 💎 Gem Hunter · ✍️ Contributor · 🔥 Hot Take · 📸 Visual · ⭐ Featured
Citizen badges: 💎 Gem Hunter · ✍️ Contributor

CARD 6 — REFERRAL (white fill, radius-xl, 12px 16px padding, row):
🔗 icon 20px ochre left + "moveee.com/r/zaramensah" JetBrains Mono 12px ink-soft + copy icon 20px right.

CARD 7 — QUICK LINKS MENU (white fill, radius-xl, NO extra padding — list style):
8 menu rows. Each: 52px height, 16px horizontal padding, ghost bottom border.
Row: icon 20px ochre left (16px gap) + label DM Sans 15px ink + chevron right 12px ghost.
Items: 💰 Wallet · 🎁 Perks · 🎟️ Coupons · 📊 Analytics · 📖 Magazine · ⚙️ Settings · 📧 Newsletters · 💎 Membership

CARD 8 — HOW TO EARN (white fill, radius-xl, 16px padding, collapsible):
Header row: "How to Earn Points" DM Sans 14px bold ink + collapse ▲ arrow right.
Table (3 columns, DM Sans 12px):
  Action | CR | REP
  Publish a post | +10 | +5
  Get 5 reactions | +5 | +2
  Leave a comment | +2 | +1
  Win daily game | +30 | 0
  Refer a friend | +50 | +10
Column headers: JetBrains Mono 10px bold mute. Rows: alternating paper-deep/white rows.

Bottom nav: Me tab active (Pro = gold star-person icon, Citizen = standard person icon).

Differences between Pro and Citizen frames:
Pro: gold avatar border, CONNECT PRO badge, no upgrade banner, 6 badges, ochre credits number.
Citizen: ghost avatar border, CONNECT CITIZEN badge, upgrade banner visible, 2 badges, no gold credits.

Output 2 frames side by side.
```

---

## 9. MEMBER SETTINGS (5 Tabs)

---

### PROMPT 9 — Member Settings All 5 Tabs

```
Senior mobile UX/UI designer — Moveee Connect member settings. iOS, 390×844px.
White background for settings screens. Brand tokens as per design system.

Design 5 frames — one per settings tab content.
ALL 5 frames share the same header + tab selector at top.

SHARED HEADER (56px + status bar):
Back chevron (ink, 44px target) left + "Settings" DM Sans 15px bold ink centred.

SHARED TAB SELECTOR (horizontal scroll, 44px height, white bg, ghost bottom border):
5 tabs: Profile · Directory · Interests · Newsletters · Security
Active: ochre 2px underline full tab width, ink DM Sans 14px bold.
Inactive: no underline, mute DM Sans 14px.

FRAME 1 — PROFILE TAB:
AVATAR ROW (centred, 24px top, 24px bottom):
Avatar XL 96px (Pro gold border) + camera icon overlay bottom-right (20px, white bg circle, ink icon)
"Edit photo" DM Sans 12px ochre centred below.

FORM SECTIONS (16px horizontal padding, 24px between sections):
All inputs: 52px height, ghost 1px border, radius-lg 6px, white fill, DM Sans 15px ink, 16px padding.
Label above each: DM Sans 11px mute, 4px gap.

Identity: Display Name ("Zara Mensah" filled) · Email ("zara@example.com" read-only, lock icon, ghost text) · Phone (+44 prefix select + number)
About: WhatsApp · Gender (segmented: Woman | Man | Non-binary | Prefer not to say — active = ink fill white) · Date of Birth (date input "Jan 15, 1994")
Location: Nationality (flag emoji + "Nigerian" dropdown) · Country of Residence · City ("Lagos") · Occupation ("Creative Director")

"Save changes" primary ochre button, full width, 52px, sticky bottom, 16px margin.

FRAME 2 — DIRECTORY TAB:
TOGGLE ROW (52px height, 16px padding, ghost bottom border):
"Show in member directory" DM Sans 15px ink left + toggle switch (ochre when ON) right.
"Let other members find and connect with you." DM Sans 12px mute, below label.

BIO TEXTAREA (5-line min, 280 char limit):
"Bio" label above. Below field: "127 / 280" JetBrains Mono 11px mute right-aligned.
Placeholder: "Tell the community about yourself, your work, and your cultural interests..."

DISCIPLINES GRID (3-column chip grid, 8px gap, 16px horizontal padding):
"Select up to 5 disciplines" DM Sans 11px mute above grid.
12 discipline chips (radius-full, 32px height, 10px horizontal padding, DM Sans 13px bold):
Selected (3 of them): ink fill white text.
Unselected: ghost border, ink-soft text.
Chips: Music Production · Visual Art · Fashion · Film · Architecture · Photography · Literature · Visual Design · Tech · Food Culture · Sport · Travel

SOCIAL LINKS SECTION:
"Social Links" DM Sans 14px bold ink.
Instagram: input with "@" prefix left (grey, DM Sans 14px ink-soft). Placeholder: "yourhandle"
LinkedIn: "linkedin.com/" prefix label + input.
Website: 🌐 icon + input placeholder "https://yoursite.com"

FRAME 3 — INTERESTS TAB:
"What are you into?" Fraunces 20px bold ink, 16px top padding.
"Select at least 3 to personalise your Connect feed." DM Sans 14px mute, 4px below.

INTERESTS GRID (2 columns, 12px gap, 16px horizontal padding, 16px top margin):
16 interest cards (each: white fill, radius-xl, shadow-card, 72px height):
Row layout: emoji 22px left (16px padding) + label DM Sans 14px bold ink middle + checkmark right.
SELECTED state (6 of 16): ochre left border 3px, paper-deep bg #F5F5F5, ochre ✓ right.
UNSELECTED: white bg, no left border, ghost ○ right.

Interests: 🎵 Music · 🎬 Film · 👗 Fashion · 🏗️ Architecture · 📸 Photography · 
✍️ Literature · 🍽️ Food & Drink · 🌍 Travel · 🎨 Visual Art · 🖥️ Tech Culture · 
⚽ Sport · 🏙️ Visual Design · 🎪 Live Music · 🔊 Music Production · 🌙 Nightlife · 💡 Ideas

"Save interests" primary ochre button, sticky bottom.

FRAME 4 — NEWSLETTERS TAB:
"Your Newsletters" Fraunces 20px bold ink.
"Manage which newsletters you receive." DM Sans 14px mute, 4px below.

2 newsletter cards (white fill, radius-xl, shadow-card, 16px padding, 16px gap):

CARD 1 — GetMeLit (subscribed ON):
Top-right: "SUBSCRIBED" DM Sans 9px bold uppercase success green pill.
"GetMeLit" DM Sans 16px bold ink.
"Weekly cultural digest — African arts, diaspora news, and cultural moments." DM Sans 13px ink-soft, 8px below.
Toggle switch right: ON = ochre. (On 2nd row, space-between)
"✉️ Next issue: Monday" JetBrains Mono 10px mute below toggle row.

CARD 2 — Culture Drop (subscribed OFF):
No "SUBSCRIBED" badge.
"Culture Drop" DM Sans 16px bold ink.
"Monthly curated drops from across the cultural landscape." DM Sans 13px ink-soft.
Toggle: OFF = ghost.
"✉️ Monthly · First Monday" JetBrains Mono 10px mute.

FRAME 5 — SECURITY TAB:
"Security" Fraunces 20px bold ink.

SECTION — PASSWORD (white card, radius-xl):
"Change Password" row: 52px height, lock icon 20px ochre left + "Change Password" DM Sans 15px ink + chevron right.
"We'll send a reset link to your email" DM Sans 12px mute, 12px left indent, 8px below row.
Ghost bottom border below row.

SECTION — PASSKEYS (white card, radius-xl, 16px padding):
Section header: "Passkeys" DM Sans 15px bold ink + "Log in faster with biometrics" DM Sans 12px mute below.
16px gap.

PASSKEY LIST (2 existing passkeys):
Each row: fingerprint icon 24px ochre left + device name DM Sans 14px bold ink + 
  "Added Jun 9, 2026" JetBrains Mono 11px mute below device name + 
  trash delete icon 16px ghost right.
Row 1: "iPhone 15 Pro"
Row 2: "MacBook Pro"
8px ghost bottom border between rows.

"+ Add a new passkey" — ghost button, ink border 1px, full width, 44px height, radius-lg.
Left: fingerprint icon 16px. DM Sans 14px ink. Centred.
16px top margin.

Output 5 frames in a horizontal row. All share the same top header and tab bar.
```

---

## 10. WALLET, PERKS & COUPONS

---

### PROMPT 10A — Wallet Screen

```
Senior mobile UX/UI designer — Moveee Connect Wallet. iOS, 390×844px.
Brand tokens: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.

FRAME 1 — WALLET HISTORY:
Header (white, 56px + status bar): back chevron + "Wallet" centred.

BALANCE HERO (white card, 24px padding, centred):
"CULTURE POINTS" DM Sans 9px bold uppercase mute, 2px letter-spacing.
"1,240" Fraunces 48px bold ink (large).
"≈ £30.25 GBP" DM Sans 14px gold, 4px below balance.
Stats row: "385 REP" · ghost divider · "48 CR today" — JetBrains Mono 12px mute each, 24px top margin.

TABS (44px, white bg, ghost bottom border):
"History" (active, ochre underline) · "Cash Out"

SECTION HEADER "June 2026" — JetBrains Mono 10px bold uppercase mute, paper-warm bg, 32px height, 16px padding. Sticky.

LEDGER ROWS (white bg, 64px height, 16px padding, ghost bottom border):
Left circle icon (32×32px): 
  Earn = ochre fill, white ↑ arrow 16px.
  Spend = paper-deep fill, ink ↓ arrow 16px.
Middle text: source label DM Sans 14px bold ink + date JetBrains Mono 11px mute below.
Right: amount DM Sans 16px bold (positive = ochre "+20 CR", negative = error red "–50 CR").

Show 6 entries:
+50 CR · Referral bonus · Jun 9
+10 CR · Post published · Jun 8
–50 CR · Perk redeemed · Jun 7
+20 CR · Post validated · Jun 7
+30 CR · Daily trivia · Jun 6
+10 CR · Post published · Jun 5

FRAME 2 — WALLET CASH OUT (GBP):
Same header + balance hero + tabs (Cash Out tab active).

White card, 24px padding:
"Credits to cash out" DM Sans 12px mute label.
Large credit input: Fraunces 32px bold ink centred. "500" shown.
Slider below: full width, 8px height radius-full. Ghost track, ochre fill (40%), ochre circle thumb 20px.
"Min 100 · Max 1,240" JetBrains Mono 10px mute centred.

FEE CARD (paper-deep bg, radius-lg, 16px padding, 16px margin top):
"30% processing fee" DM Sans 13px mute.
"You receive: 350 CR equivalent" DM Sans 15px bold ink, 8px below.
"≈ £8.55 GBP" DM Sans 14px gold.

CURRENCY SEGMENTED CONTROL: "GBP · USD · NGN" — active GBP: ink fill white. Others: ghost border. Radius-lg each, 40px height.

BANK FORM (24px top margin, inputs with labels as per standard style):
Account Name (text input) · Account Number (8 digits) · Sort Code (XX-XX-XX format)

"Request Cash Out" primary ochre button, full width, 52px.
"Processed within 5 business days. 30% fee applies." DM Sans 11px mute centred, 12px margin.

Output 2 frames side by side.
```

---

### PROMPT 10B — Perks & Coupons

```
Senior mobile UX/UI designer — Moveee Connect Perks and Coupons. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.

FRAME 1 — PERKS BROWSE:
Header: back chevron + "Partner Perks" centred.
Balance banner (paper-warm bg, 64px, 16px padding): "1,240 CR available" DM Sans 15px bold ink + ★ ochre icon. Right: "Earn more →" DM Sans 12px ochre.

SUCCESS BANNER (white card, radius-lg, success green left border 3px, 16px padding):
"✅ Perk redeemed!" DM Sans 14px bold ink + "You spent 150 CR. Balance: 1,090 CR" 13px mute.
"View in Coupons →" DM Sans 13px ochre right-aligned.

PERK GRID (2 columns, 12px gap, 16px horizontal padding):
6 perk cards:

PERK CARD (white fill, radius-xl, shadow-card, 16px padding):
Partner logo area: 50×30px placeholder (grey rect) centred.
Partner name: DM Sans 10px bold uppercase mute, centred.
Perk title: DM Sans 14px bold ink, 2 lines, centred, 8px top margin.
Cost badge: ochre fill pill (#C5491F), "150 CR" DM Sans 11px bold white, centred, 8px top margin.
Redeem button: "Redeem" ochre fill, full width, 36px height, radius-full, DM Sans 13px bold white. 8px top.

SOLD OUT CARD variant: same but button replaced by "Sold Out" chip (ghost border, ghost text, 36px). Card slightly muted.

6 cards: 
- Bisi Ceramics — "10% off any purchase" — 150 CR — Available
- Aké Books — "Free delivery on first order" — 80 CR — Available
- The Tuck Shop — "Free snack with purchase" — 50 CR — Sold Out
- Lagos Creative Hub — "Day pass for coworking" — 200 CR — Available
- House of Zuri — "15% off fashion items" — 120 CR — Available
- Afrofutures Mag — "1 year digital subscription" — 300 CR — Available

FRAME 2 — COUPONS (active coupon):
Header: back chevron + "My Coupons" centred.

COUPON CARD (white fill, radius-xl, shadow-card, 24px padding, 16px horizontal margin):
TOP SECTION (24px padding):
"BISI CERAMICS" DM Sans 9px bold uppercase mute.
"10% off any purchase" DM Sans 18px bold ink, 8px top margin.
"ACTIVE" success green pill badge, right-aligned in same row as title.
"Expires in 3 days · 14 Jun 2026" DM Sans 12px warning orange (#E65100), 8px below.

QR CODE AREA (centred, 200×200px):
Large QR code pattern (detailed checkered vector QR placeholder).
"Show this code in-store" JetBrains Mono 10px mute, 8px below QR.
"BISI-X7K29M" JetBrains Mono 16px bold ink, 2px letter-spacing, centred.

TICKET PERFORATION LINE: dashed ghost line full width (segment: 4px dash, 4px gap), 20px vertical margin.

FOOTER SECTION (16px padding):
"Present this QR code to the partner at point of sale to receive your discount." DM Sans 12px mute.

EXPIRED COUPON CARD (below active card):
Same structure. QR in greyscale. "EXPIRED" error red pill badge. "Expired Jun 5, 2026" mute text.
QR code area: 50% opacity, diagonal "EXPIRED" watermark text in ghost colour across QR area.

FRAME 3 — COUPONS EMPTY STATE:
Header same. Full paper-warm bg.
Centred content:
QR code outline icon (64px, ghost colour, outline only).
"No coupons yet" Fraunces 22px bold ink, 20px top margin.
"Redeem partner perks to get your coupons here." DM Sans 14px mute, centred, max 260px wide.
"Browse Perks →" primary ochre button (280px max width, 52px height, pill), 24px top margin.

Output 3 frames.
```

---

## 11. MEMBER DIRECTORY & PUBLIC PROFILES

---

### PROMPT 11 — Directory & Profile Screens

```
Senior mobile UX/UI designer — Moveee Connect member directory. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.

FRAME 1 — MEMBER DIRECTORY:
Header: back chevron + "Member Directory" centred.

SEARCH BAR (white bg, 48px, 16px padding, ghost bottom border):
🔍 icon 16px mute left + "Search by name, discipline or city" DM Sans 14px ghost + filter icon right.

FILTER CHIPS (horizontal scroll, 44px):
"All Disciplines ▼" ghost border pill + "All Locations ▼" ghost border pill.
Active filter example (third pill): "🎵 Music Production ✕" ochre fill white text.

"128 members" JetBrains Mono 10px mute, 16px padding, 8px top margin.

MEMBER GRID (2 columns, 12px gap, 16px horizontal padding):
8 member cards showing variety:

MEMBER CARD (white fill, radius-xl, shadow-card, 12px padding, centred layout):
Avatar MD (44px) centred: Pro = gold border, Citizen = ghost border.
Display name: DM Sans 13px bold ink, centred, 1 line max.
Handle: "@handle" JetBrains Mono 10px mute, centred.
Location: "📍 Lagos, NG" DM Sans 11px mute, centred.
Disciplines: max 2 chips (ghost border, radius-full, 9px DM Sans bold, 4px ver 8px hor padding, 4px gap).
  Third replaced by "+2 more" ghost chip.
Social icons: row centred (IG, LinkedIn, Globe — 28px each, ghost colour, 8px gap).

Show 8 varied cards:
1. "Adaeze Obi" @adaeze.obi · Lagos NG · Pro (gold border) · Photography + Visual Art
2. "Kemi Adeyemi" @kemiad · London UK · Citizen · Music Production + Fashion
3. "Seun Falowo" @seunf · Accra GH · Pro · Film + Literature + Architecture (show +1)
4. "Nkechi Eze" @nkechieze · New York US · Citizen · Visual Design + Tech
5. "Kofi Mensah" @kofi.m · Toronto CA · Pro · Architecture + Photography
6. "Yewande Olao" @yewande · Nairobi KE · Citizen · Literature + Food Culture
7. "Marcus T." @marcust · London UK · Citizen · Music Production + Live Music
8. "Zara Mensah" @zaramensah · Lagos NG · Pro · Fashion + Creative Direction +2

FRAME 2 — PUBLIC PROFILE:
HERO AREA (full bleed, 200px): paper-warm + ochre gradient pattern (warm abstract).
Floating back button: white 40px circle, ink chevron, top-left.

PROFILE CARD (white bg, radius-2xl top corners, starts 40px overlap with hero):
AVATAR: XL 96px, centred, Pro gold border, overlapping hero.
Share button: ghost circle 36px, top-right corner of card, share icon.

IDENTITY (centred, 16px horizontal padding):
CONNECT PRO badge (gold pill, ★, centred), 12px top margin.
"Adaeze Obi" Fraunces 24px bold ink, centred, 8px below.
"@adaeze.obi" DM Sans 13px mute centred.
"Creative Director + Photographer" DM Sans 14px ink-soft centred, 4px below.
"📍 Lagos, Nigeria" DM Sans 12px mute centred.
"Member since March 2024" JetBrains Mono 10px ghost centred.

BADGES SHELF (horizontal scroll, 16px top margin):
Chips (ghost border, radius-full, 6px ver 10px hor padding, 8px gap):
🎨 Taste Maker · 💎 Gem Hunter · ✍️ Culture Contributor · 🔥 Hot Take · 📸 Visual

SOCIAL LINKS (centred row, 24px gap, 16px top margin):
3 icon circles (36×36px, paper-deep bg, radius-full): 📷 · 💼 · 🌐 (ghost icons, tappable)

TABS (44px, ghost bottom border, 16px top margin):
"Community" (active, ochre underline) · "Portfolio"

COMMUNITY POSTS LIST (3 mini-cards, 16px horizontal padding, 8px gap):
Each: white fill, radius-lg, 16px padding.
Template badge + "3 days ago" JetBrains Mono 10px mute right.
Content: DM Sans 13px ink-soft, 2 lines.
Reaction counts: ❤️ 12 · 🔥 5 · 👏 8 — JetBrains Mono 10px mute.

"Load more posts" ghost link, centred, 12px mute, 16px margin.

---

FRAME 3 — PUBLIC PROFILE (PORTFOLIO TAB):
Identical hero, profile card, identity block, badge shelf, social links, and tabs row as Frame 2.
TABS: "Community" (ghost, no underline) · "Portfolio" (active, ochre underline, bold).

PORTFOLIO GRID (2-column masonry, 16px horizontal padding, 8px column gap, 12px row gap):

Row 1:
LEFT ITEM — "Zaria Music Visuals" series:
  Image: 160×120px, radius-md, warm-toned photo placeholder (concert/stage lighting).
  Title: "Zaria Music Visuals" DM Sans 13px bold ink, 6px top margin, 1-line.
  Year: "2024" JetBrains Mono 11px mute, 2px below.

RIGHT ITEM — "Lagos Street Portraits":
  Image: 160×120px, radius-md, street photography placeholder.
  Title: "Lagos Street Portraits" DM Sans 13px bold ink, 6px top.
  Year: "2023" JetBrains Mono 11px mute.

Row 2:
LEFT ITEM — "Afrofusion Lookbook":
  Image: 160×120px, radius-md, fashion editorial placeholder.
  Title: "Afrofusion Lookbook" DM Sans 13px bold ink.
  Year: "2024" JetBrains Mono 11px mute.

RIGHT ITEM — "Eko Creative Studio":
  Image: 160×120px, radius-md, studio/workspace placeholder.
  Title: "Eko Creative Studio" DM Sans 13px bold ink.
  Year: "2022" JetBrains Mono 11px mute.

Row 3:
LEFT ITEM — "Festival Grounds":
  Image: 160×120px, radius-md, festival crowd placeholder.
  Title: "Festival Grounds" DM Sans 13px bold ink.
  Year: "2023" JetBrains Mono 11px mute.

RIGHT ITEM — "+ Add work" CTA tile:
  Border: 1.5px dashed #C8BFB0, radius-md, 160×120px, paper-warm bg.
  Centred vertically: + icon 20px ghost colour, "Add portfolio item" DM Sans 12px mute 6px below.
  (Shown only when viewing own profile — include it in the design to illustrate the owner state.)

"6 items" JetBrains Mono 10px mute centred caption below the grid, 12px top margin.

---

Output 3 frames side by side.
```

---

### PROMPT 11B — Directory Entry Detail Page (All 11 Entry Types)

```
Senior mobile UX/UI designer — Moveee Connect directory entry detail. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D, ghost #C8BFB0, mute #7A6F5C.
Typography: Fraunces (display), DM Sans (body/UI), JetBrains Mono (labels/meta).
Radius system: sm=2px, md=4px, lg=6px, xl=12px, 2xl=20px, full=9999px.
Shadow-card: 0px 1px 3px rgba(20,17,13,0.08), 0px 1px 2px rgba(20,17,13,0.04).
All cards: white #FFFFFF fill + shadow-card.

ENTRY TYPE BADGE COLOURS:
  Person → bg #B38238 (gold), text white
  Place → bg #2E7D32 (forest), text white
  Food → bg #C5491F (ochre), text white
  Book → bg rgba(120,53,15,0.10) (sepia tint), text #78350F
  Film → bg #1976D2 (blue), text white
  Genre → bg #6B48A8 (purple), text white
  Movement → bg #6B48A8 (purple), text white
  Artwork → bg #1976D2 (blue), text white
  Concept → bg #3A342B (dark warm), text white
  Fashion → bg #7B1FA2 (deep purple), text white
  TV Series → bg #00695C (teal), text white

SHARED SHELL (identical across all 11 frames — render once, vary content):

NAV HEADER (56px, white bg, shadow-card bottom):
  Back chevron 24px ink left, 16px inset.
  Title: entry name truncated, Fraunces 18px bold ink, centred.
  "⋯" overflow icon right 24px ink, 16px inset (Share / Report / Improve).

HERO IMAGE (220px full width, radius 0):
  Warm-toned placeholder photo relevant to entry type.
  TYPE BADGE (bottom-left, 12px inset, 12px bottom):
    Pill 28px — emoji + "TYPE NAME" JetBrains Mono 10px bold uppercase — colours per table above.
    Backdrop blur 8px behind badge.

ENTRY HEADER (white bg, 20px top padding, 16px horizontal, shadow-card bottom):
  TITLE: Fraunces 22px bold ink. 1–2 lines max.
  CITY + COUNTRY: "📍 Lagos, Nigeria" DM Sans 13px mute, 4px below title.
  INTEREST TAG CHIPS (horizontal scroll, 8px top, 8px gap):
    Ghost-border pills, radius-full, DM Sans 11px bold mute, 6px ver 10px hor padding.
    e.g. "🎵 Music Production" · "🎨 Visual Art" — 2–3 chips typical.
  EXCERPT: DM Sans 14px ink-soft, 3 lines, 12px top, 16px bottom padding.

BODY SECTION (white card, 8px top margin, 16px padding, shadow-card):
  "About" DM Sans 13px bold mute uppercase letter-spacing, 12px bottom.
  Full body text DM Sans 14px ink-soft, 4 paragraphs collapsed to 3 lines initially.
  "Read more" ochre link if >3 lines — tap expands inline (chevron rotates). DM Sans 13px.

INFOBOX CARD (white card, 8px top margin, 16px padding, shadow-card):
  "Details" DM Sans 13px bold mute uppercase letter-spacing, 12px bottom.
  Rows of key–value pairs (12px gap between rows):
    Left: DM Sans 12px mute label. Right: DM Sans 13px ink value (or chips for multi-value).
  [Content varies per entry type — see per-frame specs below.]

SELECTED WORKS / GALLERY (white card, 8px top margin, shadow-card):
  Section title "Works" / "Portfolio" / "Episodes" — DM Sans 13px bold mute uppercase, 16px padding.
  Horizontal scroll row, 16px left padding, 12px gap:
    Each tile: 100×130px, white fill, radius-lg, shadow-card.
    Top: 100×72px image placeholder, radius-md top corners.
    Bottom (10px padding): title DM Sans 12px bold ink 1 line, year JetBrains Mono 10px ghost.
  Show 4 tiles (last partially visible).
  [Skip this section for types with no portfolio content — Concept, Genre, Movement.]

COMMUNITY REVIEWS (white card, 8px top margin, shadow-card):
  Header row (16px horizontal, 16px vertical):
    "Community Reviews" DM Sans 13px bold ink left.
    AGGREGATE STAR (right): ★★★★½ in gold + "4.6" JetBrains Mono 13px bold gold + "(24)" DM Sans 11px mute.
  Horizontal scroll row of review mini-cards (16px left padding, 12px gap):
    Review card (200px wide, white fill, radius-lg, shadow-card, 12px padding):
      Reviewer row: 32px avatar (ghost border) + "Display Name" DM Sans 12px bold ink + "· 2d" JetBrains Mono 10px mute right.
      Stars: ★★★★★ gold, 4px top.
      Review text: DM Sans 12px ink-soft, 3 lines, 6px top.
  Show 3 review cards (third partially visible).
  "Write a review" ghost-border button (full-width, 44px, radius-lg, DM Sans 13px bold ink) 12px below scroll row, 16px horizontal margin.

UPCOMING EVENTS (white card, 8px top margin, shadow-card):
  "Upcoming Events" DM Sans 13px bold mute uppercase, 16px padding.
  2 event rows (12px horizontal padding, 8px gap):
    Event row (white fill, radius-lg, 12px padding, shadow-card):
      Left: date block 44×44px paper-warm, radius-md — month JetBrains Mono 9px mute uppercase / day Fraunces 18px bold gold.
      Right (10px gap): event title DM Sans 13px bold ink 1 line / "📍 Venue Name · Lagos" DM Sans 12px mute / "Free" or "₦2,000" DM Sans 12px ochre.
      Right edge: chevron 16px ghost.

RELATED ENTRIES (white card, 8px top margin, 16px padding, shadow-card):
  "Related" DM Sans 13px bold mute uppercase, 12px bottom.
  Horizontal scroll chips (8px gap):
    Each chip (ghost border, radius-full, 10px ver 14px hor padding, 8px gap):
      Type emoji + "Entry Name" DM Sans 12px bold ink.
  Show 4–5 chips.

IMPROVE CTA (white card, 8px top margin, 16px padding, shadow-card, 24px bottom margin):
  "Know more about this entry?" DM Sans 13px ink-soft centred, 8px bottom.
  "Suggest an edit" ghost-border button (full-width, 44px, radius-lg, DM Sans 13px bold mute).

---

FRAME 1 — PERSON ENTRY ("Fela Kuti"):
HERO: Black-and-white vintage concert photograph, warm-sepia tinted.
TYPE BADGE: "👤 PERSON" gold bg.
TITLE: "Fela Kuti"
CITY: "📍 Lagos, Nigeria"
INTEREST TAGS: "🎵 Live Music" · "🎵 Music Production" · "💡 Ideas"
EXCERPT: "Pioneer of Afrobeat, activist, and multi-instrumentalist. One of the most influential musicians of the 20th century and a relentless voice for the oppressed."

INFOBOX — PERSON:
  Occupation: "Musician · Activist · Bandleader"
  Disciplines: "Afrobeat · Jazz · Funk"
  Born: "15 Oct 1938, Abeokuta, Nigeria"
  Era active: "1960s – 1997"
  Awards: "Grammy Lifetime Achievement (2024, posthumous)" DM Sans 13px ink.
  Also known as: "Fela Anikulapo Kuti" DM Sans 13px ink mute italic.

SELECTED WORKS (4 tiles): "Zombie (1977)" · "Expensive Shit (1975)" · "Beast of No Nation (1989)" · "Teacher Don't Teach Me Nonsense (1986)"
UPCOMING EVENTS: "Felabration 2026" Oct 15 · "Shrine Night: Afrobeat Tribute" Nov 03
RELATED ENTRIES: 👤 Tony Allen · 🎵 Afrobeat (Genre) · 👤 Hugh Masekela · 💡 Pan-Africanism

---

FRAME 2 — PLACE ENTRY ("New Afrika Shrine"):
HERO: Warm-lit outdoor venue — corrugated roof, palm trees, warm crowd.
TYPE BADGE: "📍 PLACE" forest green bg.
TITLE: "New Afrika Shrine"
CITY: "📍 Lagos, Nigeria"
INTEREST TAGS: "🎵 Live Music" · "🍽 Food & Drink" · "🌙 Nightlife"
EXCERPT: "Legendary open-air music venue founded by Fela Kuti in 1970 and revived by his sons. The spiritual home of Afrobeat in Lagos."

INFOBOX — PLACE:
  Venue type: "Live Music Venue"
  Address: "1 Gbemisola St, Allen, Ikeja, Lagos"
  Opening hours: "Fri–Sun, 6pm – 4am"
  Admission: "₦2,000 – ₦5,000"
  Website: "afrikakulture.com" (ochre link)
  Capacity: "~5,000 standing"

SELECTED WORKS (shows "Events" tiles): "Felabration 2025" · "Afrobeat Friday Live" · "New Year's Eve 2025" · "Shrine Sessions Vol. 4"
UPCOMING EVENTS: "Felabration 2026" Oct 15 · "Shrine Friday Night" Jul 12
RELATED ENTRIES: 👤 Fela Kuti · 👤 Seun Kuti · 🎵 Afrobeat · 📍 Freedom Park Lagos

---

FRAME 3 — FOOD ENTRY ("Jollof Rice"):
HERO: Vivid close-up of smoky Nigerian jollof rice in a party tray.
TYPE BADGE: "🍽 FOOD" ochre bg.
TITLE: "Jollof Rice"
CITY: "📍 Lagos, Nigeria" (origin)
INTEREST TAGS: "🍽 Food & Drink" · "🌍 Travel" · "🍜 Street Food"
EXCERPT: "The beloved West African one-pot rice dish cooked in a rich tomato and pepper base. The centrepiece of every celebration from Lagos to London."

INFOBOX — FOOD:
  Cuisine type: "West African · Nigerian"
  Best for: "Celebrations · Family dining · Street food"
  Price range: "₦1,000 – ₦8,000 depending on setting"
  Common at: "Parties, 'joints', upscale restaurants"
  Dietary notes: "Usually contains meat; vegetarian versions available"
  Also known as: "Party jollof · Smoky jollof"

SELECTED WORKS (shows "Where to eat" tiles): "Buka by Ilé" · "Yellow Chilli" · "Ofada Boy" · "Mama Put, Surulere"
UPCOMING EVENTS: "Jollof Wars Lagos 2026" Aug 10 · "West African Food Festival" Sep 05
RELATED ENTRIES: 🍽 Egusi Soup · 🍽 Suya · 📍 Lagos Island Market · 👤 Chef Tolu Eros

---

FRAME 4 — BOOK ENTRY ("Things Fall Apart"):
HERO: Warm editorial flat-lay of the book with African kente fabric backdrop.
TYPE BADGE: "📚 BOOK" sepia tint bg text #78350F.
TITLE: "Things Fall Apart"
CITY: "📍 Ogidi, Anambra (Setting)"
INTEREST TAGS: "📖 Literature" · "💡 Ideas" · "🌍 Travel"
EXCERPT: "Chinua Achebe's landmark debut novel depicting life in pre-colonial Igboland through the tragic story of Okonkwo — one of the most read African novels globally."

INFOBOX — BOOK:
  Author: "Chinua Achebe"
  Year published: "1958"
  Genre: "Literary Fiction · Postcolonial"
  Publisher: "William Heinemann (UK) · Anchor Books (US)"
  Themes: "Colonialism · Identity · Tradition · Masculinity"
  Editions: "50+ languages worldwide"

SELECTED WORKS (shows "Also by Achebe" tiles): "No Longer at Ease" · "Arrow of God" · "Anthills of the Savannah" · "There Was a Country"
UPCOMING EVENTS: "Achebe at 95: Literary Retrospective" Sep 21 · "Things Fall Apart: Lagos Book Club" Aug 08
RELATED ENTRIES: 👤 Chinua Achebe · 📖 Postcolonial Literature · 📚 Arrow of God · 💡 Pan-Africanism

---

FRAME 5 — FILM ENTRY ("Half of a Yellow Sun"):
HERO: Cinematic still — two figures in warm dusk light, 1960s Nigerian setting.
TYPE BADGE: "🎬 FILM" blue bg.
TITLE: "Half of a Yellow Sun"
CITY: "📍 Nigeria (setting)"
INTEREST TAGS: "🎬 Independent Film" · "📖 Literature" · "💡 Ideas"
EXCERPT: "Biyi Bandele's adaptation of Chimamanda Ngozi Adichie's Booker-longlisted novel about love and war during the Biafran conflict. Starring Thandie Newton and Chiwetel Ejiofor."

INFOBOX — FILM:
  Director: "Biyi Bandele"
  Year: "2013"
  Genre: "Drama · Historical"
  Cast: "Thandie Newton · Chiwetel Ejiofor · Anika Noni Rose"
  Runtime: "111 min"
  Streaming: "Netflix · Prime Video"

SELECTED WORKS (shows related films tiles): "Purple Hibiscus (2022)" · "Lionheart (2018)" · "76 (2016)" · "The Milkmaid (2020)"
UPCOMING EVENTS: "Nigerian Cinema Retrospective" Oct 12 · "AFRIFF Lagos Screening" Nov 01
RELATED ENTRIES: 👤 Chimamanda Ngozi Adichie · 📚 Half of a Yellow Sun (Book) · 🎬 Nollywood · 👤 Chiwetel Ejiofor

---

FRAME 6 — GENRE ENTRY ("Afrobeat"):
HERO: Abstract warm graphic — layered vinyl record rings in ochre and gold on ink.
TYPE BADGE: "🎵 GENRE" purple bg.
TITLE: "Afrobeat"
CITY: "📍 Lagos, Nigeria (Origin)"
INTEREST TAGS: "🎵 Live Music" · "🎵 Music Production" · "💡 Ideas"
EXCERPT: "Genre pioneered by Fela Kuti in the late 1960s, blending Yoruba music with jazz, funk, and psychedelic rock — characterised by complex rhythms, extended compositions, and political lyrics."

INFOBOX — GENRE:
  Origin: "Lagos, Nigeria"
  Era: "Late 1960s – present"
  Characteristics: "Polyrhythmic percussion · Extended jams · Horns · Political themes"
  Key artists: "Fela Kuti · Tony Allen · Seun Kuti · Femi Kuti · Orlando Julius"
  Influenced by: "Jazz · Highlife · Funk · Yoruba traditional music"
  Do not confuse with: "'Afrobeats' (contemporary pop genre)" mute italic

[No SELECTED WORKS section — Genre type.]
UPCOMING EVENTS: "Afrobeat Night: Afrika Shrine" Jul 12 · "Felabration 2026" Oct 15
RELATED ENTRIES: 👤 Fela Kuti · 👤 Tony Allen · 🎵 Highlife · 🎵 Afrobeats · 📍 New Afrika Shrine

---

FRAME 7 — MOVEMENT ENTRY ("Negritude"):
HERO: Warm sepia editorial — stacked vintage books and handwritten manuscripts.
TYPE BADGE: "🌊 MOVEMENT" purple bg.
TITLE: "Negritude"
CITY: "📍 Paris, France (Origin)"
INTEREST TAGS: "📖 Literature" · "💡 Ideas" · "🌍 Travel"
EXCERPT: "Intellectual and literary movement founded in the 1930s by Francophone African and Caribbean writers asserting the value and beauty of Black African cultural identity in response to French colonialism."

INFOBOX — MOVEMENT:
  Origin: "Paris, France"
  Era: "1930s – 1960s"
  Key figures: "Aimé Césaire · Léopold Sédar Senghor · Léon-Gontran Damas"
  Philosophy: "Reclaiming African cultural identity; resistance to assimilation"
  Related movements: "Harlem Renaissance · Pan-Africanism · Black Consciousness"
  Languages: "French"

[No SELECTED WORKS section — Movement type.]
UPCOMING EVENTS: "Negritude: A Retrospective" Nov 20 · "African Literary Heritage Symposium" Sep 14
RELATED ENTRIES: 👤 Aimé Césaire · 👤 Léopold Sédar Senghor · 💡 Pan-Africanism · 🌊 Harlem Renaissance

---

FRAME 8 — ARTWORK ENTRY ("Ori Olokun Sculpture"):
HERO: Clean gallery-lit photograph of a terracotta Yoruba sculpture on white plinth.
TYPE BADGE: "🖼 ARTWORK" blue bg.
TITLE: "Ori Olokun"
CITY: "📍 Ile-Ife, Nigeria"
INTEREST TAGS: "🎨 Visual Art" · "💡 Ideas" · "📸 Photography"
EXCERPT: "Bronze ritual head depicting Yoruba deity Olokun, excavated in Ile-Ife. One of the finest examples of 12th–15th century Ife bronze casting — a masterwork of African art history."

INFOBOX — ARTWORK:
  Artist / Origin: "Ife bronze casters (anon.), 12th–15th century"
  Medium: "Brass (lost-wax casting)"
  Collection: "Ife Museum of Natural History, Ile-Ife"
  Dimensions: "29.5 cm height"
  Period: "Ife Civilisation, 12th–15th century"
  Significance: "Considered the finest Ife bronze; Picasso cited Ife art as an influence"

SELECTED WORKS (shows "Other Ife bronzes" tiles): "Bronze Head of an Oni" · "Tada Seated Figure" · "Obalufon Mask" · "Ife Pot" (tile format with warm photo placeholder)
UPCOMING EVENTS: "African Art History at the BM" Aug 22 · "Ife Bronzes: British Museum Tour" Oct 05
RELATED ENTRIES: 🖼 Benin Bronzes · 💡 Yoruba Art · 📍 Ife Museum · 🌊 Ife Civilisation

---

FRAME 9 — FASHION ENTRY ("Ankara Print"):
HERO: Bold editorial — vibrant ankara fabric rolls in orange, blue, yellow pattern.
TYPE BADGE: "👗 FASHION" deep purple bg.
TITLE: "Ankara Print"
CITY: "📍 West Africa (Origin)"
INTEREST TAGS: "👗 Fashion & Streetwear" · "🎨 Visual Art" · "🌍 Travel"
EXCERPT: "Vibrant wax-resist printed cotton fabric that has become one of the defining visual languages of contemporary African identity — from Lagos to London runways."

INFOBOX — FASHION:
  Also known as: "African wax print · Dutch wax print · Chitenge"
  Era / origin: "19th century (Dutch manufacture → West African adoption)"
  Region: "West & Central Africa (especially Nigeria, Ghana, Senegal, Cameroon)"
  Key figures: "Deola Sagoe · Lisa Folawiyo · Duro Olowu · Ozwald Boateng"
  Materials: "100% cotton, wax resist-dyed"
  Characteristics: "Symmetric patterns, vivid colour, symbolic motifs"

SELECTED WORKS (shows designer collections tiles): "Lisa Folawiyo SS26" · "Deola Sagoe Couture" · "Vlisco Heritage 2024" · "ARISE Fashion Week 2026"
UPCOMING EVENTS: "Lagos Fashion Week 2026" Oct 24 · "Accra Fashion Week" Nov 08
RELATED ENTRIES: 👤 Lisa Folawiyo · 👤 Duro Olowu · 👗 Agbada · 📍 Balogun Market Lagos

---

FRAME 10 — CONCEPT ENTRY ("Afrofuturism"):
HERO: Vivid digital art — astronaut silhouette in traditional African fabric against cosmic background.
TYPE BADGE: "💡 CONCEPT" dark warm bg.
TITLE: "Afrofuturism"
CITY: "📍 United States (coined)"
INTEREST TAGS: "💡 Ideas" · "🎬 Independent Film" · "🎨 Visual Art"
EXCERPT: "Cultural aesthetic, philosophy, and science fiction framework exploring the intersection of African diaspora culture with technology, futurism, and speculative imagination."

INFOBOX — CONCEPT:
  Field: "Cultural theory · Art · Literature · Music · Film"
  Origin era: "1990s (coined by Mark Dery, 1993)"
  Key thinkers: "Kodwo Eshun · Alondra Nelson · Nettrice Gaskins"
  Key figures: "Sun Ra · Octavia Butler · Janelle Monáe · Wanuri Kahiu · Kendrick Lamar"
  Related concepts: "Pan-Africanism · Solarpunk · Black Speculative Fiction"
  Flagship works: "Black Panther · Pumzi · The Space Traders"

[No SELECTED WORKS section — Concept type.]
UPCOMING EVENTS: "Afrofuturism Symposium Lagos" Sep 28 · "Future Africa: Digital Art Fair" Nov 12
RELATED ENTRIES: 🌊 Negritude · 👤 Octavia Butler · 🎬 Black Panther · 💡 Pan-Africanism · 👤 Janelle Monáe

---

FRAME 11 — TV SERIES ENTRY ("Kizzy"):
HERO: Vintage warm-toned TV still — period drama set, 1970s aesthetic.
TYPE BADGE: "📺 TV SERIES" teal bg.
TITLE: "Roots: The Next Generations"
CITY: "📍 United States"
INTEREST TAGS: "🎬 Independent Film" · "📖 Literature" · "💡 Ideas"
EXCERPT: "Landmark 1979 ABC miniseries sequel to Roots, tracing the Haley family from Reconstruction through to Alex Haley's research journey to The Gambia — one of American television's most-watched events."

INFOBOX — TV SERIES:
  Creator / Showrunner: "Alex Haley (source) · Produced by ABC"
  Network / Platform: "ABC · Now streaming on Prime Video"
  Air dates: "1979 (original) · 2016 (remake)"
  Genre: "Historical Drama · Miniseries"
  Cast: "James Earl Jones · Marlon Brando · Henry Fonda · Georg Stanford Brown"
  Seasons / Episodes: "1 season · 7 episodes"

SELECTED WORKS (shows "Related series" tiles): "Roots (1977)" · "Queen (1993)" · "Alex Haley's Queen" · "Underground (2016)"
UPCOMING EVENTS: "Roots 50th Anniversary Screening" Jan 23 · "Black TV History Panel" Feb 14
RELATED ENTRIES: 👤 Alex Haley · 📚 Roots (Book) · 🌊 Civil Rights Movement · 🎬 12 Years a Slave

---

Output: 3-column × 4-row grid (11 frames total, last cell empty or filled with component reference sheet).
All frames share identical shell structure — vary only HERO, TITLE, CITY, TAGS, EXCERPT, INFOBOX fields, and WORKS content.
Entry type badge on HERO uses the colour table defined above.
```

---

### PROMPT 11C — "Discover" Tab + Feed Reference Chips (Directory removed from inline feed)

```
Senior mobile UX/UI designer — Moveee Connect, Discover surface. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D, ghost #C8BFB0,
mute #7A6F5C, success #2D6A4F. DM Sans + Fraunces + JetBrains Mono.

CONTEXT FOR THE DESIGNER: Directory entries (Person, Place, Food, Book, Film, Genre, Movement,
Artwork, Concept, Fashion, TV Series — see Prompt 11B) are evergreen knowledge-graph content.
They do not belong inline in the Connect Feed, because the feed is a reverse-chronological "what's
new" timeline and a static reference entry has no honest "new" moment except the day it was added.
This prompt makes three changes:
  1. A new "Discover" entry point — a dedicated browsable/filterable home for all Directory
     content, replacing inline feed exposure as the primary way to find it.
  2. Directory entries are removed from the general inline feed pool entirely, EXCEPT on the
     calendar day they were added — shown then with an explicit "🆕 New to Discover" badge instead
     of a normal age-based timestamp, so the "new" framing stays honest.
  3. When a community post references a Directory entry (`linkedDirectoryId` already exists on
     FeedItem), show a small reference chip on that post instead of a separate standalone card —
     contextual exposure, not a floating unrelated card.

This is a pre-launch IA change — there is no existing "Discover" entry point to preserve
compatibility with. Use a header icon, not a 6th bottom tab (the app already uses 5: Connect,
Magazine, Games, Events, Me) — adding a tab would require a broader nav redesign out of scope here.

⚠️ DEV ANNOTATION REQUIREMENT — IMPORTANT FOR HANDOFF:
Add inline HTML/JSX comments at the points below using <!-- DEV: <note> --> (HTML) or
{/* DEV: <note> */} (JSX), placed directly above the relevant component — not bundled at the
top of the file.

  1. Above the Discover entry-point icon in the feed header:
     "DEV: New nav entry point, no existing route. Add as a stack screen reachable from a header
     icon (compass/sparkle), not a bottom tab — bottom nav stays at 5 tabs. Existing
     MemberDirectoryScreen (app users) is unrelated — do not confuse with this Discover screen,
     which browses culture_directory CPT content, not member profiles."
  2. Above the Discover grid's data fetch:
     "DEV: Fetch from the existing class-culture-directory.php search/list endpoint, same one
     DirectoryGrid.tsx (web) already uses. No new backend endpoint needed for browse/search;
     region + type filters map to existing _entry_city and entry-type taxonomy/post params."
  3. Above the filter chips (type + region):
     "DEV: Entry types = the 11 from Prompt 11B (person/place/food/book/film/genre/movement/
     artwork/concept/fashion/tv-series). Region filter should query distinct _entry_city values —
     there is no separate region/country taxonomy today, so this may need a lightweight new param
     on the search endpoint (city contains / country grouping) — flag to backend if not present."
  4. Above the feed's filtering logic that excludes Directory items:
     "DEV: Remove type==='directory' from the general unified feed pool in unified-feed.ts, EXCEPT
     where dateAdded === today — gate that exception on the post's publish date, not a separate
     flag (none exists yet)."
  5. Above the reference chip on community post cards:
     "DEV: Renders only when FeedItem.linkedDirectoryId is present (field already exists — see
     SubmitPost.tsx DirectorySearch integration). Tapping routes to the existing Directory Entry
     Detail page (Prompt 11B), passing linkedDirectoryId's slug — no new API call needed beyond
     what that detail page already fetches by slug."
  6. Above the "New to Discover" badge variant:
     "DEV: Badge replaces the normal '· 3h ago' timestamp element only when the post's publish
     date is the current calendar day — compare dates client-side, no new field required."

---

FRAME 1 — DISCOVER ENTRY POINT (feed header icon, annotated inset):
Small inset crop of the existing Connect Feed header (Prompt 3): show a 🧭 compass icon, 24px ink,
added to the right side of the header, left of the notification bell, 12px gap. Label below the
crop: "New: Discover icon — opens the Discover tab stack" DM Sans 11px mute italic.

---

FRAME 2 — DISCOVER HOME (browse + search):
HEADER (64px, white bg, shadow-card bottom): back chevron + "Discover" Fraunces 20px bold ink
  centred + 🔍 search icon right, 16px inset.

SEARCH BAR (appears on tapping the search icon — shown active in this frame, 48px, white bg,
  ghost bottom border, 16px horizontal padding): 🔍 icon + "Search people, places, books, films…"
  DM Sans 14px ghost placeholder.

FILTER ROW (44px, horizontal scroll, white bg, ghost bottom border, 16px padding, 8px gap):
  "All Types ▼" ghost pill + "All Regions ▼" ghost pill + active example: "🍽 Food ✕" ochre fill
  white text pill (radius-full, 32px height, DM Sans 13px bold) — opens the filter sheet (Frame 4)
  on tap.

RECENTLY ADDED RAIL (16px top, horizontal scroll, 16px left padding, 12px gap):
  "Recently Added to Discover" DM Sans 12px bold mute uppercase, 16px padding bottom 8px.
  3 compact cards (140px wide, white fill, radius-lg, shadow-card, no image — text-forward,
  consistent with the "evergreen reference, not a photo wall" principle):
    Type emoji + type label (colour per Prompt 11B's badge table) DM Sans 10px bold uppercase.
    Title DM Sans 13px bold ink, 2 lines. City DM Sans 11px mute, 4px top.
    "🆕 Added today" JetBrains Mono 9px ochre, 6px top (only on the newest card; the other two
    show "Added 2d ago" / "Added 4d ago" in ghost mute instead).

BROWSE GRID (2 columns, 12px gap, 16px horizontal padding, 16px top):
  ENTRY CARD (white fill, radius-lg, shadow-card, 12px padding, no image at grid scale):
    Top: type emoji + type label, colour-coded per Prompt 11B's badge system, DM Sans 10px bold
      uppercase.
    Title: DM Sans 14px bold ink, 2 lines.
    City: "📍 Lagos, Nigeria" DM Sans 11px mute, 4px top.
    Bottom row (8px top, ghost top border, 6px top padding): star rating "★★★★☆ 4.2" JetBrains
      Mono 10px gold (if reviews exist) left + interest tag chip (1 only, ghost border, 9px) right.

  Show 8 cards spanning a mix of types: Fela Kuti (Person) · New Afrika Shrine (Place) · Jollof
  Rice (Food) · Things Fall Apart (Book) · Afrobeat (Genre) · Ankara Print (Fashion) · Half of a
  Yellow Sun (Film) · Ori Olokun (Artwork).

  "1,204 entries" JetBrains Mono 10px mute, centred, 16px top margin below the grid.

---

FRAME 3 — FEED TREATMENTS (component states, isolated):

STATE A — "New to Discover" inline card (rare, same-day-added Directory entries only):
  Same compact card style as the Recently Added rail above, but full-width in the feed context
  (white fill, radius-xl, shadow-card, 16px margin): type badge + title + city + excerpt 2 lines +
  "🆕 New to Discover" JetBrains Mono 10px bold ochre badge where a timestamp would normally sit +
  "Explore →" DM Sans 12px bold ochre link, bottom-right.

STATE B — Reference chip on a community post (most common path):
  Take Card 2 from Prompt 3 (Community — Hidden Gem) and add, directly below the content text and
  above the image grid: a single reference chip (ghost border, radius-full, 6px ver 10px hor
  padding, inline-flex, max-content width): type emoji + "Peckham Vinyl Exchange" DM Sans 12px bold
  ink + small chevron 12px ghost. Tapping routes to that entry's Detail page (Prompt 11B).
  Label this state: "Reference chip — renders only when linkedDirectoryId is present."

---

FRAME 4 — DISCOVER FILTER SHEET (bottom sheet):
SCRIM: ink @ 40%. SHEET (white bg, radius-2xl top corners, ~60% screen height, shadow-card):
  Drag handle 36×4px ghost pill, centred, 8px top.
  "Filter Discover" Fraunces 18px bold ink + "Reset" ochre DM Sans 13px right, 16px padding.

  SECTION — TYPE (16px padding, 12px bottom): "Type" DM Sans 12px bold mute uppercase, 10px
    bottom. Chip grid (wrap, 8px gap, colour accent dot per chip matching Prompt 11B's badge
    table): Person · Place · Food · Book · Film · Genre · Movement · Artwork · Concept · Fashion ·
    TV Series — ghost border inactive, ink fill white text active.

  SECTION — REGION (16px padding, ghost top border, 12px bottom): "Region" DM Sans 12px bold
    mute uppercase, 10px bottom. Search input (44px, ghost border) "Search city or country" +
    quick chips below: "Nigeria" (selected) · "Ghana" · "UK" · "USA" · "Pan-African" — same chip
    style.

  SECTION — SORT (16px padding, ghost top border): "Sort by" DM Sans 12px bold mute uppercase,
    10px bottom. 3 chips: "Most Relevant" (selected) · "Recently Added" · "Highest Rated".

  FOOTER (sticky, white bg, shadow-card top, 16px padding): "Show 142 entries" primary ochre
    button, full width, radius-full, 52px height, DM Sans 15px bold white.

---

Output 4 frames: Entry Point inset, Discover Home, Feed Treatments, Filter Sheet.
```

---

## 12. NOTIFICATIONS & ANALYTICS

---

### PROMPT 12A — Notifications Screen

```
Senior mobile UX/UI designer — Moveee Connect notifications. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white bg, ochre #C5491F, gold #B38238, ink #14110D.

FRAME 1 — NOTIFICATIONS LIST:
Header: back chevron + "Notifications" centred + "Mark all read" DM Sans 13px ochre right.

SECTION HEADER "Today" — JetBrains Mono 9px bold uppercase mute, paper-warm bg sticky header, 32px height.

NOTIFICATION ROWS (white bg, 72px min height, 16px padding, ghost bottom border):
Row layout: icon circle 40px left + text block middle + time right + optional left border accent.

5 rows — today section:

1. CREDIT EARNED:
  Circle: ochre fill, white coin/star icon 18px.
  Left border: 3px ochre.
  "💰 +20 Culture Points!" DM Sans 14px bold ink.
  "Your post was validated by the editorial team." DM Sans 13px mute, 4px below.
  "2h ago" JetBrains Mono 10px mute, right-aligned.
  Unread indicator: none (already read).

2. BADGE UNLOCKED (UNREAD):
  Circle: gold fill (#B38238), white trophy icon.
  Left border: 3px gold.
  "🏆 New badge unlocked!" DM Sans 14px bold ink.
  "You earned the 'Taste Maker' badge 🎨" DM Sans 13px mute.
  "5h ago" mono mute right.
  Unread dot: ochre 8px circle right side, above time.

3. COMMENT RECEIVED (UNREAD):
  Circle: success green fill, white speech bubble icon.
  No left border (different type).
  "💬 New comment on your post" DM Sans 14px bold ink.
  "Kemi replied: 'This is the spot I needed! 🔥'" DM Sans 13px mute, 1 line truncated.
  "Yesterday" mono mute right.
  Unread dot: ochre 8px.

4. PERK EXPIRING:
  Circle: warning orange fill (#E65100), white clock icon.
  Left border: 3px warning orange.
  "⏰ Perk expiring soon" DM Sans 14px bold ink.
  "Your Bisi Ceramics coupon expires in 2 days." DM Sans 13px mute.
  "Yesterday" mono mute.

5. SYSTEM:
  Circle: ghost fill, ink bell icon.
  "📢 3 new events in your city" DM Sans 14px bold ink.
  "Upcoming events in Lagos this week." DM Sans 13px mute.
  "2 days ago" mono mute.

SECTION HEADER "Earlier" — same style.

3 older rows (all read, standard styling, no left borders, slightly less contrast):
  — cashout_approved: "✅ Cash out approved" · "Your 500 CR request was approved." · "Jun 8"
  — post_validated: "📝 Post earned +10 CR" · "Your Hidden Gem post was featured." · "Jun 7"
  — badge_unlocked: "💎 Badge unlocked: Gem Hunter" · "You've found 5 hidden gems!" · "Jun 6"

FRAME 2 — EMPTY STATE:
Header same. Paper-warm background.
Centred: bell outline icon 64px ghost + "You're all caught up" Fraunces 22px bold ink + 
"New activity will appear here." DM Sans 14px mute.

Output 2 frames.
```

---

### PROMPT 12B — Analytics Dashboard

```
Senior mobile UX/UI designer — Moveee Connect member analytics. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.

Header: back chevron + "My Analytics" centred.

SUMMARY STATS (white card, 4-column row, 16px padding, dividers between cols):
Credits: "1,240" DM Sans 22px bold ochre + "CREDITS" 9px uppercase mute below
Reputation: "385" DM Sans 22px bold gold + "REPUTATION" label
Posts: "12" DM Sans 22px bold ink + "POSTS" label
Badges: "6" DM Sans 22px bold ink + "BADGES" label

SECTION 1 — Credits chart:
Section label row: "Credits · Last 30 Days" DM Sans 14px bold ink left + "June 2026" DM Sans 12px mute right.
White card, 16px padding, radius-xl.

BAR CHART (SVG, full width, 160px height inside card):
X-axis: date labels every ~7 days (JetBrains Mono 10px mute): Jun 1 · Jun 8 · Jun 15 · Jun 22 · Jun 30
Y-axis: 0 · 20 · 40 · 60 (JetBrains Mono 10px mute, left side)
Grouped bars: ~30 day columns, each day = 2 bars side by side:
  Left bar (earned): ochre #C5491F fill — varying heights (0 to max)
  Right bar (spent): rust red #9B3C2A fill — shorter heights on redemption days
  Bar width: 6px each, 2px gap between pair, 8px gap between day groups
Show realistic data variation — some days 0, some days 50+ earned.
Legend: ochre square "Earned" · rust square "Spent" — DM Sans 11px mute, 8px gap, centred below chart.

SECTION 2 — Reputation chart:
"Reputation · Last 6 Months" label row.
White card, 16px padding, radius-xl.

LINE CHART (SVG, full width, 140px height):
Area fill below line: gold (#B38238) at 12% opacity.
Line stroke: gold #B38238, 2px.
Data points: Jan 80, Feb 120, Mar 165, Apr 220, May 310, Jun 385.
Dots: gold filled circles 5px radius at each data point.
X-axis: month labels Jan · Feb · Mar · Apr · May · Jun (JetBrains Mono 10px mute).
Y-axis: 0 · 100 · 200 · 300 · 400 (JetBrains Mono 10px mute, left).
Tooltip on "Jun" data point: vertical dashed line + gold pill tooltip "385 REP" above.

SECTION 3 — Top Posts:
"Top Posts · Last 90 days" label row.
White card, 16px padding, radius-xl.

Ranked list (3 items, 12px gap, ghost bottom border between):
Each: row layout —
  Rank: DM Sans 14px bold ochre "1." (24px wide)
  Content: post preview DM Sans 13px ink-soft 2 lines truncated
  Engagement: JetBrains Mono 10px mute right "❤️42 · 💬12"

#1: "Finally found the dopest vinyl shop in South London. If you know, you know..."
#2: "Thread on the rise of Afro-Indigenous fashion movements in 2026..."
#3: "This underground suya spot changed my life. Full review 🔥"

Output 1 full-length scrollable screen frame.
```

---

## 13. OVERLAYS & MICRO-INTERACTIONS

---

### PROMPT 13 — Modals, Sheets & Toast Notifications

```
Senior mobile UX/UI designer — Moveee Connect overlay components. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white fills, ochre #C5491F, ink #14110D, DM Sans + Fraunces.
Show all components on a large canvas with a dimmed background (ink #14110D at 45% opacity).

Create 9 overlay components, labelled clearly:

1. BOTTOM SHEET — New Post Template Picker (450px height):
White fill, radius-2xl (20px) top corners only, shadow-modal.
Drag handle: 32×4px ghost pill, 12px from top, centred.
"Choose a post type" DM Sans 15px bold ink, 20px padding top.
3×3 grid of template cards (72×72px each, 12px gap, 16px horizontal padding):
  Each: white fill, radius-xl, shadow-card, centred:
    Emoji 24px + label DM Sans 12px bold ink below (8px gap)
    Active state: ochre 2px border
  Row 1: ✏️ Post · 💎 Hidden Gem · 💬 Cultural Take
  Row 2: 🍽️ Food Review · 🎨 Creative Showcase · 📊 Poll
  Row 3: 🗺️ Itinerary · 📅 Event · 💬 Quote
"Cancel" ghost link DM Sans 14px mute centred, 20px below grid.
Safe area padding at bottom.

2. BOTTOM SHEET — Report Post (280px height):
"Report this post" DM Sans 16px bold ink, 24px padding.
3 radio rows (52px height, 16px padding, ghost bottom border):
  Radio circle left (24px, ghost border — selected = ochre fill) + label DM Sans 15px ink.
  Options: "Spam or misleading" · "Harassment or hate speech" · "Inappropriate content"
"Submit report" primary ochre button, full width, 48px, 20px padding.

3. CONFIRM REDEEM DIALOG (centred, 320×230px):
White fill, radius-2xl, shadow-modal.
Centred content, 24px padding:
"Redeem this perk?" DM Sans 16px bold ink.
"10% off at Bisi Ceramics" Fraunces 18px ink, 8px below.
"This will spend 150 CR. Balance: 1,240 → 1,090 CR" DM Sans 13px mute, 8px below.
Button row (2 equal columns, 12px gap, 16px top margin):
  "Cancel" white fill, ink border, radius-full. "Confirm" ochre fill, white text, radius-full. Both 48px height.

4. SIGN OUT CONFIRM DIALOG:
"Sign out?" DM Sans 16px bold ink centred.
"You'll need to sign in again to access your account." DM Sans 14px mute centred.
Button row: "Cancel" secondary · "Sign out" destructive (#C62828 fill, white text).

5. PASSKEY PROMPT SHEET (280px height):
White fill, radius-2xl top corners, drag handle.
Fingerprint icon (iOS-style): 48×48px, face ID / fingerprint outline in system blue (#007AFF), centred.
"Moveee Connect" DM Sans 12px mute centred.
"Sign in with Face ID" DM Sans 16px bold ink centred, 12px below icon.
"Use your biometric to log in securely." DM Sans 14px mute centred, 8px below.
"Cancel" ghost link DM Sans 14px mute centred, 16px below.
System blue "Use Face ID" is NOT shown — this is the Moveee-branded wrapper, Apple UI handles the biometric trigger.

6. IMAGE LIGHTBOX OVERLAY (full screen, black bg):
Full black fill, 390×844px.
Floating top bar: × close white circle (40px) top-left + "2 / 5" white JetBrains Mono 13px top-right.
Centred image: 390×340px approx, object-fit contain.
Bottom dots: 5 dots row, centred — active = white 8px circle, inactive = white 30% opacity 6px circle. 20px from bottom.

7. TOAST NOTIFICATIONS — 4 variants (horizontal row, 343px wide each):
White fill, radius-lg, shadow-modal, 16px padding, row layout.
Progress bar at bottom (full width, 4px height, radius-full): fills left-to-right as auto-dismiss timer counts.

  SUCCESS: success green left border 4px, green circle ✓ icon 20px left + "Post published! You earned +10 CR" DM Sans 14px bold ink. Progress bar: success green.
  ERROR: error red left border, red × icon + "Something went wrong. Please try again." Progress bar: error red.
  INFO: ochre left border, ℹ️ icon + "Copied to clipboard" DM Sans 14px. Progress bar: ochre.
  WARNING: warning orange left border, ⚠️ icon + "Your Bisi Ceramics perk expires in 2 days!" DM Sans 14px. Progress bar: warning orange.

8. "FOR YOU" EXPLAINER SHEET (first-time, 240px height):
White fill, radius-2xl top corners, drag handle.
"✦" ochre symbol, DM Sans 24px bold, centred.
"For You feed" Fraunces 20px bold ink, centred, 8px below.
"We rank your feed based on your interests and engagement. The more you post and react, the better it gets." DM Sans 14px mute centred, max 280px, 12px below title.
"Set up your interests →" primary ochre button, max 280px, 48px height, 20px top margin.
"Maybe later" DM Sans 13px ghost link centred, 12px below button.

9. COMMUNITY POST CONTEXT MENU (appears on long-press, inline sheet 200px width):
Appears near tapped card, white fill, radius-xl, shadow-modal. 4 rows:
  📋 Copy link · DM Sans 14px ink · 44px height
  🔖 Save post · 14px ink · 44px
  📤 Share · 14px ink · 44px
  ⚑ Report · 14px error red · 44px (destructive action)
Ghost divider before Report row.

Arrange all 9 components on a large canvas with the dimmed app background behind them. 4-column layout.
```

---

## 14. DARK MODE & SKELETON STATES

---

### PROMPT 14A — Dark Mode Core Screens

```
Senior mobile UX/UI designer — Moveee Connect dark mode. iOS, 390×844px.
Produce 8 frames showing the full app in dark mode. All layouts, spacing, and typography
are IDENTICAL to light mode — only colours change. Do not redesign any layout.

════════════════════════════════════════════
DARK MODE COLOUR SYSTEM (use exact values — no generic greys)
════════════════════════════════════════════
Page background:   #1A1612  (warm near-black, brown undertone — NOT pure black)
Card surface:      #242018  (primary card/row fill)
Elevated surface:  #2D2820  (modals, bottom sheets, toasts)
Subtle surface:    #201C15  (section headers, sticky bars)
Border:            #3D3530  (all separators, card outlines)
Text primary:      #F3ECE0  (inverted paper-warm)
Text secondary:    #9E9288  (warm muted)
Text ghost:        #5C5349  (timestamps, placeholders)
Ochre accent:      #D4603A  (active states, FAB, CTAs — slightly brighter than light mode)
Gold accent:       #C9963F  (Pro badge, reputation — slightly brighter)
Success:           #4ADE80
Error:             #F87171
Warning:           #FB923C

TYPE BADGE DARK ADJUSTMENTS (keep pill shape, adjust bg for dark surface):
  Editorial:   bg #3B2820  text #E8836A
  Community:   bg #1F2F1F  text #6FCF8A  left border #4A9F4A
  Happening:   bg #1F1E38  text #8E88E8
  Directory:   bg #162920  text #3A9E7E
  Quote:       bg #29203A  text #B585D0
  For You:     outline #C9963F, text #C9963F (no fill)

════════════════════════════════════════════
FRAME 1 — CONNECT FEED (dark mode)
════════════════════════════════════════════
Background: #1A1612
Header (56px, #201C15 fill, bottom border #3D3530):
  "moveee" Fraunces 18px bold #F3ECE0 + "connect" DM Sans 9px #C9963F below.
  Right: bell icon #9E9288 (unread dot #D4603A), avatar 32px circle.

Filter pill row (horizontal scroll, #1A1612 bg):
  Active pill: #D4603A fill, #F3ECE0 text.
  Inactive pill: #2D2820 fill, #3D3530 border, #9E9288 text.

Show 4 feed cards (all white cards → #242018 fill, very subtle shadow on dark):

CARD A — EDITORIAL (no type badge visible, pure separator treatment):
  Image placeholder: 16:9, radius-md, dark warm grey #2D2820.
  Section label: #5C5349 mono 9px.
  Headline: #F3ECE0 Fraunces 17px bold, 2 lines.
  Subhead/excerpt: #9E9288 DM Sans 13px.
  Author + date row: #5C5349 mono 10px.
  Separator bottom: #3D3530.

CARD B — COMMUNITY POST (full white card → #242018):
  Left border: 3px solid #4A9F4A (community green dark mode).
  Header: 40px circle ghost avatar (#2D2820) + "Kemi Adeyemi" #F3ECE0 14px bold + "@kemi" #9E9288.
  COMMUNITY badge: bg #1F2F1F text #6FCF8A.
  Body text: #9E9288 13px 3 lines.
  Reaction row: outline icons, counts #5C5349.
  Report ⚑: #5C5349.

CARD C — HAPPENING (event card):
  Image: full-width, 180px, dark placeholder, radius-md.
  HAPPENING badge: bg #1F1E38 text #8E88E8.
  PRO ONLY overlay (if applicable): #C9963F semi-transparent.
  Event name: #F3ECE0 15px bold.
  Meta row: calendar + location icons #5C5349, text #9E9288.
  RSVP pill: #D4603A fill, #F3ECE0 text.

CARD D — QUOTE card:
  " decorative mark: #4A403A (muted gold-brown).
  Quote text: #F3ECE0 Fraunces 16px italic, 3 lines.
  Author: #9E9288 13px.
  Reaction bar: outline icons, #5C5349 counts.

FAB: #D4603A fill, white + icon.
Bottom nav: #201C15 fill, top border #3D3530.
  Active tab: #D4603A icon + label.
  Inactive tabs: #5C5349.

════════════════════════════════════════════
FRAME 2 — ARTICLE DETAIL (dark mode)
════════════════════════════════════════════
Full background: #1A1612.

Hero image: full width × 280px, dark warm-toned placeholder, radius-2xl top corners.
Back button: #2D2820 circle, #F3ECE0 chevron.

Content card (#242018 fill, radius-2xl top corners, -24px overlap on image):
  Eyebrow: #D4603A mono 9px uppercase.
  Headline: #F3ECE0 Fraunces 24px bold, 2 lines.
  Subheading: #9E9288 DM Sans 14px, 1 line.
  Author row: 36px ghost circle (#2D2820) + name #F3ECE0 + date #5C5349.
  Rule: #3D3530.
  Body copy (4 paragraphs): #9E9288 DM Sans 16px, line-height 1.7.
  Pull quote block: left border #D4603A 3px, bg #201C15, text #F3ECE0 Fraunces italic 17px.
  Second body paragraph.
  In-line image: full width, 200px, dark placeholder, radius-md.

Bottom action bar (64px, #2D2820 fill, top border #3D3530):
  ❤️ Save · 🔗 Share · 🔖 Bookmark — icon buttons #9E9288, active = #D4603A.

════════════════════════════════════════════
FRAME 3 — MEMBER DASHBOARD (dark mode)
════════════════════════════════════════════
Background: #1A1612.

HERO CARD (#242018, radius-xl, 16px margin):
  Avatar: 80px circle, #C9963F border (Pro gold), dark placeholder inside.
  CONNECT PRO badge: #C9963F fill, #1A1612 text.
  Display name: #F3ECE0 Fraunces 20px bold.
  @username: #9E9288 13px.
  Passkey banner: #2D2820 fill, left border #D4603A 3px, text #9E9288, "Set up now" #D4603A.

STATS BAR (4 columns, #242018 card, radius-lg, dividers #3D3530):
  Balance: "450 CR" #D4603A 18px bold + "Balance" #5C5349 10px mono.
  Reputation: "280" #C9963F 18px bold + "Rep" #5C5349.
  Tier: "Taste Maker" #F3ECE0 14px bold + "Rank" #5C5349.
  Streak: "7🔥" #F3ECE0 14px bold + "Day streak" #5C5349.

BADGES SHELF:
  Chips: #2D2820 fill, #3D3530 border, emoji + #9E9288 label text.

QUICK LINKS LIST (#242018 card):
  6 rows (52px, #3D3530 separator):
  Icon circle (#2D2820 fill, #9E9288 icon) + label #F3ECE0 14px + #D4603A count badge or #5C5349 chevron.
  Example rows: 🔔 Notifications (3 unread badge) · 🛍 My Perks · 💳 Wallet · 📊 Analytics · ⚙️ Settings · 🌙 Appearance.

════════════════════════════════════════════
FRAME 4 — NOTIFICATIONS (dark mode)
════════════════════════════════════════════
Background: #1A1612.
Header (56px, #201C15, border #3D3530): back chevron #F3ECE0 + "Notifications" centred #F3ECE0 + "Mark all read" #D4603A right.

Section header "Today" — #5C5349 mono 9px bold uppercase, #201C15 bg, 32px sticky.

5 notification rows (#242018 fill, 72px min-height, #3D3530 bottom border):

Row 1 — CREDIT EARNED (read):
  Icon circle: #D4603A fill, white coin icon.
  Left accent border: 3px #D4603A.
  Title: "💰 +20 Culture Points!" #F3ECE0 14px bold.
  Body: "Your post was validated." #9E9288 13px.
  Time: "2h ago" #5C5349 mono 10px.

Row 2 — BADGE UNLOCKED (unread):
  Icon circle: #C9963F fill, white trophy icon.
  Left border: 3px #C9963F.
  Title: "🏆 New badge unlocked!" #F3ECE0 14px bold.
  Body: "You earned 'Taste Maker'" #9E9288.
  Time + unread dot: 8px #D4603A circle right.

Row 3 — COMMENT RECEIVED (unread):
  Icon circle: #4ADE80 fill, white speech bubble icon.
  Title: "💬 New comment on your post" #F3ECE0 14px bold.
  Body: "Kemi: 'This is the spot! 🔥'" #9E9288, truncated.
  Unread dot: #D4603A.

Row 4 — PERK EXPIRING:
  Icon circle: #FB923C fill, white clock icon.
  Left border: 3px #FB923C.
  Title: "⏰ Perk expiring soon" #F3ECE0 14px bold.
  Body: "Your Bisi Ceramics coupon expires in 2 days." #9E9288.

Row 5 — SYSTEM:
  Icon circle: #2D2820 fill, #9E9288 bell icon.
  Title: "📢 3 new events in your city" #F3ECE0 14px bold.
  Body: "Upcoming events in Lagos this week." #9E9288.

Section header "Earlier" + 2 more read rows in lower contrast (#5C5349 text, no left borders).

════════════════════════════════════════════
FRAME 5 — EVENTS / HAPPENINGS SCREEN (dark mode)
════════════════════════════════════════════
Background: #1A1612.
Header (56px, #201C15, border #3D3530): "Events" #F3ECE0 Fraunces 20px bold centred + filter icon right #9E9288.

Category filter strip (horizontal scroll, 36px pills):
  Active: #D4603A fill, #F3ECE0 text.
  Inactive: #2D2820 fill, #3D3530 border, #9E9288 text.
  Pills: All · Music · Food · Art · Film · Sport

3 event cards (full-width, #242018 fill, radius-xl, 12px vertical gap):

CARD 1 — Featured (Pro gated):
  Image: full-width 200px, dark warm-toned concert photo placeholder, radius-xl top.
  PRO ONLY pill: #C9963F fill, #1A1612 text, lock icon, bottom-right of image.
  HAPPENING badge: bg #1F1E38 text #8E88E8 — top-left over image.
  Name: "Afro Nation Lagos" #F3ECE0 Fraunces 17px bold, 16px top padding.
  Date/time: 📅 #9E9288 13px.
  Location: 📍 "Eko Atlantic · Victoria Island" #9E9288 13px.
  Admission: "₦25,000 – ₦80,000" #9E9288 12px mono.
  RSVP pill: #D4603A fill, #F3ECE0 "RSVP" 13px bold.

CARD 2 — Free event (open to all):
  Image: 160px, dark gallery opening placeholder.
  Name: "Afrocentric Art Pop-Up" #F3ECE0 17px bold.
  Date, location, admission (FREE): same pattern.
  RSVP pill: #D4603A.

CARD 3 — Citizen tier event:
  Similar structure.

════════════════════════════════════════════
FRAME 6 — SHOP PRODUCT LISTING (dark mode)
════════════════════════════════════════════
Background: #1A1612.
Header: "Shop" #F3ECE0 Fraunces 20px bold centred + cart icon + count badge #D4603A.

Search bar: #242018 fill, #3D3530 border, radius-full, 🔍 #5C5349 + "Search products…" #5C5349.

Category scroll: same pill pattern as events.

2-column product grid (8px gap, 16px horizontal padding):

CARD — "Ankara Print Tote Bag":
  Image: 160×160px, #2D2820 fill, radius-xl.
  PRO badge (if Pro price active): gold pill top-right.
  Product name: #F3ECE0 DM Sans 13px bold, 2 lines.
  Price block:
    Pro price: "₦8,500" #C9963F 14px bold.
    Regular: "₦12,000" #5C5349 13px strikethrough.
  "Add to cart" pill: #D4603A fill, #F3ECE0 13px bold.

CARD — "Move Culture Sweat" (regular pricing, no Pro badge):
  Same structure, single price #F3ECE0 14px bold, no strikethrough.

CARD — "Silver Cowrie Cuffs" (EARLY ACCESS label):
  EARLY ACCESS badge: #C9963F bg, #1A1612 text, top-left of image.
  Rest same structure.

CARD — "Kente Cap" (out of stock):
  Image: same, add opacity 0.5 to image.
  "Out of stock" label: #5C5349 italic 12px below name.
  Add to cart pill: #2D2820 fill, #5C5349 text (disabled).

════════════════════════════════════════════
FRAME 7 — PUBLIC PROFILE (dark mode)
════════════════════════════════════════════
Background: #1A1612.

HERO AREA (200px): warm abstract gradient on dark — #1A1612 to #242018 with subtle ochre glow.
Back button: #242018 circle, #F3ECE0 chevron.

PROFILE CARD (#242018 fill, radius-2xl top corners, overlapping hero):
  Avatar: 96px, #C9963F border (Pro).
  Share button: #2D2820 ghost circle, #9E9288 icon.
  CONNECT PRO badge: #C9963F fill, #1A1612 text, ★.
  Name: "Adaeze Obi" #F3ECE0 Fraunces 24px bold.
  @handle, occupation, city: #9E9288 and #5C5349.
  Member since: #5C5349 mono 10px.

BADGES SHELF (horizontal scroll):
  Chips: #2D2820 fill, #3D3530 border, emoji + #9E9288 label.

SOCIAL LINKS: 3 icon circles (#2D2820 fill, #9E9288 icons).

TABS (44px, bottom border #3D3530):
  "Community" active: #D4603A underline, #F3ECE0 bold.
  "Portfolio": #5C5349.

3 community post mini-cards (#2D2820 fill, radius-lg, 16px padding):
  Template badge (dark-adjusted) + time #5C5349 + content #9E9288 + reaction counts #5C5349.

════════════════════════════════════════════
FRAME 8 — GAMES HUB + TRIVIA QUESTION (dark mode)
════════════════════════════════════════════
Split view — show two side-by-side phone frames at 50% width each, or stack vertically.

FRAME 8A — GAMES HUB:
Background: #1A1612.
Header: "Games" #F3ECE0 Fraunces 20px bold centred.
"Daily streak: 7 🔥" JetBrains Mono 10px #9E9288 centred.

2×2 game card grid (12px gap):
Each card (#242018 fill, radius-xl):
  Top half: icon illustration area (#2D2820 warm placeholder, radius-xl).
  Bottom half (16px padding): game name #F3ECE0 14px bold + "Play today" #9E9288 12px.
  PRO lock: #C9963F badge top-right if gated.
  "Completed ✓": #4ADE80 badge if already played.
Cards: Trivia · Who Said It · Crossword (dimmed if Pro-only) · Sudoku (dimmed).

FRAME 8B — TRIVIA QUESTION (active state):
Background: #1A1612.
Header: back chevron #F3ECE0 + "Daily Trivia" #F3ECE0 Fraunces 18px + streak badge.
Progress bar: 3px, #3D3530 track, #D4603A fill, question 3/10 shown.
Category chip: #2D2820 fill, #9E9288 "Music & Culture".

Question card (#242018 fill, radius-xl, 24px padding):
  "Which decade saw Afrobeats go global?" #F3ECE0 Fraunces 20px bold.

4 answer options (#2D2820 fill, radius-lg, border #3D3530, 56px height, 12px padding):
  Option A: unselected — #3D3530 border, "A  The 1990s" #F3ECE0.
  Option B: unselected.
  Option C: selected CORRECT — #4ADE80 border, #1F2F1F bg, "C  The 2010s" #4ADE80 bold, ✓ icon right.
  Option D: unselected, greyed #5C5349.

Explanation card (#242018 fill, radius-lg, #D4603A left border 3px):
  "Afrobeats reached global charts primarily in the 2010s with artists…" #9E9288 13px.

"Next question →" pill: #D4603A fill, #F3ECE0.

════════════════════════════════════════════
Output 8 frames in a 2-column grid (4 rows × 2 columns).
Label each frame with its name in JetBrains Mono 11px below the phone.
```

---

### PROMPT 14B — Loading & Skeleton States

```
Senior mobile UX/UI designer — Moveee Connect skeleton loading states. iOS, 390×844px.
Light mode. Background: paper-warm #F3ECE0.

════════════════════════════════════════════
SKELETON COLOUR SYSTEM
════════════════════════════════════════════
Skeleton base:      #E0D9CE  (warm grey — slightly darker than paper-warm bg)
Skeleton highlight: #EDE7DC  (used for shimmer sweep animation peak)
Skeleton avatar:    #D8D1C6  (slightly darker, for circular placeholders)
Card background:    #FFFFFF  (white, same as real cards)
All skeleton shapes: rounded rectangles. Use radius-md (8px) for content blocks,
radius-full for avatars, avatar badges, and pill-shaped elements.
Skeleton image placeholders: radius-md (8px), slightly darker #D8D1C6.

SHIMMER ANNOTATION (place once on the frame, not per card):
Banner label in JetBrains Mono 10px mute at top of frame:
"Shimmer: gradient sweeps L→R over base colour, 1.4s ease-in-out loop.
 Base #E0D9CE → Highlight #EDE7DC → Base #E0D9CE."

════════════════════════════════════════════
FRAME 1 — CONNECT FEED SKELETON
════════════════════════════════════════════
Header bar (56px, white fill): 
  Left: rect 80×14px (wordmark placeholder).
  Right: two circles radius-full 32px (bell + avatar placeholders).

Filter pill row (horizontal scroll, 44px height):
  5 pill shapes radius-full, widths: 52px, 64px, 44px, 72px, 56px. 8px gap.

CARD 1 — Editorial skeleton (white card, radius-xl, 16px margin horiz, shadow-card):
  Image rect: full card width, 180px, radius-md, #D8D1C6.
  Below image (16px padding):
    Eyebrow: rect 40×8px.
    Title line 1: rect 90% width × 14px, 8px top margin.
    Title line 2: rect 70% width × 14px, 4px top.
    Author row: circle 24px radius-full + rect 80px×10px + gap + rect 48px×10px.

CARD 2 — Community skeleton (white card, radius-xl, 16px margin horiz, shadow-card):
  Header row (16px padding): circle 40px radius-full (avatar) + right:
    Name rect: 100px × 12px.
    Handle rect: 60px × 10px, 4px below.
  Badge + time row: pill 60×20px + right-aligned rect 48×10px.
  Body text block (16px padding):
    Line 1: 95% width × 12px.
    Line 2: 85% width × 12px, 4px below.
    Line 3: 60% width × 12px, 4px below.
  Image grid: two equal rects side by side, 140px height, radius-md, #D8D1C6, 4px gap.
  Reaction row: 3 pairs of (circle 16px + rect 24×10px), 16px gap between pairs.

CARD 3 — Happening (Event) skeleton (white card, radius-xl):
  Hero image rect: full width × 180px, #D8D1C6, radius-xl top corners.
  Below (16px padding):
    Badge pill: radius-full 70×20px.
    Name rect: 80% × 16px, 8px top.
    Meta row 1 (date): circle 16px + rect 120px×10px.
    Meta row 2 (location): circle 16px + rect 140px×10px.
    RSVP pill: radius-full 100×36px, right-aligned.

CARD 4 — Quote skeleton (white card, radius-xl):
  Decorative mark rect: 40×32px, radius-sm, top-left.
  Quote body: 3 text rects (90%, 80%, 55% widths, 14px height, 4px gap).
  Author row: rect 100px×10px.
  Reaction row: 3 pairs (same as community).

════════════════════════════════════════════
FRAME 2 — ARTICLE DETAIL SKELETON
════════════════════════════════════════════
Hero image: full width × 280px, #D8D1C6, radius-2xl top corners.
Back button circle: 40px radius-full, white, #D8D1C6 icon placeholder.

Content card (white fill, radius-2xl top corners, -24px overlap):
  Eyebrow: rect 60×8px, #E0D9CE.
  Title line 1: rect 88% × 18px, 12px top.
  Title line 2: rect 72% × 18px, 4px below.
  Subhead: rect 65% × 13px, 8px below, lighter.
  Author row: circle 36px radius-full + two rects (name 100px + date 60px).
  Rule: 1px line full width.
  Body paragraph 1 (5 lines): rects at 95%, 90%, 85%, 92%, 60% widths, 12px height, 4px gap.
  Image placeholder: full card width × 200px, #D8D1C6, radius-md. 16px vertical margin.
  Body paragraph 2 (4 lines): same pattern, widths 95%, 88%, 75%, 40%.
  Pull quote block: 4px left border + rect 90% × 14px + rect 70% × 14px (indented).
  Body paragraph 3 (3 lines).

Bottom action bar (64px, white, top border):
  3 icon circles 36px radius-full + rect 60px pill right (share CTA).

════════════════════════════════════════════
FRAME 3 — MEMBER DASHBOARD SKELETON
════════════════════════════════════════════
Header (56px, white): rect 60×14px centred (page title placeholder).

HERO CARD (white, radius-xl, 16px margin, shadow-card):
  Circle 80px radius-full (avatar) — centred or left depending on dashboard layout.
  Below avatar:
    Name rect: 140×16px centred.
    Handle rect: 80×10px centred, 4px below.
  Passkey banner: full-width rect 52px height, radius-md, lighter.

STATS BAR (white card, radius-lg, 4 equal columns, dividers):
  Each column: rect 40×18px (number) + rect 56×10px below (label).

BADGES SHELF:
  5 pill shapes radius-full, widths varying 80–130px, height 32px. 8px gap. Horizontal scroll hint.

QUICK LINKS (white card):
  7 rows × 52px:
    Each row: circle 40px radius-full (icon) + rect 120px×12px (label) + circle 20px right (chevron).
    Bottom border between rows.

════════════════════════════════════════════
FRAME 4 — EVENTS SCREEN SKELETON
════════════════════════════════════════════
Header (56px, white): rect 80×16px centred + filter circle right 32px.

Category filter strip: 6 pills radius-full (same as Feed skeleton), widths 40–80px.

3 event card skeletons (white card, radius-xl, 12px vertical gap):

EVENT CARD SKELETON:
  Hero image: full width × 200px, #D8D1C6, radius-xl top.
  Below (16px padding):
    Badge pill: 80×20px radius-full.
    Name rect: 75% × 16px, 8px top.
    Meta row 1 (date icon + text): circle 16px + rect 130px×10px.
    Meta row 2 (location): circle 16px + rect 150px×10px.
    Meta row 3 (admission): circle 16px + rect 100px×10px.
    RSVP pill: radius-full 100×36px, right-aligned, lighter.

════════════════════════════════════════════
FRAME 5 — SHOP PRODUCT LISTING SKELETON
════════════════════════════════════════════
Header (56px, white): rect 60×16px centred + cart circle right.

Search bar: full-width rect 44px height, radius-full, #E0D9CE fill.

Category filter strip: 5 pills (same pattern).

2-column product grid (8px gap):
8 product card skeletons (4 rows × 2 columns):

PRODUCT CARD SKELETON (white, radius-xl, shadow-card):
  Image rect: full card width × 160px, #D8D1C6, radius-xl top.
  Below (12px padding):
    Product name: rect 80% × 12px.
    Second name line: rect 55% × 12px, 4px below.
    Price rect: rect 60px×14px bold-weight.
    Strikethrough price rect: rect 48px×10px, 4px below (lighter, for Pro price state).
    Add to cart: rect 100% × 36px, radius-full.

════════════════════════════════════════════
FRAME 6 — PUBLIC PROFILE SKELETON
════════════════════════════════════════════
Hero area (200px): #E0D9CE gradient block, rounded top none.
Back button: circle 40px white.

Profile card (white, radius-2xl top, -24px overlap with hero):
  Avatar circle: 96px radius-full, #D8D1C6, centred, overlapping hero.
  Tier badge pill: 80×24px radius-full, centred, 12px below avatar.
  Name rect: 160×18px centred.
  Handle rect: 80×10px centred, 4px below.
  Occupation rect: 140×12px centred.
  City rect: 80×10px centred, 4px below.
  Since rect: 100×8px centred.

Badges shelf: 5 pills radius-full, widths 80–120px, 32px height.
Social links: 3 circles 36px radius-full, centred.

Tabs row (44px): 2 rect blocks equal width.

Community posts (3 mini-card skeletons):
  Each (white, radius-lg):
    Badge + time row: pill 60×16px + rect 48×10px right.
    Body: 2 text rects (90%, 65% widths).
    Reaction row: 3 small pairs.

════════════════════════════════════════════
FRAME 7 — NOTIFICATIONS SKELETON
════════════════════════════════════════════
Header (56px, white): back circle + rect 100px centred + rect 80px right (mark-read CTA).

Section header "Today" — rect 60×8px, 32px height block.

5 notification row skeletons (72px min-height, bottom border):
  Left: circle 40px radius-full (type icon).
  Middle: 
    Title rect: 200px×14px.
    Body rect: 240px×12px, 4px below. (Slightly narrower on some rows for variation.)
  Right: rect 32px×10px (time) + optional circle 8px (unread dot) below.

Section header "Earlier" + 2 more shorter rows.

════════════════════════════════════════════
FRAME 8 — GAMES HUB SKELETON
════════════════════════════════════════════
Header (56px, white): rect 80×16px centred.
Streak rect: 120×10px centred, 4px below (mono).

2×2 game card grid (12px gap):
Each card (white, radius-xl):
  Top half rect: full width × 140px, #D8D1C6, radius-xl top.
  Bottom half (16px padding):
    Game name rect: 80% × 14px.
    Subtitle rect: 60% × 10px, 4px below.
    Play button: rect 90%×36px, radius-full.

════════════════════════════════════════════
FRAME 9 — FULL-APP SPLASH / INITIAL LOADING SCREEN
════════════════════════════════════════════
Full background: paper-warm #F3ECE0.
Centred vertically and horizontally:

Logo lockup:
  "moveee" Fraunces 28px bold #14110D.
  "connect" DM Sans 10px letter-spacing 0.2em #B38238 (gold), 6px below.

32px below logo lockup:
  Animated ring spinner: 40px diameter, 2.5px stroke.
  Stroke: ochre #C5491F arc 270° visible, remaining 90° transparent.
  (Show spinner paused at the 270° state to represent mid-animation.)

16px below spinner:
  "Loading your culture…" JetBrains Mono 11px #9E9288.

Bottom of screen:
  "Moveee Connect" DM Sans 10px #C8BFB0, centred, 32px from bottom.

════════════════════════════════════════════
Output 9 frames in a 3-column grid (3 rows × 3 columns).
Label each frame below in JetBrains Mono 11px mute.
```

---

## 15. FOLLOW-UP REFINEMENT PROMPTS

*Use these short prompts after generation to refine specific elements without spending full prompt credits.*

---

### After generating any screen — standard refinements:

```
Adjust the horizontal padding on all content to 16px (currently looks wider).
```
```
The card border radius should be 12px on all white cards — increase from current value.
```
```
Change all placeholder grey colours to use #C8BFB0 (ghost) for borders and #7A6F5C (mute) for secondary text — 
they should have a warm brown undertone, not pure neutral grey.
```
```
The app background between cards should be #F3ECE0 (paper-warm) — change from white to this warm off-white.
```
```
The primary CTA button colour should be #C5491F (warm terracotta-orange) — it should NOT look like a generic red or orange.
Make it feel like a warm, earthy terracotta. Desaturate slightly if needed.
```
```
All interactive elements (buttons, nav items, filter pills) must have a minimum height of 44px for iOS touch targets.
Increase any that are shorter.
```
```
The Fraunces font for all headlines should feel editorial — increase letter-spacing to -0.5px on sizes 24px and above.
```
```
Add a safe area inset of 34px at the bottom of the screen for the iOS home indicator.
The bottom navigation bar should sit above this safe area.
```
```
The muted text colour should be #7A6F5C — it should look like a warm olive-brown, not grey.
Update all secondary text to this value.
```
```
The gold colour (#B38238) should ONLY appear on Connect Pro tier elements: Pro badge, avatar border, Pro member icons.
Remove it from any other UI elements.
```

### Screen-specific refinements:

**Feed:**
```
Make the "For You" toggle pill use ochre fill (#C5491F) when active with white text. 
When inactive: transparent fill, 1px #C8BFB0 border, #3A342B ink-soft text.
```

**Post cards:**
```
Community post cards should have a white (#FFFFFF) background with a 
0px 1px 3px rgba(20,17,13,0.08) shadow — not paper-warm. They float above the paper-warm feed background.
```

**Games:**
```
The trivia correct answer state should use a full-width background colour #EDF7ED (light success green)
and a 2px #2D6A4F border on the option row — NOT just a colour change on the text.
```

**Member dashboard:**
```
The stats bar should show credits in #C5491F (ochre), reputation in #B38238 (gold), 
and the other stats (badges, daily) in #14110D (ink). Only credits and reputation get colour.
```

---

## 16. LIFESTYLE SHOP SCREENS

*The Moveee Lifestyle shop sells handcrafted and culturally-curated products from vetted independent makers.
Built on WooCommerce with editorial integration — products link to magazine stories, maker profiles,
and "How It's Made" process documentation. Connect Pro members get early access and member-only pricing.*

**Shop navigation tab: added as a 6th tab in the bottom nav — or accessible via Magazine/Lifestyle section.
Products are WooCommerce variable products (color + size variants). Checkout redirects to the WooCommerce
hosted checkout at cms.themoveee.com. Cart is managed via the WooCommerce Store API.**

---

### PROMPT 16A — Shop Home (Lifestyle Tab)

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle Shop. iOS, 390×844px.
Brand: paper-warm bg #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D,
Fraunces for editorial headlines, DM Sans for UI, JetBrains Mono for prices/metadata.

Design the Lifestyle Shop home screen. This is a premium independent maker marketplace —
handcrafted, culturally curated objects. The aesthetic should feel like a high-end
editorial boutique, not a standard e-commerce grid. Warm, artisanal, intentional.

HEADER (white, 64px including status bar):
Left: "Lifestyle" Fraunces 20px bold ink (NOT "Shop" — use "Lifestyle")
Right: shopping bag icon (24px ink) with small count badge (ochre circle, white "2" in 8px mono)
  + search icon (24px ink)

HERO BANNER (full-bleed, 390×200px):
Warm editorial image placeholder — ochre/terracotta abstract textile pattern.
Dark gradient overlay bottom 50%.
Eyebrow: "VETTED MAKERS · HANDCRAFTED OBJECTS" DM Sans 9px bold uppercase gold, letter-spacing 2px
Headline: Fraunces 28px bold white: "Objects that carry a story."
Subtext: DM Sans 14px white mute: "Curated from independent makers across the diaspora."
"Shop the edit →" small white outline pill button (DM Sans 12px bold white, ink outline, 36px height)

CATEGORY SCROLL (horizontal, 48px height, paper-warm bg, 8px gap, 16px start padding):
6 category chips (40px height, radius-full, 12px horizontal padding):
Active "All": ochre fill white DM Sans 13px bold.
Inactive: white fill, ghost border, ink-soft 13px.
Categories: All · Ceramics · Textiles · Leather · Jewellery · Objects · Paper

FEATURED PICKS SECTION:
"Featured Picks" DM Sans 14px bold ink left (16px padding) + "The Edit →" 13px ochre right.
LARGE FEATURED CARD (full-width minus 32px, white fill, radius-xl, shadow-card, overflow hidden):
  Product image: full-width × 200px, object-fit cover (top radius only)
  Bottom (16px padding):
    Maker name eyebrow: "BISI CERAMICS · LAGOS" DM Sans 9px bold uppercase mute
    Product name: Fraunces 18px bold ink: "Terracotta Ritual Bowl"
    Price: DM Sans 16px bold ink: "£68" — Pro member price below: "£61 for Pro ★" DM Sans 13px gold
    "Add to bag" — primary ochre pill button (full width, 40px height, DM Sans 13px bold white)
    "NEW" tag chip if applicable: small ochre filled pill "NEW" DM Sans 9px bold white, top-right of image

2-COLUMN SMALL PICKS (below large card, 12px gap, 16px horizontal padding):
2 smaller product cards (equal width, white fill, radius-xl, shadow-card):
  Image: full-width × 140px, radius-xl top corners
  16px padding bottom section:
    Maker: DM Sans 9px bold uppercase mute
    Name: DM Sans 13px bold ink, 2 lines
    Price: DM Sans 14px bold ink + Pro price DM Sans 11px gold if different
    "Add to bag" small pill button (full width, 36px, ochre, DM Sans 12px bold)

EDITORIAL BRIDGE — "AS SEEN IN" STRIP (paper-warm bg, 64px height, 16px padding, row):
📖 book icon (20px ochre) left + 
"As seen in The Magazine →" DM Sans 14px bold ink + article excerpt DM Sans 12px mute 1 line
Chevron right.

PRODUCT GRID SECTION:
"All Products" DM Sans 14px bold ink left + sort control "Sort: Featured ▼" 13px mute right.
2-column product grid (12px gap, 16px horizontal padding):
6 product cards:

PRODUCT CARD (white fill, radius-xl, shadow-card):
Image (full-width, square aspect ratio, radius-xl top corners, object-fit cover):
  "NEW" badge top-left if tagged new (ochre pill, DM Sans 9px bold white, 4px 8px padding)
  "PRO EARLY ACCESS" badge top-left if gated (gold fill, DM Sans 9px bold white) — for non-Pro users
  "ONLY 2 LEFT" stock badge bottom-left if low stock (ink fill, white DM Sans 9px, pill)
16px padding bottom:
  Maker: DM Sans 9px bold uppercase mute, truncate 1 line
  Name: DM Sans 13px bold ink, 2 lines, min-height 36px
  Price row: DM Sans 14px bold ink "£68" — if on sale: strikethrough regular "£85" grey + "£68" ochre

Show 6 varied product cards:
1. "Terracotta Ritual Bowl" — Bisi Ceramics, Lagos — £68 — NEW badge
2. "Indigo Resist-Dye Throw" — Adire Studio, Abeokuta — £145 — PRO EARLY ACCESS (gold badge)
3. "Leather Card Holder" — Craft Co, Accra — £42 — 2 variants shown
4. "Oxidised Silver Cuff" — Atelier Nne — £120 — SALE: ~~£150~~ £120
5. "Hand-Bound Journal" — Paper Works Lagos — £28 — NEW badge
6. "Brass Incense Holder" — Objects Lagos — £55 — ONLY 2 LEFT badge

VENDOR SHOWCASE SECTION:
"Meet the Makers" DM Sans 14px bold ink left + "See all →" 13px ochre right.
Horizontal scroll of 3 vendor mini-cards (170×100px, white fill, radius-xl, shadow-card, 12px gap):
  Vendor avatar (44px circle, gold border if Pro seller) left + text right:
  Store name: DM Sans 13px bold ink
  City: DM Sans 11px mute
  Product count: JetBrains Mono 10px mute "12 products"

CONNECT PRO BAND (ochre fill #C5491F, 120px height, 16px padding, centred):
★ "Connect Pro Members" DM Sans 9px bold uppercase gold, letter-spacing 2px
"Early access · Member pricing · Free returns" Fraunces 18px bold white, centred
"Upgrade →" white outline pill button, 36px height, DM Sans 12px bold white

Bottom navigation: Lifestyle tab active (bag icon, ochre).

Output 1 full-length screen frame showing all sections.
```

---

### PROMPT 16B — Product Listing / Category Browse

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle shop listing. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D,
Fraunces + DM Sans + JetBrains Mono.

Design the product listing/browse screen — shown when a category is selected or
"All Products" is tapped. Generate 3 frames: Grid View, List View, and Empty/No Results state.

SHARED HEADER (white, 56px + status bar):
Back chevron + "Ceramics" Fraunces 18px bold ink centred + cart bag icon (24px, ink) right.

SHARED FILTER BAR (white bg, 56px height, ghost bottom border):
ROW 1 (horizontal scroll category pills — same as shop home):
Ceramics (active ochre) · Textiles · Leather · Jewellery · Objects · Paper
ROW 2 (below, 44px height): sort + filter controls row:
  "Sort: Featured ▼" — ghost border pill, DM Sans 12px ink-soft
  "Filter ⚙" — ghost border pill, DM Sans 12px ink-soft, filter icon 14px
  RIGHT: view toggle — 2 icon buttons (grid-2x2 icon, list icon), active = ink fill white, inactive = paper-deep

Results count: "14 products" JetBrains Mono 10px mute, 16px left padding, 8px vertical.

---

FRAME 1 — GRID VIEW (2-column, 12px gap, 16px horizontal padding):

8 product cards (vary across the grid):

PRODUCT CARD STANDARD:
Image: full-width, square, radius-xl top corners (12px), object-fit cover.
Badges on image:
  — "NEW" top-left: ochre pill, DM Sans 9px bold white, 4px 8px padding
  — "SALE" top-left: error red pill, same style (mutually exclusive with NEW)
  — "PRO EARLY ACCESS" top-left: gold fill pill (when gated, non-Pro user view)
  — "ONLY X LEFT" bottom-left: ink fill semi-transparent, white text 9px (low stock warning)
  — Wishlist heart top-right: white circle 28px, heart icon 14px (outline = unsaved, filled red = saved)

CARD BOTTOM (16px padding):
Maker: DM Sans 9px bold uppercase mute, 1 line truncate
Name: DM Sans 13px bold ink, 2 lines (min-height 36px)
PRICE ROW (row, space-between):
  Regular price: DM Sans 14px bold ink "£68"
  If sale: strikethrough "~~£85~~" DM Sans 13px ghost + "£68" DM Sans 14px bold ochre
  If Pro member and member price exists: "£61 ★" DM Sans 12px gold (shown BELOW regular price, 2px top)
Quick-add button: small "+" circle button (28px, paper-deep bg, ink + icon 14px) bottom-right of price row.
  On tap: becomes ochre fill with white ✓ checkmark for 1s (optimistic feedback)

Show 8 cards across 4 rows (2 per row):
Row 1: Terracotta Bowl (£68, NEW) + Indigo Throw (£145, PRO EARLY ACCESS)
Row 2: Leather Card Holder (£42, 3 left) + Silver Cuff (~~£150~~ £112, SALE)
Row 3: Bound Journal (£28, NEW) + Brass Holder (£55)
Row 4: Batik Cushion (£89) + Woven Basket (£65, Pro price £58 ★)

---

FRAME 2 — LIST VIEW (full-width cards, single column):

PRODUCT CARD LIST STYLE (white fill, radius-xl, shadow-card, 16px margin horizontal, 8px gap):
Row layout: image left (100×100px square, radius-lg) + content right (12px gap).
CONTENT RIGHT:
  Maker: DM Sans 9px bold uppercase mute
  Name: DM Sans 14px bold ink, 2 lines
  Short description: DM Sans 12px ink-soft, 1 line truncate
  PRICE + ACTION ROW:
    Price: DM Sans 15px bold ink + Pro price DM Sans 11px gold below
    "Add to bag" button: small ochre pill (60px width, 32px height, DM Sans 11px bold white) right-aligned

Show 5 list cards with same product variety.

---

FRAME 3 — EMPTY / NO RESULTS:
Centred content on paper-warm background.
Filter bar still visible at top (showing active filter "Leather", 0 results).
Empty state:
  Shopping bag outline icon (64px, ghost colour)
  "No products found." Fraunces 20px bold ink, centred, 20px top margin
  "Try a different category or clear your filters." DM Sans 14px mute centred, max 260px
  "Clear filters" ghost button (ink border, 48px height, 200px width, DM Sans 14px) 16px below

Output 3 frames labelled Grid, List, Empty.
```

---

### PROMPT 16C — Product Detail Page

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle product detail. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white bg, ochre #C5491F, gold #B38238, ink #14110D,
Fraunces editorial headlines, DM Sans UI, JetBrains Mono metadata.

Design a full product detail screen. The product is a premium handcrafted ceramic bowl.
This screen combines e-commerce functionality with editorial depth — maker story,
process steps, magazine integration, and Pro member pricing.

Generate 2 frames: Standard view (all sections) + Pro Member view (early access unlocked).

HEADER (56px + status bar, white):
Back chevron left (ink, 44px) + "Lifestyle" DM Sans 14px mute centred + 
cart bag icon right (24px ink, ochre "2" badge) + share icon (24px ink).

---

PRODUCT GALLERY (full-bleed, 390×360px):
Large hero product image (terracotta ceramic bowl on ochre/warm linen background — placeholder).
GALLERY CONTROLS:
  — Thumbnail dots row bottom-centre: 4 dots (active = white filled 8px, inactive = white 40% 6px)
  — Left/right chevron arrows (white circles 36px) for navigation — subtle, near edges
  — Wishlist heart top-right: white circle 40px, heart icon 20px (outline state shown)
  — "4 images" JetBrains Mono 10px white bottom-right corner

---

CONTENT (white bg, radius-2xl top corners 20px, starts 32px overlap with gallery):
24px horizontal padding.

PRODUCT IDENTITY:
Maker row: "BISI CERAMICS" DM Sans 9px bold uppercase mute + "📍 Lagos, Nigeria" JetBrains Mono 10px mute + "Vetted Maker ✓" success green DM Sans 10px bold right-aligned.
"Terracotta Ritual Bowl" Fraunces 26px bold ink, 8px top margin.
Short description: DM Sans 15px ink-soft: "Hand-thrown on a traditional kick wheel, fired using locally sourced terracotta clay. Each piece is unique — no two are identical." 12px top margin.

PRICE BLOCK (16px top margin):
Regular price: DM Sans 24px bold ink "£68.00"
Pro member price (row below): ★ "Connect Pro price: £61.00" DM Sans 14px gold.
  Non-Pro user: "★ Connect Pro members save 10%" + "Upgrade →" link 13px ochre.
  Pro member: shows "£61.00" prominent gold price, "★ You're saving £7.00" 12px mute.
Stock status: "In stock · 6 available" JetBrains Mono 10px success green, right-aligned.

VARIANT SELECTORS (16px top margin):

COLOUR SELECTOR:
"Colour" DM Sans 12px bold ink + selected: "Terracotta" DM Sans 12px mute inline.
4 colour swatches (36×36px each, radius-full, 8px gap, left-aligned):
  Active: 2px ink border ring + 2px gap + filled swatch.
  Inactive: no border.
  Colours: Terracotta (warm orange), Clay (beige), Slate (grey-blue), Obsidian (near-black)

SIZE SELECTOR:
"Size" DM Sans 12px bold ink + selected: "Medium" inline.
3 size pills (radius-lg, 40px height, 48px min-width, 8px gap):
  Active: ink fill white DM Sans 13px bold.
  Inactive: ghost border ink-soft 13px.
  Sold-out: ghost border, strikethrough text, 50% opacity, "Sold out" tooltip.
  Sizes: Small · Medium · Large (Medium active)

ADD TO BAG SECTION (24px top margin):
QUANTITY ROW: "Qty" label + stepper (− 1 +) row: 
  Minus button (36×36px, ghost border circle) + "1" DM Sans 15px bold centred (48px wide) + Plus button.
"Add to Bag" — full-width primary ochre button (56px height, pill, white DM Sans 15px bold), 12px top margin.
  Loading state: ochre fill + spinner + "Adding..." text.
  Success state (1s): success green fill + ✓ + "Added to bag!" then reverts.
"Save for later" — ghost link with heart icon, DM Sans 13px mute centred, 8px below.

DELIVERY STRIP (paper-deep bg, radius-lg, 12px padding, 3-column row, 16px top margin):
3 equal columns, centred:
  🚚 "Free delivery over £75" · ↩️ "Free returns in 14 days" · ✓ "Vetted maker"
  Each: icon 16px ochre + DM Sans 10px mute below. Centred.

ACCORDION TABS SECTION (24px top margin):
5 collapsible rows (52px height each, ghost bottom border, 16px horizontal padding):
Row: label DM Sans 14px bold ink + ▼ chevron right (rotates on expand)
Rows: "Description" (expanded by default) · "Materials & Care" · "Delivery & Returns" · "About the Maker" · "As Seen In"

DESCRIPTION EXPANDED CONTENT:
DM Sans 14px ink-soft, line-height 1.6:
"This ritual bowl is part of Bisi Ceramics' Earth Objects collection, inspired by traditional 
Yoruba pottery forms. Hand-thrown using locally sourced red terracotta clay..."

HOW IT'S MADE SECTION (24px top margin):
"How It's Made" Fraunces 20px bold ink.
3 process step cards (vertical stack, 12px gap):
Each: white fill, radius-lg, 16px padding, row layout:
  Step number circle: 32×32px ochre fill, white DM Sans 13px bold centred.
  Text right: step title DM Sans 13px bold ink + description DM Sans 12px ink-soft below + 
  duration: JetBrains Mono 10px mute italic right-aligned ("2–3 days")
Steps:
  1. "Sourcing the Clay" · "Red terracotta gathered from Ondo state riverbanks" · 1 day
  2. "Throwing & Shaping" · "Hand-thrown on a kick wheel, no moulds used" · 2–3 days
  3. "Firing & Finishing" · "Single fire in a wood-burning kiln, natural glaze only" · 1–2 days

AS SEEN IN SECTION (paper-warm bg, radius-lg, 16px padding, 24px top margin, row):
📖 icon (24px ochre) left + text right (12px gap):
  "As seen in" DM Sans 11px mute + "The Craft Revival: Why Ceramics Are Having a Moment" DM Sans 14px bold ink, 2 lines
  "Read the story →" DM Sans 13px ochre link

MAKER PROFILE MINI-CARD (white fill, radius-xl, 16px padding, 24px top margin):
Header row: "About the Maker" DM Sans 14px bold ink + "See full shop →" 13px ochre.
Row below: Vendor avatar (56px, gold Pro border) + info stack right:
  "Bisi Ceramics" DM Sans 15px bold ink
  "📍 Lagos, Nigeria · Since 2019" JetBrains Mono 11px mute
  "★★★★★ 4.9 · 12 products" DM Sans 12px mute
Bio: "Adaeze Obi creates ceremonial objects inspired by West African ritual traditions..." DM Sans 13px ink-soft, 3 lines, 12px top.
"View all their products →" DM Sans 13px ochre link.

RELATED PRODUCTS (24px top margin):
"From Bisi Ceramics" DM Sans 14px bold ink left + "See more →" 13px ochre right.
Horizontal scroll of 3 product cards (160×200px, white fill, radius-xl, shadow-card, 12px gap):
Image (160×110px) + name 12px bold + price 13px.

STICKY BOTTOM BAR (fixed, white fill, top ghost border, 72px height + safe area, 16px padding):
Row: Price "£68" DM Sans 20px bold ink left + "Add to Bag" ochre pill button right (160px wide, 48px height).
Pro member view: "£61 ★" gold left instead.

---

PRO MEMBER VIEW DIFFERENCES:
— Hero image: "EARLY ACCESS" removed (no gate)
— Price block: "£61.00" in gold is the MAIN price (large, 24px gold)
  "Regular price £68.00" shown in smaller ghost strikethrough above
  "★ Connect Pro price · Saving £7.00" 12px success green
— Add to bag: fully enabled, no upgrade prompt
— Hero badge: if within early access window: "★ EARLY ACCESS — Available to Pro members" small gold banner above gallery

Output 2 frames: Standard (non-Pro user, Pro price visible as incentive) + Pro Member (gold pricing active).
```

---

### PROMPT 16D — Cart & Checkout Flow

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle cart. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white fills, ochre #C5491F, gold #B38238, ink #14110D.

Design 4 frames: Cart Screen, Cart Empty, Checkout Handoff, and Cart Drawer (slide-in overlay).

FRAME 1 — CART SCREEN (full screen):
Header (56px + status bar): back chevron + "Your Bag" Fraunces 18px bold ink centred + "Edit" DM Sans 14px ochre right.

CART ITEMS LIST:
3 items. Each cart item row (white fill, 16px horizontal padding, 8px vertical padding):

CART ITEM CARD (white fill, radius-xl, shadow-card, 16px padding, 16px horizontal margin, 8px gap):
Image: 80×80px square, radius-lg, object-fit cover. LEFT.
CONTENT RIGHT (flex, vertical, 12px gap from image):
  Maker: DM Sans 9px bold uppercase mute
  Name: DM Sans 14px bold ink, 2 lines
  Variant: "Terracotta · Medium" DM Sans 12px mute
  BOTTOM ROW: stepper (− 1 +, each 28×28px, ghost border circle) left + "£68.00" DM Sans 15px bold ink right.
  "Remove" DM Sans 12px mute ochre, below stepper, tap to remove with undo toast.

Items:
1. Terracotta Ritual Bowl · Bisi Ceramics · Terracotta / Medium · qty 1 · £68
2. Indigo Throw · Adire Studio · Indigo Blue · qty 1 · £145
3. Bound Journal · Paper Works · Blank / A5 · qty 2 · £56 (2 × £28)

VOUCHER/PROMO ROW (white card, 16px padding, row):
Gift card icon + "Add promo code" DM Sans 14px mute input (ghost border, 40px height) + "Apply" ochre text button.

ORDER SUMMARY CARD (paper-deep bg, radius-xl, 16px padding, 16px horizontal margin):
Row rows (space-between, 40px height each):
  "Subtotal (4 items)" DM Sans 14px ink + "£269.00" DM Sans 14px bold ink right
  "Delivery" DM Sans 14px ink + "Calculated at checkout" DM Sans 13px mute right
  "Pro member discount" DM Sans 14px gold + "–£18.90" DM Sans 14px bold gold right (if Pro member)
  Ghost divider
  "Estimated total" DM Sans 15px bold ink + "£250.10" DM Sans 15px bold ink right
  "Taxes included" JetBrains Mono 10px mute right-aligned

CONNECT PRO SAVINGS STRIP (gold fill bg, radius-lg, 12px padding, row, if non-Pro user):
★ icon (white) left + "Pro members save £18.90 on this order" DM Sans 13px bold white + "Upgrade →" white 10px link right.

CHECKOUT BUTTON (sticky at bottom, above safe area, 16px padding):
"Proceed to Checkout" — full-width ochre pill button, 56px height, DM Sans 15px bold white.
Security note: "🔒 Secure checkout via Moveee" DM Sans 11px mute centred, 8px below button.

---

FRAME 2 — CART EMPTY:
Header same. Background paper-warm.
Centred content:
Shopping bag outline icon (72px, ghost colour line art).
"Your bag is empty." Fraunces 22px bold ink, centred, 20px top margin.
"Find something beautiful in the Lifestyle shop." DM Sans 14px mute centred, max 260px.
"Browse the shop →" primary ochre button (280px max, 52px height, pill), 24px below.
"Or explore curated picks →" DM Sans 13px ochre link centred, 12px below button.

---

FRAME 3 — CHECKOUT HANDOFF SCREEN:
This screen shows before redirecting to the WooCommerce checkout.
Centred loading/transition state:
Moveee logo (wordmark, centred top area).
"Taking you to secure checkout..." Fraunces 20px bold ink centred.
"You'll be redirected to our secure payment partner." DM Sans 14px mute centred, 280px max.
Animated progress indicator: thin ochre line progress bar (full width, 4px, fills over 2s).
Security badges row (centred, 8px gap):
  🔒 "SSL Secure" · 💳 "Visa, Mastercard, PayPal" · ↩️ "Free Returns"
  Each: icon 16px + DM Sans 10px mute. Ghost bordered pill chips.
"Cancel" DM Sans 13px mute link, centred, bottom.

---

FRAME 4 — CART DRAWER (slide-in overlay from right, 340px width):
Show behind drawer: dimmed feed screen (ink 45% overlay).
Drawer: white fill, radius-2xl left corners (20px), shadow-modal.
Drag handle: 4×32px ghost pill, 12px from top, centred.

DRAWER HEADER (white, 56px, ghost bottom border):
"Your Bag" DM Sans 15px bold ink left (16px padding) + count chip "2 items" ghost pill mute right + × close icon right.

DRAWER ITEMS (scrollable area, max 3 items visible before scroll):
2 compact item rows (no card — separator only, 64px height, 16px padding):
  Image 52×52px radius-md + name 13px bold ink + variant 11px mute + price 14px bold right.
  Quantity stepper inline below name (compact: − 1 + at 24px each).

TOTALS (paper-deep bg, 16px padding, 12px top margin):
"Subtotal" DM Sans 14px ink + "£213.00" DM Sans 14px bold right.
"Free delivery on orders over £75" DM Sans 12px mute (if under threshold: "£12 away from free delivery").

DRAWER FOOTER (fixed, 16px padding, white, top ghost border):
"View Bag" — full-width secondary button (ink border, pill, 48px, DM Sans 14px bold ink), 8px gap.
"Checkout →" — full-width primary ochre button (pill, 48px, DM Sans 14px bold white).

Output 4 frames. Cart Screen and Cart Drawer should look most polished — these are the highest-traffic states.
```

---

### PROMPT 16E — Maker / Brand Profile Page

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle maker profile. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.

Design the Maker/Brand profile page. This shows a vetted independent maker's full profile,
their story, and all their products. It bridges editorial content and e-commerce.

HEADER (56px + status bar): back chevron + "Bisi Ceramics" DM Sans 15px bold ink centred + share icon right.

MAKER HERO (full-bleed, 390×220px):
Studio/workshop banner image (placeholder: warm terracotta tones, craft/making context).
Dark gradient overlay bottom 60%.
Bottom area:
  Vendor avatar (80px circle, gold Pro border) left, 16px from left, 16px from bottom.
  Right of avatar (16px gap):
    "Bisi Ceramics" Fraunces 22px bold white
    "📍 Lagos, Nigeria" DM Sans 13px white mute
    "✓ Vetted Maker" success green pill badge (DM Sans 10px bold white, 4px 8px padding)

MAKER STATS BAR (white fill, 64px height, row with 4 equal columns and ghost dividers):
"12" DM Sans 20px bold ink + "PRODUCTS" 9px uppercase mute
"4.9★" DM Sans 20px bold gold + "RATING" 9px mute
"2019" DM Sans 20px bold ink + "EST." 9px mute
"↩️" icon + "FREE RETURNS" 9px mute (or "SHIPS TO UK" if regional)

ABOUT SECTION (white card, 16px padding, 16px horizontal margin, radius-xl):
"About the Maker" DM Sans 14px bold ink.
"Adaeze Obi started Bisi Ceramics in 2019 after a residency at the Lagos Art Foundation.
She creates ceremonial objects and everyday wares inspired by Yoruba ritual traditions,
using locally sourced terracotta clay from Ondo state." — DM Sans 14px ink-soft, line-height 1.6.
Social links row (12px gap):
  🌐 "bisiceramics.com" DM Sans 13px ochre underlined + 📷 Instagram icon (ghost link)

ORIGINS BRIDGE (paper-warm bg, 64px, 16px padding, row):
📖 icon ochre left + "Read the Maker's story in Origins Journal →" DM Sans 14px bold ink + chevron right.

PRODUCTS SECTION:
"All Products" DM Sans 14px bold ink left + "Sort ▼" 13px mute right.
2-column product grid (12px gap, 16px horizontal padding):
6 products from this maker (same product card style as shop listing):
  Terracotta Ritual Bowl £68 NEW
  Clay Water Carafe £95
  Slate Meditation Bowl £78 SALE ~~£95~~
  Obsidian Offering Plate £55
  Small Tea Cup Set £48 NEW
  Herb-drying Bowl £38 ONLY 2 LEFT

CONTACT MAKER ROW (white card, 16px padding, 16px horizontal margin, radius-xl):
"Questions about a product?" DM Sans 14px bold ink.
"Message the maker through our community directory." DM Sans 13px mute.
"View in Directory →" DM Sans 13px ochre link with person icon left.

Bottom navigation: Lifestyle tab active.

Output 1 full-length frame showing all sections.
```

---

### PROMPT 16F — The Moveee Edit (Curated Picks)

```
Senior mobile UX/UI designer — Moveee Connect Lifestyle "The Edit" curated page. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white cards, ochre #C5491F, gold #B38238, ink #14110D.
This page feels like a curated fashion/lifestyle editorial — think Ssense, System Magazine, or
a high-end editorial supplement. Not a standard shop grid.

HEADER (56px + status bar): back chevron + "The Edit" Fraunces 20px bold ink centred + cart icon right.

HERO EDITORIAL SECTION (full-bleed, 390×240px):
Warm editorial image (ochre/terracotta/cream tones, artisanal objects laid out flat-lay style).
Gradient overlay bottom 40%.
"THE MOVEEE EDIT" DM Sans 9px bold uppercase gold, letter-spacing 3px, centred.
"Objects. Stories. Makers." Fraunces 26px bold white centred.
"Curated pieces featured in The Moveee Magazine." DM Sans 14px white mute, centred, max 280px.

SECTION 1 — AS SEEN IN (editorial pick with article link):
"AS SEEN IN THE MAGAZINE" DM Sans 9px bold uppercase mute, 16px left padding.
LARGE EDITORIAL CARD (full-width minus 32px, white fill, radius-xl, shadow-card):
  Image: 16:9 editorial product image (full width, radius-xl top)
  Content (24px padding):
    Article reference: 📖 "Story: The Craft Revival" DM Sans 12px mute italic
    Product name: Fraunces 22px bold ink: "Terracotta Ritual Bowl"
    Maker: "Bisi Ceramics · Lagos" DM Sans 13px mute
    Excerpt: DM Sans 14px ink-soft italic: "This vessel entered our office on a Tuesday. 
    By Friday we'd ordered three more. It's that kind of object." — Fraunces 14px italic mute
    Price row + "Add to Bag" button (ochre, full width, 44px height)

SECTION 2 — CURATED PICKS GRID:
"THIS SEASON'S PICKS" DM Sans 9px bold uppercase mute, 16px padding.
Horizontal scroll of 3 featured picks (200×280px each, 12px gap, 16px start padding):
  Tall portrait card (white fill, radius-xl, shadow-card):
    Image tall (200×160px, radius-xl top)
    Maker 9px mute eyebrow
    Name 14px bold ink 2 lines
    Price 14px bold + Pro price 12px gold if different
    "Add to Bag" ochre pill, full width, 36px

SECTION 3 — EDITORIAL STORIES featuring products:
"STORIES FEATURING THESE OBJECTS" DM Sans 9px bold uppercase mute.
2 editorial story cards (full-width minus 32px, white fill, radius-xl, shadow-card, 12px gap):
  Horizontal layout: image left (120×100px, radius-lg) + text right:
    "CULTURE · CRAFT" 9px uppercase ochre
    Article title: DM Sans 14px bold ink 2 lines
    "12 min read" 11px mono mute
    Chevron right

SECTION 4 — FULL EDIT GRID:
"ALL EDIT PICKS" DM Sans 9px bold uppercase mute.
2-column standard product grid (same product card style), 6 more products.

SIGN-OFF BAND (paper-warm bg, 100px, centred, light ochre left/right decorative lines):
"Hand-picked by the Moveee editorial team." Fraunces 18px italic ink centred.
"Every object in The Edit has been featured in our magazine." DM Sans 13px mute centred.

Output 1 full-length frame showing all sections.
```

---

### PROMPT 16G — Shop Search & Pro Early Access States

```
Senior mobile UX/UI designer — Moveee Connect shop utility screens. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white, ochre #C5491F, gold #B38238, ink #14110D, DM Sans + Fraunces.

Create 4 utility frames:

FRAME 1 — PRODUCT SEARCH SCREEN:
Header: back chevron + search input (full-width, 44px height, radius-full, ghost border, 
  🔍 icon left, "Search products and makers..." placeholder DM Sans 14px ghost, × clear right when active).

SEARCH ACTIVE STATE (keyboard visible, showing results):
Results label: "18 results for 'ceramics'" JetBrains Mono 10px mute, 8px padding.

Results list (mixed product + maker results):
PRODUCT RESULT ROW (white bg, 64px height, 16px padding, ghost bottom border):
  Image: 48×48px square, radius-md, left
  Content: maker eyebrow 9px mute + name 14px bold ink + price 13px mute right
  "PRODUCT" type pill: DM Sans 9px bold ink-soft, ghost border, radius-full, right side

MAKER RESULT ROW:
  Avatar: 48×48px circle, gold border if Pro maker
  Store name 14px bold ink + city 12px mute + product count JetBrains Mono 10px mute right
  "MAKER" type pill: DM Sans 9px bold, same style

RECENT SEARCHES (shown before typing):
"Recent" DM Sans 13px bold mute, 16px padding.
3 rows: 🕐 clock icon + search term DM Sans 14px ink + × remove right. 48px height, ghost border.

POPULAR SEARCHES:
"Popular" DM Sans 13px bold mute.
Horizontal wrap chips: Ceramics · Lagos makers · Textiles · Under £50 · Jewellery · NEW arrivals
Ghost border pills, DM Sans 13px ink-soft, radius-full, 32px height.

---

FRAME 2 — FILTER SHEET (bottom sheet, 500px height):
White fill, radius-2xl top corners, drag handle.
"Filter Products" DM Sans 16px bold ink, 20px padding + "Reset" ochre text right.

CATEGORY SECTION:
"Category" DM Sans 13px bold mute uppercase.
2-column chip grid (32px height, ghost border, radius-full, 12px padding, DM Sans 12px):
All (active ink fill) · Ceramics · Textiles · Leather · Jewellery · Objects · Paper
Selected: ink fill white.

PRICE RANGE:
"Price" DM Sans 13px bold mute uppercase.
Range slider: full width, 8px height, radius-full. Ghost track, ochre fill between handles.
Two handles: ochre circles 20px. Labels: "£0" left + "£200+" right.
Current range: "£25 – £150" DM Sans 14px bold ink centred above slider.

SORT BY:
"Sort by" DM Sans 13px bold mute uppercase.
4 radio rows (44px height, ghost border-bottom):
  ○ Featured (selected, ochre) · ○ Newest · ○ Price: Low to High · ○ Price: High to Low
Radio: 20px circle. Selected = ochre fill. Text DM Sans 14px ink.

AVAILABILITY:
"Availability" DM Sans 13px bold mute uppercase.
2 toggle rows: "In stock only" + "On sale" — toggle switches (ochre when on).

BOTTOM: "Show 14 products" primary ochre button, full width, 52px. Pill.

---

FRAME 3 — PRO EARLY ACCESS GATE (product detail, non-Pro user):
Show the product detail layout (image + content) but with the Add to Cart section GATED.

GATE OVERLAY (replaces Add to Bag section):
Gold border card (radius-xl, 2px gold border, 20px padding, paper-warm bg):
  ★ icon (28px gold) centred
  "Early Access — Pro Members Only" Fraunces 20px bold ink, centred
  "This product is currently available exclusively for Connect Pro members.
  It will open to everyone on 20 June 2026." DM Sans 14px mute centred, max 280px
  Countdown: "Opens in 7d 14h 32m" JetBrains Mono 16px bold gold, centred, 12px top margin
  "Upgrade to Connect Pro" primary gold fill button (full width, 52px, pill, white DM Sans 14px bold), 16px top
  "Learn more about Connect Pro →" DM Sans 12px ochre link, centred, 8px below

Variant selectors (colour/size) are visible but dimmed (50% opacity, non-interactive).
"Add to Bag" button: replaced by gate card above.

---

FRAME 4 — ORDER CONFIRMATION / CHECKOUT SUCCESS:
(This screen shows when user returns to app after completing WooCommerce checkout.)
Full paper-warm background.
Success animation area: 
  Large ochre circle (96px) with white ✓ checkmark (40px, 3px stroke), centred.
"Order confirmed! 🎉" Fraunces 26px bold ink, centred, 24px top margin.
"Your order has been placed." DM Sans 16px mute centred.
Order number: "#MV-7291" JetBrains Mono 16px bold ink, centred, 8px below.
"A confirmation email has been sent." DM Sans 13px mute centred.

ORDER SUMMARY CARD (white fill, radius-xl, 16px padding, 32px horizontal margin, 20px top margin):
Product thumbnails: 3 stacked image circles (52×52px, radius-full, overlapping by 12px).
"3 items" DM Sans 14px bold ink + total "£269.00" DM Sans 14px bold right.
Delivery estimate: "📦 Estimated delivery: 15–18 Jun" DM Sans 13px mute, centred below.

2 buttons (12px gap, 16px horizontal margin):
"Track order" secondary button (ink border, pill, 52px height, full width).
"Continue shopping" ghost link DM Sans 14px ochre centred.

Output 4 frames.
```

---

## 17. BOTTOM SHEET DETAIL DRAWERS

> **Design rationale:** The web app opens community posts, pulse stories, quotes, happenings, and
> directory entries in a right-side off-canvas drawer. On mobile the native equivalent is a
> **bottom sheet** that slides up from the bottom edge. It shares the same role — reveal detail
> without a full navigation push — but feels native on iOS and Android. The Moveee shell is always
> identical; only the content inside changes per card type. Design the shell once, then show five
> content variants.

---

### PROMPT 17A — Bottom Sheet Shell & Anatomy

```
Senior mobile UX/UI designer — Moveee Connect bottom sheet system. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white #FFFFFF, ochre #C5491F, gold #B38238, ink #14110D.
DM Sans (body) + Fraunces (display) + JetBrains Mono (meta/labels).

Design 3 frames showing the three states of a single bottom sheet.
The underlying feed screen is partially visible behind the sheet.

════════════════════════════════════════════
SHARED SHELL (identical across all three states)
════════════════════════════════════════════
BACKDROP: full-screen overlay, ink #14110D at 40% opacity.
(The feed cards behind the backdrop are visible but dimmed.)

SHEET SURFACE: white #FFFFFF fill, radius-2xl top-left + top-right corners (24px).
No border — rely on drop shadow: 0 -4px 32px rgba(20,17,13,0.18).

TOP CHROME (always visible, 52px, white, not scrollable):
  Drag handle: 4×28px, radius-full, ghost #C8BFB0, centred horizontally, 10px from top.
  Close button (×): 36×36px circle, paper-warm #F3ECE0 fill, ink × icon 16px, 14px from top, 16px from right.
  (No title text in the top chrome — content starts immediately below.)

═══════════
FRAME 1 — PEEK STATE (content-hugging height, NOT fixed %):
Sheet height wraps its content — no fixed floor. The sheet grows only as tall as its
content requires, plus 32px bottom padding. This eliminates whitespace gaps entirely.
═══════════
Feed screen visible above sheet, dimmed by backdrop.
Sheet bottom edge stops wherever content ends — it does NOT stretch to fill the screen.

IMPORTANT: do NOT pin any element to the bottom of the sheet. All elements stack
naturally top-to-bottom with no spacer between content and bottom actions.

Content area (below top chrome — flows naturally, no fixed height):
Show a Community Post peek:
  — Type badge pill ("COMMUNITY" green) + "Just now" JetBrains Mono 10px ghost, right-aligned. 12px top.
  — Author row (12px top): 40px circle avatar + "Kemi Adeyemi" DM Sans 14px bold ink + "@kemi.a" 12px mute.
  — Post body (12px top): DM Sans 14px ink-soft, line-height 1.6.
      "Just visited the new exhibition at Rele Gallery. The way they curated the lighting
      around the portrait series was absolutely incredible. Definitely…"
      The final word fades out with a 32px white-to-transparent gradient overlay on the last line
      to signal truncation — do NOT add a separate CTA label.
  — Ghost rule 1px #EEE8DF (12px top, no extra spacing).
  — Reaction bar (12px top, 16px horizontal padding): ❤️ 14  🔥 7  👏 9 — outline icons, JetBrains Mono 10px mute, 16px gaps.
  — SWIPE HINT (8px top, centred): "↑ Swipe up for full post" JetBrains Mono 9px ghost #C8BFB0.
  — 32px bottom padding (home indicator zone — white fill, no content).

RESULT: total sheet height ≈ 52px chrome + 12+40+12+80+1+12+24+8+16+32 ≈ ~290px.
The sheet floats at the bottom of the screen and looks intentionally compact, not stretched.

═══════════
FRAME 2 — FULL STATE (92% viewport height = ~776px sheet height):
Sheet snaps here on a hard swipe up from peek state.
═══════════
Top chrome still visible (drag handle + close button).
Content below is scrollable (scroll indicator on right edge).

Show the same Community Post, expanded:
  — Type badge pill + timestamp. 8px top inside content area.
  — Author row: 40px avatar + name + handle + "Follow" ghost pill button right (DM Sans 12px bold, 24px height).
  — Full post body: 6 lines of DM Sans 14px ink-soft.
  — 2-image grid (if present): two image placeholders side-by-side, 170px height, radius-md, #F3ECE0 bg. 8px gap.
  — Hashtags: "#LagosNights #AfroCulture" DM Sans 13px ochre, 8px top.
  — Ghost rule + REACTION BAR (same as peek but full width reactions):
      ❤️ 14  🔥 7  👏 9  💬 3 — icon button, JetBrains Mono 10px mute.
  — Ghost rule.
  — COMMENTS SECTION HEADER "Comments (3)" DM Sans 13px bold ink left + "Add comment" text link ochre right.
  — 2 comment rows (each 64px min, ghost bottom border):
      Avatar 36px circle + "Seun B." DM Sans 13px bold ink + "Loved this 🔥" 13px mute below + "2h" mono 10px ghost right.
  — "View all 3 comments →" DM Sans 13px mute centred link.
  — REPORT LINK: ⚑ "Report this post" DM Sans 12px ghost, centred, 24px bottom padding.

Bottom safe area: 34px white (home indicator zone).

═══════════
FRAME 3 — CLOSING / DISMISSED STATE:
═══════════
Sheet has been swiped 40% of the way down (mid-dismiss).
Sheet top edge is at ~35% of screen height (moved downward).
Backdrop opacity reduced to ~20% (shows bleed-through effect).
Content inside sheet is visible but cropped.
Drag handle: slightly bolder (user is actively dragging).
Show a subtle velocity-arrow annotation: "↓ swipe down to dismiss" in JetBrains Mono 10px ghost on the drag handle.

Output 3 frames side by side.
```

---

### PROMPT 17B — Community Post Template Sheets (All 10 Types)

```
Senior mobile UX/UI designer — Moveee Connect community post bottom sheets. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white #FFFFFF, ochre #C5491F, gold #B38238, ink #14110D.
DM Sans (body/UI) + Fraunces (display/headings) + JetBrains Mono (meta/counts/labels).

Design 10 frames — one per community post template — all in FULL STATE (92% viewport height).

════════════════════════════════════════════
SHARED SHELL (identical on all 9 frames — do not repeat in each frame description):
  White #FFFFFF surface. radius-2xl top-left + top-right (24px). Shadow: 0 -4px 32px rgba(20,17,13,0.18).
  Warm backdrop: ink #14110D at 40% opacity, feed visible behind.
  Drag handle: 4×28px, radius-full, #C8BFB0, centred, 10px from top.
  × Close button: 36×36px circle, #F3ECE0 fill, ink ×, 14px from top, 16px from right.
  SHARED FOOTER on every frame (below scrollable content):
    Ghost rule 1px #EEE8DF.
    ⚑ "Report this post" DM Sans 12px ghost, centred, 12px top, 24px bottom padding.

SHARED AUTHOR ROW layout (appears near top of each sheet, 16px horizontal padding):
  44px circle avatar (warm placeholder) + display name DM Sans 14px bold ink +
  @handle DM Sans 12px mute below name.
  "Follow" pill (ghost border, radius-full, DM Sans 12px bold ink, 24px height) pinned right.

SHARED REACTION + COMMENTS block (appears near bottom of each sheet before footer):
  Ghost rule 1px #EEE8DF.
  REACTION BAR (16px padding, 12px vertical): outline icons, JetBrains Mono 10px mute counts, 20px gaps.
    All frames show: ❤️ · 🔥 · 👏 · 💬 — vary the counts per frame.
  Ghost rule.
  COMMENTS HEADER "Comments (N)" DM Sans 13px bold ink left + "Add comment" DM Sans 13px ochre right.
  2 comment rows (56px min, ghost bottom border):
    32px avatar + commenter name 13px bold + comment text 13px mute + time mono 10px ghost right.
  "View all N comments" DM Sans 13px mute centred link, 12px bottom.

MULTI-IMAGE GALLERY DISPLAY PATTERN (used by Standard Post, Hidden Gem, Food Review, Itinerary, Event):
  PRIMARY IMAGE: full width × 200px, radius-md, warm photo placeholder.
  SECONDARY ROW (8px top): 2 equal images side by side, 100px height each, radius-md, 8px gap.
  "3 photos" JetBrains Mono 10px ghost, centred, 4px below. Tap any image → lightbox.
  (For frames with only 1 image added, show just the primary. For 2 images: primary + 1 half-width below.)

All badge pills: radius-full, DM Sans 9px bold uppercase, 4px vertical 10px horizontal padding.
All timestamps: JetBrains Mono 10px ghost, right-aligned on same row as template badge.
Content padding: 16px horizontal throughout.
════════════════════════════════════════════

════════════════════════════════════════════
FRAME 1 — STANDARD POST
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW (8px from top of scrollable area):
  "✏️ POST" pill — bg rgba(129,199,132,0.15), text #2E7D32.
  "Just now" right.

SECTION TAG (horizontal chips row, 8px top):
  Active chip: "Music" — ink fill, white DM Sans 11px bold, radius-full, 28px height.
  3 more inactive: "Culture" · "Lagos" · "Discovery" — ghost border, ink-soft text.

AUTHOR ROW (12px top). [Use shared layout above.]

BODY TEXT (DM Sans 15px ink-soft, 16px padding, 12px top, line-height 1.65):
  "Saw Tems perform at an intimate venue last night and I'm still not over it. She didn't say
  a word between songs — just let the music breathe. The crowd was completely silent. That's
  what real artistry looks like. Lagos has become the centre of the world and we don't even
  realise it yet. The energy in that room was something I'll carry for a long time."

HASHTAGS (12px top): "#Lagos #Tems #Afrobeats #LiveMusic" — DM Sans 13px #C5491F.

MULTI-IMAGE GALLERY. [Use shared pattern. Show 2 images (concert crowd + stage shot).]

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 34  🔥 19  👏 12  💬 8
  Comments: "Seun B." — "The silence was the loudest part 🖤" · "Kemi A." — "I was there too!!"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 2 — HIDDEN GEM
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "💎 HIDDEN GEM" pill — bg rgba(179,130,56,0.10), text #B38238.
  "3 days ago" right.

AUTHOR ROW (12px top). [Shared layout.]

PLACE NAME (Fraunces 22px bold ink, 12px top):
  "Bisi Ceramics Studio"

LOCATION ROW (8px top):
  📍 "Balogun Market area · Lagos Island" — DM Sans 13px mute, inline icon 16px ghost.

BODY TEXT (DM Sans 14px ink-soft, 12px top, line-height 1.65):
  "Tucked behind the market chaos — this studio is one of those places Lagos keeps hidden for those
  who look. Adaeze sources her clay from Ondo state, fires it in a traditional kiln out back,
  and sells directly from the studio. Afternoon workshop slots (₦8,000, 3hrs) sell out weeks in
  advance but are completely worth it. The terracotta ritual bowls start at ₦12,000."

DIRECTORY LINK ROW (12px top, paper-warm bg strip, 40px height, 12px horizontal padding, radius-md):
  🗂 icon (16px ghost) + "Linked to Bisi Ceramics in the Directory" DM Sans 13px ink-soft.
  "View entry →" DM Sans 13px #C5491F right.

META INFO ROW (8px top, 16px padding, ghost bottom border 1px, space-between, 44px):
  Left group (inline, 16px gap):
    💰 "₦₦₦" JetBrains Mono 12px gold (price tier, 3 of 4 symbols filled).
    · separator DM Sans mute ·
    🕐 "Tues–Sat, 10am–6pm" DM Sans 13px mute.

MULTI-IMAGE GALLERY. [Use shared pattern. Show 3 images (exterior, interior, ceramic pieces).]

HASHTAGS (8px top): "#LagosHiddenGem #Ceramics #MadeInAfrica #SupportLocal" — DM Sans 13px #C5491F.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 22  🔥 8  👏 15  💬 5
  Comments: "Kola M." — "Need this address! 😭" · "Zara W." — "The workshops are 🔥"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 3 — CULTURAL TAKE
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "🔥 CULTURAL TAKE" pill — bg rgba(107,72,168,0.08), text #6B48A8.
  "5 hours ago" right.

AUTHOR ROW (12px top). [Shared layout — "Funmi Osei" @funmiosei]

THE TAKE (Fraunces 21px bold ink, 16px padding, 16px top, line-height 1.3):
  "Streaming killed the album as an art form. And African artists are the ones paying the price."

ARGUMENT (DM Sans 14px ink-soft, 16px padding, 12px top, line-height 1.65):
  "We've spent the last decade celebrating the globalisation of Afrobeats. But look at what's
  actually been released: endless singles, loosely stitched 'albums' designed to hit Spotify
  playlists, not tell a cohesive story. Fela never needed a playlist. Neither did Lagbaja.
  The economics of streaming have replaced the album with the single, and the narrative with
  the hook. We're losing something and calling it progress."

DISAGREE PROMPT (paper-warm bg strip, 40px height, radius-md, 12px top):
  💬 "Do you agree? Reply with your take →" — DM Sans 13px ink-soft + #C5491F arrow right.

HASHTAGS (8px top): "#AfrobeatsDebate #MusicCulture #HotTake #CulturalTake" — DM Sans 13px #C5491F.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 91  🔥 67  👏 14  💬 43
  (High counts — takes generate debate.)
  Comments: "Lekan D." — "You're not wrong but Burna's 'Love Damini' was an album 👀"
             "Amaka S." — "Playlist culture ruined everything after 2018"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 4 — FOOD REVIEW
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "🍽️ FOOD REVIEW" pill — bg rgba(197,73,31,0.08), text #C5491F.
  "1 week ago" right.

AUTHOR ROW (12px top). [Shared layout — "Chidi Eze" @chidi.eats]

RESTAURANT NAME + LINK (12px top):
  "Nok by Alara" Fraunces 20px bold ink.
  🗂 "View in Directory →" DM Sans 12px ochre, 4px below name. Inline small link icon.

LOCATION + PRICE (8px top, same row space-between):
  📍 "Victoria Island, Lagos" DM Sans 13px mute.
  💰 "₦₦₦" JetBrains Mono 12px gold (price tier, 3 of 4 symbols filled).

RATINGS BLOCK (16px top, 16px padding):
  Section label: "Ratings" DM Sans 11px bold mute uppercase, 8px bottom.
  3 rating rows (44px height each, ghost bottom border, 0 padding horizontal):
  ┌─────────────────────────────────────────────┐
  │ Taste    ★★★★★  [5 filled ochre stars]  5.0 │  (DM Sans 13px ink-soft label · stars 20px · JetBrains Mono 12px gold score right)
  │ Value    ★★★★☆  [4 filled, 1 outline]   4.0 │
  │ Vibe     ★★★★★  [5 filled ochre stars]  5.0 │
  └─────────────────────────────────────────────┘
  Overall score: "4.7" Fraunces 28px bold ink, right-aligned. "/ 5.0" DM Sans 13px mute below.

MULTI-IMAGE GALLERY. [Use shared pattern. Show 3 images (dish close-up, restaurant interior, plantain sides).]
  Caption below primary: "Suya Platter for Two — ₦14,500" JetBrains Mono 10px mute, centred, 4px below.

REVIEW TEXT (DM Sans 14px ink-soft, 12px top, line-height 1.65):
  "The pan-African menu at Nok changes monthly and this month's Suya platter is a love letter
  to Northern Nigeria. The suya spice rub is fresh — you can taste the yaji — and the grilled
  plantain sides are the best I've had anywhere in Lagos. Service is attentive without being
  intrusive. Worth every naira for a special occasion."

CUISINE + DISH TAGS (8px top, horizontal chip row, 8px gap):
  "Nigerian" · "Pan-African" — ochre outline pills, DM Sans 11px bold, radius-full.
  "Suya" · "Grilled" — ghost border pills, DM Sans 11px ink-soft, radius-full.

HASHTAGS: "#NokByAlara #LagosFood #FoodReview #Suya" — DM Sans 13px #C5491F.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 41  🔥 18  👏 29  💬 12
  Comments: "Bisi A." — "The suya here changed my life 😭🔥" · "Tunde K." — "Is the jollof still on the menu?"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 5 — CREATIVE SHOWCASE
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "🎨 CREATIVE SHOWCASE" pill — bg rgba(25,118,210,0.08), text #1976D2.
  "2 weeks ago" right.

AUTHOR ROW (12px top). [Shared layout — "Zara Mensah" @zaramensah · "Fashion Photography"]

WORK TITLE (Fraunces 22px bold ink, 12px top):
  "Zaria Music Visuals — Vol. 2"

MEDIUM TAG (8px top):
  "Photography · Music Portraits" — ghost border pill chips, DM Sans 11px bold, radius-full.

IMAGE GALLERY (12px top):
  PRIMARY IMAGE: full width × 240px, radius-md, warm editorial portrait placeholder.
  SECONDARY ROW: two equal images side by side, 150px height, radius-md, 8px gap.
    (Total 3 images — primary + 2 thumbnails. Tap to expand into lightbox.)
  "3 of 12 photos" JetBrains Mono 10px mute, centred below gallery, 4px top.

ARTIST STATEMENT (DM Sans 14px ink-soft, 12px top, line-height 1.65):
  "This series explores the space between performance and stillness — the moment after the last
  note when an artist is still inside the sound. Shot over two months following Zaria across
  Lagos, Accra, and London. All film, no digital corrections."

COLLABORATION TAG (paper-warm bg strip, 40px height, 12px horizontal padding, radius-md, 12px top):
  🤝 icon + "Collaboration with @zaria.official" DM Sans 13px ink-soft + "View profile →" ochre right.

HASHTAGS: "#Photography #MusicPortraits #FilmPhotography #AfricanCreatives" DM Sans 13px #C5491F.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 118  🔥 52  👏 86  💬 31
  Comments: "Ade F." — "The film grain on the second shot 👌👌" · "Kemi O." — "This needs to be exhibited"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 6 — POLL
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "📊 POLL" pill — bg rgba(107,72,168,0.08), text #6B48A8.
  "Closes in 1 day" JetBrains Mono 10px ghost right. (Instead of posted-time — shows remaining.)

AUTHOR ROW (12px top). [Shared layout — "Moveee Community" @community]

POLL QUESTION (Fraunces 20px bold ink, 12px top, line-height 1.3):
  "What's the greatest era of Afrobeats?"

POLL OPTIONS (12px top, 12px gap between options):
  Each option row (radius-lg, white fill, ghost border, 56px height, 16px padding, overflow hidden):
    Layout: option text DM Sans 14px bold ink left + percentage JetBrains Mono 12px gold right.
    Behind text: filled bar from left edge, ochre #C5491F at 15% opacity, height 100%, radius-lg.
    Bar widths correspond to vote percentages.

  OPTION A — "90s Fela Era" — 12% filled bar — "12%" right.
  OPTION B — "Wizkid / Davido 2010s" — 38% filled bar — "38%" bold (leading) — ochre border 1.5px + "👑" icon right of text.
  OPTION C — "Burna Boy / Tems era" — 35% filled bar — "35%".
  OPTION D — "Right now — it's still evolving" — 15% filled bar — "15%".

  (OPTION B is the leader — slightly stronger ochre border and crown emoji to indicate.)

VOTE COUNT + STATUS ROW (12px top, 16px padding):
  "342 votes" JetBrains Mono 12px mute left.
  "· Closes 14 Jun 2026" JetBrains Mono 12px mute.
  "You voted: 2010s ✓" DM Sans 12px gold right. (Shows user's choice.)

POLL DESCRIPTION (DM Sans 14px ink-soft, 12px top, line-height 1.6) — optional:
  "Inspired by the debate at last week's community event. Drop your take in the comments."

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 58  🔥 31  👏 9  💬 47
  Comments: "Tolu P." — "You can't count out Fela, the foundation of everything 💯"
             "Mide A." — "2010s gave us the template but 2020s perfected it"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 7 — ITINERARY
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "🗺️ ITINERARY" pill — bg rgba(46,125,50,0.08), text #2E7D32.
  "4 days ago" right.

AUTHOR ROW (12px top). [Shared layout — "Lekan Dada" @lekandada]

ITINERARY TITLE (Fraunces 22px bold ink, 12px top):
  "48 Hours in Lagos: The Culture Route"

META ROW (8px top):
  🗂 "6 stops" · ⏱ "Est. 2 days" · 📍 "Lagos, Nigeria" · 💰 "££" · ☀️ "Oct–Mar ideal"
  Each: JetBrains Mono 11px ghost, 16px gap between items, inline icons 14px ghost.
  (Budget and best-time entries are the new optional fields from the composer.)

STOPS LIST (12px top, 16px padding):
  Section label: "The Route" DM Sans 11px bold mute uppercase.

  STOP ROWS (each 72px min, ghost bottom border 1px #EEE8DF):
  Layout per stop: number bubble left (24px circle, ghost #F3ECE0 fill, ghost border, DM Sans 12px bold mute) +
    content centre + connector dot right if directory-linked.

  STOP 1:
    Bubble: "1"
    Name: "Nike Art Gallery" DM Sans 14px bold ink.
    🗂 "Ikoyi · View in Directory →" DM Sans 12px ochre, 2px below name.
    Note: "Arrive early — the rooftop has the best light before 10am." DM Sans 12px mute, 2px below.
    Duration: "⏱ 2–3 hours" JetBrains Mono 10px ghost, 2px below.

  STOP 2:
    Bubble: "2"
    Name: "Nok by Alara" DM Sans 14px bold ink.
    🗂 "Victoria Island · View in Directory →" DM Sans 12px ochre.
    Note: "Lunch — pan-African menu, book in advance." DM Sans 12px mute.
    Duration: "⏱ 1.5 hours" JetBrains Mono 10px ghost.

  STOP 3:
    Bubble: "3"
    Name: "Terra Kulture" DM Sans 14px bold ink.
    🗂 "Victoria Island · View in Directory →" DM Sans 12px ochre.
    Note: "Afternoon gallery + bookshop. Don't miss the Nigeria in Photographs section." DM Sans 12px mute.
    Duration: "⏱ 1–2 hours" JetBrains Mono 10px ghost.

  STOP 4:
    Bubble: "4"
    Name: "Café Beside the Point" DM Sans 14px bold ink.
    No directory link.
    Note: "Hidden coffee spot on Akin Adesola. Good vibes, no WiFi password needed." DM Sans 12px mute.
    Duration: "⏱ 45 min" JetBrains Mono 10px ghost.

  [Collapsed] "2 more stops ↓" DM Sans 13px ochre centred link. (Stops 5–6 hidden behind expand.)

MULTI-IMAGE GALLERY. [Use shared pattern. Show 2 images (street art shot, market scene).]

HASHTAGS (8px top): "#Lagos48Hours #CultureRoute #LagosGuide #VisitLagos" DM Sans 13px #C5491F.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 76  🔥 28  👏 55  💬 19
  Comments: "Fatima R." — "Done this route twice now, it's perfect" · "Olu B." — "Add Bisi Ceramics to stop 5!"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 8 — COMMUNITY EVENT
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "📅 EVENT" pill — bg rgba(0,137,123,0.08), text #00695C.
  "Posted 2 days ago" right.

AUTHOR ROW (12px top). [Shared layout — "Moveee Lagos" @moveee.lagos · "Event Organiser"]

EVENT NAME (Fraunces 22px bold ink, 12px top, line-height 1.2):
  "Amapiano Night at The Jazz Cafe"

MULTI-IMAGE GALLERY. [Use shared pattern. Show 1 image (event flyer, portrait ratio cropped to landscape) + placeholder second slot. Caption: "Amapiano Night · The Jazz Cafe"]

METADATA GRID (12px top, 8px row gap):
  Each row: 20px icon (ghost colour, 16px) + text DM Sans 14px ink-soft. Left-aligned.
  📅 "Friday, 20 June 2026 · 9:00 PM – 3:00 AM"
  📍 "The Jazz Cafe · Chalk Farm Road, London"
  🏙️ "London, UK"
  💰 "£15 advance · £20 door"
  🏷️ Category: "Music" — ghost pill chip.
  👤 Organiser: "Moveee Events" — DM Sans 13px ochre tappable link → (links to directory).

DESCRIPTION (DM Sans 14px ink-soft, 12px top, line-height 1.6):
  "An intimate Amapiano takeover at one of London's most iconic jazz rooms. Two rooms, three DJs,
  late licence until 3am. Connect members get priority entry — show your app at the door."

PRO MEMBER PERK ROW (paper-warm bg strip, 44px, radius-md, 12px top, 16px padding):
  ★ icon gold + "Pro Members: Early entry from 8:30 PM + free drink token." DM Sans 13px ink-soft.

RSVP BUTTON (12px top):
  "RSVP Now →" — ochre fill, white DM Sans 14px bold, radius-full, 52px height, full width (16px margin).

"Add to calendar" ghost link DM Sans 13px mute centred, 8px below.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 103  🔥 78  👏 41  💬 22
  Comments: "Tayo B." — "Already got my ticket 🕺" · "Sade O." — "Is this 18+?"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 9 — QUOTE (shared by community member)
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "❝ QUOTE" pill — bg rgba(185,140,55,0.10), text #92400E.
  "6 hours ago" right.

AUTHOR ROW (12px top). [Shared layout — "Adaeze Obi" @adaeze.obi · posted this quote]

QUOTE DISPLAY BLOCK (24px top, 16px padding):
  Decorative " — Fraunces 80px, #C8BFB0 (ghost warm), position absolute top-left,
    -4px from content block top, aligned to text left edge.
  QUOTE TEXT (Fraunces 22px bold ink, line-height 1.35, 3 lines, indented 8px from " mark):
    "African culture doesn't need validation from the West. It needs infrastructure,
    documentation, and distribution. The rest will follow."
  Rule: 1px #EEE8DF, 12px top.
  ATTRIBUTION (12px top):
    Author: "Ngozi Adichie" DM Sans 14px bold ink.
    Source: "Lions on the Move, Lagos Book & Art Festival · 2024" DM Sans 12px mute, 4px below.
    (If source is a book/film: small book/film icon 14px ghost inline left of source text.)

POSTER'S NOTE (paper-warm bg strip, radius-md, 12px top, 12px padding):
  "💬 Adaeze's note:" DM Sans 11px bold mute uppercase, 0px bottom.
  "Been sitting with this all week. The infrastructure piece is what we need to be building."
  DM Sans 14px ink-soft, 4px top, line-height 1.6.

SHARE PROMPT (12px top):
  "Know someone who needs to see this?" DM Sans 13px mute centred.
  "Share quote →" DM Sans 13px ochre centred, 4px below.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 64  🔥 29  👏 47  💬 18
  Comments: "Kola M." — "The distribution problem is real" · "Seun A." — "This deserves a thread 🧵"

[SHARED FOOTER]

════════════════════════════════════════════
FRAME 10 — BOOK REVIEW
════════════════════════════════════════════
TEMPLATE BADGE + TIMESTAMP ROW:
  "📚 BOOK REVIEW" pill — bg rgba(120,53,15,0.08), text #78350F (sepia/antique brown).
  "3 hours ago" right.

AUTHOR ROW (12px top). [Shared layout — "Seun Adeyemi" @seun.reads]

BOOK IDENTITY ROW (white card, ghost border, radius-lg, 12px padding, 12px top):
  Left: book cover thumbnail 48×64px radius-sm shadow-card.
  Right (12px gap):
    "Things Fall Apart" DM Sans 16px bold ink.
    "Chinua Achebe · 1958" DM Sans 13px mute, 4px top.
    STAR ROW: ★★★★★ 5.0 — 5 gold stars (16px) + "5.0" JetBrains Mono 13px gold bold, 4px top.
    "View in Directory →" DM Sans 12px ochre underline, 4px top.

READ STATUS + RECOMMEND CHIPS (row, 8px gap, 12px top):
  "✓ Finished" chip — #2D6A4F fill, white DM Sans 12px bold, radius-full, 28px height.
  "👍 Recommended" chip — paper-warm bg, gold #B38238 border, gold DM Sans 12px bold, radius-full.

RATINGS BREAKDOWN (12px top, label "Ratings" DM Sans 11px bold mute uppercase 0px bottom):
  4 rows (40px each, ghost bottom border):
  Layout: label DM Sans 13px ink-soft (100px wide) + 5 stars (16px) + score JetBrains Mono 12px gold right.
  Writing      ★★★★★  5.0
  Story        ★★★★★  5.0
  Characters   ★★★★★  5.0
  Pacing       ★★★★☆  4.0

REVIEW TEXT (DM Sans 14px ink-soft, 12px top, line-height 1.65):
  "Achebe dismantles the colonial narrative with the very language of the coloniser. Okonkwo's
  tragedy is fully realised — not imposed. I've read this three times and each time the final
  pages hit harder. The prose is deceptively simple. Essential reading."

FAVOURITE QUOTE (paper-warm bg strip, radius-md, 12px padding, 12px top):
  Left border 3px #C5491F.
  "📖 Favourite quote:" DM Sans 11px bold mute uppercase, 0px bottom.
  "Things fall apart; the centre cannot hold." DM Sans 14px italic ink-soft, 4px top.

GENRE TAGS (horizontal chip scroll, 32px height, 12px top):
  "Classic Literature" ink fill white + "African Lit" + "Post-Colonial" + "Fiction" — ghost border.

[SHARED REACTION + COMMENTS BLOCK]
  Reaction counts: ❤️ 88  🔥 43  👏 55  💬 31
  Comments: "Temi O." — "Still one of the greatest books ever written" · "Dayo A." — "Read it in school. Need to reread now."

[SHARED FOOTER]

════════════════════════════════════════════
Output 10 frames. Arrange as 2 rows × 5 columns (landscape) or 3 rows of 4/3/3 (portrait).
Label each frame below in JetBrains Mono 11px mute:
  "Standard Post" · "Hidden Gem" · "Cultural Take" · "Food Review" · "Creative Showcase"
  "Poll" · "Itinerary" · "Community Event" · "Quote" · "Book Review"
All frames at full 92%-height open state. Warm backdrop visible behind each.
```

---

### PROMPT 17C — Other Feed Card Detail Sheets

```
Senior mobile UX/UI designer — Moveee Connect non-community card bottom sheets. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white, ochre #C5491F, gold #B38238, ink #14110D.
DM Sans + Fraunces + JetBrains Mono.

Design 4 frames — one per non-community feed card type — all in FULL STATE (92% height).
Shell: identical to all other sheets (white surface, radius-2xl top corners, shadow,
drag handle, × close, warm ink backdrop 40%). No navigation header inside.

════════════════════════════════════════════
FRAME 1 — EDITORIAL / PULSE STORY
════════════════════════════════════════════
Sheet interior:
TYPE BADGE ROW (8px top, 16px padding):
  "EDITORIAL" pill — bg #fff0eb, text #c5491f, radius-full, 9px bold uppercase.
  Category: "MUSIC" JetBrains Mono 10px ghost right.

STORY IMAGE: full sheet width × 220px, radius-none (edge to edge inside sheet), warm editorial photo
  placeholder. Subtle gradient overlay bottom 40%: white fade-out.

BELOW IMAGE (16px padding):
  EYEBROW: "THE CULTURE BRIEF" JetBrains Mono 9px bold ochre uppercase, letter-spacing 0.12em.
  HEADLINE (Fraunces 22px bold ink, line-height 1.2, 8px top):
    "Why Afrobeats Is the Most Important Music Movement of the Decade"
  EXCERPT (DM Sans 14px ink-soft, line-height 1.6, 8px top):
    "The numbers don't lie: Afrobeats has achieved what no African genre has before.
    But the real story is what's happening at the grassroots level — in Lagos basements,
    Accra studios, and London warehouses."
  AUTHOR ROW (12px top): 32px avatar + "Funmi Lawson" DM Sans 13px bold + "Jun 12 · 4 min read" mono 10px ghost.

Ghost rule.

CTA BUTTON (12px top): "Read full article →" — ochre fill, white DM Sans 14px bold, radius-full, 52px, full width (16px margin).
"Save for later" ghost link DM Sans 13px mute centred, 8px below.

Ghost rule.

MORE FROM SERIES: "From The Culture Brief" DM Sans 13px bold ink left + "See all →" ochre right.
  2 mini rows (48px, ghost border-bottom): thumbnail 44×44px radius-md + headline 13px ink 2-line + "3 min" mono ghost right.

⚑ "Report" ghost centred 24px bottom.

════════════════════════════════════════════
FRAME 2 — QUOTE FEED CARD (curated/editorial quote)
════════════════════════════════════════════
(Note: this is a curated Quote feed card — distinct from the community Quote template in 17B Frame 9.)
Sheet interior:
  Decorative " — Fraunces 80px, #C8BFB0, top-left, -8px from edge.

  QUOTE TEXT (Fraunces 24px bold ink, 16px padding, line-height 1.4, 16px top, 3 lines):
    "African culture doesn't need validation from the West. It needs infrastructure,
    documentation, and distribution. The rest will follow."

  ATTRIBUTION (16px padding, 16px top):
    Author: "Ngozi Adichie" DM Sans 14px bold ink.
    Source: "Lions on the Move, Lagos Book & Art Festival · 2024" DM Sans 13px mute, 4px below.

  Ghost rule (24px top).

  REACTION BAR: ❤️ 48  🔖 22  🔗 Share — outline icons, JetBrains Mono 10px mute. Centred, 28px gaps.

  Ghost rule.

  RELATED QUOTES: "More in this series" DM Sans 13px bold ink.
  2 mini quote rows (56px, ghost border): small " mark + excerpt 13px ink-soft 1-line + date mono ghost right.

  ⚑ "Report" ghost centred 24px bottom.

════════════════════════════════════════════
FRAME 3 — HAPPENING (Curated Event)
════════════════════════════════════════════
Sheet interior:
TYPE BADGE ROW (8px top, 16px padding):
  "HAPPENING" pill — bg #eeedfe, text #3c3489, 9px bold.
  PRO ONLY pill — bg #B38238, text white, 9px bold, 8px left.

EVENT IMAGE: full sheet width × 200px, radius-none, warm concert photo placeholder.
  PRO ONLY overlay: #B38238 at 70% — lock icon 24px white + "Connect Pro members only" 13px white bold centred.

EVENT NAME (Fraunces 22px bold ink, 16px padding, 12px top):
  "Afro Nation Lagos 2026"

METADATA GRID (16px padding, 12px top, 8px row gap):
  📅 "Saturday, 28 June 2026 · 4:00 PM – 2:00 AM"
  📍 "Eko Atlantic City · Victoria Island, Lagos"
  🏛 "Landmark Event Centre" DM Sans 13px mute
  💰 "₦25,000 – ₦80,000 (General · VIP)"
  👤 Organiser: "Afro Nation Global" — DM Sans 13px ochre tappable link.
  Each row: 20px ghost icon + DM Sans 14px ink-soft.

DESCRIPTION (DM Sans 14px ink-soft, line-height 1.6, 16px padding, 12px top):
  "The continent's biggest Afrobeats festival returns to Lagos for its third edition,
  headlined by Burna Boy, Wizkid, and Tems across 4 stages."

Ghost rule.

RSVP BUTTON:
  "Get Tickets →" ochre fill, white 14px bold, radius-full, 52px, full width (16px margin).
  OR if non-Pro: "Upgrade to Pro for Access" gold fill, ink text, same size.
  "Opens in external browser" JetBrains Mono 10px ghost centred 4px below.
"Add to calendar" ghost link DM Sans 13px mute centred 8px below.

⚑ "Report" ghost centred 24px bottom.

════════════════════════════════════════════
FRAME 4 — DIRECTORY ENTRY
════════════════════════════════════════════
Sheet interior:
TYPE BADGE ROW (8px top, 16px padding):
  "DIRECTORY" pill — bg #e8f5ee, text #085041, 9px bold.
  Entry type: "STUDIO" JetBrains Mono 9px ghost right.

ENTRY HEADER (16px padding, 12px top):
  Name: "Bisi Ceramics" Fraunces 22px bold ink.
  "📍 Lagos, Nigeria" DM Sans 13px mute, 6px below.
  "✓ Vetted by Moveee" — success green pill, DM Sans 10px bold white, 24px height, 8px top.

EXCERPT (DM Sans 14px ink-soft, line-height 1.6, 12px top):
  "Award-winning ceramics studio in Lagos making ritual objects and everyday wares inspired
  by Yoruba tradition. Workshops available monthly."

Ghost rule.

QUICK LINKS (16px padding, 8px gap):
  🌐 "Visit website" DM Sans 13px ochre. 📷 "View on Instagram" DM Sans 13px ochre.

Ghost rule.

COMMUNITY MENTIONS: "Community posts about this place" DM Sans 13px bold ink.
  2 mini-rows (56px, ghost border):
    Template badge chip + excerpt 13px mute 1-line + "4 days ago" mono ghost right.

CTA: "View full entry →" ghost border, ink text, 52px, full width, radius-full. 12px top.

⚑ "Report" ghost centred 24px bottom.

════════════════════════════════════════════
Output 4 frames side by side.
Label each below: "Editorial" · "Quote" · "Happening" · "Directory" — JetBrains Mono 11px mute.
```

---

### PROMPT 17D — Bottom Sheet Micro-interaction & Edge Cases

```
Senior mobile UX/UI designer — Moveee Connect bottom sheet states and edge cases. iOS, 390×844px.
Brand: paper-warm #F3ECE0, white, ochre #C5491F, gold #B38238, ink #14110D.

Design 4 edge-case frames that complete the bottom sheet system:

════════════════════════════════════════════
FRAME 1 — SHARE SHEET STACKED ON TOP
════════════════════════════════════════════
Show the community post bottom sheet (full state, 92% height) with the iOS native share sheet
appearing on top of it (stacked modal pattern).

Native iOS share sheet (system UI, shown at bottom):
  White surface, radius-xl top corners, standard share grid:
  Row 1: app icons (Messages · WhatsApp · Instagram · Copy Link · More)
  Row 2: "Copy Link" · "Save Image" · "Markup" action rows
  Cancel: full-width 52px white button, DM Sans 17px blue, 8px below.
The Moveee sheet is dimmed slightly further behind the share sheet.
Annotation: "Native iOS share sheet stacks above Moveee sheet — both dismiss on cancel."

════════════════════════════════════════════
FRAME 2 — COMMENT COMPOSE STATE
════════════════════════════════════════════
Bottom sheet (full state) with the keyboard raised (keyboard height ~336px on iPhone 14).
Sheet content scrolled up, comment compose bar pinned above keyboard:

COMMENT COMPOSE BAR (64px, white fill, top border ghost, above keyboard):
  Left: 36px avatar circle (current user).
  Centre: text input field (radius-full, paper-warm fill, DM Sans 14px, "Add a comment…" placeholder).
  Right: "Post" DM Sans 14px bold ochre (enabled only when text present).
  Below input (inside bar): "Posting as Adaeze Obi" JetBrains Mono 9px ghost.

Above compose bar: last 2 visible comments (partial, 48px rows, truncated).
Sheet content above the compose bar is dimmed subtly (scroll-to-bottom happened).
Annotation: "Sheet resizes its scroll area when keyboard raises — compose bar stays pinned."

════════════════════════════════════════════
FRAME 3 — HAPTIC RESISTANCE / OVER-SCROLL TOP
════════════════════════════════════════════
User has swiped the sheet UPWARD past the 92% snap point.
The sheet has stretched 24px beyond its max height — elastic overscroll.
The drag handle is now 34px from the very top edge of screen.
Backdrop at 45% (slightly darker — resisting the over-pull).
A subtle annotation arrow: "↑ Elastic overscroll — snaps back to 92% on release."
Top safe area shows through behind the handle (status bar visible).

════════════════════════════════════════════
FRAME 4 — EMPTY / ERROR STATE
════════════════════════════════════════════
Sheet at 55% peek height. Content failed to load.

Sheet interior:
  Drag handle + close button (standard).
  
  Centred content area (full height of sheet minus chrome):
    Illustration: 72×72px warm circle (#F3ECE0 fill, #EBE5DC stroke), 
      centred icon: wifi-off or broken link, ghost #C8BFB0, 28px.
    "Couldn't load this post" Fraunces 18px bold ink, centred, 16px top.
    "Check your connection and try again." DM Sans 14px mute centred, 8px below, max 260px.
    "Try again" ochre fill button, 140px wide, 44px height, radius-full, white DM Sans 14px bold, 20px top.
    "Dismiss" ghost text link DM Sans 13px mute centred, 8px below.

Output 4 frames side by side.
```

---

## APPENDIX — SCREEN INVENTORY

Complete list of screens to design:

| # | Screen | Section | Priority |
|---|--------|---------|----------|
| 1 | Splash | Auth | P0 |
| 2-4 | Onboarding (3 steps) | Auth | P0 |
| 5 | Login | Auth | P0 |
| 6 | Register | Auth | P0 |
| 7 | Verify Email | Auth | P0 |
| 8-9 | Connect Feed (default + For You) | Feed | P0 |
| 10-12 | Post Detail + Comments + Keyboard | Feed | P1 |
| 13 | Template Picker Sheet | Feed | P1 |
| 14-23 | New Post Composer (10 templates) | Feed | P1 |
| 17 | Magazine Home | Magazine | P1 |
| 18 | Article Detail | Magazine | P1 |
| 19 | Events List | Events | P1 |
| 20 | Event Detail | Events | P1 |
| 21 | RSVP Success | Events | P2 |
| 22 | Games Hub | Games | P1 |
| 23 | Trivia Question | Games | P1 |
| 24 | Trivia Answer Revealed | Games | P1 |
| 25 | Trivia Complete | Games | P1 |
| 26 | Already Played | Games | P2 |
| 27-28 | Member Dashboard (Pro + Citizen) | Member | P0 |
| 29-33 | Settings (5 tabs) | Member | P1 |
| 34-35 | Wallet (History + Cash Out) | Member | P1 |
| 36 | Perks Browse | Member | P1 |
| 37-39 | Coupons (Active + Expired + Empty) | Member | P1 |
| 40 | Member Directory | Directory | P1 |
| 41-42 | Public Profile (Community + Portfolio tab) | Directory | P2 |
| 43-44 | Notifications (List + Empty) | Notifications | P1 |
| 45 | Analytics Dashboard | Analytics | P2 |
| 46-50 | Overlay components (9 types) | Overlays | P1 |
| 51-58 | Dark mode (8 screens) | Dark Mode | P2 |
| 59-67 | Skeleton/loading states (9 types) | Loading | P2 |
| 68 | Lifestyle Shop Home | Shop | P1 |
| 69-71 | Product Listing (Grid, List, Empty) | Shop | P1 |
| 72-73 | Product Detail (Standard + Pro member) | Shop | P0 |
| 74-77 | Cart Screen, Cart Empty, Checkout Handoff, Cart Drawer | Shop | P0 |
| 78 | Maker/Brand Profile | Shop | P1 |
| 79 | The Moveee Edit (curated picks) | Shop | P2 |
| 80-83 | Search, Filter Sheet, Early Access Gate, Order Confirmation | Shop | P1 |
| 84-86 | Bottom sheet shell (3 states: peek, full, dismiss) | Drawers | P1 |
| 87-96 | Bottom sheet variants (10 community templates + Editorial + Quote + Happening + Directory) | Drawers | P1 |
| 97-100 | Bottom sheet edge cases (share, compose, overscroll, error) | Drawers | P2 |

**Total: ~100 screens / states**

---

*Generated for travellertope/moveee — Moveee Connect mobile app (apps/mobile/)*
*Codebase reference date: June 2026*
*Brand system: Fraunces + DM Sans + JetBrains Mono · Ochre #C5491F · Gold #B38238 · Paper-warm #F3ECE0*
