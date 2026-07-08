import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { FeedItem } from "../types";

export type AppParamList = {
  // Connect / Feed
  ConnectFeed: { justPosted?: number } | undefined;
  PostDetail: { item: FeedItem };
  PulseDetail: { item: FeedItem };
  NewPost: undefined;
  DirectorySubmit: undefined;
  MemberProfile: { userId?: string; username?: string };
  MemberDirectory: undefined;
  Notifications: undefined;
  DirectoryDetail: { id?: number; slug?: string; title?: string; entryType?: string };
  DirectoryPosts: { entryId: number; entryTitle: string; showRating?: boolean };
  Discover: { type?: string; region?: string } | undefined;
  Article: { slug: string };
  AuthorArchive: { slug: string; name: string };
  CategoryArchive: { slug: string; name: string };
  // Member
  MemberDashboard: undefined;
  MemberSettings: { tab?: "profile" | "directory" | "interests" | "newsletters" | "security" };
  Wallet: undefined;
  Coupons: undefined;
  Perks: undefined;
  Membership: undefined;
  Analytics: undefined;
  SavedArticles: undefined;
  Referral: undefined;
  MyEvents: undefined;
  NewPortfolioItem: undefined;
  ClusterScreen: { id: number };
  StoopHomeScreen: undefined;
  HubsScreen: undefined;
  HubCreateScreen: undefined;
  HubDetail: { slug: string };
  HostOnboardingScreen: undefined;
  StartClusterScreen: {
    country?: string;
    venueType?: string;
    hostNote?: string;
    realisticCapacity?: number;
    accessible?: boolean;
    addressVisible?: string;
    localityConfirmed?: boolean;
  } | undefined;
  // Auth
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  VerifyEmail: { email: string; password?: string };
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  CompleteProfile: undefined;
  // Magazine
  MagazineList: undefined;
  IssuesArchive: undefined;
  MagazineSearch: undefined;
  // Shop
  ShopHome: undefined;
  ShopListing: { category?: string; categoryName?: string; categorySlug?: string; makerName?: string } | undefined;
  ProductDetail: { productId: number; productSlug?: string };
  Cart: undefined;
  Checkout: { couponCode?: string } | undefined;
  TheEdit: undefined;
  ShopSearch: undefined;
  MakerProfile: { makerSlug: string; makerName: string };
  OrderConfirmation: { orderId?: string; total?: string; itemCount?: number } | undefined;
  Wishlist: undefined;
  // Games
  GamesList: undefined;
  TriviaGame: undefined;
  WhoSaidIt: undefined;
  Sudoku: undefined;
  Crossword: undefined;
  // Events
  EventsList: undefined;
  EventDetail: { eventId: number };
  MyRSVPs: undefined;
  // Tab-level (for cross-stack navigation)
  Connect: undefined;
  Magazine: undefined;
  Shop: undefined;
  Games: undefined;
  Events: undefined;
};

export type AppNavProp = NativeStackNavigationProp<AppParamList>;

export function useNav(): AppNavProp {
  return useNavigation<AppNavProp>();
}
