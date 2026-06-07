import React, { useState } from "react";
import {
  View, Text, Image, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useComments } from "../../features/community/useComments";
import TierBadge from "../../components/ui/TierBadge";
import TimeAgo from "../../components/ui/TimeAgo";
import type { CommunityPost } from "../../types";

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

function PostHeader({ post, onAuthorPress }: { post?: CommunityPost; onAuthorPress: () => void }) {
  if (!post) return null;

  return (
    <View style={styles.post}>
      <TouchableOpacity style={styles.authorRow} onPress={onAuthorPress}>
        <Image source={{ uri: post.author.avatarUrl || PLACEHOLDER_AVATAR }} style={styles.avatar} />
        <View style={styles.authorMeta}>
          <View style={styles.nameRow}>
            <Text style={styles.authorName}>{post.author.name}</Text>
            <TierBadge tier={post.author.tier} />
          </View>
          <TimeAgo date={post.publishedAt} />
        </View>
      </TouchableOpacity>

      <Text style={styles.content}>{post.content}</Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name={post.liked ? "heart" : "heart-outline"} size={18} color={post.liked ? "#c0392b" : "#9e9e9e"} />
          <Text style={styles.statText}>{post.likeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={18} color="#9e9e9e" />
          <Text style={styles.statText}>{post.commentCount}</Text>
        </View>
      </View>

      <Text style={styles.commentsLabel}>Comments</Text>
    </View>
  );
}

export default function PostDetailScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation<any>();
  const post: CommunityPost | undefined = params?.post;
  const { comments, loading, addComment } = useComments(params.postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await addComment(text.trim());
      setText("");
    } finally {
      setSubmitting(false);
    }
  };

  const goToAuthor = () => post && nav.navigate("MemberProfile", { userId: post.author.id });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#14110d" />
        </TouchableOpacity>
        <Text style={styles.title}>Post</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color="#b38238" />
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(c) => c.id}
          ListHeaderComponent={<PostHeader post={post} onAuthorPress={goToAuthor} />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No comments yet — be the first to reply.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Image source={{ uri: item.author.avatarUrl || PLACEHOLDER_AVATAR }} style={styles.commentAvatar} />
              <View style={styles.commentBody}>
                <View style={styles.commentMetaRow}>
                  <Text style={styles.commentAuthor}>{item.author.name}</Text>
                  <TimeAgo date={item.publishedAt} />
                </View>
                <Text style={styles.commentContent}>{item.content}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()}>
            {submitting ? (
              <ActivityIndicator size="small" color="#b38238" />
            ) : (
              <Ionicons name="send" size={22} color={text.trim() ? "#b38238" : "#ccc"} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0d8cc",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#14110d" },
  loader: { flex: 1 },

  post: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14, marginBottom: 16,
    shadowColor: "#14110d", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  authorRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#e0d8cc" },
  authorMeta: { flex: 1, marginLeft: 10 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  authorName: { fontWeight: "600", fontSize: 14, color: "#14110d" },
  content: { fontSize: 15, color: "#14110d", lineHeight: 22, marginBottom: 10 },
  postImage: { width: "100%", height: 220, borderRadius: 8, marginBottom: 10 },
  statsRow: {
    flexDirection: "row", gap: 20, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: "#f3ece0",
  },
  statItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  statText: { fontSize: 13, color: "#9e9e9e" },
  commentsLabel: { marginTop: 16, fontWeight: "700", fontSize: 14, color: "#14110d" },

  emptyText: { textAlign: "center", color: "#9e9e9e", marginTop: 24, fontSize: 14 },

  comment: { flexDirection: "row", gap: 10, marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#e0d8cc" },
  commentBody: { flex: 1 },
  commentMetaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  commentAuthor: { fontWeight: "600", fontSize: 13, color: "#14110d" },
  commentContent: { fontSize: 14, color: "#333", lineHeight: 20 },

  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderTopWidth: 1, borderTopColor: "#e0d8cc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1, backgroundColor: "#f3ece0", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8, fontSize: 14, maxHeight: 100,
  },
});
