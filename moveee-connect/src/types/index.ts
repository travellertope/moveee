export type Tier = "citizen" | "patron";

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  tier: Tier;
  points: number;
  badges: string[];
  referralCode: string;
  registeredAt: number;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  city: string;
  occupation: string;
  primaryChapter: { id: number; name: string } | null;
  secondaryChapter: { id: number; name: string } | null;
  isVendor: boolean;
  vendorSlug: string;
}

export interface CommunityPost {
  id: string;
  content: string;
  imageUrl?: string;
  author: { id: string; name: string; avatarUrl: string; tier: Tier };
  publishedAt: string;
  likeCount: number;
  commentCount: number;
  liked: boolean;
  status: "publish" | "pending";
}

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

export type FeedItemType = "pulse" | "editorial" | "happening" | "directory" | "quote" | "community";

export interface FeedItem {
  id: string;
  type: FeedItemType;
  title: string;
  slug: string;
  date: string;
  excerpt?: string;
  image?: string | null;
  href: string;
  // pulse-specific
  arm?: string;
  region?: string;
  source?: string | null;
  sourceUrl?: string | null;
  body?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  // happening-specific
  eventDate?: string;
  location?: string;
  // directory-specific
  entryType?: string;
  // quote-specific
  quoteSource?: string;
  quoteAuthor?: string;
  // editorial-specific
  category?: string;
  // community-specific
  communityAuthor?: string;
  communityAuthorId?: string;
  communityAuthorAvatar?: string;
  communityTag?: string;
  communityTier?: string;
  commentCount?: number;
  liked?: boolean;
  reactions?: { love: number; fire: number; clap: number };
  wpId?: string;
}

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
  tier: "all" | "citizen" | "patron";
}
