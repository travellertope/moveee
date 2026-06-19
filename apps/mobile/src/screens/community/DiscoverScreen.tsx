import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../hooks/useColors";
import { useNav, AppParamList } from "../../hooks/useNav";
import { useRoute, RouteProp } from "@react-navigation/native";
import type { ColorPalette } from "../../theme";
import { fonts, fontSize, space, radius } from "../../theme";
import { api, CULTURE_API } from "../../api/client";
import DiscoverCard, { DiscoverEntry, TYPE_BADGE } from "../../components/community/DiscoverCard";
import DiscoverFilterSheet, { SortOption } from "../../components/community/DiscoverFilterSheet";

const PER_PAGE = 20;

interface BrowseResponse {
  entries: DiscoverEntry[];
  total: number;
  page: number;
  perPage: number;
}

export default function DiscoverScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<AppParamList, "Discover">>();

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<string | null>(route.params?.type ?? null);
  const [region, setRegion] = useState<string | null>(route.params?.region ?? null);
  const [sort, setSort] = useState<SortOption>("relevant");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const [recent, setRecent] = useState<DiscoverEntry[]>([]);
  const [trending, setTrending] = useState<DiscoverEntry[]>([]);
  const [entries, setEntries] = useState<DiscoverEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Stable per-visit random seed so "Load more" pagination doesn't reshuffle
  // already-seen entries — regenerated only when the screen is remounted.
  const seedRef = useRef(Math.floor(Math.random() * 1_000_000_000) + 1);

  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const requestIdRef = useRef(0);

  // "Recently Added" rail — fetched once per type/region change, independent of search/sort
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (region) params.set("region", region);
        params.set("sort", "recent");
        params.set("per_page", "10");
        const data = await api.get<BrowseResponse>(
          `${CULTURE_API}/directory/browse?${params.toString()}`,
          false
        );
        if (!cancelled) setRecent(data?.entries ?? []);
      } catch {
        if (!cancelled) setRecent([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, region]);

  // "Trending in Community" rail — entries most referenced by community posts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams();
        if (type) params.set("type", type);
        if (region) params.set("region", region);
        params.set("sort", "trending");
        params.set("per_page", "10");
        const data = await api.get<BrowseResponse>(
          `${CULTURE_API}/directory/browse?${params.toString()}`,
          false
        );
        if (!cancelled) setTrending(data?.entries ?? []);
      } catch {
        if (!cancelled) setTrending([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [type, region]);

  const fetchPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      // Guards against a slower, older request resolving after a newer one
      // and clobbering its result (e.g. a stale debounced search response
      // landing after the user already typed something else).
      const requestId = ++requestIdRef.current;
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (type) params.set("type", type);
        if (region) params.set("region", region);
        // Default browsing (no search, no explicit sort choice) shows a fresh
        // random mix every visit rather than the same "most relevant" order.
        const effectiveSort = sort === "relevant" && !query ? "random" : sort;
        params.set("sort", effectiveSort);
        if (effectiveSort === "random") params.set("seed", String(seedRef.current));
        params.set("page", String(pageNum));
        params.set("per_page", String(PER_PAGE));
        const data = await api.get<BrowseResponse>(
          `${CULTURE_API}/directory/browse?${params.toString()}`,
          false
        );
        if (requestId !== requestIdRef.current) return;
        setEntries((prev) => (replace ? data?.entries ?? [] : [...prev, ...(data?.entries ?? [])]));
        setTotal(data?.total ?? 0);
        setPage(pageNum);
      } catch {
        if (requestId === requestIdRef.current && replace) setEntries([]);
      }
    },
    [query, type, region, sort]
  );

  // Refetch grid whenever filters/sort/search change (debounced for search typing)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      await fetchPage(1, true);
      setLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, type, region, sort, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore || loading || entries.length >= total) return;
    setLoadingMore(true);
    await fetchPage(page + 1, false);
    setLoadingMore(false);
  }, [loadingMore, loading, entries.length, total, page, fetchPage]);

  const openEntry = (entry: DiscoverEntry) => {
    nav.navigate("DirectoryDetail", { slug: entry.slug, title: entry.title, entryType: entry.type });
  };

  const hasActiveRefinement = !!region || sort !== "relevant";

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity
          onPress={() => setSearchOpen((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name={searchOpen ? "close" : "search-outline"} size={22} color={c.ink} />
        </TouchableOpacity>
      </View>

      {searchOpen && (
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={c.mute} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search people, places, books…"
            placeholderTextColor={c.ghost}
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
        </View>
      )}

      {/* Filter chip row — always visible */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
        data={["all", ...Object.keys(TYPE_BADGE)]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          if (item === "all") {
            const active = !type;
            return (
              <TouchableOpacity
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setType(null)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>All</Text>
              </TouchableOpacity>
            );
          }
          const badge = TYPE_BADGE[item];
          const active = type === item;
          return (
            <TouchableOpacity
              style={[styles.chip, active && { backgroundColor: badge.color, borderColor: badge.color }]}
              onPress={() => setType(active ? null : item)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {badge.emoji} {badge.label}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.filterBtn, hasActiveRefinement && styles.filterBtnActive]}
            onPress={() => setFilterSheetOpen(true)}
          >
            <Ionicons name="options-outline" size={14} color={hasActiveRefinement ? "#FFFFFF" : c.ink} />
            <Text style={[styles.filterBtnText, hasActiveRefinement && styles.chipTextActive]}>Filters</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        onEndReachedThreshold={0.4}
        onEndReached={loadMore}
        ListHeaderComponent={
          <View style={styles.railSection}>
            {recent.length > 0 && (
              <>
                <Text style={styles.railHeading}>Recently Added</Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={recent}
                  keyExtractor={(item) => `recent-${item.id}`}
                  contentContainerStyle={styles.railContent}
                  renderItem={({ item }) => (
                    <DiscoverCard entry={item} c={c} compact onPress={openEntry} />
                  )}
                />
              </>
            )}
            {trending.length > 0 && (
              <>
                <Text style={[styles.railHeading, recent.length > 0 && { marginTop: space[4] }]}>
                  Trending in Community
                </Text>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={trending}
                  keyExtractor={(item) => `trending-${item.id}`}
                  contentContainerStyle={styles.railContent}
                  renderItem={({ item }) => (
                    <DiscoverCard entry={item} c={c} compact onPress={openEntry} />
                  )}
                />
              </>
            )}
            <Text style={styles.gridHeading}>Explore More</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.gridItem}>
            <DiscoverCard entry={item} c={c} onPress={openEntry} />
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.ochre} style={{ marginTop: space[6] }} />
          ) : (
            <Text style={styles.emptyText}>No entries match these filters.</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator color={c.ochre} style={{ marginVertical: space[4] }} />
          ) : entries.length > 0 ? (
            <Text style={styles.countText}>
              Showing {entries.length} of {total} {total === 1 ? "entry" : "entries"}
            </Text>
          ) : null
        }
      />

      <DiscoverFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        type={type}
        region={region}
        sort={sort}
        query={query}
        onApply={(filters) => {
          setType(filters.type);
          setRegion(filters.region);
          setSort(filters.sort);
          setFilterSheetOpen(false);
        }}
      />
    </View>
  );
}

