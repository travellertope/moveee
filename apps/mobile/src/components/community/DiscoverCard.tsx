import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { ColorPalette } from "../../theme";
import { fonts, fontSize, space, radius, shadows } from "../../theme";

export interface DiscoverEntry {
  id: number;
  title: string;
  slug: string;
  type: string;
  subtype?: string;
  excerpt?: string;
  thumbnail: string | null;
  city: string;
  averageRating: number | null;
  reviewCount: number;
  dateAdded: string;
  isNew: boolean;
}

export const TYPE_BADGE: Record<string, { emoji: string; label: string; color: string }> = {
  person:      { emoji: "👤", label: "PERSON",    color: "#B38238" },
  place:       { emoji: "🏛",  label: "PLACE",     color: "#2E7D32" },
  food:        { emoji: "🍽",  label: "FOOD",      color: "#C5491F" },
  book:        { emoji: "📚", label: "BOOK",      color: "#78350F" },
  film:        { emoji: "🎬", label: "FILM",      color: "#1976D2" },
  genre:       { emoji: "🎵", label: "GENRE",     color: "#6B48A8" },
  movement:    { emoji: "🌊", label: "MOVEMENT",  color: "#6B48A8" },
  artwork:     { emoji: "🎨", label: "ARTWORK",   color: "#1976D2" },
  concept:     { emoji: "💡", label: "CONCEPT",   color: "#3A342B" },
  fashion:     { emoji: "👗", label: "FASHION",   color: "#7B1FA2" },
  "tv-series": { emoji: "📺", label: "TV SERIES", color: "#00695C" },
};
const DEFAULT_BADGE = { emoji: "✦", label: "ENTRY", color: "#7A6F5C" };

function daysAgo(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function StarRating({ rating, color }: { rating: number; color: string }) {
  const full = Math.round(rating);
  return (
    <Text style={{ fontFamily: fonts.mono, fontSize: fontSize.xs, fontWeight: "700", color }}>
      {"★".repeat(full)}
      <Text style={{ fontWeight: "400", opacity: 0.4 }}>{"☆".repeat(5 - full)}</Text> {rating.toFixed(1)}
    </Text>
  );
}

interface Props {
  entry: DiscoverEntry;
  c: ColorPalette;
  compact?: boolean;
  onPress: (entry: DiscoverEntry) => void;
}

export default function DiscoverCard({ entry, c, compact, onPress }: Props) {
  const styles = createStyles(c);
  const badge = TYPE_BADGE[entry.type] ?? DEFAULT_BADGE;

  return (
    <TouchableOpacity
      style={[styles.card, compact && styles.cardCompact]}
      activeOpacity={0.7}
      onPress={() => onPress(entry)}
    >
      <View>
        <Text style={[styles.typeLabel, { color: badge.color }]}>
          {badge.emoji} {badge.label}
        </Text>
        <Text style={styles.title} numberOfLines={2}>{entry.title}</Text>
        {!compact && entry.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={3}>{entry.excerpt}</Text>
        ) : null}
      </View>
      <View>
        {entry.city ? <Text style={styles.city}>📍 {entry.city}</Text> : null}
        {compact ? (
          <Text style={entry.isNew ? styles.newBadge : styles.agePlain}>
            {entry.isNew ? "🆕 Added today" : `Added ${daysAgo(entry.dateAdded)}d ago`}
          </Text>
        ) : (
          (entry.averageRating || entry.subtype) && (
            <View style={styles.footerRow}>
              {entry.averageRating ? (
                <StarRating rating={entry.averageRating} color={c.gold} />
              ) : (
                <View />
              )}
              {entry.subtype ? (
                <View style={styles.subtypePill}>
                  <Text style={styles.subtypeText}>{entry.subtype}</Text>
                </View>
              ) : null}
            </View>
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (c: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: c.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.rule,
      padding: space[3],
      minHeight: 120,
      justifyContent: "space-between",
      ...shadows.card,
    },
    cardCompact: {
      width: 140,
      height: 110,
    },
    typeLabel: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.tiny,
      letterSpacing: 0.4,
      marginBottom: 4,
    },
    title: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      lineHeight: 17,
    },
    excerpt: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.inkSoft,
      lineHeight: 16,
      marginTop: 6,
    },
    city: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      marginTop: 4,
    },
    newBadge: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      fontWeight: "700",
      color: c.ochre,
      marginTop: 6,
    },
    agePlain: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
      marginTop: 6,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: c.rule,
      marginTop: 8,
      paddingTop: 6,
    },
    subtypePill: {
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.full,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    subtypeText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.tiny,
      color: c.inkSoft,
    },
  });
