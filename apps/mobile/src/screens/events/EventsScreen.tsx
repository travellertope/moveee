import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Image,
  TouchableOpacity, ActivityIndicator, RefreshControl, Modal, TextInput,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";

const EVENTS_URL = "https://themoveee.com/api/events/list?per_page=50";

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
  isLiterati: boolean;
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
    venue:         pick(cem.location, meta._culture_location),
    city:          pick(cem.city, meta._culture_event_city),
    country:       pick(cem.country, meta._culture_event_country),
    admission:     pick(cem.admission, meta._culture_admission),
    ticketUrl:     pick(cem.ticketing_url, meta._culture_ticketing_url),
    isOnline:      !!(cem.is_online || meta._culture_event_is_online),
    isProOnly:     !!(cem.pro_only || meta._culture_event_pro_only),
    category:      pick(cem.category, meta._culture_event_category),
    organiserName: pick(cem.organiser_name, meta._culture_event_organiser_name),
    organiserSlug: pick(cem.organiser_slug, meta._culture_event_organiser_slug),
    attendeeCount: wp.rsvp_count ?? undefined,
    isLiterati:    !!(cem.is_literati || meta._culture_event_is_literati),
  };
}

function fmtTime12(d: string | null): { time: string; ampm: string } {
  if (!d) return { time: "", ampm: "" };
  try {
    const date = new Date(d);
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return { time: `${h}:${m.toString().padStart(2, "0")}`, ampm };
  } catch {
    return { time: "", ampm: "" };
  }
}

function dateKey(d: string): string {
  return new Date(d).toDateString();
}

function isOngoing(event: EventItem): boolean {
  if (!event.eventDate || !event.endDate) return false;
  const start = new Date(event.eventDate);
  const end = new Date(event.endDate);
  if (dateKey(event.eventDate) === dateKey(event.endDate)) return false;
  const now = new Date();
  return start <= now && now <= end;
}

function dateHeaderLabel(d: string): string {
  try {
    return new Date(d)
      .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })
      .toUpperCase();
  } catch {
    return d;
  }
}

