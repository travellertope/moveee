import React, { useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useComments } from "../../features/community/useComments";

export default function PostDetailScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation();
  const { comments, loading, addComment } = useComments(params.postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    await addComment(text.trim());
    setText("");
    setSubmitting(false);
  };

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
          renderItem={({ item }) => (
            <View style={styles.comment}>
              <Text style={styles.commentAuthor}>{item.author.name}</Text>
              <Text style={styles.commentContent}>{item.content}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Add a comment…"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity onPress={submit} disabled={submitting}>
            <Ionicons
              name="send"
              size={22}
              color={text.trim() ? "#b38238" : "#ccc"}
            />
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
  comment: { marginBottom: 14 },
  commentAuthor: { fontWeight: "600", fontSize: 13, color: "#14110d", marginBottom: 2 },
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
