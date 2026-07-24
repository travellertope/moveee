import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Hub } from "../../types";

const ALL_TEMPLATES: { slug: string; label: string; emoji: string; gated?: boolean }[] = [
  { slug: "post", label: "Update", emoji: "📝" },
  { slug: "hidden-gem", label: "Place", emoji: "💎" },
  { slug: "food-review", label: "Food", emoji: "🍽️" },
  { slug: "book-review", label: "Book", emoji: "📚" },
  { slug: "creative-showcase", label: "Showcase", emoji: "🎨" },
  { slug: "event", label: "Event", emoji: "📅", gated: true },
  { slug: "poll", label: "Poll", emoji: "📊", gated: true },
  { slug: "itinerary", label: "Itinerary", emoji: "🗺️", gated: true },
];

const DEFAULT_TEMPLATES = ["post"];

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },
    scroll: { padding: space[4], paddingBottom: 60, gap: 14 },
    heading: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    sub: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 19 },
    label: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1, marginTop: 8 },
    input: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg,
      paddingHorizontal: 14, height: 44, fontFamily: fonts.sans, fontSize: 14, color: c.ink,
    },
    textarea: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg,
      padding: 14, fontFamily: fonts.sans, fontSize: 14, color: c.ink, minHeight: 88, textAlignVertical: "top",
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      paddingHorizontal: 12, paddingVertical: 8,
    },
    chipActive: { borderColor: c.ochre, backgroundColor: c.paperWarm },
    chipText: { fontFamily: fonts.sans, fontSize: 13, color: c.ink },
    chipTextActive: { fontFamily: fonts.sansBold, color: c.ochre },
    hint: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, lineHeight: 16 },
    coverPicker: {
      height: 120, borderRadius: radius.lg, borderWidth: 1, borderColor: c.rule,
      borderStyle: "dashed", alignItems: "center", justifyContent: "center", overflow: "hidden",
    },
    coverPickerText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    coverImage: { width: "100%", height: "100%" },
    error: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828" },
    submitBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      height: 48, alignItems: "center", justifyContent: "center", marginTop: 8,
    },
    submitBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
  });
}

export default function HubCreateScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allowed, setAllowed] = useState<string[]>(DEFAULT_TEMPLATES);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggle = (slug: string) => {
    setAllowed((cur) => (cur.includes(slug) ? cur.filter((s) => s !== slug) : [...cur, slug]));
  };

  const pickCover = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setUploadingCover(true);
    setError("");
    try {
      const fileName = uri.split("/").pop() ?? "cover.jpg";
      const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
      const res = await api.upload<{ url: string }>(`${MOBILE_API}/community/upload-image`, uri, fileName, fileType);
      setCoverImageUrl(res.url);
    } catch {
      setError("Could not upload that image.");
    }
    setUploadingCover(false);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const hub = await api.post<Hub>(`${MOBILE_API}/hub/create`, {
        name: name.trim(),
        description: description.trim(),
        allowed_templates: allowed.length ? allowed : DEFAULT_TEMPLATES,
        cover_image_url: coverImageUrl,
      });
      nav.navigate("HubDetail", { slug: hub.slug });
    } catch (e: any) {
      setError(e?.message || "Could not start a Hub right now.");
    }
    setSubmitting(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start a Hub</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.heading}>Start a Hub.</Text>
        <Text style={styles.sub}>
          A Hub is a topic community — anyone can join, post, and comment on what
          they love. Give it a name, a short description, and choose what people
          can post there.
        </Text>

        <Text style={styles.label}>Hub name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Afrobeats Heads"
          placeholderTextColor={c.mute}
          value={name}
          onChangeText={setName}
          editable={!submitting}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.textarea}
          placeholder="What's this Hub about?"
          placeholderTextColor={c.mute}
          value={description}
          onChangeText={setDescription}
          editable={!submitting}
          multiline
        />

        <Text style={styles.label}>Cover image (optional)</Text>
        <TouchableOpacity
          style={styles.coverPicker}
          onPress={pickCover}
          disabled={submitting || uploadingCover}
        >
          {uploadingCover ? (
            <ActivityIndicator color={c.gold} />
          ) : coverImageUrl ? (
            <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />
          ) : (
            <Text style={styles.coverPickerText}>Choose an image</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>What can members post?</Text>
        <View style={styles.grid}>
          {ALL_TEMPLATES.map((t) => {
            const active = allowed.includes(t.slug);
            return (
              <TouchableOpacity
                key={t.slug}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggle(t.slug)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {t.emoji} {t.label}{t.gated ? " 🔒" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={styles.hint}>
          🔒 = members will still need the required reputation tier (or Moveee Pro) to
          use that template, even when it's allowed here.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, (!name.trim() || !description.trim() || submitting) && { opacity: 0.5 }]}
          onPress={submit}
          disabled={!name.trim() || !description.trim() || submitting}
        >
          {submitting ? <ActivityIndicator color={c.paper} /> : <Text style={styles.submitBtnText}>Start Hub →</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
