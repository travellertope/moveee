import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useAuthStore } from "../auth/authStore";
import { useNotificationCount } from "../features/notifications/useNotificationCount";
import { useColors } from "../hooks/useColors";
import { useThemeStore } from "../store/themeStore";
import { fonts, fontSize, space, radius, type ColorPalette } from "../theme";

const LOGO_LIGHT = require("../../assets/logo-black.png");
const LOGO_DARK = require("../../assets/logo-white.png");
const LOGO_H = 22;
const LOGO_W = Math.round((717 / 107) * LOGO_H);

const TAB_ICONS: Record<string, [React.ComponentProps<typeof Ionicons>["name"], React.ComponentProps<typeof Ionicons>["name"]]> = {
  Connect:  ["people", "people-outline"],
  Magazine: ["newspaper", "newspaper-outline"],
  Games:    ["game-controller", "game-controller-outline"],
  Shop:     ["bag", "bag-outline"],
  Events:   ["calendar", "calendar-outline"],
};

const TAB_LABELS: Record<string, string> = {
  Connect: "Feed",
};

/**
 * Persistent left nav rail — replaces the bottom tab bar on tablets (see
 * useIsTablet.ts). Passed as the `tabBar` prop on the same Tab.Navigator
 * phones use by default, so it's driven by the identical navigation state;
 * nothing about the underlying stacks/screens changes for tablet.
 */
export default function TabletRail({ state, descriptors, navigation }: BottomTabBarProps) {
  const { user } = useAuthStore();
  const { unread } = useNotificationCount();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const styles = createStyles(c);
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");

  return (
    <View style={[styles.rail, { paddingTop: insets.top + space[4], paddingBottom: insets.bottom + space[3] }]}>
      <Image
        source={isDark ? LOGO_DARK : LOGO_LIGHT}
        style={{ width: LOGO_W, height: LOGO_H, marginLeft: space[2], marginBottom: space[6] }}
        resizeMode="contain"
      />

      <View style={styles.nav}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const [activeIcon, inactiveIcon] = TAB_ICONS[route.name] ?? ["ellipse", "ellipse-outline"];
          const label = TAB_LABELS[route.name] ?? (typeof options.tabBarLabel === "string" ? options.tabBarLabel : route.name);

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity key={route.key} style={[styles.item, focused && styles.itemActive]} onPress={onPress} activeOpacity={0.7}>
              <View style={styles.itemIconWrap}>
                <Ionicons name={focused ? activeIcon : inactiveIcon} size={20} color={focused ? c.ochre : c.mute} />
                {route.name === "Connect" && unread > 0 && <View style={styles.badgeDot} />}
              </View>
              <Text style={[styles.itemLabel, focused && styles.itemLabelActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.spacer} />

      {user && (
        <TouchableOpacity
          style={styles.userCard}
          activeOpacity={0.7}
          onPress={() => navigation.navigate("Connect", { screen: "MemberDashboard" } as never)}
        >
          <View style={styles.userAvatarWrap}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.userAvatarImg} />
            ) : (
              <Text style={styles.userAvatarInitial}>{(user.displayName ?? "?")[0]?.toUpperCase()}</Text>
            )}
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.userName} numberOfLines={1}>{user.displayName}</Text>
            <Text style={styles.userTier}>{user.tier === "patron" ? "MOVEEE PRO" : "MOVEEE CITIZEN"}</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    rail: {
      width: 232,
      backgroundColor: c.paper,
      borderRightWidth: 1,
      borderRightColor: c.rule,
      paddingHorizontal: space[3],
    },
    nav: { gap: 2 },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[3],
      paddingVertical: 10,
      paddingHorizontal: 10,
      borderRadius: radius.lg,
    },
    itemActive: { backgroundColor: c.goldLight },
    itemIconWrap: { width: 20, alignItems: "center", position: "relative" },
    itemLabel: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft },
    itemLabelActive: { fontFamily: fonts.sansBold, color: c.ink },
    badgeDot: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: c.gold,
    },
    spacer: { flex: 1 },
    userCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      padding: space[2],
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.rule,
    },
    userAvatarWrap: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.gold,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    userAvatarImg: { width: 34, height: 34 },
    userAvatarInitial: { fontFamily: fonts.serifBold, fontSize: 14, color: "#FFFFFF" },
    userName: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    userTier: { fontFamily: fonts.monoBold, fontSize: 9.5, color: c.gold, letterSpacing: 0.4, marginTop: 1 },
  });
}
