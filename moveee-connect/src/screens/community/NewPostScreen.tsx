import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Platform, Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFeed } from "../../features/community/useFeed";
import { useAuthStore } from "../../auth/authStore";
import { api, CULTURE_API } from "../../api/client";
import TierBadge from "../../components/ui/TierBadge";

const MAX_CHARS = 600;
const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const SECTIONS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

type Mode = "post" | "quote";

function SubmitDropdown() {
  const nav = useNavigation<any>();
  const open = () => {
    Alert.alert("Submit", "What would you like to add?", [
      { text: "📅  List an Event", onPress: () => nav.navigate("EventSubmit") },
      { text: "✦  Add to Directory", onPress: () => nav.navigate("DirectorySubmit") },
      { text: "Cancel", style: "cancel" },
    ]);
  };
  return (
    <TouchableOpacity style={styles.submitDropdownBtn} onPress={open}>
      <Text style={styles.submitDropdownLabel}>+ Submit</Text>
      <Ionicons name="chevron-down" size={11} color="#7a6f5c" />
    </TouchableOpacity>
  );
}

function SectionPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const open = () => {
    Alert.alert("Section", "Post into a specific section feed", [
      { text: "General feed", onPress: () => onChange("") },
      ...SECTIONS.map((s) => ({ text: s, onPress: () => onChange(s) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };

  return (
    <TouchableOpacity style={styles.sectionPicker} onPress={open}>
      <Text style={styles.sectionPickerLabel}>{value || "Section"}</Text>
      <Ionicons name="chevron-down" size={14} color="#7a6f5c" />
    </TouchableOpacity>
  );
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function PostForm({ onDone }: { onDone: () => void }) {
  const { submitPost } = useFeed();
  const user = useAuthStore((s) => s.user);
  const [content, setContent] = useState("");
  const [section, setSection] = useState("");
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canPost = content.trim().length > 0 && content.length <= MAX_CHARS;

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to attach an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > MAX_IMAGE_BYTES) {
      Alert.alert("Image too large", "Please choose an image under 8 MB.");
      return;
    }
    setImage(asset);
  };

  const handleSubmit = async () => {
    if (!canPost) return;
    setSubmitting(true);
    try {
      let imageUrl: string | undefined;
      if (image) {
        const name = image.fileName ?? `community-${Date.now()}.jpg`;
        const type = image.mimeType ?? "image/jpeg";
        const uploaded = await api.upload<{ url: string }>(`${CULTURE_API}/community/upload-image`, image.uri, name, type);
        imageUrl = uploaded.url;
      }
      const post = await submitPost(content.trim(), imageUrl, section || undefined);
      if (post.status === "pending") {
        Alert.alert(
          "Post submitted",
          "Your post is under review and will appear shortly.",
          [{ text: "OK", onPress: onDone }]
        );
      } else {
        onDone();
      }
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit post.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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

      {image ? (
        <View style={styles.imagePreviewWrap}>
          <Image source={{ uri: image.uri }} style={styles.imagePreview} resizeMode="cover" />
          <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setImage(null)}>
            <Ionicons name="close" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.imageBtn, image && styles.imageBtnActive]} onPress={pickImage}>
          <Ionicons name="image-outline" size={15} color={image ? "#c5491f" : "#7a6f5c"} />
          <Text style={[styles.imageBtnLabel, image && styles.imageBtnLabelActive]}>{image ? "Change" : "Image"}</Text>
        </TouchableOpacity>
        <SectionPicker value={section} onChange={setSection} />
        <View style={{ flex: 1 }} />
        <Text style={styles.charCount}>{content.length}/{MAX_CHARS}</Text>
        <TouchableOpacity
          style={[styles.submitBtn, !canPost && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canPost || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

function QuoteForm({ onDone }: { onDone: () => void }) {
  const user = useAuthStore((s) => s.user);
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const [source, setSource] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = text.trim().length > 0 && author.trim().length > 0 && text.length <= MAX_CHARS;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post(`${CULTURE_API}/community/quote`, {
        text: text.trim(),
        author: author.trim(),
        source: source.trim() || undefined,
      });
      Alert.alert(
        "Quote submitted",
        "Thank you — it will appear in the archive after review.",
        [{ text: "OK", onPress: onDone }]
      );
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit quote.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.authorRow}>
        {user && <TierBadge tier={user.tier} />}
        <Text style={styles.username}>{user?.displayName}</Text>
      </View>

      <TextInput
        style={styles.quoteInput}
        placeholder="The quote…"
        placeholderTextColor="#9e9e9e"
        multiline
        autoFocus
        value={text}
        onChangeText={setText}
        maxLength={MAX_CHARS}
      />

      <View style={styles.quoteFieldsRow}>
        <TextInput
          style={styles.quoteField}
          placeholder="Author *"
          placeholderTextColor="#9e9e9e"
          value={author}
          onChangeText={(v) => setAuthor(v.slice(0, 100))}
        />
        <TextInput
          style={styles.quoteField}
          placeholder="Source (optional)"
          placeholderTextColor="#9e9e9e"
          value={source}
          onChangeText={(v) => setSource(v.slice(0, 150))}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.charCount}>{MAX_CHARS - text.length}</Text>
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled, canSubmit && styles.submitBtnQuote]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>Submit</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

export default function NewPostScreen() {
  const nav = useNavigation();
  const [mode, setMode] = useState<Mode>("post");

  const close = () => nav.goBack();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={24} color="#14110d" />
        </TouchableOpacity>
        <Text style={styles.title}>New post</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setMode("post")} style={styles.tab}>
          <Text style={[styles.tabLabel, mode === "post" && styles.tabLabelActive]}>Post</Text>
          {mode === "post" && <View style={styles.tabUnderline} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode("quote")} style={styles.tab}>
          <Text style={[styles.tabLabel, mode === "quote" && styles.tabLabelActive]}>Quote</Text>
          {mode === "quote" && <View style={[styles.tabUnderline, { backgroundColor: "#7a4da0" }]} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <SubmitDropdown />
      </View>

      {mode === "post" ? <PostForm onDone={close} /> : <QuoteForm onDone={close} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#e8e2d8",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#14110d" },

  tabRow: { flexDirection: "row", alignItems: "center", gap: 22, paddingHorizontal: 16, paddingTop: 12, borderBottomWidth: 1, borderBottomColor: "#e8e2d8" },
  submitDropdownBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "#e0d8ce", borderRadius: 2,
    paddingHorizontal: 9, paddingVertical: 6, marginBottom: 10,
  },
  submitDropdownLabel: { fontSize: 11, fontWeight: "600", letterSpacing: 0.6, textTransform: "uppercase", color: "#7a6f5c" },
  tab: { paddingBottom: 10 },
  tabLabel: { fontSize: 13, fontWeight: "600", color: "#9e9e9e", letterSpacing: 0.3, textTransform: "uppercase" },
  tabLabelActive: { color: "#14110d" },
  tabUnderline: { height: 2, backgroundColor: "#14110d", marginTop: 8, borderRadius: 1 },

  authorRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 16 },
  username: { fontWeight: "600", fontSize: 15, color: "#14110d" },

  input: { flex: 1, paddingHorizontal: 16, fontSize: 16, color: "#14110d", lineHeight: 24, textAlignVertical: "top" },

  quoteInput: {
    paddingHorizontal: 16, paddingBottom: 12, fontSize: 17, color: "#14110d", lineHeight: 25,
    fontFamily: SERIF, fontStyle: "italic", textAlignVertical: "top", minHeight: 90,
    borderBottomWidth: 1, borderBottomColor: "#e0d8cc", marginHorizontal: 16,
  },
  quoteFieldsRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 14 },
  quoteField: {
    flex: 1, borderWidth: 1, borderColor: "#e0d8cc", borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 9, fontSize: 14, color: "#14110d", backgroundColor: "#fff",
  },

  imagePreviewWrap: { marginHorizontal: 16, marginTop: 4, position: "relative" },
  imagePreview: { width: "100%", height: 180, borderRadius: 4, borderWidth: 1, borderColor: "#e0d8ce", backgroundColor: "#f0ece4" },
  imageRemoveBtn: {
    position: "absolute", top: 8, right: 8,
    backgroundColor: "rgba(20,17,13,0.6)", borderRadius: 12,
    width: 24, height: 24, justifyContent: "center", alignItems: "center",
  },
  imageBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: "#e0d8ce", borderRadius: 2,
    paddingHorizontal: 9, paddingVertical: 6,
  },
  imageBtnActive: { backgroundColor: "#fff0eb", borderColor: "#c5491f" },
  imageBtnLabel: { fontSize: 12, color: "#7a6f5c", fontWeight: "600" },
  imageBtnLabelActive: { color: "#c5491f" },

  sectionPicker: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: "#e0d8cc", borderRadius: 4,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  sectionPickerLabel: { fontSize: 13, color: "#5a5347" },
  footer: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 12, padding: 16, marginTop: "auto" },
  charCount: { color: "#9e9e9e", fontSize: 12 },
  submitBtn: { backgroundColor: "#14110d", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 8, minWidth: 76, alignItems: "center" },
  submitBtnQuote: { backgroundColor: "#7a4da0" },
  submitBtnDisabled: { backgroundColor: "#e8e2d8" },
  submitBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
