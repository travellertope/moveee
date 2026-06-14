import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space } from "../../theme";
import type { ColorPalette } from "../../theme";

interface Props {
  postId: string;
  initialCounts: { love: number; fire: number; clap: number };
  shareUrl?: string;
  shareTitle?: string;
  noBorder?: boolean;
  commentCount?: number;
  onCommentPress?: () => void;
}

type EmojiKey = "love" | "fire" | "clap";

const REACTIONS: Array<{
  key: EmojiKey;
  outlineIcon: string;
  filledIcon: string;
  activeColor: string;
}> = [
  { key: "love", outlineIcon: "heart-outline",      filledIcon: "heart",      activeColor: "#E53E3E" },
  { key: "fire", outlineIcon: "flame-outline",      filledIcon: "flame",      activeColor: "#F97316" },
  { key: "clap", outlineIcon: "hand-left-outline",  filledIcon: "hand-left",  activeColor: "#B38238" },
];

export default function ReactionBar({
  postId, initialCounts, shareUrl, shareTitle, noBorder, commentCount, onCommentPress,
}: Props) {
  const c = useColors();
  const styles = createStyles(c);
  const [counts, setCounts]   = useState(initialCounts);
  const [reacted, setReacted] = useState<Set<EmojiKey>>(new Set());

  const handleReact = async (key: EmojiKey) => {
    const already = reacted.has(key);
    setCounts((prev) => ({ ...prev, [key]: prev[key] + (already ? -1 : 1) }));
    setReacted((prev) => {
      const next = new Set(prev);
      already ? next.delete(key) : next.add(key);
      return next;
    });
    try {
      await api.post(`${MOBILE_API}/community/react`, { post_id: Number(postId), type: key });
    } catch {
      // revert
      setCounts((prev) => ({ ...prev, [key]: prev[key] + (already ? 1 : -1) }));
      setReacted((prev) => {
        const next = new Set(prev);
        already ? next.add(key) : next.delete(key);
        return next;
      });
    }
  };

  const handleShare = () => {
    if (!shareUrl) return;
    const label = shareTitle ?? "Check this out on Moveee";
    Share.share(
      Platform.OS === "ios"
        ? { url: shareUrl, message: label }
        : { message: `${label}\n${shareUrl}`, title: label }
    ).catch(() => {});
  };

  return (
    <View style={[styles.bar, noBorder && styles.barNoBorder]}>
      {REACTIONS.map(({ key, outlineIcon, filledIcon, activeColor }) => {
        const active = reacted.has(key);
        return (
          <TouchableOpacity key={key} style={styles.btn} onPress={() => handleReact(key)} activeOpacity={0.7}>
            <Ionicons
              name={(active ? filledIcon : outlineIcon) as any}
              size={17}
              color={active ? activeColor : c.mute}
            />
            <Text style={[styles.count, active && { color: activeColor }]}>{counts[key]}</Text>
          </TouchableOpacity>
        );
      })}

      {commentCount !== undefined && (
        <TouchableOpacity style={styles.btn} onPress={onCommentPress} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={17} color={c.mute} />
          <Text style={styles.count}>{commentCount}</Text>
        </TouchableOpacity>
      )}

      <View style={{ flex: 1 }} />

      {shareUrl ? (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={16} color={c.mute} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    bar: {
      flexDirection: "row", alignItems: "center", gap: space[3],
      paddingTop: space[2] + 2, marginTop: space[1] + 2,
      borderTopWidth: 1, borderTopColor: c.rule,
    },
    barNoBorder: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
    btn:      { flexDirection: "row", alignItems: "center", gap: 5 },
    count:    { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    shareBtn: { padding: 4 },
  });
}
