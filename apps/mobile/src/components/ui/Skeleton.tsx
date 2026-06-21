/**
 * Shimmer skeleton system.
 *
 * Primitives:
 *   <Skel />      — text/UI areas  (#E0D9CE base)
 *   <SkelImg />   — image areas    (#D8D1C6 base, slightly darker)
 *
 * Screen skeletons:
 *   <FeedSkeleton />
 *   <ArticleSkeleton />
 *   <DashboardSkeleton />
 *   <EventsSkeleton />
 *   <ShopListingSkeleton />
 *   <ProfileSkeleton />
 *   <NotificationsSkeleton />
 *   <GamesSkeleton />
 *   <AppLoadingScreen />
 */

import React, { useEffect, useRef } from "react";
import {
  Animated, View, Text, Image, StyleSheet, Easing,
  Dimensions, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "../../theme";

const { width: W } = Dimensions.get("window");
const SPLASH_ICON = require("../../../assets/logo.png");

// ── Shared animation ─────────────────────────────────────────────────────────
// Single Animated.Value so all bones sweep in sync.

const SHARED_ANIM = new Animated.Value(0);
let _shimmerStarted = false;

function ensureShimmer() {
  if (_shimmerStarted) return;
  _shimmerStarted = true;
  try {
    Animated.loop(
      Animated.timing(SHARED_ANIM, {
        toValue: 1,
        duration: 1400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    ).start();
  } catch {}
}

// ── Base colours ──────────────────────────────────────────────────────────────

const BASE     = "#E0D9CE";
const HL       = "#EDE7DC";
const IMG_BASE = "#D8D1C6";
const IMG_HL   = "#E5DFD4";

// ── Skel primitive ────────────────────────────────────────────────────────────

interface SkelProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  circle?: boolean;
  size?: number;
  img?: boolean;       // use darker image-area palette
  style?: object;
}

function SkelCore({ width, height = 14, radius: r = 6, circle, size, img, style }: SkelProps) {
  ensureShimmer();
  const base = img ? IMG_BASE : BASE;
  const hl   = img ? IMG_HL   : HL;

  const translateX = SHARED_ANIM.interpolate({
    inputRange: [0, 1],
    outputRange: [-W * 2, W * 2],
  });

  const w  = circle ? size : width;
  const h  = circle ? size : height;
  const br = circle ? (size ?? 20) / 2 : r;

  return (
    <View
      style={[
        { width: w, height: h, borderRadius: br, backgroundColor: base, overflow: "hidden" },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateX }], width: W * 4 },
        ]}
      >
        <LinearGradient
          colors={[base, hl, base]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ width: W * 4, height: "100%" }}
        />
      </Animated.View>
    </View>
  );
}

export function Skel(props: SkelProps) { return <SkelCore {...props} />; }
export function SkelImg(props: Omit<SkelProps, "img">) { return <SkelCore {...props} img />; }

// ── Shared layout helpers ─────────────────────────────────────────────────────

function Row({ gap = 8, children, style }: { gap?: number; children: React.ReactNode; style?: object }) {
  return <View style={[{ flexDirection: "row", alignItems: "center", gap }, style]}>{children}</View>;
}
function Col({ gap = 6, children, style }: { gap?: number; children: React.ReactNode; style?: object }) {
  return <View style={[{ gap }, style]}>{children}</View>;
}

// ── Frame 1: Connect Feed ─────────────────────────────────────────────────────

function SkEditorialCard() {
  return (
    <View style={sk.card}>
      <SkelImg width="100%" height={180} radius={8} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8, paddingBottom: 16 }}>
        <Skel width={40} height={8} />
        <Col gap={4}>
          <Skel width="90%" height={14} />
          <Skel width="70%" height={14} />
        </Col>
        <Row gap={8} style={{ marginTop: 8 }}>
          <SkelImg circle size={24} />
          <Skel width={80} height={10} />
          <Skel width={48} height={10} />
        </Row>
      </View>
    </View>
  );
}

