# Moveee Connect — React Native Implementation Spec

> **Purpose:** This document is the single source of truth for implementing the full Connect feed, member directory, profiles, and membership system inside `moveee-connect/`. Every design detail, component behaviour, API shape, and interaction pattern from the web app is captured here. Work through each section in order. Do not invent — replicate exactly.

---

## 0. Orientation

### Repository layout
```
moveee/                         ← monorepo root
  app/                          ← Next.js web app (READ THIS as ground truth)
  components/                   ← web components (copy logic, adapt to RN)
  lib/                          ← shared data/auth helpers
  moveee-connect/               ← React Native Expo app (YOU ARE BUILDING THIS)
    src/
      api/                      ← typed WP REST client
      auth/                     ← Zustand auth store + SecureStore
      components/               ← shared RN components
      features/                 ← data hooks (useFeed, useComments, …)
      navigation/               ← tab + stack navigators
      screens/                  ← one folder per tab
      store/                    ← MMKV cache helpers
      types/                    ← TypeScript interfaces
```

### Golden rule
The web app in `app/` and `components/` is the **definitive reference**. When anything in this spec is ambiguous, read the source web component. Never guess at a colour, spacing value, or API endpoint — they are all documented below or findable in the web source.

---

## 1. Design Tokens

Copy these into `src/theme.ts`. Use them everywhere — never hardcode hex values or font names inline.

### Colours
```ts
export const colors = {
  // Backgrounds
  paper:       '#ffffff',
  paperDeep:   '#f5f5f5',
  paperWarm:   '#f3ece0',

  // Text
  ink:         '#14110d',   // primary text / dark backgrounds
  inkSoft:     '#3a342b',   // body text
  mute:        '#7a6f5c',   // secondary / labels
  ghost:       '#c8bfb0',   // disabled / very faint

  // Borders / rules
  rule:        '#e8e2d8',   // standard border
  ruleDark:    'rgba(42,36,28,0.15)',

  // Accent — primary actions
  ochre:       '#c5491f',
  ochreDark:   '#8a2d10',

  // Accent — patron / gold
  gold:        '#b38238',
  goldLight:   'rgba(179,130,56,0.10)',
  goldBorder:  'rgba(179,130,56,0.40)',

  // Community (green)
  communityBorder: '#81c784',
  communityBg:     '#edf7ed',
  communityText:   '#2e7d32',

  // Type badge backgrounds
  badgePulseBg:     '#fef3e2',
  badgePulseText:   '#b38238',
  badgeEditorialBg: '#fff0eb',
  badgeEditorialText:'#c5491f',
  badgeHappeningBg: '#eeedfe',
  badgeHappeningText:'#3c3489',
  badgeDirectoryBg: '#e8f5ee',
  badgeDirectoryText:'#085041',
  badgeQuoteBg:     '#f3eef8',
  badgeQuoteText:   '#7a4da0',

  // Template badge colours
  templateGemBg:      'rgba(179,130,56,0.10)',
  templateGemText:    '#b38238',
  templateTakeBg:     'rgba(107,72,168,0.08)',
  templateTakeText:   '#6b48a8',
  templateFoodBg:     'rgba(197,73,31,0.08)',
  templateFoodText:   '#c5491f',
  templateShowcaseBg: 'rgba(25,118,210,0.08)',
  templateShowcaseText:'#1976d2',
  templateRouteBg:    'rgba(46,125,50,0.08)',
  templateRouteText:  '#2e7d32',

  // Poll
  pollVoteBg:  'rgba(46,125,50,0.10)',
  pollBorder:  '#e0d8ce',
  pollWinner:  '#2e7d32',
} as const;
```

### Typography
```ts
import { Platform } from 'react-native';

export const fonts = {
  serif:  'Fraunces_400Regular',    // headlines, quotes, italic body
  serifBold: 'Fraunces_700Bold',
  sans:   'DMSans_400Regular',      // body
  sansMedium: 'DMSans_500Medium',
  sansBold: 'DMSans_700Bold',
  mono:   'JetBrainsMono_400Regular', // labels, eyebrows, handles
  monoBold: 'JetBrainsMono_700Bold',
} as const;

export const fontSize = {
  eyebrow: 9,   // always uppercase + tracked
  tiny:   10,
  xs:     11,
  sm:     12,
  base:   14,
  md:     16,
  lg:     18,
  xl:     22,
  '2xl':  28,
  '3xl':  36,
} as const;

export const letterSpacing = {
  tracked:  1.2,   // eyebrows
  normal:   0,
  tight:   -0.3,
} as const;
```

### Spacing scale
```ts
export const space = {
  1:  4,
  2:  8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
 10: 40,
 12: 48,
 14: 56,
 16: 64,
} as const;
```

### Border radius
```ts
export const radius = {
  sm:   2,
  md:   4,
  lg:   6,
  full: 9999,
} as const;
```

---

## 2. Type Definitions

Replace `src/types/index.ts` entirely with the following. These mirror the web app exactly.

