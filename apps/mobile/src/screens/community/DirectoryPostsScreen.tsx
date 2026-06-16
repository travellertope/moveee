import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, CULTURE_API } from "../../api/client";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Post {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  templateType: string;
  authorName: string;
  authorUsername: string;
  starRating: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TEMPLATE_BADGE: Record<string, { label: string; color: string }> = {
  post:                { label: "💬 Post",             color: "#3A342B" },
  "cultural-take":     { label: "🔥 Cultural Take",    color: "#6B48A8" },
  "food-review":       { label: "🍽️ Food Review",      color: "#C5491F" },
  "hidden-gem":        { label: "💎 Hidden Gem",        color: "#2D9CDB" },
  "book-review":       { label: "📖 Book Review",       color: "#3A342B" },
  "creative-showcase": { label: "🎨 Creative Showcase", color: "#1976D2" },
  itinerary:           { label: "🗺️ Itinerary",         color: "#B38238" },
  event:               { label: "📅 Event",             color: "#00695C" },
};

const AVATAR_PALETTE: Array<[string, string]> = [
  ["#9b51e0", "#f2994a"], ["#2D9CDB", "#9b51e0"], ["#C5491F", "#E2A684"],
  ["#B38238", "#E2A684"], ["#8E54E9", "#4776E6"], ["#00695C", "#4B6CB7"],
];

function avatarGradient(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

// ── Styles factory ────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },

    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerTitle: {
      flex: 1, textAlign: "center",
      fontFamily: fonts.sansBold, fontSize: 16, color: c.ink,
    },

    listContent: { padding: space[4], gap: 12 },

    countRow: {
      paddingBottom: space[3],
    },
    countText: {
      fontFamily: fonts.mono, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 0.8,
    },

    // Post card — matches the paperWarm card style used across the app
    card: {
      backgroundColor: c.paperWarm,
      borderRadius: radius.xl,
      padding: space[4],
      ...shadows.card,
    },

    badgePill: {
      alignSelf: "flex-start",
      paddingHorizontal: space[2],
      paddingVertical: 2,
      borderRadius: radius.full,
      marginBottom: space[3],
    },
    badgePillText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.eyebrow,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },

    authorRow: {
      flexDirection: "row", alignItems: "center",
      gap: space[2], marginBottom: space[2],
    },
    avatar: { width: 32, height: 32, borderRadius: 16 },
    authorName: {
      fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink, flex: 1,
    },
    authorHandle: {
      fontFamily: fonts.mono, fontSize: 11, color: c.mute,
    },

    starRow: {
      flexDirection: "row", alignItems: "center",
      gap: space[1], marginBottom: space[2],
    },
    starText: { fontFamily: fonts.monoBold, fontSize: 12, color: c.ochre },

    excerpt: {
      fontFamily: fonts.sans, fontSize: fontSize.sm,
      color: c.inkSoft, lineHeight: 21, marginBottom: space[3],
    },

    readBtn: {
      fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre,
    },

    divider: {
      height: 1, backgroundColor: c.rule, marginTop: space[3],
    },

    // Loading / empty / footer states
    centered: {
      flex: 1, justifyContent: "center", alignItems: "center", padding: space[8],
    },
    emptyText: {
      fontFamily: fonts.sans, fontSize: fontSize.base,
      color: c.mute, textAlign: "center", lineHeight: 22,
    },
    footerWrap: {
      paddingVertical: space[6], alignItems: "center",
    },
    footerText: {
      fontFamily: fonts.mono, fontSize: 11, color: c.ghost,
      textTransform: "uppercase", letterSpacing: 0.8,
    },
  });
}

// ── Post card ─────────────────────────────────────────────────────────────────

function PostCard({
  post,
  showRating,
  styles,
  c,
  onPress,
}: {
  post: Post;
  showRating: boolean;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
  onPress: () => void;
}) {
  const badge = TEMPLATE_BADGE[post.templateType] ?? TEMPLATE_BADGE.post;
  const [g1, g2] = avatarGradient(post.authorName);
  const stars = showRating && post.starRating > 0
    ? "★".repeat(Math.round(post.starRating)) + "☆".repeat(5 - Math.round(post.starRating))
    : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={onPress}>
      {/* Template badge */}
      <View style={[styles.badgePill, { backgroundColor: badge.color + "1A" }]}>
        <Text style={[styles.badgePillText, { color: badge.color }]}>{badge.label}</Text>
      </View>

      {/* Author */}
      <View style={styles.authorRow}>
        <LinearGradient colors={[g1, g2]} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.authorName} numberOfLines={1}>{post.authorName}</Text>
          {!!post.authorUsername && (
            <Text style={styles.authorHandle}>@{post.authorUsername}</Text>
          )}
        </View>
      </View>

      {/* Star rating (food + book types) */}
      {stars && (
        <View style={styles.starRow}>
          <Text style={styles.starText}>{stars}  {post.starRating.toFixed(1)}</Text>
        </View>
      )}

      {/* Excerpt */}
      {!!(post.excerpt || post.title) && (
        <Text style={styles.excerpt} numberOfLines={3}>
          {post.excerpt || post.title}
        </Text>
      )}

      <Text style={styles.readBtn}>Read post →</Text>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DirectoryPostsScreen() {
  const nav = useNav();
  const route = useRoute<any>();
  const { entryId, entryTitle, showRating } = route.params ?? {};

  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [posts, setPosts]           = useState<Post[]>([]);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [hasMore, setHasMore]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(async (p: number) => {
    try {
      const res = await api.get<Post[]>(
        `${CULTURE_API}/directory/${entryId}/posts?page=${p}&per_page=20`,
        false
      );
      const items = Array.isArray(res) ? res : [];
      setPosts((prev) => p === 1 ? items : [...prev, ...items]);
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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => nav.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {entryTitle ?? "Community Posts"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={c.ochre} />
        </View>
      ) : posts.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            No community posts about this entry yet.{"\n"}Be the first to share your take.
          </Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              showRating={!!showRating}
              styles={styles}
              c={c}
              onPress={() => nav.navigate("PostDetail", {
                item: { id: item.id, slug: item.slug, title: item.title, excerpt: item.excerpt },
              })}
            />
          )}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => null}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View style={styles.countRow}>
              <Text style={styles.countText}>{posts.length} post{posts.length !== 1 ? "s" : ""}</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerWrap}>
                <ActivityIndicator size="small" color={c.mute} />
              </View>
            ) : !hasMore && posts.length > 5 ? (
              <View style={styles.footerWrap}>
                <Text style={styles.footerText}>All posts loaded</Text>
              </View>
            ) : null
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
