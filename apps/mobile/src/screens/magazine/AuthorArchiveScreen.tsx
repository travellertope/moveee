import React, { useMemo } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthorArchive } from "../../features/magazine/useMagazine";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
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

function ArticleRow({ article, onPress, c, styles }: { article: Article; onPress: () => void; c: ColorPalette; styles: any }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.rowContent}>
        {article.category ? (
          <Text style={styles.rowCategory}>{article.category.toUpperCase()}</Text>
        ) : null}
        <Text style={styles.rowTitle} numberOfLines={2}>{article.title}</Text>
        <View style={styles.rowMeta}>
          {article.readingTime ? (
            <Text style={styles.rowMetaText}>{article.readingTime} min read</Text>
          ) : null}
          <Text style={styles.rowMetaDot}>·</Text>
          <Text style={styles.rowMetaText}>{timeAgo(article.publishedAt)}</Text>
        </View>
      </View>
      {article.featuredImage ? (
        <Image source={{ uri: article.featuredImage }} style={styles.rowThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.rowThumb, styles.rowThumbPlaceholder]} />
      )}
    </TouchableOpacity>
  );
}

export default function AuthorArchiveScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { authorSlug, authorName: passedName, authorAvatar } = route.params ?? {};
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const { author, articles, loading, loadingMore, hasMore, error, loadMore } = useAuthorArchive(authorSlug ?? "");

  const displayName = author?.name ?? passedName ?? authorSlug ?? "Author";
  const displayAvatar = author?.avatar_urls?.["96"] ?? authorAvatar ?? null;
  const bio = author?.description ?? null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Writer</Text>
        <View style={{ width: 22 }} />
      </View>

      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        ListHeaderComponent={
          <View style={styles.authorHero}>
            {displayAvatar ? (
              <Image source={{ uri: displayAvatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={styles.avatarInitials}>
                  {displayName.split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.authorName}>{displayName}</Text>
            {bio ? <Text style={styles.authorBio} numberOfLines={4}>{bio}</Text> : null}
            <View style={styles.divider} />
            <Text style={styles.sectionLabel}>
              {loading ? "Loading…" : `${articles.length}${hasMore ? "+" : ""} article${articles.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <ArticleRow
            article={item}
            onPress={() => nav.push("Article", { slug: item.slug })}
            c={c}
            styles={styles}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
          ) : error ? (
            <Text style={styles.emptyText}>{error}</Text>
          ) : (
            <Text style={styles.emptyText}>No articles found.</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator color={c.gold} style={{ padding: 20 }} /> :
          hasMore ? (
            <TouchableOpacity style={styles.loadMoreBtn} onPress={loadMore}>
              <Text style={styles.loadMoreText}>Load more</Text>
            </TouchableOpacity>
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
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },

    list: { paddingBottom: 60 },

    authorHero: { alignItems: "center", paddingTop: space[8], paddingHorizontal: space[6], paddingBottom: space[4] },
    avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: space[3], borderWidth: 2, borderColor: c.gold },
    avatarPlaceholder: { backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center" },
    avatarInitials: { fontFamily: fonts.serifBold, fontSize: 28, color: c.mute },
    authorName: { fontFamily: fonts.serifBold, fontSize: 24, color: c.ink, textAlign: "center", marginBottom: 6 },
    authorBio: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", lineHeight: 20, marginBottom: space[3] },
    divider: { width: 40, height: 2, backgroundColor: c.ochre, borderRadius: 1, marginBottom: space[3] },
    sectionLabel: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.mute, textTransform: "uppercase", letterSpacing: 1.5, alignSelf: "flex-start", marginTop: 4 },

    row: {
      flexDirection: "row", alignItems: "center", gap: 14,
      paddingHorizontal: space[4], paddingVertical: space[4],
      backgroundColor: c.paper,
    },
    rowContent: { flex: 1 },
    rowCategory: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.ochre, letterSpacing: 1, marginBottom: 4 },
    rowTitle: { fontFamily: fonts.serifBold, fontSize: 16, color: c.ink, lineHeight: 22, marginBottom: 6 },
    rowMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    rowMetaText: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
    rowMetaDot: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
    rowThumb: { width: 72, height: 72, borderRadius: radius.lg, flexShrink: 0 },
    rowThumbPlaceholder: { backgroundColor: c.paperDeep },

    separator: { height: 1, backgroundColor: c.rule, marginLeft: space[4] },

    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", padding: space[8] },

    loadMoreBtn: {
      margin: space[4], paddingVertical: space[3],
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      alignItems: "center",
    },
    loadMoreText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.inkSoft },
  });
}