```ts
// ── Tiers ──────────────────────────────────────────────────────────────────
export type Tier = 'citizen' | 'patron';

// ── Auth user (mirrors CultureUser in lib/auth.ts) ─────────────────────────
export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  tier: Tier;

  // Contact
  phone: string;
  whatsapp: string;

  // KYC
  gender: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  city: string;
  occupation: string;

  // Gamification
  credits: number;
  reputation: number;
  points: number;           // legacy alias for reputation
  reputationTier: string;   // 'member' | 'culture-contributor' | 'taste-maker' | 'culture-authority'
  dailyCreditsRemaining: number;
  badges: string[];

  // Social
  referralCode: string;
  referralCount: number;
  registeredAt: number;     // Unix timestamp (seconds)

  // Directory
  directoryOptIn: boolean;
  directoryBio: string;
  directoryDisciplines: string[];
  directoryInstagram: string;
  directoryLinkedIn: string;
  directoryWebsite: string;

  // Interests
  interests: string[];

  // Misc
  isVendor: boolean;
  vendorSlug: string;
}

// ── Member (directory listing — public subset of User) ─────────────────────
export interface Member {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  tier: Tier;
  occupation: string;
  city: string;
  countryOfResidence: string;
  bio: string;
  disciplines: string[];
  instagram: string;
  linkedin: string;
  website: string;
}

// ── Unified feed ────────────────────────────────────────────────────────────
export type FeedItemType =
  | 'pulse' | 'editorial' | 'happening'
  | 'directory' | 'quote' | 'community';

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  image?: string | null;
  href: string;

  // Pulse
  arm?: string;
  region?: string;
  source?: string | null;
  sourceUrl?: string | null;
  body?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;

  // Happening / event
  eventDate?: string;
  location?: string;

  // Directory
  entryType?: string;

  // Quote
  quoteSource?: string;
  quoteAuthor?: string;

  // Editorial
  category?: string;

  // Community
  communityAuthor?: string;
  communityAuthorUsername?: string;
  communityAuthorAvatar?: string;
  communityTag?: string;
  communityTier?: string;
  commentCount?: number;

  // Community template fields
  templateType?: TemplateType;
  linkedDirectoryId?: number;
  starRating?: number;
  locationName?: string;
  pollOptions?: PollOption[];
  pollExpiresAt?: string;
  galleryImages?: string[];
  videoUrl?: string;
  itineraryStops?: ItineraryStop[];
  foodDishName?: string;
  foodRatingTaste?: number;
  foodRatingValue?: number;
  foodRatingVibe?: number;

  // Reactions
  reactions?: { love: number; fire: number; clap: number };
  wpId?: string;
}

// ── Community post templates ─────────────────────────────────────────────────
export type TemplateType =
  | 'post' | 'hidden-gem' | 'cultural-take' | 'food-review'
  | 'creative-showcase' | 'poll' | 'itinerary' | 'event' | 'quote';

export interface PollOption {
  text: string;
  votes: number;
}

export interface ItineraryStop {
  name: string;
  lat: number;
  lng: number;
  note: string;
  image_url: string;
}

// ── Article (magazine) ───────────────────────────────────────────────────────
export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: { name: string; avatarUrl: string; slug: string };
  category: string;
  publishedAt: string;
  readingTime: number;
  liked: boolean;
  bookmarked: boolean;
  likeCount: number;
}

// ── Event ─────────────────────────────────────────────────────────────────────
export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  capacity: number;
  spotsLeft: number;
  rsvpd: boolean;
  tier: 'all' | 'citizen' | 'patron';
}

// ── Comment ───────────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  authorName: string;
  authorAvatar?: string;
  authorUsername?: string;
  content: string;
  date: string;
  parentId?: string;
}
```

---

## 3. API Client

The RN app calls the **same WordPress REST API** as the web. All endpoints live at `EXPO_PUBLIC_WP_URL/wp-json/…`.

### `src/api/client.ts`

```ts
const BASE = process.env.EXPO_PUBLIC_WP_URL + '/wp-json';

export async function wpGet<T>(path: string, params?: Record<string, string>, token?: string): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

export async function wpPost<T>(path: string, body: unknown, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}
```

### Endpoint reference

| Operation | Endpoint | Auth |
|-----------|----------|------|
| Login | `POST /culture/v1/login` { username, password } | No |
| Fetch unified feed (community) | `GET /wp/v2/community-posts?per_page=24&orderby=date&order=desc&_fields=id,slug,date,title,content,meta,comment_count` | No |
| Submit community post | `POST /wp/v2/community-posts` | Basic (app password) |
| React to post | `POST /culture/v1/react` { post_id, reaction } | JWT |
| Comment | `POST /culture/v1/comment` { post_id, content } | JWT |
| Get comments | `GET /culture/v1/comments?post_id=X` | No |
| Poll vote | `POST /culture/v1/poll-vote` { post_id, option_index } | JWT |
| Report post | `POST /culture/v1/report` { post_id, reason } | JWT |
| Member directory | `GET /culture/v1/members?search=&discipline=&location=&page=1` | No |
| Member profile | `GET /culture/v1/members/{username}` | No |
| Member posts | `GET /culture/v1/members/{username}/posts` | No |
| Update profile | `POST /culture/v1/profile` { ...fields } | JWT |

---

## 4. Auth Store

### `src/auth/authStore.ts`

```ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<User>) => void;
}

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (username, password) => {
    const WP = process.env.EXPO_PUBLIC_WP_URL;
    const res = await fetch(`${WP}/wp-json/culture/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    await SecureStore.setItemAsync('jwt', data.token);
    set({ user: data.user, token: data.token });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('jwt');
    set({ user: null, token: null });
  },

  updateUser: (patch) => set(s => ({ user: s.user ? { ...s.user, ...patch } : null })),
}));
```

---

## 5. Feed Data Hook

### `src/features/community/useFeed.ts`

The feed is fetched from the WP REST API and mapped to `FeedItem[]`. The web app's `lib/unified-feed.ts` has the exact mapping logic — replicate `getCommunityPosts()` here.

**Key mapping points:**
- `post.meta._gallery_images` — JSON string → `string[]`
- `post.meta._poll_options` — JSON string → `PollOption[]`
- `post.meta._itinerary_stops` — JSON string → `ItineraryStop[]`
- `post.meta.community_author_tier` — `'patron'` = Pro, `'citizen'` = Citizen
- Content: strip HTML, preserve paragraph breaks (`</p><p>` → `\n\n`)
- `post.meta._template_type` defaults to `'post'` if missing

```ts
import { useState, useCallback } from 'react';
import { FeedItem } from '../../types';
import { mapCommunityPost } from './mapCommunityPost';  // extracted mapper

const PER_PAGE = 24;

export function useFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [page, setPage]   = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    const p = reset ? 1 : page;
    try {
      const WP = process.env.EXPO_PUBLIC_WP_URL;
      const url =
        `${WP}/wp-json/wp/v2/community-posts` +
        `?per_page=${PER_PAGE}&page=${p}&orderby=date&order=desc` +
        `&_fields=id,slug,date,title,content,meta,comment_count` +
        `&meta_fields=community_author_name,community_author_id,community_author_username,community_tag,` +
        `community_region,community_author_tier,community_author_avatar,community_image_url,` +
        `community_link_url,community_og_title,community_og_description,community_og_image,` +
        `reaction_love,reaction_fire,reaction_clap,_template_type,_linked_directory_id,_star_rating,` +
        `_location_name,_poll_options,_poll_expires_at,_gallery_images,_video_url,_itinerary_stops,` +
        `_food_dish_name,_food_rating_taste,_food_rating_value,_food_rating_vibe`;

      const posts: any[] = await fetch(url).then(r => r.json());
      const mapped = posts.map(mapCommunityPost);

      setItems(prev => reset ? mapped : [...prev, ...mapped]);
      setPage(p + 1);
      setHasMore(posts.length === PER_PAGE);
    } finally {
      setLoading(false);
    }
  }, [loading, page]);

  return { items, loading, hasMore, load, refresh: () => load(true) };
}
```

---

## 6. Navigation Structure

```
Root Navigator (Stack)
├── Auth Stack
│   ├── LoginScreen
│   └── RegisterScreen (WebView → /register)
└── Main Tab Navigator
    ├── Tab: Feed (ConnectFeedScreen)
    ├── Tab: Magazine (MagazineScreen)
    ├── Tab: Events (EventsScreen)
    ├── Tab: Games (GamesScreen)
    └── Tab: Me (MemberScreen or LoginPromptScreen)

