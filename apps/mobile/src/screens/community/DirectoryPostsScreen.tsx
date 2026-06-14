import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, CULTURE_API } from "../../api/client";

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  templateType: string;
  authorName: string;
  authorUsername: string;
  starRating: number;
  createdAt?: string;
}

const TEMPLATE_BADGE: Record<string, { label: string; color: string }> = {
  post:                { label: "💬 POST",             color: "#3A342B" },
  "cultural-take":     { label: "🔥 CULTURAL TAKE",    color: "#6B48A8" },
  "food-review":       { label: "🍽️ FOOD REVIEW",      color: "#C5491F" },
  "hidden-gem":        { label: "💎 HIDDEN GEM",        color: "#2D9CDB" },
  "book-review":       { label: "📖 BOOK REVIEW",       color: "#3A342B" },
  "creative-showcase": { label: "🎨 CREATIVE SHOWCASE", color: "#1976D2" },
  itinerary:           { label: "🗺️ ITINERARY",         color: "#B38238" },
  event:               { label: "📅 EVENT",             color: "#00695C" },
};

const AVATAR_PAIRS: Array<[string, string]> = [
  ["#9b51e0", "#f2994a"], ["#2D9CDB", "#9b51e0"], ["#C5491F", "#E2A684"],
  ["#B38238", "#E2A684"], ["#8E54E9", "#4776E6"], ["#00695C", "#4B6CB7"],
];

function avatarColors(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_PAIRS[h % AVATAR_PAIRS.length];
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerTitle: {
      flex: 1, textAlign: "center",
      fontFamily: fonts.sansBold, fontSize: 16, color: c.ink,
    },
    headerSub: {
      fontFamily: fonts.mono, fontSize: 11, color: c.mute,
      textAlign: "center", paddingBottom: 8,
    },
    list:   { paddingHorizontal: 16, paddingTop: 12 },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl,
      ...shadows.card, padding: 16, marginBottom: 12,
    },
    badgeRow: { flexDirection: "row", marginBottom: 10 },
    badge: {
      paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: radius.full,
    },
    badgeText: {
      fontFamily: fonts.sansBold, fontSize: 8,
      textTransform: "uppercase", letterSpacing: 0.8,
    },
    authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    avatar:    { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
    authorInfo: { flex: 1 },
    authorName: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    authorHandle: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
    starText: { fontFamily: fonts.monoBold, fontSize: 12, color: c.ochre },
    excerpt: {
      fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft,
      lineHeight: 21, marginBottom: 10,
    },
    readBtn: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40, gap: 8 },
    emptyText: { fontFamily: fonts.sans, fontSize: 14, color: c.mute, textAlign: "center" },
    footer: { padding: 24, alignItems: "center" },
    footerText: { fontFamily: fonts.mono, fontSize: 12, color: c.ghost },
  });
}

export default function DirectoryPostsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { entryId, entryTitle, showRating } = route.params ?? {};
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p: number) => {
    try {
      const res = await api.get<Post[]>(
        `${CULTURE_API}/directory/${entryId}/posts?page=${p}&per_page=20`,
        false
      );
      const items = Array.isArray(res) ? res : [];
      if (p === 1) {
        setPosts(items);
      } else {
        setPosts((prev) => [...prev, ...items]);
      }
      setHasMore(items.length === 20);
    } catch {
      setHasMore(false);
    }
  }, [entryId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await fetchPage(1);
      setLoading(false);
    })();
  }, [fetchPage]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await fetchPage(next);
    setLoadingMore(false);
  };

  const renderPost = ({ item }: { item: Post }) => {
    const badge = TEMPLATE_BADGE[item.templateType] ?? TEMPLATE_BADGE.post;
    const [g1, g2] = avatarColors(item.authorName);
    const stars = item.starRating
      ? "★".repeat(Math.round(item.starRating)) + "☆".repeat(5 - Math.round(item.starRating))
      : null;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => nav.navigate("PostDetail", { item: { id: item.id, slug: item.slug, title: item.title } })}
      >
        <View style={styles.badgeRow}>
          <View style={[styles.badge, { backgroundColor: badge.color + "1A" }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={styles.authorRow}>
          <LinearGradient colors={[g1, g2]} style={styles.avatar} />
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>{item.authorName}</Text>
            {item.authorUsername && (
              <Text style={styles.authorHandle}>@{item.authorUsername}</Text>
            )}
          </View>
        </View>
        {showRating && stars && (
          <View style={styles.starRow}>
            <Text style={styles.starText}>{stars} {item.starRating.toFixed(1)}</Text>
          </View>
        )}
        {(item.excerpt || item.title) && (
          <Text style={styles.excerpt} numberOfLines={3}>
            {item.excerpt || item.title}
          </Text>
        )}
        <Text style={styles.readBtn}>Read post →</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{entryTitle ?? "Community Posts"}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={c.ochre} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No community posts yet for this entry.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <Text style={styles.headerSub}>
              {posts.length} post{posts.length !== 1 ? "s" : ""} about this entry
            </Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={c.mute} />
              </View>
            ) : !hasMore && posts.length > 10 ? (
              <View style={styles.footer}>
                <Text style={styles.footerText}>You've seen them all</Text>
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