function SkCommunityCard() {
  return (
    <View style={[sk.card, { padding: 16 }]}>
      <Row gap={12} style={{ marginBottom: 12 }}>
        <SkelImg circle size={40} />
        <Col gap={4} style={{ flex: 1 }}>
          <Skel width={100} height={12} />
          <Skel width={60} height={10} />
        </Col>
      </Row>
      <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
        <Skel width={60} height={20} radius={999} />
        <Skel width={48} height={10} />
      </Row>
      <Col gap={4} style={{ marginBottom: 12 }}>
        <Skel width="95%" height={12} />
        <Skel width="85%" height={12} />
        <Skel width="60%" height={12} />
      </Col>
      <Row gap={4} style={{ marginBottom: 16 }}>
        <SkelImg width={(W - 32 - 20) / 2} height={140} radius={8} />
        <SkelImg width={(W - 32 - 20) / 2} height={140} radius={8} />
      </Row>
      <Row gap={16}>
        {[0, 1, 2].map((i) => (
          <Row key={i} gap={6}><Skel circle size={16} /><Skel width={24} height={10} /></Row>
        ))}
      </Row>
    </View>
  );
}

function SkEventCard() {
  return (
    <View style={sk.card}>
      <SkelImg width="100%" height={180} radius={8} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8, paddingBottom: 16 }}>
        <Skel width={70} height={20} radius={999} />
        <Skel width="80%" height={16} />
        <Col gap={8} style={{ marginBottom: 8 }}>
          {[120, 140, 100].map((w, i) => (
            <Row key={i} gap={8}><Skel circle size={16} /><Skel width={w} height={10} /></Row>
          ))}
        </Col>
        <Skel width={100} height={36} radius={999} style={{ alignSelf: "flex-end" }} />
      </View>
    </View>
  );
}

function SkQuoteCard() {
  return (
    <View style={[sk.card, { padding: 16 }]}>
      <Skel width={40} height={32} radius={6} style={{ marginBottom: 8 }} />
      <Col gap={4} style={{ marginBottom: 12 }}>
        <Skel width="90%" height={14} />
        <Skel width="80%" height={14} />
        <Skel width="55%" height={14} />
      </Col>
      <Skel width={100} height={10} style={{ marginBottom: 16 }} />
      <Row gap={16}>
        {[0, 1, 2].map((i) => (
          <Row key={i} gap={6}><Skel circle size={16} /><Skel width={24} height={10} /></Row>
        ))}
      </Row>
    </View>
  );
}

export function FeedSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safe}>
      <View style={sk.header}>
        <Skel width={80} height={14} />
        <Row gap={16}>
          <SkelImg circle size={32} />
          <SkelImg circle size={32} />
        </Row>
      </View>
      <View style={sk.filterRow}>
        {[52, 64, 44, 72, 56].map((w, i) => (
          <Skel key={i} width={w} height={32} radius={999} />
        ))}
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: colors.paperWarm }} scrollEnabled={false} contentContainerStyle={{ paddingVertical: 16, gap: 16 }}>
        <SkEditorialCard />
        <SkCommunityCard />
        <SkEventCard />
        <SkQuoteCard />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Frame 2: Article Detail ───────────────────────────────────────────────────

