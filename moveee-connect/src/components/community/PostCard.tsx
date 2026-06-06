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
import type { CommunityPost } from "../../types";
import TierBadge from "../ui/TierBadge";
import TimeAgo from "../ui/TimeAgo";

interface Props {
  post: CommunityPost;
  onPress: () => void;
  onLike: () => void;
  onAuthorPress: () => void;
}

export default function PostCard({ post, onPress, onLike, onAuthorPress }: Props) {
  const [reportOpen, setReportOpen] = useState(false);

  const handleReport = () => {
    Alert.alert("Report post", "Why are you reporting this?", [
      { text: "Spam", onPress: () => setReportOpen(false) },
      { text: "Harassment", onPress: () => setReportOpen(false) },
      { text: "Inappropriate", onPress: () => setReportOpen(false) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress}>
        <Image
          source={{ uri: post.author.avatarUrl || "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png" }}
          style={styles.avatar}
        />
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <TierBadge tier={post.author.tier} />
          </View>
          <TimeAgo date={post.publishedAt} />
        </View>
        <TouchableOpacity onPress={handleReport} style={styles.reportBtn}>
          <Ionicons name="flag-outline" size={16} color="#9e9e9e" />
        </TouchableOpacity>
      </TouchableOpacity>

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
