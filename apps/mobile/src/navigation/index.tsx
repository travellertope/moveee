import React from "react";
import { View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../auth/authStore";
import { useNotificationCount } from "../features/notifications/useNotificationCount";
import { colors } from "../theme";
import type { FeedItem } from "../types";

// Auth
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";
import RegisterCompleteScreen from "../screens/auth/RegisterCompleteScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import ResetPasswordScreen from "../screens/auth/ResetPasswordScreen";

// Feed / Community
import ConnectFeedScreen from "../screens/community/ConnectFeedScreen";
import PostDetailScreen from "../screens/community/PostDetailScreen";
import PulseDetailScreen from "../screens/community/PulseDetailScreen";
import NewPostScreen from "../screens/community/NewPostScreen";
import DirectorySubmitScreen from "../screens/community/DirectorySubmitScreen";
import MemberProfileScreen from "../screens/community/MemberProfileScreen";
import MemberDirectoryScreen from "../screens/community/MemberDirectoryScreen";
import DirectoryDetailScreen from "../screens/community/DirectoryDetailScreen";
import DirectoryPostsScreen from "../screens/community/DirectoryPostsScreen";
import DiscoverScreen from "../screens/community/DiscoverScreen";
import ClusterScreen from "../screens/community/ClusterScreen";
import StartClusterScreen from "../screens/community/StartClusterScreen";
import HostOnboardingScreen from "../screens/community/HostOnboardingScreen";
import StoopHomeScreen from "../screens/community/StoopHomeScreen";
import HubsScreen from "../screens/community/HubsScreen";
import HubCreateScreen from "../screens/community/HubCreateScreen";
import HubDetailScreen from "../screens/community/HubDetailScreen";

// Magazine
import MagazineScreen from "../screens/magazine/MagazineScreen";
import ArticleScreen from "../screens/magazine/ArticleScreen";
import IssuesArchiveScreen from "../screens/magazine/IssuesArchiveScreen";
import MagazineSearchScreen from "../screens/magazine/MagazineSearchScreen";
import AuthorArchiveScreen from "../screens/magazine/AuthorArchiveScreen";
import CategoryArchiveScreen from "../screens/magazine/CategoryArchiveScreen";

// Events / Games
import GamesScreen from "../screens/games/GamesScreen";
import TriviaGameScreen from "../screens/games/TriviaGameScreen";
import WhoSaidItGameScreen from "../screens/games/WhoSaidItGameScreen";
import SudokuGameScreen from "../screens/games/SudokuGameScreen";
import CrosswordGameScreen from "../screens/games/CrosswordGameScreen";
import GameHistoryScreen from "../screens/games/GameHistoryScreen";
import EventsScreen from "../screens/events/EventsScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";
import MyRSVPsScreen from "../screens/events/MyRSVPsScreen";

// Shop
import ShopScreen from "../screens/shop/ShopScreen";
import ShopListingScreen from "../screens/shop/ShopListingScreen";
import ProductDetailScreen from "../screens/shop/ProductDetailScreen";
import CartScreen from "../screens/shop/CartScreen";
import CheckoutScreen from "../screens/shop/CheckoutScreen";
import TheEditScreen from "../screens/shop/TheEditScreen";
import ShopSearchScreen from "../screens/shop/ShopSearchScreen";
import MakerProfileScreen from "../screens/shop/MakerProfileScreen";
import OrderConfirmationScreen from "../screens/shop/OrderConfirmationScreen";
import WishlistScreen from "../screens/shop/WishlistScreen";

// Member
import MemberDashboardScreen from "../screens/member/MemberDashboardScreen";
import MemberSettingsScreen from "../screens/member/MemberSettingsScreen";
import MembershipScreen from "../screens/member/MembershipScreen";
import PerksScreen from "../screens/member/PerksScreen";
import WalletScreen from "../screens/member/WalletScreen";
import CouponsScreen from "../screens/member/CouponsScreen";
import NotificationsScreen from "../screens/member/NotificationsScreen";
import AnalyticsScreen from "../screens/member/AnalyticsScreen";
import SavedArticlesScreen from "../screens/member/SavedArticlesScreen";
import ReferralScreen from "../screens/member/ReferralScreen";
import MyEventsScreen from "../screens/member/MyEventsScreen";
import NewPortfolioItemScreen from "../screens/member/NewPortfolioItemScreen";
import { AppLoadingScreen } from "../components/ui/Skeleton";

// ── Stack param types ──────────────────────────────────────────────────────────
type FeedStackParams = {
  ConnectFeed:       undefined;
  PostDetail:        { item: FeedItem };
  PulseDetail:       { item: FeedItem };
  NewPost:           {
    template?: string;
    hubId?: number;
    hubSlug?: string;
    hubAllowedTemplates?: string[];
  } | undefined;
  DirectorySubmit:   undefined;
  MemberProfile:     { userId?: string; username?: string };
  MemberDirectory:   undefined;
  Notifications:     undefined;
  DirectoryDetail:   { id?: number; slug?: string; title?: string; entryType?: string };
  DirectoryPosts:    { entryId: number; entryTitle: string; showRating?: boolean };
  Discover:          { type?: string; region?: string } | undefined;
  ClusterScreen:      { id: number };
  StartClusterScreen: undefined;
  StoopHomeScreen:    undefined;
  HubsScreen:         undefined;
  HubCreateScreen:    undefined;
  HubDetail:          { slug: string };
  // Editorial articles opened from the Connect feed stay in this stack
  // so the Magazine tab is never polluted by cross-tab navigation.
  Article:           { slug: string };
};

type MemberStackParams = {
  MemberDashboard: undefined;
  MemberSettings:  { tab?: "profile" | "directory" | "interests" | "newsletters" | "security" };
  Wallet:          undefined;
  Coupons:         undefined;
  Perks:           undefined;
  Membership:      undefined;
  Analytics:       undefined;
  Referral:        undefined;
  MyEvents:        undefined;
};

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ConnectStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConnectFeed"     component={ConnectFeedScreen} />
      <Stack.Screen name="PostDetail"      component={PostDetailScreen} />
      <Stack.Screen name="PulseDetail"     component={PulseDetailScreen} />
      <Stack.Screen name="NewPost"         component={NewPostScreen} />
      <Stack.Screen name="DirectorySubmit" component={DirectorySubmitScreen} />
      <Stack.Screen name="MemberProfile"   component={MemberProfileScreen} />
      <Stack.Screen name="MemberDirectory"   component={MemberDirectoryScreen} />
      <Stack.Screen name="DirectoryDetail"  component={DirectoryDetailScreen} />
      <Stack.Screen name="DirectoryPosts"   component={DirectoryPostsScreen} />
      <Stack.Screen name="Discover"         component={DiscoverScreen} />
      <Stack.Screen name="ClusterScreen"         component={ClusterScreen} />
      <Stack.Screen name="HostOnboardingScreen" component={HostOnboardingScreen} />
      <Stack.Screen name="StartClusterScreen"   component={StartClusterScreen} />
      <Stack.Screen name="StoopHomeScreen"      component={StoopHomeScreen} />
      <Stack.Screen name="HubsScreen"           component={HubsScreen} />
      <Stack.Screen name="HubCreateScreen"      component={HubCreateScreen} />
      <Stack.Screen name="HubDetail"            component={HubDetailScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      {/* Articles opened from the feed stay within this stack — back → feed */}
      <Stack.Screen name="Article"         component={ArticleScreen} />
      <Stack.Screen name="AuthorArchive"   component={AuthorArchiveScreen} />
      <Stack.Screen name="CategoryArchive" component={CategoryArchiveScreen} />
      {/* Member screens — accessible via avatar tap in header */}
      <Stack.Screen name="MemberDashboard" component={MemberDashboardScreen} />
      <Stack.Screen name="MemberSettings"  component={MemberSettingsScreen} />
      <Stack.Screen name="Wallet"          component={WalletScreen} />
      <Stack.Screen name="Coupons"         component={CouponsScreen} />
      <Stack.Screen name="Perks"           component={PerksScreen} />
      <Stack.Screen name="Membership"      component={MembershipScreen} />
      <Stack.Screen name="Analytics"       component={AnalyticsScreen} />
      <Stack.Screen name="SavedArticles"   component={SavedArticlesScreen} />
      <Stack.Screen name="Referral"        component={ReferralScreen} />
      <Stack.Screen name="MyEvents"        component={MyEventsScreen} />
      <Stack.Screen name="NewPortfolioItem" component={NewPortfolioItemScreen} />
    </Stack.Navigator>
  );
}

function MagazineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MagazineList"      component={MagazineScreen} />
      <Stack.Screen name="Article"           component={ArticleScreen} />
      <Stack.Screen name="IssuesArchive"     component={IssuesArchiveScreen} />
      <Stack.Screen name="MagazineSearch"    component={MagazineSearchScreen} />
      <Stack.Screen name="AuthorArchive"     component={AuthorArchiveScreen} />
      <Stack.Screen name="CategoryArchive"   component={CategoryArchiveScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList"  component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="MyRSVPs"     component={MyRSVPsScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopHome"      component={ShopScreen} />
      <Stack.Screen name="ShopListing"   component={ShopListingScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart"              component={CartScreen} />
      <Stack.Screen name="Checkout"          component={CheckoutScreen} />
      <Stack.Screen name="TheEdit"           component={TheEditScreen} />
      <Stack.Screen name="ShopSearch"        component={ShopSearchScreen} />
      <Stack.Screen name="MakerProfile"      component={MakerProfileScreen} />
      <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} />
      <Stack.Screen name="Wishlist"          component={WishlistScreen} />
    </Stack.Navigator>
  );
}

function GamesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GamesList"   component={GamesScreen} />
      <Stack.Screen name="TriviaGame"  component={TriviaGameScreen} />
      <Stack.Screen name="WhoSaidIt"   component={WhoSaidItGameScreen} />
      <Stack.Screen name="Sudoku"      component={SudokuGameScreen} />
      <Stack.Screen name="Crossword"   component={CrosswordGameScreen} />
      <Stack.Screen name="GameHistory" component={GameHistoryScreen} />
    </Stack.Navigator>
  );
}

function MemberStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberDashboard" component={MemberDashboardScreen} />
      <Stack.Screen name="MemberSettings"  component={MemberSettingsScreen} />
      <Stack.Screen name="Wallet"          component={WalletScreen} />
      <Stack.Screen name="Coupons"         component={CouponsScreen} />
      <Stack.Screen name="Perks"           component={PerksScreen} />
      <Stack.Screen name="Membership"      component={MembershipScreen} />
      <Stack.Screen name="Analytics"       component={AnalyticsScreen} />
      <Stack.Screen name="SavedArticles"   component={SavedArticlesScreen} />
      <Stack.Screen name="Referral"        component={ReferralScreen} />
      <Stack.Screen name="MyEvents"        component={MyEventsScreen} />
      <Stack.Screen name="NewPortfolioItem" component={NewPortfolioItemScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { unread } = useNotificationCount();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   colors.gold,
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: {
          backgroundColor: colors.paperWarm,
          borderTopColor: "#e0d8cc",
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Magazine: ["newspaper",       "newspaper-outline"],
            Games:    ["game-controller", "game-controller-outline"],
            Events:   ["calendar",        "calendar-outline"],
            Shop:     ["bag",             "bag-outline"],
          };
          const [active, inactive] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          return <Ionicons name={(focused ? active : inactive) as never} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Connect"
        component={ConnectStack}
        options={{
          tabBarLabel: "Feed",
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ width: size, height: size }}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={size}
                color={color}
              />
              {unread > 0 && (
                <View style={{
                  position: "absolute",
                  top: -2,
                  right: -4,
                  minWidth: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: "#b38238",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 2,
                  borderWidth: 1.5,
                  borderColor: colors.paperWarm,
                }}>
                  <Text style={{
                    fontFamily: "JetBrainsMono_700Bold",
                    fontSize: 8,
                    color: "#FFFFFF",
                    lineHeight: 10,
                  }}>
                    {unread > 9 ? "9+" : String(unread)}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen name="Magazine" component={MagazineStack} />
      <Tab.Screen name="Games"    component={GamesStack} />
      <Tab.Screen name="Shop"     component={ShopStack} />
      <Tab.Screen name="Events"   component={EventsStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding"    component={OnboardingScreen} />
      <Stack.Screen name="Login"         component={LoginScreen} />
      <Stack.Screen name="Register"      component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail"   component={VerifyEmailScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}

function ProfileCompleteStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CompleteProfile" component={RegisterCompleteScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, isLoading, profileSetupRequired } = useAuthStore();

  if (isLoading) return <AppLoadingScreen />;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack />
      ) : profileSetupRequired ? (
        <ProfileCompleteStack />
      ) : (
        <MainTabs />
      )}
    </NavigationContainer>
  );
}
