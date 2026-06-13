import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Image, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";

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
  attendeeCount?: number;
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
    attendeeCount: wp.rsvp_count ?? undefined,
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

function fmtEventTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

const FILTERS: { id: EventFilter; label: string }[] = [
  { id: "all",      label: "All" },
  { id: "upcoming", label: "Upcoming" },
  { id: "online",   label: "Online" },
  { id: "pro",      label: "Pro Only" },
];

function EventCard({ event, onPress }: { event: EventItem; onPress: () => void }) {
  const isFree = !event.admission || event.admission.toLowerCase().includes("free");
  const isPaid = !isFree;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Image area */}
      <View style={styles.cardImageWrap}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.cardImage} resizeMode="cover" />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        )}

        {/* Status badges on image */}
        {event.isProOnly ? (
          <View style={[styles.imageBadge, styles.imageBadgePro, { top: 12, right: 12 }]}>
            <Text style={styles.imageBadgeProText}>⭐ PRO ONLY</Text>
          </View>
        ) : null}

        {!event.isProOnly && (
          <View style={styles.imageBadgesLeft}>
            {event.eventDate && new Date(event.eventDate) >= new Date() ? (
              <View style={[styles.imageBadge, styles.imageBadgeWhite]}>
                <View style={styles.greenDot} />
                <Text style={styles.imageBadgeText}>UPCOMING</Text>
              </View>
            ) : null}
            {event.isOnline ? (
              <View style={[styles.imageBadge, styles.imageBadgeWhite]}>
                <Text style={styles.imageBadgeOnlineText}>🔗 ONLINE</Text>
              </View>
            ) : event.category ? (
              <View style={[styles.imageBadge, styles.imageBadgeWhite]}>
                <Text style={styles.imageBadgeText}>{event.category.replace(/-/g, " ").toUpperCase()}</Text>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Content area */}
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>

        <View style={styles.metaRows}>
          {event.eventDate ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaEmoji}>📅</Text>
              <Text style={styles.metaText}>
                {fmtEventDate(event.eventDate)}{event.eventDate ? ` · ${fmtEventTime(event.eventDate)}` : ""}
              </Text>
            </View>
          ) : null}
          {(event.venue || event.city) ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaEmoji}>{event.isOnline ? "🔗" : "📍"}</Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {event.isOnline ? "Online Event" : [event.venue, event.city].filter(Boolean).join(", ")}
              </Text>
            </View>
          ) : null}
        </View>

        {event.admission ? (
          <Text style={styles.admission}>{event.admission}</Text>
        ) : null}

        {/* Capacity bar for online events */}
        {event.isOnline && event.attendeeCount ? (
          <View style={styles.capacityWrap}>
            <View style={styles.capacityBar}>
              <View style={[styles.capacityFill, { width: "67%" }]} />
            </View>
            <Text style={styles.capacityText}>{event.attendeeCount} attending</Text>
          </View>
        ) : null}

        {/* Footer row */}
        <View style={styles.cardFooter}>
          {event.attendeeCount && !event.isOnline ? (
            <Text style={styles.attendingText}>👥 {event.attendeeCount} attending</Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {isPaid ? (
            <TouchableOpacity style={styles.ticketBtn} onPress={onPress}>
              <Text style={styles.ticketBtnText}>Get Tickets →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.rsvpBtn} onPress={onPress}>
              <Text style={styles.rsvpBtnText}>RSVP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function EventsScreen() {
  const nav = useNavigation<any>();
  const [events, setEvents]         = useState<EventItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState<EventFilter>("all");
  const [error, setError]           = useState<string | null>(null);

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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity style={styles.filterIconBtn}>
          <Text style={styles.filterIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
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

      {/* Content */}
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
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} tintColor={colors.gold} />
          }
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No events to show.</Text>
          ) : (
            filtered.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => nav.navigate("EventDetail", { event })}
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.paper, paddingHorizontal: space[4],
    paddingTop: space[2], paddingBottom: space[2],
    borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)",
  },
  headerTitle:   { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink, paddingLeft: space[2] },
  filterIconBtn: { width: 32, height: 32, alignItems: "flex-end", justifyContent: "center" },
  filterIcon:    { fontSize: 18, color: colors.ink },

  filterBar:        { flexGrow: 0, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.ghost },
  filterBarContent: { paddingHorizontal: space[4], gap: 8, paddingVertical: 6 },
  filterChip: {
    height: 32, paddingHorizontal: 16, borderRadius: radius.full,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.ghost,
    alignItems: "center", justifyContent: "center",
  },
  filterChipActive:     { backgroundColor: colors.ink, borderColor: colors.ink },
  filterChipText:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft },
  filterChipTextActive: { fontFamily: fonts.sansBold, color: colors.paper },

  list: { padding: space[4], gap: 16, paddingBottom: 90 },

  // Event card
  card: {
    backgroundColor: colors.paper, borderRadius: radius.xl, overflow: "hidden",
    ...shadows.card,
  },
  cardImageWrap:      { height: 180, position: "relative" },
  cardImage:          { width: "100%", height: 180 },
  cardImagePlaceholder: { backgroundColor: colors.paperDeep },

  imageBadgesLeft: { position: "absolute", top: 12, left: 12, gap: 6 },
  imageBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full,
  },
  imageBadgeWhite:   { backgroundColor: "rgba(255,255,255,0.95)" },
  imageBadgePro:     { backgroundColor: colors.gold },
  imageBadgeText:    { fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow, color: colors.ink, letterSpacing: 1 },
  imageBadgeOnlineText: { fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow, color: "#2563eb", letterSpacing: 1 },
  imageBadgeProText: { fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow, color: colors.paper, letterSpacing: 1 },
  greenDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },

  cardBody:  { padding: 16 },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.ink, marginBottom: 8, lineHeight: 22 },

  metaRows: { gap: 4, marginBottom: 8 },
  metaRow:  { flexDirection: "row", alignItems: "center" },
  metaEmoji: { width: 20, textAlign: "center", fontSize: 13, marginRight: 4 },
  metaText:  { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, flex: 1 },

  admission: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.inkSoft, marginBottom: 16 },

  capacityWrap: { marginBottom: 12 },
  capacityBar:  { height: 8, backgroundColor: colors.paperDeep, borderRadius: radius.full, overflow: "hidden", marginBottom: 4 },
  capacityFill: { height: 8, backgroundColor: colors.ochre, borderRadius: radius.full },
  capacityText: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },

  cardFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderTopWidth: 1, borderTopColor: "rgba(200,191,176,0.4)", paddingTop: 12,
  },
  attendingText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },

  rsvpBtn: {
    backgroundColor: colors.ochre, borderRadius: radius.full,
    paddingHorizontal: space[4], paddingVertical: 6,
  },
  rsvpBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },

  ticketBtn: {
    borderWidth: 1, borderColor: colors.ink, borderRadius: radius.full,
    paddingHorizontal: space[4], paddingVertical: 6,
    backgroundColor: colors.paper,
  },
  ticketBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },

  centred:      { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6] },
  errorText:    { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute, textAlign: "center", marginBottom: space[3] },
  retryBtn:     { backgroundColor: colors.ink, borderRadius: radius.xl, paddingHorizontal: space[5], paddingVertical: space[2] },
  retryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },
  emptyText:    { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.ghost, textAlign: "center", marginTop: space[8] },
});
