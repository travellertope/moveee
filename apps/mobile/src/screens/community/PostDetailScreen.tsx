import React, { useState, useMemo } from "react";
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Share,
} from "react-native";
import { openInApp } from "../../utils/openInApp";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useComments } from "../../features/community/useComments";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import type { FeedItem } from "../../types";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";
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
  const nav = useNavigation<any>();
  const item: FeedItem = params?.item;
  const postId = item?.wpId ?? params?.postId ?? "";
  const user = useAuthStore((s) => s.user);
  const { comments, loading, addComment } = useComments(postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

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

      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
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

            <Text style={styles.commentsLabel}>
              {comments.length > 0 ? `${comments.length} Comment${comments.length === 1 ? "" : "s"}` : "Start the conversation"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? null : <Text style={styles.emptyText}>No comments yet — be the first to reply.</Text>
        }
        renderItem={({ item: c }) => (
          <View style={styles.comment}>
            <Image source={{ uri: c.author.avatarUrl || PLACEHOLDER_AVATAR }} style={styles.commentAvatar} />
            <View style={styles.commentBody}>
              <Text style={styles.commentAuthor}>{c.author.name}</Text>
              <Text style={styles.commentContent}>{c.content}</Text>
            </View>
          </View>
        )}
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 12 }} color={c.gold} /> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <Text style={styles.commentingAs}>Commenting as <Text style={styles.commentingAsName}>{user?.displayName ?? "you"}</Text></Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Comment *"
            placeholderTextColor={c.ghost}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()}>
            {submitting ? (
              <ActivityIndicator size="small" color={c.gold} />
            ) : (
              <Ionicons name="send" size={22} color={text.trim() ? c.gold : c.ghost} />
            )}
          </TouchableOpacity>
        </View>
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

    commentsLabel: { fontSize: 17, fontWeight: "700", fontFamily: SERIF, color: c.ink, marginBottom: 14 },
    emptyText: { color: c.ghost, fontSize: 13, marginBottom: 12 },

    comment: { flexDirection: "row", gap: 10, marginBottom: 16 },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.paperDeep },
    commentBody: { flex: 1 },
    commentAuthor: { fontWeight: "600", fontSize: 13, color: c.ink, marginBottom: 2 },
    commentContent: { fontSize: 14, color: c.inkSoft, lineHeight: 20 },

    inputRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6,
      borderTopWidth: 1, borderTopColor: c.ruleDark, backgroundColor: c.paper,
    },
    commentingAs: { fontSize: 12, color: c.ghost },
    commentingAsName: { color: c.gold, fontWeight: "600" },
    input: {
      flex: 1, backgroundColor: c.paperWarm, borderRadius: 20, borderWidth: 1, borderColor: c.ruleDark,
      paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100,
    },
  });
}
