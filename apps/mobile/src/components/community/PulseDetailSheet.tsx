import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
  useWindowDimensions,
} from "react-native";
import RenderHtml from "react-native-render-html";
import { Ionicons } from "@expo/vector-icons";
import { openInApp } from "../../utils/openInApp";
import BottomSheet from "../ui/BottomSheet";
import CommentSection from "./CommentSection";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

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
  const postId = (item as any).wpId ?? "";

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
    const url = `https://web.themoveee.com/pulse/${item.slug}`;
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

        {/* Comments section — shared component, see CommentSection.tsx */}
        <CommentSection postId={postId} />
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
  });
}
