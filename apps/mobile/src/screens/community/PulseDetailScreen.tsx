import React, { useState } from "react";
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, useWindowDimensions, Linking,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { useComments } from "../../features/community/useComments";
import { useAuthStore } from "../../auth/authStore";
import type { FeedItem } from "../../types";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const HTML_TAG_STYLES = {
  p: { fontSize: 15, lineHeight: 25, color: "#3a342b", fontFamily: SERIF, marginBottom: 12 },
  a: { color: "#b38238", textDecorationLine: "underline" as const },
};

function formatLongDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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

export default function PulseDetailScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const item: FeedItem = params?.item;
  const postId = item?.wpId ?? "";
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

  if (!item) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Pulse</Text>
          </View>
          {item.region ? <Text style={styles.region}>{item.region}</Text> : null}
        </View>
        <View style={styles.headerRight}>
          {item.slug ? (
            <TouchableOpacity
              style={styles.openFullBtn}
              onPress={() => Linking.openURL(`https://themoveee.com/pulse/${item.slug}`).catch(() => {})}
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
            <Text style={styles.title}>{item.title}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaDate}>{formatLongDate(item.date)}</Text>
              {item.source ? (
                <Text style={styles.metaVia}>Via <Text style={styles.metaSource}>{item.source}</Text></Text>
              ) : null}
              <View style={styles.curatedBadge}>
                <Text style={styles.curatedBadgeText}>Curated with AI</Text>
              </View>
            </View>

            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" />
            ) : null}

            {item.body ? (
              <RenderHtml contentWidth={width - 40} source={{ html: item.body }} tagsStyles={HTML_TAG_STYLES} />
            ) : item.excerpt ? (
              <Text style={styles.bodyText}>{item.excerpt}</Text>
            ) : null}

            <SourcePreview item={item} />

            <Text style={styles.commentsLabel}>Start the conversation</Text>
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
  badge: { backgroundColor: "#fef3e2", borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: "#b38238" },
  region: { fontSize: 11, color: "#7a6f5c", letterSpacing: 0.6, textTransform: "uppercase" },
  openFullBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "#d8d0c6", borderRadius: 2,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  openFullBtnText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: "#7a6f5c" },
  closeBtn: { padding: 2 },

  listContent: { padding: 18, paddingBottom: 8 },
  title: { fontSize: 21, fontWeight: "700", fontFamily: SERIF, color: "#14110d", lineHeight: 28, marginBottom: 12 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  metaDate: { fontSize: 12, color: "#999" },
  metaVia: { fontSize: 12, color: "#7a6f5c" },
  metaSource: { color: "#b38238", fontWeight: "600" },
  curatedBadge: { backgroundColor: "rgba(179,130,56,0.08)", borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
  curatedBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#b38238" },

  heroImage: { width: "100%", height: 200, borderRadius: 6, marginBottom: 14, borderWidth: 1, borderColor: "#e8e2d8", backgroundColor: "#e0d8cc" },
  bodyText: { fontSize: 15, lineHeight: 25, color: "#3a342b", fontFamily: SERIF, marginBottom: 14 },

  sourceCard: {
    flexDirection: "row", borderWidth: 1, borderColor: "#e8e2d8", borderRadius: 6,
    overflow: "hidden", marginTop: 4, marginBottom: 14, backgroundColor: "#faf8f4",
  },
  sourceImage: { width: 96, backgroundColor: "#e0d8cc" },
  sourceBody: { flex: 1, padding: 10, justifyContent: "center", gap: 3 },
  sourceName: { fontSize: 10, fontWeight: "700", color: "#b38238", letterSpacing: 1, textTransform: "uppercase" },
  sourceTitle: { fontSize: 13, fontWeight: "600", color: "#14110d", lineHeight: 18 },
  sourceDesc: { fontSize: 11, color: "#7a6f5c", lineHeight: 15 },

  commentsLabel: { fontSize: 17, fontWeight: "700", fontFamily: SERIF, color: "#14110d", marginTop: 8, marginBottom: 14, paddingTop: 18, borderTopWidth: 1, borderTopColor: "#e8e2d8" },
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
