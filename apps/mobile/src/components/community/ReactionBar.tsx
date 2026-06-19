import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Share, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space } from "../../theme";
import type { ColorPalette } from "../../theme";
import { ReportSheet } from "../ui/Overlays";

type EmojiKey = "love" | "fire" | "clap";
type ReactionCounts = { love: number; fire: number; clap: number };

interface Props {
  postId: string;
  initialCounts: ReactionCounts;
  // The user's current reaction on this post, from the feed/detail item's
  // `userReaction` field (server-truth, `_culture_post_reactions` usermeta) —
  // without this every ReactionBar instance defaults to "not reacted" on
  // mount even when the user already reacted, since the API toggle endpoint
  // only reports state changes, not the current state.
  initialReaction?: EmojiKey | null;
  shareUrl?: string;
  shareTitle?: string;
  noBorder?: boolean;
  commentCount?: number;
  onCommentPress?: () => void;
  showReport?: boolean;
  // Controlled mode — pass these when rendering more than one ReactionBar for the
  // same postId (e.g. ArticleScreen's top + bottom bars) so they stay in sync.
  // Omit them to keep the bar self-managed, as every other usage does.
  counts?: ReactionCounts;
  reacted?: Set<EmojiKey>;
  onReact?: (key: EmojiKey) => void;
}

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
  postId, initialCounts, initialReaction, shareUrl, shareTitle, noBorder, commentCount, onCommentPress, showReport,
  counts: controlledCounts, reacted: controlledReacted, onReact: controlledOnReact,
}: Props) {
  const c = useColors();
  const styles = createStyles(c);
  const [localCounts, setLocalCounts]   = useState(initialCounts);
  const [localReacted, setLocalReacted] = useState<Set<EmojiKey>>(
    () => new Set(initialReaction ? [initialReaction] : [])
  );
  const [reportOpen, setReportOpen] = useState(false);
  const [reported, setReported] = useState(false);

  const isControlled = controlledCounts !== undefined && controlledReacted !== undefined && controlledOnReact !== undefined;
  const counts  = isControlled ? controlledCounts! : localCounts;
  const reacted = isControlled ? controlledReacted! : localReacted;
  const setCounts  = setLocalCounts;
  const setReacted = setLocalReacted;

  const submitReport = async (reason: "spam" | "harassment" | "inappropriate") => {
    setReportOpen(false);
    try {
      await api.post(`${MOBILE_API}/community/report`, { post_id: Number(postId), reason });
      setReported(true);
    } catch { /* silent */ }
  };

  const uncontrolledHandleReact = async (key: EmojiKey) => {
    const already  = reacted.has(key);
    const prevReaction = already ? key : (Array.from(reacted)[0] ?? null);
    const prevCounts   = counts;

    // Optimistic update — only one reaction type can be active per user,
    // matching the server's per-user/per-post toggle-or-switch semantics.
    setCounts((prev) => {
      const next = { ...prev };
      if (prevReaction && prevReaction !== key) {
        next[prevReaction] = Math.max(0, next[prevReaction] - 1);
      }
      next[key] = Math.max(0, next[key] + (already ? -1 : 1));
      return next;
    });
    setReacted(new Set(already ? [] : [key]));

    try {
      const res = await api.post<{ reactionType: EmojiKey | null; reactions: ReactionCounts }>(
        `${MOBILE_API}/community/react`,
        { post_id: Number(postId), type: key }
      );
      setCounts(res.reactions);
      setReacted(new Set(res.reactionType ? [res.reactionType] : []));
    } catch {
      // revert
      setCounts(prevCounts);
      setReacted(new Set(prevReaction ? [prevReaction] : []));
    }
  };

  const handleReact = controlledOnReact ?? uncontrolledHandleReact;

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

      {showReport ? (
        reported ? (
          <Ionicons name="flag" size={14} color={c.ochre} style={styles.shareBtn} />
        ) : (
          <>
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => setReportOpen(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="flag-outline" size={14} color={c.ghost} />
            </TouchableOpacity>
            <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onSubmit={submitReport} />
          </>
        )
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
