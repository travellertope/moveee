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
