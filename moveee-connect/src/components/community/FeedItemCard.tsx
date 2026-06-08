import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import type { FeedItem } from "../../types";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

// Mirrors formatDate() in components/pulse/FeedCard.tsx — web shows an
// absolute date ("7 Jun 2026"), not relative "time ago".
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DateLabel({ date, style }: { date: string; style?: object }) {
  return <Text style={[styles.dateLabel, style]}>{formatDate(date)}</Text>;
}

// Mirrors TYPE_BADGE palette in components/pulse/FeedCard.tsx (web app)
const TYPE_META: Record<FeedItem["type"], { label: string; bg: string; color: string }> = {
  pulse: { label: "Pulse", bg: "#fef3e2", color: "#b38238" },
  editorial: { label: "Editorial", bg: "#fff0eb", color: "#c5491f" },
  happening: { label: "Happening", bg: "#eeedfe", color: "#3c3489" },
  directory: { label: "Directory", bg: "#e8f5ee", color: "#085041" },
  quote: { label: "Quote", bg: "#f3eef8", color: "#7a4da0" },
  community: { label: "Community", bg: "#edf7ed", color: "#2e7d32" },
};

interface Props {
  item: FeedItem;
  onPress: () => void;
  onAuthorPress?: () => void;
  onReact?: (type: "love" | "fire" | "clap") => void;
}

