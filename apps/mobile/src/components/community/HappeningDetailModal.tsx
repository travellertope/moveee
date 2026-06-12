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
const SHEET_H = SCREEN_H * 0.85;

function fmtDate(str: string): string {
  try {
    return new Date(str).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch { return str; }
}

function fmtDateRange(start: string, end?: string | null): string {
  const s = new Date(start);
  const startStr = s.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (!end) return fmtDate(start);
  const e = new Date(end);
  if (s.toDateString() === e.toDateString()) return fmtDate(start);
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return `${s.getDate()}–${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return `${startStr} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
}

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function HappeningDetailModal({ visible, item, onClose }: Props) {
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

  const handleTickets = () => {
    if (item.href) Linking.openURL(item.href);
  };

  const handleOrganiser = () => {
    if (item.organiserSlug) {
      Linking.openURL(`https://themoveee.com/directory/${item.organiserSlug}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        {/* Handle + close */}
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

          {/* Badges */}
          <View style={styles.badgeRow}>
            <TypeBadge type="happening" />
            {item.eventCategory && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{item.eventCategory.toUpperCase()}</Text>
              </View>
            )}
          </View>

          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Meta card */}
          <View style={styles.metaCard}>
            {item.eventDate && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaValue}>{fmtDateRange(item.eventDate, item.endDate)}</Text>
                </View>
              </View>
            )}
            {(item.location || item.venueAddress || item.city) && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="location-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>LOCATION</Text>
                  {item.location    && <Text style={styles.metaValue}>{item.location}</Text>}
                  {item.venueAddress && <Text style={styles.metaValueSub}>{item.venueAddress}</Text>}
                  {item.city        && <Text style={styles.metaValueSub}>{item.city}</Text>}
                </View>
              </View>
            )}
            {item.openingHours && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="time-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>HOURS</Text>
                  <Text style={styles.metaValue}>{item.openingHours}</Text>
                </View>
              </View>
            )}
            {item.admission && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="ticket-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>ADMISSION</Text>
                  <Text style={styles.metaValue}>{item.admission}</Text>
                </View>
              </View>
            )}
            {item.organiserName && (
              <TouchableOpacity
                style={[styles.metaRow, styles.metaRowBorder]}
                onPress={item.organiserSlug ? handleOrganiser : undefined}
                disabled={!item.organiserSlug}
              >
                <Ionicons name="person-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>ORGANISER</Text>
                  <Text style={[styles.metaValue, item.organiserSlug && styles.metaValueLink]}>
                    {item.organiserName}{item.organiserSlug ? " →" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Description */}
          {item.excerpt ? (
            <Text style={styles.description}>{item.excerpt}</Text>
          ) : null}
          {item.body ? (
            <Text style={styles.description}>{item.body}</Text>
          ) : null}

          {/* CTA */}
          {item.href && (
            <TouchableOpacity style={styles.ctaBtn} onPress={handleTickets}>
              <Ionicons name="ticket-outline" size={18} color={colors.paper} />
              <Text style={styles.ctaBtnText}>Get Tickets / Find Out More</Text>
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
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ghost },
  closeBtn: { position: "absolute", right: space[4], padding: 4 },

  body: { padding: space[4], gap: space[4], paddingBottom: space[10] },

  hero: { width: "100%", height: 200, borderRadius: radius.lg, backgroundColor: colors.paperDeep },

  badgeRow: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
  catBadge: {
    backgroundColor: colors.badgeHappeningBg, borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: 2,
  },
  catBadgeText: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.badgeHappeningText, letterSpacing: 1.2 },

  title: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, lineHeight: 28 },

  metaCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, overflow: "hidden",
  },
  metaRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[3], padding: space[3] },
  metaRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  metaLabel:     { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1.2, marginBottom: 2 },
  metaValue:     { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  metaValueSub:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },
  metaValueLink: { color: colors.badgeHappeningText },

  description: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft, lineHeight: 22 },

  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space[2],
    backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: space[3],
  },
  ctaBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },
});