Feed Stack (pushed from ConnectFeedScreen)
├── PostDetailScreen (post + comments)
├── MemberProfileScreen (public profile)
├── NewPostScreen (composer)
└── HashtagFeedScreen

Member Stack (from Me tab)
├── MemberDashboardScreen
├── MemberSettingsScreen
├── MemberCollectionScreen
└── MembershipScreen
```

---

## 7. ConnectFeedScreen

**Source reference:** `app/connect/page.tsx` + `components/pulse/PulseFeed.tsx`

### Layout
```
<SafeAreaView>
  <FlatList
    ListHeaderComponent={<FeedHeader />}
    data={visibleItems}
    renderItem={({ item }) => <FeedCard item={item} />}
    keyExtractor={item => item.id}
    onEndReached={() => load()}
    onEndReachedThreshold={0.5}
    refreshControl={<RefreshControl onRefresh={refresh} />}
  />
  {loggedIn && <FAB onPress={openNewPost} />}   {/* Compose button */}
</SafeAreaView>
```

### FeedHeader
Contains in order:
1. **Category filter strip** (horizontal `ScrollView`, `horizontal showsHorizontalScrollIndicator={false}`)
2. **Active filter chip** (if tag/category active, shows clearable chip)

### Category filter strip
- Pills: All · Pulse · News · Editorial · Event · Directory · Quote
- Below that (second row or combined): Music · Film · Art · Fashion · Literature · Food · Tech · Sport · Travel · Design · Ideas
- Active pill: `color: ochre`, `borderBottomWidth: 2`, `borderBottomColor: ochre`
- Inactive: `color: mute`
- Font: `fonts.mono`, `fontSize.xs`, `letterSpacing.tracked`, uppercase

### Filtering logic (client-side on loaded items)
```ts
// Type filter
const typeMatch = activeType === 'all' || item.type === activeType;

// Category filter (for non-community items)
const catMatch = !activeCategory || (
  (item.type === 'pulse'     && item.category?.toLowerCase()  === activeCategory.toLowerCase()) ||
  (item.type === 'editorial' && item.category?.toLowerCase()  === activeCategory.toLowerCase()) ||
  (item.type === 'directory' && item.entryType?.toLowerCase() === activeCategory.toLowerCase())
);

// Community tag filter
const tagMatch = !activeTag || (
  item.type === 'community' && (
    activeTag.startsWith('#')
      ? item.title.toLowerCase().includes(activeTag.toLowerCase())
      : item.communityTag === activeTag
  )
);
```

---

## 8. FeedCard Component

**Source reference:** `components/pulse/FeedCard.tsx`

Single component with 6 rendering branches based on `item.type`. Each branch is described below.

### 8.1 Community card

```
┌─────────────────────────────────────────────────────┐
│ [Avatar 34px] [Name] [PRO badge?] · [date]    [TAG] │
│               [Template badge if not 'post']        │
│               [📍 locationName if set]              │
│               [Text — max 6 lines, tap to expand]   │
│               [Gallery | Single image | Video |     │
│                Poll | Itinerary | Food ratings]     │
│ ─────────────────────────────────────────────────── │
│ ❤️ N  🔥 N  👏 N            [Share]  [💬 N]  [⚑]   │
└─────────────────────────────────────────────────────┘
```

**Left border:** `borderLeftWidth: 3, borderLeftColor: colors.communityBorder`

**Avatar (34×34, borderRadius: 17):**
- Show image if `communityAuthorAvatar` exists
- Fallback: initials (first letter of each word in name, max 2), `fontSize: 10, fontFamily: fonts.mono, fontWeight: '700'`
- Background: `colors.communityBg`
- Border: `1px solid colors.communityText` (green)

**Name:** `fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink` — tappable → `MemberProfileScreen`

**Pro badge** (if `communityTier === 'patron'`):
```
fontFamily: fonts.mono
fontSize: 8
letterSpacing: 2
textTransform: 'uppercase'
color: colors.gold
backgroundColor: colors.goldLight
borderWidth: 1
borderColor: colors.goldBorder
paddingHorizontal: 5, paddingVertical: 1
```

**Date:** `fontFamily: fonts.mono, fontSize: 10, color: colors.mute`

**Tag chip** (top-right, if `communityTag`):
```
backgroundColor: colors.communityBg
color: colors.communityText
fontSize: 9, fontWeight: '700', letterSpacing: 1.5
textTransform: 'uppercase'
paddingHorizontal: 6, paddingVertical: 2
borderRadius: 2
```

**Template badge** (if `templateType` and not `'post'`):

| templateType | label | bg | text |
|---|---|---|---|
| `hidden-gem` | `Hidden Gem ★★★★` (stars = starRating) | `colors.templateGemBg` | `colors.templateGemText` |
| `cultural-take` | `Cultural Take` | `colors.templateTakeBg` | `colors.templateTakeText` |
| `food-review` | `Food Review · {foodDishName}` | `colors.templateFoodBg` | `colors.templateFoodText` |
| `creative-showcase` | `Creative Showcase` | `colors.templateShowcaseBg` | `colors.templateShowcaseText` |
| `itinerary` | `Weekend Route` | `colors.templateRouteBg` | `colors.templateRouteText` |

Badge style: `fontSize: 9, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2`

**Location line** (if `locationName`):
`📍  {locationName}` — `fontSize: 11, color: colors.mute`

**Post text:**
- `fontFamily: fonts.sans, fontSize: 14, color: colors.ink, lineHeight: 22`
- Clamp to 6 lines (`numberOfLines={expanded ? undefined : 6}`)
- Hashtags (`#word`) rendered in `colors.gold, fontWeight: '600'`
- Tapping on text → expand or open PostDetailScreen

**Food ratings** (if `templateType === 'food-review'` and `foodRatingTaste`):
```
Taste ★★★☆☆  Value ★★★★☆  Vibe ★★☆☆☆
```
`fontSize: 11, color: colors.mute`, stars in `colors.gold`