export function ArticleSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safeWhite}>
      {/* Hero image */}
      <SkelImg width="100%" height={280} radius={0} />
      {/* Overlapping content card */}
      <View style={sk.articleCard}>
        <Skel width={60} height={8} style={{ marginBottom: 12 }} />
        <Col gap={4} style={{ marginBottom: 8 }}>
          <Skel width="88%" height={18} />
          <Skel width="72%" height={18} />
        </Col>
        <Skel width="65%" height={13} style={{ marginBottom: 24, opacity: 0.8 }} />
        <Row gap={12} style={{ marginBottom: 24 }}>
          <SkelImg circle size={36} />
          <Col gap={4}>
            <Skel width={100} height={12} />
            <Skel width={60} height={10} />
          </Col>
        </Row>
        <View style={sk.divider} />
        <Col gap={4} style={{ marginBottom: 16 }}>
          {[95, 90, 85, 92, 60].map((p, i) => (
            <Skel key={i} width={`${p}%`} height={12} />
          ))}
        </Col>
        <SkelImg width="100%" height={200} radius={8} style={{ marginVertical: 16 }} />
        <Col gap={4} style={{ marginBottom: 24 }}>
          {[95, 88, 75, 40].map((p, i) => (
            <Skel key={i} width={`${p}%`} height={12} />
          ))}
        </Col>
        {/* Pull quote */}
        <View style={sk.pullQuote}>
          <Col gap={4}>
            <Skel width="90%" height={14} />
            <Skel width="70%" height={14} />
          </Col>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Frame 3: Member Dashboard ─────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safe}>
      <View style={[sk.header, { justifyContent: "center" }]}>
        <Skel width={60} height={14} />
      </View>
      <ScrollView style={{ flex: 1 }} scrollEnabled={false} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        {/* Hero card */}
        <View style={sk.whiteCard}>
          <Col style={{ alignItems: "center", paddingVertical: 8 }} gap={12}>
            <SkelImg circle size={80} />
            <Skel width={140} height={16} />
            <Skel width={80} height={10} />
          </Col>
          <Skel width="100%" height={52} radius={8} style={{ marginTop: 16, opacity: 0.7 }} />
        </View>
        {/* Stats bar */}
        <View style={sk.statsCard}>
          {[0, 1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={sk.statDivider} />}
              <Col style={{ flex: 1, alignItems: "center" }} gap={4}>
                <Skel width={40} height={18} />
                <Skel width={56} height={10} />
              </Col>
            </React.Fragment>
          ))}
        </View>
        {/* Badges */}
        <View style={sk.whiteCard}>
          <Row gap={8} style={{ overflow: "hidden" }}>
            {[90, 110, 80, 130, 100].map((w, i) => (
              <Skel key={i} width={w} height={32} radius={999} />
            ))}
          </Row>
        </View>
        {/* Quick links */}
        <View style={sk.whiteCard}>
          {[120, 80, 120, 90, 110, 80, 120].map((w, i) => (
            <View key={i} style={[sk.menuRow, i < 6 && sk.menuRowBorder]}>
              <Row gap={12}>
                <SkelImg circle size={40} />
                <Skel width={w} height={12} />
              </Row>
              <Skel circle size={20} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Frame 4: Events ───────────────────────────────────────────────────────────

function SkEventFullCard() {
  return (
    <View style={sk.card}>
      <SkelImg width="100%" height={200} radius={0} style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }} />
      <View style={{ paddingHorizontal: 16, paddingTop: 16, gap: 8, paddingBottom: 16 }}>
        <Skel width={80} height={20} radius={999} />
        <Skel width="75%" height={16} />
        <Col gap={8} style={{ marginBottom: 8 }}>
          {[130, 150, 100].map((w, i) => (
            <Row key={i} gap={8}><Skel circle size={16} /><Skel width={w} height={10} /></Row>
          ))}
        </Col>
        <Skel width={100} height={36} radius={999} style={{ alignSelf: "flex-end" }} />
      </View>
    </View>
  );
}

export function EventsSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safe}>
      <View style={sk.header}>
        <View style={{ width: 32 }} />
        <Skel width={80} height={16} />
        <SkelImg circle size={32} />
      </View>
      <View style={sk.filterRow}>
        {[40, 70, 60, 50, 80, 50].map((w, i) => (
          <Skel key={i} width={w} height={32} radius={999} />
        ))}
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: colors.paperWarm }} scrollEnabled={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <SkEventFullCard />
        <SkEventFullCard />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Frame 5: Shop Listing ─────────────────────────────────────────────────────

function SkShopGridCard() {
  return (
    <View style={[sk.whiteCard, { flex: 1, padding: 0, overflow: "hidden" }]}>
      <SkelImg width="100%" height={160} radius={0} />
      <View style={{ padding: 12, gap: 4 }}>
        <Skel width="80%" height={12} />
        <Skel width="55%" height={12} style={{ marginBottom: 8 }} />
        <Skel width={48} height={10} style={{ opacity: 0.7, marginBottom: 4 }} />
        <Skel width={60} height={14} style={{ marginBottom: 8 }} />
        <Skel width="100%" height={36} radius={999} />
      </View>
    </View>
  );
}

export function ShopListingSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safe}>
      <View style={sk.header}>
        <View style={{ width: 32 }} />
        <Skel width={60} height={16} />
        <SkelImg circle size={32} />
      </View>
      {/* Search bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.paper }}>
        <Skel width="100%" height={44} radius={999} />
      </View>
      <View style={sk.filterRow}>
        {[52, 70, 64, 80, 60].map((w, i) => (
          <Skel key={i} width={w} height={32} radius={999} />
        ))}
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: colors.paperWarm }} scrollEnabled={false} contentContainerStyle={{ padding: 16 }}>
        <Row gap={8} style={{ marginBottom: 8 }}>
          <SkShopGridCard />
          <SkShopGridCard />
        </Row>
        <Row gap={8}>
          <SkShopGridCard />
          <SkShopGridCard />
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Frame 6: Public Profile ───────────────────────────────────────────────────

export function ProfileSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safeWarm}>
      {/* Hero gradient placeholder */}
      <Skel width="100%" height={200} radius={0} />
      {/* Overlapping card */}
      <View style={sk.profileCard}>
        <SkelImg circle size={96} style={{ marginTop: -48, marginBottom: 12 }} />
        <Skel width={80} height={24} radius={999} style={{ marginBottom: 12 }} />
        <Skel width={160} height={18} style={{ marginBottom: 4 }} />
        <Skel width={80} height={10} style={{ marginBottom: 12 }} />
        <Skel width={140} height={12} style={{ marginBottom: 4 }} />
        <Skel width={80} height={10} style={{ marginBottom: 12 }} />
        <Skel width={100} height={8} style={{ marginBottom: 24 }} />
        {/* Badges */}
        <Row gap={8} style={{ overflow: "hidden", marginBottom: 16 }}>
          {[90, 120, 80, 110].map((w, i) => (
            <Skel key={i} width={w} height={32} radius={999} />
          ))}
        </Row>
        {/* Social */}
        <Row gap={24} style={{ marginBottom: 16 }}>
          {[0, 1, 2].map((i) => <Skel key={i} circle size={36} />)}
        </Row>
        {/* Tabs */}
        <View style={sk.tabRow}>
          {[80, 60].map((w, i) => (
            <View key={i} style={[sk.tab, i === 0 && sk.tabActive]}>
              <Skel width={w} height={14} />
            </View>
          ))}
        </View>
        {/* Posts */}
        <Col gap={12} style={{ marginTop: 16 }}>
          {[0, 1].map((i) => (
            <View key={i} style={sk.postCard}>
              <Row style={{ justifyContent: "space-between", marginBottom: 12 }}>
                <Skel width={60} height={16} radius={999} />
                <Skel width={48} height={10} />
              </Row>
              <Col gap={4} style={{ marginBottom: 12 }}>
                <Skel width="90%" height={12} />
                <Skel width="65%" height={12} />
              </Col>
              <Row gap={16}>
                {[0, 1, 2].map((j) => (
                  <Row key={j} gap={4}><Skel circle size={12} /><Skel width={20} height={8} /></Row>
                ))}
              </Row>
            </View>
          ))}
        </Col>
      </View>
    </SafeAreaView>
  );
}

