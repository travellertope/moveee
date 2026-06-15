import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import TypeBadge from "../ui/TypeBadge";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import type { FeedItem } from "../../types";

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
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const isPatron = user?.tier === "patron";
  const isPatronOnly = item.communityTier === "patron";

  const handleTickets = () => {
    if (item.href) Linking.openURL(item.href);
  };

  const handleOrganiser = () => {
    if (item.organiserSlug) {
      Linking.openURL(`https://themoveee.com/directory/${item.organiserSlug}`);
    }
  };

  const handleUpgrade = () => {
    Linking.openURL("https://connect.themoveee.com/register?upgrade=patron");
  };

  const handleCalendar = () => {
    // Placeholder — deep-link to calendar app
    if (item.eventDate) {
      Linking.openURL(`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(item.title ?? "")}&dates=${item.eventDate}`);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      {/* Hero image */}
      {item.image ? (
        <View style={styles.heroWrap}>
          <Image source={{ uri: item.image }} style={styles.hero} resizeMode="cover" />
          {isPatronOnly && !isPatron && (
            <View style={styles.heroOverlay}>
              <Text style={styles.heroOverlayText}>🔒 Connect Pro members only</Text>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.body}>
        {/* Badges */}
        <View style={styles.badgeRow}>
          <TypeBadge type="happening" />
          {isPatronOnly && (
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO ONLY</Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text style={styles.title}>{item.title}</Text>

        {/* Meta card */}
        <View style={styles.metaCard}>
          {item.eventDate && (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color={c.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>DATE</Text>
                <Text style={styles.metaValue}>{fmtDateRange(item.eventDate, item.endDate)}</Text>
                {item.openingHours && (
                  <Text style={styles.metaValueSub}>{item.openingHours}</Text>
                )}
              </View>
            </View>
          )}
          {(item.location || item.venueAddress || item.city) && (
            <View style={[styles.metaRow, styles.metaRowBorder]}>
              <Ionicons name="location-outline" size={16} color={c.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>LOCATION</Text>
                {item.location    && <Text style={styles.metaValue}>{item.location}</Text>}
                {item.venueAddress && <Text style={styles.metaValueSub}>{item.venueAddress}</Text>}
                {item.city        && <Text style={styles.metaValueSub}>{item.city}</Text>}
              </View>
            </View>
          )}
          {item.admission && (
            <View style={[styles.metaRow, styles.metaRowBorder]}>
              <Ionicons name="ticket-outline" size={16} color={c.gold} />
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
              <Ionicons name="person-outline" size={16} color={c.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>ORGANISER</Text>
                <Text style={[styles.metaValue, item.organiserSlug ? styles.metaValueLink : undefined]}>
                  {item.organiserName}{item.organiserSlug ? " →" : ""}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Description — prefer body (full text), fall back to excerpt */}
        {(item.body ?? item.excerpt) ? (
          <Text style={styles.description}>{item.body ?? item.excerpt}</Text>
        ) : null}

        <View style={styles.divider} />

        {/* CTAs */}
        {isPatronOnly && !isPatron ? (
          <TouchableOpacity style={styles.upgradeBtn} onPress={handleUpgrade}>
            <Text style={styles.upgradeBtnText}>Upgrade to Pro for Access</Text>
          </TouchableOpacity>
        ) : item.href ? (
          <>
            <TouchableOpacity style={styles.ctaBtn} onPress={handleTickets}>
              <Ionicons name="ticket-outline" size={18} color={c.paper} />
              <Text style={styles.ctaBtnText}>Get Tickets / Find Out More</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.calendarLink} onPress={handleCalendar}>
              <Text style={styles.calendarLinkText}>Add to calendar</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    heroWrap: { position: "relative" },
    hero: { width: "100%", height: 200, backgroundColor: c.paperDeep },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(179,130,56,0.72)",
      justifyContent: "center",
      alignItems: "center",
    },
    heroOverlayText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: "#fff",
      textAlign: "center",
    },

    body: { padding: space[4], gap: space[4] },

    badgeRow: { flexDirection: "row", gap: space[2], flexWrap: "wrap" },
    proBadge: {
      backgroundColor: c.goldLight,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.goldBorder,
      paddingHorizontal: space[2],
      paddingVertical: 2,
    },
    proBadgeText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.gold,
      letterSpacing: 1.2,
    },

    title: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink, lineHeight: 30 },

    metaCard: {
      backgroundColor: c.paperWarm,
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    metaRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[3], padding: space[3] },
    metaRowBorder: { borderTopWidth: 1, borderTopColor: c.rule },
    metaLabel:     { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.mute, letterSpacing: 1.2, marginBottom: 2 },
    metaValue:     { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    metaValueSub:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute, marginTop: 2 },
    metaValueLink: { color: c.ochre },

    description: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft, lineHeight: 22 },

    divider: { height: 1, backgroundColor: c.rule },

    upgradeBtn: {
      backgroundColor: c.gold,
      borderRadius: radius.lg,
      paddingVertical: space[3],
      alignItems: "center",
    },
    upgradeBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: "#fff" },

    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: space[2],
      backgroundColor: c.ochre,
      borderRadius: radius.lg,
      paddingVertical: space[3],
    },
    ctaBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    calendarLink: { alignItems: "center", paddingVertical: space[1] },
    calendarLinkText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
  });
}
