import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { FeedItem, Tier } from "../../types";
import TierBadge from "../ui/TierBadge";
import TimeAgo from "../ui/TimeAgo";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

const TYPE_META: Record<FeedItem["type"], { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  pulse: { label: "Pulse", icon: "pulse-outline", color: "#c0392b" },
  editorial: { label: "Magazine", icon: "newspaper-outline", color: "#2e6f8e" },
  happening: { label: "Happening", icon: "calendar-outline", color: "#7d5ba6" },
  directory: { label: "Directory", icon: "compass-outline", color: "#3a8c5f" },
  quote: { label: "Quote", icon: "chatbox-ellipses-outline", color: "#b38238" },
  community: { label: "", icon: "people-outline", color: "#14110d" },
};

interface Props {
  item: FeedItem;
  onPress: () => void;
  onAuthorPress?: () => void;
  onReact?: (type: "love" | "fire" | "clap") => void;
}

function TypeTag({ item }: { item: FeedItem }) {
  const meta = TYPE_META[item.type];
  if (!meta.label) return null;
  return (
    <View style={[styles.typeTag, { backgroundColor: `${meta.color}1a` }]}>
      <Ionicons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.typeTagText, { color: meta.color }]}>{meta.label}</Text>
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
          <Ionicons name="chatbubble-outline" size={16} color="#9e9e9e" />
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

export default function FeedItemCard({ item, onPress, onAuthorPress, onReact }: Props) {
  if (item.type === "community") {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
        <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress} disabled={!onAuthorPress}>
          <Image source={{ uri: item.communityAuthorAvatar || PLACEHOLDER_AVATAR }} style={styles.avatar} />
          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{item.communityAuthor || "Member"}</Text>
              {item.communityTier ? <TierBadge tier={item.communityTier as Tier} /> : null}
            </View>
            <TimeAgo date={item.date} />
          </View>
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
        <Ionicons name="chatbox-outline" size={20} color="#b38238" />
        <Text style={styles.quoteText}>{item.title}</Text>
        {item.quoteAuthor ? <Text style={styles.quoteAuthor}>— {item.quoteAuthor}</Text> : null}
        <TimeAgo date={item.date} />
      </TouchableOpacity>
    );
  }

  // pulse, editorial, happening, directory share a media-card layout
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <View style={styles.metaRow}>
        <TypeTag item={item} />
        <TimeAgo date={item.date} />
      </View>

      {item.image ? <Image source={{ uri: item.image }} style={styles.mediaImage} resizeMode="cover" /> : null}

      <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
      {item.excerpt ? <Text style={styles.excerpt} numberOfLines={3}>{item.excerpt}</Text> : null}

      {item.type === "happening" ? (
        <View style={styles.subInfoRow}>
          {item.eventDate ? (
            <View style={styles.subInfoItem}>
              <Ionicons name="time-outline" size={14} color="#9e9e9e" />
              <Text style={styles.subInfoText}>{item.eventDate}</Text>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.subInfoItem}>
              <Ionicons name="location-outline" size={14} color="#9e9e9e" />
              <Text style={styles.subInfoText} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {item.type === "directory" && item.entryType ? (
        <View style={styles.subInfoRow}>
          <View style={styles.subInfoItem}>
            <Ionicons name="pricetag-outline" size={14} color="#9e9e9e" />
            <Text style={styles.subInfoText}>{item.entryType}</Text>
          </View>
        </View>
      ) : null}

      {item.type === "editorial" && item.category ? (
        <View style={styles.subInfoRow}>
          <View style={styles.subInfoItem}>
            <Ionicons name="bookmark-outline" size={14} color="#9e9e9e" />
            <Text style={styles.subInfoText}>{item.category}</Text>
          </View>
        </View>
      ) : null}

      <LinkSnippet item={item} />
      {item.type === "pulse" ? <ReactionBar item={item} onReact={onReact} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 14,
    shadowColor: "#14110d",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  // community
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0d8cc" },
  authorMeta: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  content: { fontSize: 15, color: "#14110d", lineHeight: 22, marginBottom: 10 },
  postImage: { width: "100%", height: 200, borderRadius: 8, marginBottom: 10 },

  // media cards
  metaRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  typeTag: { flexDirection: "row", alignItems: "center", gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typeTagText: { fontSize: 11, fontWeight: "700" },
  mediaImage: { width: "100%", height: 180, borderRadius: 8, marginBottom: 10, backgroundColor: "#e0d8cc" },
  title: { fontSize: 16, fontWeight: "700", color: "#14110d", lineHeight: 22, marginBottom: 4 },
  excerpt: { fontSize: 14, color: "#5a5a5a", lineHeight: 20, marginBottom: 6 },
  subInfoRow: { flexDirection: "row", gap: 16, marginTop: 4, marginBottom: 4 },
  subInfoItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
  subInfoText: { fontSize: 12, color: "#9e9e9e" },

  // quote
  quoteCard: { gap: 8, alignItems: "flex-start" },
  quoteText: { fontSize: 16, fontStyle: "italic", color: "#14110d", lineHeight: 23 },
  quoteAuthor: { fontSize: 13, fontWeight: "600", color: "#b38238" },

  // link snippet
  snippet: {
    flexDirection: "row", borderWidth: 1, borderColor: "#e0d8cc", borderRadius: 8,
    overflow: "hidden", marginTop: 4, marginBottom: 6,
  },
  snippetImage: { width: 84, height: 84, backgroundColor: "#e0d8cc" },
  snippetBody: { flex: 1, padding: 8, justifyContent: "center", gap: 2 },
  snippetSource: { fontSize: 11, color: "#9e9e9e", textTransform: "uppercase" },
  snippetTitle: { fontSize: 13, fontWeight: "600", color: "#14110d" },
  snippetDesc: { fontSize: 12, color: "#5a5a5a" },

  // reactions
  reactionBar: { flexDirection: "row", gap: 18, paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: "#f3ece0" },
  reactionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  reactionEmoji: { fontSize: 15 },
  reactionCount: { fontSize: 13, color: "#9e9e9e" },
});