**Poll** (if `pollOptions`):
- Each option: full-width pressable row
- Before voting: white bg, `borderWidth: 1, borderColor: colors.rule`
- After voting / expired: background fills proportionally with `colors.pollVoteBg`
- Winning option: `borderColor: colors.pollWinner`
- Show vote count + "% · N votes · ends DD Mon"
- Disable interaction after voting or expiry

**Gallery** (if `galleryImages.length >= 1`):
- Horizontal `ScrollView` with `pagingEnabled`
- Each image: `height: 200`, `width: Dimensions.get('window').width - 32` (inset)
- `borderRadius: 6`
- Tappable → full-screen modal lightbox
- Show dot indicators if > 1 image

**Single image** (if `image` and no `galleryImages`):
- `width: '100%', height: 200, borderRadius: 6`
- Tappable → lightbox

**Video** (if `videoUrl`):
- If YouTube: embed via `react-native-youtube-iframe` or show thumbnail + play overlay linking to YouTube
- Other URLs: tappable link row

**Itinerary stops** (if `itineraryStops`):
```
○ 1  Stop name
      Note text (optional)
○ 2  ...
```
Numbered circle: 22×22, `backgroundColor: colors.gold, color: '#fff', fontWeight: '700', fontSize: 10`

**Link preview** (if `sourceUrl` and no image):
- Card with OG title, description (2 lines), domain, OG image thumbnail (right)
- `backgroundColor: colors.paperDeep, borderRadius: 6, borderWidth: 1, borderColor: colors.rule`

**Footer (reaction bar):**
- ❤️ `love count`  🔥 `fire count`  👏 `clap count`  (equally spaced, left-aligned)
- Each: tappable, optimistic count increment
- Share icon (right side)
- 💬 comment count (tappable → PostDetailScreen)
- ⚑ report (small, rightmost, `color: colors.ghost`)
- `borderTopWidth: 1, borderTopColor: colors.rule, paddingTop: 8, marginTop: 8`
- Reaction font: `fontSize: 12, color: colors.mute`

---

### 8.2 Pulse card

```
┌─────────────────────────────────────────────────────┐
│ [PULSE] [region?] [arm?]                    [date]  │
│ Headline (Fraunces bold, 15px)                      │
│ [Featured image 180px tall, if available]           │
│ Excerpt text (6 lines, DM Sans 13px)                │
│ [Link preview card, if sourceUrl]                   │
│ ─────────────────────────────────────────────────── │
│ ❤️ N  🔥 N  👏 N            [Share]  [💬 N]         │
└─────────────────────────────────────────────────────┘
```

- Type badge: `PULSE` — `bg: colors.badgePulseBg, color: colors.badgePulseText`
- Headline: `fontFamily: fonts.serifBold, fontSize: 15, color: colors.ink`
- Excerpt: `fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft, numberOfLines: 6`
- "Read more" tappable (if long) → PostDetailScreen

### 8.3 Editorial card

- Badge: `EDITORIAL` — `bg: colors.badgeEditorialBg, color: colors.badgeEditorialText`
- Featured image 180px tall
- Title: Fraunces serif
- Excerpt 3 lines
- Tapping anywhere → in-app article reader

### 8.4 Happening / Event card

- Badge: `HAPPENING` — `bg: colors.badgeHappeningBg, color: colors.badgeHappeningText`
- Event date formatted as `"8 Jun 2026"` (same locale as web: `en-GB`)
- Location subtitle
- Featured image

### 8.5 Directory card

- Badge: `DIRECTORY` — `bg: colors.badgeDirectoryBg, color: colors.badgeDirectoryText`
- Entry type subtitle

### 8.6 Quote card

- Opening `"` mark: `fontFamily: 'serif', fontSize: 32, color: colors.ghost`
- Quote text: `fontFamily: fonts.serif, fontSize: 15, fontStyle: 'italic', color: colors.ink`
- Author: `color: colors.ochre, fontSize: 12, fontWeight: '600'`
- Source: `color: colors.mute, fontSize: 11`
- Type badge: `QUOTE` — purple

---

## 9. PostDetailScreen (Comments)

**Source reference:** `components/pulse/CommunityDetailModal.tsx` + `PulseDetailModal.tsx`

```
<SafeAreaView>
  <ScrollView>
    <FeedCard item={item} />          {/* full card, no line clamp */}
    <SectionLabel>Comments</SectionLabel>
    {comments.map(c => <CommentRow comment={c} />)}
    {loading && <ActivityIndicator />}
  </ScrollView>
  <KeyboardAvoidingView>
    <CommentInput onSubmit={submitComment} />
  </KeyboardAvoidingView>
</SafeAreaView>
```

**CommentRow:**
- Avatar 28×28 (initials fallback) + name + timestamp
- Comment text
- Nested replies indented 24px left

**CommentInput:**
- Full-width text input, `borderTopWidth: 1, borderTopColor: colors.rule`
- Avatar of current user on the left (28px)
- "Post" send button (right) — disabled when empty
- Submit calls `POST /culture/v1/comment`

---

## 10. NewPostScreen (Composer)

**Source reference:** `components/pulse/SubmitPost.tsx`

This is the most complex screen. Implement as a full-screen bottom sheet or modal stack.

### Template selector (top scrollable row)
8 pills, horizontal scroll:

| slug | label | emoji |
|------|-------|-------|
| `post` | Update | 📝 |
| `hidden-gem` | Gem | 💎 |
| `cultural-take` | Take | 💬 |
| `food-review` | Food | 🍽️ |
| `creative-showcase` | Showcase | 🎨 |
| `poll` | Poll | 📊 |
| `itinerary` | Route | 🗺️ |
| `quote` | Quote | ✦ |

Active pill: filled `backgroundColor: colors.ink, color: '#fff'`
Inactive: `backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.rule, color: colors.mute`

### Guide text + starter chips
Show when `text.length === 0`. Hide when user starts typing (fade out).

Each template has a description and 3 starter chips:

