import React, { useState, useMemo } from "react";
import {
  View, Text, ScrollView, Image, StyleSheet,
  TouchableOpacity, Linking, Alert, ActivityIndicator,
  TextInput, useWindowDimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import type { EventItem } from "./EventsScreen";

const PROXY = "https://themoveee.com/api";

const EVENT_CHECKIN_REP = 20;
const EVENT_CHECKIN_CREDITS = 3;

function fmtLongDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function fmtTime(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function EventDetailScreen() {
  const nav    = useNavigation<any>();
  const route  = useRoute<any>();
  const { event } = route.params as { event: EventItem };
  const { user }  = useAuthStore();
  const { height } = useWindowDimensions();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [name,       setName]       = useState(user?.displayName ?? "");
  const [email,      setEmail]      = useState(user?.email ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [rsvpDone,   setRsvpDone]   = useState(false);

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

  // ── RSVP Success screen ───────────────────────────────────────────────────
  if (rsvpDone) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <View style={styles.successContent}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={32} color={c.paper} strokeWidth={3} />
          </View>
          <Text style={styles.successTitle}>You're on the list! 🎉</Text>
          <Text style={styles.successSub}>
            A confirmation will be sent to{"\n"}{email}
          </Text>
          <TouchableOpacity style={styles.calendarBtn}>
            <Text style={styles.calendarBtnText}>Add to Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={styles.backLink}>Back to Events</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero region */}
      <View style={styles.hero}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]} />
        )}

        {/* Category badge on hero */}
        {event.category ? (
          <View style={styles.heroCatBadge}>
            <Text style={styles.heroCatBadgeText}>{event.category.replace(/-/g, " ").toUpperCase()}</Text>
          </View>
        ) : null}
      </View>

      {/* Floating back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons name="chevron-back" size={20} color={c.ink} />
      </TouchableOpacity>

      {/* Scrollable content */}
      <ScrollView
        contentContainerStyle={{ paddingTop: 220, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* White content sheet */}
        <View style={styles.sheet}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Attendee row */}
          <View style={styles.attendeeRow}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.attendeeAvatar, { marginLeft: i > 0 ? -8 : 0, zIndex: 3 - i }]} />
            ))}
            <Text style={styles.attendeeText}>
              {event.attendeeCount ? `${event.attendeeCount} attending` : "Be the first to attend"}
            </Text>
          </View>

          {/* Meta card */}
          <View style={styles.metaCard}>
            {event.eventDate ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaEmoji}>📅</Text>
                <Text style={styles.metaValue}>
                  {fmtLongDate(event.eventDate)}
                  {fmtTime(event.eventDate) ? `\n${fmtTime(event.eventDate)} – Late` : ""}
                </Text>
              </View>
            ) : null}
            {(event.venue || event.city) ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaEmoji}>📍</Text>
                <Text style={styles.metaValue}>
                  {event.venue ?? ""}
                  {event.city ? `\n${event.city}${event.country ? `, ${event.country}` : ""}` : ""}
                </Text>
              </View>
            ) : null}
            {event.admission ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaEmoji}>💳</Text>
                <Text style={styles.metaValue}>{event.admission}</Text>
              </View>
            ) : null}
            {event.organiserName ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaEmoji}>👤</Text>
                {event.organiserSlug ? (
                  <TouchableOpacity onPress={() => nav.navigate("DirectoryDetail", { slug: event.organiserSlug })}>
                    <Text style={[styles.metaValue, styles.metaLink]}>
                      Organised by: {event.organiserName}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.metaValue}>Organised by: {event.organiserName}</Text>
                )}
              </View>
            ) : null}
          </View>

          {/* Description */}
          {!!event.excerpt ? (
            <Text style={styles.description}>{event.excerpt}</Text>
          ) : null}

          {/* CTA button */}
          {event.ticketUrl ? (
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => Linking.openURL(event.ticketUrl!).catch(() => {})}
            >
              <Text style={styles.ctaBtnText}>Get Tickets / Find Out More</Text>
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

          {/* Divider */}
          <View style={styles.divider} />

          {/* RSVP section */}
          <Text style={styles.rsvpTitle}>RSVP to secure your spot</Text>
          <View style={styles.rsvpForm}>
            <View style={styles.rsvpField}>
              <Text style={styles.rsvpLabel}>Name</Text>
              <TextInput
                style={styles.rsvpInput}
                value={name}
                onChangeText={setName}
                placeholder="Jane Doe"
                placeholderTextColor={c.ghost}
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
              />
            </View>
            <TouchableOpacity
              style={[styles.rsvpBtn, submitting && { opacity: 0.6 }]}
              onPress={handleRsvp}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={c.paper} />
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
    container: { flex: 1, backgroundColor: c.paperWarm },

    // Hero
    hero: {
      position: "absolute", top: 0, left: 0, right: 0,
      height: 260, zIndex: 0,
      backgroundColor: c.paperDeep,
    },
    heroPlaceholder: { backgroundColor: c.paperDeep },
    heroCatBadge: {
      position: "absolute", bottom: 60, left: 24,
      backgroundColor: "rgba(0,0,0,0.3)",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
      borderRadius: radius.full,
      paddingHorizontal: 12, paddingVertical: 6,
    },
    heroCatBadgeText: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.paper, letterSpacing: 1, textTransform: "uppercase",
    },

    // Floating back button
    backBtn: {
      position: "absolute", top: 52, left: 16, zIndex: 50,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.paper, alignItems: "center", justifyContent: "center",
      shadowColor: c.ink, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
    },

    // Content sheet
    sheet: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40,
      shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.12, shadowRadius: 30, elevation: 8,
      minHeight: 400,
    },

    title: {
      fontFamily: fonts.serifBold, fontSize: 24, color: c.ink,
      lineHeight: 30, marginBottom: 12,
    },

    attendeeRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
    attendeeAvatar: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: c.paperDeep, borderWidth: 1.5, borderColor: c.paper,
    },
    attendeeText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },

    // Meta card
    metaCard: {
      backgroundColor: c.paperDeep, borderRadius: 8,
      padding: 16, gap: 12, marginBottom: 20,
    },
    metaRow:   { flexDirection: "row", alignItems: "flex-start", gap: 4 },
    metaEmoji: { fontSize: 16, width: 20, color: c.ochre, paddingTop: 2 },
    metaValue: { fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft, flex: 1, lineHeight: 20 },
    metaLink:  { color: c.ochre, textDecorationLine: "underline" },

    description: {
      fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft,
      lineHeight: 24, marginBottom: 20,
    },

    ctaBtn: {
      height: 52, backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center", marginBottom: 20,
      shadowColor: c.ochre, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    ctaBtnText: { fontFamily: fonts.sansBold, fontSize: 16, color: c.paper },

    // Check-in info card
    checkinCard: {
      backgroundColor: c.paperDeep,
      borderRadius: radius.lg,
      borderLeftWidth: 3,
      borderLeftColor: c.ochre,
      padding: 16,
      marginBottom: 20,
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

    divider: { height: 1, backgroundColor: c.ghost, marginBottom: 24 },

    rsvpTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink, marginBottom: 16 },
    rsvpForm:  { gap: 12 },
    rsvpField: { gap: 4 },
    rsvpLabel: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    rsvpInput: {
      height: 48, borderWidth: 1, borderColor: c.ghost, borderRadius: 8,
      paddingHorizontal: space[4], fontFamily: fonts.sans, fontSize: fontSize.base,
      color: c.ink, backgroundColor: c.paper,
    },
    rsvpBtn: {
      height: 52, backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center", marginTop: 4,
      shadowColor: c.ochre, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    rsvpBtnText: { fontFamily: fonts.sansBold, fontSize: 16, color: c.paper },

    // RSVP Success
    successContainer: { justifyContent: "center", alignItems: "center" },
    successContent:   { alignItems: "center", paddingHorizontal: 32 },
    successCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.success, alignItems: "center", justifyContent: "center",
      marginBottom: 20,
      shadowColor: c.success, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    successTitle: {
      fontFamily: fonts.serifBold, fontSize: 24, color: c.ink,
      textAlign: "center", marginBottom: 8,
    },
    successSub: {
      fontFamily: fonts.sans, fontSize: 14, color: c.mute,
      textAlign: "center", marginBottom: 32, lineHeight: 20,
    },
    calendarBtn: {
      width: "100%", maxWidth: 280, height: 48,
      borderWidth: 1.5, borderColor: c.ink, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center", marginBottom: 24,
    },
    calendarBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    backLink: {
      fontFamily: fonts.sansBold, fontSize: fontSize.sm,
      color: c.ochre, textDecorationLine: "underline",
    },
  });
}
