import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";

import { useAuthStore } from "../auth/authStore";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import VerifyEmailScreen from "../screens/auth/VerifyEmailScreen";

import ConnectFeedScreen from "../screens/community/ConnectFeedScreen";
import PostDetailScreen from "../screens/community/PostDetailScreen";
import NewPostScreen from "../screens/community/NewPostScreen";
import MemberProfileScreen from "../screens/community/MemberProfileScreen";

import MagazineScreen from "../screens/magazine/MagazineScreen";
import ArticleScreen from "../screens/magazine/ArticleScreen";

import GamesScreen from "../screens/games/GamesScreen";
import EventsScreen from "../screens/events/EventsScreen";
import EventDetailScreen from "../screens/events/EventDetailScreen";

import MemberScreen from "../screens/member/MemberScreen";
import SettingsScreen from "../screens/member/SettingsScreen";
import MembershipScreen from "../screens/member/MembershipScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ConnectStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ConnectFeed" component={ConnectFeedScreen} />
      <Stack.Screen name="PostDetail" component={PostDetailScreen} />
      <Stack.Screen name="NewPost" component={NewPostScreen} />
      <Stack.Screen name="MemberProfile" component={MemberProfileScreen} />
    </Stack.Navigator>
  );
}

function MagazineStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MagazineList" component={MagazineScreen} />
      <Stack.Screen name="Article" component={ArticleScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EventsList" component={EventsScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function MemberStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MemberHome" component={MemberScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Membership" component={MembershipScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#b38238",
        tabBarInactiveTintColor: "#9e9e9e",
        tabBarStyle: {
          backgroundColor: "#f3ece0",
          borderTopColor: "#e0d8cc",
        },
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, [string, string]> = {
            Connect: ["people", "people-outline"],
            Magazine: ["newspaper", "newspaper-outline"],
            Games: ["game-controller", "game-controller-outline"],
            Events: ["calendar", "calendar-outline"],
            Me: ["person-circle", "person-circle-outline"],
          };
          const [active, inactive] = icons[route.name] ?? ["ellipse", "ellipse-outline"];
          return (
            <Ionicons
              name={(focused ? active : inactive) as never}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Connect" component={ConnectStack} />
      <Tab.Screen name="Magazine" component={MagazineStack} />
      <Tab.Screen name="Games" component={GamesScreen} />
      <Tab.Screen name="Events" component={EventsStack} />
      <Tab.Screen name="Me" component={MemberStack} />
    </Tab.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
    </Stack.Navigator>
  );
}

export default function Navigation() {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) return null;

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}