| Template | Description | Chips |
|----------|-------------|-------|
| post | Share news, a link, or a quick thought from your cultural world. | "Hot take:", "Just saw that", "Anyone else noticed" |
| hidden-gem | Recommend a place worth visiting — hidden spots, local favourites, underrated venues. | "Hidden gem alert:", "Not enough people know about", "If you haven't been to" |
| cultural-take | Share a cultural opinion on a book, film, event, or idea worth discussing. | "Here's my honest take on", "I finally watched/read", "Why this matters:" |
| food-review | Review a dish or restaurant. Rate the taste, value, and vibe. | "Came for the hype, and", "Best thing on the menu:", "Honest review:" |
| creative-showcase | Share your creative work — art, photography, design, or music. | "Working on something:", "New piece:", "Behind the work:" |
| poll | Ask the community something. Great for settling debates or gathering opinions. | "Which is better:", "Settle this for me:", "Genuine question:" |
| itinerary | Share a travel itinerary or a local route worth following. | "A perfect day in", "My go-to route:", "For first-timers in" |
| quote | Share a quote that moved you. Add the author and source below. | "This has stayed with me:", "Still thinking about this:", "Words I keep returning to:" |

Chips: tappable → prepend chip text to textarea + focus

### Validation rules per template

| Template | Min text | Max text | Required extra |
|----------|----------|----------|----------------|
| post | 1 | 3000 | — |
| hidden-gem | 50 | 500 | starRating > 0, directoryEntry, 1+ image |
| cultural-take | 100 | 1000 | directoryEntry |
| food-review | 50 | 500 | foodDishName, foodTaste/Value/Vibe > 0, 1+ image |
| creative-showcase | 0 | 500 | galleryFiles OR videoUrl |
| poll | 10 | 280 | 2+ poll options |
| itinerary | 0 | 300 | 2+ stops |
| quote | 10 | 600 | quoteAuthor |

### Section tag selector
- Not shown for `food-review` (auto-assigns "Food") or `quote`
- Dropdown / action sheet with: Music, Fashion, Art, Film, Food, Sport, Travel, Ideas, Literature, Design, Tech
- Auto-detects from content using keyword scoring (see `TEMPLATE_TAGS` and `detectTagFromContent` in web `SubmitPost.tsx`)

### Template-specific fields

**DirectorySearch** (for `hidden-gem`, `cultural-take`, `food-review`):
- Search input → calls `GET /culture/v1/directory/search?q=&type=`
- Results list with title + city subtitle
- "Add to directory" flow with optional city input

**StarRating** (for `hidden-gem`):
- 5 tappable stars, filled gold on selection

**MultiRating** (for `food-review`):
- 3 rows: Taste / Value / Vibe, each 5 stars

**PollBuilder** (for `poll`):
- 2 text inputs (min), "+Add option" up to 4
- Duration picker: 1, 3, 5, 7 days

**ItineraryBuilder** (for `itinerary`):
- Each stop: name input (required) + note (optional)
- "Add stop" button
- Min 2 stops to submit

**Quote author/source** (for `quote`):
- Two inputs: Author * | Source (optional)

### Image handling
- Single image: `ImagePicker.launchImageLibraryAsync` (for `post`)
- Gallery (multi): up to 10 images (for `hidden-gem`, `food-review`, `creative-showcase`)
- Upload via `POST /api/community/upload-image` (FormData)
- Max 8 MB per image

### Character counter
- Shows remaining chars
- Warn style at < 50 remaining: `color: colors.gold`
- Error style at < 0: `color: colors.ochre`

---

## 11. MemberDirectoryScreen

**Source reference:** `app/connect/people/page.tsx` + `components/connect/MemberDirectory.tsx`

### Layout
```
<SafeAreaView>
  <SearchBar />
  <FilterRow />          {/* Discipline + Location pickers */}
  <FlatList
    numColumns={2}
    data={filteredMembers}
    renderItem={({ item }) => <MemberCard member={item} />}
  />
</SafeAreaView>
```

### Search
- Debounce 350ms
- Searches name, role, location client-side (after full list is loaded)

### Filters
**Discipline** (picker/action sheet):
All, Creative, Entrepreneur, Artist, Filmmaker, Writer, Designer, Musician, Photographer, Tech, Legal, Finance, Academic

**Location** (picker/action sheet):
All, Nigeria, United Kingdom, United States, Ghana, South Africa, Kenya, France, Canada, Other

### MemberCard

```
┌────────────────────────────┐
│ [Avatar 40px]  Name        │  [PRO] (top-right)
│                @handle     │
│                Location    │
│                Discipline  │
│                tags…       │
│                Bio 2 lines │
│                Links row   │
└────────────────────────────┘
```

**Avatar:** 40×40 circle. Initials on dark bg (`colors.ink`) or image.

**Name:** `fontFamily: fonts.serifBold, fontSize: 15, color: colors.ink, numberOfLines: 1`

**Handle:** `fontFamily: fonts.mono, fontSize: 9, color: colors.mute, letterSpacing: 1`

**Location:** `fontFamily: fonts.mono, fontSize: 9, color: colors.mute, textTransform: 'uppercase', letterSpacing: 1`

**Discipline tags** (up to 3):
```
backgroundColor: 'rgba(179,130,56,0.1)'
color: colors.gold
fontSize: 10
borderRadius: 2
paddingHorizontal: 6, paddingVertical: 2
```

**Bio:** `fontFamily: fonts.sans, fontSize: 11, color: colors.mute, numberOfLines: 2`

**Links row (Instagram / LinkedIn / Website):**
`fontFamily: fonts.mono, fontSize: 9, color: colors.gold` — tappable (Linking.openURL)

**Card border:**
- Patron: `borderColor: colors.gold` (1px)
- Citizen: `borderColor: colors.rule` (1px)

**Card hover/press:** `borderColor: colors.goldBorder` tint on press

**Empty state:**
```
"The directory is growing"
"Join & get listed →" (CTA link)
```

---

## 12. MemberProfileScreen (Public)

**Source reference:** `app/connect/[username]/page.tsx` + `profile.css`

```
<ScrollView>
  <ProfileHeader />
  <TabBar tabs={['Community', 'Portfolio']} />
  {activeTab === 'Community' && <PostsList />}
  {activeTab === 'Portfolio'  && <PortfolioGrid />}
</ScrollView>
```

### ProfileHeader

**Avatar:** 72×72, `borderRadius: 36`
- If `patron`: border `2px solid colors.gold`
- If `citizen`: border `1px solid colors.rule`

**Name:** `fontFamily: fonts.serifBold, fontSize: 26, color: colors.ink`

**Handle + location + occupation:**
`@username · City · Occupation`
`fontFamily: fonts.mono, fontSize: 10, color: colors.mute, letterSpacing: 1`

**Tier badge:**
```
patron:
  text: 'Connect Pro'
  backgroundColor: colors.gold
  color: colors.ink
  fontFamily: fonts.mono
  fontSize: 8, letterSpacing: 2
  paddingHorizontal: 8, paddingVertical: 3
  borderRadius: 2

citizen:
  text: 'Connect Citizen'
  backgroundColor: 'rgba(243,236,224,0.12)'
  borderWidth: 1
  borderColor: colors.rule
  color: colors.mute
```