const createStyles = (c: ColorPalette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.paper },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: space[4],
      paddingVertical: space[3],
    },
    headerTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm + 2,
      color: c.ink,
    },
    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: space[4],
      marginBottom: space[2],
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.rule,
      backgroundColor: c.paper,
    },
    searchInput: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      padding: 0,
    },
    chipRow: { flexGrow: 0, marginBottom: space[2] },
    chipRowContent: { paddingHorizontal: space[4], gap: 8, alignItems: "center" },
    chip: {
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    chipActive: { backgroundColor: c.ink, borderColor: c.ink },
    chipText: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: c.ink },
    chipTextActive: { color: "#FFFFFF" },
    filterBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    filterBtnActive: { backgroundColor: c.ochre, borderColor: c.ochre },
    filterBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.xs, color: c.ink },
    railSection: { paddingTop: space[1] },
    railHeading: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      paddingHorizontal: space[4],
      marginBottom: space[2],
    },
    railContent: { paddingHorizontal: space[4], gap: 10 },
    gridHeading: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      paddingHorizontal: space[4],
      marginTop: space[4],
      marginBottom: space[2],
    },
    gridContent: { paddingHorizontal: space[4], paddingBottom: space[8] },
    gridRow: { gap: 10 },
    gridItem: { flex: 1, marginBottom: 10 },
    emptyText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      marginTop: space[6],
    },
    countText: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
      textAlign: "center",
      marginVertical: space[4],
    },
  });
