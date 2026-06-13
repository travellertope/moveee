import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Dimensions, FlatList,
  Animated,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { Member } from "../../types";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Types ────────────────────────────────────────────────────────────────────

interface PublicProfile extends Member {
  interests?: string[];
  badges?: Array<{ slug: string; name: string; emoji: string }>;
  registeredAt?: number;
}

interface CommunityPost {
  id: string;
  slug: string;
  templateType: string;
  templateEmoji: string;
  templateLabel: string;
  excerpt: string;
  timeAgo: string;
  reactions: number;
  hotness: number;
  applause: number;
}

interface PortfolioItem {
  id: string;
  title: string;
  year: string;
  imageUrl?: string;
  gradientColors: [string, string];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatMemberSince(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `Member since ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}

const TEMPLATE_META: Record<string, { emoji: string; label: string }> = {
  post:               { emoji: "📝", label: "Post" },
  "hidden-gem":       { emoji: "💎", label: "Hidden Gem" },
  "cultural-take":    { emoji: "💬", label: "Cultural Take" },
  "food-review":      { emoji: "🍽", label: "Food Review" },
  "creative-showcase":{ emoji: "🎨", label: "Creative Showcase" },
  poll:               { emoji: "📊", label: "Poll" },
  itinerary:          { emoji: "🗺", label: "Itinerary" },
  event:              { emoji: "📅", label: "Event" },
  quote:              { emoji: "✦", label: "Quote" },
};

const PORTFOLIO_GRADIENTS: Array<[string, string]> = [
  ["#FF9A9E", "#FECFEF"],
  ["#F6D365", "#FDA085"],
  ["#84FAB0", "#8FD3F4"],
  ["#A18CD1", "#FBC2EB"],
  ["#FBC2EB", "#A6C1EE"],
];

// ── Sub-components ───────────────────────────────────────────────────────────

function BadgeShelf({ badges }: { badges: Array<{ slug: string; name: string; emoji: string }> }) {
  if (!badges.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.badgeShelf}
      style={styles.badgeShelfWrap}
    >
      {badges.map((b) => (
        <View key={b.slug} style={styles.badge}>
          <Text style={styles.badgeText}>{b.emoji} {b.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function MiniPostCard({ post }: { post: CommunityPost }) {
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

function PortfolioGrid({
  items,
  isOwnProfile,
}: {
  items: PortfolioItem[];
  isOwnProfile: boolean;
}) {
  const colW = (SCREEN_W - 32 - 8) / 2;

  return (
    <View style={styles.portfolioGrid}>
      {items.map((item, i) => (
        <View key={item.id} style={[styles.portfolioItem, { width: colW }]}>
          <LinearGradient
            colors={PORTFOLIO_GRADIENTS[i % PORTFOLIO_GRADIENTS.length]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.portfolioImage}
          />
          <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.portfolioYear}>{item.year}</Text>
        </View>
      ))}
      {isOwnProfile && (
        <TouchableOpacity style={[styles.portfolioAddBtn, { width: colW }]}>
          <Ionicons name="add" size={20} color={colors.ghost} />
          <Text style={styles.portfolioAddText}>Add portfolio item</Text>
        </TouchableOpacity>
      )}
      {/* Footer count */}
      {items.length > 0 && (
        <Text style={[styles.portfolioCount, { width: SCREEN_W - 32 }]}>
          {items.length + (isOwnProfile ? 0 : 0)} items
        </Text>
      )}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation<any>();

  const [profile,   setProfile]   = useState<PublicProfile | null>(null);
  const [posts,     setPosts]     = useState<CommunityPost[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [postPage,  setPostPage]  = useState(1);
  const [activeTab, setActiveTab] = useState<"community" | "portfolio">("community");

  useEffect(() => {
    const uid = params.userId ?? params.username;
    api.get<PublicProfile>(`${MOBILE_API}/member/${uid}`)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.userId, params.username]);

  useEffect(() => {
    if (!profile) return;
    const uid = params.userId ?? profile.id;
    api.get<CommunityPost[]>(`${MOBILE_API}/community/posts?author_id=${uid}&page=${postPage}&per_page=10`)
      .then((data) => setPosts((prev) => postPage === 1 ? (data ?? []) : [...prev, ...(data ?? [])]))
      .catch(() => {});
  }, [profile, postPage]);

  useEffect(() => {
    if (!profile || activeTab !== "portfolio") return;
    const uid = params.userId ?? profile.id;
    api.get<PortfolioItem[]>(`${MOBILE_API}/user/portfolio?user_id=${uid}`)
      .then((data) => setPortfolio(data ?? []))
      .catch(() => {});
  }, [profile, activeTab]);

  const isPro = profile?.tier === "patron";

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Member not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const badges = profile.badges ?? [];
  const hasSocial = !!(profile.instagram || profile.linkedin || profile.website);

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[]}
      >
        {/* Hero gradient */}
        <LinearGradient
          colors={["#F3ECE0", "#E8D3BA", "#C5491F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        />

        {/* Profile card */}
        <View style={styles.profileCard}>
          {/* Share button */}
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={18} color={colors.ink} />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={[styles.avatarRing, isPro ? styles.avatarRingPro : styles.avatarRingCitizen]}>
            <View style={styles.avatarInner}>
              <Text style={styles.avatarInitials}>{initials(profile.displayName)}</Text>
            </View>
          </View>

          {/* Tier badge */}
          {isPro && (
            <View style={styles.tierBadge}>
              <Text style={styles.tierBadgeText}>★ CONNECT PRO</Text>
            </View>
          )}

          {/* Identity */}
          <View style={styles.identity}>
            <Text style={styles.profileName}>{profile.displayName}</Text>
            {profile.username ? (
              <Text style={styles.profileHandle}>@{profile.username}</Text>
            ) : null}
            {profile.occupation ? (
              <Text style={styles.profileOccupation}>{profile.occupation}</Text>
            ) : null}
            {(profile.city || profile.countryOfResidence) ? (
              <Text style={styles.profileCity}>
                📍 {[profile.city, profile.countryOfResidence].filter(Boolean).join(", ")}
              </Text>
            ) : null}
            {profile.registeredAt ? (
              <Text style={styles.profileSince}>{formatMemberSince(profile.registeredAt)}</Text>
            ) : null}
          </View>

          {/* Badge shelf */}
          {badges.length > 0 && <BadgeShelf badges={badges} />}

          {/* Social links */}
          {hasSocial && (
            <View style={styles.socialRow}>
              {profile.instagram ? (
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-instagram" size={18} color={colors.ghost} />
                </TouchableOpacity>
              ) : null}
              {profile.linkedin ? (
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-linkedin" size={18} color={colors.ghost} />
                </TouchableOpacity>
              ) : null}
              {profile.website ? (
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="globe-outline" size={18} color={colors.ghost} />
                </TouchableOpacity>
              ) : null}
            </View>
          )}

          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "community" && styles.tabActive]}
              onPress={() => setActiveTab("community")}
            >
              <Text style={[styles.tabText, activeTab === "community" && styles.tabTextActive]}>
                Community
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "portfolio" && styles.tabActive]}
              onPress={() => setActiveTab("portfolio")}
            >
              <Text style={[styles.tabText, activeTab === "portfolio" && styles.tabTextActive]}>
                Portfolio
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab content */}
          <View style={styles.tabContent}>
            {activeTab === "community" ? (
              <>
                {posts.map((p) => <MiniPostCard key={p.id} post={p} />)}
                {posts.length > 0 && (
                  <TouchableOpacity
                    style={styles.loadMore}
                    onPress={() => setPostPage((n) => n + 1)}
                  >
                    <Text style={styles.loadMoreText}>Load more posts</Text>
                  </TouchableOpacity>
                )}
                {posts.length === 0 && (
                  <Text style={styles.emptyTabText}>No posts yet.</Text>
                )}
              </>
            ) : (
              <PortfolioGrid items={portfolio} isOwnProfile={false} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating back button — above scroll */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons name="chevron-back" size={20} color={colors.ink} />
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: colors.paper },
  container:      { flex: 1, backgroundColor: colors.paper },
  scroll:         { flex: 1 },
  center:         { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText:      { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute },

  // Hero
  hero: { width: "100%", height: 200 },

  // Floating back button
  backBtn: {
    position: "absolute", top: 56, left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper,
    justifyContent: "center", alignItems: "center",
    ...shadows.card,
  },

  // Profile card
  profileCard: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    marginTop: -40, zIndex: 10,
    paddingBottom: 24, alignItems: "center",
  },

  // Share button
  shareBtn: {
    position: "absolute", top: 16, right: 16,
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: colors.ghost,
    justifyContent: "center", alignItems: "center",
  },

  // Avatar
  avatarRing: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 3, padding: 3,
    marginTop: -48, backgroundColor: colors.paper,
  },
  avatarRingPro:     { borderColor: colors.gold },
  avatarRingCitizen: { borderColor: colors.ghost },
  avatarInner: {
    flex: 1, borderRadius: 44, backgroundColor: colors.paperDeep,
    justifyContent: "center", alignItems: "center",
  },
  avatarInitials: { fontFamily: fonts.monoBold, fontSize: 18, color: colors.inkSoft },

  // Tier badge
  tierBadge: {
    marginTop: 8, marginBottom: 8,
    backgroundColor: colors.gold,
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.full,
  },
  tierBadgeText: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.paper,
    letterSpacing: 1.4, textTransform: "uppercase",
  },

  // Identity
  identity:          { alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 2 },
  profileName:       { fontFamily: fonts.serifBold, fontSize: 24, color: colors.ink },
  profileHandle:     { fontFamily: fonts.mono, fontSize: 13, color: colors.mute, marginTop: 2 },
  profileOccupation: { fontFamily: fonts.sans, fontSize: 14, color: colors.inkSoft, marginTop: 4, textAlign: "center" },
  profileCity:       { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, marginTop: 4 },
  profileSince:      { fontFamily: fonts.mono, fontSize: 10, color: colors.ghost, marginTop: 8 },

  // Badge shelf
  badgeShelfWrap: { marginTop: 16, width: "100%" },
  badgeShelf:     { paddingHorizontal: 16, gap: 8 },
  badge: {
    borderWidth: 1, borderColor: colors.ghost, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink, whiteSpace: "nowrap" as any },

  // Social links
  socialRow: { flexDirection: "row", gap: 24, marginTop: 16 },
  socialBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.paperDeep,
    justifyContent: "center", alignItems: "center",
  },

  // Tab bar
  tabBar: {
    flexDirection: "row", alignItems: "flex-end",
    height: 44, width: "100%",
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
    marginTop: 16, paddingHorizontal: 16, gap: 24,
  },
  tab: { paddingBottom: 6 },
  tabActive: {
    borderBottomWidth: 2, borderBottomColor: colors.ochre,
    paddingBottom: 1,
  },
  tabText:       { fontFamily: fonts.sans, fontSize: 14, color: colors.mute },
  tabTextActive: { fontFamily: fonts.sansBold, color: colors.ink },

  // Tab content area
  tabContent: {
    width: "100%", backgroundColor: colors.paperDeep,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 8,
  },

  // Community mini-post card
  postCard: {
    backgroundColor: colors.paper, borderRadius: 8,
    padding: 16, marginBottom: 8, ...shadows.card,
  },
  postCardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8,
  },
  templateBadge: {
    backgroundColor: colors.paperDeep, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  templateBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.ink },
  postTimeAgo:       { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },
  postExcerpt: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft,
    lineHeight: 20,
  },
  postMetaRow: { flexDirection: "row", gap: 16, marginTop: 12 },
  postMeta:    { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },

  loadMore:     { marginTop: 8, alignItems: "center", paddingVertical: 8 },
  loadMoreText: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },
  emptyTabText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ghost, textAlign: "center", paddingVertical: 32 },

  // Portfolio grid
  portfolioGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 8,
  },
  portfolioItem: { marginBottom: 4 },
  portfolioImage: {
    width: "100%", height: 120, borderRadius: 8,
  },
  portfolioTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink, marginTop: 6 },
  portfolioYear:  { fontFamily: fonts.mono, fontSize: 11, color: colors.mute, marginTop: 2 },

  portfolioAddBtn: {
    height: 120, borderWidth: 1.5, borderStyle: "dashed",
    borderColor: colors.ghost, borderRadius: 8,
    backgroundColor: colors.paperWarm,
    justifyContent: "center", alignItems: "center", gap: 6,
  },
  portfolioAddText: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },
  portfolioCount:   { fontFamily: fonts.mono, fontSize: 10, color: colors.mute, textAlign: "center", marginTop: 12 },
});
