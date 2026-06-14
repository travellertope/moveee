import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  ActivityIndicator,
  Linking,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, CULTURE_API } from "../../api/client";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AboutField { label: string; value: string; }
interface SelectedWork { imageUrl?: string; caption: string; }
interface RelatedEntry { id: number; title: string; type: string; slug: string; }
interface CommunityPost {
  id: number; slug: string; title: string; excerpt: string;
  templateType: string; authorName: string; authorUsername: string;
  starRating: number;
}
interface EventRow {
  id: number; title: string; startDate: string;
  location?: string; admission?: string;
}
interface DirectoryEntry {
  id: number; title: string; slug: string; excerpt: string; body: string;
  imageUrl: string | null; entryType: string; interests: string[];
  city: string; isPartner: boolean; averageRating: number; reviewCount: number;
  aboutFields: AboutField[]; entryQuote: string;
  selectedWorks: SelectedWork[]; relatedEntries: RelatedEntry[];
  communityPosts: CommunityPost[]; communityPostCount: number;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { badgeColor: string; gradient: readonly [string, string, string] }> = {
  person:      { badgeColor: "#B38238", gradient: ["#B38238", "#E2A684", "#F3ECE0"] },
  place:       { badgeColor: "#2D9CDB", gradient: ["#1976D2", "#2D9CDB", "#E2A684"] },
  food:        { badgeColor: "#C5491F", gradient: ["#C5491F", "#E2A684", "#F3ECE0"] },
  book:        { badgeColor: "#3A342B", gradient: ["#3A342B", "#7A6F5C", "#C8BFB0"] },
  film:        { badgeColor: "#1976D2", gradient: ["#1976D2", "#2D9CDB", "#E2A684"] },
  genre:       { badgeColor: "#6B48A8", gradient: ["#6B48A8", "#9b51e0", "#E2A684"] },
  movement:    { badgeColor: "#6B48A8", gradient: ["#3A342B", "#7A6F5C", "#C8BFB0"] },
  artwork:     { badgeColor: "#1976D2", gradient: ["#1976D2", "#C5491F", "#E2A684"] },
  concept:     { badgeColor: "#3A342B", gradient: ["#B38238", "#E2A684", "#F3ECE0"] },
  fashion:     { badgeColor: "#7B1FA2", gradient: ["#7B1FA2", "#E2A684", "#F3ECE0"] },
  "tv-series": { badgeColor: "#00695C", gradient: ["#00695C", "#182848", "#4B6CB7"] },
};
const DEFAULT_CONFIG = { badgeColor: "#B38238", gradient: ["#B38238", "#E2A684", "#F3ECE0"] as const };

const TEMPLATE_BADGE: Record<string, { label: string; color: string }> = {
  post:               { label: "💬 POST",             color: "#3A342B" },
  "cultural-take":    { label: "🔥 CULTURAL TAKE",    color: "#6B48A8" },
  "food-review":      { label: "🍽️ FOOD REVIEW",      color: "#C5491F" },
  "hidden-gem":       { label: "💎 HIDDEN GEM",        color: "#2D9CDB" },
  "book-review":      { label: "📖 BOOK REVIEW",       color: "#3A342B" },
  "creative-showcase":{ label: "🎨 CREATIVE SHOWCASE", color: "#1976D2" },
  itinerary:          { label: "🗺️ ITINERARY",         color: "#B38238" },
  event:              { label: "📅 EVENT",             color: "#00695C" },
};

const AVATAR_GRADIENTS: Array<[string, string]> = [
  ["#9b51e0", "#f2994a"],
  ["#2D9CDB", "#9b51e0"],
  ["#C5491F", "#E2A684"],
  ["#B38238", "#E2A684"],
  ["#8E54E9", "#4776E6"],
  ["#00695C", "#4B6CB7"],
];

// Types that show selected works section
const SHOW_SELECTED_WORKS = new Set(["person", "place", "film", "artwork", "fashion", "book"]);
// Types that show upcoming events
const SHOW_EVENTS = new Set(["person", "place"]);
// Types that show star rating on community cards
const SHOW_STAR_RATING = new Set(["food", "book"]);
// Types that can have a blockquote
const SHOW_BLOCKQUOTE = new Set(["book", "concept"]);

const HERO_HEIGHT = 220;

function avatarColors(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function formatEventDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: d.toLocaleDateString("en-GB", { month: "short" }).toUpperCase(),
    };
  } catch { return { day: "?", month: "???" }; }
}

