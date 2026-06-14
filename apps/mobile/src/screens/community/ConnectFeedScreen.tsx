import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedFeed } from "../../features/community/useUnifiedFeed";
import { useNotificationCount } from "../../features/notifications/useNotificationCount";
import {
  rankFeed,
  getTrending,
  matchesInterests,
} from "../../features/community/useFeedRecommendations";
import { useAuthStore } from "../../auth/authStore";
import FeedCard from "../../components/community/FeedItemCard";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import type { FeedItem } from "../../types";

function feedItemToPostId(item: FeedItem): string {
  return (item as any).wpId ?? item.id.replace(/^community-/, "");
}

const FILTER_LABELS = [
  "✦ For You",
  "All",
  "Music",
  "Film",
  "Art",
  "Fashion",
  "Food",
  "Tech",
  "Sport",
  "Travel",
  "Design",
  "Literature",
];

function matchesCategory(item: FeedItem, category: string): boolean {
  const cat = category.toLowerCase();
  if (item.type === "pulse" || item.type === "editorial")
    return (item.category ?? "").toLowerCase() === cat;
  if (item.type === "directory")
    return (item.entryType ?? "").toLowerCase() === cat;
  return false;
}

const TRENDING_COLORS = ["#C5491F", "#7C3AED", "#065F46"];

