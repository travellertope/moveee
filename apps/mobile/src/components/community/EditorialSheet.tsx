import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Alert } from "react-native";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

function timeAgoShort(d: string): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function EditorialSheet({ visible, item, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const sectionLabel = item.source ?? item.arm ?? "The Culture Brief";
  const articleUrl = item.href ?? item.sourceUrl;

  const handleReadFull = () => {
    if (articleUrl) Linking.openURL(articleUrl);
  };

  const handleSave = () => {
    Alert.alert("Saved", "Article saved for later.");
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Full-bleed hero image */}
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
      ) : (
        <View style={styles.heroFallback} />
      )}

      <View style={styles.body}>
        {/* Top row: editorial badge + category */}
        <View style={styles.topRow}>
          <View style={styles.editorialBadge}>
            <Text style={styles.editorialBadgeText}>EDITORIAL</Text>
          </View>
          {(item.category ?? item.arm) && (
            <Text style={styles.categoryMono}>
              {(item.category ?? item.arm ?? "").toUpperCase()}
            </Text>
          )}
        </View>

        {/* Section label */}
        <Text style={styles.sectionLabel}>{sectionLabel.toUpperCase()}</Text>

        {/* Headline */}
        <Text style={styles.headline}>{item.title}</Text>

        {/* Excerpt / body */}
        {(item.excerpt ?? item.body) ? (
          <Text style={styles.bodyText}>{item.excerpt ?? item.body}</Text>
        ) : null}

        {/* Author row */}
        <View style={styles.authorRow}>
          {item.communityAuthorAvatar ? (
            <Image
              source={{ uri: item.communityAuthorAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>
                {(item.communityAuthor ?? item.source ?? "M")[0]?.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.authorMeta}>
            <Text style={styles.authorName}>
              {item.communityAuthor ?? item.source ?? "Moveee"}
            </Text>
            <Text style={styles.authorSub}>
              {timeAgoShort(item.date)}
              {item.readTime ? ` · ${item.readTime} min read` : ""}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Read full article CTA */}
        {articleUrl ? (
          <TouchableOpacity style={styles.readBtn} onPress={handleReadFull}>
            <Text style={styles.readBtnText}>Read full article →</Text>
          </TouchableOpacity>
        ) : null}

        {/* Save for later */}
        <TouchableOpacity style={styles.saveLink} onPress={handleSave}>
          <Text style={styles.saveLinkText}>Save for later</Text>
        </TouchableOpacity>

        <View style={styles.divider} />
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    hero: { width: "100%", height: 200, backgroundColor: c.paperDeep },
    heroFallback: { width: "100%", height: 200, backgroundColor: c.paperDeep },

    body: { padding: space[4], gap: space[3] },

    topRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
    editorialBadge: {
      backgroundColor: c.badgeEditorialBg,
      borderRadius: radius.sm,
      paddingHorizontal: space[2],
      paddingVertical: 2,
    },
    editorialBadgeText: {
      fontFamily: "JetBrainsMono_400Regular",
      fontSize: fontSize.eyebrow,
      color: c.badgeEditorialText,
      letterSpacing: 1.2,
    },
    categoryMono: {
      fontFamily: "JetBrainsMono_400Regular",
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 1.2,
      flex: 1,
    },

    sectionLabel: {
      fontFamily: "JetBrainsMono_400Regular",
      fontSize: 9,
      color: c.gold,
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },

    headline: {
      fontFamily: "Fraunces_700Bold",
      fontSize: 22,
      color: c.ink,
      lineHeight: 30,
    },

    bodyText: {
      fontFamily: "DMSans_400Regular",
      fontSize: fontSize.base,
      color: c.inkSoft,
      lineHeight: 22,
    },

    authorRow: { flexDirection: "row", alignItems: "center", gap: space[3] },
    avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.paperDeep },
    avatarFallback: { justifyContent: "center", alignItems: "center", backgroundColor: c.goldLight },
    avatarInitial: { fontFamily: "DMSans_400Regular", fontSize: fontSize.sm, color: c.gold },
    authorMeta: { flex: 1 },
    authorName: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    authorSub:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },

    divider: { height: 1, backgroundColor: c.rule },

    readBtn: {
      backgroundColor: c.ochre,
      borderRadius: radius.lg,
      paddingVertical: space[3],
      alignItems: "center",
    },
    readBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    saveLink: { alignItems: "center", paddingVertical: space[1] },
    saveLinkText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
  });
}
