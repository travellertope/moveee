import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import type { CommunityPost } from "../../types";
import TierBadge from "../ui/TierBadge";
import TimeAgo from "../ui/TimeAgo";
import Avatar from "../ui/Avatar";

interface Props {
  post: CommunityPost;
  onPress: () => void;
  onLike: () => void;
  onAuthorPress: () => void;
}

export default function PostCard({ post, onPress, onLike, onAuthorPress }: Props) {
  const [reported, setReported] = useState(false);

  const submitReport = async (reason: "spam" | "harassment" | "inappropriate") => {
    try {
      await api.post(`${MOBILE_API}/community/report`, { post_id: post.id, reason });
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

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress}>
        <Avatar
          uri={post.author.avatarUrl}
          name={post.author.name}
          size={40}
          tier={post.author.tier}
        />
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <TierBadge tier={post.author.tier} />
          </View>
          <TimeAgo date={post.publishedAt} />
        </View>
        <TouchableOpacity onPress={handleReport} style={styles.reportBtn}>
          <Ionicons name={reported ? "flag" : "flag-outline"} size={16} color={reported ? "#b38238" : "#9e9e9e"} />
        </TouchableOpacity>
      </TouchableOpacity>

      {post.status === "pending" ? (
        <View style={styles.pendingBadge}>
          <Ionicons name="time-outline" size={13} color="#9a6b1f" />
          <Text style={styles.pendingText}>Pending review — only visible to you</Text>
        </View>
      ) : null}

      <Text style={styles.content} numberOfLines={6}>
        {post.content}
      </Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onLike}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={20}
            color={post.liked ? "#c0392b" : "#9e9e9e"}
          />
          <Text style={styles.actionCount}>{post.likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
          <Ionicons name="chatbubble-outline" size={20} color="#9e9e9e" />
          <Text style={styles.actionCount}>{post.commentCount}</Text>
        </TouchableOpacity>
      </View>
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
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0d8cc" },
  authorMeta: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  pendingBadge: {
    flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start",
    backgroundColor: "#fef3c7", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    marginBottom: 8,
  },
  pendingText: { fontSize: 11, color: "#9a6b1f", fontWeight: "600" },
  content: { fontSize: 15, color: "#14110d", lineHeight: 22, marginBottom: 10 },
  postImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  actions: { flexDirection: "row", gap: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f3ece0" },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionCount: { fontSize: 13, color: "#9e9e9e" },
  reportBtn: { padding: 4 },
});
