import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Dimensions, Animated, Image,
  Modal,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { Member } from "../../types";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Reputation tiers ──────────────────────────────────────────────────────────

const REP_TIERS = [
  { slug: "member",             label: "Member",             min: 0,     max: 500   },
  { slug: "culture-contributor",label: "Culture Contributor",min: 500,   max: 2500  },
  { slug: "taste-maker",        label: "Taste Maker",        min: 2500,  max: 10000 },
  { slug: "culture-authority",  label: "Culture Authority",  min: 10000, max: 25000 },
  { slug: "culture-icon",       label: "Culture Icon",       min: 25000, max: null  },
] as const;

function getRepTier(rep: number) {
  return [...REP_TIERS].reverse().find((t) => rep >= t.min) ?? REP_TIERS[0];
}

function repProgress(rep: number) {
  const tier = getRepTier(rep);
  if (!tier.max) return 1; // maxed out
  return Math.min(1, (rep - tier.min) / (tier.max - tier.min));
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicProfile extends Member {
  interests?: string[];
  badges?: Array<{ slug: string; name: string; emoji: string }>;
  registeredAt?: number;
  reputation?: number;
  reputationTier?: string;
}

interface CommunityPost {
  id: string; slug: string; templateType: string; templateEmoji: string;
  templateLabel: string; excerpt: string; timeAgo: string;
  reactions: number; hotness: number; applause: number;
}

interface PortfolioItem {
  id: string; title: string; year: string;
  imageUrl?: string; gradientColors: [string, string];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatMemberSince(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `Member since ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}

const TEMPLATE_META: Record<string, { emoji: string; label: string }> = {
  post:                { emoji: "📝", label: "Post" },
  "hidden-gem":        { emoji: "💎", label: "Hidden Gem" },
  "cultural-take":     { emoji: "💬", label: "Cultural Take" },
  "food-review":       { emoji: "🍽", label: "Food Review" },
  "creative-showcase": { emoji: "🎨", label: "Creative Showcase" },
  poll:                { emoji: "📊", label: "Poll" },
  itinerary:           { emoji: "🗺", label: "Itinerary" },
  event:               { emoji: "📅", label: "Event" },
  quote:               { emoji: "✦", label: "Quote" },
};

const PORTFOLIO_GRADIENTS: Array<[string, string]> = [
  ["#FF9A9E", "#FECFEF"], ["#F6D365", "#FDA085"], ["#84FAB0", "#8FD3F4"],
  ["#A18CD1", "#FBC2EB"], ["#FBC2EB", "#A6C1EE"],
];

// ── Sub-components ────────────────────────────────────────────────────────────

// Reputation bar with tier label and progress
function ReputationBar({
  reputation = 0, styles, c,
}: {
  reputation?: number; styles: ReturnType<typeof createStyles>; c: ColorPalette;
}) {
  const tier = getRepTier(reputation);
  const pct  = repProgress(reputation);
  const next = REP_TIERS.find((t) => t.min > reputation);
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: pct,
      duration: 700,
      delay: 300,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={styles.repBar}>
      <View style={styles.repBarRow}>
        <Text style={styles.repTierLabel}>{tier.label}</Text>
        <Text style={styles.repScore}>{reputation} REP</Text>
      </View>
      <View style={styles.repTrack}>
        <Animated.View
          style={[
            styles.repFill,
            { width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
      {next && (
        <Text style={styles.repNext}>
          {tier.max! - reputation} more to {next.label}
        </Text>
      )}
      {!next && (
        <Text style={styles.repNext}>Highest tier reached ✦</Text>
      )}
    </View>
  );
}

// Badge icon-only row — tap shows tooltip modal
function BadgeRow({
  badges, styles, c,
}: {
  badges: Array<{ slug: string; name: string; emoji: string }>;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  const [tooltip, setTooltip] = useState<{ name: string; emoji: string } | null>(null);
  if (!badges.length) return null;
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeRow}
        style={styles.badgeRowWrap}
      >
        {badges.map((b, i) => (
          <TouchableOpacity
            key={b.slug ?? i}
            style={styles.badgeIcon}
            onPress={() => setTooltip({ name: b.name, emoji: b.emoji })}
            activeOpacity={0.7}
          >
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={!!tooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltip(null)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setTooltip(null)}
        >
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipEmoji}>{tooltip?.emoji}</Text>
            <Text style={styles.tooltipName}>{tooltip?.name}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function MiniPostCard({ post, styles }: { post: CommunityPost; styles: ReturnType<typeof createStyles> }) {
  const meta = TEMPLATE_META[post.templateType] ?? { emoji: "📝", label: "Post" };
  return (
    <View style={styles.postCard}>
      <View style={styles.postCardHeader}>
        <View style={styles.templateBadge}>
          <Text style={styles.templateBadgeText}>{meta.emoji} {meta.label}</Text>
        </View>
        <Text style={styles.postTimeAgo}>{post.timeAgo}</Text>
      </View>
      <Text style={styles.postExcerpt} numberOfLines={2}>{post.excerpt}</Text>
      <View style={styles.postMetaRow}>
        <Text style={styles.postMeta}>❤️ {post.reactions}</Text>
        <Text style={styles.postMeta}>🔥 {post.hotness}</Text>
        <Text style={styles.postMeta}>👏 {post.applause}</Text>
      </View>
    </View>
  );
}

function PortfolioGrid({ items, isOwnProfile, styles, c }: {
  items: PortfolioItem[]; isOwnProfile: boolean;
  styles: ReturnType<typeof createStyles>; c: ColorPalette;
}) {
  const colW = (SCREEN_W - 32 - 8) / 2;
  return (
    <View style={styles.portfolioGrid}>
      {items.map((item, i) => (
        <View key={item.id} style={[styles.portfolioItem, { width: colW }]}>
          <View style={styles.portfolioImage}>
            {item.imageUrl
              ? <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              : <View style={[StyleSheet.absoluteFill, { backgroundColor: PORTFOLIO_GRADIENTS[i % PORTFOLIO_GRADIENTS.length][0] }]} />
            }
          </View>
          <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.portfolioYear}>{item.year}</Text>
        </View>
      ))}
      {isOwnProfile && (
        <TouchableOpacity style={[styles.portfolioAddBtn, { width: colW }]}>
          <Ionicons name="add" size={20} color={c.ghost} />
          <Text style={styles.portfolioAddText}>Add portfolio item</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const { params } = useRoute<any>();
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [profile,   setProfile]   = useState<PublicProfile | null>(null);
  const [posts,     setPosts]     = useState<CommunityPost[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [postPage,  setPostPage]  = useState(1);
  const [activeTab, setActiveTab] = useState<"community" | "portfolio">("community");

  useEffect(() => {
    const uid = params.userId;
    if (!uid) { setLoading(false); return; }
    api.get<PublicProfile>(`${MOBILE_API}/member/${uid}`)
      .then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, [params.userId]);

  useEffect(() => {
    if (!profile) return;
    api.get<{ posts: CommunityPost[]; hasMore: boolean }>(
      `${MOBILE_API}/member/${profile.id}/posts?page=${postPage}&per_page=10`
    ).then((d) => setPosts((prev) => postPage === 1 ? (d?.posts ?? []) : [...prev, ...(d?.posts ?? [])])).catch(() => {});
  }, [profile, postPage]);

  useEffect(() => {
    if (!profile || activeTab !== "portfolio") return;
    api.get<{ items: PortfolioItem[] }>(`${MOBILE_API}/portfolio?user_id=${profile.id}`)
      .then((d) => setPortfolio(d?.items ?? [])).catch(() => {});
  }, [profile, activeTab]);

  const isPro = profile?.tier === "patron";

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color={c.gold} /></View></SafeAreaView>;
  if (!profile) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.errorText}>Member not found.</Text></View></SafeAreaView>;

  const badges = (profile.badges ?? []).map((b: any) =>
    typeof b === "string"
      ? { slug: b, name: b.replace(/-_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()), emoji: "🏅" }
      : b
  );
  const hasSocial = !!(profile.instagram || profile.linkedin || profile.website);
  const rep       = profile.reputation ?? 0;

  return (
    <View style={styles.outerContainer}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={["#F3ECE0", "#E8D3BA", "#C5491F"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.hero}
        />

        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={18} color={c.ink} />
          </TouchableOpacity>

          <View style={isPro ? styles.avatarGlowWrap : undefined}>
            <View style={[styles.avatarRing, isPro ? styles.avatarRingPro : styles.avatarRingCitizen]}>
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitials}>{initials(profile.displayName)}</Text>
              </View>
            </View>
          </View>

          {isPro && (
            <View style={styles.tierBadge}>
              <Ionicons name="ribbon" size={10} color={c.paper} />
              <Text style={styles.tierBadgeText}>CONNECT PRO</Text>
            </View>
          )}

          <View style={styles.identity}>
            <Text style={styles.profileName}>{profile.displayName}</Text>
            {profile.username    ? <Text style={styles.profileHandle}>@{profile.username}</Text> : null}
            {profile.occupation  ? <Text style={styles.profileOccupation}>{profile.occupation}</Text> : null}
            {(profile.city || profile.countryOfResidence) ? (
              <Text style={styles.profileCity}>
                📍 {[profile.city, profile.countryOfResidence].filter(Boolean).join(", ")}
              </Text>
            ) : null}
            {profile.registeredAt ? <Text style={styles.profileSince}>{formatMemberSince(profile.registeredAt)}</Text> : null}
          </View>

          {/* Reputation progress bar */}
          <ReputationBar reputation={rep} styles={styles} c={c} />

          {/* Badges — icon only, tap for name */}
          <BadgeRow badges={badges} styles={styles} c={c} />

          {hasSocial && (
            <View style={styles.socialRow}>
              {profile.instagram && <TouchableOpacity style={styles.socialBtn}><Ionicons name="logo-instagram" size={18} color={c.ghost} /></TouchableOpacity>}
              {profile.linkedin  && <TouchableOpacity style={styles.socialBtn}><Ionicons name="logo-linkedin"  size={18} color={c.ghost} /></TouchableOpacity>}
              {profile.website   && <TouchableOpacity style={styles.socialBtn}><Ionicons name="globe-outline"  size={18} color={c.ghost} /></TouchableOpacity>}
            </View>
          )}

          <View style={styles.tabBar}>
            {(["community", "portfolio"] as const).map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "community" ? (
              <>
                {posts.map((p) => <MiniPostCard key={p.id} post={p} styles={styles} />)}
                {posts.length > 0 && (
                  <TouchableOpacity style={styles.loadMore} onPress={() => setPostPage((n) => n + 1)}>
                    <Text style={styles.loadMoreText}>Load more posts</Text>
                  </TouchableOpacity>
                )}
                {posts.length === 0 && <Text style={styles.emptyTabText}>No posts yet.</Text>}
              </>
            ) : (
              <PortfolioGrid items={portfolio} isOwnProfile={false} styles={styles} c={c} />
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons name="chevron-back" size={20} color={c.ink} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: c.paper },
    container:      { flex: 1, backgroundColor: c.paper },
    scroll:         { flex: 1 },
    center:         { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText:      { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },
    hero:           { width: "100%", height: 200 },

    backBtn: {
      position: "absolute", top: 56, left: 16,
      width: 40, height: 40, borderRadius: 20, backgroundColor: c.paper,
      justifyContent: "center", alignItems: "center", ...shadows.card,
    },

    profileCard: {
      backgroundColor: c.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      marginTop: -40, zIndex: 10, paddingBottom: 24, alignItems: "center",
    },

    shareBtn: {
      position: "absolute", top: 16, right: 16,
      width: 36, height: 36, borderRadius: 18,
      borderWidth: 1, borderColor: c.ghost,
      justifyContent: "center", alignItems: "center",
    },

    avatarGlowWrap: {
      borderRadius: 52,
      shadowColor: c.gold,
      shadowOpacity: 0.6,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10,
      marginTop: -48,
    },
    avatarRing: {
      width: 96, height: 96, borderRadius: 48, borderWidth: 3, padding: 3,
      backgroundColor: c.paper,
    },
    avatarRingPro:     { borderColor: c.gold },
    avatarRingCitizen: { borderColor: c.ghost, marginTop: -48 },
    avatarInner: {
      flex: 1, borderRadius: 44, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center",
    },
    avatarInitials: { fontFamily: fonts.monoBold, fontSize: 18, color: c.inkSoft },

    tierBadge: {
      marginTop: 8, marginBottom: 4, backgroundColor: c.gold,
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full,
      flexDirection: "row", alignItems: "center", gap: 4,
    },
    tierBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper, letterSpacing: 1.4, textTransform: "uppercase" },

    identity:          { alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 2 },
    profileName:       { fontFamily: fonts.serifBold, fontSize: 24, color: c.ink },
    profileHandle:     { fontFamily: fonts.mono, fontSize: 13, color: c.mute, marginTop: 2 },
    profileOccupation: { fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft, marginTop: 4, textAlign: "center" },
    profileCity:       { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 4 },
    profileSince:      { fontFamily: fonts.mono, fontSize: 10, color: c.ghost, marginTop: 8 },

    // Reputation bar
    repBar:      { width: "100%", paddingHorizontal: 20, marginTop: 20 },
    repBarRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
    repTierLabel:{ fontFamily: fonts.sansBold, fontSize: 12, color: c.ink },
    repScore:    { fontFamily: fonts.mono, fontSize: 11, color: c.ochre },
    repTrack:    { height: 6, backgroundColor: c.ghost, borderRadius: 3, overflow: "hidden" },
    repFill:     { height: 6, backgroundColor: c.ochre, borderRadius: 3 },
    repNext:     { fontFamily: fonts.mono, fontSize: 10, color: c.mute, marginTop: 5 },

    // Badge row — icon only
    badgeRowWrap: { marginTop: 16, width: "100%" },
    badgeRow:     { paddingHorizontal: 20, gap: 10 },
    badgeIcon: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost,
      justifyContent: "center", alignItems: "center",
    },
    badgeEmoji: { fontSize: 20 },

    // Badge tooltip modal
    tooltipOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center", alignItems: "center",
    },
    tooltipBox: {
      backgroundColor: c.ink, borderRadius: 14,
      paddingHorizontal: 28, paddingVertical: 20,
      alignItems: "center", gap: 8, minWidth: 160,
    },
    tooltipEmoji: { fontSize: 36 },
    tooltipName:  { fontFamily: fonts.sansBold, fontSize: 15, color: c.paper, textAlign: "center" },

    socialRow: { flexDirection: "row", gap: 24, marginTop: 16 },
    socialBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center",
    },

    tabBar: {
      flexDirection: "row", alignItems: "flex-end",
      height: 44, width: "100%",
      borderBottomWidth: 1, borderBottomColor: c.ghost,
      marginTop: 16, paddingHorizontal: 16, gap: 24,
    },
    tab:           { paddingBottom: 6 },
    tabActive:     { borderBottomWidth: 2, borderBottomColor: c.ochre, paddingBottom: 1 },
    tabText:       { fontFamily: fonts.sans, fontSize: 14, color: c.mute },
    tabTextActive: { fontFamily: fonts.sansBold, color: c.ink },

    tabContent: {
      width: "100%", backgroundColor: c.paperDeep,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 8,
    },

    postCard:       { backgroundColor: c.paper, borderRadius: 8, padding: 16, marginBottom: 8, ...shadows.card },
    postCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    templateBadge:     { backgroundColor: c.paperDeep, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
    templateBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: c.ink },
    postTimeAgo:   { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    postExcerpt:   { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 20 },
    postMetaRow:   { flexDirection: "row", gap: 16, marginTop: 12 },
    postMeta:      { fontFamily: fonts.mono, fontSize: 10, color: c.mute },

    loadMore:     { marginTop: 8, alignItems: "center", paddingVertical: 8 },
    loadMoreText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    emptyTabText: { fontFamily: fonts.sans, fontSize: 14, color: c.ghost, textAlign: "center", paddingVertical: 32 },

    portfolioGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    portfolioItem:   { marginBottom: 4 },
    portfolioImage:  { width: "100%", height: 120, borderRadius: 8 },
    portfolioTitle:  { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, marginTop: 6 },
    portfolioYear:   { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    portfolioAddBtn: {
      height: 120, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.ghost,
      borderRadius: 8, backgroundColor: c.paperWarm,
      justifyContent: "center", alignItems: "center", gap: 6,
    },
    portfolioAddText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
  });
}
