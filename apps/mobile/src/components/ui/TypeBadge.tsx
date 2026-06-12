import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, fontSize, radius } from "../../theme";
import type { FeedItemType } from "../../types";

const TYPE_META: Record<FeedItemType, { label: string; bg: string; color: string }> = {
  pulse:     { label: "PULSE",     bg: colors.badgePulseBg,     color: colors.badgePulseText },
  editorial: { label: "EDITORIAL", bg: colors.badgeEditorialBg, color: colors.badgeEditorialText },
  happening: { label: "HAPPENING", bg: colors.badgeHappeningBg, color: colors.badgeHappeningText },
  directory: { label: "DIRECTORY", bg: colors.badgeDirectoryBg, color: colors.badgeDirectoryText },
  quote:     { label: "QUOTE",     bg: colors.badgeQuoteBg,     color: colors.badgeQuoteText },
  community: { label: "COMMUNITY", bg: colors.communityBg,      color: colors.communityText },
};

interface Props {
  type: FeedItemType;
}

export default function TypeBadge({ type }: Props) {
  const meta = TYPE_META[type] ?? TYPE_META.community;
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.text, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3 },
  text:  { fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1 },
});