function Badge({ type }: { type: FeedItem["type"] }) {
  const meta = TYPE_META[type];
  return (
    <View style={[styles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

function ReactionBar({ item, onReact, noBorder, shareUrl }: { item: FeedItem; onReact?: (type: "love" | "fire" | "clap") => void; noBorder?: boolean; shareUrl?: string }) {
  if (!item.reactions) return null;
  const entries: Array<{ key: "love" | "fire" | "clap"; emoji: string }> = [
    { key: "love", emoji: "❤️" },
    { key: "fire", emoji: "🔥" },
    { key: "clap", emoji: "👏" },
  ];
  const handleShare = () => {
    if (!shareUrl) return;
    Share.share(Platform.OS === "ios" ? { url: shareUrl } : { message: shareUrl }).catch(() => {});
  };
  return (
    <View style={[styles.reactionBar, noBorder && styles.reactionBarNoBorder]}>
      {entries.map(({ key, emoji }) => (
        <TouchableOpacity key={key} style={styles.reactionBtn} onPress={() => onReact?.(key)}>
          <Text style={styles.reactionEmoji}>{emoji}</Text>
          <Text style={styles.reactionCount}>{item.reactions?.[key] ?? 0}</Text>
        </TouchableOpacity>
      ))}
      <View style={{ flex: 1 }} />
      {shareUrl ? (
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-outline" size={14} color="#7a6f5c" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function initials(name: string): string {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

type ReportState = "idle" | "confirm" | "sent" | "error";

function CommentButton({ count, onPress }: { count?: number; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.commentBtn} onPress={onPress}>
      <Ionicons name="chatbubble-outline" size={14} color="#7a6f5c" />
      {typeof count === "number" && count > 0 ? <Text style={styles.reactionCount}>{count}</Text> : null}
    </TouchableOpacity>
  );
}

function ReportControl({ state, onChangeState, onSubmit }: { state: ReportState; onChangeState: (s: ReportState) => void; onSubmit: (reason: "spam" | "harassment" | "inappropriate") => void }) {
  if (state === "idle") {
    return (
      <TouchableOpacity onPress={() => onChangeState("confirm")} style={styles.flagBtn}>
        <Text style={styles.flagIcon}>⚑</Text>
      </TouchableOpacity>
    );
  }
  if (state === "confirm") {
    return (
      <View style={styles.reportConfirmRow}>
        <Text style={styles.reportConfirmLabel}>Report as:</Text>
        {(["spam", "harassment", "inappropriate"] as const).map((r) => (
          <TouchableOpacity key={r} onPress={() => onSubmit(r)} style={styles.reportReasonBtn}>
            <Text style={styles.reportReasonText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => onChangeState("idle")}>
          <Text style={styles.reportCancel}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (state === "sent") {
    return <Text style={styles.reportStatusText}>Reported — thank you.</Text>;
  }
  return <Text style={[styles.reportStatusText, { color: "#c0392b" }]}>Couldn't send report.</Text>;
}

function LinkSnippet({ item }: { item: FeedItem }) {
  if (!item.ogTitle && !item.ogImage) return null;
  return (
    <View style={styles.snippet}>
      {item.ogImage ? <Image source={{ uri: item.ogImage }} style={styles.snippetImage} resizeMode="cover" /> : null}
      <View style={styles.snippetBody}>
        {item.source ? <Text style={styles.snippetSource}>{item.source}</Text> : null}
        {item.ogTitle ? <Text style={styles.snippetTitle} numberOfLines={2}>{item.ogTitle}</Text> : null}
        {item.ogDescription ? <Text style={styles.snippetDesc} numberOfLines={2}>{item.ogDescription}</Text> : null}
      </View>
    </View>
  );
}

/** Badge row shared by pulse / editorial / happening / directory cards. */
function MetaRow({ item, accentColor }: { item: FeedItem; accentColor: string }) {
  return (
    <View style={styles.metaRow}>
      <Badge type={item.type} />
      {item.type === "happening" && item.eventDate ? (
        <Text style={[styles.metaTag, { color: accentColor, fontWeight: "600" }]}>{item.eventDate}</Text>
      ) : null}
      {item.type === "happening" && item.location ? (
        <Text style={styles.metaTagMuted} numberOfLines={1}>· {item.location}</Text>
      ) : null}
      {item.type === "directory" && item.entryType ? (
        <Text style={styles.metaTagMuted}>{item.entryType}</Text>
      ) : null}
      {item.type === "editorial" && item.category ? (
        <Text style={styles.metaTagMuted}>{item.category}</Text>
      ) : null}
      <View style={{ flex: 1 }} />
      <DateLabel date={item.date} />
    </View>
  );
}

export default function FeedItemCard({ item, onPress, onAuthorPress, onReact }: Props) {
  const [reportState, setReportState] = useState<ReportState>("idle");

  const submitReport = async (reason: "spam" | "harassment" | "inappropriate") => {
    if (!item.wpId) return;
    try {
      await api.post(`${CULTURE_API}/community/report`, { post_id: Number(item.wpId), reason });
      setReportState("sent");
    } catch {
      setReportState("error");
    }
  };

  if (item.type === "community") {
    const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : undefined;
    return (
      <TouchableOpacity style={[styles.card, styles.communityCard]} onPress={onPress} activeOpacity={0.95}>
        <View style={styles.communityRow}>
          <TouchableOpacity onPress={onAuthorPress} disabled={!onAuthorPress}>
            {item.communityAuthorAvatar ? (
              <Image source={{ uri: item.communityAuthorAvatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarFallbackText}>{initials(item.communityAuthor || "?")}</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.communityHeaderRow}>
              <TouchableOpacity onPress={onAuthorPress} disabled={!onAuthorPress}>
                <Text style={styles.authorName}>{item.communityAuthor || "Community Member"}</Text>
              </TouchableOpacity>
              {item.communityTier === "patron" ? (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>Pro</Text>
                </View>
              ) : null}
              <Text style={styles.dotSep}>·</Text>
              <DateLabel date={item.date} style={{ color: "#7a6f5c" }} />
              {item.communityTag ? (
                <View style={styles.communityTagPill}>
                  <Text style={styles.communityTagText}>{item.communityTag}</Text>
                </View>
              ) : null}
            </View>

            <Text style={styles.content} numberOfLines={6}>{item.title}</Text>

            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
            ) : (
              <LinkSnippet item={item} />
            )}

            <View style={styles.communityActionRow}>
              {item.wpId ? (
                <View style={{ flex: 1, minWidth: 0 }}>
                  <ReactionBar item={item} onReact={onReact} noBorder shareUrl={shareUrl} />
                </View>
              ) : null}
              <CommentButton count={item.commentCount} onPress={onPress} />
              <ReportControl state={reportState} onChangeState={setReportState} onSubmit={submitReport} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (item.type === "quote") {
    return (
      <TouchableOpacity style={[styles.card, styles.quoteCard]} onPress={onPress} activeOpacity={0.95}>
        <View style={styles.quoteRow}>
          <Text style={styles.quoteMark}>"</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.quoteText}>{item.title}</Text>
            <View style={styles.quoteFooter}>
              <Badge type="quote" />
              {item.quoteAuthor ? <Text style={styles.quoteAuthor}>{item.quoteAuthor}</Text> : null}
              {item.quoteSource ? <Text style={styles.metaTagMuted}>· {item.quoteSource}</Text> : null}
              <View style={{ flex: 1 }} />
              <DateLabel date={item.date} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Pulse / editorial / happening / directory all show: title, clamped
  // excerpt + "Read more →" (per-type accent, mirrors web's FeedCard), and a
  // left-thumbnail "internal link" preview card below — mirrors
  // components/pulse/InternalLinkCard.tsx on the web. No full-width hero
  // images in the feed.
  const INTERNAL_LINK_LABEL: Record<string, string> = {
    pulse: "Moveee Pulse",
    editorial: "Moveee Magazine",
    happening: "Moveee Happenings",
    directory: "Culture Directory",
  };
  const READ_MORE_COLOR: Record<string, string> = {
    pulse: "#b38238",
    editorial: "#c5491f",
    happening: "#3c3489",
    directory: "#085041",
  };

  const CLAMP_CHARS = 280;
  const excerpt = item.excerpt ?? "";
  const isLong = excerpt.length > CLAMP_CHARS;
  const displayExcerpt = isLong ? excerpt.slice(0, CLAMP_CHARS) + "…" : excerpt;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <MetaRow item={item} accentColor={TYPE_META[item.type].color} />

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      {displayExcerpt ? <Text style={styles.excerpt}>{displayExcerpt}</Text> : null}
      {isLong ? (
        <Text style={[styles.readMore, { color: READ_MORE_COLOR[item.type] }]}>Read more →</Text>
      ) : null}

      <View style={styles.internalLinkCard}>
        {item.image ? <Image source={{ uri: item.image }} style={styles.internalLinkImage} resizeMode="cover" /> : null}
        <View style={styles.internalLinkBody}>
          <Text style={styles.internalLinkLabel}>{INTERNAL_LINK_LABEL[item.type]}</Text>
          <Text style={styles.internalLinkTitle} numberOfLines={2}>{item.title}</Text>
          {item.excerpt ? <Text style={styles.internalLinkDesc} numberOfLines={1}>{item.excerpt}</Text> : null}
        </View>
      </View>

      <LinkSnippet item={item} />
      <ReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e2d8",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  communityCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#81c784",
  },

  // badge
  badge: { borderRadius: 2, paddingHorizontal: 6, paddingVertical: 3 },
  badgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },

  // meta row (badges + date)
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" },
  metaTag: { fontSize: 11, letterSpacing: 0.3 },
  metaTagMuted: { fontSize: 11, color: "#7a6f5c" },
  dateLabel: { fontSize: 11, color: "#bbb" },

  // community
  communityRow: { flexDirection: "row", gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#edf7ed" },
  avatarFallback: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#edf7ed",
    borderWidth: 1, borderColor: "#c8e6c9", justifyContent: "center", alignItems: "center",
  },
  avatarFallbackText: { fontSize: 11, fontWeight: "700", color: "#2e7d32" },
  communityHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  proBadge: {
    backgroundColor: "rgba(179,130,56,0.1)", borderWidth: 1, borderColor: "rgba(179,130,56,0.25)",
    borderRadius: 2, paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: "#b38238" },
  dotSep: { fontSize: 12, color: "#c8bfb0" },
  communityTagPill: { marginLeft: "auto", backgroundColor: "#edf7ed", borderRadius: 2, paddingHorizontal: 6, paddingVertical: 2 },
  communityTagText: { fontSize: 9, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: "#2e7d32" },
  content: { fontSize: 15, color: "#14110d", lineHeight: 22, marginBottom: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: "#e8e2d8" },
  communityActionRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingTop: 8, marginTop: 2, borderTopWidth: 1, borderTopColor: "#e8e2d8",
  },
  commentBtn: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  flagBtn: { paddingLeft: 4, flexShrink: 0 },
  flagIcon: { fontSize: 12, color: "#c8bfb0" },
  reportConfirmRow: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  reportConfirmLabel: { fontSize: 11, color: "#7a6f5c" },
  reportReasonBtn: {
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "rgba(192,57,43,0.2)",
    borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1,
  },
  reportReasonText: { fontSize: 10, color: "#c0392b" },
  reportCancel: { fontSize: 12, color: "#bbb" },
  reportStatusText: { fontSize: 11, color: "#7a6f5c", flexShrink: 0 },

  // pulse / editorial / happening / directory cards
  title: { fontSize: 16, fontWeight: "700", fontFamily: SERIF, color: "#14110d", lineHeight: 22, marginBottom: 5 },
  excerpt: { fontSize: 14, color: "#3a342b", lineHeight: 21, marginBottom: 4 },
  readMore: { fontSize: 13, fontWeight: "600", marginTop: 2, marginBottom: 2 },

  // internal link preview (editorial / happening / directory) — left thumbnail, mirrors web's InternalLinkCard
  internalLinkCard: {
    flexDirection: "row",
    alignItems: "stretch",
    borderWidth: 1,
    borderColor: "#e8e2d8",
    borderRadius: 6,
    overflow: "hidden",
    marginTop: 8,
    backgroundColor: "#faf8f4",
    minHeight: 72,
  },
  internalLinkImage: { width: 110, backgroundColor: "#e0d8cc" },
  internalLinkBody: { flex: 1, minWidth: 0, padding: 9, justifyContent: "center", gap: 2 },
  internalLinkLabel: { fontSize: 9, color: "#b38238", fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  internalLinkTitle: { fontSize: 13, fontWeight: "600", color: "#14110d", lineHeight: 18 },
  internalLinkDesc: { fontSize: 11, color: "#7a6f5c", lineHeight: 15 },

  // quote
  quoteCard: { backgroundColor: "#fff" },
  quoteRow: { flexDirection: "row", gap: 10 },
  quoteMark: { fontFamily: SERIF, fontSize: 32, lineHeight: 30, color: "#d8c9b0" },
  quoteText: { fontFamily: SERIF, fontSize: 15, fontStyle: "italic", color: "#14110d", lineHeight: 23, marginBottom: 8 },
  quoteFooter: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  quoteAuthor: { fontSize: 12, fontWeight: "600", color: "#c5491f" },

  // link snippet
  snippet: {
    flexDirection: "row", borderWidth: 1, borderColor: "#e8e2d8", borderRadius: 6,
    overflow: "hidden", marginTop: 6, marginBottom: 4,
  },
  snippetImage: { width: 84, height: 84, backgroundColor: "#e0d8cc" },
  snippetBody: { flex: 1, padding: 8, justifyContent: "center", gap: 2 },
  snippetSource: { fontSize: 10, color: "#7a6f5c", textTransform: "uppercase", letterSpacing: 0.5 },
  snippetTitle: { fontSize: 13, fontWeight: "600", color: "#14110d" },
  snippetDesc: { fontSize: 12, color: "#5a5a5a" },

  // reactions
  reactionBar: { flexDirection: "row", alignItems: "center", gap: 6, paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: "#e8e2d8" },
  reactionBarNoBorder: { paddingTop: 0, marginTop: 0, borderTopWidth: 0 },
  reactionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: "#7a6f5c" },
  shareBtn: { padding: 4, flexShrink: 0 },
});
