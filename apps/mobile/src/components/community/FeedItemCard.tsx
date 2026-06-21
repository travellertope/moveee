import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNav } from "../../hooks/useNav";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Share,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, fontSize, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API, CULTURE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import ImageLightbox from "../ui/ImageLightbox";
import HappeningDetailModal from "./HappeningDetailModal";
import DirectoryDetailModal from "./DirectoryDetailModal";
import QuoteDetailModal from "./QuoteDetailModal";
import PulseDetailSheet from "./PulseDetailSheet";
import { ReportSheet } from "../ui/Overlays";
import type { FeedItem, PollOption } from "../../types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FeedCardProps {
  item: FeedItem;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onReact?: (type: "love" | "fire" | "clap") => void;
  forYouBadge?: boolean;
  onMentionPress?: (username: string) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const SCREEN_W = Dimensions.get("window").width;

function timeAgo(d: string): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function starsText(n?: number): string {
  if (!n) return "—";
  const full = Math.round(n);
  return "★".repeat(Math.max(0, full)) + "☆".repeat(Math.max(0, 5 - full));
}

function shareUrlFor(item: FeedItem): string | undefined {
  if (!item.slug) return undefined;
  if (item.type === "pulse") return `https://web.themoveee.com/pulse/${item.slug}`;
  if (item.type === "editorial") return `https://themoveee.com/magazine/${item.slug}`;
  return `https://web.themoveee.com/community/${item.slug}`;
}

function stripLinkFromBody(body?: string | null, sourceUrl?: string | null): string | undefined {
  if (!body) return body ?? undefined;
  if (!sourceUrl) return body;
  let result = body.replace(sourceUrl, "").trim();
  result = result.replace(/\s*https?:\/\/\S+\s*$/, "").trim();
  return result || undefined;
}

