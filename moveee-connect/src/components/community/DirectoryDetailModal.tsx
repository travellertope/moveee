import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, ScrollView, TouchableOpacity, Linking,
  Animated, StyleSheet, Dimensions, Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TypeBadge from "../ui/TypeBadge";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { FeedItem } from "../../types";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.80;

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function DirectoryDetailModal({ visible, item, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H, 0],
  });
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  const handleViewFull = () => {
    if (item.href) Linking.openURL(item.href);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHeader}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Hero image */}
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
          ) : null}

          {/* Type + entry type badges */}
          <View style={styles.badgeRow}>
            <TypeBadge type="directory" />
            {item.entryType && (
              <View style={styles.entryTypeBadge}>
                <Text style={styles.entryTypeText}>{item.entryType.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Name */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Location line */}
          {(item.city || item.location) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={colors.mute} />
              <Text style={styles.locationText}>
                {[item.location, item.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Excerpt */}
          {item.excerpt ? (
            <Text style={styles.excerpt}>{item.excerpt}</Text>
          ) : null}

          {/* Full body */}
          {item.body ? (
            <Text style={styles.body2}>{item.body}</Text>
          ) : null}

          {/* View full entry */}
          {item.href && (
            <TouchableOpacity style={styles.viewFullBtn} onPress={handleViewFull}>
              <Text style={styles.viewFullText}>View full entry →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: colors.paperWarm,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHeader: {
    alignItems: "center", paddingTop: space[2], paddingBottom: space[1],
    paddingHorizontal: space[4],
    flexDirection: "row", justifyContent: "center",
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ghost },
  closeBtn: { position: "absolute", right: space[4], padding: 4 },

  body: { padding: space[4], gap: space[3], paddingBottom: space[10] },

  hero: { width: "100%", height: 180, borderRadius: radius.lg, backgroundColor: colors.paperDeep },

  badgeRow: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  entryTypeBadge: {
    backgroundColor: colors.badgeDirectoryBg, borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: 2,
  },
  entryTypeText: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.badgeDirectoryText, letterSpacing: 1.2 },

  title: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, lineHeight: 28 },

  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  divider: { height: 1, backgroundColor: colors.rule },

  excerpt: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.inkSoft, lineHeight: 22 },
  body2:   { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft, lineHeight: 22 },

  viewFullBtn: {
    borderWidth: 1, borderColor: colors.badgeDirectoryText,
    borderRadius: radius.md, paddingVertical: space[2] + 2,
    alignItems: "center",
  },
  viewFullText: {
    fontFamily: fonts.sansBold, fontSize: fontSize.base,
    color: colors.badgeDirectoryText,
  },
});
