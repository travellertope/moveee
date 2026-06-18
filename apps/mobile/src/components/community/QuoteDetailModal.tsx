import React, { useMemo, useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import ReactionBar from "./ReactionBar";
import BottomSheet from "../ui/BottomSheet";
import CommentSection from "./CommentSection";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API, CULTURE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";
import QuoteShareCard from "../quotes/QuoteShareCard";
import { useScoreCardShare } from "../../features/games/useScoreCardShare";

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
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
          <CommentSection postId={String(item.wpId)} />
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
  });
}
