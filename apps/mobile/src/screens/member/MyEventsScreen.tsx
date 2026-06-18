import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";

interface OrganiserEvent {
  postId: number;
  title: string;
  status: string;
  rsvpEnabled: boolean;
  rsvpCapacity: number;
  rsvpCount: number;
  eventDate: string;
}

interface Attendee {
  userId: number;
  displayName: string;
  email: string;
  rsvpAt: string;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },
    scroll: { padding: space[4], paddingBottom: 40, gap: 16 },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    lockCard: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 20,
      alignItems: "center", gap: 10, ...shadows.card,
    },
    lockTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, textAlign: "center" },
    lockText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center", lineHeight: 19 },
    upgradeBtn: {
      marginTop: 8, backgroundColor: c.ochre, borderRadius: radius.xl,
      paddingVertical: 12, paddingHorizontal: 24,
    },
    upgradeBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, ...shadows.card,
    },
    eventRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    eventTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    eventMeta: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    eventCount: { fontFamily: fonts.monoBold, fontSize: 13, color: c.ochre },
    attendeeWrap: { paddingHorizontal: 16, paddingBottom: 14, gap: 8 },
    attendeeRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 8, paddingHorizontal: 10, backgroundColor: c.paperDeep,
      borderRadius: radius.md,
    },
    attendeeName: { fontFamily: fonts.sans, fontSize: 13, color: c.ink },
    attendeeEmail: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    attendeeDate: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, padding: 16, textAlign: "center" },
  });
}

function EventRow({
  event, c, styles,
}: { event: OrganiserEvent; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);

  const toggle = async () => {
    if (!event.rsvpEnabled) return;
    if (open) { setOpen(false); return; }
    setOpen(true);
    if (attendees) return;
    setLoading(true);
    try {
      const res = await api.get<{ attendees: Attendee[] }>(
        `${MOBILE_API}/community/event/attendees?post_id=${event.postId}`
      );
      setAttendees(res?.attendees ?? []);
    } catch {
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TouchableOpacity style={styles.eventRow} onPress={toggle} disabled={!event.rsvpEnabled}>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          <Text style={styles.eventMeta}>
            {formatDate(event.eventDate)} · {event.status}
            {!event.rsvpEnabled ? " · RSVP not enabled" : ""}
          </Text>
        </View>
        {event.rsvpEnabled && (
          <Text style={styles.eventCount}>
            {event.rsvpCount}{event.rsvpCapacity > 0 ? ` / ${event.rsvpCapacity}` : ""} {open ? "▲" : "▼"}
          </Text>
        )}
      </TouchableOpacity>
      {open && (
        <View style={styles.attendeeWrap}>
          {loading ? (
            <ActivityIndicator color={c.ochre} />
          ) : !attendees || attendees.length === 0 ? (
            <Text style={[styles.emptyText, { padding: 0 }]}>No RSVPs yet.</Text>
          ) : (
            attendees.map((a) => (
              <View key={a.userId} style={styles.attendeeRow}>
                <View>
                  <Text style={styles.attendeeName}>{a.displayName}</Text>
                  <Text style={styles.attendeeEmail}>{a.email}</Text>
                </View>
                <Text style={styles.attendeeDate}>{formatDate(a.rsvpAt)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function MyEventsScreen() {
  const nav = useNav();
  const { user } = useAuthStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const isPro = user?.tier === "patron";
  const [events, setEvents] = useState<OrganiserEvent[]>([]);
  const [loading, setLoading] = useState(isPro);

  useEffect(() => {
    if (!isPro) return;
    (async () => {
      try {
        const res = await api.get<{ events: OrganiserEvent[] }>(`${MOBILE_API}/community/my-events`);
        setEvents(res?.events ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [isPro]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
        <View style={{ width: 24 }} />
      </View>

      {!isPro ? (
        <View style={[styles.scroll, { flex: 1, justifyContent: "center" }]}>
          <View style={styles.lockCard}>
            <Ionicons name="lock-closed" size={28} color={c.ochre} />
            <Text style={styles.lockTitle}>Connect Pro feature</Text>
            <Text style={styles.lockText}>
              RSVP management for community events is available to Connect Pro members.
              Upgrade to enable RSVP on your events and view attendee lists.
            </Text>
            <TouchableOpacity style={styles.upgradeBtn} onPress={() => nav.navigate("Membership" as never)}>
              <Text style={styles.upgradeBtnText}>View Connect Pro</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.ochre} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            {events.length === 0 ? (
              <Text style={styles.emptyText}>You haven't organised any events yet.</Text>
            ) : (
              events.map((event) => (
                <EventRow key={event.postId} event={event} c={c} styles={styles} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
