import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useNav } from "../../hooks/useNav";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";
import HappeningDetailModal from "./HappeningDetailModal";

const CATEGORY_COLORS: Record<string, string> = {
  music: "#C5491F",
  nightlife: "#7B1FA2",
  food: "#B38238",
  film: "#1976D2",
  art: "#6B48A8",
  literature: "#78350F",
  community: "#2D6A4F",
  performance: "#00695C",
  tech: "#3A342B",
};

function categoryColor(category?: string): string {
  if (!category) return "#7A6F5C";
  const lower = category.toLowerCase();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (lower.includes(key)) return CATEGORY_COLORS[key];
  }
  return "#7A6F5C";
}

function formatEventDate(dateStr?: string): { date: string; time: string } {
  if (!dateStr) return { date: "", time: "" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const date = d.toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  return { date, time };
}

function SpotlightCard({
  item,
  c,
  styles,
  onOpen,
}: {
  item: FeedItem;
  c: ColorPalette;
  styles: ReturnType<typeof createStyles>;
  onOpen: () => void;
}) {
  const { date, time } = formatEventDate(item.eventDate || item.date);
  const venue = item.venueAddress || item.location || "";
  const isCommunity = item.type === "community";
  const isFree = !item.admission || /^free$/i.test(item.admission.trim());

  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onOpen} style={styles.card}>
      {item.isFeatured && <View style={styles.featuredBar} />}
      <View style={styles.cardTopRow}>
        <View style={styles.categoryRow}>
          <View style={[styles.categoryDot, { backgroundColor: categoryColor(item.eventCategory) }]} />
          <Text style={styles.categoryLabel} numberOfLines={1}>
            {item.eventCategory || "Event"}
          </Text>
        </View>
        {item.isFeatured && <Text style={styles.starIcon}>★</Text>}
      </View>
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>{date}</Text>
        {!!time && <Text style={styles.timeText}>{time}</Text>}
      </View>
      <View style={styles.bodyCol}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        {!!venue && (
          <Text style={styles.venueText} numberOfLines={1}>
            📍 {venue}
          </Text>
        )}
      </View>
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          <Text style={[styles.priceText, !isFree && styles.priceTextPaid]}>
            {isFree ? "Free" : item.admission}
          </Text>
          {isCommunity && (
            <View style={styles.communityPill}>
              <Text style={styles.communityPillText}>🌱 Community</Text>
            </View>
          )}
        </View>
        {Number(item.rsvpCount) > 0 && (
          <Text style={styles.rsvpText}>👥 {item.rsvpCount} going</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function EventSpotlightCarousel({
  events,
  onOpenCommunity,
}: {
  events: FeedItem[];
  onOpenCommunity: (item: FeedItem) => void;
}) {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [activeHappening, setActiveHappening] = useState<FeedItem | null>(null);

  if (events.length < 2) return null;

  const handleOpen = (item: FeedItem) => {
    if (item.type === "happening") {
      setActiveHappening(item);
    } else {
      onOpenCommunity(item);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>📅 Upcoming Near You</Text>
        <TouchableOpacity onPress={() => nav.navigate("Events", { screen: "EventsList" } as any)}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
      >
        {events.map((item) => (
          <SpotlightCard key={item.id} item={item} c={c} styles={styles} onOpen={() => handleOpen(item)} />
        ))}
      </ScrollView>

      {activeHappening && (
        <HappeningDetailModal
          visible={activeHappening !== null}
          item={activeHappening}
          onClose={() => setActiveHappening(null)}
        />
      )}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrapper: {
      backgroundColor: c.paperWarm,
      paddingVertical: space[4],
      marginBottom: space[6],
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.rule,
    },
    headerRow: {
      paddingHorizontal: space[4],
      marginBottom: space[3],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    seeAll: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: c.ochre,
    },
    scrollContent: {
      paddingHorizontal: space[4],
      gap: space[3],
    },
    card: {
      width: 236,
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      position: "relative",
      ...shadows.card,
    },
    featuredBar: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: c.gold,
    },
    cardTopRow: {
      paddingHorizontal: space[3],
      paddingTop: space[3],
      paddingBottom: space[2],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    categoryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    categoryDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    categoryLabel: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.tiny,
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    starIcon: {
      color: c.gold,
      fontSize: fontSize.sm,
    },
    dateRow: {
      paddingHorizontal: space[3],
      flexDirection: "row",
      alignItems: "baseline",
      gap: 6,
      marginTop: space[2],
    },
    dateText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.xs,
      color: c.ochre,
      textTransform: "uppercase",
    },
    timeText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    bodyCol: {
      paddingHorizontal: space[3],
      marginTop: space[2],
      minHeight: 70,
    },
    title: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.ink,
      lineHeight: fontSize.base * 1.3,
    },
    venueText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      marginTop: 4,
    },
    footerRow: {
      margin: space[3],
      marginTop: space[2],
      paddingTop: space[2],
      borderTopWidth: 1,
      borderColor: c.rule,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    priceText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.inkSoft,
    },
    priceTextPaid: {
      fontFamily: fonts.sansBold,
      color: c.ochre,
    },
    communityPill: {
      backgroundColor: c.communityBg,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.full,
    },
    communityPillText: {
      fontFamily: fonts.sansBold,
      fontSize: 9,
      color: c.communityText,
      textTransform: "uppercase",
    },
    rsvpText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
    },
  });
}
