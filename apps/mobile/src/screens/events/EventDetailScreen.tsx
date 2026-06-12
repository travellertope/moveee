import React, { useState } from "react";
import {
  View, Text, ScrollView, Image, StyleSheet, SafeAreaView,
  TouchableOpacity, Linking, Alert, ActivityIndicator, TextInput,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { EventItem } from "./EventsScreen";

const PROXY = "https://themoveee.com/api";

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

export default function EventDetailScreen() {
  const nav  = useNavigation<any>();
  const route = useRoute<any>();
  const { event } = route.params as { event: EventItem };
  const { user } = useAuthStore();

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
        name:  name.trim(),
        email: email.trim(),
      });
      setRsvpDone(true);
    } catch {
      Alert.alert("Error", "Could not submit RSVP. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Floating back button */}
      <View style={styles.headerOverlay}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: space[12] }} showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.hero} />
        ) : (
          <View style={[styles.hero, styles.heroPlaceholder]}>
            <Ionicons name="calendar-outline" size={48} color={colors.ghost} />
          </View>
        )}

        <View style={styles.body}>
          {/* Badges */}
          <View style={styles.badgeRow}>
            {event.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{event.category.replace(/-/g, " ").toUpperCase()}</Text>
              </View>
            )}
            {event.isOnline && (
              <View style={[styles.catBadge, styles.onlineBadge]}>
                <Text style={[styles.catBadgeText, styles.onlineBadgeText]}>ONLINE</Text>
              </View>
            )}
            {event.isProOnly && (
              <View style={[styles.catBadge, styles.proBadge]}>
                <Text style={[styles.catBadgeText, styles.proBadgeText]}>★ PRO</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{event.title}</Text>

          {/* Meta card */}
          <View style={styles.metaCard}>
            {event.eventDate && (
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>DATE</Text>
                  <Text style={styles.metaValue}>{fmtLongDate(event.eventDate)}</Text>
                  {event.endDate && event.endDate !== event.eventDate && (
                    <Text style={styles.metaValueSub}>Until {fmtLongDate(event.endDate)}</Text>
                  )}
                </View>
              </View>
            )}
            {(event.venue || event.city) && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="location-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>LOCATION</Text>
                  {event.venue   && <Text style={styles.metaValue}>{event.venue}</Text>}
                  {event.city    && (
                    <Text style={styles.metaValueSub}>
                      {event.city}{event.country ? `, ${event.country}` : ""}
                    </Text>
                  )}
                </View>
              </View>
            )}
            {event.admission && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="ticket-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>ADMISSION</Text>
                  <Text style={styles.metaValue}>{event.admission}</Text>
                </View>
              </View>
            )}
            {event.organiserName && (
              <View style={[styles.metaRow, styles.metaRowBorder]}>
                <Ionicons name="person-outline" size={16} color={colors.gold} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.metaLabel}>ORGANISER</Text>
                  <Text style={styles.metaValue}>{event.organiserName}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Description */}
          {!!event.excerpt && (
            <Text style={styles.description}>{event.excerpt}</Text>
          )}

          {/* Ticket / external link */}
          {event.ticketUrl && (
            <TouchableOpacity
              style={styles.ticketBtn}
              onPress={() => Linking.openURL(event.ticketUrl!)}
            >
              <Ionicons name="ticket-outline" size={18} color={colors.paper} />
              <Text style={styles.ticketBtnText}>Get Tickets / Find Out More</Text>
            </TouchableOpacity>
          )}

          {/* RSVP form */}
          <View style={styles.rsvpCard}>
            <Text style={styles.rsvpTitle}>RSVP to this event</Text>
            {rsvpDone ? (
              <View style={styles.rsvpSuccess}>
                <Ionicons name="checkmark-circle" size={30} color={colors.communityText} />
                <Text style={styles.rsvpSuccessText}>You're on the list!</Text>
              </View>
            ) : (
              <>
                <View style={styles.rsvpField}>
                  <Text style={styles.rsvpLabel}>NAME</Text>
                  <TextInput
                    style={styles.rsvpInput}
                    value={name}
                    onChangeText={setName}
                    placeholder="Your name"
                    placeholderTextColor={colors.ghost}
                  />
                </View>
                <View style={styles.rsvpField}>
                  <Text style={styles.rsvpLabel}>EMAIL</Text>
                  <TextInput
                    style={styles.rsvpInput}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your@email.com"
                    placeholderTextColor={colors.ghost}
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
                    ? <ActivityIndicator color={colors.paper} />
                    : <Text style={styles.rsvpBtnText}>RSVP →</Text>
                  }
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  headerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
    paddingHorizontal: space[4], paddingTop: space[3],
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.paper,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
  },

  hero: { width: "100%", height: 260, backgroundColor: colors.paperDeep },
  heroPlaceholder: { justifyContent: "center", alignItems: "center" },

  body: { padding: space[4], gap: space[4] },

  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: space[1] },
  catBadge: {
    backgroundColor: colors.badgeHappeningBg, borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: 2,
  },
  catBadgeText:    { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.badgeHappeningText, letterSpacing: 1.2 },
  onlineBadge:     { backgroundColor: colors.communityBg },
  onlineBadgeText: { color: colors.communityText },
  proBadge:        { backgroundColor: colors.goldLight },
  proBadgeText:    { color: colors.gold },

  title: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, lineHeight: 30 },

  metaCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, overflow: "hidden",
  },
  metaRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[3], padding: space[3] },
  metaRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  metaLabel:     { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1.2, marginBottom: 2 },
  metaValue:     { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  metaValueSub:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },

  description: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft, lineHeight: 22 },

  ticketBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space[2],
    backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: space[3],
  },
  ticketBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  rsvpCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, padding: space[4], gap: space[3],
  },
  rsvpTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },

  rsvpSuccess:     { alignItems: "center", gap: space[2], paddingVertical: space[4] },
  rsvpSuccessText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.communityText },

  rsvpField: { gap: 6 },
  rsvpLabel: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: colors.mute, letterSpacing: 1.2, textTransform: "uppercase",
  },
  rsvpInput: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2],
    backgroundColor: colors.paperWarm,
  },
  rsvpBtn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: space[3], alignItems: "center",
  },
  rsvpBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },
});
