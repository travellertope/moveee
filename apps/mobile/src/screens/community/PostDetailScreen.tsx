import React, { useState, useMemo } from "react";
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  Share,
} from "react-native";
import { openInApp } from "../../utils/openInApp";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import type { FeedItem } from "../../types";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import CommentSection from "../../components/community/CommentSection";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

function formatLongDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function initials(name: string): string {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

const REACTION_ENTRIES: Array<{ key: "love" | "fire" | "clap"; emoji: string }> = [
  { key: "love", emoji: "❤️" },
  { key: "fire", emoji: "🔥" },
  { key: "clap", emoji: "👏" },
];

function ReactionRow({ item, styles, c }: { item: FeedItem; styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  const [counts, setCounts] = useState(item.reactions ?? { love: 0, fire: 0, clap: 0 });
  const [mine, setMine] = useState<"love" | "fire" | "clap" | null>(null);
  const [pending, setPending] = useState(false);

  if (!item.wpId) return null;

  const handleReact = async (key: "love" | "fire" | "clap") => {
    if (pending) return;
    const isRemoving = mine === key;
    const prevCounts = counts;
    const prevMine = mine;

    const next = { ...counts };
    if (mine && mine !== key) next[mine] = Math.max(0, next[mine] - 1);
    next[key] = isRemoving ? Math.max(0, next[key] - 1) : next[key] + 1;
    setCounts(next);
    setMine(isRemoving ? null : key);
    setPending(true);
    try {
      await api.post(`${MOBILE_API}/community/react`, { post_id: Number(item.wpId), type: key });
    } catch {
      setCounts(prevCounts);
      setMine(prevMine);
    } finally {
      setPending(false);
    }
  };

  const handleShare = () => {
    if (!item.slug) return;
    const url = `https://themoveee.com/community/${item.slug}`;
    openInApp(url);
  };

  return (
    <View style={styles.reactionRow}>
      {REACTION_ENTRIES.map(({ key, emoji }) => {
        const active = mine === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.reactionBtn, active && styles.reactionBtnActive]}
            onPress={() => handleReact(key)}
          >
            <Text style={styles.reactionEmoji}>{emoji}</Text>
            {counts[key] > 0 ? <Text style={styles.reactionCount}>{counts[key]}</Text> : null}
          </TouchableOpacity>
        );
      })}
      <View style={{ flex: 1 }} />
      {item.slug ? (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={16} color={c.mute} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SourcePreview({ item, styles }: { item: FeedItem; styles: ReturnType<typeof createStyles> }) {
  if (!item.sourceUrl) return null;
  const open = () => openInApp(item.sourceUrl!);
  return (
    <TouchableOpacity style={styles.sourceCard} onPress={open} activeOpacity={0.85}>
      {item.ogImage ? <Image source={{ uri: item.ogImage }} style={styles.sourceImage} resizeMode="cover" /> : null}
      <View style={styles.sourceBody}>
        {item.source ? <Text style={styles.sourceName} numberOfLines={1}>{item.source.toUpperCase()}</Text> : null}
        {item.ogTitle ? <Text style={styles.sourceTitle} numberOfLines={2}>{item.ogTitle}</Text> : null}
        {item.ogDescription ? <Text style={styles.sourceDesc} numberOfLines={2}>{item.ogDescription}</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

export default function PostDetailScreen() {
  const { params } = useRoute<any>();
  const nav = useNav();
  const item: FeedItem = params?.item;
  const postId = item?.wpId ?? params?.postId ?? "";
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const goToAuthor = () => item?.communityAuthorId && nav.navigate("MemberProfile", { userId: item.communityAuthorId });

  if (!item) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Community</Text>
          </View>
          {item.communityTag ? <Text style={styles.tag}>{item.communityTag}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {item.slug ? (
            <TouchableOpacity
              style={styles.openFullBtn}
              onPress={() => {
                const url = `https://connect.themoveee.com/community/${item.slug}`;
                Share.share(
                  Platform.OS === "ios"
                    ? { url, message: `${item.communityAuthor ?? "Someone"}'s post on Moveee` }
                    : { message: `${item.communityAuthor ?? "Someone"}'s post on Moveee\n${url}`, title: "Share post" }
                ).catch(() => {});
              }}
            >
              <Text style={styles.openFullBtnText}>Share</Text>
              <Ionicons name="share-outline" size={12} color={c.mute} />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={c.mute} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.listContent}>
          <TouchableOpacity style={styles.authorRow} onPress={goToAuthor} disabled={!item.communityAuthorId}>
            {item.communityAuthorAvatar ? (
              <Image source={{ uri: item.communityAuthorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initials(item.communityAuthor || "?")}</Text>
              </View>
            )}
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.authorName}>{item.communityAuthor || "Community Member"}</Text>
                {item.communityTier === "patron" ? (
                  <View style={styles.proBadge}>
                    <Ionicons name="ribbon" size={9} color="#fff" />
                  </View>
                ) : null}
              </View>
              <Text style={styles.metaDate}>{formatLongDate(item.date)}</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.content}>{item.title}</Text>

          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
          ) : (
            <SourcePreview item={item} styles={styles} />
          )}

          <ReactionRow item={item} styles={styles} c={c} />

          <CommentSection postId={String(postId)} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 18, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.ruleDark,
    },
    headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
    badge: { backgroundColor: c.communityBg, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: c.communityText },
    tag: { fontSize: 11, color: c.mute, letterSpacing: 0.6, textTransform: "uppercase" },
    openFullBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      borderWidth: 1, borderColor: c.ruleDark, borderRadius: 2,
      paddingHorizontal: 8, paddingVertical: 4,
    },
    openFullBtnText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: c.mute },
    closeBtn: { padding: 2 },

    listContent: { padding: 18, paddingBottom: 8 },

    authorRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
    avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: c.communityBg },
    avatarFallback: {
      width: 38, height: 38, borderRadius: 19, backgroundColor: c.communityBg,
      borderWidth: 1, borderColor: c.communityBorder, justifyContent: "center", alignItems: "center",
    },
    avatarFallbackText: { fontSize: 12, fontWeight: "700", color: c.communityText },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    authorName: { fontWeight: "600", fontSize: 14, color: c.ink },
    proBadge: {
      backgroundColor: c.goldLight, borderWidth: 1, borderColor: c.goldBorder,
      borderRadius: 2, paddingHorizontal: 5, paddingVertical: 1,
    },
    proBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: c.gold },
    metaDate: { fontSize: 12, color: c.ghost, marginTop: 2 },

    content: { fontSize: 15, lineHeight: 25, color: c.inkSoft, fontFamily: SERIF, marginBottom: 14 },
    postImage: { width: "100%", height: 240, borderRadius: 6, marginBottom: 14, borderWidth: 1, borderColor: c.ruleDark, backgroundColor: c.paperDeep },

    sourceCard: {
      flexDirection: "row", borderWidth: 1, borderColor: c.ruleDark, borderRadius: 6,
      overflow: "hidden", marginBottom: 14, backgroundColor: c.paperWarm,
    },
    sourceImage: { width: 96, backgroundColor: c.paperDeep },
    sourceBody: { flex: 1, padding: 10, justifyContent: "center", gap: 3 },
    sourceName: { fontSize: 10, fontWeight: "700", color: c.gold, letterSpacing: 1, textTransform: "uppercase" },
    sourceTitle: { fontSize: 13, fontWeight: "600", color: c.ink, lineHeight: 18 },
    sourceDesc: { fontSize: 11, color: c.mute, lineHeight: 15 },

    reactionRow: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: c.ruleDark,
    },
    reactionBtn: {
      flexDirection: "row", alignItems: "center", gap: 5,
      borderWidth: 1, borderColor: "transparent", borderRadius: 20,
      paddingHorizontal: 10, paddingVertical: 4,
    },
    reactionBtnActive: { backgroundColor: c.paperDeep, borderColor: c.ruleDark },
    reactionEmoji: { fontSize: 15 },
    reactionCount: { fontSize: 12, color: c.mute },
    shareBtn: { padding: 4 },

  });
}