**Reputation tier badge:**
- `'member'` → no badge shown (or "Member")
- `'culture-contributor'` → "Culture Contributor"
- `'taste-maker'` → "Taste Maker"
- `'culture-authority'` → "Culture Authority"
- Style: `fontFamily: fonts.mono, fontSize: 8, letterSpacing: 1.5, color: colors.ochre, borderWidth: 1, borderColor: colors.ochre`

**Badges shelf:**
- Small grid of badge items (emojis with labels)
- Show up to 6, then "View all"

**Bio:** `fontFamily: fonts.serif, fontSize: 13, fontStyle: 'italic', color: colors.inkSoft, lineHeight: 20`

**Stats row:**
```
Reputation  |  Posts  |  Joined
   1,234    |   47    |  Jan 2024
```
`fontFamily: fonts.sans, fontSize: 12, color: colors.ink`
Label: `fontFamily: fonts.mono, fontSize: 9, color: colors.mute, textTransform: 'uppercase'`

---

## 13. MemberDashboardScreen (Private)

**Source reference:** `app/member/page.tsx`

Requires authentication. Shows when `Me` tab is tapped by a logged-in user.

### Hero section
- Avatar 72px (same style as public profile)
- Display name (Fraunces, 28px)
- Tier badge
- City

### Stats bar (4-column grid)
| Label | Value |
|-------|-------|
| Culture Points | `user.credits` |
| Reputation | `user.reputation` |
| Badges | `user.badges.length` |
| Daily credits | `user.dailyCreditsRemaining` |

Style: `borderTopWidth: 1, borderTopColor: colors.rule` for each column except first

### Passkey banner
If `user.hasPasskey === false`, show a gold-bordered card **above** the stats bar:
```
🔑 Set up a passkey to unlock your rewards
   You have N credits waiting in escrow →
```
- Tapping navigates to Security settings (Section 14, Security tab)
- `user.creditsEscrowed` shows the number in the banner
- Hide entirely when `user.hasPasskey === true`

### Badges grid
- 4-column grid of `BadgeItem` components
- Each: emoji icon + label + short description
- Earned badges: full opacity; locked: `opacity: 0.35`

### "How to Earn" table
| Action | Credits | Rep |
|--------|---------|-----|
| Post validated (5+ reactions or 3+ comments) | +10 | +5 |
| Hidden Gem / Food Review validated | +15 | +10 |
| Event RSVP | +1 | +5 |
| Event check-in | +2 | +15 |
| Refer a member | +3 | +25 |
| Newsletter comment | +1 | +10 |
| Share a quote | +1 | +10 |
| Quote liked | — | +1 |
| Read magazine | +1 | +5 |
| Share magazine | +1 | +5 |
| Directory entry | +2 | +15 |
| Game completed | +1 | +5 |

### Side column (below or after stats on mobile)
- **Upgrade CTA** (Citizens only): card with "Upgrade to Connect Pro →"
- **Referral link**: copyable input with share button
- **Quick links**: My Wallet, My Coupons, Collection, Settings, Newsletters, Events, Magazine, Sign out

---

## 14. MemberSettingsScreen

**Source reference:** `app/member/settings/layout.tsx` + sub-routes

Settings is now a **tabbed layout** with 5 tabs. On mobile, render as a top horizontal scroll strip of tab buttons (`.prf-tab` style). Each tab is a separate screen in the navigation stack (or a top tab navigator).

Tabs: Profile | Directory | Interests | Newsletters | Security

### Tab 1 — Profile
**Source:** `app/member/settings/profile/page.tsx`

Fields: Display name, email (readonly), phone, WhatsApp, gender, date of birth, nationality, country of residence, city, occupation, avatar (image picker → upload)

### Tab 2 — Directory Profile
**Source:** `app/member/settings/directory/page.tsx`

- Toggle: "List me in the member directory"
- Bio (multiline textarea, 280 char limit)
- Disciplines (multi-select chips from allowlist)
- Instagram handle, LinkedIn URL, Website URL

### Tab 3 — Interests
**Source:** `app/member/settings/interests/page.tsx`

- 16 chips (Music, Film, Art, Fashion, Literature, Food, Tech, Sport, Travel, Design, Ideas, History, Science, Business, Health, Spirituality)
- Min 3 required (shown as helper text)
- Selected: filled `backgroundColor: colors.ink, color: '#fff'`
- Deselected: `borderWidth: 1, borderColor: colors.rule, color: colors.mute`

### Tab 4 — Newsletters
**Source:** `app/member/settings/newsletters/page.tsx`

- Toggle rows for each newsletter: GetMeLit, Culture Drop
- Tapping toggle calls `POST /culture/v1/newsletter-preferences`

### Tab 5 — Security
**Source:** `app/member/settings/security/page.tsx`

- "Change password" → opens forgot-password email flow
- **Passkey Manager** (key feature):
  - List of registered passkeys with device name + date added
  - "Add passkey" button → triggers WebAuthn registration
  - Swipe-to-delete each passkey
  - If no passkeys: shows "No passkeys yet" with prominent add button
  - API: `GET /api/auth/passkey/list` → list; `POST /api/auth/passkey/register-options` + `register-verify` → add; `DELETE /api/auth/passkey/delete` → remove

---

## 14b. PerksScreen (Partner Rewards)

**Source reference:** `app/connect/perks/page.tsx` + `PerksClient.tsx`

Shows available partner perks that members can redeem using their credits.

### Layout
- Hero: credit balance display (Fraunces 36px, `colors.ink`) + label "Culture Points"
- Grid of `PerkCard` components (2 columns)

### PerkCard
```
┌─────────────────────────┐
│ Partner name (muted)    │
│ Perk title (Fraunces)   │
│ Short description       │
│ ─────────────────────── │
│ N credits     [Redeem]  │
└─────────────────────────┘
```
- Border: `1px solid colors.rule`
- `[Redeem]` disabled (opacity 0.5) if user `credits < perk.credit_cost`
- `[Redeem]` shows "Sold out" text when `perk.max_total > 0 && perk.redeemed_count >= perk.max_total`

