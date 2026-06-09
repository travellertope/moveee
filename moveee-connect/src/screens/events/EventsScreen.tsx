import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const WP_EVENTS_URL =
  "https://cms.themoveee.com/wp-json/wp/v2/culture_event" +
  "?per_page=50&status=publish&_embed=1&orderby=date&order=asc";

type EventFilter = "all" | "upcoming" | "online" | "pro";

export interface EventItem {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  eventDate: string | null;
  endDate: string | null;
  venue: string | null;
  city: string | null;
  country: string | null;
  admission: string | null;
  ticketUrl: string | null;
  isOnline: boolean;
  isProOnly: boolean;
  category: string | null;
  organiserName: string | null;
  organiserSlug: string | null;
}

function pick(...vals: unknown[]): string | null {
  return (vals.find((v) => v && v !== "") as string) ?? null;
}

function mapEvent(wp: any): EventItem {
  const meta = wp.meta ?? {};
  const cem  = wp.culture_event_meta ?? {};
  const img  = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null;
  return {
    id:            wp.id,
    slug:          wp.slug,
    title:         (wp.title?.rendered ?? "").replace(/&amp;/g, "&").replace(/<[^>]+>/g, ""),
    excerpt:       (wp.excerpt?.rendered ?? "").replace(/<[^>]+>/g, "").trim(),
    imageUrl:      pick(cem.image_url, meta._culture_event_image_url) || img,
    eventDate:     pick(cem.event_date, meta._culture_event_date),
    endDate:       pick(cem.end_date, meta._culture_event_end_date),
    venue:         pick(cem.venue, meta._culture_event_venue),
    city:          pick(cem.city, meta._culture_event_city),
    country:       pick(cem.country, meta._culture_event_country),
    admission:     pick(cem.admission, meta._culture_event_admission),
    ticketUrl:     pick(cem.ticket_url, meta._culture_event_ticket_url),
    isOnline:      !!(cem.is_online || meta._culture_event_is_online),
    isProOnly:     !!(cem.pro_only || meta._culture_event_pro_only),
    category:      pick(cem.category, meta._culture_event_category),
    organiserName: pick(cem.organiser_name, meta._culture_event_organiser_name),
    organiserSlug: pick(cem.organiser_slug, meta._culture_event_organiser_slug),
  };
}

function fmtEventDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "short", day: "numeric", month: "short",
    });
  } catch {
    return dateStr;
  }
}

const FILTERS: { id: EventFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "online",   label: "Online" },
  { id: "pro",      label: "Pro Only" },
];

export default function EventsScreen() {
  const nav = useNavigation<any>();
  const [events, setEvents]       = useState<EventItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState<EventFilter>("all");
  const [error, setError]         = useState<string | null>(null);

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch(WP_EVENTS_URL);
      if (!res.ok) throw new Error("fetch failed");
      const raw: any[] = await res.json();
      setEvents(raw.map(mapEvent));
    } catch {
      setError("Could not load events. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const now = new Date();
  const filtered = events.filter((e) => {
    if (filter === "upcoming") return e.eventDate ? new Date(e.eventDate) >= now : false;
    if (filter === "online")   return e.isOnline;
    if (filter === "pro")      return e.isProOnly;
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterBarContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.gold} size="large" />
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEvents()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchEvents(true)}
              tintColor={colors.gold}
            />
          }
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No events to show.</Text>
          ) : (
            filtered.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={styles.card}
                onPress={() => nav.navigate("EventDetail", { event })}
                activeOpacity={0.85}
              >
                {event.imageUrl ? (
                  <Image source={{ uri: event.imageUrl }} style={styles.cardImage} />
                ) : (
                  <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
                    <Ionicons name="calendar-outline" size={32} color={colors.ghost} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <View style={styles.badgeRow}>
                    {event.category && (
                      <View style={styles.catBadge}>
                        <Text style={styles.catBadgeText}>
                          {event.category.replace(/-/g, " ").toUpperCase()}
                        </Text>
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

                  <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

                  {event.eventDate && (
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={12} color={colors.mute} />
                      <Text style={styles.metaText}>{fmtEventDate(event.eventDate)}</Text>
                    </View>
                  )}
                  {(event.venue || event.city) && (
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={12} color={colors.mute} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {[event.venue, event.city].filter(Boolean).join(", ")}
                      </Text>
                    </View>
                  )}
                  {event.admission && (
                    <View style={styles.metaRow}>
                      <Ionicons name="ticket-outline" size={12} color={colors.mute} />
                      <Text style={styles.metaText}>{event.admission}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: { paddingHorizontal: space[4], paddingTop: space[5], paddingBottom: space[3] },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: colors.ink },

  filterBar: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.rule },
  filterBarContent: { paddingHorizontal: space[4], gap: space[2], paddingBottom: space[2] },
  filterChip: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: space[1] + 2,
    backgroundColor: colors.paper,
  },
  filterChipActive:     { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipText:       { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 1 },
  filterChipTextActive: { color: colors.paper },

  list: { padding: space[4], gap: space[3], paddingBottom: space[10] },

  card: {
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.rule, overflow: "hidden",
  },
  cardImage: { width: "100%", height: 180, backgroundColor: colors.paperDeep },
  cardImagePlaceholder: { justifyContent: "center", alignItems: "center" },

  cardBody:  { padding: space[4], gap: space[2] },
  badgeRow:  { flexDirection: "row", flexWrap: "wrap", gap: space[1] },

  catBadge: {
    backgroundColor: colors.badgeHappeningBg, borderRadius: radius.sm,
    paddingHorizontal: space[2], paddingVertical: 2,
  },
  catBadgeText:    { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.badgeHappeningText, letterSpacing: 1.2 },
  onlineBadge:     { backgroundColor: colors.communityBg },
  onlineBadgeText: { color: colors.communityText },
  proBadge:        { backgroundColor: colors.goldLight },
  proBadgeText:    { color: colors.gold },

  cardTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.md, color: colors.ink, lineHeight: 22 },

  metaRow:  { flexDirection: "row", alignItems: "center", gap: space[1] },
  metaText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, flex: 1 },

  centred: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6] },
  errorText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute, textAlign: "center", marginBottom: space[3] },
  retryBtn: { backgroundColor: colors.ink, borderRadius: radius.md, paddingHorizontal: space[5], paddingVertical: space[2] },
  retryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },

  emptyText: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.ghost, textAlign: "center", marginTop: space[8] },
});