export default function ConnectFeedScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const {
    items,
    refreshing,
    loading,
    hasMore,
    error,
    refresh,
    loadMore,
    react,
  } = useUnifiedFeed();
  const { unread } = useNotificationCount();

  const [activeCategory, setActiveCategory] = useState("");
  const [forYou, setForYou] = useState(false);
  // Edition routing: default to user's region so local content is pre-filtered
  const [activeRegion, setActiveRegion] = useState<string>(() => {
    const c = (user?.countryOfResidence ?? "").toLowerCase().trim();
    if (!c) return "All";
    const map: Record<string, string> = {
      nigeria: "Africa", ng: "Africa", ghana: "Africa", gh: "Africa",
      kenya: "Africa", ke: "Africa", "south africa": "Africa", za: "Africa",
      "united kingdom": "Diaspora UK", uk: "Diaspora UK", gb: "Diaspora UK",
      "united states": "Diaspora US", us: "Diaspora US", canada: "Diaspora US",
      france: "Diaspora Europe", germany: "Diaspora Europe",
    };
    return map[c] ?? "All";
  });

  const interestTagSet = useMemo(
    () => new Set((user?.interests ?? []).map((s) => s.toLowerCase())),
    [user?.interests]
  );
  const hasInterests = interestTagSet.size > 0;

  const userCity   = user?.city ?? undefined;
  const userRegion = useMemo(() => {
    const c = (user?.countryOfResidence ?? "").toLowerCase().trim();
    if (!c) return undefined;
    const map: Record<string, string> = {
      nigeria: "Africa", ng: "Africa", ghana: "Africa", gh: "Africa",
      kenya: "Africa", ke: "Africa", "south africa": "Africa", za: "Africa",
      "united kingdom": "Diaspora UK", uk: "Diaspora UK", gb: "Diaspora UK",
      "united states": "Diaspora US", us: "Diaspora US", canada: "Diaspora US",
      france: "Diaspora Europe", germany: "Diaspora Europe",
    };
    return map[c] ?? undefined;
  }, [user?.countryOfResidence]);

  const REGION_LABELS = ["All", "Africa", "Diaspora UK", "Diaspora US", "Diaspora Europe"];

  const visibleItems = useMemo(() => {
    let filtered = activeCategory
      ? items.filter((i) => matchesCategory(i, activeCategory))
      : items;

    if (activeRegion !== "All") {
      filtered = filtered.filter(
        (i) => !(i as any).region || (i as any).region === activeRegion
      );
    }

    if (forYou) {
      filtered = rankFeed(filtered, interestTagSet, userCity, userRegion);
    }

    return filtered;
  }, [items, activeCategory, activeRegion, forYou, interestTagSet, userCity, userRegion]);

  const trending = useMemo(() => getTrending(items, 3), [items]);

  const handleFilter = (label: string) => {
    if (label === "✦ For You") {
      setForYou(true);
      setActiveCategory("");
    } else if (label === "All") {
      setForYou(false);
      setActiveCategory("");
    } else {
      setForYou(false);
      setActiveCategory((prev) => (prev === label ? "" : label));
    }
  };

  const openItem = (item: FeedItem) => {
    if (item.type === "community") {
      nav.navigate("PostDetail", { postId: feedItemToPostId(item), item });
      return;
    }
    if (item.type === "pulse") {
      nav.navigate("PulseDetail", { item });
      return;
    }
    if (item.type === "editorial") {
      // Stay within ConnectStack so back → feed and Magazine tab is never polluted.
      nav.navigate("Article", { slug: item.slug });
      return;
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const forYouBadge =
      forYou && hasInterests && matchesInterests(item, interestTagSet);
    return (
      <FeedCard
        item={item}
        onPress={() => openItem(item)}
        onAuthorPress={
          item.type === "community" && (item as any).communityAuthorId
            ? () =>
                nav.navigate("MemberProfile", {
                  userId: (item as any).communityAuthorId,
                })
            : undefined
        }
        onReact={(type) => react(item, type)}
        forYouBadge={forYouBadge}
      />
    );
  };

  const activeFilterLabel = forYou
    ? "✦ For You"
    : activeCategory
    ? activeCategory
    : "All";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── AppHeader ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerLogo}>moveee</Text>
            <Text style={styles.headerSubtitle}>connect</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Ghost refresh */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={refresh}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={c.ghost}
              />
            </TouchableOpacity>

            {/* Bell */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => nav.navigate("Notifications")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="notifications-outline"
                size={22}
                color={c.ink}
              />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unread > 9 ? "9+" : unread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Avatar → member dashboard */}
            <TouchableOpacity
              style={styles.avatarBtn}
              onPress={() => nav.navigate("MemberDashboard")}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarImg, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(user?.displayName ?? user?.name ?? "?")[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FilterRow ─────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {FILTER_LABELS.map((label) => {
              const isActive = label === activeFilterLabel;
              return (
                <TouchableOpacity
                  key={label}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => handleFilter(label)}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      isActive && styles.filterPillTextActive,
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Region Strip ─────────────────────────────────────── */}
        <View style={styles.regionRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContent}
          >
            {REGION_LABELS.map((r) => {
              const isActive = r === activeRegion;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.regionPill, isActive && styles.regionPillActive]}
                  onPress={() => setActiveRegion(r)}
                >
                  <Text style={[styles.regionPillText, isActive && styles.regionPillTextActive]}>
                    {r === "All" ? "🌍 All regions" : r}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Trending Strip ────────────────────────────────────── */}
        {forYou && trending.length > 0 && (
          <View style={styles.trendingStrip}>
            <View style={styles.trendingHeader}>
              <Text style={styles.trendingNowLabel}>TRENDING NOW</Text>
              <Text style={styles.trendingSeeAll}>See all →</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.trendingScroll}
            >
              {trending.map((item, index) => {
                const firstWord = item.title.split(" ")[0] ?? item.title;
                const accentColor =
                  TRENDING_COLORS[index % TRENDING_COLORS.length];
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.trendingCard}
                    onPress={() => openItem(item)}
                  >
                    <View
                      style={[
                        styles.trendingCardTop,
                        { backgroundColor: accentColor },
                      ]}
                    >
                      <View style={styles.trendingWordBadge}>
                        <Text style={styles.trendingWordText} numberOfLines={1}>
                          {firstWord}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.trendingCardBottom}>
                      <Text
                        style={styles.trendingCardTitle}
                        numberOfLines={2}
                      >
                        {item.title}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Feed ─────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refresh}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : visibleItems.length === 0 && loading ? (
          <FeedSkeleton />
        ) : (
          <FlatList
            data={visibleItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={refresh}
                tintColor={c.gold}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons
                  name="people-outline"
                  size={40}
                  color={c.ghost}
                />
                <Text style={styles.emptyText}>
                  No posts yet. Be the first to share something!
                </Text>
              </View>
            }
            ListFooterComponent={
              loading && hasMore ? (
                <ActivityIndicator
                  style={styles.loader}
                  color={c.gold}
                />
              ) : null
            }
            contentContainerStyle={
              visibleItems.length === 0
                ? styles.listEmpty
                : styles.listContent
            }
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* ── FAB ───────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => nav.navigate("NewPost")}
        >
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) { return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: c.paperWarm },
  container: { flex: 1, backgroundColor: c.paperWarm },

  // Header
  header: {
    height: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space[4],
    backgroundColor: c.paper,
    ...shadows.card,
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-end" },
  headerLogo: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: c.ink,
  },
  headerSubtitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.tiny,
    color: c.gold,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginTop: 2,
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: c.ochre,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadgeText: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.tiny,
    color: "#fff",
  },
  avatarBtn: {
    marginLeft: 4,
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    backgroundColor: colors.goldLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.gold,
  },

  // Filter Row
  filterRow: {
    height: 52,
    backgroundColor: c.paper,
    borderBottomWidth: 1,
    borderBottomColor: c.rule,
  },
  regionRow: {
    height: 40,
    backgroundColor: c.paperWarm,
    borderBottomWidth: 1,
    borderBottomColor: c.rule,
  },
  regionPill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: c.ghost,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  regionPillActive: {
    backgroundColor: c.ink,
    borderColor: c.ink,
  },
  regionPillText: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: c.mute,
  },
  regionPillTextActive: {
    color: c.paper,
    fontFamily: fonts.monoBold,
  },
  filterContent: {
    paddingHorizontal: space[4],
    gap: 8,
    alignItems: "center",
    height: 52,
  },
  filterPill: {
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: c.ghost,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: c.ochre,
    borderColor: c.ochre,
  },
  filterPillText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: c.inkSoft,
  },
  filterPillTextActive: {
    color: "#fff",
  },

  // Trending Strip
  trendingStrip: {
    backgroundColor: c.paper,
    borderBottomWidth: 1,
    borderBottomColor: c.rule,
    paddingVertical: 10,
  },
  trendingHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space[4],
    marginBottom: 8,
  },
  trendingNowLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.tiny,
    color: c.ochre,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    flex: 1,
  },
  trendingSeeAll: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: c.ghost,
  },
  trendingScroll: {
    paddingHorizontal: space[4],
    gap: 8,
  },
  trendingCard: {
    width: 160,
    height: 88,
    backgroundColor: c.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: c.rule,
    overflow: "hidden",
  },
  trendingCardTop: {
    height: 44,
    position: "relative",
    justifyContent: "flex-end",
    padding: 6,
  },
  trendingWordBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: c.paperDeep,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 120,
  },
  trendingWordText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: c.mute,
  },
  trendingCardBottom: {
    height: 44,
    padding: 8,
    justifyContent: "center",
  },
  trendingCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: c.ink,
  },

  // Feed
  listContent: { paddingTop: 12, paddingBottom: 80, gap: 12 },
  listEmpty: { flexGrow: 1 },
  loader: { paddingVertical: space[5] },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: space[8],
    gap: space[3],
  },
  errorText: { fontFamily: fonts.sans, color: c.ochre, marginBottom: space[2] },
  retryText: { fontFamily: fonts.sansBold, color: c.gold },
  emptyText: {
    fontFamily: fonts.sans,
    color: c.ghost,
    textAlign: "center",
    fontSize: fontSize.base,
    lineHeight: 22,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: c.ochre,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.fab,
  },
}); }
