/**
 * Skeleton bones with a shimmer sweep animation.
 *
 * Usage:
 *   <Skel width={120} height={14} radius={6} />
 *   <Skel circle size={44} />
 *
 * Also exports ready-made full-screen skeletons:
 *   <FeedSkeleton />
 *   <ArticleSkeleton />
 *   <DashboardSkeleton />
 *   <GamesSkeleton />
 *   <AppLoadingScreen />
 */

import React, { useEffect, useRef } from "react";
import {
  Animated, View, Text, StyleSheet, Easing,
  SafeAreaView, Dimensions,
} from "react-native";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";

const { width: W } = Dimensions.get("window");

// ── Shimmer bone ────────────────────────────────────────────────────────────

interface SkelProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  circle?: boolean;
  size?: number;
  style?: object;
}

const SKEL_BASE = "#EBE5DC";
const SKEL_HL   = "#F5F0E8";

export function Skel({ width, height = 14, radius: r = 6, circle, size, style }: SkelProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      })
    ).start();
  }, []);

  const bg = anim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [SKEL_BASE, SKEL_HL, SKEL_BASE],
  });

  const w = circle ? size : width;
  const h = circle ? size : height;
  const br = circle ? (size ?? 20) / 2 : r;

  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius: br, backgroundColor: bg },
        style,
      ]}
    />
  );
}

// ── Connect Feed Skeleton ────────────────────────────────────────────────────

function FeedCard() {
  return (
    <View style={sk.card}>
      {/* Avatar row */}
      <View style={sk.row12}>
        <Skel circle size={44} />
        <View style={sk.col6}>
          <Skel width={100} height={14} />
          <Skel width={60} height={10} />
        </View>
      </View>
      {/* Body lines */}
      <View style={sk.col8}>
        <Skel width="100%" />
        <Skel width="90%" />
        <Skel width="75%" />
      </View>
      {/* Image grid */}
      <View style={sk.row8}>
        <Skel width={(W - 32 - 8) / 2} height={120} radius={8} />
        <Skel width={(W - 32 - 8) / 2} height={120} radius={8} />
      </View>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <SafeAreaView style={sk.container}>
      {/* Header */}
      <View style={sk.header}>
        <Skel width={80} height={20} radius={6} />
        <View style={sk.row4}>
          <Skel circle size={24} />
          <Skel circle size={24} />
        </View>
      </View>
      {/* Filter row */}
      <View style={sk.filterRow}>
        {[70, 90, 60, 80].map((w, i) => (
          <Skel key={i} width={w} height={32} radius={999} />
        ))}
      </View>
      {/* Cards */}
      <View style={sk.feedBg}>
        <FeedCard />
        <FeedCard />
        <FeedCard />
      </View>
    </SafeAreaView>
  );
}

// ── Article Skeleton ─────────────────────────────────────────────────────────

