import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../auth/authStore";
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

// Magazine
import MagazineScreen from "../screens/magazine/MagazineScreen";
import ArticleScreen from "../screens/magazine/ArticleScreen";
import IssuesArchiveScreen from "../screens/magazine/IssuesArchiveScreen";
import MagazineSearchScreen from "../screens/magazine/MagazineSearchScreen";

// Events / Games
import GamesScreen from "../screens/games/GamesScreen";
import TriviaGameScreen from "../screens/games/TriviaGameScreen";
import WhoSaidItGameScreen from "../screens/games/WhoSaidItGameScreen";
import SudokuGameScreen from "../screens/games/SudokuGameScreen";
import CrosswordGameScreen from "../screens/games/CrosswordGameScreen";
import EventsScreen from "../screens/events/EventsScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";

// Shop
import ShopScreen from "../screens/shop/ShopScreen";
import ShopListingScreen from "../screens/shop/ShopListingScreen";
import ProductDetailScreen from "../screens/shop/ProductDetailScreen";

// Member
import MemberDashboardScreen from "../screens/member/MemberDashboardScreen";
import MemberSettingsScreen from "../screens/member/MemberSettingsScreen";
import MembershipScreen from "../screens/member/MembershipScreen";
import PerksScreen from "../screens/member/PerksScreen";
import WalletScreen from "../screens/member/WalletScreen";
import CouponsScreen from "../screens/member/CouponsScreen";
import NotificationsScreen from "../screens/member/NotificationsScreen";
import AnalyticsScreen from "../screens/member/AnalyticsScreen";
import { AppLoadingScreen } from "../components/ui/Skeleton";

// ── Stack param types ──────────────────────────────────────────────────────────
type FeedStackParams = {
  ConnectFeed:       undefined;
  PostDetail:        { item: FeedItem };
  PulseDetail:       { item: FeedItem };
  NewPost:           undefined;
  DirectorySubmit:   undefined;
  MemberProfile:     { userId: string; username: string };
  MemberDirectory:   undefined;
  Notifications:     undefined;
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
      <Stack.Screen name="MemberDirectory" component={MemberDirectoryScreen} />
      <Stack.Screen name="Notifications"   component={NotificationsScreen} />
      {/* Articles opened from the feed stay within this stack — back → feed */}
      <Stack.Screen name="Article"         component={ArticleScreen} />
      {/* Member screens — accessible via avatar tap in header */}
      <Stack.Screen name="MemberDashboard" component={MemberDashboardScreen} />
      <Stack.Screen name="MemberSettings"  component={MemberSettingsScreen} />
      <Stack.Screen name="Wallet"          component={WalletScreen} />
      <Stack.Screen name="Coupons"         component={CouponsScreen} />
      <Stack.Screen name="Perks"           component={PerksScreen} />
      <Stack.Screen name="Membership"      component={MembershipScreen} />
      <Stack.Screen name="Analytics"       component={AnalyticsScreen} />
    </Stack.Navigator>
  );
}

function MagazineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MagazineList"    component={MagazineScreen} />
      {/* popToTopOnBlur: leaving the Magazine tab resets the stack to MagazineList */}
      <Stack.Screen name="Article"         component={ArticleScreen} options={{ popToTopOnBlur: true }} />
      <Stack.Screen name="IssuesArchive"   component={IssuesArchiveScreen} />
      <Stack.Screen name="MagazineSearch"  component={MagazineSearchScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList"  component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function ShopStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ShopHome"      component={ShopScreen} />
      <Stack.Screen name="ShopListing"  component={ShopListingScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
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
    </Stack.Navigator>
  );
}

function MainTabs() {

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
            Connect:  ["people",          "people-outline"],
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
      <Tab.Screen name="Connect"  component={ConnectStack} />
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
