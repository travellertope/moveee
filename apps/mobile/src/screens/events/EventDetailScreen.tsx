import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, Image, StyleSheet,
  TouchableOpacity, Linking, Alert, ActivityIndicator,
  TextInput, StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../auth/authStore";
import { api } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import type { EventItem } from "./EventsScreen";

const PROXY = "https://themoveee.com/api";

const EVENT_CHECKIN_REP = 20;
const EVENT_CHECKIN_CREDITS = 3;

function fmtDateRange(start: string | null, end: string | null): string {
  if (!start) return "";
  try {
    const s = new Date(start);
    const sStr = s.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    if (!end) return sStr;
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) return sStr;
    const sShort = `${s.getDate()} ${s.toLocaleDateString("en-GB", { month: "short" })}`;
    const eStr = e.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    return `${sShort}–${eStr}`;
  } catch { return start; }
}

function fmtTime(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export default function EventDetailScreen() {
  const nav    = useNavigation<any>();
  const route  = useRoute<any>();
  const { event } = route.params as { event: EventItem };
  const { user }  = useAuthStore();
  const insets    = useSafeAreaInsets();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [name,       setName]       = useState(user?.displayName ?? "");
  const [email,      setEmail]      = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpDone,   setRsvpDone]   = useState(false);

  const isUpcoming = event.eventDate ? new Date(event.eventDate) >= new Date() : false;
  const isFree     = !event.admission || event.admission.toLowerCase().includes("free");

  const handleRsvp = async () => {
    if (!name.trim() || !email.trim()) {
      Alert.alert("Missing info", "Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`${PROXY}/events/rsvp`, {
        event_id: event.id,
        name:     name.trim(),
        email:    email.trim(),
      });
      setRsvpDone(true);
    } catch {
      Alert.alert("Error", "Could not submit RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── RSVP success ─────────────────────────────────────────────────────────
  if (rsvpDone) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={32} color={c.paper} />
        </View>
        <Text style={styles.successTitle}>You're on the list! 🎉</Text>
        <Text style={styles.successSub}>A confirmation will be sent to{"\n"}{email}</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => nav.goBack()}>
          <Text style={styles.successBtnText}>Back to Events</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const dateLabel = fmtDateRange(event.eventDate, event.endDate);
  const timeLabel = fmtTime(event.eventDate);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.heroFallback]} />
          )}

          {/* gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(20,17,13,0.55)", "rgba(20,17,13,0.88)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Back button */}
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 8 }]}
            onPress={() => nav.goBack()}
          >
            <Ionicons name="chevron-back" size={20} color={c.ink} />
          </TouchableOpacity>

          {/* Hero content — bottom aligned */}
          <View style={styles.heroContent}>
            {/* Badges row */}
            <View style={styles.heroBadgeRow}>
              {isUpcoming && (
                <View style={styles.heroBadge}>
                  <View style={styles.greenDot} />
                  <Text style={styles.heroBadgeText}>Upcoming</Text>
                </View>
              )}
              {event.isOnline && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>Online</Text>
                </View>
              )}
              {event.isProOnly && (
                <View style={[styles.heroBadge, styles.heroBadgePro]}>
                  <Text style={[styles.heroBadgeText, styles.heroBadgeProText]}>★ Pro Only</Text>
                </View>
              )}
              {event.category ? (
                <View style={[styles.heroBadge, styles.heroBadgeCategory]}>
                  <Text style={styles.heroBadgeCategoryText}>
                    {event.category.replace(/-/g, " ")}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Title */}
            <Text style={styles.heroTitle}>{event.title}</Text>

            {/* One-line meta preview */}
            {(dateLabel || event.city) ? (
              <Text style={styles.heroMeta}>
                {[dateLabel, event.city].filter(Boolean).join("  ·  ")}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ── Content sheet ── */}
        <View style={styles.sheet}>

          {/* Attendee count */}
          {event.attendeeCount ? (
            <View style={styles.attendeeRow}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.attendeeAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]} />
              ))}
              <Text style={styles.attendeeText}>{event.attendeeCount} attending</Text>
            </View>
          ) : null}

          {/* Meta rows card */}
          <View style={styles.metaCard}>
            {dateLabel ? (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={18} color={c.gold} style={styles.metaIcon} />
                <View style={styles.metaBody}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaValue}>{dateLabel}{timeLabel ? `  ·  ${timeLabel}` : ""}</Text>
                </View>
              </View>
            ) : null}

            {(event.venue || event.city) ? (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="location-outline" size={18} color={c.gold} style={styles.metaIcon} />
                <View style={styles.metaBody}>
                  <Text style={styles.metaLabel}>LOCATION</Text>
                  {event.venue ? <Text style={styles.metaValue}>{event.venue}</Text> : null}
                  {event.city  ? (
                    <Text style={styles.metaValueSub}>{event.city}{event.country ? `, ${event.country}` : ""}</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {event.admission ? (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="ticket-outline" size={18} color={c.gold} style={styles.metaIcon} />
                <View style={styles.metaBody}>
                  <Text style={styles.metaLabel}>ADMISSION</Text>
                  <Text style={styles.metaValue}>{event.admission}</Text>
                </View>
              </View>
            ) : null}

            {event.organiserName ? (
              <TouchableOpacity
                style={[styles.metaRow, styles.metaRowBorder]}
                onPress={event.organiserSlug ? () => nav.navigate("DirectoryDetail", { slug: event.organiserSlug }) : undefined}
                disabled={!event.organiserSlug}
                activeOpacity={0.7}
              >
                <Ionicons name="person-outline" size={18} color={c.gold} style={styles.metaIcon} />
                <View style={styles.metaBody}>
                  <Text style={styles.metaLabel}>ORGANISER</Text>
                  <Text style={[styles.metaValue, event.organiserSlug ? styles.metaValueLink : undefined]}>
                    {event.organiserName}{event.organiserSlug ? "  →" : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Description */}
          {event.excerpt ? (
            <Text style={styles.description}>{event.excerpt}</Text>
          ) : null}

          {/* Primary CTA */}
          {event.ticketUrl ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => Linking.openURL(event.ticketUrl!).catch(() => {})}
              activeOpacity={0.85}
            >
              <Ionicons name="ticket-outline" size={18} color={c.paper} />
              <Text style={styles.ctaBtnText}>
                {isFree ? "Register / Find Out More" : "Get Tickets"}
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* Check-in info card — shown when today is within 1 day of event start */}
          {(() => {
            if (!event.eventDate) return null;
            const eventDay = new Date(event.eventDate);
            eventDay.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.abs((today.getTime() - eventDay.getTime()) / 86400000);
            if (diffDays > 1) return null;
            return (
              <View style={styles.checkinCard}>
                <Text style={styles.checkinTitle}>📱 Check In at the Door</Text>
                <Text style={styles.checkinBody}>
                  Scan the event QR code with your phone's camera to check in and earn{" "}
                  <Text style={styles.checkinHighlight}>+{EVENT_CHECKIN_REP} rep</Text> and{" "}
                  <Text style={styles.checkinHighlight}>+{EVENT_CHECKIN_CREDITS} credits</Text>.
                </Text>
              </View>
            );
          })()}

          {/* RSVP section */}
          <View style={styles.rsvpCard}>
            <Text style={styles.rsvpTitle}>RSVP to secure your spot</Text>

            <View style={styles.rsvpField}>
              <Text style={styles.rsvpLabel}>Name</Text>
              <TextInput
                style={styles.rsvpInput}
                value={name}
                onChangeText={setName}
                placeholder="Jane Doe"
                placeholderTextColor={c.ghost}
                returnKeyType="next"
              />
            </View>
            <View style={styles.rsvpField}>
              <Text style={styles.rsvpLabel}>Email</Text>
              <TextInput
                style={styles.rsvpInput}
                value={email}
                onChangeText={setEmail}
                placeholder="jane@example.com"
                placeholderTextColor={c.ghost}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>

            <TouchableOpacity
              style={[styles.rsvpBtn, submitting && { opacity: 0.6 }]}
              onPress={handleRsvp}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting
                ? <ActivityIndicator color={c.paper} size="small" />
                : <Text style={styles.rsvpBtnText}>Confirm RSVP</Text>
              }
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },

    // ── Hero ──
    hero: {
      height: 340,
      backgroundColor: c.ink,
      justifyContent: "flex-end",
    },
    heroFallback: {
      backgroundColor: c.ink,
    },
    backBtn: {
      position: "absolute",
      left: 16,
      zIndex: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.paper,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.card,
    },
    heroContent: {
      paddingHorizontal: 20,
      paddingBottom: 24,
      gap: 8,
    },
    heroBadgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(255,255,255,0.14)",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    heroBadgePro: {
      backgroundColor: "rgba(180,130,56,0.25)",
      borderColor: "rgba(180,130,56,0.5)",
    },
    heroBadgeCategory: {
      backgroundColor: "rgba(197,73,31,0.25)",
      borderColor: "rgba(197,73,31,0.5)",
    },
    heroBadgeText:         { fontFamily: fonts.sansBold, fontSize: 11, color: "#fff", letterSpacing: 0.3 },
    heroBadgeProText:      { color: "#FCD34D" },
    heroBadgeCategoryText: { fontFamily: fonts.sansBold, fontSize: 11, color: "#f4a67a", letterSpacing: 0.3 },
    greenDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" },

    heroTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 28,
      color: "#f3ece0",
      lineHeight: 36,
    },
    heroMeta: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: "rgba(243,236,224,0.6)",
      letterSpacing: 0.5,
    },

    // ── Content sheet ──
    sheet: {
      backgroundColor: c.paper,
      paddingHorizontal: 20,
      paddingTop: 24,
      gap: 20,
    },

    attendeeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    attendeeAvatar: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.paperDeep,
      borderWidth: 1.5,
      borderColor: c.paper,
    },
    attendeeText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
    },

    // Meta card
    metaCard: {
      backgroundColor: c.paperWarm,
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.lg,
      overflow: "hidden",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      padding: 14,
    },
    metaRowBorder: {
      borderTopWidth: 1,
      borderTopColor: c.rule,
    },
    metaIcon: { marginTop: 2, flexShrink: 0 },
    metaBody: { flex: 1, gap: 2 },
    metaLabel: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 1.2,
      marginBottom: 2,
    },
    metaValue: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.ink,
    },
    metaValueSub: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    metaValueLink: { color: c.ochre },

    // Description
    description: {
      fontFamily: fonts.serif,
      fontSize: 17,
      color: c.inkSoft,
      lineHeight: 26,
    },

    // CTA button
    ctaBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 52,
      backgroundColor: c.ochre,
      borderRadius: radius.full,
      ...shadows.card,
    },
    ctaBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: 16,
      color: c.paper,
    },

    // Check-in info card
    checkinCard: {
      backgroundColor: c.paperDeep,
      borderRadius: radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: c.ochre,
      padding: 16,
    },
    checkinTitle: {
      fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink, marginBottom: 6,
    },
    checkinBody: {
      fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, lineHeight: 20,
    },
    checkinHighlight: {
      fontFamily: fonts.sansBold, color: c.ochre,
    },

    // RSVP section — light
    rsvpCard: { gap: 14, paddingTop: 4 },
    rsvpTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, marginBottom: 2 },
    rsvpField: { gap: 4 },
    rsvpLabel: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: c.mute,
    },
    rsvpInput: {
      height: 48,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: radius.lg,
      paddingHorizontal: 16,
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.ink,
      backgroundColor: c.paper,
    },
    rsvpBtn: {
      height: 52,
      backgroundColor: c.ochre,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    rsvpBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: 16,
      color: c.paper,
    },

    // Success screen
    successCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.success,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    successTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 24,
      color: c.ink,
      textAlign: "center",
      marginBottom: 8,
    },
    successSub: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.mute,
      textAlign: "center",
      marginBottom: 32,
      lineHeight: 20,
    },
    successBtn: {
      backgroundColor: c.ink,
      borderRadius: radius.full,
      paddingHorizontal: 32,
      paddingVertical: 14,
    },
    successBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.paper,
    },
  });
}
