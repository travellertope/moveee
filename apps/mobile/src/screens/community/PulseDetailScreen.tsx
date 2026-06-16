import React, { useState, useMemo } from "react";
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, useWindowDimensions, Share,
} from "react-native";
import { openInApp } from "../../utils/openInApp";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { useComments } from "../../features/community/useComments";
import { useAuthStore } from "../../auth/authStore";
import type { FeedItem } from "../../types";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

function formatLongDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
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

export default function PulseDetailScreen() {
  const { params } = useRoute<any>();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const item: FeedItem = params?.item;
  const postId = item?.wpId ?? "";
  const user = useAuthStore((s) => s.user);
  const { comments, loading, addComment } = useComments(postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const HTML_TAG_STYLES = {
    p: { fontSize: 15, lineHeight: 25, color: c.inkSoft, fontFamily: SERIF, marginBottom: 12 },
    a: { color: c.gold, textDecorationLine: "underline" as const },
  };

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
              onPress={() => {
                const url = `https://connect.themoveee.com/pulse/${item.slug}`;
                Share.share(
                  Platform.OS === "ios"
                    ? { url, message: item.title ?? "Check this out on Moveee" }
                    : { message: `${item.title ?? "Check this out on Moveee"}\n${url}`, title: "Share" }
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

            <SourcePreview item={item} styles={styles} />

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
    badge: { backgroundColor: c.badgePulseBg, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
    badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: c.gold },
    region: { fontSize: 11, color: c.mute, letterSpacing: 0.6, textTransform: "uppercase" },
    openFullBtn: {
      flexDirection: "row", alignItems: "center", gap: 4,
      borderWidth: 1, borderColor: c.ruleDark, borderRadius: 2,
      paddingHorizontal: 8, paddingVertical: 4,
    },
    openFullBtnText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: c.mute },
    closeBtn: { padding: 2 },

    listContent: { padding: 18, paddingBottom: 8 },
    title: { fontSize: 21, fontWeight: "700", fontFamily: SERIF, color: c.ink, lineHeight: 28, marginBottom: 12 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 14 },
    metaDate: { fontSize: 12, color: c.ghost },
    metaVia: { fontSize: 12, color: c.mute },
    metaSource: { color: c.gold, fontWeight: "600" },
    curatedBadge: { backgroundColor: c.goldLight, borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
    curatedBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: c.gold },

    heroImage: { width: "100%", height: 200, borderRadius: 6, marginBottom: 14, borderWidth: 1, borderColor: c.ruleDark, backgroundColor: c.ruleDark },
    bodyText: { fontSize: 15, lineHeight: 25, color: c.inkSoft, fontFamily: SERIF, marginBottom: 14 },

    sourceCard: {
      flexDirection: "row", borderWidth: 1, borderColor: c.ruleDark, borderRadius: 6,
      overflow: "hidden", marginTop: 4, marginBottom: 14, backgroundColor: c.paperWarm,
    },
    sourceImage: { width: 96, backgroundColor: c.ruleDark },
    sourceBody: { flex: 1, padding: 10, justifyContent: "center", gap: 3 },
    sourceName: { fontSize: 10, fontWeight: "700", color: c.gold, letterSpacing: 1, textTransform: "uppercase" },
    sourceTitle: { fontSize: 13, fontWeight: "600", color: c.ink, lineHeight: 18 },
    sourceDesc: { fontSize: 11, color: c.mute, lineHeight: 15 },

    commentsLabel: { fontSize: 17, fontWeight: "700", fontFamily: SERIF, color: c.ink, marginTop: 8, marginBottom: 14, paddingTop: 18, borderTopWidth: 1, borderTopColor: c.ruleDark },
    emptyText: { color: c.ghost, fontSize: 13, marginBottom: 12 },

    comment: { flexDirection: "row", gap: 10, marginBottom: 16 },
    commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.ruleDark },
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
