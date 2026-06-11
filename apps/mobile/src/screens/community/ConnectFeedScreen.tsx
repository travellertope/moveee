import React, { useMemo, useState } from "react";
import {
  View, FlatList, StyleSheet, TouchableOpacity, SafeAreaView,
  Text, ActivityIndicator, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedFeed } from "../../features/community/useUnifiedFeed";
import { useNotificationCount } from "../../features/notifications/useNotificationCount";
import { rankFeed, getTrending, matchesInterests } from "../../features/community/useFeedRecommendations";
import { useAuthStore } from "../../auth/authStore";
import FeedItemCard from "../../components/community/FeedItemCard";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { FeedItem } from "../../types";

function feedItemToPostId(item: FeedItem): string {
  return (item as any).wpId ?? item.id.replace(/^community-/, "");
}

const CATEGORY_FILTERS = [
  "Music", "Film", "Art", "Fashion", "Literature",
  "Food", "Tech", "Sport", "Travel", "Design",
];

function matchesCategory(item: FeedItem, category: string): boolean {
  const cat = category.toLowerCase();
  if (item.type === "pulse" || item.type === "editorial") return (item.category ?? "").toLowerCase() === cat;
  if (item.type === "directory") return (item.entryType ?? "").toLowerCase() === cat;
  return false;
}

export default function ConnectFeedScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const { items, refreshing, loading, hasMore, error, refresh, loadMore, react } = useUnifiedFeed();
  const { unread } = useNotificationCount();

  const [showSections, setShowSections] = useState(false);
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

  const handleCategory = (cat: string) => {
    setActiveCategory((prev) => (prev === cat ? "" : cat));
    setShowSections(false);
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
      nav.navigate("Magazine", { screen: "Article", params: { slug: item.slug } });
      return;
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    const forYouBadge = forYou && hasInterests && matchesInterests(item, interestTagSet);
    return (
      <FeedItemCard
        item={item}
        onPress={() => openItem(item)}
        onAuthorPress={
          item.type === "community" && (item as any).communityAuthorId
            ? () => nav.navigate("MemberProfile", { userId: (item as any).communityAuthorId })
            : undefined
        }
        onReact={(type) => react(item, type)}
        forYouBadge={forYouBadge}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connect</Text>
        <View style={styles.headerActions}>
          {/* For You toggle */}
          <TouchableOpacity
            style={[styles.pill, forYou && styles.pillActive]}
            onPress={() => setForYou((v) => !v)}
          >
            <Text style={[styles.pillText, forYou && styles.pillTextActive]}>✦ For You</Text>
          </TouchableOpacity>

          {/* Sections */}
          <TouchableOpacity
            style={[styles.pill, (showSections || activeCategory) && styles.pillActive]}
            onPress={() => setShowSections((s) => !s)}
          >
            <Text style={[styles.pillText, (showSections || activeCategory) && styles.pillTextActive]}>⊞</Text>
          </TouchableOpacity>

          {/* Notification bell */}
          <TouchableOpacity style={styles.bellBtn} onPress={() => nav.navigate("Notifications")}>
            <Ionicons name={unread > 0 ? "notifications" : "notifications-outline"} size={22} color={colors.ink} />
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* New post */}
          <TouchableOpacity style={styles.newPostBtn} onPress={() => nav.navigate("NewPost")}>
            <Ionicons name="add" size={22} color={colors.paper} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sections panel */}
      {showSections && (
        <View style={styles.sectionsPanel}>
          <Text style={styles.sectionsPanelLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsRow}>
            {CATEGORY_FILTERS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                onPress={() => handleCategory(cat)}
              >
                <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Active category chip */}
      {activeCategory ? (
        <View style={styles.activeChipRow}>
          <Text style={styles.activeChipLabel}>Category</Text>
          <View style={styles.activeChip}>
            <Text style={styles.activeChipText}>{activeCategory}</Text>
          </View>
          <TouchableOpacity onPress={() => setActiveCategory("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={14} color={colors.ghost} />
          </TouchableOpacity>
        </View>
      ) : null}

      {/* For You — trending strip when active */}
      {forYou && trending.length > 0 && (
        <View style={styles.trendingStrip}>
          <Text style={styles.trendingLabel}>Trending</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingRow}>
            {trending.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.trendingChip}
                onPress={() => openItem(item)}
              >
                <Text style={styles.trendingChipText} numberOfLines={1}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : visibleItems.length === 0 && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onRefresh={refresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={40} color={colors.ghost} />
              <Text style={styles.emptyText}>No posts yet. Be the first to share something!</Text>
            </View>
          }
          ListFooterComponent={
            loading && hasMore ? (
              <ActivityIndicator style={styles.loader} color={colors.gold} />
            ) : null
          }
          contentContainerStyle={visibleItems.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.paper,
  },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },
  headerActions: { flexDirection: "row", alignItems: "center", gap: space[2] },

  pill: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[2] + 2, paddingVertical: 5,
    backgroundColor: colors.paperDeep,
  },
  pillActive:     { backgroundColor: colors.ink, borderColor: colors.ink },
  pillText:       { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  pillTextActive: { color: colors.paper },

  bellBtn: { padding: 4, position: "relative" },
  badge: {
    position: "absolute", top: 0, right: 0,
    backgroundColor: colors.ochre, borderRadius: radius.full,
    minWidth: 16, height: 16, paddingHorizontal: 2,
    justifyContent: "center", alignItems: "center",
  },
  badgeText: { fontFamily: fonts.monoBold, fontSize: fontSize.tiny, color: "#fff" },

  newPostBtn: {
    backgroundColor: colors.ink, borderRadius: radius.full,
    width: 34, height: 34, justifyContent: "center", alignItems: "center",
  },

  sectionsPanel: {
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.paper, paddingTop: space[2], paddingBottom: space[2],
  },
  sectionsPanelLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute,
    letterSpacing: 1.2, textTransform: "uppercase",
    marginLeft: space[4], marginBottom: space[1],
  },
  sectionsRow: { flexDirection: "row", gap: space[2], paddingHorizontal: space[4] },
  categoryPill: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: space[1],
    backgroundColor: colors.paper,
  },
  categoryPillActive:     { backgroundColor: colors.ochre, borderColor: colors.ochre },
  categoryPillText:       { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.inkSoft },
  categoryPillTextActive: { color: "#fff" },

  activeChipRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    paddingHorizontal: space[4], paddingVertical: space[2],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.paper,
  },
  activeChipLabel: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  activeChip: {
    backgroundColor: "#fff0eb", borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: 2,
  },
  activeChipText: { fontFamily: fonts.sansBold, fontSize: fontSize.xs, color: colors.ochre },

  trendingStrip: {
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.goldLight, paddingVertical: space[2],
  },
  trendingLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold,
    textTransform: "uppercase", letterSpacing: 1.0,
    marginLeft: space[4], marginBottom: space[1],
  },
  trendingRow: { paddingHorizontal: space[4], gap: space[2] },
  trendingChip: {
    borderWidth: 1, borderColor: colors.goldBorder, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: 4,
    backgroundColor: colors.paper, maxWidth: 180,
  },
  trendingChipText: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.ink },

  list: {},
  listEmpty:   { flexGrow: 1 },
  loader:      { paddingVertical: space[5] },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8], gap: space[3] },
  errorText:   { fontFamily: fonts.sans, color: colors.ochre, marginBottom: space[2] },
  retryText:   { fontFamily: fonts.sansBold, color: colors.gold },
  emptyText:   { fontFamily: fonts.sans, color: colors.ghost, textAlign: "center", fontSize: fontSize.base, lineHeight: 22 },
});
