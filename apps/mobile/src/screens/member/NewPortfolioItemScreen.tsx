import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Image, ActivityIndicator, Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";

const ITEM_TYPES = [
  { value: "lookbook", label: "Lookbook", emoji: "🖼️" },
  { value: "writing",  label: "Writing",  emoji: "✍️" },
  { value: "video",    label: "Video",    emoji: "🎬" },
  { value: "audio",    label: "Audio",    emoji: "🎵" },
  { value: "design",   label: "Design",   emoji: "🎨" },
  { value: "link",     label: "Link",     emoji: "🔗" },
] as const;

function uuid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function NewPortfolioItemScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<typeof ITEM_TYPES[number]["value"]>("lookbook");
  const [description, setDescription] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const isPickingRef = useRef(false);

  const pickCover = useCallback(async () => {
    if (isPickingRef.current) return;
    isPickingRef.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
      });
      if (!result.canceled) setCoverUri(result.assets[0].uri);
    } finally {
      isPickingRef.current = false;
    }
  }, []);

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert("Title required", "Give your portfolio piece a title.");
      return;
    }
    setSaving(true);
    try {
      let coverUrl = "";
      if (coverUri) {
        const fileName = coverUri.split("/").pop() ?? "cover.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        const res = await api.upload<{ url: string }>(`${MOBILE_API}/community/upload-image`, coverUri, fileName, fileType);
        coverUrl = res.url;
      }

      const existing = await api.get<{ items: any[] }>(`${MOBILE_API}/portfolio`).catch(() => ({ items: [] }));
      const newItem = {
        id: uuid(),
        title: title.trim(),
        type,
        description: description.trim(),
        external_url: externalUrl.trim(),
        media: coverUrl ? [{ type: "image", url: coverUrl }] : [],
        tags: [],
        created_at: new Date().toISOString().slice(0, 10),
      };
      const items = [...(existing.items ?? []), newItem];

      await api.post(`${MOBILE_API}/portfolio`, { items });
      nav.goBack();
    } catch {
      Alert.alert("Could not save", "Something went wrong saving your portfolio item. Try again.");
    }
    setSaving(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={12}>
          <Ionicons name="close" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add portfolio item</Text>
        <TouchableOpacity onPress={handleSubmit} disabled={saving || !title.trim()} hitSlop={12}>
          {saving
            ? <ActivityIndicator size="small" color={c.ochre} />
            : <Text style={[styles.saveText, !title.trim() && styles.saveTextDisabled]}>Save</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.coverPicker} onPress={pickCover}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverImage} resizeMode="cover" />
          ) : (
            <View style={styles.coverPlaceholder}>
              <Ionicons name="image-outline" size={28} color={c.ghost} />
              <Text style={styles.coverPlaceholderText}>Add cover image</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={(v) => setTitle(v.slice(0, 120))}
            placeholder="Project or piece title"
            placeholderTextColor={c.ghost}
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Type</Text>
          <View style={styles.chipRow}>
            {ITEM_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.chip, type === t.value && styles.chipActive]}
                onPress={() => setType(t.value)}
              >
                <Text style={[styles.chipText, type === t.value && styles.chipTextActive]}>
                  {t.emoji} {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={(v) => setDescription(v.slice(0, 600))}
            placeholder="Brief description of the work"
            placeholderTextColor={c.ghost}
            style={[styles.input, styles.textarea]}
            multiline
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>External link (optional)</Text>
          <TextInput
            value={externalUrl}
            onChangeText={setExternalUrl}
            placeholder="https://…"
            placeholderTextColor={c.ghost}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink },
    saveText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre },
    saveTextDisabled: { color: c.ghost },
    scroll: { padding: space[4], paddingBottom: 60, gap: 18 },
    coverPicker: { width: "100%", height: 180, borderRadius: radius.lg, overflow: "hidden" },
    coverImage: { width: "100%", height: "100%" },
    coverPlaceholder: {
      flex: 1, alignItems: "center", justifyContent: "center", gap: 6,
      backgroundColor: c.paperWarm, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.rule, borderStyle: "dashed",
    },
    coverPlaceholderText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    field: { gap: 6 },
    label: { fontFamily: fonts.sansBold, fontSize: 12, color: c.mute, textTransform: "uppercase", letterSpacing: 0.5 },
    input: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      backgroundColor: c.paperWarm, borderRadius: radius.md,
      borderWidth: 1, borderColor: c.rule, paddingHorizontal: 12, paddingVertical: 10,
    },
    textarea: { minHeight: 90, textAlignVertical: "top" },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
      backgroundColor: c.paperWarm, borderWidth: 1, borderColor: c.rule,
    },
    chipActive: { backgroundColor: c.ochre, borderColor: c.ochre },
    chipText: { fontFamily: fonts.sans, fontSize: 13, color: c.ink },
    chipTextActive: { fontFamily: fonts.sansBold, color: c.paper },
  });
}