// ── Styles factory ──────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: c.paper },
    heroWrap:      { width: "100%", height: HERO_HEIGHT, position: "relative" },
    heroImage:     { width: "100%", height: HERO_HEIGHT },
    heroGradient:  { ...StyleSheet.absoluteFillObject },
    heroOverlay:   { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
    heroFade:      {
      position: "absolute", bottom: 0, left: 0, right: 0, height: HERO_HEIGHT * 0.4,
    },
    heroBack: {
      position: "absolute", top: 0, left: 0,
      width: 44, height: 44, justifyContent: "center", alignItems: "flex-start",
    },
    heroShare: {
      position: "absolute", top: 0, right: 0,
      width: 44, height: 44, justifyContent: "center", alignItems: "flex-end",
    },
    typeBadge: {
      position: "absolute", bottom: 16, left: 16,
      paddingHorizontal: 10, paddingVertical: 4,
      borderRadius: radius.full,
    },
    typeBadgeText: {
      fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 0.8, textTransform: "uppercase",
    },

    // Content
    content:       { flex: 1 },
    px:            { paddingHorizontal: 16 },

    title: {
      fontFamily: fonts.serifBold, fontSize: 26, lineHeight: 30,
      color: c.ink, marginTop: 16, paddingHorizontal: 16,
    },
    tagsRow:       { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginTop: 8, paddingBottom: 4 },
    tag: {
      height: 28, paddingHorizontal: 12, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost, justifyContent: "center",
    },
    tagText:       { fontFamily: fonts.sansBold, fontSize: 11, color: c.inkSoft },

    excerpt: {
      fontFamily: fonts.sans, fontSize: 15, lineHeight: 24.75,
      color: c.inkSoft, paddingHorizontal: 16, marginTop: 12,
    },
    divider:       { height: 1, backgroundColor: c.ghost + "33", marginTop: 12 },

    body: {
      fontFamily: fonts.sans, fontSize: 14, lineHeight: 23.8,
      color: c.inkSoft, paddingHorizontal: 16, marginTop: 12,
    },
    readMoreBtn:   { paddingHorizontal: 16, marginTop: 8 },
    readMoreText:  { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },

    blockquote: {
      marginHorizontal: 16, marginTop: 16,
      backgroundColor: c.paperWarm,
      borderLeftWidth: 3, borderLeftColor: c.ochre,
      borderRadius: 4, // right-side radius approximated
      padding: 12,
    },
    blockquoteText: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: 15, color: c.inkSoft },

    // About card
    aboutCard: {
      marginHorizontal: 16, marginTop: 16,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.xl, ...shadows.card, padding: 16,
    },
    aboutLabel: {
      fontFamily: fonts.sansBold, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8,
    },
    aboutRow: {
      minHeight: 40, paddingVertical: 8, flexDirection: "row",
      justifyContent: "space-between", alignItems: "flex-start", gap: 16,
      borderBottomWidth: 1, borderBottomColor: c.ghost + "33",
    },
    aboutRowLast: { borderBottomWidth: 0 },
    aboutKey:  { fontFamily: fonts.sans, fontSize: 13, color: c.mute, width: 120, flexShrink: 0, paddingTop: 2 },
    aboutVal:  { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, flex: 1, textAlign: "right" },

    // Section headers
    sectionHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, marginTop: 20, marginBottom: 8,
    },
    sectionTitle:  { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    sectionCount:  { fontFamily: fonts.mono, fontSize: 11, color: c.ghost },

    // Selected works
    worksScroll:   { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
    workItem:      { width: 120, flexShrink: 0 },
    workImage:     { width: 120, height: 120, borderRadius: radius.lg, ...shadows.card },
    workCaption:   { fontFamily: fonts.sans, fontSize: 11, color: c.inkSoft, textAlign: "center", marginTop: 4 },

    // Upcoming events
    eventRow: {
      flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 12,
      borderBottomWidth: 1, borderBottomColor: c.ghost + "33",
      alignItems: "center",
    },
    eventDateBlock: { width: 48, alignItems: "center", flexShrink: 0 },
    eventDay:       { fontFamily: fonts.sansBold, fontSize: 18, color: c.ink, lineHeight: 22 },
    eventMonth:     { fontFamily: fonts.mono, fontSize: 10, color: c.mute, textTransform: "uppercase" },
    eventInfo:      { flex: 1 },
    eventTitle:     { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    eventMeta:      { fontFamily: fonts.mono, fontSize: 12, color: c.mute, marginTop: 2 },
    eventPrice:     { fontFamily: fonts.sansBold, fontSize: 12, color: c.ochre },

    // Community reviews
    reviewsScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
    reviewCard: {
      width: 220, flexShrink: 0,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.lg, ...shadows.card, padding: 12,
    },
    reviewTemplateBadge: {
      alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: radius.full, marginBottom: 8,
    },
    reviewTemplateBadgeText: {
      fontFamily: fonts.sansBold, fontSize: 8, textTransform: "uppercase", letterSpacing: 0.8,
    },
    reviewAuthorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    reviewAvatar:    { width: 24, height: 24, borderRadius: 12, flexShrink: 0 },
    reviewAuthorName:{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, flex: 1 },
    reviewStarRow:   { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
    reviewStarText:  { fontFamily: fonts.monoBold, fontSize: 12, color: c.ochre },
    reviewExcerpt: {
      fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft,
      lineHeight: 19.5, marginTop: 6,
    },
    reviewReadBtn:   { fontFamily: fonts.sans, fontSize: 12, color: c.ochre, marginTop: 6 },
    reviewsSeeAll:   { textAlign: "center", fontFamily: fonts.sans, fontSize: 13, color: c.ochre, marginTop: 12 },

    // Related entries
    relatedScroll: { paddingHorizontal: 16, gap: 8, paddingBottom: 8 },
    relatedPill: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: 14,
      flexShrink: 0, ...shadows.card,
    },
    relatedAvatar:  { width: 28, height: 28, borderRadius: 14, flexShrink: 0 },
    relatedName:    { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    relatedType:    { fontFamily: fonts.mono, fontSize: 9, color: c.ghost, marginLeft: 8 },

    // Improve CTA
    improveCta: {
      marginHorizontal: 16, marginTop: 24, marginBottom: 32,
      backgroundColor: c.paperWarm, borderRadius: radius.lg,
      height: 52, paddingHorizontal: 16, flexDirection: "row",
      alignItems: "center", justifyContent: "space-between", ...shadows.card,
    },
    improveLeft:   { flexDirection: "row", alignItems: "center", gap: 8 },
    improveText:   { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    improveBtn:    { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },

    // Loading / error
    centered:      { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
    errorText:     { fontFamily: fonts.sans, fontSize: 14, color: c.mute, textAlign: "center", marginBottom: 16 },
    retryBtn: {
      borderWidth: 1, borderColor: c.ochre, borderRadius: radius.lg,
      paddingHorizontal: 20, paddingVertical: 10,
    },
    retryText:     { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre },
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StarRating({ score, styles }: { score: number; styles: ReturnType<typeof createStyles> }) {
  if (!score) return null;
  const stars = "★".repeat(Math.round(score)) + "☆".repeat(5 - Math.round(score));
  return (
    <View style={styles.reviewStarRow}>
      <Text style={styles.reviewStarText}>{stars} {score.toFixed(1)}</Text>
    </View>
  );
}

function CommunityReviewCard({
  post, showRating, styles, c,
}: {
  post: CommunityPost;
  showRating: boolean;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  const badge = TEMPLATE_BADGE[post.templateType] ?? TEMPLATE_BADGE.post;
  const [g1, g2] = avatarColors(post.authorName);
  return (
    <View style={styles.reviewCard}>
      <View style={[styles.reviewTemplateBadge, { backgroundColor: badge.color + "1A" }]}>
        <Text style={[styles.reviewTemplateBadgeText, { color: badge.color }]}>{badge.label}</Text>
      </View>
      <View style={styles.reviewAuthorRow}>
        <LinearGradient colors={[g1, g2]} style={styles.reviewAvatar} />
        <Text style={styles.reviewAuthorName} numberOfLines={1}>{post.authorName}</Text>
      </View>
      {showRating && post.starRating > 0 && <StarRating score={post.starRating} styles={styles} />}
      <Text style={styles.reviewExcerpt} numberOfLines={2}>{post.excerpt || post.title}</Text>
      <Text style={styles.reviewReadBtn}>Read post →</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function DirectoryDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { slug, id, title: routeTitle, entryType: routeType } = route.params ?? {};
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();

  const [entry, setEntry] = useState<DirectoryEntry | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [bodyExpanded, setBodyExpanded] = useState(false);

  // Derive display values (optimistic while loading)
  const displayType = entry?.entryType ?? routeType ?? "concept";
  const typeConfig = TYPE_CONFIG[displayType] ?? DEFAULT_CONFIG;
  const { badgeColor, gradient } = typeConfig;

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(false);
        const params = slug ? `slug=${encodeURIComponent(slug)}` : `id=${id}`;
        const res = await api.get<DirectoryEntry>(`${CULTURE_API}/mobile/directory/entry?${params}`, false);
        setEntry(res);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, id]);

  // Fetch events for person + place
  useEffect(() => {
    if (!entry || !SHOW_EVENTS.has(entry.entryType)) return;
    (async () => {
      try {
        const res = await api.get<{ events?: EventRow[] }>(`${CULTURE_API}/directory/${entry.id}/events`, false);
        setEvents(res.events ?? (Array.isArray(res) ? res as EventRow[] : []));
      } catch { /* optional */ }
    })();
  }, [entry]);

  const handleShare = () => {
    const title = entry?.title ?? routeTitle ?? "Directory entry";
    const url = `https://connect.themoveee.com/directory/${entry?.slug ?? slug ?? ""}`;
    Share.share({ message: `${title} on Moveee: ${url}`, url });
  };

  // ── Loading ──
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Hero gradient placeholder */}
        <LinearGradient
          colors={gradient as unknown as string[]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroWrap}
        >
          <TouchableOpacity style={[styles.heroBack, { paddingTop: insets.top }]} onPress={() => nav.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.centered}>
          <ActivityIndicator color={c.ochre} />
        </View>
      </View>
    );
  }

  // ── Error ──
  if (error || !entry) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={gradient as unknown as string[]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.heroWrap}
        >
          <TouchableOpacity style={[styles.heroBack, { paddingTop: insets.top }]} onPress={() => nav.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Unable to load this entry.{"\n"}Check your connection and try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const showSelectedWorks = SHOW_SELECTED_WORKS.has(entry.entryType) && entry.selectedWorks.length > 0;
  const showEvents = SHOW_EVENTS.has(entry.entryType) && events.length > 0;
  const showBlockquote = SHOW_BLOCKQUOTE.has(entry.entryType) && !!entry.entryQuote;
  const showStarRating = SHOW_STAR_RATING.has(entry.entryType);

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* ── Hero ── */}
        <View style={styles.heroWrap}>
          {entry.imageUrl ? (
            <Image source={{ uri: entry.imageUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <LinearGradient
              colors={gradient as unknown as string[]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
          )}
          {/* Bottom fade overlay */}
          <LinearGradient
            colors={["transparent", "rgba(20,17,13,0.75)"]}
            style={styles.heroFade}
            pointerEvents="none"
          />
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: badgeColor + "1A" }]}>
            <Text style={[styles.typeBadgeText, { color: badgeColor }]}>
              {entry.entryType.replace("-", " ").toUpperCase()}
            </Text>
          </View>
          {/* Back + Share buttons — always over hero */}
          <TouchableOpacity
            style={[styles.heroBack, { paddingTop: insets.top }]}
            onPress={() => nav.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 }} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.heroShare, { paddingTop: insets.top }]}
            onPress={handleShare}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="share-social-outline" size={20} color="#ffffff" style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 }} />
          </TouchableOpacity>
        </View>

        {/* ── Title ── */}
        <Text style={styles.title}>{entry.title}</Text>

        {/* ── Interest tags ── */}
        {entry.interests.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagsRow}
          >
            {entry.interests.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Excerpt (3-line clamp) ── */}
        {!!entry.excerpt && (
          <Text style={styles.excerpt} numberOfLines={3}>{entry.excerpt}</Text>
        )}
        <View style={styles.divider} />

        {/* ── Body (4-line clamp + read more) ── */}
        {!!entry.body && (
          <>
            <Text
              style={styles.body}
              numberOfLines={bodyExpanded ? undefined : 4}
            >
              {entry.body.replace(/<[^>]+>/g, "")}
            </Text>
            {showBlockquote && !bodyExpanded && (
              <View style={styles.blockquote}>
                <Text style={styles.blockquoteText}>"{entry.entryQuote}"</Text>
              </View>
            )}
            <TouchableOpacity style={styles.readMoreBtn} onPress={() => setBodyExpanded(!bodyExpanded)}>
              <Text style={styles.readMoreText}>
                {bodyExpanded ? "Show less ↑" : "Read more ↓"}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {showBlockquote && bodyExpanded && (
          <View style={styles.blockquote}>
            <Text style={styles.blockquoteText}>"{entry.entryQuote}"</Text>
          </View>
        )}

        {/* ── About card ── */}
        {entry.aboutFields.length > 0 && (
          <View style={styles.aboutCard}>
            <Text style={styles.aboutLabel}>About</Text>
            {entry.aboutFields.map((field, i) => (
              <View
                key={field.label + i}
                style={[styles.aboutRow, i === entry.aboutFields.length - 1 && styles.aboutRowLast]}
              >
                <Text style={styles.aboutKey}>{field.label}</Text>
                <Text style={styles.aboutVal}>{field.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Selected Works ── */}
        {showSelectedWorks && (
          <View style={{ marginTop: 16 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Selected Works</Text>
              <Text style={styles.sectionCount}>{entry.selectedWorks.length}</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.worksScroll}
            >
              {entry.selectedWorks.map((work, i) => (
                <View key={i} style={styles.workItem}>
                  {work.imageUrl ? (
                    <Image source={{ uri: work.imageUrl }} style={styles.workImage} resizeMode="cover" />
                  ) : (
                    <LinearGradient
                      colors={[gradient[0], gradient[2]] as unknown as string[]}
                      style={styles.workImage}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                  )}
                  <Text style={styles.workCaption} numberOfLines={1}>{work.caption}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Upcoming Events (person + place) ── */}
        {showEvents && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <Text style={styles.sectionCount}>{events.length}</Text>
            </View>
            {events.map((ev, i) => {
              const { day, month } = formatEventDate(ev.startDate);
              return (
                <View key={ev.id} style={[styles.eventRow, i === events.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={styles.eventDateBlock}>
                    <Text style={styles.eventDay}>{day}</Text>
                    <Text style={styles.eventMonth}>{month}</Text>
                  </View>
                  <View style={styles.eventInfo}>
                    <Text style={styles.eventTitle} numberOfLines={1}>{ev.title}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                      {ev.location && (
                        <Text style={styles.eventMeta}>{ev.location}</Text>
                      )}
                      {ev.admission && (
                        <Text style={styles.eventPrice}>{ev.admission}</Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Community Reviews ── */}
        {entry.communityPosts.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Reviews</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.reviewsScroll}
            >
              {entry.communityPosts.map((post) => (
                <CommunityReviewCard
                  key={post.id}
                  post={post}
                  showRating={showStarRating}
                  styles={styles}
                  c={c}
                />
              ))}
            </ScrollView>
            {entry.communityPostCount > 0 && (
              <Text style={styles.reviewsSeeAll}>
                See all {entry.communityPostCount} post{entry.communityPostCount !== 1 ? "s" : ""} →
              </Text>
            )}
          </View>
        )}

        {/* ── Related Entries ── */}
        {entry.relatedEntries.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Related</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {entry.relatedEntries.map((rel) => {
                const relConfig = TYPE_CONFIG[rel.type] ?? DEFAULT_CONFIG;
                return (
                  <TouchableOpacity
                    key={rel.id}
                    style={styles.relatedPill}
                    onPress={() => nav.push("DirectoryDetail", { id: rel.id, title: rel.title, entryType: rel.type })}
                    activeOpacity={0.75}
                  >
                    <LinearGradient
                      colors={relConfig.gradient as unknown as string[]}
                      style={styles.relatedAvatar}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    />
                    <Text style={styles.relatedName}>{rel.title}</Text>
                    <Text style={styles.relatedType}>{rel.type.toUpperCase()}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* ── Improve CTA ── */}
        <View style={styles.improveCta}>
          <View style={styles.improveLeft}>
            <Text style={{ fontSize: 16 }}>✏️</Text>
            <Text style={styles.improveText}>Know more about this entry?</Text>
          </View>
          <TouchableOpacity onPress={() => nav.navigate("DirectorySubmit", { improvingSlug: entry.slug })}>
            <Text style={styles.improveBtn}>Improve →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
