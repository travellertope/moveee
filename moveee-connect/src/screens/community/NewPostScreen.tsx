import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFeed } from "../../features/community/useFeed";
import { useAuthStore } from "../../auth/authStore";
import TierBadge from "../../components/ui/TierBadge";

const MAX_CHARS = 600;

export default function NewPostScreen() {
  const nav = useNavigation();
  const { submitPost } = useFeed();
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canPost = content.trim().length > 0 && content.length <= MAX_CHARS;

  const handleSubmit = async () => {
    if (!canPost) return;
    setSubmitting(true);
    try {
      const post = await submitPost(content.trim());
      if (post.status === "pending") {
        Alert.alert(
          "Post submitted",
          "Your post is under review and will appear shortly.",
          [{ text: "OK", onPress: () => nav.goBack() }]
        );
      } else {
        nav.goBack();
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <Ionicons name="close" size={24} color="#14110d" />
        </TouchableOpacity>
        <Text style={styles.title}>New post</Text>
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canPost || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnLabel}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.authorRow}>
        {user && <TierBadge tier={user.tier} />}
        <Text style={styles.username}>{user?.displayName}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#9e9e9e"
        multiline
        autoFocus
        value={content}
        onChangeText={setContent}
        maxLength={MAX_CHARS}
      />

      <Text style={styles.charCount}>{content.length}/{MAX_CHARS}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#e0d8cc",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#14110d" },
  postBtn: { backgroundColor: "#14110d", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  postBtnDisabled: { backgroundColor: "#ccc" },
  postBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16 },
  username: { fontWeight: "600", fontSize: 15, color: "#14110d" },
  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, color: "#14110d", lineHeight: 24, textAlignVertical: "top" },
  charCount: { textAlign: "right", paddingHorizontal: 16, paddingBottom: 8, color: "#9e9e9e", fontSize: 12 },
});