function stripHtmlTags(html?: string | null): string | undefined {
  if (!html) return undefined;
  const text = html
    // Turn block-level breaks into paragraph breaks before the generic tag
    // strip below discards them — otherwise multi-paragraph excerpts collapse
    // into one continuous line.
    .replace(/<\/p>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#\d+;/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text || undefined;
}

function faviconUrl(sourceUrl?: string | null): string | undefined {
  if (!sourceUrl) return undefined;
  try {
    const domain = new URL(sourceUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return undefined;
  }
}

function SourceLine({ source, sourceUrl, style }: { source: string; sourceUrl?: string | null; style: any }) {
  const [faviconFailed, setFaviconFailed] = useState(false);
  const favicon = faviconUrl(sourceUrl);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
      {favicon && !faviconFailed ? (
        <Image source={{ uri: favicon }} style={{ width: 12, height: 12, borderRadius: 2 }} onError={() => setFaviconFailed(true)} />
      ) : (
        <Text style={{ fontSize: 11 }}>🌐</Text>
      )}
      <Text style={style}>{source}</Text>
    </View>
  );
}

// ── Styles factory ────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    // card shell
    card: {
      backgroundColor: c.paper,
      borderRadius: 12,
      marginHorizontal: 16,
      overflow: "hidden",
      ...shadows.card,
    },
    // shared text
    eyebrow: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.mute,
      flex: 1,
    },
    timeRight: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.ghost,
      marginLeft: "auto" as any,
    },
    cardTitle: {
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
      lineHeight: 26,
    },
    cardTitleXl: {
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
      lineHeight: 28,
    },
    cardBody: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.inkSoft,
      lineHeight: 20,
    },
    readMore: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ochre,
    },
    successLink: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.success,
    },
    sourceText: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
    },
    locationText: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    // author row
    authorRow: {
      flexDirection: "row" as const,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 8,
      gap: 10,
      alignItems: "flex-start" as const,
    },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: "visible" as const,
      position: "relative" as const,
    },
    avatarWrapPro: {
      borderWidth: 3.5,
      borderColor: c.gold,
      borderRadius: 20,
      shadowColor: c.gold,
      shadowOpacity: 0.85,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 0 },
      elevation: 10,
    },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    avatarFallback: {
      backgroundColor: c.goldLight,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    avatarInitial: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.gold,
    },
    authorMeta: { flex: 1 },
    nameRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
      flexWrap: "wrap" as const,
    },
    authorName: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.ink,
      flexShrink: 1,
    },
    proBadgePill: {
      backgroundColor: c.gold,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    authorDot: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
    },
    authorTime: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    authorUsername: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ghost,
      marginTop: 1,
    },
    tagChip: {
      marginTop: 4,
      backgroundColor: c.ink,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start" as const,
    },
    tagChipText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: c.paper,
    },
    topRight: {
      alignItems: "flex-end" as const,
      gap: 2,
      maxWidth: 160,
    },
    reportSent: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
    },
    // badge pill
    badgePill: {
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
      alignSelf: "flex-start" as const,
    },
    badgePillText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.tiny,
      textTransform: "uppercase" as const,
      letterSpacing: 1.2,
    },
    // link preview
    linkContainer: {
      flexDirection: "row" as const,
      backgroundColor: c.paperDeep,
      borderRadius: 6,
      padding: 12,
      marginHorizontal: 14,
      gap: 10,
      alignItems: "center" as const,
    },
    linkRight: { flex: 1 },
    linkSource: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      textTransform: "uppercase" as const,
      color: c.mute,
      marginBottom: 2,
    },
    linkTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      lineHeight: 18,
    },
    linkDomain: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
      marginTop: 2,
    },
    // reaction bar wrapper
    reactionBarWrap: {
      paddingHorizontal: 14,
      paddingBottom: 8,
    },
    // happening
    happeningContent: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 14,
    },
    happeningTitle: {
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
      lineHeight: 26,
    },
    happeningMetaRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginTop: 8,
    },
    happeningMetaText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      flex: 1,
    },
    happeningFooter: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginTop: 12,
    },
    happeningAdmission: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    happeningRsvpBtn: {
      borderWidth: 1,
      borderColor: c.ochre,
      borderRadius: radius.full,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    happeningRsvpText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: c.ochre,
    },
    // food review
    foodRatingsGrid: { marginTop: 10, gap: 4 },
    foodRatingRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      height: 24,
    },
    foodRatingLabel: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      width: 60,
    },
    foodRatingStars: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.gold,
      flex: 1,
    },
    foodRatingNum: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.gold,
      marginLeft: "auto" as any,
    },
    // creative showcase
    showcaseDots: {
      flexDirection: "row" as const,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      gap: 5,
      marginTop: 8,
    },
    showcaseDot: { width: 6, height: 6, borderRadius: 3 },
    showcaseDotActive: { backgroundColor: c.ochre },
    showcaseDotInactive: { backgroundColor: c.ghost },
    // poll
    pollQuestion: {
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
      lineHeight: 26,
      marginBottom: 10,
    },
    pollOptionWrap: {
      height: 48,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: c.rule,
      overflow: "hidden" as const,
      position: "relative" as const,
      marginBottom: 6,
    },
    pollFillBar: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      height: "100%" as any,
      minWidth: 4,
    },
    pollOptionInner: {
      position: "absolute" as const,
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 16,
    },
    pollOptionLabel: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      flex: 1,
    },
    pollOptionPct: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    pollOptionPctWinner: { color: c.ochre },
    pollMeta: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      marginTop: 4,
    },
    // itinerary
    itinStopRow: {
      flexDirection: "row" as const,
      gap: 10,
      marginBottom: 8,
      alignItems: "flex-start" as const,
    },
    itinStopNum: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.gold,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      flexShrink: 0,
    },
    itinStopNumText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.tiny,
      color: c.paper,
    },
    itinStopName: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    itinStopNote: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      marginTop: 1,
    },
    // book review
    bookCard: {
      flexDirection: "row" as const,
      gap: 12,
      marginTop: 10,
      backgroundColor: c.paperDeep,
      borderRadius: radius.md,
      padding: 10,
      alignItems: "flex-start" as const,
    },
    bookCover: {
      width: 48,
      height: 64,
      borderRadius: 4,
      flexShrink: 0,
    },
    bookCoverFallback: {
      backgroundColor: c.ghost,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    bookTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.base,
      color: c.ink,
      lineHeight: 20,
    },
    bookMeta: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.mute,
      marginTop: 2,
    },
    bookOverallWrap: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingLeft: 8,
    },
    bookOverallScore: {
      fontFamily: fonts.monoBold,
      fontSize: 22,
      color: c.ochre,
    },
    bookOverallStar: {
      fontFamily: fonts.mono,
      fontSize: 12,
      color: c.gold,
      textAlign: "center" as const,
    },
    bookFavQuote: {
      marginTop: 10,
      borderLeftWidth: 3,
      borderLeftColor: c.ochre,
      paddingLeft: 10,
    },
    bookFavQuoteText: {
      fontFamily: fonts.serifItalic,
      fontSize: fontSize.sm,
      color: c.inkSoft,
      lineHeight: 20,
    },
    // quote
    quoteContainer: {
      padding: 20,
      paddingTop: 16,
    },
    bigQuote: {
      fontFamily: fonts.serifBold,
      fontSize: 44,
      color: c.ghost,
      lineHeight: 56,
      marginBottom: -4,
    },
    quoteText: {
      fontFamily: fonts.serifItalic,
      fontSize: fontSize.xl,
      color: c.ink,
      lineHeight: 30,
      marginLeft: 8,
      marginTop: 8,
    },
    quoteAttribution: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginTop: 12,
    },
    quoteAuthor: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.inkSoft,
    },
    quoteDot: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
    },
    quoteSource: {
      fontFamily: fonts.mono,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    quoteActionBar: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      paddingHorizontal: 14,
      paddingBottom: 12,
      paddingTop: 4,
      gap: 20,
    },
    quoteActionBtn: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 4,
    },
    quoteActionCount: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.mute,
    },
    // event community
    eventProStrip: {
      backgroundColor: c.goldLight,
      borderRadius: radius.md,
      paddingHorizontal: 10,
      paddingVertical: 6,
      marginTop: 10,
      flexDirection: "row" as const,
      alignItems: "center" as const,
    },
    eventProStripText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: c.gold,
    },
    eventRsvpBtn: {
      backgroundColor: c.ochre,
      borderRadius: radius.full,
      paddingHorizontal: 20,
      paddingVertical: 10,
    },
    eventRsvpBtnDone: {
      backgroundColor: c.success,
    },
    eventRsvpBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: "#FFFFFF",
    },
    // editorial card
    editorialCategoryChip: {
      backgroundColor: "rgba(243,236,224,0.92)",
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    editorialCategoryChipText: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.ochre,
      letterSpacing: 1,
    },
    editorialAuthorRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 6,
      marginTop: 10,
    },
    editorialAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.goldLight,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      flexShrink: 0,
    },
    editorialAvatarInitial: {
      fontFamily: fonts.sansBold,
      fontSize: 10,
      color: c.gold,
    },
    editorialAuthorName: {
      fontFamily: fonts.sansBold,
      fontSize: 12,
      color: c.ink,
    },
    editorialReadTime: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
    },

    // ── CommunityQuoteCard ────────────────────────────────────────────────────
    cqHeader: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 10,
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 10,
    },
    cqAvatarWrap: {},
    cqAvatar: { width: 38, height: 38, borderRadius: 19 },
    cqAvatarFallback: {
      backgroundColor: c.paperDeep,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    cqAvatarInitial: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    cqAuthorName: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    cqAuthorHandle: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: c.mute },
    cqBadge: {
      fontFamily: fonts.monoBold,
      fontSize: 9,
      color: c.ochre,
      letterSpacing: 1,
      textTransform: "uppercase" as const,
    },

    cqBody: {
      paddingHorizontal: 14,
      paddingBottom: 4,
      position: "relative" as const,
    },
    cqOpenMark: {
      fontFamily: fonts.serifBold,
      fontSize: 44,
      color: c.ghost,
      lineHeight: 36,
      marginBottom: -4,
    },
    cqQuoteText: {
      fontFamily: fonts.serifItalic,
      fontSize: 20,
      color: c.ink,
      lineHeight: 30,
      marginLeft: 4,
    },
    cqCloseMark: {
      fontFamily: fonts.serifBold,
      fontSize: 32,
      color: c.ghost,
      lineHeight: 24,
      textAlign: "right" as const,
      marginTop: 4,
    },

    cqAttrib: {
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 4,
      borderLeftWidth: 2,
      borderLeftColor: c.ochre,
      marginHorizontal: 14,
      marginTop: 4,
      gap: 2,
    },
    cqQuoteAuthor: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    cqQuoteSource: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },

    cqNote: {
      backgroundColor: c.paperDeep,
      borderRadius: 8,
      marginHorizontal: 14,
      marginTop: 12,
      padding: 12,
      gap: 4,
    },
    cqNoteLabel: {
      fontFamily: fonts.monoBold,
      fontSize: 9,
      color: c.inkSoft,
      letterSpacing: 0.8,
    },
    cqNoteText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      lineHeight: 20,
    },

    cqShareCta: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      textAlign: "center" as const,
      marginTop: 14,
    },
    cqShareLink: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ochre,
      textAlign: "center" as const,
      marginTop: 2,
      marginBottom: 4,
    },

    // ── DirectoryCard (C2) ────────────────────────────────────────────────────
    dirBody: {
      flexDirection: "row" as const,
      gap: 16,
      padding: 16,
    },
    dirInfo: {
      flex: 1,
      alignItems: "flex-start" as const,
    },
    dirTitleRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: 8,
      marginTop: 8,
    },
    dirTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 16,
      color: c.ink,
    },
    dirTypeBadge: {
      fontFamily: fonts.mono,
      fontSize: 9,
      color: c.ghost,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      textTransform: "uppercase" as const,
    },
    dirLocation: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.mute,
      marginTop: 4,
    },
    dirVettedBadge: {
      backgroundColor: c.success,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 2,
      marginTop: 6,
    },
    dirVettedText: {
      fontFamily: fonts.sansBold,
      fontSize: 9,
      color: "#fff",
    },
    dirThumb: {
      width: 88,
      height: 88,
      borderRadius: 8,
      overflow: "hidden" as const,
    },
    dirExcerpt: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.inkSoft,
      lineHeight: 21,
      paddingHorizontal: 16,
    },
    dirFooter: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      alignItems: "center" as const,
      marginHorizontal: 16,
      marginTop: 12,
      paddingTop: 12,
      paddingBottom: 16,
      borderTopWidth: 1,
      borderTopColor: c.ghost,
    },
    dirFooterLabel: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.ghost,
    },
    dirFooterCta: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ochre,
    },
  });
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

