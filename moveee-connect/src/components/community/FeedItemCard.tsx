import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import type { FeedItem, Tier } from "../../types";
import TierBadge from "../ui/TierBadge";
import TimeAgo from "../ui/TimeAgo";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

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

function ReactionBar({ item, onReact }: { item: FeedItem; onReact?: (type: "love" | "fire" | "clap") => void }) {
  if (!item.reactions) return null;
  const entries: Array<{ key: "love" | "fire" | "clap"; emoji: string }> = [
    { key: "love", emoji: "❤️" },
    { key: "fire", emoji: "🔥" },
    { key: "clap", emoji: "👏" },
  ];
  return (
    <View style={styles.reactionBar}>
      {entries.map(({ key, emoji }) => (
        <TouchableOpacity key={key} style={styles.reactionBtn} onPress={() => onReact?.(key)}>
          <Text style={styles.reactionEmoji}>{emoji}</Text>
          <Text style={styles.reactionCount}>{item.reactions?.[key] ?? 0}</Text>
        </TouchableOpacity>
      ))}
      {typeof item.commentCount === "number" ? (
        <View style={styles.reactionBtn}>
          <Ionicons name="chatbubble-outline" size={14} color="#7a6f5c" />
          <Text style={styles.reactionCount}>{item.commentCount}</Text>
        </View>
      ) : null}
    </View>
  );
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
      <TimeAgo date={item.date} />
    </View>
  );
}

export default function FeedItemCard({ item, onPress, onAuthorPress, onReact }: Props) {
  const [reported, setReported] = useState(false);

  const submitReport = async (reason: "spam" | "harassment" | "inappropriate") => {
    if (!item.wpId) return;
    try {
      await api.post(`${CULTURE_API}/community/report`, { post_id: Number(item.wpId), reason });
      setReported(true);
      Alert.alert("Thanks", "We've recorded your report and will review this post.");
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit report.");
    }
  };

  const handleReport = () => {
    if (reported) return;
    Alert.alert("Report post", "Why are you reporting this?", [
      { text: "Spam", onPress: () => submitReport("spam") },
      { text: "Harassment", onPress: () => submitReport("harassment") },
      { text: "Inappropriate", onPress: () => submitReport("inappropriate") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  if (item.type === "community") {
    return (
      <TouchableOpacity style={[styles.card, styles.communityCard]} onPress={onPress} activeOpacity={0.95}>
        <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress} disabled={!onAuthorPress}>
          <Image source={{ uri: item.communityAuthorAvatar || PLACEHOLDER_AVATAR }} style={styles.avatar} />
          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{item.communityAuthor || "Member"}</Text>
              {item.communityTier ? <TierBadge tier={item.communityTier as Tier} /> : null}
            </View>
            <TimeAgo date={item.date} />
          </View>
          <TouchableOpacity onPress={handleReport} style={styles.reportBtn}>
            <Ionicons name={reported ? "flag" : "flag-outline"} size={16} color={reported ? "#b38238" : "#c8bfb0"} />
          </TouchableOpacity>
        </TouchableOpacity>

        <Text style={styles.content} numberOfLines={6}>{item.title}</Text>

        {item.image ? <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" /> : null}

        <LinkSnippet item={item} />
        <ReactionBar item={item} onReact={onReact} />
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
              <TimeAgo date={item.date} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Pulse keeps a full-width hero image (matches web). Editorial / happening /
  // directory show inline excerpt + a left-thumbnail "internal link" preview
  // card instead — mirrors components/pulse/InternalLinkCard.tsx on the web.
  if (item.type === "pulse") {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
        <MetaRow item={item} accentColor={TYPE_META.pulse.color} />

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {item.image ? <Image source={{ uri: item.image }} style={styles.mediaImage} resizeMode="cover" /> : null}
        {item.excerpt ? <Text style={styles.excerpt} numberOfLines={4}>{item.excerpt}</Text> : null}

        <LinkSnippet item={item} />
        <ReactionBar item={item} onReact={onReact} />
      </TouchableOpacity>
    );
  }

  const INTERNAL_LINK_LABEL: Record<string, string> = {
    editorial: "Moveee Magazine",
    happening: "Moveee Happenings",
    directory: "Culture Directory",
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <MetaRow item={item} accentColor={TYPE_META[item.type].color} />

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      {item.excerpt ? <Text style={styles.excerpt} numberOfLines={3}>{item.excerpt}</Text> : null}

      <View style={styles.internalLinkCard}>
        {item.image ? <Image source={{ uri: item.image }} style={styles.internalLinkImage} resizeMode="cover" /> : null}
        <View style={styles.internalLinkBody}>
          <Text style={styles.internalLinkLabel}>{INTERNAL_LINK_LABEL[item.type]}</Text>
          <Text style={styles.internalLinkTitle} numberOfLines={2}>{item.title}</Text>
          {item.excerpt ? <Text style={styles.internalLinkDesc} numberOfLines={1}>{item.excerpt}</Text> : null}
        </View>
      </View>
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

  // community
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: "#edf7ed" },
  authorMeta: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  reportBtn: { padding: 4 },
  content: { fontSize: 15, color: "#14110d", lineHeight: 22, marginBottom: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: "#e8e2d8" },

  // pulse / editorial / happening / directory cards
  title: { fontSize: 16, fontWeight: "700", fontFamily: SERIF, color: "#14110d", lineHeight: 22, marginBottom: 5 },
  excerpt: { fontSize: 14, color: "#3a342b", lineHeight: 21, marginBottom: 4 },
  mediaImage: { width: "100%", height: 180, borderRadius: 6, marginTop: 8, marginBottom: 4, borderWidth: 1, borderColor: "#e8e2d8", backgroundColor: "#e0d8cc" },

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
  internalLinkImage: { width: 96, backgroundColor: "#e0d8cc" },
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
  reactionBar: { flexDirection: "row", gap: 18, paddingTop: 10, marginTop: 6, borderTopWidth: 1, borderTopColor: "#e8e2d8" },
  reactionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  reactionEmoji: { fontSize: 14 },
  reactionCount: { fontSize: 12, color: "#7a6f5c" },
});