// ── Frame 7: Notifications ────────────────────────────────────────────────────

function SkNotifRow({ wide = true, unread = false }: { wide?: boolean; unread?: boolean }) {
  return (
    <View style={sk.notifRow}>
      <SkelImg circle size={40} />
      <Col gap={4} style={{ flex: 1 }}>
        <Skel width={wide ? 200 : 160} height={14} />
        <Skel width={wide ? 240 : 200} height={12} />
      </Col>
      <Col gap={4} style={{ alignItems: "flex-end" }}>
        <Skel width={32} height={10} />
        {unread && <Skel circle size={8} />}
      </Col>
    </View>
  );
}

export function NotificationsSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safeWhite}>
      <View style={sk.header}>
        <Skel circle size={24} />
        <Skel width={100} height={16} />
        <Skel width={80} height={14} />
      </View>
      <View style={{ flex: 1, backgroundColor: colors.paper }}>
        <View style={sk.notifGroup}><Skel width={60} height={8} /></View>
        <SkNotifRow wide unread />
        <SkNotifRow wide={false} unread />
        <SkNotifRow wide />
        <SkNotifRow wide={false} />
        <SkNotifRow wide />
        <View style={sk.notifGroup}><Skel width={70} height={8} /></View>
        <View style={{ opacity: 0.7 }}>
          <SkNotifRow wide={false} />
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Frame 8: Games Hub ────────────────────────────────────────────────────────

