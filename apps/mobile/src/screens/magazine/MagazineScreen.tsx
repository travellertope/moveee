import React, { useMemo } from "react";
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
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

// ── Article card (horizontal scroll) ─────────────────────────────────────────
function ArticleCard({ article, onPress, styles }: { article: Article; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
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
  styles,
}: {
  section: MagazineSection;
  onPressArticle: (a: Article) => void;
  styles: ReturnType<typeof createStyles>;
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
          <ArticleCard article={item} onPress={() => onPressArticle(item)} styles={styles} />
        )}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MagazineScreen() {
  const nav = useNavigation<any>();
  const { featured, sections, loading, error, refresh } = useMagazine();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

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
          <ActivityIndicator color={c.gold} />
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
          <SectionRow key={section.id} section={section} onPressArticle={openArticle} styles={styles} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container:  { flex: 1, backgroundColor: c.paperWarm },
    center:     { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8], gap: space[2] },
    errorText:  { fontFamily: fonts.sans, color: c.ochre, textAlign: "center" },
    retryText:  { fontFamily: fonts.sansBold, color: c.gold },

    // Header
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper,
      paddingHorizontal: space[4], paddingBottom: space[2], paddingTop: space[2],
      borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)",
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink },
    searchBtn:   { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
    searchIcon:  { fontSize: 20, color: c.ink },

    // Hero
    hero:    { width: "100%", height: 260, position: "relative" },
    heroImage: { ...StyleSheet.absoluteFillObject, backgroundColor: c.paperDeep },
    heroPlaceholder: { backgroundColor: c.paperDeep },
    heroOverlay: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: "40%",
      backgroundColor: "rgba(20,17,13,0.70)",
      paddingHorizontal: space[4], paddingBottom: space[3],
      justifyContent: "flex-end",
    },
    heroCategory: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.ochre, letterSpacing: 1.5, textTransform: "uppercase",
      marginBottom: 8,
    },
    heroTitle: {
      fontFamily: fonts.serifBold, fontSize: 24, color: c.paper,
      lineHeight: 30, maxWidth: "90%",
    },
    heroMeta: { flexDirection: "row", alignItems: "center", gap: space[2], marginTop: space[1] },
    heroMetaText: { fontFamily: fonts.sans, fontSize: 12, color: "rgba(255,255,255,0.8)" },
    heroMetaDot:  { color: "rgba(255,255,255,0.4)", fontSize: 10 },
    heroAvatar: { width: 24, height: 24, borderRadius: 12, marginLeft: 2 },
    heroAvatarPlaceholder: {
      width: 24, height: 24, borderRadius: 12, marginLeft: 2,
      backgroundColor: c.ochre, alignItems: "center", justifyContent: "center",
    },
    heroAvatarInitials: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper },

    // Sections
    section:       { marginTop: space[5] },
    sectionHeader: {
      flexDirection: "row", alignItems: "baseline", justifyContent: "space-between",
      paddingHorizontal: space[4], marginBottom: space[3],
    },
    sectionTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    seeAll:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre },
    sectionRow:   { paddingHorizontal: space[4], gap: 12, paddingBottom: space[3] },

    // Article card
    card: {
      width: 200, height: 240,
      backgroundColor: c.paper, borderRadius: radius.xl, overflow: "hidden",
      ...shadows.card,
    },
    cardImageWrap: { position: "relative", height: 110, width: "100%" },
    cardImage:     { width: "100%", height: 110 },
    cardImagePlaceholder: { backgroundColor: c.paperDeep },
    cardCatBadge: {
      position: "absolute", bottom: 8, left: 8,
      backgroundColor: c.paper, borderRadius: radius.full,
      paddingHorizontal: 8, paddingVertical: 4,
      shadowColor: c.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
    },
    cardCatBadgeText: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.ink, letterSpacing: 1, textTransform: "uppercase",
    },
    cardBody: {
      padding: 12, flex: 1, justifyContent: "space-between",
    },
    cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    cardMeta:  { flexDirection: "row", alignItems: "center", gap: space[2], marginTop: "auto" },
    cardMetaTime:   { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.mute },
    cardMetaDot:    { color: c.ghost, fontSize: fontSize.tiny },
    cardMetaAuthor: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, flex: 1 },
  });
}
