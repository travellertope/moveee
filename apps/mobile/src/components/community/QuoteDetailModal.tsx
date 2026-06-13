import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReactionBar from "./ReactionBar";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function QuoteDetailModal({ visible, item, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : undefined;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `"${item.title}" — ${item.quoteAuthor ?? ""}${shareUrl ? `\n${shareUrl}` : ""}`,
        url: shareUrl,
      });
    } catch { /* silent */ }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        {/* Decorative open quote */}
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

        <View style={styles.divider} />

        {/* Reactions row */}
        <View style={styles.reactionsRow}>
          {item.reactions && item.wpId ? (
            <ReactionBar
              postId={item.wpId}
              initialCounts={item.reactions}
              shareUrl={shareUrl}
            />
          ) : (
            <>
              <View style={styles.reactionItem}>
                <Text style={styles.reactionEmoji}>❤️</Text>
                <Text style={styles.reactionCount}>{item.reactions?.love ?? 0}</Text>
              </View>
              <TouchableOpacity style={styles.reactionItem}>
                <Ionicons name="bookmark-outline" size={20} color={c.mute} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionItem} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={c.mute} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.divider} />

        {/* More in series — placeholder */}
        <TouchableOpacity style={styles.exploreLink}>
          <Text style={styles.exploreLinkText}>Explore more quotes →</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    body: { padding: space[5], gap: space[4] },

    quoteBlock: { gap: space[1], position: "relative" },
    openQuote: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 80,
      color: c.ghost,
      lineHeight: 64,
      marginBottom: -space[3],
    },
    quoteText: {
      fontFamily: "Fraunces_400Regular",
      fontStyle: "italic",
      fontSize: 24,
      color: c.ink,
      lineHeight: 34,
      marginLeft: space[2],
    },
    closeQuote: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 48,
      color: c.ghost,
      lineHeight: 36,
      textAlign: "right",
    },

    attribution: { gap: space[1], paddingLeft: space[2] },
    author: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    source: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute, letterSpacing: 0.5 },

    divider: { height: 1, backgroundColor: c.rule },

    reactionsRow: { flexDirection: "row", alignItems: "center", gap: space[4] },
    reactionItem: { flexDirection: "row", alignItems: "center", gap: space[1] },
    reactionEmoji: { fontSize: 20 },
    reactionCount: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: c.mute },

    exploreLink: { paddingVertical: space[1] },
    exploreLinkText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre },
  });
}