function SkGameCard() {
  const cardW = (W - 32 - 12) / 2;
  return (
    <View style={[sk.whiteCard, { width: cardW, padding: 0, overflow: "hidden" }]}>
      <SkelImg width={cardW} height={140} radius={0} />
      <Col gap={4} style={{ padding: 16 }}>
        <Skel width="80%" height={14} />
        <Skel width="60%" height={10} style={{ marginBottom: 12 }} />
        <Skel width="100%" height={36} radius={999} />
      </Col>
    </View>
  );
}

export function GamesSkeleton() {
  return (
    <SafeAreaView edges={["top"]} style={sk.safe}>
      <View style={[sk.header, { flexDirection: "column", alignItems: "center", justifyContent: "center", height: 72, gap: 4 }]}>
        <Skel width={80} height={16} />
        <Skel width={120} height={10} style={{ opacity: 0.8 }} />
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: colors.paperWarm }} scrollEnabled={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Row gap={12}>
          <SkGameCard />
          <SkGameCard />
        </Row>
        <Row gap={12}>
          <SkGameCard />
          <SkGameCard />
        </Row>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Frame 9: Full-App Splash ──────────────────────────────────────────────────

export function AppLoadingScreen() {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <SafeAreaView style={sk.splashSafe}>
      <Image
        source={SPLASH_ICON}
        style={{ width: 56, height: 56, borderRadius: 28 }}
        resizeMode="contain"
      />
      <View style={sk.splashSpinnerWrap}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <View style={sk.splashArc} />
        </Animated.View>
        <Text style={sk.splashSubtext}>Loading your culture...</Text>
      </View>
      <Text style={sk.splashFooter}>Connect to Culture</Text>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const sk = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: colors.paperWarm },
  safeWarm:  { flex: 1, backgroundColor: colors.paperWarm },
  safeWhite: { flex: 1, backgroundColor: colors.paper },

  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}66`,
  },
  filterRow: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}66`,
    overflow: "hidden",
  },

  card: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
    shadowColor: "#14110D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  divider: {
    height: 1,
    backgroundColor: `${colors.ghost}33`,
    marginBottom: 24,
  },

  // Article
  articleCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -32,
    zIndex: 10,
    padding: 32,
    paddingTop: 28,
  },
  pullQuote: {
    borderLeftWidth: 4,
    borderLeftColor: BASE,
    paddingLeft: 12,
  },

  // Dashboard / shared white card
  whiteCard: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#14110D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statsCard: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#14110D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  statDivider: { width: 1, height: 30, backgroundColor: `${colors.ghost}66` },
  menuRow: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}44`,
  },

  // Profile
  profileCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    zIndex: 10,
    padding: 16,
    alignItems: "center",
    minHeight: 600,
  },
  tabRow: {
    flexDirection: "row",
    width: "100%",
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}66`,
  },
  tab: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: `${colors.ochre}33`,
  },
  postCard: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: `${colors.ghost}66`,
    borderRadius: 10,
    padding: 16,
  },

  // Notifications
  notifGroup: {
    height: 32,
    backgroundColor: colors.paperDeep,
    paddingHorizontal: 16,
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}66`,
  },
  notifRow: {
    height: 72,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${colors.ghost}66`,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.paper,
  },

  // Splash
  splashSafe: {
    flex: 1,
    backgroundColor: colors.paperWarm,
    justifyContent: "center",
    alignItems: "center",
  },
  splashBrand: {
    alignItems: "center",
    marginBottom: 40,
  },
  splashWordmark: {
    fontFamily: fonts.serifBold,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  splashTagline: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 3.2,
    textTransform: "uppercase",
    marginTop: 6,
  },
  splashSpinnerWrap: {
    alignItems: "center",
    gap: 16,
  },
  splashArc: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderTopColor: colors.ochre,
    borderRightColor: colors.ochre,
    borderBottomColor: "transparent",
    borderLeftColor: colors.ochre,
  },
  splashSubtext: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: "#9E9288",
  },
  splashFooter: {
    position: "absolute",
    bottom: 32,
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.ghost,
  },
});