### Passkey gate
Redeeming a perk **requires** a passkey step-up. Flow:
1. User taps Redeem
2. App calls `POST /api/auth/passkey/step-up` → gets WebAuthn challenge
3. App calls `navigator.credentials.get()` (or `startAuthentication()` equivalent for RN using `react-native-passkeys` or WebView)
4. App calls `POST /api/auth/passkey/step-up-verify` with assertion → receives `step_up_token`
5. App calls `POST /api/perks/redeem` with `{ perk_id, step_up_token }`

If `user.hasPasskey === false`: show inline warning card instead of launching WebAuthn:
```
Passkey required to redeem perks.
Set up a passkey in Settings → Security →
```

### Success state
After successful redeem, replace the card with a success banner:
- "Perk redeemed! ✓" (Fraunces)
- "New balance: N credits"
- "View in My Coupons →" → navigates to CouponsScreen

### API
- `GET /api/connect/perks` (Next.js, returns perks + user credits)
- `POST /api/perks/redeem` body: `{ perk_id, step_up_token }`

---

## 14c. WalletScreen (Credits Balance & Cashout)

**Source reference:** `app/member/wallet/page.tsx` + `WalletClient.tsx`

### Layout
Two tabs: **History** | **Cash Out**

### History tab
Ledger of all credit events, newest first:
```
┌─────────────────────────────────────────────┐
│ +10 cr  Post validated          8 Jun 2026  │
│ -50 cr  Perk redeemed           5 Jun 2026  │
│ -200 cr Cash out                1 Jun 2026  │
└─────────────────────────────────────────────┘
```
- Positive amounts: `colors.communityGreen`
- Negative amounts: `colors.mute`
- Sources mapped to human labels (same as `WalletClient.LABELS` map):
  - `post_validated` → "Post validated", `perk_redeem` → "Perk redeemed", `cashout` → "Cash out", etc.

### Cash Out tab
Form to request a credit payout. Passkey step-up required before submitting.

**Top info line**: "Minimum 100 credits. A flat 30% fee applies."

**Credits input**: numeric input, min 100
**Fee preview** (shown once value ≥ 100):
```
Fee: 30% (N cr) · You receive: £X.XX
```
(`credits_per_gbp` rate from wallet balance response; default 10 cr = £1)

**Currency selector**: GBP | USD | NGN

**Bank fields (currency-aware)**:
| Currency | Fields |
|----------|--------|
| GBP | Account Name, Sort Code, Account Number |
| USD | Account Name, Bank Name (text), Routing Number, Account Number |
| NGN | Account Name, Bank Name (select from 23 Nigerian banks list), NUBAN Account Number |

NGN bank list (hardcoded): Access Bank, Citibank Nigeria, Ecobank, Fidelity, First Bank, FCMB, Globus, GTBank, Heritage, Keystone, Lotus, Polaris, Providus, Stanbic IBTC, Standard Chartered, Sterling, SunTrust, Titan Trust, Union Bank, UBA, Unity, Wema, Zenith Bank.

**Submit button**: disabled until all currency-specific fields filled AND step-up completes.
Step-up flow is identical to PerksScreen — call step-up endpoints, pass `step_up_token` with cashout request.

**After submit**: show confirmation card with redemption summary; clear form.

### API
- `GET /api/wallet/balance` → `{ credits, credits_per_gbp, user_id }`
- `GET /api/wallet/history` → `{ entries: LedgerEntry[], total }`
- `POST /api/wallet/cashout` body: `{ credits, method, currency, account_name, account_number, sort_code?, routing_number?, bank_name?, step_up_token }`

---

## 14d. CouponsScreen (Active Redemptions / QR Codes)

**Source reference:** `app/member/coupons/page.tsx` + `CouponsClient.tsx`

Shows all active perk redemptions as scannable QR codes. Partners scan the QR at point of sale.

### Layout
List of `CouponCard` components.

### CouponCard
```
┌────────────────────────────────────────┐
│ Perk title (Fraunces 18px)             │
│ Partner name (muted, JetBrains Mono)   │
│                                        │
│   ┌──────────────────────┐             │
│   │   [QR CODE IMAGE]    │             │
│   │   256 × 256          │             │
│   └──────────────────────┘             │
│                                        │
│ Expires in 5 days · 15 Jun 2026        │
│ Status: Active (green dot)             │
└────────────────────────────────────────┘
```
- QR value: `https://themoveee.com/api/perks/verify?token=<qr_token>`
- Use `react-native-qrcode-svg` (or equivalent) to render the QR
- "Expires in N days" — days until `expires_at`; show red if ≤ 2 days
- Used redemptions (status `used`) shown with a grey overlay + "Used" badge
- Expired redemptions: grey overlay + "Expired" badge

### Empty state
"No active coupons yet. Browse partner perks to redeem your credits →"

