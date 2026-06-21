import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";

interface RsvpItem {
  eventId: number;
  slug: string;
  title: string;
  startDate: string;
  location: string;
  status: "attending" | "maybe" | "not_going";
  rsvpAt: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    return `${day} · ${time}`;
  } catch {
    return dateStr;
  }
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  attending:  { label: "Attending",  bg: "#d1fae5", text: "#065f46" },
  maybe:      { label: "Maybe",      bg: "#fef3c7", text: "#92400e" },
  not_going:  { label: "Not going",  bg: "#f3f4f6", text: "#6b7280" },
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: c.paper, paddingHorizontal: space[4],
      height: 56,
      borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)",
      gap: 12,
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink, flex: 1 },

    list: { padding: space[4], gap: 12, paddingBottom: 90 },

    card: {
      backgroundColor: c.paper, borderRadius: radius.xl,
      padding: 16, ...shadows.card,
    },
    cardTitle: {
      fontFamily: fonts.sansBold, fontSize: 16, color: c.ink,
      lineHeight: 22, marginBottom: 6,
    },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
    metaText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, flex: 1 },

    cardFooter: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: 12, paddingTop: 12,
      borderTopWidth: 1, borderTopColor: "rgba(200,191,176,0.3)",
    },
    statusPill: {
      paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    },
    statusText: { fontFamily: fonts.sansBold, fontSize: 12 },

    cancelBtn: {
      borderWidth: 1, borderColor: c.ghost, borderRadius: radius.full,
      paddingHorizontal: 14, paddingVertical: 5,
    },
    cancelText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },

    centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6] },
    errorText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center", marginBottom: space[3] },
    retryBtn: { backgroundColor: c.ink, borderRadius: radius.xl, paddingHorizontal: space[5], paddingVertical: space[2] },
    retryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.paper },

    emptyIcon: { marginBottom: 16 },
    emptyTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink, marginBottom: 8, textAlign: "center" },
    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center", marginBottom: 24, lineHeight: 22 },
    browseBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: space[5], paddingVertical: space[2],
    },
    browseBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.paper },
  });
}

export default function MyRSVPsScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore() as any;

  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  const fetchRsvps = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await api.get<{ rsvps: RsvpItem[] }>(`${MOBILE_API}/events/my-rsvps`);
      setRsvps(res.rsvps ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRsvps(); }, [fetchRsvps]);

  const handleCancel = async (item: RsvpItem) => {
    setCancelling(item.eventId);
    try {
      await api.post(`${MOBILE_API}/events/rsvp`, { event_id: item.eventId, status: "cancel" });
      setRsvps((prev) => prev.filter((r) => r.eventId !== item.eventId));
    } catch {
      // fail silently — item stays in list
    } finally {
      setCancelling(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Events</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.ochre} size="large" />
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>Could not load your RSVPs.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRsvps}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : rsvps.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={48} color={c.ghost} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>No RSVPs yet</Text>
          <Text style={styles.emptyText}>Browse events and RSVP to start tracking your plans.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => nav.goBack()}>
            <Text style={styles.browseBtnText}>Browse Events</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {rsvps.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.attending;
            return (
              <View key={item.eventId} style={styles.card}>
                <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                {!!item.startDate && (
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={14} color={c.mute} />
                    <Text style={styles.metaText}>{formatDate(item.startDate)}</Text>
                  </View>
                )}
                {!!item.location && (
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color={c.mute} />
                    <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
                  </View>
                )}
                <View style={styles.cardFooter}>
                  <View style={[styles.statusPill, { backgroundColor: statusConfig.bg }]}>
                    <Text style={[styles.statusText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => handleCancel(item)}
                    disabled={cancelling === item.eventId}
                  >
                    {cancelling === item.eventId ? (
                      <ActivityIndicator size="small" color={c.mute} />
                    ) : (
                      <Text style={styles.cancelText}>Cancel RSVP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
