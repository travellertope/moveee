import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space } from "../../theme";

interface Props {
  postId: string;
  initialCounts: { love: number; fire: number; clap: number };
  shareUrl?: string;
  noBorder?: boolean;
}

type EmojiKey = "love" | "fire" | "clap";
const EMOJIS: Array<{ key: EmojiKey; emoji: string }> = [
  { key: "love", emoji: "❤️" },
  { key: "fire", emoji: "🔥" },
  { key: "clap", emoji: "👏" },
];

export default function ReactionBar({ postId, initialCounts, shareUrl, noBorder }: Props) {
  const [counts, setCounts] = useState(initialCounts);
  const [reacted, setReacted] = useState<Set<EmojiKey>>(new Set());

  const handleReact = async (key: EmojiKey) => {
    const already = reacted.has(key);
    // Optimistic
    setCounts((c) => ({ ...c, [key]: c[key] + (already ? -1 : 1) }));
    setReacted((r) => {
      const next = new Set(r);
      already ? next.delete(key) : next.add(key);
      return next;
    });
    try {
      await api.post(`${CULTURE_API}/community/react`, { post_id: Number(postId), type: key });
    } catch {
      // Revert on error
      setCounts((c) => ({ ...c, [key]: c[key] + (already ? 1 : -1) }));
      setReacted((r) => {
        const next = new Set(r);
        already ? next.add(key) : next.delete(key);
        return next;
      });
    }
  };

  const handleShare = () => {
    if (!shareUrl) return;
    Share.share(Platform.OS === "ios" ? { url: shareUrl } : { message: shareUrl }).catch(() => {});
  };

  return (
    <View style={[styles.bar, noBorder && styles.barNoBorder]}>
      {EMOJIS.map(({ key, emoji }) => (
        <TouchableOpacity key={key} style={styles.btn} onPress={() => handleReact(key)}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.count}>{counts[key]}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ flex: 1 }} />
      {shareUrl ? (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={14} color={colors.mute} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    paddingTop: space[2] + 2, marginTop: space[1] + 2,
    borderTopWidth: 1, borderTopColor: colors.rule,
  },
  barNoBorder: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  btn:       { flexDirection: "row", alignItems: "center", gap: 5 },
  emoji:     { fontSize: 14 },
  count:     { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },
  shareBtn:  { padding: 4 },
});
