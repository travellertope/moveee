import React, { useMemo, useState, useRef, useEffect } from "react";
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
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedFeed } from "../../features/community/useUnifiedFeed";
import { useNotificationCount } from "../../features/notifications/useNotificationCount";
import { useThemeStore } from "../../store/themeStore";
import { useColorScheme } from "react-native";

const LOGO_LIGHT = require("../../../assets/logo-black.png");
const LOGO_DARK  = require("../../../assets/logo-white.png");
// Logo natural size: 717×107
const LOGO_H = 20;
const LOGO_W = Math.round((717 / 107) * LOGO_H);
import {
  rankFeed,
  getTrending,
  matchesInterests,
} from "../../features/community/useFeedRecommendations";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import FeedCard, { ProGlowRing } from "../../components/community/FeedItemCard";
import PostDetailSheet from "../../components/community/PostDetailSheet";
import EventSpotlightCarousel from "../../components/community/EventSpotlightCarousel";
import StoopReminderCard from "../../components/community/StoopReminderCard";
import { getSpotlightEvents, isEventItem } from "../../features/community/eventSpotlight";
import TemplatePickerSheet from "../../components/community/TemplatePickerSheet";
import type { TemplateId } from "../../components/community/TemplatePickerSheet";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { FeedSkeleton } from "../../components/ui/Skeleton";
import type { FeedItem } from "../../types";

const SPOTLIGHT_MARKER_ID = "__event-spotlight__";
const FELLOWSHIP_REMINDER_MARKER_ID = "__stoop-reminder__";

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

// Chip label → extra backend term aliases that don't share the chip's exact
// wording (e.g. the "Food" chip should also catch the culture_dir_type term
// "Food & Drink", and directory entries tagged "Restaurant"/"Recipe").
// Matching itself is substring-based (in either direction), so "Food" already
// catches "Food & Drink" without an alias — this list is only for terms that
// don't share a common word with the chip label at all.
const CATEGORY_ALIASES: Record<string, string[]> = {
  music: ["album"],
  film: ["cinema", "movie"],
  art: ["artwork", "visual art"],
  food: ["restaurant", "recipe", "cuisine"],
  tech: ["technology"],
  sport: ["sports"],
  travel: ["place"],
  design: ["architecture"],
  literature: ["book", "writing"],
};

function termMatchesChip(term: string, chip: string): boolean {
  if (!term) return false;
  const t = term.toLowerCase();
  if (t === chip || t.includes(chip) || chip.includes(t)) return true;
  return (CATEGORY_ALIASES[chip] ?? []).some(
    (alias) => t.includes(alias) || alias.includes(t)
  );
}

function matchesCategory(item: FeedItem, category: string): boolean {
  const chip = category.toLowerCase();
  if (item.type === "pulse" || item.type === "editorial")
    return termMatchesChip(item.category ?? "", chip);
  if (item.type === "directory")
    return termMatchesChip(item.entryType ?? "", chip);
  return false;
}

const TRENDING_COLORS = ["#C5491F", "#7C3AED", "#065F46"];