### API
- `GET /api/perks/verify?list=mine` → `Redemption[]` (user's own redemptions with perk detail)

---

## 15. MembershipScreen

**Source reference:** `app/connect/membership/page.tsx`

Two cards side by side (or stacked on narrow screens):

### Connect Citizen (Free)
```
FREE FOREVER
Connect Citizen

• Pulse feed & community posts
• Member directory listing
• Online event access
• GetMeLit & Culture Drop newsletters
• Culture points & badges

[Join free →]
```

### Connect Pro (Paid)
```
CONNECT PRO  ★

Everything in Citizen, plus:
• Connect Pro badge on posts
• Exclusive gated content & editorials
• Early access to product drops
• Pro pricing on Moveee Shop
• Early access to new features

[yearly price]   [Upgrade →]
[monthly price]
```

Patron card: `borderColor: colors.gold (2px)`, gold eyebrow

### CTA buttons
- Not logged in: → Login/Register screen
- Logged in Citizen: → Upgrade flow (IAP or WebView to `/register?upgrade=patron`)
- Already Pro: "Your current plan" badge, no CTA

---

## 16. Shared Components

### `TierBadge` (`src/components/ui/TierBadge.tsx`)
Props: `tier: Tier`
Renders the Pro / Citizen badge exactly as spec'd above.

### `Avatar` (`src/components/ui/Avatar.tsx`)
Props: `uri?: string, name: string, size: number, tier?: Tier`
- If uri: `<Image>` with `borderRadius: size/2`
- Else: initials on dark background
- Patron: gold border

### `ReactionBar` (`src/components/community/ReactionBar.tsx`)
Props: `postId: string, initialCounts: { love: number; fire: number; clap: number }, shareUrl?: string`
- Optimistic update on tap
- Calls `POST /culture/v1/react`

### `HashtagText` (`src/components/community/HashtagText.tsx`)
Props: `text: string, onHashtagPress?: (tag: string) => void, numberOfLines?: number`
- Parses `#word` patterns
- Renders as `<Text>` with inline `<Text style={{ color: colors.gold }}>` for hashtags

### `TypeBadge` (`src/components/ui/TypeBadge.tsx`)
Props: `type: FeedItemType`
Maps type → bg/color from the design tokens table in section 8.

### `TimeAgo` (`src/components/ui/TimeAgo.tsx`)
Props: `date: string`
- < 1 min: "just now"
- < 60 min: "Xm ago"
- < 24h: "Xh ago"
- Else: `en-GB` formatted date (e.g., "8 Jun 2026")

### `ImageLightbox` (`src/components/ui/ImageLightbox.tsx`)
Full-screen modal with pan-to-close gesture, pinch-to-zoom.

---

## 17. Implementation Order

Work through these in order. Each step is independently testable.

### Phase 1 — Foundation
1. Install fonts (Fraunces, DM Sans, JetBrains Mono via `expo-font`)
2. Write `src/theme.ts` (all tokens from Section 1)
3. Update `src/types/index.ts` (Section 2)
4. Write `src/api/client.ts` (Section 3)
5. Write `src/auth/authStore.ts` (Section 4)
6. Wire up auth: `LoginScreen`, persist token to SecureStore, restore on app launch

### Phase 2 — Feed
7. Write `useFeed` hook (Section 5) + `mapCommunityPost` mapper
8. Build `FeedCard` community variant (Section 8.1) — the most used card
9. Build `ConnectFeedScreen` with FlatList (Section 7)
10. Add remaining `FeedCard` variants (8.2–8.6)
11. Wire category/type filter strip

### Phase 3 — Details & Interactions
12. `PostDetailScreen` with `CommentThread` + `CommentInput` (Section 9)
13. `ReactionBar` with optimistic updates
14. `ImageLightbox` for gallery/single image tap

### Phase 4 — Composer
15. `NewPostScreen` skeleton (template selector + textarea + section tag)
16. Add template-specific fields one by one (StarRating, MultiRating, PollBuilder, ItineraryBuilder, DirectorySearch)
17. Image upload flow

### Phase 5 — Directory & Profiles
18. `MemberDirectoryScreen` with search/filter (Section 11)
19. `MemberCard`
20. `MemberProfileScreen` (Section 12)

### Phase 6 — Member Hub
21. `MemberDashboardScreen` (Section 13) with passkey banner
22. `MemberSettingsScreen` tabbed layout (Section 14) with PasskeyManager in Security tab
23. `MembershipScreen` + IAP integration (Section 15)

### Phase 7 — Rewards & Payments
24. `PerksScreen` (Section 14b) with passkey step-up gate
25. `WalletScreen` (Section 14c) with currency-aware bank fields + step-up gate
26. `CouponsScreen` (Section 14d) with QR code rendering
27. Wire passkey WebAuthn flow using `react-native-passkeys` or equivalent library

---

## 18. Gotchas & Important Decisions

- **`patron` is the DB value for Pro** — never rename it. All user-visible copy says "Connect Pro" / "Pro".
- **`citizen` is the DB value for the free tier** — user copy says "Connect Citizen".
- **Community card left border is green (#81c784)** — 3px, not the ochre accent. Do not confuse these.
- **Pro badge is gold (#b38238)**, not ochre (#c5491f). Ochre is for primary actions.
- **Template type `'post'`** is labelled "Update" in the UI — the slug in the DB stays `post`.
- **Gallery uses `>= 1` threshold** (not `> 1`) — even a single gallery image uses the horizontal scroll path.
- **`item.image` must not render when `galleryImages` is set** — the first gallery image is also stored as `community_image_url`, so without this guard the first image renders twice.
- **Directory search is title-only** — the PHP backend uses a `posts_where` LIKE filter on `post_title`, not WordPress full-text search. Results are exact title substring matches.
- **Section tag auto-detection** runs when `text.length >= 20` and no manual tag is set. Lock flag prevents auto-overwrite after manual pick.
- **New-member posts** return `status: 'pending'` — show a "pending review" notice instead of rendering in the live feed.
- **Reactions are cumulative integers** stored as separate meta fields (`reaction_love`, `reaction_fire`, `reaction_clap`) — not a likes array.
- **Date formatting**: always `en-GB` locale — `8 Jun 2026`, not `Jun 8, 2026`.
- **Fraunces italic** is used for body text in quotes and profile bios — not just headlines.
- **JetBrains Mono** is used for all eyebrow labels, handles, locations, and metadata — it signals "metadata/system text".
- **Passkey step-up is a hard gate** for both perk redemptions and credit cashouts — there is no fallback path. If the user has no passkey, show an inline nudge card instead of attempting the WebAuthn flow.
- **Credit escrow**: credits awarded while a member has no passkey are held in `user.creditsEscrowed`, not the spendable `user.credits` balance. Released automatically on first passkey registration. Always surface the escrow amount in the passkey banner.
- **Cashout `account_ref` is built server-side** — the Next.js route handler concatenates currency-specific fields into a single string. Do NOT concatenate on the client; instead send the raw individual fields (`sort_code`, `account_number`, `routing_number`, `bank_name`) and let `app/api/wallet/cashout/route.ts → buildAccountRef()` handle it.
- **Cashout fee is flat 30%** — previously tiered but fixed in June 2026. Always show "Flat 30% fee" copy; never say "20–30%".
- **Credits-to-GBP rate**: default 10 credits = £1 (configurable via WP option `culture_credits_per_gbp`). Always fetch from `GET /api/wallet/balance` response field `credits_per_gbp` — don't hardcode.
- **QR library**: use `react-native-qrcode-svg` for rendering perk redemption QR codes. The QR value is always `https://themoveee.com/api/perks/verify?token=<qr_token>`.
- **WebAuthn on React Native**: the browser `@simplewebauthn/browser` package won't work in RN. Use `react-native-passkeys` (Expo-compatible) or implement via a WebView pointed at a thin passkey page. The step-up endpoints and shapes are identical to the web flow.
- **Settings is now tabbed** — `app/member/settings/` is a nested route group. Implement as a top tab navigator (Profile / Directory / Interests / Newsletters / Security) rather than a single long scroll.
- **`user.hasPasskey`** and **`user.passkeyCount`** are in the session. Use `hasPasskey` (boolean) for gate checks; `passkeyCount` for the "N passkeys registered" label in PasskeyManager.

---

*Keep this document up to date as the app evolves. Any new template type, API endpoint, design token, or component added to the web app must be reflected here before implementing in the RN app.*
