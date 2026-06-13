import React from "react";
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMagazine, type MagazineSection } from "../../features/magazine/useMagazine";
import type { Article } from "../../types";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";

// ── Article card (horizontal scroll) ─────────────────────────────────────────
function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  const initials = (article.author?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

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
        <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaTime}>{article.readingTime ?? "?"} min</Text>
          <Text style={styles.cardMetaDot}>•</Text>
          <Text style={styles.cardMetaAuthor} numberOfLines={1}>{article.author?.name ?? ""}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Section row ───────────────────────────────────────────────────────────────
function SectionRow({
  section,
  onPressArticle,
}: {
  section: MagazineSection;
  onPressArticle: (a: Article) => void;
}) {
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
          <ArticleCard article={item} onPress={() => onPressArticle(item)} />
        )}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MagazineScreen() {
  const nav = useNavigation<any>();
  const { featured, sections, loading, error, refresh } = useMagazine();

  const openArticle = (article: Article) => {
    nav.navigate("Article", { slug: article.slug, article });
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
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  const heroInitials = (featured?.author?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Magazine</Text>
        <TouchableOpacity style={styles.searchBtn}>
          <Text style={styles.searchIcon}>⌕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Featured Hero */}
        {featured ? (
          <TouchableOpacity style={styles.hero} onPress={() => openArticle(featured)} activeOpacity={0.92}>
            {featured.featuredImage ? (
              <Image source={{ uri: featured.featuredImage }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.heroPlaceholder]} />
            )}
            {/* Gradient overlay */}
            <View style={styles.heroOverlay}>
              {featured.category ? (
                <Text style={styles.heroCategory}>{featured.category.toUpperCase()}</Text>
              ) : null}
              <Text style={styles.heroTitle} numberOfLines={3}>{featured.title}</Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>{featured.readingTime ?? "?"} min read</Text>
                <Text style={styles.heroMetaDot}>·</Text>
                <Text style={styles.heroMetaText}>By {featured.author?.name ?? ""}</Text>
                {featured.author?.avatarUrl ? (
                  <Image
                    source={{ uri: featured.author.avatarUrl }}
                    style={styles.heroAvatar}
                  />
                ) : (
                  <View style={styles.heroAvatarPlaceholder}>
                    <Text style={styles.heroAvatarInitials}>{heroInitials}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Sections */}
        {sections.map((section) => (
          <SectionRow key={section.id} section={section} onPressArticle={openArticle} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.paperWarm },
  center:     { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8], gap: space[2] },
  errorText:  { fontFamily: fonts.sans, color: colors.ochre, textAlign: "center" },
  retryText:  { fontFamily: fonts.sansBold, color: colors.gold },

  // Header
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.paper,
    paddingHorizontal: space[4], paddingBottom: space[2], paddingTop: space[2],
    borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)",
  },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  searchBtn:   { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
  searchIcon:  { fontSize: 20, color: colors.ink },

  // Hero
  hero:    { width: "100%", height: 260, position: "relative" },
  heroImage: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.paperDeep },
  heroPlaceholder: { backgroundColor: colors.paperDeep },
  heroOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: "40%",
    backgroundColor: "rgba(20,17,13,0.70)",
    paddingHorizontal: space[4], paddingBottom: space[3],
    justifyContent: "flex-end",
  },
  heroCategory: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.ochre, letterSpacing: 1.5, textTransform: "uppercase",
    marginBottom: 8,
  },
  heroTitle: {
    fontFamily: fonts.serifBold, fontSize: 24, color: colors.paper,
    lineHeight: 30, maxWidth: "90%",
  },
  heroMeta: { flexDirection: "row", alignItems: "center", gap: space[2], marginTop: space[1] },
  heroMetaText: { fontFamily: fonts.sans, fontSize: 12, color: "rgba(255,255,255,0.8)" },
  heroMetaDot:  { color: "rgba(255,255,255,0.4)", fontSize: 10 },
  heroAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: 2 },
  heroAvatarPlaceholder: {
    width: 24, height: 24, borderRadius: 12, marginLeft: 2,
    backgroundColor: colors.ochre, alignItems: "center", justifyContent: "center",
  },
  heroAvatarInitials: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.paper },

  // Sections
  section:       { marginTop: space[5] },
  sectionHeader: {
    flexDirection: "row", alignItems: "baseline", justifyContent: "space-between",
    paddingHorizontal: space[4], marginBottom: space[3],
  },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  seeAll:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ochre },
  sectionRow:   { paddingHorizontal: space[4], gap: 12, paddingBottom: space[3] },

  // Article card
  card: {
    width: 200, height: 240,
    backgroundColor: colors.paper, borderRadius: radius.xl, overflow: "hidden",
    ...shadows.card,
  },
  cardImageWrap: { position: "relative", height: 110, width: "100%" },
  cardImage:     { width: "100%", height: 110 },
  cardImagePlaceholder: { backgroundColor: colors.paperDeep },
  cardCatBadge: {
    position: "absolute", bottom: 8, left: 8,
    backgroundColor: colors.paper, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
  },
  cardCatBadgeText: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.ink, letterSpacing: 1, textTransform: "uppercase",
  },
  cardBody: {
    padding: 12, flex: 1, justifyContent: "space-between",
  },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink, lineHeight: 18 },
  cardMeta:  { flexDirection: "row", alignItems: "center", gap: space[2], marginTop: "auto" },
  cardMetaTime:   { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: colors.mute },
  cardMetaDot:    { color: colors.ghost, fontSize: fontSize.tiny },
  cardMetaAuthor: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, flex: 1 },
});
