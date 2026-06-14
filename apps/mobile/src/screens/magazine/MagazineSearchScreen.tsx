import React, { useMemo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api, WP_URL } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { decodeEntities, stripTags } from "../../features/magazine/useMagazine";
import type { Article } from "../../types";

const CATEGORIES = ["All", "Fashion", "Music", "Film", "Food", "Interview", "Visuals", "Ideas"];
const WP_POSTS = `${WP_URL}/wp-json/wp/v2/posts`;

// ── Search result card ────────────────────────────────────────────────────────
function SearchResultCard({
  article,
  onPress,
  styles,
  c,
}: {
  article: Article;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  return (
    <TouchableOpacity style={styles.resultCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.resultImageWrap}>
        {article.featuredImage ? (
          <Image source={{ uri: article.featuredImage }} style={styles.resultImage} resizeMode="cover" />
        ) : (
          <View style={[styles.resultImage, styles.resultImagePlaceholder]} />
        )}
        {(article as any).isProOnly ? (
          <View style={styles.proOnlyBadge}>
            <Text style={styles.proOnlyBadgeText}>PRO ONLY</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.resultBody}>
        {article.category ? (
          <Text style={styles.resultCategory}>
            {article.category.toUpperCase()}
          </Text>
        ) : null}
        <Text style={styles.resultTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.resultMeta}>
          {article.author?.name ?? ""} · {article.readingTime ?? "?"} min
        </Text>
        {(article as any).seriesLabel ? (
          <View style={styles.seriesTagWrap}>
            <Text style={styles.seriesTag}>{(article as any).seriesLabel}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Category strip (shared pill style) ───────────────────────────────────────
function CategoryStrip({
  active,
  onSelect,
  styles,
}: {
  active: string;
  onSelect: (cat: string) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.catStrip}
      style={styles.catStripWrap}
    >
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        return (
          <TouchableOpacity
            key={cat}
            style={[styles.catPill, isActive ? styles.catPillActive : styles.catPillInactive]}
            onPress={() => onSelect(cat)}
            activeOpacity={0.75}
          >
            <Text style={[styles.catPillText, isActive ? styles.catPillTextActive : styles.catPillTextInactive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Related series row ────────────────────────────────────────────────────────
const RELATED_SERIES = [
  { id: "1", name: "Culture Economy", count: 5 },
  { id: "2", name: "Sound & City", count: 4 },
  { id: "3", name: "The Maker Files", count: 6 },
  { id: "4", name: "Visuals from the Continent", count: 8 },
];

function RelatedSeriesSection({ styles, c }: { styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  return (
    <View style={styles.relatedSection}>
      <Text style={styles.relatedHeading}>Related series</Text>
      {RELATED_SERIES.map((s) => (
        <TouchableOpacity key={s.id} style={styles.seriesRow} activeOpacity={0.8}>
          <Text style={styles.seriesRowName}>{s.name}</Text>
          <Text style={styles.seriesRowCount}>{s.count} articles →</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MagazineSearchScreen() {
  const nav = useNavigation<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const doSearch = useCallback(async (text: string, category: string) => {
    if (!text.trim() && category === "All") {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      let url = `${WP_POSTS}?_embed=wp:featuredmedia,wp:term,author&per_page=20`;
      if (text.trim()) url += `&search=${encodeURIComponent(text.trim())}`;
      if (category !== "All") url += `&search=${encodeURIComponent(text + " " + category)}`;
      const data = await api.get<any[]>(url, false);
      const mapped: Article[] = data.map((post: any) => {
        const embedded = post._embedded;
        const media = embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? "";
        const terms = embedded?.["wp:term"] ?? [];
        const cat = terms.flat().find((t: any) => t.taxonomy === "category")?.name ?? "";
        const author = embedded?.author?.[0];
        return {
          id: String(post.id),
          slug: post.slug,
          title: decodeEntities(post.title.rendered),
          excerpt: stripTags(post.excerpt.rendered),
          content: post.content.rendered,
          featuredImage: media,
          author: {
            name: author?.name ?? "Moveee",
            avatarUrl: author?.avatar_urls?.["96"] ?? "",
            slug: author?.slug ?? "",
          },
          category: cat,
          publishedAt: post.date,
          readingTime: Math.max(1, Math.round(stripTags(post.content.rendered).split(/\s+/).length / 200)),
          liked: false,
          bookmarked: false,
          likeCount: 0,
        } as Article;
      });
      setResults(mapped);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback(
    (text: string) => {
      setQuery(text);
      doSearch(text, activeCategory);
    },
    [activeCategory, doSearch]
  );

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setActiveCategory(cat);
      doSearch(query, cat);
    },
    [query, doSearch]
  );

  const clearQuery = () => {
    setQuery("");
    setResults([]);
    inputRef.current?.focus();
  };

  const openArticle = (article: Article) => {
    nav.navigate("Article", { slug: article.slug, article });
  };

  const categoryLabel = activeCategory === "All" ? "all categories" : activeCategory;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => nav.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Magazine</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <View style={styles.searchLeft}>
            {/* Search icon */}
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="Search articles…"
              placeholderTextColor={c.ghost}
              autoFocus
              returnKeyType="search"
            />
          </View>
          {query.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={clearQuery} activeOpacity={0.7}>
              <Text style={styles.clearIcon}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category strip */}
        <CategoryStrip active={activeCategory} onSelect={handleCategoryChange} styles={styles} />
      </View>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {(query.trim() || activeCategory !== "All") && !loading ? (
              <View style={styles.resultsLabel}>
                <Text style={styles.resultsCount}>
                  {results.length} result{results.length !== 1 ? "s" : ""} in {categoryLabel}
                </Text>
                <TouchableOpacity>
                  <Text style={styles.sortBtn}>Latest ▾</Text>
                </TouchableOpacity>
              </View>
            ) : loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={c.gold} />
              </View>
            ) : null}
          </>
        }
        ListFooterComponent={results.length > 0 ? <RelatedSeriesSection styles={styles} c={c} /> : null}
        renderItem={({ item }) => (
          <SearchResultCard article={item} onPress={() => openArticle(item)} styles={styles} c={c} />
        )}
        ListEmptyComponent={
          !loading && query.trim() ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No results found</Text>
            </View>
          ) : !query.trim() && activeCategory === "All" ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Type to search articles…</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    // Header block
    headerWrap: {
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: space[4],
      height: 56,
    },
    backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
    backIcon: { fontSize: 28, color: c.ink, lineHeight: 32 },
    headerTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 18,
      color: c.ink,
      flex: 1,
      textAlign: "center",
    },

    // Search bar
    searchBar: {
      marginHorizontal: space[4],
      height: 44,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.ghost,
      backgroundColor: c.paper,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      justifyContent: "space-between",
      marginBottom: 12,
    },
    searchLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 8 },
    searchIcon: { fontSize: 18, color: c.ghost },
    searchInput: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.ink,
      flex: 1,
      paddingVertical: 0,
    },
    clearBtn: {
      width: 20,
      height: 20,
      borderRadius: radius.full,
      backgroundColor: c.paperDeep,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 8,
    },
    clearIcon: { fontSize: 10, color: c.ghost },

    // Category strip
    catStripWrap: {
      borderBottomWidth: 0,
      maxHeight: 48,
    },
    catStrip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      paddingVertical: 8,
      gap: 8,
    },
    catPill: {
      height: 28,
      paddingHorizontal: 12,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    catPillActive: { backgroundColor: c.ochre },
    catPillInactive: {
      backgroundColor: c.paper,
      borderWidth: 1,
      borderColor: c.ghost,
    },
    catPillText: { fontSize: 12 },
    catPillTextActive: { fontFamily: fonts.sansBold ?? fonts.sans, color: "#FFFFFF" },
    catPillTextInactive: { fontFamily: fonts.sans, color: c.inkSoft },

    // Results list
    listContent: { paddingBottom: 60 },
    resultsLabel: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: space[4],
      paddingTop: space[4],
      paddingBottom: 4,
    },
    resultsCount: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    sortBtn: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    loadingRow: { paddingTop: space[8], alignItems: "center" },

    // Search result card
    resultCard: {
      marginHorizontal: space[4],
      marginTop: 12,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      flexDirection: "row",
      alignItems: "center",
      padding: space[4],
      gap: 12,
      ...shadows.card,
    },
    resultImageWrap: { position: "relative", flexShrink: 0 },
    resultImage: { width: 80, height: 80, borderRadius: radius.md, backgroundColor: c.paperDeep },
    resultImagePlaceholder: { backgroundColor: c.paperDeep },
    proOnlyBadge: {
      position: "absolute",
      top: -6,
      right: -6,
      backgroundColor: c.gold,
      borderRadius: radius.full,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    proOnlyBadgeText: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: 8,
      color: "#FFFFFF",
      textTransform: "uppercase",
    },
    resultBody: { flex: 1, flexDirection: "column" },
    resultCategory: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: fontSize.eyebrow,
      color: c.ochre,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    resultTitle: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: 14,
      color: c.ink,
      lineHeight: 19,
    },
    resultMeta: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
      marginTop: 4,
    },
    seriesTagWrap: { marginTop: 4 },
    seriesTag: {
      fontFamily: fonts.sans,
      fontSize: fontSize.eyebrow,
      color: c.inkSoft,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: "flex-start",
    },

    // Empty state
    emptyState: { paddingTop: space[10], alignItems: "center" },
    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },

    // Related series
    relatedSection: { paddingHorizontal: space[4], paddingTop: space[5], paddingBottom: space[5] },
    relatedHeading: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: 13,
      color: c.ink,
      marginBottom: 8,
    },
    seriesRow: {
      height: 44,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.ruleDark,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
    },
    seriesRowName: { fontFamily: fonts.sansBold ?? fonts.sans, fontSize: 13, color: c.ink },
    seriesRowCount: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
  });
}