function fmtDateShort(d: string | null): string {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

function mondayOf(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 Sun .. 6 Sat
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

// ── Category styling ─────────────────────────────────────────────────────────
const CATEGORY_STYLES: { keys: string[]; color: string; label: string }[] = [
  { keys: ["music"],            color: "#C5491F", label: "Live Music" },
  { keys: ["night"],            color: "#7B1FA2", label: "Nightlife" },
  { keys: ["food", "drink"],    color: "#B38238", label: "Food & Drink" },
  { keys: ["film"],             color: "#1976D2", label: "Film" },
  { keys: ["art", "visual"],    color: "#6B48A8", label: "Visual Art" },
  { keys: ["lit"],              color: "#78350F", label: "Literature" },
  { keys: ["tech", "idea"],     color: "#3A342B", label: "Tech & Ideas" },
  { keys: ["performance"],      color: "#00695C", label: "Performance" },
  { keys: ["community"],        color: "#2D6A4F", label: "Community" },
];

function categoryStyle(category: string | null, isOnline: boolean): { color: string; label: string } {
  if (category) {
    const norm = category.toLowerCase();
    const found = CATEGORY_STYLES.find((s) => s.keys.some((k) => norm.includes(k)));
    if (found) return found;
  }
  if (isOnline) return { color: "#1976D2", label: "Online" };
  return { color: "#7A6F5C", label: category ? category.replace(/-/g, " ") : "Event" };
}

const TYPE_OPTIONS = [...CATEGORY_STYLES.map((s) => s.label), "Online"];

function matchesType(event: EventItem, typeLabel: string): boolean {
  if (typeLabel === "Online") return event.isOnline;
  return categoryStyle(event.category, false).label === typeLabel;
}

type PriceFilter = "Free" | "Paid" | "Any";
type WhenFilter  = "Today" | "This Weekend" | "This Month" | "Any";

function inWindow(dateStr: string | null, when: WhenFilter): boolean {
  if (when === "Any" || !dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (when === "Today") return d.toDateString() === now.toDateString();
  if (when === "This Weekend") {
    const day = now.getDay();
    const satOffset = (6 - day + 7) % 7;
    const sat = new Date(now);
    sat.setDate(now.getDate() + satOffset);
    sat.setHours(0, 0, 0, 0);
    const sun = addDays(sat, 1);
    sun.setHours(23, 59, 59, 999);
    return d >= sat && d <= sun;
  }
  if (when === "This Month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
}

// ── Timeline row ───────────────────────────────────────────────────────────
function TimelineRow({
  event, going, showRail = true, onPress, styles,
}: { event: EventItem; going: boolean; showRail?: boolean; onPress: () => void; styles: ReturnType<typeof createStyles> }) {
  const style  = categoryStyle(event.category, event.isOnline);
  const isFree = !event.admission || event.admission.toLowerCase().includes("free");
  const time   = fmtTime12(event.eventDate);
  const ongoing = isOngoing(event);

  return (
    <TouchableOpacity style={styles.timelineRow} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.timeCol}>
        {time.time ? (
          <>
            <Text style={styles.timeText}>{time.time}</Text>
            <Text style={styles.ampmText}>{time.ampm}</Text>
          </>
        ) : null}
      </View>

      {showRail ? (
        <View style={styles.dotCol}>
          <View style={[styles.railDot, { backgroundColor: style.color }]} />
        </View>
      ) : null}

      <View style={styles.timelineCard}>
        <View style={[styles.accentBar, { backgroundColor: style.color }]} />

        <View style={styles.timelineCardHeader}>
          <View style={styles.timelineCatRow}>
            {ongoing ? (
              <View style={styles.ongoingBadge}>
                <Text style={styles.ongoingBadgeText}>● ONGOING</Text>
              </View>
            ) : null}
            <View style={[styles.catDot, { backgroundColor: style.color }]} />
            <Text style={styles.timelineCatText}>{style.label}</Text>
          </View>
          {going ? (
            <View style={styles.goingBadge}>
              <Text style={styles.goingBadgeText}>✓ Going</Text>
            </View>
          ) : null}
        </View>

        <Text style={styles.timelineTitle} numberOfLines={2}>{event.title}</Text>

        <Text style={styles.timelineMetaText} numberOfLines={1}>
          {event.isOnline
            ? "🔗 Online Event"
            : `📍 ${[event.venue, event.city].filter(Boolean).join(" · ") || "Location TBA"}`}
        </Text>

        <View style={styles.timelineFooter}>
          <Text style={styles.timelinePrice}>{isFree ? "Free" : event.admission}</Text>
          {event.attendeeCount ? (
            <Text style={styles.timelineAttendees}>👥 {event.attendeeCount} going</Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function LiteratiRail({
  events, nearby, onPress, styles, c,
}: { events: EventItem[]; nearby: boolean; onPress: (e: EventItem) => void; styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  if (events.length === 0) return null;
  return (
    <View style={styles.literatiSection}>
      <View style={styles.literatiHeader}>
        <Text style={styles.literatiHeaderText}>🪶 Literati Connect{nearby ? " near you" : ""}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.literatiRailContent}>
        {events.map((e) => (
          <TouchableOpacity key={e.id} style={styles.literatiCard} onPress={() => onPress(e)} activeOpacity={0.85}>
            {e.imageUrl ? (
              <Image source={{ uri: e.imageUrl }} style={styles.literatiCardImg} />
            ) : (
              <View style={[styles.literatiCardImg, { backgroundColor: c.paperWarm }]} />
            )}
            <View style={styles.literatiCardBody}>
              <Text style={styles.literatiCardTitle} numberOfLines={2}>{e.title}</Text>
              <Text style={styles.literatiCardMeta} numberOfLines={1}>
                {[fmtDateShort(e.eventDate), e.city].filter(Boolean).join(" · ")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function EventsScreen() {
  const nav = useNav();
  const { user } = useAuthStore() as any;
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [events, setEvents]         = useState<EventItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [view, setView]             = useState<"list" | "calendar">("list");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [goingSlugs, setGoingSlugs] = useState<Set<string>>(new Set());

  // Filters
  const [typeFilters, setTypeFilters] = useState<Set<string>>(new Set());
  const [cityFilters, setCityFilters] = useState<Set<string>>(new Set());
  const [citySearch, setCitySearch]   = useState("");
  const [price, setPrice]             = useState<PriceFilter>("Any");
  const [when, setWhen]               = useState<WhenFilter>("Any");
  const [proOnly, setProOnly]         = useState(false);

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const fetchEvents = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(EVENTS_URL, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.json();
      const raw: any[] = Array.isArray(body) ? body : [];
      setEvents(raw.map(mapEvent));
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError("Request timed out. Pull to refresh.");
      } else {
        setError("Could not load events. Pull to refresh.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!user) return;
    api.get<{ rsvps: { slug: string; status: string }[] }>(`${MOBILE_API}/events/my-rsvps`)
      .then((res) => {
        const slugs = (res.rsvps ?? []).filter((r) => r.status !== "cancelled").map((r) => r.slug);
        setGoingSlugs(new Set(slugs));
      })
      .catch(() => {});
  }, [user]);

  const availableCities = useMemo(() => {
    const cities = Array.from(new Set(events.map((e) => e.city).filter(Boolean) as string[])).sort();
    return cities;
  }, [events]);

  const filteredCityChips = useMemo(() => {
    if (!citySearch.trim()) return availableCities;
    return availableCities.filter((city) => city.toLowerCase().includes(citySearch.trim().toLowerCase()));
  }, [availableCities, citySearch]);

  const filtered = useMemo(() => {
    let result = events.filter((e) => {
      if (typeFilters.size > 0 && !Array.from(typeFilters).some((t) => matchesType(e, t))) return false;
      if (cityFilters.size > 0 && (!e.city || !cityFilters.has(e.city))) return false;
      const isFree = !e.admission || e.admission.toLowerCase().includes("free");
      if (price === "Free" && !isFree) return false;
      if (price === "Paid" && isFree) return false;
      if (!inWindow(e.eventDate, when)) return false;
      if (proOnly && !e.isProOnly) return false;
      return true;
    });
    result = [...result].sort((a, b) => {
      if (!a.eventDate && !b.eventDate) return 0;
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return a.eventDate.localeCompare(b.eventDate);
    });
    return result;
  }, [events, typeFilters, cityFilters, price, when, proOnly]);

  const userCity = (user?.city ?? "").toLowerCase().trim();
  const literatiNearby = useMemo(
    () => (userCity ? events.filter((e) => e.isLiterati && (e.city ?? "").toLowerCase().includes(userCity)) : []),
    [events, userCity]
  );
  const literatiAll = useMemo(() => events.filter((e) => e.isLiterati), [events]);
  const literatiEvents = (literatiNearby.length > 0 ? literatiNearby : literatiAll).slice(0, 10);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    typeFilters.forEach((t) => chips.push({ key: `type-${t}`, label: t, onRemove: () => setTypeFilters((s) => { const n = new Set(s); n.delete(t); return n; }) }));
    cityFilters.forEach((ct) => chips.push({ key: `city-${ct}`, label: ct, onRemove: () => setCityFilters((s) => { const n = new Set(s); n.delete(ct); return n; }) }));
    if (price !== "Any")  chips.push({ key: "price", label: price, onRemove: () => setPrice("Any") });
    if (when  !== "Any")  chips.push({ key: "when",  label: when,  onRemove: () => setWhen("Any") });
    if (proOnly)          chips.push({ key: "pro",   label: "Pro Only", onRemove: () => setProOnly(false) });
    return chips;
  }, [typeFilters, cityFilters, price, when, proOnly]);

  const clearAllFilters = () => {
    setTypeFilters(new Set());
    setCityFilters(new Set());
    setPrice("Any");
    setWhen("Any");
    setProOnly(false);
  };

  // ── Calendar derived data ──────────────────────────────────────────────
  const weekStart = useMemo(() => mondayOf(selectedDate), [selectedDate]);
  const weekDays   = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const monthLabel = useMemo(
    () => selectedDate.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    [selectedDate]
  );
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    filtered.forEach((e) => {
      if (!e.eventDate) return;
      const key = dateKey(e.eventDate);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    return map;
  }, [filtered]);
  const selectedDayEvents = useMemo(
    () => (eventsByDay.get(selectedDate.toDateString()) ?? []).sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? "")),
    [eventsByDay, selectedDate]
  );

  // ── List (timeline) view grouping ──────────────────────────────────────
  const grouped = useMemo(() => {
    const groups: { key: string; label: string; items: EventItem[] }[] = [];
    filtered.forEach((e) => {
      const key = e.eventDate ? dateKey(e.eventDate) : "tba";
      let g = groups.find((grp) => grp.key === key);
      if (!g) {
        g = { key, label: e.eventDate ? dateHeaderLabel(e.eventDate) : "DATE TBA", items: [] };
        groups.push(g);
      }
      g.items.push(e);
    });
    return groups;
  }, [filtered]);

  const timelineChildren: React.ReactNode[] = [];
  const stickyIndices: number[] = [];
  if (literatiEvents.length > 0) {
    timelineChildren.push(
      <LiteratiRail
        key="literati-rail"
        events={literatiEvents}
        nearby={literatiNearby.length > 0}
        onPress={(e) => nav.navigate("EventDetail", { event: e })}
        styles={styles}
        c={c}
      />
    );
  }
  grouped.forEach((g) => {
    stickyIndices.push(timelineChildren.length);
    timelineChildren.push(
      <View key={`h-${g.key}`} style={styles.dateHeader}>
        <Text style={styles.dateHeaderText}>{g.label}</Text>
        <View style={styles.dateHeaderLine} />
      </View>
    );
    g.items.forEach((e) => {
      timelineChildren.push(
        <TimelineRow
          key={e.id}
          event={e}
          going={goingSlugs.has(e.slug)}
          onPress={() => nav.navigate("EventDetail", { event: e })}
          styles={styles}
        />
      );
    });
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => setFilterSheetOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View>
              <Ionicons name="funnel-outline" size={20} color={activeFilterChips.length > 0 ? c.ochre : c.ink} />
              {activeFilterChips.length > 0 && <View style={styles.filterDot} />}
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate("MyRSVPs")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="calendar-outline" size={22} color={c.ink} />
          </TouchableOpacity>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === "list" && styles.viewToggleBtnActive]}
              onPress={() => setView("list")}
            >
              <Text style={[styles.viewToggleText, view === "list" && styles.viewToggleTextActive]}>☰ List</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === "calendar" && styles.viewToggleBtnActive]}
              onPress={() => setView("calendar")}
            >
              <Text style={[styles.viewToggleText, view === "calendar" && styles.viewToggleTextActive]}>▦ Calendar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activeFiltersBar} contentContainerStyle={styles.activeFiltersContent}>
          {activeFilterChips.map((chip) => (
            <TouchableOpacity key={chip.key} style={styles.activeChip} onPress={chip.onRemove}>
              <Text style={styles.activeChipText}>{chip.label}</Text>
              <Text style={styles.activeChipRemove}>✕</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={clearAllFilters}>
            <Text style={styles.clearAllText}>Clear all</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Filter sheet */}
      <Modal visible={filterSheetOpen} transparent animationType="slide" onRequestClose={() => setFilterSheetOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setFilterSheetOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter Events</Text>
            <TouchableOpacity onPress={clearAllFilters}>
              <Text style={styles.sheetReset}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetContent}>
            {/* Event Type */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>Event Type</Text>
              <View style={styles.chipWrap}>
                {TYPE_OPTIONS.map((t) => {
                  const active = typeFilters.has(t);
                  return (
                    <TouchableOpacity
                      key={t}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setTypeFilters((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n; })}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* City */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>City</Text>
              <View style={styles.citySearchWrap}>
                <Ionicons name="search-outline" size={16} color={c.ghost} style={styles.citySearchIcon} />
                <TextInput
                  style={styles.citySearchInput}
                  placeholder="Search city"
                  placeholderTextColor={c.ghost}
                  value={citySearch}
                  onChangeText={setCitySearch}
                />
              </View>
              <View style={styles.chipWrap}>
                {filteredCityChips.map((ct) => {
                  const active = cityFilters.has(ct);
                  return (
                    <TouchableOpacity
                      key={ct}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setCityFilters((s) => { const n = new Set(s); n.has(ct) ? n.delete(ct) : n.add(ct); return n; })}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{ct}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Price */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>Price</Text>
              <View style={styles.chipWrap}>
                {(["Free", "Paid", "Any"] as PriceFilter[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, price === p && styles.chipActive]}
                    onPress={() => setPrice(p)}
                  >
                    <Text style={[styles.chipText, price === p && styles.chipTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* When */}
            <View style={styles.sheetSection}>
              <Text style={styles.sheetSectionLabel}>When</Text>
              <View style={styles.chipWrap}>
                {(["Today", "This Weekend", "This Month", "Any"] as WhenFilter[]).map((w) => (
                  <TouchableOpacity
                    key={w}
                    style={[styles.chip, when === w && styles.chipActive]}
                    onPress={() => setWhen(w)}
                  >
                    <Text style={[styles.chipText, when === w && styles.chipTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Access */}
            <View style={[styles.sheetSection, { paddingBottom: 90 }]}>
              <Text style={styles.sheetSectionLabel}>Access</Text>
              <View style={styles.chipWrap}>
                <TouchableOpacity
                  style={[styles.chip, !proOnly && styles.chipActive]}
                  onPress={() => setProOnly(false)}
                >
                  <Text style={[styles.chipText, !proOnly && styles.chipTextActive]}>All Members</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, styles.chipGold, proOnly && styles.chipGoldActive]}
                  onPress={() => setProOnly(true)}
                >
                  <Text style={[styles.chipGoldText, proOnly && styles.chipGoldTextActive]}>⭐ Pro Only</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <View style={styles.sheetFooter}>
            <TouchableOpacity style={styles.sheetFooterBtn} onPress={() => setFilterSheetOpen(false)}>
              <Text style={styles.sheetFooterBtnText}>Show {filtered.length} event{filtered.length === 1 ? "" : "s"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Content */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={c.gold} size="large" />
      ) : error ? (
        <View style={styles.centred}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => fetchEvents()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : view === "list" ? (
        <ScrollView
          contentContainerStyle={styles.list}
          stickyHeaderIndices={stickyIndices}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} tintColor={c.gold} />}
        >
          {filtered.length === 0 ? (
            <Text style={styles.emptyText}>No events to show.</Text>
          ) : (
            timelineChildren
          )}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 90 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchEvents(true)} tintColor={c.gold} />}
        >
          {/* Month strip */}
          <View style={styles.monthStrip}>
            <TouchableOpacity onPress={() => setSelectedDate((d) => addDays(d, -7))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={c.ghost} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{monthLabel}</Text>
            <TouchableOpacity onPress={() => setSelectedDate((d) => addDays(d, 7))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={c.ghost} />
            </TouchableOpacity>
          </View>

          {/* Week grid */}
          <View style={styles.weekGrid}>
            {weekDays.map((d) => {
              const isToday    = d.toDateString() === new Date().toDateString();
              const isSelected = d.toDateString() === selectedDate.toDateString();
              const dayEvents  = eventsByDay.get(d.toDateString()) ?? [];
              const dots = Array.from(new Set(dayEvents.map((e) => categoryStyle(e.category, e.isOnline).color))).slice(0, 3);
              return (
                <TouchableOpacity key={d.toISOString()} style={styles.dayCell} onPress={() => setSelectedDate(d)}>
                  <View style={[
                    styles.dayCircle,
                    isSelected && styles.dayCircleSelected,
                    isToday && !isSelected && styles.dayCircleToday,
                  ]}>
                    <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>{d.getDate()}</Text>
                  </View>
                  <View style={styles.dayDots}>
                    {dots.map((color, i) => <View key={i} style={[styles.dayDot, { backgroundColor: color }]} />)}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected day events */}
          <View style={styles.selectedDaySection}>
            <View style={styles.selectedDayHeader}>
              <Text style={styles.selectedDayLabel}>
                {selectedDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </Text>
              <Text style={styles.selectedDayCount}>{selectedDayEvents.length} event{selectedDayEvents.length === 1 ? "" : "s"}</Text>
            </View>

            {selectedDayEvents.length === 0 ? (
              <Text style={styles.emptyText}>No events on this day.</Text>
            ) : (
              selectedDayEvents.map((e) => (
                <TimelineRow
                  key={e.id}
                  event={e}
                  going={goingSlugs.has(e.slug)}
                  showRail={false}
                  onPress={() => nav.navigate("EventDetail", { event: e })}
                  styles={styles}
                />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    literatiSection: { paddingTop: space[3], paddingBottom: space[2] },
    literatiHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], marginBottom: space[2],
    },
    literatiHeaderText: {
      fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 0.4,
      textTransform: "uppercase", color: c.ochre,
    },
    literatiRailContent: { paddingHorizontal: space[4], gap: 10 },
    literatiCard: {
      width: 200, borderRadius: radius.lg, backgroundColor: c.paper,
      borderWidth: 1, borderColor: c.ochre, overflow: "hidden", marginRight: 10,
    },
    literatiCardImg: { width: "100%", height: 100 },
    literatiCardBody: { padding: space[2] },
    literatiCardTitle: { fontFamily: fonts.serifBold, fontSize: 13, color: c.ink, marginBottom: 4 },
    literatiCardMeta: { fontFamily: fonts.sans, fontSize: 11, color: c.inkSoft },

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, paddingHorizontal: space[4],
      height: 56,
      borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)",
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink },

    viewToggle: {
      height: 32, backgroundColor: c.paperDeep, borderRadius: radius.full,
      padding: 2, flexDirection: "row", alignItems: "center",
    },
    viewToggleBtn: { height: "100%", paddingHorizontal: 12, borderRadius: radius.full, alignItems: "center", justifyContent: "center" },
    viewToggleBtnActive: { backgroundColor: c.paper, ...shadows.card },
    viewToggleText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    viewToggleTextActive: { fontFamily: fonts.sansBold, color: c.ink },

    filterDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: c.ochre, position: "absolute", top: -2, right: -4,
    },

    activeFiltersBar: { flexGrow: 0, backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.ghost },
    activeFiltersContent: { paddingHorizontal: space[4], gap: 8, paddingVertical: 8, alignItems: "center" },
    activeChip: {
      height: 28, paddingHorizontal: 12, borderRadius: radius.full,
      backgroundColor: c.ochre, flexDirection: "row", alignItems: "center", gap: 6,
    },
    activeChipText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    activeChipRemove: { fontSize: 10, color: c.paper, opacity: 0.85 },
    clearAllText: { fontFamily: fonts.sans, fontSize: 13, color: c.ghost, marginLeft: 4 },

    list: { paddingHorizontal: space[4], paddingBottom: 90 },

    // Timeline row
    timelineRow: { flexDirection: "row", alignItems: "stretch", marginBottom: 8 },
    timeCol: { width: 52, alignItems: "flex-end", paddingRight: 8, paddingTop: 20 },
    timeText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink, lineHeight: 14 },
    ampmText: { fontFamily: fonts.mono, fontSize: 9, color: c.mute, marginTop: 2 },
    dotCol: { width: 16, alignItems: "center", paddingTop: 24 },
    railDot: { width: 8, height: 8, borderRadius: 4 },

    timelineCard: {
      flex: 1, backgroundColor: c.paper, borderRadius: radius.lg,
      padding: 12, position: "relative", overflow: "hidden",
      borderWidth: 1, borderColor: c.ghost,
    },
    accentBar: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
    timelineCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    timelineCatRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    catDot: { width: 6, height: 6, borderRadius: 3 },
    timelineCatText: { fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow, color: c.mute, letterSpacing: 1.2, textTransform: "uppercase" },

    goingBadge: { backgroundColor: "rgba(45,106,79,0.12)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.full },
    goingBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: c.success },

    ongoingBadge: { backgroundColor: c.ochre, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, marginRight: 2 },
    ongoingBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper, letterSpacing: 0.5 },

    timelineTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, lineHeight: 19, marginBottom: 4 },
    timelineMetaText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },

    timelineFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 8 },
    timelinePrice: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },
    timelineAttendees: { fontFamily: fonts.sans, fontSize: 11, color: c.mute },

    dateHeader: {
      flexDirection: "row", alignItems: "center",
      backgroundColor: c.paperWarm, paddingTop: 12, paddingBottom: 8,
    },
    dateHeaderText: { fontFamily: fonts.monoBold, fontSize: 11, color: c.mute, letterSpacing: 1, marginRight: 12 },
    dateHeaderLine: { height: 1, backgroundColor: c.ghost, flex: 1, opacity: 0.5 },

    centred:      { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6] },
    errorText:    { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center", marginBottom: space[3] },
    retryBtn:     { backgroundColor: c.ink, borderRadius: radius.xl, paddingHorizontal: space[5], paddingVertical: space[2] },
    retryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.paper },
    emptyText:    { fontFamily: fonts.mono, fontSize: fontSize.sm, color: c.ghost, textAlign: "center", marginTop: space[8], marginBottom: space[4] },

    // Filter sheet
    sheetOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
    sheet: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      maxHeight: "85%",
    },
    sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: c.rule, alignSelf: "center", marginTop: 10, marginBottom: 4 },
    sheetHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    sheetTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink },
    sheetReset: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },
    sheetContent: { paddingBottom: 8 },
    sheetSection: { paddingHorizontal: space[4], paddingVertical: space[4], borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.3)" },
    sheetSectionLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: c.mute, textTransform: "uppercase", marginBottom: 10 },

    chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      height: 32, paddingHorizontal: 16, borderRadius: radius.full,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      alignItems: "center", justifyContent: "center",
    },
    chipActive: { backgroundColor: c.ink, borderColor: c.ink },
    chipText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.inkSoft },
    chipTextActive: { color: c.paper },
    chipGold: { borderColor: c.gold },
    chipGoldActive: { backgroundColor: c.gold, borderColor: c.gold },
    chipGoldText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.gold },
    chipGoldTextActive: { color: c.paper },

    citySearchWrap: {
      flexDirection: "row", alignItems: "center", position: "relative",
      height: 44, borderWidth: 1, borderColor: c.ghost, borderRadius: radius.lg,
      marginBottom: 12, paddingLeft: 40,
    },
    citySearchIcon: { position: "absolute", left: 16 },
    citySearchInput: { flex: 1, paddingRight: 16, fontFamily: fonts.sans, fontSize: 14, color: c.ink },

    sheetFooter: {
      paddingHorizontal: space[4], paddingTop: space[3], paddingBottom: space[6],
      borderTopWidth: 1, borderTopColor: "rgba(200,191,176,0.3)",
      backgroundColor: c.paper,
    },
    sheetFooterBtn: {
      height: 52, backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center", ...shadows.card,
    },
    sheetFooterBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: c.paper },

    // Calendar view
    monthStrip: {
      height: 56, backgroundColor: c.paper, flexDirection: "row",
      alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: "rgba(200,191,176,0.2)",
    },
    monthLabel: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink },

    weekGrid: {
      backgroundColor: c.paper, flexDirection: "row",
      paddingHorizontal: space[2], paddingBottom: 12, paddingTop: 8,
      ...shadows.card,
    },
    dayCell: { flex: 1, alignItems: "center" },
    dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    dayCircleToday: { borderWidth: 1, borderColor: c.ghost },
    dayCircleSelected: { backgroundColor: c.ink, ...shadows.card },
    dayNum: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },
    dayNumSelected: { fontFamily: fonts.sansBold, color: c.paper },
    dayDots: { flexDirection: "row", gap: 2, marginTop: 3, height: 4 },
    dayDot: { width: 4, height: 4, borderRadius: 2 },

    selectedDaySection: { paddingHorizontal: space[4], paddingTop: space[5] },
    selectedDayHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    selectedDayLabel: { fontFamily: fonts.sansBold, fontSize: 13, color: c.mute, textTransform: "uppercase" },
    selectedDayCount: { fontFamily: fonts.mono, fontSize: 11, color: c.ghost },
  });
}
