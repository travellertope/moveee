import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { openInApp } from "../../utils/openInApp";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import TypeBadge from "../ui/TypeBadge";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

const VETTED_COLOR = "#2D6A4F";
const VETTED_BG    = "rgba(45,106,79,0.10)";

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function DirectoryDetailModal({ visible, item, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();

  const handleViewFull = () => {
    // Navigate to the rich detail screen if we have a slug/id, else web fallback
    if (item.linkedDirectoryId || item.slug) {
      onClose();
      nav.navigate("DirectoryDetail", {
        id: item.linkedDirectoryId,
        slug: item.slug,
        title: item.title,
        entryType: item.entryType,
      });
    } else if (item.href) {
      openInApp(item.href);
    }
  };

  const hasInstagram = item.communityTag && item.communityTag.startsWith("http");

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.body}>
        {/* Badges row */}
        <View style={styles.badgeRow}>
          <TypeBadge type="directory" />
          {item.entryType && (
            <View style={styles.entryTypeBadge}>
              <Text style={styles.entryTypeText}>{item.entryType.toUpperCase()}</Text>
            </View>
          )}
        </View>

        {/* Name + city */}
        <Text style={styles.title}>{item.title}</Text>
        {(item.city || item.location) && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={13} color={c.mute} />
            <Text style={styles.locationText}>
              {[item.location, item.city].filter(Boolean).join(", ")}
            </Text>
          </View>
        )}

        {/* Vetted badge */}
        <View style={styles.vettedBadge}>
          <Text style={styles.vettedText}>✓ Vetted by Moveee</Text>
        </View>

        {/* Excerpt */}
        {item.excerpt ? (
          <Text style={styles.excerpt}>{item.excerpt}</Text>
        ) : null}

        {/* Image */}
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : null}

        {/* Body */}
        {item.body ? (
          <Text style={styles.body2}>{item.body}</Text>
        ) : null}

        <View style={styles.divider} />

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {item.href && (
            <TouchableOpacity style={styles.pillBtn} onPress={handleViewFull}>
              <Ionicons name="globe-outline" size={14} color={c.ink} />
              <Text style={styles.pillBtnText}>Website</Text>
            </TouchableOpacity>
          )}
          {hasInstagram && (
            <TouchableOpacity
              style={styles.pillBtn}
              onPress={() => openInApp(item.communityTag!)}
            >
              <Ionicons name="logo-instagram" size={14} color={c.ink} />
              <Text style={styles.pillBtnText}>Instagram</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* View full entry */}
        {item.href && (
          <TouchableOpacity style={styles.viewFullBtn} onPress={handleViewFull}>
            <Text style={styles.viewFullText}>View full entry →</Text>
          </TouchableOpacity>
        )}
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    body: { padding: space[4], gap: space[3] },

    badgeRow: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
    entryTypeBadge: {
      backgroundColor: c.badgeDirectoryBg,
      borderRadius: radius.sm,
      paddingHorizontal: space[2],
      paddingVertical: 2,
    },
    entryTypeText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.badgeDirectoryText,
      letterSpacing: 1.2,
    },

    title: { fontFamily: "Fraunces_700Bold", fontSize: 22, color: c.ink, lineHeight: 30 },

    locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    locationText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },

    vettedBadge: {
      alignSelf: "flex-start",
      backgroundColor: VETTED_BG,
      borderRadius: radius.full,
      paddingHorizontal: space[3],
      paddingVertical: space[1],
    },
    vettedText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: VETTED_COLOR,
    },

    excerpt: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.inkSoft, lineHeight: 22 },
    body2:   { fontFamily: fonts.sans,     fontSize: fontSize.base, color: c.inkSoft, lineHeight: 22 },

    image: { width: "100%", height: 180, borderRadius: radius.lg, backgroundColor: c.paperDeep },

    divider: { height: 1, backgroundColor: c.rule },

    actionRow: { flexDirection: "row", gap: space[3], flexWrap: "wrap" },
    pillBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: space[2],
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.full,
      paddingHorizontal: space[4],
      paddingVertical: space[2],
    },
    pillBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },

    viewFullBtn: {
      borderWidth: 1,
      borderColor: c.badgeDirectoryText,
      borderRadius: radius.md,
      paddingVertical: space[2] + 2,
      alignItems: "center",
    },
    viewFullText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.badgeDirectoryText,
    },
  });
}
