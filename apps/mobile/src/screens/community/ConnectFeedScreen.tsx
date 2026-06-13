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
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
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

  const interestTagSet = useMemo(
    () => new Set((user?.interests ?? []).map((s) => s.toLowerCase())),
    [user?.interests]
  );

  const hasInterests = interestTagSet.size > 0;

  const visibleItems = useMemo(() => {
    let filtered = activeCategory
      ? items.filter((i) => matchesCategory(i, activeCategory))
      : items;

    if (forYou) {
      filtered = rankFeed(filtered, interestTagSet);
    }

    return filtered;
  }, [items, activeCategory, forYou, interestTagSet]);

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
      nav.navigate("Magazine", {
        screen: "Article",
        params: { slug: item.slug },
      });
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
                color={colors.ghost}
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
                color={colors.ink}
              />
              {unread > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>
                    {unread > 9 ? "9+" : unread}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* + new post */}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => nav.navigate("NewPost")}
            >
              <Ionicons name="add" size={22} color={colors.paper} />
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
                tintColor={colors.gold}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons
                  name="people-outline"
                  size={40}
                  color={colors.ghost}
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
                  color={colors.gold}
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paperWarm },
  container: { flex: 1, backgroundColor: colors.paperWarm },

  // Header
  header: {
    height: 52,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space[4],
    backgroundColor: colors.paper,
    ...shadows.card,
  },
  headerLeft: { flexDirection: "row", alignItems: "flex-end" },
  headerLogo: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  headerSubtitle: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: colors.gold,
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
    backgroundColor: colors.ochre,
    borderRadius: radius.full,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadgeText: {
    fontFamily: fonts.monoBold,
    fontSize: 9,
    color: "#fff",
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.ochre,
    justifyContent: "center",
    alignItems: "center",
  },

  // Filter Row
  filterRow: {
    height: 52,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
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
    borderColor: colors.ghost,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  filterPillActive: {
    backgroundColor: colors.ochre,
    borderColor: colors.ochre,
  },
  filterPillText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.inkSoft,
  },
  filterPillTextActive: {
    color: "#fff",
  },

  // Trending Strip
  trendingStrip: {
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
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
    fontSize: 9,
    color: colors.ochre,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    flex: 1,
  },
  trendingSeeAll: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.ghost,
  },
  trendingScroll: {
    paddingHorizontal: space[4],
    gap: 8,
  },
  trendingCard: {
    width: 160,
    height: 88,
    backgroundColor: colors.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.rule,
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
    backgroundColor: colors.paperDeep,
    borderRadius: radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
    maxWidth: 120,
  },
  trendingWordText: {
    fontFamily: fonts.mono,
    fontSize: 8,
    color: colors.mute,
  },
  trendingCardBottom: {
    height: 44,
    padding: 8,
    justifyContent: "center",
  },
  trendingCardTitle: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.ink,
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
  errorText: { fontFamily: fonts.sans, color: colors.ochre, marginBottom: space[2] },
  retryText: { fontFamily: fonts.sansBold, color: colors.gold },
  emptyText: {
    fontFamily: fonts.sans,
    color: colors.ghost,
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
    backgroundColor: colors.ochre,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.fab,
  },
});