export default function ConnectFeedScreen() {
  const nav = useNav();
  const route = useRoute<any>();
  const { user } = useAuthStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");
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
  const [filterQuotes, setFilterQuotes] = useState(() => !!route?.params?.filterQuotes);
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
  const [sheetItem, setSheetItem] = useState<FeedItem | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = nav.getParent()?.addListener("tabPress" as any, () => {
      if (nav.isFocused()) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        refresh();
      }
    });
    return () => unsubscribe?.();
  }, [nav, refresh]);

  // Refresh and scroll to top only when NewPostScreen hands back a fresh
  // `justPosted` signal — NOT on every focus. Returning here via the back
  // button (e.g. from a directory entry) should leave scroll position and
  // feed contents exactly as the user left them.
  const lastJustPosted = useRef<number | undefined>(undefined);
  useEffect(() => {
    const justPosted = route?.params?.justPosted;
    if (justPosted && justPosted !== lastJustPosted.current) {
      lastJustPosted.current = justPosted;
      refresh();
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [route?.params?.justPosted, refresh]);

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

  const [followedUsernames, setFollowedUsernames] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) return;
    api
      .get<{ usernames: string[] }>(`${MOBILE_API}/follow/following`)
      .then((res) => setFollowedUsernames(new Set((res.usernames ?? []).map((u) => u.toLowerCase()))))
      .catch(() => {});
  }, [user?.id]);

  const REGION_LABELS = ["All", "Africa", "Diaspora UK", "Diaspora US", "Diaspora Europe"];

  const visibleItems = useMemo(() => {
    let filtered = filterQuotes
      ? items.filter((i) => i.type === "quote")
      : activeCategory
      ? items.filter((i) => matchesCategory(i, activeCategory))
      : items;

    // Event-type items are surfaced exclusively through the Spotlight carousel below.
    filtered = filtered.filter((i) => !isEventItem(i));

    if (activeRegion !== "All") {
      filtered = filtered.filter(
        (i) => !(i as any).region || (i as any).region === activeRegion
      );
    }

    if (forYou) {
      filtered = rankFeed(filtered, interestTagSet, userCity, userRegion, followedUsernames);
    }

    return filtered;
  }, [items, activeCategory, activeRegion, forYou, filterQuotes, interestTagSet, userCity, userRegion, followedUsernames]);

  const [trendingExpanded, setTrendingExpanded] = useState(false);
  const trending = useMemo(
    () => getTrending(items, trendingExpanded ? 10 : 3),
    [items, trendingExpanded]
  );

  // Spotlight carousel: computed once (locked via ref) on initial load so pagination
  // never re-inserts/reorders it — avoids re-render loops from a reactive recompute.
  // Sourced from `items` (not visibleItems) since event-type items are filtered out above.
  const spotlightLockRef = useRef<FeedItem[] | null>(null);
  if (spotlightLockRef.current === null && items.length > 0) {
    spotlightLockRef.current = getSpotlightEvents(items);
  }
  const spotlightEvents = spotlightLockRef.current ?? [];

  const listData = useMemo(() => {
    if (visibleItems.length <= 5) return visibleItems;
    const extras: FeedItem[] = [];
    if (spotlightEvents.length >= 2) {
      extras.push({ id: SPOTLIGHT_MARKER_ID, type: "spotlight" } as unknown as FeedItem);
    }
    if (user) {
      extras.push({ id: FELLOWSHIP_REMINDER_MARKER_ID, type: "fellowship-reminder" } as unknown as FeedItem);
    }
    if (extras.length === 0) return visibleItems;
    return [...visibleItems.slice(0, 5), ...extras, ...visibleItems.slice(5)];
  }, [visibleItems, spotlightEvents, user]);

  const handleFilter = (label: string) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    if (label === "✦ For You") {
      setForYou(true);
      setActiveCategory("");
      setFilterQuotes(false);
    } else if (label === "All") {
      setForYou(false);
      setActiveCategory("");
      setFilterQuotes(false);
    } else if (label === "Quotes") {
      setForYou(false);
      setActiveCategory("");
      setFilterQuotes((prev) => !prev);
    } else {
      setForYou(false);
      setActiveCategory((prev) => (prev === label ? "" : label));
      setFilterQuotes(false);
    }
  };

  const openItem = (item: FeedItem) => {
    if (item.type === "community") {
      setSheetItem(item);
      return;
    }

    if (item.type === "editorial") {
      // Stay within ConnectStack so back → feed and Magazine tab is never polluted.
      nav.navigate("Article", { slug: item.slug });
      return;
    }
  };

  const renderItem = ({ item }: { item: FeedItem }) => {
    if (item.id === SPOTLIGHT_MARKER_ID) {
      return <EventSpotlightCarousel events={spotlightEvents} onOpenCommunity={setSheetItem} />;
    }
    if (item.id === FELLOWSHIP_REMINDER_MARKER_ID) {
      return <StoopReminderCard />;
    }
    const forYouBadge =
      forYou && hasInterests && matchesInterests(item, interestTagSet);
    return (
      <FeedCard
        item={item}
        onPress={() => openItem(item)}
        onAuthorPress={
          item.type === "community" && item.communityAuthorId
            ? () =>
                nav.navigate("MemberProfile", {
                  userId: item.communityAuthorId!,
                  username: item.communityAuthorUsername ?? "",
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
    : filterQuotes
    ? "Quotes"
    : activeCategory
    ? activeCategory
    : "All";

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* ── AppHeader ─────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={isDark ? LOGO_DARK : LOGO_LIGHT}
              style={{ width: LOGO_W, height: LOGO_H }}
              resizeMode="contain"
            />
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

            {/* Member directory */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => nav.navigate("MemberDirectory")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="people-outline" size={22} color={c.ink} />
            </TouchableOpacity>

            {/* Discover */}
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => nav.navigate("Discover")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="compass-outline" size={22} color={c.ink} />
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
              <View style={[styles.avatarWrap, user?.tier === "patron" ? styles.avatarWrapPro : undefined]}>
                {user?.tier === "patron" && <ProGlowRing color={c.gold} />}
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, styles.avatarFallback]}>
                    <Text style={styles.avatarInitial}>
                      {(user?.displayName ?? user?.name ?? "?")[0]?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── FilterRow ─────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
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
              <TouchableOpacity onPress={() => setTrendingExpanded((prev) => !prev)}>
                <Text style={styles.trendingSeeAll}>
                  {trendingExpanded ? "Show less" : "See all →"}
                </Text>
              </TouchableOpacity>
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
            ref={flatListRef}
            data={listData}
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
          onPress={() => setPickerVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      <PostDetailSheet
        item={sheetItem}
        visible={sheetItem !== null}
        onClose={() => setSheetItem(null)}
      />

      <TemplatePickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={(id: TemplateId) => nav.navigate("NewPost", { template: id })}
      />
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
  headerLeft: { flexDirection: "row", alignItems: "center" },
  _unused_headerSubtitle: {
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
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "visible",
    position: "relative",
  },
  avatarWrapPro: {
    borderWidth: 3.5,
    borderColor: c.gold,
    borderRadius: 17,
    shadowColor: c.gold,
    shadowOpacity: 0.85,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  avatarImg: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  avatarFallback: {
    backgroundColor: c.goldLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: c.gold,
  },

  // Filter Row
  filterRow: {
    height: 52,
    backgroundColor: c.paper,
    borderBottomWidth: 1,
    borderBottomColor: c.rule,
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
