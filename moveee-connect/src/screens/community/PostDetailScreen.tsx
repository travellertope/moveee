import React, { useState } from "react";
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useComments } from "../../features/community/useComments";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import type { FeedItem } from "../../types";

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

function ReactionRow({ item }: { item: FeedItem }) {
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
    Linking.openURL(url).catch(() => {});
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
          <Ionicons name="share-outline" size={16} color="#7a6f5c" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function SourcePreview({ item }: { item: FeedItem }) {
  if (!item.sourceUrl) return null;
  const open = () => Linking.openURL(item.sourceUrl!).catch(() => {});
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
              onPress={() => Linking.openURL(`https://themoveee.com/community/${item.slug}`).catch(() => {})}
            >
              <Text style={styles.openFullBtnText}>Open full page</Text>
              <Ionicons name="open-outline" size={12} color="#7a6f5c" />
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color="#7a6f5c" />
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
                      <Text style={styles.proBadgeText}>Pro</Text>
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
              <SourcePreview item={item} />
            )}

            <ReactionRow item={item} />

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
        ListFooterComponent={loading ? <ActivityIndicator style={{ marginTop: 12 }} color="#b38238" /> : null}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <Text style={styles.commentingAs}>Commenting as <Text style={styles.commentingAsName}>{user?.displayName ?? "you"}</Text></Text>
        </View>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Comment *"
            placeholderTextColor="#9e9e9e"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()}>
            {submitting ? (
              <ActivityIndicator size="small" color="#b38238" />
            ) : (
              <Ionicons name="send" size={22} color={text.trim() ? "#b38238" : "#ccc"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#e8e2d8",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { backgroundColor: "#edf7ed", borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: "#2e7d32" },
  tag: { fontSize: 11, color: "#7a6f5c", letterSpacing: 0.6, textTransform: "uppercase" },
  openFullBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "#d8d0c6", borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  openFullBtnText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: "#7a6f5c" },
  closeBtn: { padding: 2 },

  listContent: { padding: 18, paddingBottom: 8 },

  authorRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#edf7ed" },
  avatarFallback: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: "#edf7ed",
    borderWidth: 1, borderColor: "#c8e6c9", justifyContent: "center", alignItems: "center",
  },
  avatarFallbackText: { fontSize: 12, fontWeight: "700", color: "#2e7d32" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  proBadge: {
    backgroundColor: "rgba(179,130,56,0.1)", borderWidth: 1, borderColor: "rgba(179,130,56,0.25)",
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: "#b38238" },
  metaDate: { fontSize: 12, color: "#999", marginTop: 2 },

  content: { fontSize: 15, lineHeight: 25, color: "#3a342b", fontFamily: SERIF, marginBottom: 14 },
  postImage: { width: "100%", height: 240, borderRadius: 6, marginBottom: 14, borderWidth: 1, borderColor: "#e8e2d8", backgroundColor: "#e0d8cc" },

  sourceCard: {
    flexDirection: "row", borderWidth: 1, borderColor: "#e8e2d8", borderRadius: 6,
    overflow: "hidden", marginBottom: 14, backgroundColor: "#faf8f4",
  },
  sourceImage: { width: 96, backgroundColor: "#e0d8cc" },
  sourceBody: { flex: 1, padding: 10, justifyContent: "center", gap: 3 },
  sourceName: { fontSize: 10, fontWeight: "700", color: "#b38238", letterSpacing: 1, textTransform: "uppercase" },
  sourceTitle: { fontSize: 13, fontWeight: "600", color: "#14110d", lineHeight: 18 },
  sourceDesc: { fontSize: 11, color: "#7a6f5c", lineHeight: 15 },

  reactionRow: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e8e2d8",
  },
  reactionBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: "transparent", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  reactionBtnActive: { backgroundColor: "#f0ece4", borderColor: "#d8cfc4" },
  reactionEmoji: { fontSize: 15 },
  reactionCount: { fontSize: 12, color: "#7a6f5c" },
  shareBtn: { padding: 4 },

  commentsLabel: { fontSize: 17, fontWeight: "700", fontFamily: SERIF, color: "#14110d", marginBottom: 14 },
  emptyText: { color: "#9e9e9e", fontSize: 13, marginBottom: 12 },

  comment: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0d8cc" },
  commentBody: { flex: 1 },
  commentAuthor: { fontWeight: "600", fontSize: 13, color: "#14110d", marginBottom: 2 },
  commentContent: { fontSize: 14, color: "#333", lineHeight: 20 },

  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6,
    borderTopWidth: 1, borderTopColor: "#e8e2d8", backgroundColor: "#fff",
  },
  commentingAs: { fontSize: 12, color: "#9e9e9e" },
  commentingAsName: { color: "#b38238", fontWeight: "600" },
  input: {
    flex: 1, backgroundColor: "#faf8f4", borderRadius: 20, borderWidth: 1, borderColor: "#e8e2d8",
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100,
  },
});