function BadgePill({ label, bg, color, borderColor, styles }: {
  label: string; bg: string; color: string; borderColor?: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={[styles.badgePill, { backgroundColor: bg }, borderColor ? { borderWidth: 1, borderColor } : undefined]}>
      <Text style={[styles.badgePillText, { color }]}>{label}</Text>
    </View>
  );
}

// ── ReportControl ─────────────────────────────────────────────────────────────

function ReportControl({ item }: { item: FeedItem }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (reason: "spam" | "harassment" | "inappropriate") => {
    setOpen(false);
    if (!item.wpId) return;
    try {
      await api.post(`${MOBILE_API}/community/report`, { post_id: Number(item.wpId), reason });
      setSent(true);
    } catch { /* silent */ }
  };

  if (sent) return <Text style={styles.reportSent}>Reported</Text>;

  return (
    <>
      <TouchableOpacity onPress={() => setOpen(true)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Ionicons name="flag-outline" size={14} color={c.ghost} />
      </TouchableOpacity>
      <ReportSheet visible={open} onClose={() => setOpen(false)} onSubmit={submit} />
    </>
  );
}

// ── ProGlowRing ───────────────────────────────────────────────────────────────
// Subtle pulsing halo behind Pro avatars, layered behind the static gold border
// in avatarWrapPro — makes the gold treatment read as "premium" without
// switching to a different ring colour/style.

export function ProGlowRing({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1300, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: -5, left: -5, right: -5, bottom: -5,
        borderRadius: 9999,
        borderWidth: 2,
        borderColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ── AuthorRow ─────────────────────────────────────────────────────────────────

function AuthorRow({ item, forYouBadge, onAuthorPress }: {
  item: FeedItem; forYouBadge?: boolean; onAuthorPress?: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isPro = item.communityTier === "patron";
  return (
    <View style={styles.authorRow}>
      <TouchableOpacity onPress={onAuthorPress} activeOpacity={onAuthorPress ? 0.7 : 1} disabled={!onAuthorPress}>
        <View style={[styles.avatarWrap, isPro ? styles.avatarWrapPro : undefined]}>
          {isPro && <ProGlowRing color={c.gold} />}
          {item.communityAuthorAvatar ? (
            <Image source={{ uri: item.communityAuthorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{(item.communityAuthor ?? "?")[0]?.toUpperCase()}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.authorMeta}>
        <TouchableOpacity onPress={onAuthorPress} activeOpacity={onAuthorPress ? 0.7 : 1} disabled={!onAuthorPress}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName} numberOfLines={1}>{item.communityAuthor ?? "Anonymous"}</Text>
            {isPro && (
              <View style={styles.proBadgePill}>
                <Ionicons name="ribbon" size={9} color="#fff" />
              </View>
            )}
            <Text style={styles.authorDot}>·</Text>
            <Text style={styles.authorTime}>{timeAgo(item.date)}</Text>
          </View>
        </TouchableOpacity>
        {item.communityAuthorUsername ? (
          <Text style={styles.authorUsername}>@{item.communityAuthorUsername}</Text>
        ) : null}
        {forYouBadge && (
          <View style={{ marginTop: 4 }}>
            <BadgePill label="✦ For You" bg="transparent" color={c.gold} borderColor={c.goldBorder} styles={styles} />
          </View>
        )}
        {item.communityTag ? (
          <View style={styles.tagChip}>
            <Text style={styles.tagChipText} numberOfLines={1}>{item.communityTag}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

// ── ImgPlaceholder ────────────────────────────────────────────────────────────

function ImgPlaceholder({ height, src, borderRadius = 0, width, onPress }: {
  height: number; src?: string | null; borderRadius?: number;
  width?: number | string; onPress?: () => void;
}) {
  const c = useColors();
  const style: any = { height, borderRadius, overflow: "hidden" };
  if (width !== undefined) style.width = width;

  const content = src ? (
    <Image source={{ uri: src }} style={[style, { backgroundColor: c.ghost }]} resizeMode="cover" />
  ) : (
    <View style={[style, { backgroundColor: c.ghost, justifyContent: "center", alignItems: "center" }]}>
      <Ionicons name="image-outline" size={24} color={c.ghost} />
    </View>
  );

  if (src && onPress) {
    return <TouchableOpacity onPress={onPress} activeOpacity={0.9}>{content}</TouchableOpacity>;
  }
  return content;
}

// ── LinkPreview ───────────────────────────────────────────────────────────────

function LinkPreview({ source, title, domain, image }: {
  source?: string | null; title: string; domain?: string | null; image?: string | null;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={styles.linkContainer}>
      <ImgPlaceholder height={60} src={image} borderRadius={6} width={60} />
      <View style={styles.linkRight}>
        {source ? <Text style={styles.linkSource} numberOfLines={1}>{source}</Text> : null}
        <Text style={styles.linkTitle} numberOfLines={2}>{title}</Text>
        {domain ? <Text style={styles.linkDomain} numberOfLines={1}>{domain}</Text> : null}
      </View>
    </View>
  );
}

// ── FeedReactionBar ───────────────────────────────────────────────────────────

function FeedReactionBar({ item, marginTop }: { item: FeedItem; marginTop?: number }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  if (!item.reactions || !item.wpId) return null;
  return (
    <View style={[styles.reactionBarWrap, marginTop !== undefined ? { marginTop } : undefined]}>
      <ReactionBar
        postId={item.wpId}
        initialCounts={item.reactions}
        initialReaction={item.userReaction ?? null}
        shareUrl={shareUrlFor(item)}
        shareTitle={item.title || item.communityAuthor ? `${item.communityAuthor ?? "Someone"}'s post on Moveee` : undefined}
        showReport
      />
    </View>
  );
}

// ── GalleryStrip ──────────────────────────────────────────────────────────────

function GalleryStrip({ images, height, width, onTap }: {
  images: string[]; height: number; width: number; onTap: (idx: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 10 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
    >
      {images.map((src, i) => (
        <ImgPlaceholder key={i} height={height} src={src} borderRadius={6} width={width} onPress={() => onTap(i)} />
      ))}
    </ScrollView>
  );
}

// ── Card Implementations ──────────────────────────────────────────────────────

// PulseCard (A3 in design — compact with ⚡ icon)
function PulseCard({ item }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setSheetOpen(true)} activeOpacity={0.92}>
        <View style={{ padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Text style={{ fontSize: 20, color: c.ochre, lineHeight: 24, paddingTop: 2 }}>⚡</Text>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <BadgePill label="PULSE" bg={c.ink} color={c.paper} styles={styles} />
              <Text style={styles.timeRight}>{timeAgo(item.date)}</Text>
            </View>
            <Text style={[styles.cardTitle, { marginTop: 6, fontSize: fontSize.base, lineHeight: 22 }]} numberOfLines={2}>{item.title}</Text>
            {item.source ? (
              <SourceLine source={item.source} sourceUrl={item.sourceUrl} style={styles.sourceText} />
            ) : null}
            {(() => {
              let pulseExcerpt = stripHtmlTags(item.excerpt) || stripHtmlTags(item.body) || stripHtmlTags(item.ogDescription);
              if (pulseExcerpt && pulseExcerpt.length > 220) pulseExcerpt = pulseExcerpt.slice(0, 220).trim() + "…";
              return pulseExcerpt ? (
                <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 19, marginTop: 5 }} numberOfLines={3}>
                  {pulseExcerpt}
                </Text>
              ) : null;
            })()}
          </View>
        </View>
        {item.image ? (
          <ImgPlaceholder height={172} src={item.image} onPress={() => setLightboxOpen(true)} />
        ) : item.ogImage ? (
          <View style={{ marginTop: 0 }}>
            <LinkPreview source={item.source} title={item.ogTitle ?? item.title} domain={item.sourceUrl ?? undefined} image={item.ogImage} />
          </View>
        ) : null}
        <FeedReactionBar item={item} />
      </TouchableOpacity>
      {item.image && (
        <ImageLightbox visible={lightboxOpen} images={[item.image]} onClose={() => setLightboxOpen(false)} />
      )}
      <PulseDetailSheet visible={sheetOpen} item={item} onClose={() => setSheetOpen(false)} />
    </>
  );
}

// EditorialCard (A1 — compact side-by-side thumbnail / A2 text-only)
function EditorialCard({ item, onPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const hasHero = !!item.image;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={{ padding: 14 }}>
        {/* Badge row: Editorial label + timestamp */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BadgePill label="Editorial" bg={c.ochre} color={c.paper} styles={styles} />
          <Text style={styles.timeRight}>{timeAgo(item.date)}</Text>
        </View>

        {/* A2 only: category pill above title */}
        {!hasHero && item.category ? (
          <View style={{ marginTop: 8 }}>
            <BadgePill label={item.category} bg={c.badgeEditorialBg} color={c.badgeEditorialText} styles={styles} />
          </View>
        ) : null}

        {/* A1 — text column with a small thumbnail alongside, instead of a full-width hero */}
        <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitleXl} numberOfLines={hasHero ? 3 : undefined}>{item.title}</Text>
            {item.excerpt ? (
              <Text style={[styles.cardBody, { marginTop: 6 }]} numberOfLines={hasHero ? 2 : 3}>{item.excerpt}</Text>
            ) : null}
          </View>
          {hasHero ? (
            <View style={{ width: 88, height: 88, borderRadius: radius.lg, overflow: "hidden", flexShrink: 0, position: "relative" }}>
              <ImgPlaceholder height={88} width={88} src={item.image} />
              {item.category ? (
                <View style={{ position: "absolute", bottom: 4, left: 4 }}>
                  <View style={styles.editorialCategoryChip}>
                    <Text style={styles.editorialCategoryChipText}>{item.category.toUpperCase()}</Text>
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Compact author row: 24px avatar fallback + name + reading time */}
        <View style={styles.editorialAuthorRow}>
          <View style={styles.editorialAvatar}>
            <Text style={styles.editorialAvatarInitial}>
              {(item.author ?? "M")[0]?.toUpperCase()}
            </Text>
          </View>
          {item.author ? (
            <Text style={styles.editorialAuthorName}>{item.author}</Text>
          ) : null}
          {item.readingTime ? (
            <Text style={styles.editorialReadTime}>· {item.readingTime} min read</Text>
          ) : null}
        </View>
      </View>
      <FeedReactionBar item={item} />
    </TouchableOpacity>
  );
}

// HappeningCard (A3)
function HappeningCard({ item, onPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setModalOpen(true)} activeOpacity={0.92}>
        <View style={styles.happeningContent}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BadgePill label="Happening" bg={c.badgeHappeningBg} color={c.badgeHappeningText} styles={styles} />
            {item.isLiterati ? (
              <BadgePill label="🪶 Literati Connect" bg={c.paperWarm} color={c.ochre} styles={styles} />
            ) : null}
          </View>

          {/* Compact thumbnail beside title/date/location, instead of a full-width hero */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            {item.image ? (
              <TouchableOpacity onPress={() => setLightboxOpen(true)} activeOpacity={0.9}>
                <ImgPlaceholder height={64} width={64} borderRadius={radius.lg} src={item.image} />
              </TouchableOpacity>
            ) : (
              <ImgPlaceholder height={64} width={64} borderRadius={radius.lg} src={null} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.happeningTitle} numberOfLines={2}>{item.title}</Text>
              {item.eventDate ? (
                <View style={[styles.happeningMetaRow, { marginTop: 4 }]}>
                  <Ionicons name="calendar-outline" size={14} color={c.gold} />
                  <Text style={styles.happeningMetaText}>{item.eventDate}</Text>
                </View>
              ) : null}
              {item.location || item.city ? (
                <View style={[styles.happeningMetaRow, { marginTop: 4 }]}>
                  <Ionicons name="location-outline" size={14} color={c.gold} />
                  <Text style={styles.happeningMetaText} numberOfLines={1}>
                    {[item.location, item.city].filter(Boolean).join(", ")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.happeningFooter}>
            <Text style={styles.happeningAdmission}>{item.admission ?? "Free admission"}</Text>
            <View style={styles.happeningRsvpBtn}>
              <Text style={styles.happeningRsvpText}>See details</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {item.image && (
        <ImageLightbox visible={lightboxOpen} images={[item.image]} onClose={() => setLightboxOpen(false)} />
      )}
      <HappeningDetailModal visible={modalOpen} item={item} onClose={() => setModalOpen(false)} />
    </>
  );
}

// DirectoryCard (C2)
function DirectoryCard({ item }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();

  const handlePress = () => {
    nav.navigate("DirectoryDetail", {
      slug: item.slug,
      title: item.title,
      entryType: item.entryType,
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.92}>
      <View style={styles.dirBody}>
        <View style={styles.dirInfo}>
          <BadgePill label="Directory" bg={c.badgeDirectoryBg} color={c.badgeDirectoryText} styles={styles} />
          <View style={styles.dirTitleRow}>
            <Text style={styles.dirTitle} numberOfLines={1}>{item.title}</Text>
            {item.entryType ? <Text style={styles.dirTypeBadge}>{item.entryType}</Text> : null}
          </View>
          {item.city ? <Text style={styles.dirLocation}>📍 {item.city}</Text> : null}
          {item.isPartner ? (
            <View style={styles.dirVettedBadge}>
              <Text style={styles.dirVettedText}>✓ Vetted</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.dirThumb}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <LinearGradient colors={["#E2B19B", "#C5491F"]} style={{ width: "100%", height: "100%" }} />
          )}
        </View>
      </View>
      {item.excerpt ? (
        <Text style={styles.dirExcerpt} numberOfLines={2}>{item.excerpt}</Text>
      ) : null}
      <View style={styles.dirFooter}>
        <Text style={styles.dirFooterLabel}>Added to directory</Text>
        <Text style={styles.dirFooterCta}>View entry →</Text>
      </View>
    </TouchableOpacity>
  );
}

// BasicPostCard (B1)
function BasicPostCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  const hasLink = !!(item.ogTitle || item.ogImage || item.source);
  const rawBody = item.body ?? item.excerpt ?? item.title ?? "";
  const displayBody = hasLink ? (stripLinkFromBody(rawBody, item.sourceUrl) ?? rawBody) : rawBody;
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));
  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <HashtagText text={displayBody} style={styles.cardBody} onMentionPress={handleMentionPress} />
        </View>
        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={220} width={220} onTap={(i) => setLightboxIdx(i)} />
        ) : item.image ? (
          <View style={{ marginTop: 10 }}>
            <ImgPlaceholder height={220} src={item.image} onPress={() => setLightboxIdx(0)} />
          </View>
        ) : hasLink ? (
          <View style={{ marginTop: 10 }}>
            <LinkPreview source={item.source} title={item.ogTitle ?? item.title} domain={item.sourceUrl ?? undefined} image={item.ogImage} />
          </View>
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={gallery.length > 0 ? gallery : item.image ? [item.image] : []}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </>
  );
}

// HiddenGemCard (B2)
function HiddenGemCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));
  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill label="💎 HIDDEN GEM" bg={c.templateGemBg} color={c.templateGemText} styles={styles} />
          {(item.placeLocation ?? item.locationName) ? (
            <Text style={[styles.locationText, { marginTop: 6 }]}>📍 {item.placeLocation ?? item.locationName}</Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <HashtagText text={item.body ?? item.excerpt ?? item.title ?? ""} numberOfLines={4} style={styles.cardBody} onMentionPress={handleMentionPress} />
          </View>
        </View>
        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={130} width={180} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox visible={lightboxIdx !== null} images={gallery} initialIndex={lightboxIdx ?? 0} onClose={() => setLightboxIdx(null)} />
    </>
  );
}

// CulturalTakeCard (B3)
function CulturalTakeCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill label="🔥 CULTURAL TAKE" bg={c.templateTakeBg} color={c.templateTakeText} styles={styles} />
        {item.culturalTakeHeadline ? (
          <Text style={[styles.cardTitle, { marginTop: 8, fontFamily: fonts.serifBoldItalic }]}>
            {item.culturalTakeHeadline}
          </Text>
        ) : null}
        {item.title ? (
          <HashtagText text={item.title} numberOfLines={4} style={[styles.cardBody, { marginTop: 6 }]} onMentionPress={handleMentionPress} />
        ) : null}
      </View>
      <FeedReactionBar item={item} marginTop={10} />
    </TouchableOpacity>
  );
}

// FoodReviewCard (B4)
function FoodReviewCard({ item, onPress, onAuthorPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill label="🍽️ FOOD REVIEW" bg={c.templateFoodBg} color={c.templateFoodText} styles={styles} />
          {(item.placeLocation ?? item.locationName) ? (
            <Text style={[styles.locationText, { marginTop: 6 }]}>📍 {item.placeLocation ?? item.locationName}</Text>
          ) : null}
          <Text style={[styles.cardBody, { marginTop: 8 }]} numberOfLines={3}>
            {item.title ?? ""}
          </Text>
          <View style={styles.foodRatingsGrid}>
            {[
              { label: "Taste", value: item.foodRatingTaste },
              { label: "Value", value: item.foodRatingValue },
              { label: "Vibe",  value: item.foodRatingVibe },
            ].map(({ label, value }) => (
              <View key={label} style={styles.foodRatingRow}>
                <Text style={styles.foodRatingLabel}>{label}</Text>
                <Text style={styles.foodRatingStars}>{starsText(value)}</Text>
                <Text style={styles.foodRatingNum}>{value ?? "—"}</Text>
              </View>
            ))}
          </View>
        </View>
        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={140} width={200} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox visible={lightboxIdx !== null} images={gallery} initialIndex={lightboxIdx ?? 0} onClose={() => setLightboxIdx(null)} />
    </>
  );
}

// CreativeShowcaseCard (B5)
function CreativeShowcaseCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill label="🎨 CREATIVE SHOWCASE" bg={c.templateShowcaseBg} color={c.templateShowcaseText} styles={styles} />
          {item.showcaseMedium ? (
            <View style={{ marginTop: 4 }}>
              <BadgePill label={item.showcaseMedium} bg={c.paperDeep} color={c.inkSoft} styles={styles} />
            </View>
          ) : null}
        </View>
        {item.title ? (
          <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
            <HashtagText text={item.title} style={styles.cardBody} onMentionPress={handleMentionPress} />
          </View>
        ) : null}
        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={220} width={220} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox visible={lightboxIdx !== null} images={gallery} initialIndex={lightboxIdx ?? 0} onClose={() => setLightboxIdx(null)} />
    </>
  );
}

// PollCard (B6)
function PollCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const initialOptions = item.pollOptions ?? [];
  const [localOpts, setLocalOpts] = useState<PollOption[]>(initialOptions);
  const [voted, setVoted] = useState(false);
  const expired = item.pollExpiresAt ? new Date(item.pollExpiresAt) < new Date() : false;
  const total = localOpts.reduce((s, o) => s + o.votes, 0);
  const maxVotes = localOpts.reduce((m, o) => Math.max(m, o.votes), 0);

  const vote = async (idx: number) => {
    if (voted || expired || !item.wpId) return;
    setVoted(true);
    setLocalOpts((prev) => prev.map((o, i) => (i === idx ? { ...o, votes: o.votes + 1 } : o)));
    try {
      await api.post(`${MOBILE_API}/community/poll-vote`, { post_id: Number(item.wpId), option_index: idx });
    } catch {
      setVoted(false);
      setLocalOpts(initialOptions);
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill label="📊 POLL" bg={c.templatePollBg} color={c.templatePollText} styles={styles} />
        <Text style={[styles.pollQuestion, { marginTop: 8 }]}>{item.title}</Text>
        {localOpts.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          const isWinner = opt.votes === maxVotes && maxVotes > 0;
          const showResults = voted || expired;
          return (
            <TouchableOpacity key={i} style={styles.pollOptionWrap} onPress={() => vote(i)} disabled={voted || expired} activeOpacity={0.8}>
              {showResults ? (
                <View style={[styles.pollFillBar, { width: `${pct}%`, backgroundColor: isWinner ? "rgba(197,73,31,0.10)" : c.paperDeep }]} />
              ) : null}
              <View style={styles.pollOptionInner}>
                <Text style={styles.pollOptionLabel} numberOfLines={1}>{opt.text}</Text>
                {showResults ? (
                  <Text style={[styles.pollOptionPct, isWinner ? styles.pollOptionPctWinner : undefined]}>{pct}%</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={styles.pollMeta}>
          {total} vote{total !== 1 ? "s" : ""}{expired ? " · Poll closed" : voted ? " · You voted" : ""}
        </Text>
      </View>
      <FeedReactionBar item={item} marginTop={10} />
    </TouchableOpacity>
  );
}

// ItineraryCard (B7)
function ItineraryCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? (item.image ? [item.image] : []);
  return (
    <>
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill label="🗺️ ITINERARY" bg={c.templateRouteBg} color={c.templateRouteText} styles={styles} />
        {(item.itineraryTitle ?? item.title) ? (
          <Text style={[styles.cardTitle, { marginTop: 8 }]}>{item.itineraryTitle ?? item.title}</Text>
        ) : null}
        {/* Metadata strip */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 }}>
          {item.itineraryStops && item.itineraryStops.length > 0 ? (
            <Text style={styles.sourceText}>🗂 {item.itineraryStops.length} stops</Text>
          ) : null}
          {item.itineraryDuration ? <Text style={styles.sourceText}>⏱ {item.itineraryDuration}</Text> : null}
          {item.itineraryBudget ? <Text style={styles.sourceText}>💰 {item.itineraryBudget}</Text> : null}
          {item.itineraryBestTime ? <Text style={styles.sourceText}>☀️ {item.itineraryBestTime}</Text> : null}
          {(item.itineraryCity ?? item.city) ? (
            <Text style={styles.sourceText}>📍 {item.itineraryCity ?? item.city}</Text>
          ) : null}
        </View>
        {item.itineraryStops && item.itineraryStops.length > 0 ? (
          <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: c.rule }}>
            {item.itineraryStops.slice(0, 3).map((stop, i) => (
              <View key={i} style={[styles.itinStopRow, { borderBottomWidth: 1, borderBottomColor: c.rule, paddingVertical: 8 }]}>
                <View style={styles.itinStopNum}>
                  <Text style={styles.itinStopNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.itinStopName, { flex: 1 }]}>{stop.name}</Text>
                <Text style={[styles.readMore, { fontSize: fontSize.sm }]}>→</Text>
              </View>
            ))}
            {item.itineraryStops.length > 3 ? (
              <Text style={[styles.readMore, { marginTop: 4, fontSize: fontSize.sm }]}>
                + {item.itineraryStops.length - 3} more stops
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
      {gallery.length > 0 ? (
        <GalleryStrip images={gallery} height={130} width={180} onTap={(i) => setLightboxIdx(i)} />
      ) : null}
      <FeedReactionBar item={item} marginTop={10} />
    </TouchableOpacity>
    <ImageLightbox visible={lightboxIdx !== null} images={gallery} initialIndex={lightboxIdx ?? 0} onClose={() => setLightboxIdx(null)} />
    </>
  );
}

// BookReviewCard (B8)
function BookReviewCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const coverUri = item.image ?? null;
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));

  const statusColor: Record<string, string> = {
    "Finished": "#16a34a",
    "Reading": "#2563eb",
    "Want to Read": "#9333ea",
  };
  const statusBg: Record<string, string> = {
    "Finished": "#dcfce7",
    "Reading": "#dbeafe",
    "Want to Read": "#f3e8ff",
  };
  const status = item.bookStatus ?? "";

  const ratings: { label: string; value?: number }[] = [
    { label: "Writing",    value: item.bookRatingWriting },
    { label: "Story",      value: item.bookRatingStory },
    { label: "Characters", value: item.bookRatingCharacters },
    { label: "Pacing",     value: item.bookRatingPacing },
  ];
  const hasRatings = ratings.some((r) => r.value != null);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill label="📚 BOOK REVIEW" bg={c.templateBookBg} color={c.templateBookText} styles={styles} />

        {/* Book card */}
        {item.bookTitle ? (
          <View style={styles.bookCard}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.bookCover} resizeMode="cover" />
            ) : (
              <View style={[styles.bookCover, styles.bookCoverFallback]}>
                <Ionicons name="book-outline" size={22} color={c.mute} />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.bookTitle} numberOfLines={2}>{item.bookTitle}</Text>
              {item.bookAuthor ? <Text style={styles.bookMeta}>{item.bookAuthor}</Text> : null}
              {status ? (
                <View style={{ marginTop: 4, alignSelf: "flex-start" }}>
                  <BadgePill
                    label={status}
                    bg={statusBg[status] ?? c.paperDeep}
                    color={statusColor[status] ?? c.inkSoft}
                    styles={styles}
                  />
                </View>
              ) : null}
            </View>
            {item.bookOverallRating != null ? (
              <View style={styles.bookOverallWrap}>
                <Text style={styles.bookOverallScore}>{item.bookOverallRating}</Text>
                <Text style={styles.bookOverallStar}>★</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Review body */}
        {item.title ? (
          <HashtagText text={item.title} style={[styles.cardBody, { marginTop: 10 }]} numberOfLines={3} onMentionPress={handleMentionPress} />
        ) : null}

        {/* Favourite quote */}
        {item.bookFavQuote ? (
          <View style={styles.bookFavQuote}>
            <Text style={styles.bookFavQuoteText}>"{item.bookFavQuote}"</Text>
          </View>
        ) : null}

        {/* Breakdown ratings */}
        {hasRatings ? (
          <View style={[styles.foodRatingsGrid, { marginTop: 10 }]}>
            {ratings.filter((r) => r.value != null).map(({ label, value }) => (
              <View key={label} style={styles.foodRatingRow}>
                <Text style={styles.foodRatingLabel}>{label}</Text>
                <Text style={styles.foodRatingStars}>{starsText(value)}</Text>
                <Text style={styles.foodRatingNum}>{value}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Recommend + genres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }}
          contentContainerStyle={{ flexDirection: "row", gap: 6 }}
        >
          {item.bookRecommend != null ? (
            <BadgePill
              label={item.bookRecommend ? "👍 Recommend" : "👎 Not for everyone"}
              bg={item.bookRecommend ? "#dcfce7" : "#fee2e2"}
              color={item.bookRecommend ? "#15803d" : "#b91c1c"}
              styles={styles}
            />
          ) : null}
          {(item.bookGenres ?? []).slice(0, 3).map((g) => (
            <BadgePill key={g} label={g} bg={c.paperDeep} color={c.inkSoft} styles={styles} />
          ))}
        </ScrollView>
      </View>
      <FeedReactionBar item={item} marginTop={10} />
    </TouchableOpacity>
  );
}

// EventCommunityCard (B8 in design) — community post with _template_type = 'event'
function EventCommunityCard({ item, onPress, onAuthorPress, forYouBadge, onMentionPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [rsvped, setRsvped] = useState(false);
  const gallery = item.galleryImages ?? (item.image ? [item.image] : []);
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));

  const handleRsvp = async () => {
    if (rsvped || !item.wpId) return;
    setRsvped(true);
    try {
      await api.post(`${MOBILE_API}/community/event/rsvp`, { post_id: item.wpId });
    } catch {
      setRsvped(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill label="📅 EVENT" bg={c.templateEventBg} color={c.templateEventText} styles={styles} />

          {/* Compact thumbnail beside title/date/location, instead of a full-width hero */}
          <View style={{ flexDirection: "row", gap: 12, marginTop: 8 }}>
            {item.image ? (
              <TouchableOpacity onPress={() => setLightboxIdx(0)} activeOpacity={0.9}>
                <ImgPlaceholder height={64} width={64} borderRadius={radius.lg} src={item.image} />
              </TouchableOpacity>
            ) : (
              <ImgPlaceholder height={64} width={64} borderRadius={radius.lg} src={null} />
            )}
            <View style={{ flex: 1 }}>
              <HashtagText
                text={item.title}
                style={styles.cardTitle}
                numberOfLines={2}
                onMentionPress={handleMentionPress}
              />
              {item.eventDate ? (
                <View style={[styles.happeningMetaRow, { marginTop: 4 }]}>
                  <Ionicons name="calendar-outline" size={14} color={c.gold} />
                  <Text style={styles.happeningMetaText}>{item.eventDate}</Text>
                </View>
              ) : null}
              {(item.location ?? item.city) ? (
                <View style={[styles.happeningMetaRow, { marginTop: 4 }]}>
                  <Ionicons name="location-outline" size={14} color={c.gold} />
                  <Text style={styles.happeningMetaText} numberOfLines={1}>
                    {[item.location, item.city].filter(Boolean).join(", ")}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {item.admission ? (
            <View style={[styles.happeningMetaRow, { marginTop: 8 }]}>
              <Ionicons name="ticket-outline" size={14} color={c.gold} />
              <Text style={styles.happeningMetaText}>{item.admission}</Text>
            </View>
          ) : null}

          {item.eventCategory ? (
            <View style={{ marginTop: 8 }}>
              <BadgePill label={item.eventCategory} bg={c.paperDeep} color={c.inkSoft} styles={styles} />
            </View>
          ) : null}

          {/* Pro perk strip — only when isProOnly */}
          {item.isProOnly ? (
            <View style={styles.eventProStrip}>
              <Text style={styles.eventProStripText}>⭐ Pro members get early access</Text>
            </View>
          ) : null}

          {/* RSVP button — only when the Pro organiser has explicitly enabled RSVP for this event */}
          {item.ticketUrl ? (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <Text style={styles.readMore}>Get Tickets →</Text>
            </View>
          ) : item.rsvpEnabled ? (
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 10 }}>
              <TouchableOpacity
                style={[styles.eventRsvpBtn, (rsvped || item.rsvpAvailable === false) ? styles.eventRsvpBtnDone : undefined]}
                onPress={handleRsvp}
                activeOpacity={0.8}
                disabled={rsvped || item.rsvpAvailable === false}
              >
                <Text style={styles.eventRsvpBtnText}>
                  {rsvped ? "RSVPed ✓" : item.rsvpAvailable === false ? "Fully Booked" : "RSVP Now"}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
        {gallery.length > 1 ? (
          <GalleryStrip images={gallery} height={100} width={140} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox visible={lightboxIdx !== null} images={gallery} initialIndex={lightboxIdx ?? 0} onClose={() => setLightboxIdx(null)} />
    </>
  );
}

// QuoteCard (C1) — heart + bookmark + share
function QuoteCard({ item }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [loved, setLoved] = useState(item.userReaction === "love");
  const [loveCount, setLoveCount] = useState(item.reactions?.love ?? 0);

  useEffect(() => {
    if (!item.wpId || !user) return;
    api.get<{ bookmarked_quotes?: (number | string)[] }>(
      `${CULTURE_API}/user/interactions`
    ).then((res) => {
      const ids = (res.bookmarked_quotes ?? []).map(String);
      setBookmarked(ids.includes(String(item.wpId)));
    }).catch(() => {});
  }, [item.wpId, user?.id]);

  const handleLove = async () => {
    if (!item.wpId) return;
    const next = !loved;
    const prevLoved = loved;
    const prevCount = loveCount;
    setLoved(next);
    setLoveCount((prev) => prev + (next ? 1 : -1));
    try {
      const res = await api.post<{ reactionType: "love" | "fire" | "clap" | null; reactions: { love: number; fire: number; clap: number } }>(
        `${MOBILE_API}/community/react`,
        { post_id: Number(item.wpId), type: "love" }
      );
      setLoved(res.reactionType === "love");
      setLoveCount(res.reactions.love);
    } catch {
      setLoved(prevLoved);
      setLoveCount(prevCount);
    }
  };

  const handleBookmark = async () => {
    if (!item.wpId) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await api.post(`${MOBILE_API}/content/bookmark`, {
        content_type: "quote",
        post_id: Number(item.wpId),
      });
    } catch {
      setBookmarked(!next);
    }
  };

  const handleShare = async () => {
    const url = shareUrlFor(item);
    if (!url) return;
    try {
      await Share.share({ message: `"${item.title}" — ${item.quoteAuthor ?? ""}\n\n${url}` });
    } catch { /* user dismissed */ }
  };

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={() => setModalOpen(true)} activeOpacity={0.92}>
        <View style={styles.quoteContainer}>
          <Text style={styles.bigQuote}>"</Text>
          <Text style={styles.quoteText}>{item.title}</Text>
          <View style={styles.quoteAttribution}>
            {item.quoteAuthor ? <Text style={styles.quoteAuthor}>— {item.quoteAuthor}</Text> : null}
            {item.quoteAuthor && item.quoteSource ? <Text style={styles.quoteDot}>·</Text> : null}
            {item.quoteSource ? <Text style={styles.quoteSource}>{item.quoteSource}</Text> : null}
          </View>
        </View>
        <View style={styles.quoteActionBar}>
          <TouchableOpacity style={styles.quoteActionBtn} onPress={handleLove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={loved ? "heart" : "heart-outline"} size={18} color={loved ? "#E53E3E" : c.mute} />
            {loveCount > 0 ? <Text style={styles.quoteActionCount}>{loveCount}</Text> : null}
          </TouchableOpacity>
          <TouchableOpacity style={styles.quoteActionBtn} onPress={handleBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={18} color={bookmarked ? c.ochre : c.mute} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.quoteActionBtn} onPress={() => setModalOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chatbubble-outline" size={18} color={c.mute} />
            {item.commentCount ? <Text style={styles.quoteActionCount}>{item.commentCount}</Text> : null}
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.quoteActionBtn} onPress={handleShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="share-outline" size={16} color={c.mute} />
          </TouchableOpacity>
          <ReportControl item={item} />
        </View>
      </TouchableOpacity>
      <QuoteDetailModal visible={modalOpen} item={item} onClose={() => setModalOpen(false)} />
    </>
  );
}

// CommunityQuoteCard — community post with templateType="quote"
function CommunityQuoteCard({ item, onPress, onAuthorPress }: FeedCardProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const QUOTE_TYPE_ICON: Record<string, string> = {
    Book: "📚", Film: "🎬", Person: "🗣", Speech: "🎤", Song: "🎵",
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Author row */}
      <View style={styles.cqHeader}>
        <TouchableOpacity
          style={styles.cqAvatarWrap}
          onPress={onAuthorPress}
          disabled={!onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
        >
          {item.communityAuthorAvatar ? (
            <Image source={{ uri: item.communityAuthorAvatar }} style={styles.cqAvatar} />
          ) : (
            <View style={[styles.cqAvatar, styles.cqAvatarFallback]}>
              <Text style={styles.cqAvatarInitial}>
                {(item.communityAuthor ?? "?")[0]?.toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.cqAuthorName}>{item.communityAuthor ?? "Member"}</Text>
          {item.communityAuthorUsername ? (
            <Text style={styles.cqAuthorHandle}>@{item.communityAuthorUsername}</Text>
          ) : null}
        </View>
        <Text style={styles.cqBadge}>
          {item.quoteType ? (QUOTE_TYPE_ICON[item.quoteType] ?? "❝") : "❝"} QUOTE
        </Text>
      </View>

      {/* Quote body */}
      <View style={styles.cqBody}>
        <Text style={styles.cqOpenMark}>"</Text>
        <Text style={styles.cqQuoteText}>{item.title}</Text>
        <Text style={styles.cqCloseMark}>"</Text>
      </View>

      {/* Attribution */}
      {(item.quoteAuthor || item.quoteSource) ? (
        <View style={styles.cqAttrib}>
          {item.quoteAuthor ? (
            <Text style={styles.cqQuoteAuthor}>{item.quoteAuthor}</Text>
          ) : null}
          {item.quoteSource ? (
            <Text style={styles.cqQuoteSource}>{item.quoteSource}</Text>
          ) : null}
        </View>
      ) : null}

      {/* Sharer's note */}
      {item.quoteSharingReason ? (
        <View style={styles.cqNote}>
          <Text style={styles.cqNoteLabel}>
            💬 {item.communityAuthor ? `${item.communityAuthor.split(" ")[0].toUpperCase()}'S NOTE:` : "THEIR NOTE:"}
          </Text>
          <Text style={styles.cqNoteText}>{item.quoteSharingReason}</Text>
        </View>
      ) : null}

      {/* Share CTA */}
      <Text style={styles.cqShareCta}>Know someone who needs to see this?</Text>
      <Text style={styles.cqShareLink}>Share quote →</Text>

      {/* Reactions */}
      <FeedReactionBar item={item} marginTop={8} />
    </TouchableOpacity>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function FeedItemCard(props: FeedCardProps) {
  const { item } = props;

  if (item.type === "quote") return <QuoteCard {...props} />;
  if (item.type === "happening") return <HappeningCard {...props} />;
  if (item.type === "directory") return <DirectoryCard {...props} />;
  if (item.type === "editorial") return <EditorialCard {...props} />;
  if (item.type === "pulse") return <PulseCard {...props} />;

  if (item.type === "community") {
    switch (item.templateType) {
      case "hidden-gem":      return <HiddenGemCard {...props} />;
      case "cultural-take":  return <CulturalTakeCard {...props} />;
      case "food-review":    return <FoodReviewCard {...props} />;
      case "creative-showcase": return <CreativeShowcaseCard {...props} />;
      case "poll":           return <PollCard {...props} />;
      case "itinerary":      return <ItineraryCard {...props} />;
      case "book-review":    return <BookReviewCard {...props} />;
      case "event":          return <EventCommunityCard {...props} />;
      case "quote":          return <CommunityQuoteCard {...props} />;
      default:               return <BasicPostCard {...props} />;
    }
  }

  return <BasicPostCard {...props} />;
}
