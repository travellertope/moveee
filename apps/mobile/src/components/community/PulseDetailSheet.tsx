import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Share,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons";
import { openInApp } from "../../utils/openInApp";
import BottomSheet from "../ui/BottomSheet";
import { useComments } from "../../features/community/useComments";
import { useAuthStore } from "../../auth/authStore";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

const PLACEHOLDER_AVATAR =
  "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

function formatLongDate(str: string): string {
  if (!str) return "";
  return new Date(str).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function PulseDetailSheet({ visible, item, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const postId = (item as any).wpId ?? "";
  const { comments, loading, addComment } = useComments(postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const HTML_TAG_STYLES = {
    p: {
      fontSize: 15,
      lineHeight: 25,
      color: c.inkSoft,
      fontFamily: SERIF,
      marginBottom: 12,
    },
    a: { color: c.gold, textDecorationLine: "underline" as const },
  };

  const handleShare = () => {
    if (!item.slug) return;
    const url = `https://connect.themoveee.com/pulse/${item.slug}`;
    Share.share(
      Platform.OS === "ios"
        ? { url, message: item.title ?? "Check this out on Moveee" }
        : {
            message: `${item.title ?? "Check this out on Moveee"}\n${url}`,
            title: "Share",
          }
    ).catch(() => {});
  };

  const handleSource = () => {
    if (item.sourceUrl) openInApp(item.sourceUrl);
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

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Hero image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
      ) : null}

      <View style={styles.body}>
        {/* Meta row */}
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <View style={styles.pulseBadge}>
              <Text style={styles.pulseBadgeText}>⚡ PULSE</Text>
            </View>
            {item.region ? (
              <Text style={styles.regionTag}>{item.region}</Text>
            ) : null}
          </View>
          {item.slug ? (
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={16} color={c.mute} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Date / source / curated badge */}
        <View style={styles.metaRow}>
          <Text style={styles.metaDate}>{formatLongDate(item.date)}</Text>
          {item.source ? (
            <Text style={styles.metaVia}>
              Via{" "}
              <Text style={styles.metaSource}>{item.source}</Text>
            </Text>
          ) : null}
          <View style={styles.curatedBadge}>
            <Text style={styles.curatedBadgeText}>Curated with AI</Text>
          </View>
        </View>

        {/* Body HTML or plain excerpt */}
        {item.body ? (
          <RenderHtml
            contentWidth={width - 48}
            source={{ html: item.body }}
            tagsStyles={HTML_TAG_STYLES}
          />
        ) : item.excerpt ? (
          <Text style={styles.bodyText}>{item.excerpt}</Text>
        ) : null}

        {/* Source preview card */}
        {item.sourceUrl ? (
          <TouchableOpacity
            style={styles.sourceCard}
            onPress={handleSource}
            activeOpacity={0.85}
          >
            {item.ogImage ? (
              <Image
                source={{ uri: item.ogImage }}
                style={styles.sourceImage}
                resizeMode="cover"
              />
            ) : null}
            <View style={styles.sourceBody}>
              {item.source ? (
                <Text style={styles.sourceName} numberOfLines={1}>
                  {item.source.toUpperCase()}
                </Text>
              ) : null}
              {item.ogTitle ? (
                <Text style={styles.sourceTitle} numberOfLines={2}>
                  {item.ogTitle}
                </Text>
              ) : null}
              {item.ogDescription ? (
                <Text style={styles.sourceDesc} numberOfLines={2}>
                  {item.ogDescription}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : null}

        <View style={styles.divider} />

        {/* Comments section */}
        <Text style={styles.commentsLabel}>Start the conversation</Text>

        {loading ? (
          <ActivityIndicator color={c.gold} style={{ marginBottom: space[4] }} />
        ) : comments.length === 0 ? (
          <Text style={styles.emptyComments}>
            No comments yet — be the first to reply.
          </Text>
        ) : (
          comments.map((cm) => (
            <View key={cm.id} style={styles.comment}>
              <Image
                source={{ uri: cm.author.avatarUrl || PLACEHOLDER_AVATAR }}
                style={styles.commentAvatar}
              />
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>{cm.author.name}</Text>
                <Text style={styles.commentContent}>{cm.content}</Text>
              </View>
            </View>
          ))
        )}

        {/* Comment compose */}
        <View style={styles.composerWrap}>
          <Text style={styles.commentingAs}>
            Commenting as{" "}
            <Text style={styles.commentingAsName}>
              {user?.displayName ?? "you"}
            </Text>
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a comment…"
              placeholderTextColor={c.ghost}
              value={text}
              onChangeText={setText}
              multiline
            />
            <TouchableOpacity
              onPress={submit}
              disabled={submitting || !text.trim()}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={c.gold} />
              ) : (
                <Ionicons
                  name="send"
                  size={22}
                  color={text.trim() ? c.gold : c.ghost}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    hero: {
      width: "100%",
      height: 200,
      backgroundColor: c.paperDeep,
    },
    body: {
      padding: space[4],
      gap: space[3],
    },
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    topRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
    },
    pulseBadge: {
      backgroundColor: c.ink,
      borderRadius: radius.sm,
      paddingHorizontal: space[2],
      paddingVertical: 3,
    },
    pulseBadgeText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.paper,
      letterSpacing: 1.2,
    },
    regionTag: {
      fontFamily: fonts.mono,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 0.6,
      textTransform: "uppercase",
    },
    shareBtn: {
      padding: space[1],
    },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 22,
      color: c.ink,
      lineHeight: 30,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flexWrap: "wrap",
    },
    metaDate: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    metaVia: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    metaSource: {
      color: c.gold,
      fontFamily: fonts.sansBold,
    },
    curatedBadge: {
      backgroundColor: c.goldLight,
      borderRadius: radius.sm,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    curatedBadgeText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      letterSpacing: 1,
      textTransform: "uppercase",
      color: c.gold,
    },
    bodyText: {
      fontFamily: SERIF,
      fontSize: 15,
      lineHeight: 25,
      color: c.inkSoft,
    },
    sourceCard: {
      flexDirection: "row",
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.md,
      overflow: "hidden",
      backgroundColor: c.paperWarm,
    },
    sourceImage: {
      width: 96,
      backgroundColor: c.rule,
    },
    sourceBody: {
      flex: 1,
      padding: 10,
      justifyContent: "center",
      gap: 3,
    },
    sourceName: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.gold,
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    sourceTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      lineHeight: 18,
    },
    sourceDesc: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      lineHeight: 15,
    },
    divider: {
      height: 1,
      backgroundColor: c.rule,
    },
    commentsLabel: {
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
    },
    emptyComments: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ghost,
    },
    comment: {
      flexDirection: "row",
      gap: 10,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.rule,
    },
    commentBody: {
      flex: 1,
    },
    commentAuthor: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      marginBottom: 2,
    },
    commentContent: {
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.inkSoft,
      lineHeight: 20,
    },
    composerWrap: {
      gap: space[2],
      paddingTop: space[2],
    },
    commentingAs: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    commentingAsName: {
      fontFamily: fonts.sansBold,
      color: c.gold,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.xl,
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: c.paperWarm,
    },
    input: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.ink,
      maxHeight: 100,
    },
  });
}
