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

  // Phase 7 — Passkeys & credit escrow
  hasPasskey: boolean;
  passkeyCount: number;
  creditsEscrowed: number;

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
  endDate?: string;
  location?: string;
  venueAddress?: string;
  openingHours?: string;
  admission?: string;
  eventCategory?: string;
  organiserName?: string;
  organiserSlug?: string;
  city?: string;          // used on happening + directory items

  // Directory
  entryType?: string;

  // Quote
  quoteSource?: string;
  quoteAuthor?: string;
  quoteSharingReason?: string;
  quoteType?: string;

  // Editorial
  category?: string;
  author?: string;
  readingTime?: number;

  // Community
  communityAuthorId?: string;
  communityAuthor?: string;
  communityAuthorUsername?: string;
  communityAuthorAvatar?: string;
  communityTag?: string;
  communityTier?: string;
  authorRepTier?: string;
  commentCount?: number;

  // Community template fields
  templateType?: TemplateType;
  linkedDirectoryId?: number;
  starRating?: number;
  locationName?: string;
  pollOptions?: PollOption[];
  pollExpiresAt?: string;
  pollDescription?: string;
  galleryImages?: string[];
  videoUrl?: string;
  // Hidden Gem
  placeName?: string;
  placeLocation?: string;
  priceRange?: string;
  openingHours?: string;
  // Cultural Take
  culturalTakeHeadline?: string;
  // Food Review
  foodDishName?: string;
  foodRatingTaste?: number;
  foodRatingValue?: number;
  foodRatingVibe?: number;
  cuisineTag?: string;
  // Creative Showcase
  showcaseTitle?: string;
  showcaseMedium?: string;
  showcaseCollaborator?: string;
  // Book Review
  bookTitle?: string;
  bookAuthor?: string;
  bookStatus?: string;
  bookOverallRating?: number;
  bookRatingWriting?: number;
  bookRatingStory?: number;
  bookRatingCharacters?: number;
  bookRatingPacing?: number;
  bookFavQuote?: string;
  bookRecommend?: boolean;
  bookGenres?: string[];
  // Itinerary
  itineraryStops?: ItineraryStop[];
  itineraryTitle?: string;
  itineraryCity?: string;
  itineraryBudget?: string;
  itineraryDuration?: string;
  itineraryBestTime?: string;
  // Community Event (template)
  isProOnly?: boolean;
  ticketUrl?: string;
  eventAddress?: string;

  // Reactions
  reactions?: { love: number; fire: number; clap: number };
  wpId?: string;
}

// ── Community post templates ─────────────────────────────────────────────────
export type TemplateType =
  | 'post' | 'hidden-gem' | 'cultural-take' | 'food-review' | 'book-review'
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

// ── Phase 6 — Partner Perks & Wallet ─────────────────────────────────────────
export interface Perk {
  id: number;
  title: string;
  description: string;
  credit_cost: number;
  min_spend: number;
  min_spend_currency: string;
  expiry_days: number;
  max_per_user: number;
  max_total: number;
  redeemed_count: number;
  status: 'active' | 'inactive';
  partner_directory_id: number;
}

export interface Redemption {
  id: number;
  perk_id: number;
  type: 'perk' | 'cashout';
  credits_spent: number;
  fee_credits: number;
  qr_token: string;
  qr_scanned: 0 | 1;
  status: 'active' | 'used' | 'expired' | 'pending' | 'approved' | 'rejected';
  expires_at: string | null;
  created_at: string;
  perk_title?: string;
  perk_description?: string;
}

export interface LedgerEntry {
  id: number;
  amount: number;         // positive = earned, negative = spent
  source: string;         // 'post_validated' | 'perk_redeem' | 'cashout' | 'referral' | etc.
  source_id: number;
  note: string;
  created_at: string;
}

// ── Phase 7 — Passkeys ────────────────────────────────────────────────────────
export interface Passkey {
  id: number;
  credential_id: string;
  device_name: string;
  created_at: string;
  last_used_at: string;
  transports: string[];
}

// ── Phase 8a — Notifications ─────────────────────────────────────────────────
export type NotificationType =
  | 'credit_earned' | 'badge_unlocked' | 'perk_expiring' | 'perk_redeemed'
  | 'cashout_approved' | 'cashout_rejected' | 'escrow_released'
  | 'comment_received' | 'post_validated' | 'system'
  | 'referral_received' | 'mention';

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  action_url: string | null;
  meta: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

// ── Phase 8c — Analytics ─────────────────────────────────────────────────────
export interface AnalyticsData {
  credit_days: { day: string; earned: number; spent: number }[];
  balance: number;
  reputation: number;
  posts_published: number;
  posts_pending: number;
  badge_count: number;
  top_posts: { ID: number; post_title: string; reactions: number; comment_count: number }[];
  rep_months: { month: string; rep_earned: number }[];
}

// ── Shop ─────────────────────────────────────────────────────────────────────
export type ProductBadge = "new" | "pro_early_access" | "low_stock" | "sale";

export interface ShopProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  proPrice?: string | null;
  currency: string;
  currencySymbol: string;
  imageUrl?: string | null;
  makerName: string;
  makerCity: string;
  badge?: ProductBadge | null;
  stockStatus: "instock" | "outofstock" | "onbackorder";
  stockQuantity?: number | null;
  categories: string[];
}

export interface ProductVariantColour {
  name: string;
  hex: string;
  available: boolean;
}

export interface ProductVariantSize {
  name: string;
  available: boolean;
}

export interface HowItsMadeStep {
  step: number;
  title: string;
  duration: string;
  description: string;
}

export interface ShopProductDetail extends ShopProduct {
  images: string[];
  description: string;
  shortDescription: string;
  colours: ProductVariantColour[];
  sizes: ProductVariantSize[];
  makerBio: string;
  makerSince: string;
  makerRating: number;
  makerProductCount: number;
  makerAvatarUrl?: string | null;
  howItsMade: HowItsMadeStep[];
  asSeenIn?: { title: string; slug: string } | null;
  relatedProducts: ShopProduct[];
  vetted: boolean;
}

export interface ShopCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
}

export interface ShopVendor {
  name: string;
  city: string;
  productCount: number;
  logoUrl?: string | null;
}
