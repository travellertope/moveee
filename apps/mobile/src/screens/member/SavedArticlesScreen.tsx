import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

interface SavedItem {
  id: number;
  type: "article" | "quote";
  slug: string;
  title: string;
  excerpt?: string;
  featuredImage?: string;
  author?: { name: string };
  publishedAt?: string;
  readingTime?: number;
  category?: string;
  quoteAuthor?: string;
  quoteSource?: string;
}

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

type Tab = "articles" | "quotes";

export default function SavedArticlesScreen() {
  const nav = useNavigation<any>();
  const user = useAuthStore((s) => s.user);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [all, setAll] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("articles");

  const fetchSaved = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ bookmarked?: SavedItem[] }>(
        `${MOBILE_API}/saved`
      );
      setAll(data.bookmarked ?? []);
    } catch {
      setError("Couldn't load saved items.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  const articles = all.filter((i) => i.type !== "quote");
  const quotes = all.filter((i) => i.type === "quote");
  const items = tab === "articles" ? articles : quotes;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: space[3] }}>
          <Text style={styles.headerEyebrow}>Collection</Text>
          <Text style={styles.headerTitle}>Saved</Text>
        </View>
        <TouchableOpacity onPress={fetchSaved} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh-outline" size={20} color={c.mute} />
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === "articles" ? styles.tabActive : undefined]}
          onPress={() => setTab("articles")}
        >
          <Text style={[styles.tabText, tab === "articles" ? styles.tabTextActive : undefined]}>
            Articles {articles.length > 0 ? `(${articles.length})` : ""}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === "quotes" ? styles.tabActive : undefined]}
          onPress={() => setTab("quotes")}
        >
          <Text style={[styles.tabText, tab === "quotes" ? styles.tabTextActive : undefined]}>
            Quotes {quotes.length > 0 ? `(${quotes.length})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(a) => `${a.type}-${a.id}`}
        renderItem={({ item }) =>
          item.type === "quote" ? (
            <TouchableOpacity
              style={styles.quoteCard}
              onPress={() => nav.push("Article", { slug: item.slug })}
              activeOpacity={0.88}
            >
              <Text style={styles.quoteGlyph}>"</Text>
              <Text style={styles.quoteText} numberOfLines={3}>{item.title}</Text>
              {item.quoteAuthor ? (
                <Text style={styles.quoteAuthor}>— {item.quoteAuthor}</Text>
              ) : null}
              {item.quoteSource ? (
                <Text style={styles.quoteSource}>{item.quoteSource}</Text>
              ) : null}
              {item.publishedAt ? (
                <Text style={styles.cardDate}>{timeAgo(item.publishedAt)}</Text>
              ) : null}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.push("Article", { slug: item.slug })}
              activeOpacity={0.88}
            >
              <View style={styles.cardBody}>
                {item.category ? (
                  <Text style={styles.cardCategory}>{item.category.toUpperCase()}</Text>
                ) : null}
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {item.excerpt ? (
                  <Text style={styles.cardExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {item.author?.name ? (
                    <Text style={styles.cardAuthor}>{item.author.name}</Text>
                  ) : null}
                  {item.publishedAt ? (
                    <>
                      <Text style={styles.cardDot}>·</Text>
                      <Text style={styles.cardDate}>{timeAgo(item.publishedAt)}</Text>
                    </>
                  ) : null}
                  {item.readingTime ? (
                    <>
                      <Text style={styles.cardDot}>·</Text>
                      <Text style={styles.cardDate}>{item.readingTime} min</Text>
                    </>
                  ) : null}
                </View>
              </View>
              {item.featuredImage ? (
                <Image source={{ uri: item.featuredImage }} style={styles.cardThumb} resizeMode="cover" />
              ) : (
                <View style={[styles.cardThumb, styles.cardThumbPlaceholder]} />
              )}
            </TouchableOpacity>
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={c.gold} style={{ marginTop: 60 }} />
          ) : error ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchSaved}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Ionicons
                name={tab === "quotes" ? "chatbubble-outline" : "bookmark-outline"}
                size={40}
                color={c.ghost}
                style={{ marginBottom: space[3] }}
              />
              <Text style={styles.emptyTitle}>
                {tab === "quotes" ? "No saved quotes yet" : "No saved articles yet"}
              </Text>
              <Text style={styles.emptyText}>
                {tab === "quotes"
                  ? "Tap the bookmark icon on any quote to save it here."
                  : "Tap the bookmark icon on any article to save it here."}
              </Text>
            </View>
          )
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

    // Tabs
    tabRow: {
      flexDirection: "row",
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      paddingHorizontal: space[4],
    },
    tab: {
      paddingVertical: 10,
      paddingHorizontal: space[2],
      marginRight: space[4],
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: {
      borderBottomColor: c.ochre,
    },
    tabText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.mute,
    },
    tabTextActive: {
      color: c.ink,
    },

    list: { paddingBottom: 60 },

    // Article card
    card: {
      flexDirection: "row", gap: 12, alignItems: "flex-start",
      paddingHorizontal: space[4], paddingVertical: space[4],
      backgroundColor: c.paper,
    },
    cardBody: { flex: 1 },
    cardCategory: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.ochre, letterSpacing: 1, marginBottom: 4 },
    cardTitle: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink, lineHeight: 21, marginBottom: 4 },
    cardExcerpt: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, lineHeight: 18, marginBottom: 6 },
    cardMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
    cardAuthor: { fontFamily: fonts.sansBold, fontSize: fontSize.tiny, color: c.inkSoft },
    cardDot: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
    cardDate: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
    cardThumb: { width: 80, height: 80, borderRadius: radius.lg, flexShrink: 0 },
    cardThumbPlaceholder: { backgroundColor: c.paperDeep },

    // Quote card
    quoteCard: {
      paddingHorizontal: space[4],
      paddingVertical: space[4],
      backgroundColor: c.paper,
      position: "relative",
    },
    quoteGlyph: {
      position: "absolute",
      top: 12,
      left: 14,
      fontFamily: fonts.serifBold,
      fontSize: 40,
      color: c.ghost,
      lineHeight: 32,
    },
    quoteText: {
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontSize: 15,
      color: c.ink,
      lineHeight: 22,
      paddingLeft: 22,
      marginTop: 6,
    },
    quoteAuthor: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.inkSoft,
      marginTop: 8,
      paddingLeft: 22,
    },
    quoteSource: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
      paddingLeft: 22,
      marginTop: 2,
    },

    separator: { height: 1, backgroundColor: c.rule, marginLeft: space[4] },

    emptyWrap: { alignItems: "center", paddingTop: 80, paddingHorizontal: space[8] },
    emptyTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginBottom: space[2], textAlign: "center" },
    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", lineHeight: 20 },

    retryBtn: {
      marginTop: space[4], paddingVertical: space[2], paddingHorizontal: space[5],
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
    },
    retryText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.inkSoft },
  });
}