export function ArticleSkeleton() {
  return (
    <SafeAreaView style={sk.container}>
      {/* Hero image */}
      <Skel width="100%" height={280} radius={0} />
      {/* Content card */}
      <View style={sk.articleCard}>
        <Skel width={40} height={8} radius={6} style={{ marginBottom: 16 }} />
        {/* Title */}
        <View style={sk.col10}>
          <Skel width="90%" height={24} />
          <Skel width="70%" height={24} />
        </View>
        {/* Author card */}
        <View style={sk.authorCard}>
          <Skel circle size={24} />
          <View style={sk.col6}>
            <Skel width={80} height={12} />
            <Skel width={60} height={10} />
          </View>
        </View>
        {/* Body */}
        <View style={sk.col12}>
          {[95, 85, 90, 70, 95, 60].map((p, i) => (
            <Skel key={i} width={`${p}%`} height={14} />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Dashboard Skeleton ───────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <SafeAreaView style={sk.containerWarm}>
      {/* Header */}
      <View style={sk.header}>
        <Skel width={120} height={20} radius={6} />
      </View>
      <View style={sk.body}>
        {/* Profile hero card */}
        <View style={sk.whiteCard}>
          <View style={sk.row16}>
            <Skel circle size={96} />
            <View style={sk.col10}>
              <Skel width={120} height={24} />
              <Skel width={80} height={16} />
              <Skel width={100} height={12} />
            </View>
          </View>
        </View>
        {/* Stats bar */}
        <View style={[sk.whiteCard, sk.statsBar]}>
          {[0, 1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={sk.statDivider} />}
              <View style={sk.statCol}>
                <Skel width={40} height={20} />
                <Skel width={30} height={10} />
              </View>
            </React.Fragment>
          ))}
        </View>
        {/* Badges */}
        <View style={sk.whiteCard}>
          <Skel width={80} height={14} style={{ marginBottom: 16 }} />
          <View style={sk.badgeWrap}>
            {[90, 110, 80, 120, 100, 80].map((w, i) => (
              <Skel key={i} width={w} height={24} radius={999} />
            ))}
          </View>
        </View>
        {/* Menu rows */}
        <View style={sk.whiteCard}>
          {[100, 80, 120, 90, 110, 80, 100].map((w, i) => (
            <View key={i} style={[sk.menuRow, i < 6 && sk.menuRowBorder]}>
              <Skel width={w} height={16} />
              <Skel width={12} height={12} radius={4} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Games Skeleton ───────────────────────────────────────────────────────────

export function GamesSkeleton() {
  return (
    <SafeAreaView style={sk.containerWarm}>
      {/* Header */}
      <View style={[sk.header, { height: 64 }]}>
        <Skel width={100} height={24} radius={6} />
      </View>
      <View style={sk.body}>
        <View style={sk.gamesGrid}>
          {([
            [100, 80], [90, 70], [110, 80], [80, 60],
          ] as [number, number][]).map(([tw, sw], i) => (
            <View key={i} style={[sk.gameCard, { width: (W - 32 - 16) / 2 }]}>
              <Skel width="100%" height={120} radius={0} style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
              <View style={sk.gameCardText}>
                <Skel width={tw} height={16} />
                <Skel width={sw} height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Full-page loading screen ─────────────────────────────────────────────────

export function AppLoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={sk.loadingContainer}>
      <View style={sk.loadingBrand}>
        <Text style={sk.loadingWordmark}>moveee</Text>
        <Text style={sk.loadingTagline}>CONNECT</Text>
      </View>
      <Animated.View style={[sk.spinner, { transform: [{ rotate }] }]}>
        {/* SVG-like circle using border trick */}
        <View style={sk.spinnerArc} />
      </Animated.View>
      <Text style={sk.loadingText}>Loading...</Text>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.paper },
  containerWarm: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    height: 56, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  filterRow: {
    height: 56, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
    backgroundColor: colors.paper,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  feedBg: { flex: 1, backgroundColor: colors.paperWarm },

  card: {
    backgroundColor: colors.paper, padding: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ghost, gap: 12,
  },
  row4:  { flexDirection: "row", gap: 4, alignItems: "center" },
  row8:  { flexDirection: "row", gap: 8, alignItems: "center" },
  row12: { flexDirection: "row", gap: 12, alignItems: "center" },
  row16: { flexDirection: "row", gap: 16, alignItems: "center" },
  col6:  { gap: 6, flex: 1 },
  col8:  { gap: 8 },
  col10: { gap: 10, marginBottom: 32 },
  col12: { gap: 12 },

  // Article
  articleCard: {
    backgroundColor: colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    marginTop: -32, padding: 32,
  },
  authorCard: {
    flexDirection: "row", gap: 12, alignItems: "center",
    padding: 16, marginBottom: 32,
    backgroundColor: colors.paperDeep,
    borderRadius: 12, borderWidth: 1, borderColor: colors.ghost + "80",
  },

  // Dashboard
  body:       { padding: 16, gap: 16 },
  whiteCard:  { backgroundColor: colors.paper, borderRadius: 12, padding: 16, ...shadows.card },
  statsBar:   { flexDirection: "row", alignItems: "center" },
  statCol:    { flex: 1, alignItems: "center", gap: 8 },
  statDivider:{ width: 1, height: 30, backgroundColor: colors.ghost + "80" },
  badgeWrap:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  menuRow:    {
    height: 52, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.ghost + "80" },

  // Games
  gamesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  gameCard:  { backgroundColor: colors.paper, borderRadius: 12, overflow: "hidden", ...shadows.card },
  gameCardText: { padding: 16, gap: 8 },

  // Full-page loading
  loadingContainer: {
    flex: 1, backgroundColor: colors.paperWarm,
    justifyContent: "center", alignItems: "center", gap: 0,
  },
  loadingBrand:    { alignItems: "center", marginBottom: 40 },
  loadingWordmark: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink, letterSpacing: -0.5 },
  loadingTagline:  {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.gold,
    letterSpacing: 3, marginTop: 2,
  },
  spinner: {
    width: 32, height: 32, marginBottom: 12,
    justifyContent: "center", alignItems: "center",
  },
  spinnerArc: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 2,
    borderTopColor: colors.ochre,
    borderRightColor: colors.ochre,
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
  },
  loadingText: { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },
});
