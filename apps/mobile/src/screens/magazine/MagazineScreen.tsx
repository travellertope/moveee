import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { useMagazine, type MagazineSection } from "../../features/magazine/useMagazine";
import { useNewsletters, type NewsletterSummary } from "../../features/magazine/useNewsletters";
import type { Article } from "../../types";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const CATEGORIES = ["All", "Fashion", "Music", "Film", "Food", "Interview", "Visuals", "Ideas"];

// ── Category filter strip ─────────────────────────────────────────────────────
function CategoryStrip({
  active,
  onSelect,
  styles,
  c,
}: {
  active: string;
  onSelect: (cat: string) => void;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
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

// ── Article card (horizontal scroll) ─────────────────────────────────────────
function ArticleCard({
  article,
  onPress,
  styles,
}: {
  article: Article;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.cardImageWrap}>
        {article.featuredImage ? (
          <Image source={{ uri: article.featuredImage }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        )}
        {article.category ? (
          <View style={styles.cardCatBadge}>
            <Text style={styles.cardCatBadgeText}>{article.category.toUpperCase()}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {article.title}
        </Text>
        {article.excerpt ? (
          <Text style={styles.cardExcerpt} numberOfLines={2}>
            {article.excerpt}
          </Text>
        ) : null}
        <Text style={styles.cardMeta} numberOfLines={1}>
          {article.author?.name ?? ""} · {article.readingTime ?? "?"} min
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Visuals card (full-width vertical list) ───────────────────────────────────
function VisualCard({
  article,
  onPress,
  styles,
}: {
  article: Article;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity style={styles.visualCard} onPress={onPress} activeOpacity={0.88}>
      {article.featuredImage ? (
        <Image source={{ uri: article.featuredImage }} style={styles.visualCardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.visualCardImage, styles.cardImagePlaceholder]} />
      )}
      <View style={styles.visualCardBody}>
        {article.category ? (
          <View style={styles.cardCatBadgeInline}>
            <Text style={styles.cardCatBadgeText}>{article.category.toUpperCase()}</Text>
          </View>
        ) : null}
        <Text style={styles.visualCardTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={styles.cardMeta}>
          {article.author?.name ?? ""} · {article.readingTime ?? "?"} min
        </Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Section row ───────────────────────────────────────────────────────────────
function SectionRow({
  section,
  onPressArticle,
  onPressSeeAll,
  styles,
}: {
  section: MagazineSection;
  onPressArticle: (a: Article) => void;
  onPressSeeAll: (section: MagazineSection) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const isVisuals =
    section.name.toLowerCase().includes("visual") ||
    section.name.toLowerCase().includes("photo");

  if (isVisuals) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.name}</Text>
          <TouchableOpacity onPress={() => onPressSeeAll(section)}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.visualsList}>
          {section.articles.map((article) => (
            <VisualCard
              key={article.id}
              article={article}
              onPress={() => onPressArticle(article)}
              styles={styles}
            />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.name}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={section.articles}
        keyExtractor={(a) => a.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionRow}
        renderItem={({ item }) => (
          <ArticleCard article={item} onPress={() => onPressArticle(item)} styles={styles} />
        )}
      />
    </View>
  );
}

// ── Latest Issue Card ─────────────────────────────────────────────────────────
function LatestIssueCard({
  styles,
  onExplore,
}: {
  styles: ReturnType<typeof createStyles>;
  onExplore: () => void;
}) {
  return (
    <View style={styles.issueCard}>
      <View style={styles.issueCover} />
      <View style={styles.issueBody}>
        <Text style={styles.issueLabel}>LATEST ISSUE</Text>
        <Text style={styles.issueTitle}>Issue #7: The Maker Edition</Text>
        <Text style={styles.issueMeta}>9 articles · June 2026</Text>
        <TouchableOpacity onPress={onExplore}>
          <Text style={styles.issueLink}>Explore this issue →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Series Card ───────────────────────────────────────────────────────────────
interface SeriesItem {
  id: string;
  name: string;
  articleCount: number;
}

const PLACEHOLDER_SERIES: SeriesItem[] = [
  { id: "1", name: "Culture Economy", articleCount: 5 },
  { id: "2", name: "Visuals from the Continent", articleCount: 8 },
  { id: "3", name: "The Maker Files", articleCount: 6 },
  { id: "4", name: "Sound & City", articleCount: 4 },
];

// ── Newsletter section ────────────────────────────────────────────────────────
function NewsletterSection({
  newsletters,
  styles,
  c,
  onPress,
}: {
  newsletters: NewsletterSummary[];
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
  onPress: (nl: NewsletterSummary) => void;
}) {
  if (newsletters.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Newsletters</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Browse all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.sectionRow, { paddingBottom: 4 }]}
      >
        {newsletters.map((nl) => (
          <TouchableOpacity
            key={nl.id}
            style={styles.nlCard}
            onPress={() => onPress(nl)}
            activeOpacity={0.85}
          >
            {/* Colour header strip */}
            <View style={[styles.nlStrip, { backgroundColor: nl.color }]}>
              <Text style={styles.nlStripLabel}>{nl.name.toUpperCase()}</Text>
            </View>
            <View style={styles.nlBody}>
              {nl.latestIssue ? (
                <>
                  <Text style={styles.nlIssueLabel}>LATEST</Text>
                  <Text style={styles.nlTitle} numberOfLines={2}>{nl.latestIssue.title}</Text>
                  <Text style={styles.nlExcerpt} numberOfLines={2}>{nl.latestIssue.excerpt}</Text>
                </>
              ) : (
                <Text style={styles.nlDesc} numberOfLines={3}>{nl.description}</Text>
              )}
              <Text style={styles.nlCta}>Read →</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Series strip ──────────────────────────────────────────────────────────────
function SeriesStrip({ styles }: { styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Series</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>Browse all →</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={PLACEHOLDER_SERIES}
        keyExtractor={(s) => s.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionRow}
        renderItem={({ item }) => (
          <View style={styles.seriesCard}>
            <Text style={styles.seriesTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.seriesMeta}>{item.articleCount} articles</Text>
          </View>
        )}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MagazineScreen() {
  const nav = useNav();
  const { featured, sections, loading, error, refresh } = useMagazine();
  const { newsletters } = useNewsletters();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [activeCategory, setActiveCategory] = useState("All");

  const openArticle = (article: Article) => {
    nav.navigate("Article", { slug: article.slug, article });
  };

  const openSearch = () => {
    nav.navigate("MagazineSearch");
  };

  const openIssues = () => {
    nav.navigate("IssuesArchive");
  };

  const openNewsletter = (nl: NewsletterSummary) => {
    nav.navigate("IssuesArchive", { nlList: nl.id, nlName: nl.name } as any);
  };

  if (error && !featured && sections.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!featured && loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={c.gold} />
        </View>
      </SafeAreaView>
    );
  }

  // Filter sections if a category other than "All" is selected
  const filteredSections =
    activeCategory === "All"
      ? sections
      : sections.filter((s) =>
          s.name.toLowerCase().includes(activeCategory.toLowerCase()) ||
          s.articles.some((a) => a.category?.toLowerCase() === activeCategory.toLowerCase())
        );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Magazine</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => nav.navigate("MagazineSearch")}>
            <Ionicons name="search-outline" size={26} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerBtn} onPress={() => nav.navigate("Connect", { screen: "SavedArticles" } as any)}>
            <Ionicons name="bookmark-outline" size={26} color={c.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category filter strip — sticky */}
      <CategoryStrip active={activeCategory} onSelect={setActiveCategory} styles={styles} c={c} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Featured Hero */}
        {featured ? (
          <TouchableOpacity style={styles.hero} onPress={() => openArticle(featured)} activeOpacity={0.92}>
            {featured.featuredImage ? (
              <Image source={{ uri: featured.featuredImage }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, styles.heroPlaceholder]} />
            )}

            {/* PRO badge top-right */}
            {(featured as any).isProOnly ? (
              <View style={styles.proBadge}>
                <Text style={styles.proBadgeText}>★ PRO EARLY ACCESS</Text>
              </View>
            ) : null}

            {/* Bottom gradient overlay */}
            <View style={styles.heroOverlay}>
              {featured.category ? (
                <Text style={styles.heroCategory}>{featured.category.toUpperCase()}</Text>
              ) : null}
              <Text style={styles.heroTitle} numberOfLines={2}>
                {featured.title}
              </Text>
              <Text style={styles.heroMeta}>
                By {featured.author?.name ?? ""} · {featured.readingTime ?? "?"} min read
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Dynamic sections from useMagazine */}
        {filteredSections.map((section) => (
          <SectionRow
            key={section.id}
            section={section}
            onPressArticle={openArticle}
            onPressSeeAll={(s) => nav.navigate("CategoryArchive", {
              categorySlug: s.name.toLowerCase().replace(/\s+/g, "-"),
              categoryName: s.name,
            })}
            styles={styles}
          />
        ))}

        {/* Latest Issue card */}
        <View style={styles.issueSection}>
          <LatestIssueCard styles={styles} onExplore={openIssues} />
        </View>

        {/* Newsletters */}
        <NewsletterSection
          newsletters={newsletters}
          styles={styles}
          c={c}
          onPress={openNewsletter}
        />

        {/* Series */}
        <SeriesStrip styles={styles} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: space[8],
      gap: space[2],
    },
    errorText: { fontFamily: fonts.sans, color: c.ochre, textAlign: "center" },
    retryText: { fontFamily: fonts.sansBold ?? fonts.sans, color: c.gold },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.paper,
      paddingHorizontal: space[4],
      height: 56,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink },
    headerActions: { flexDirection: "row", alignItems: "center", gap: space[4] },
    headerBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
    // Category strip
    catStripWrap: {
      backgroundColor: c.paperWarm,
      borderBottomWidth: 1,
      borderBottomColor: c.ruleDark,
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

    // Hero
    hero: { width: "100%", height: 260, position: "relative", overflow: "hidden" },
    heroPlaceholder: { backgroundColor: c.paperDeep },
    proBadge: {
      position: "absolute",
      top: 12,
      right: 16,
      backgroundColor: c.gold,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      zIndex: 10,
      ...shadows.card,
    },
    proBadgeText: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: fontSize.eyebrow,
      color: "#FFFFFF",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    heroOverlay: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "50%",
      backgroundColor: "rgba(20,17,13,0.72)",
      paddingHorizontal: space[4],
      paddingBottom: space[4],
      justifyContent: "flex-end",
    },
    heroCategory: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: fontSize.eyebrow,
      color: c.ochre,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    heroTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 24,
      color: "#FFFFFF",
      lineHeight: 30,
    },
    heroMeta: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: "rgba(255,255,255,0.72)",
      marginTop: 6,
    },

    // Sections
    section: { marginTop: space[5] },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      paddingHorizontal: space[4],
      marginBottom: space[3],
    },
    sectionTitle: { fontFamily: fonts.sansBold ?? fonts.sans, fontSize: fontSize.base, color: c.ink },
    seeAll: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre },
    sectionRow: { paddingHorizontal: space[4], gap: 12, paddingBottom: space[3] },

    // Article card
    card: {
      width: 200,
      height: 250,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      ...shadows.card,
    },
    cardImageWrap: { position: "relative", height: 120, width: "100%" },
    cardImage: { width: "100%", height: 120 },
    cardImagePlaceholder: { backgroundColor: c.paperDeep },
    cardCatBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      backgroundColor: "#FFF0EB",
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      ...shadows.card,
    },
    cardCatBadgeInline: {
      backgroundColor: "#FFF0EB",
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start",
      marginBottom: 8,
    },
    cardCatBadgeText: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: fontSize.eyebrow,
      color: c.ochre,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    cardBody: { padding: 12 },
    cardTitle: { fontFamily: fonts.sansBold ?? fonts.sans, fontSize: 14, color: c.ink, lineHeight: 18, marginBottom: 4 },
    cardExcerpt: { fontFamily: fonts.sans, fontSize: 12, color: c.mute ?? c.ghost, lineHeight: 16, marginBottom: 6 },
    cardMeta: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },

    // Visuals (vertical list)
    visualsList: { paddingHorizontal: space[4], gap: 12 },
    visualCard: {
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      width: "100%",
      ...shadows.card,
    },
    visualCardImage: { width: "100%", height: 200, backgroundColor: c.paperDeep },
    visualCardBody: { padding: space[4], flexDirection: "column", alignItems: "flex-start" },
    visualCardTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 16,
      color: c.ink,
      lineHeight: 22,
      marginBottom: 6,
    },

    // Latest issue card
    issueSection: { marginTop: space[5], paddingHorizontal: space[4] },
    issueCard: {
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      flexDirection: "row",
      alignItems: "center",
      padding: space[4],
      ...shadows.card,
    },
    issueCover: {
      width: 80,
      height: 100,
      borderRadius: radius.md,
      backgroundColor: c.ochre,
      flexShrink: 0,
    },
    issueBody: { flex: 1, marginLeft: 12 },
    issueLabel: {
      fontFamily: fonts.mono,
      fontSize: fontSize.eyebrow,
      color: c.ochre,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    issueTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 18,
      color: c.ink,
      marginTop: 4,
      lineHeight: 22,
    },
    issueMeta: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, marginTop: 4 },
    issueLink: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ochre,
      marginTop: 8,
    },

    // Series card
    seriesCard: {
      width: 160,
      height: 80,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      padding: 12,
      justifyContent: "center",
      ...shadows.card,
    },
    seriesTitle: {
      fontFamily: fonts.sansBold ?? fonts.sans,
      fontSize: 13,
      color: c.ink,
      lineHeight: 18,
    },
    seriesMeta: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost, marginTop: 4 },

    // Newsletter cards
    nlCard: {
      width: 200,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      ...shadows.card,
    },
    nlStrip: {
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    nlStripLabel: {
      fontFamily: fonts.monoBold ?? fonts.mono,
      fontSize: fontSize.eyebrow,
      color: "#FFFFFF",
      letterSpacing: 1.5,
    },
    nlBody: { padding: 12, gap: 4 },
    nlIssueLabel: {
      fontFamily: fonts.mono,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    nlTitle: { fontFamily: fonts.serifBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    nlExcerpt: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, lineHeight: 18 },
    nlDesc: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, lineHeight: 18 },
    nlCta: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre, marginTop: 4 },
  });
}
