import React, { useMemo } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCategoryArchive } from "../../features/magazine/useMagazine";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { Article } from "../../types";

function timeAgo(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days < 30)    return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

function ArticleCard({ article, onPress, c, styles }: { article: Article; onPress: () => void; c: ColorPalette; styles: any }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {article.featuredImage ? (
        <Image source={{ uri: article.featuredImage }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{article.title}</Text>
        {article.excerpt ? (
          <Text style={styles.cardExcerpt} numberOfLines={2}>{article.excerpt}</Text>
        ) : null}
        <View style={styles.cardMeta}>
          <Text style={styles.cardAuthor}>{article.author?.name ?? "Moveee"}</Text>
          <Text style={styles.cardDot}>·</Text>
          <Text style={styles.cardDate}>{timeAgo(article.publishedAt)}</Text>
          {article.readingTime ? (
            <>
              <Text style={styles.cardDot}>·</Text>
              <Text style={styles.cardDate}>{article.readingTime} min</Text>
            </>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function CategoryArchiveScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { categorySlug, categoryName: passedName } = route.params ?? {};
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const { categoryName, articles, loading, loadingMore, hasMore, error, loadMore } = useCategoryArchive(categorySlug ?? "");

  const displayName = categoryName ?? passedName ?? categorySlug ?? "Category";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: space[3] }}>
          <Text style={styles.headerEyebrow}>Section</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        </View>
      </View>

      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          articles.length > 0 ? (
            <View style={styles.heroCard}>
              {articles[0].featuredImage ? (
                <Image source={{ uri: articles[0].featuredImage }} style={styles.heroImage} resizeMode="cover" />
              ) : (
                <View style={[styles.heroImage, styles.heroImagePlaceholder]} />
              )}
              <View style={styles.heroGradient} />
              <View style={styles.heroContent}>
                <Text style={styles.heroEyebrow}>{displayName.toUpperCase()}</Text>
                <Text style={styles.heroTitle} numberOfLines={2}>{articles[0].title}</Text>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => nav.push("Article", { slug: articles[0].slug })}
                >
                  <Text style={styles.heroBtnText}>Read →</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => {
          if (index === 0) return null; // rendered as hero
          return (
            <ArticleCard
              article={item}
              onPress={() => nav.push("Article", { slug: item.slug })}
              c={c}
              styles={styles}
            />
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.gold} style={{ marginTop: 60 }} />
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : !loading ? (
            <Text style={styles.emptyText}>No articles in this section yet.</Text>
          ) : null
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={c.gold} style={{ padding: 20 }} /> :
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
          ) : articles.length > 1 ? (
            <Text style={styles.endText}>— End of {displayName} —</Text>
          ) : null
        }
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerEyebrow: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink },

    list: { paddingBottom: 60 },

    // Featured hero card (first article)
    heroCard: { height: 280, position: "relative", marginBottom: 8 },
    heroImage: { width: "100%", height: 280 },
    heroImagePlaceholder: { backgroundColor: c.paperDeep },
    heroGradient: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10,8,5,0.55)",
    },
    heroContent: { position: "absolute", bottom: 0, left: 0, right: 0, padding: space[4] },
    heroEyebrow: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: "#E8C97A", letterSpacing: 1.5, marginBottom: 6 },
    heroTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: "#FFFFFF", lineHeight: 28, marginBottom: 12 },
    heroBtn: {
      height: 34, paddingHorizontal: 16, borderRadius: radius.full,
      borderWidth: 1, borderColor: "rgba(255,255,255,0.5)",
      backgroundColor: "rgba(255,255,255,0.1)",
      alignSelf: "flex-start", alignItems: "center", justifyContent: "center",
    },
    heroBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#FFFFFF" },

    // Article list rows (2nd article onwards)
    card: {
      flexDirection: "row", gap: 12, paddingHorizontal: space[4], paddingVertical: space[3],
      backgroundColor: c.paper,
    },
    cardImage: { width: 80, height: 80, borderRadius: radius.lg, flexShrink: 0 },
    cardImagePlaceholder: { backgroundColor: c.paperDeep },
    cardBody: { flex: 1 },
    cardTitle: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink, lineHeight: 21, marginBottom: 4 },
    cardExcerpt: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, lineHeight: 18, marginBottom: 6 },
    cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardAuthor: { fontFamily: fonts.sansBold, fontSize: fontSize.tiny, color: c.inkSoft },
    cardDot: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
    cardDate: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },

    separator: { height: 1, backgroundColor: c.rule, marginLeft: space[4] },

    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", padding: space[8] },
    endText: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: c.ghost, textAlign: "center", padding: space[6] },

    loadMoreBtn: {
      margin: space[4], paddingVertical: space[3],
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      alignItems: "center",
    },
    loadMoreText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.inkSoft },
  });
}
