import React, { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  TextInput, ActivityIndicator, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import ReactionBar from "./ReactionBar";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { useComments } from "../../features/community/useComments";
import { api, MOBILE_API, CULTURE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";
import QuoteShareCard from "../quotes/QuoteShareCard";
import { useScoreCardShare } from "../../features/games/useScoreCardShare";

const PLACEHOLDER_AVATAR = "https://ui-avatars.com/api/?background=e8d3ba&color=14110d&bold=true&size=64";

function timeAgo(date?: string): string {
  if (!date) return "";
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

function CommentsBlock({ postId, c, styles }: { postId: string; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const { comments, loading, addComment } = useComments(postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const user = useAuthStore((s) => s.user);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try { await addComment(text.trim()); setText(""); } finally { setSubmitting(false); }
  };

  const displayed = showAll ? comments : comments.slice(0, 3);

  return (
    <View style={styles.commentsBlock}>
      <Text style={styles.commentsHeading}>Comments {comments.length > 0 ? `(${comments.length})` : ""}</Text>

      {loading && <ActivityIndicator color={c.ochre} style={{ marginVertical: 8 }} />}

      {displayed.map((cm) => (
        <View key={cm.id} style={styles.commentRow}>
          <Image
            source={{ uri: cm.author.avatarUrl || PLACEHOLDER_AVATAR }}
            style={styles.commentAvatar}
          />
          <View style={{ flex: 1 }}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor}>{cm.author.name}</Text>
              <Text style={styles.commentTime}>{timeAgo(cm.publishedAt)}</Text>
            </View>
            <Text style={styles.commentContent}>{cm.content}</Text>
          </View>
        </View>
      ))}

      {comments.length > 3 && !showAll && (
        <TouchableOpacity onPress={() => setShowAll(true)}>
          <Text style={styles.viewAll}>View all {comments.length} comments</Text>
        </TouchableOpacity>
      )}

      {!comments.length && !loading && (
        <Text style={styles.noComments}>No comments yet — be the first.</Text>
      )}

      {/* Compose */}
      <View style={styles.composeRow}>
        <Image
          source={{ uri: user?.avatarUrl || PLACEHOLDER_AVATAR }}
          style={styles.commentAvatar}
        />
        <TextInput
          style={[styles.composeInput, { color: c.ink }]}
          placeholder="Add a comment…"
          placeholderTextColor={c.ghost}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        <TouchableOpacity
          onPress={submit}
          disabled={!text.trim() || submitting}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {submitting
            ? <ActivityIndicator size="small" color={c.ochre} />
            : <Ionicons name="send" size={18} color={text.trim() ? c.ochre : c.ghost} />
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function QuoteDetailModal({ visible, item, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const { user } = useAuthStore();
  const [bookmarked, setBookmarked] = useState(false);
  const { cardRef, share: shareCard } = useScoreCardShare();

  const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : "https://connect.themoveee.com/quotes";
  const sharingReason = item.quoteSharingReason || undefined;
  const posterName = item.communityAuthor ?? "Their";

  const handleShare = async () => {
    await shareCard();
  };

  const handleBookmark = async () => {
    if (!item.wpId || !user?.id) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await api.post(`${CULTURE_API}/content/bookmark`, { user_id: Number(user.id), post_id: Number(item.wpId) });
    } catch {
      setBookmarked(!next);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={{ position: "absolute", top: -9999, left: -9999 }}>
        <QuoteShareCard
          ref={cardRef}
          quoteText={item.title}
          quoteAuthor={item.quoteAuthor}
          quoteSource={item.quoteSource}
          qrValue={shareUrl}
        />
      </View>
      <View style={styles.body}>
        {/* Decorative open quote — contained so it doesn't clip */}
        <View style={styles.quoteBlock}>
          <Text style={styles.openQuote}>"</Text>
          <Text style={styles.quoteText}>{item.title}</Text>
          <Text style={styles.closeQuote}>"</Text>
        </View>

        {/* Attribution */}
        <View style={styles.attribution}>
          {item.quoteAuthor ? (
            <Text style={styles.author}>{item.quoteAuthor}</Text>
          ) : null}
          {item.quoteSource ? (
            <Text style={styles.source}>{item.quoteSource}</Text>
          ) : null}
        </View>

        {sharingReason ? (
          <View style={styles.posterNote}>
            <Text style={styles.posterNoteLabel}>💬 {posterName}'s note:</Text>
            <Text style={styles.posterNoteText}>{sharingReason}</Text>
          </View>
        ) : null}

        <View style={styles.sharePrompt}>
          <Text style={styles.sharePromptText}>Know someone who needs to see this?</Text>
          <TouchableOpacity onPress={handleShare}>
            <Text style={styles.sharePromptLink}>Share quote →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Reactions row */}
        <View style={styles.reactionsRow}>
          {item.wpId ? (
            <ReactionBar
              postId={item.wpId}
              initialCounts={item.reactions ?? { love: 0, fire: 0, clap: 0 }}
              shareUrl={shareUrl}
              showReport
            />
          ) : (
            <View style={styles.reactionsRow}>
              <View style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>❤️</Text>
                <Text style={styles.reactionCount}>{item.reactions?.love ?? 0}</Text>
              </View>
              <TouchableOpacity style={styles.reactionItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={18} color={c.mute} />
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.bookmarkBtn, bookmarked && styles.bookmarkBtnActive]}
            onPress={handleBookmark}
            activeOpacity={0.7}
          >
            <Ionicons
              name={bookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={bookmarked ? c.ochre : c.mute}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Comments */}
        {item.wpId ? (
          <CommentsBlock postId={String(item.wpId)} c={c} styles={styles} />
        ) : null}
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    body: { paddingHorizontal: space[5], paddingTop: space[4], gap: space[4], paddingBottom: space[6] },

    quoteBlock: { paddingTop: 8 },
    openQuote: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 56,
      color: c.ghost,
      lineHeight: 70,
      marginBottom: -8,
    },
    quoteText: {
      fontFamily: "Fraunces_400Regular",
      fontStyle: "italic",
      fontSize: 22,
      color: c.ink,
      lineHeight: 32,
      marginLeft: space[2],
    },
    closeQuote: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 40,
      color: c.ghost,
      lineHeight: 32,
      textAlign: "right",
    },

    attribution: { gap: space[1], paddingLeft: space[2] },
    author: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    source: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute, letterSpacing: 0.5 },

    posterNote: {
      backgroundColor: c.paperDeep, borderRadius: radius.md, padding: space[3],
      borderLeftWidth: 2, borderLeftColor: c.ochre,
    },
    posterNoteLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: c.inkSoft, marginBottom: 4 },
    posterNoteText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 19 },

    sharePrompt: { alignItems: "center", gap: 2 },
    sharePromptText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    sharePromptLink: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },

    divider: { height: 1, backgroundColor: c.rule },

    reactionsRow: { flexDirection: "row", alignItems: "center", gap: space[4] },
    reactionItem: { flexDirection: "row", alignItems: "center", gap: space[1] },
    reactionEmoji: { fontSize: 20 },
    reactionCount: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: c.mute },
    bookmarkBtn: { marginLeft: "auto" as any, padding: 4 },
    bookmarkBtnActive: {},

    // Comments
    commentsBlock: { gap: 12 },
    commentsHeading: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    commentRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
    commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: c.paperDeep },
    commentMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 },
    commentAuthor: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink },
    commentTime: { fontFamily: fonts.mono, fontSize: 10, color: c.ghost },
    commentContent: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 19 },
    viewAll: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    noComments: { fontFamily: fonts.sans, fontSize: 13, color: c.ghost, fontStyle: "italic" },
    composeRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      borderTopWidth: 1, borderTopColor: c.rule, paddingTop: 10, marginTop: 4,
    },
    composeInput: {
      flex: 1, fontFamily: fonts.sans, fontSize: 13,
      backgroundColor: c.paperDeep, borderRadius: radius.xl,
      paddingHorizontal: 12, paddingVertical: 8, maxHeight: 80,
    },

  });
}
