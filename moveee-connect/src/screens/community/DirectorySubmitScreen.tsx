import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const ENTRY_TYPES = [
  { slug: "person", label: "Person" },
  { slug: "place", label: "Place" },
  { slug: "movement", label: "Movement" },
  { slug: "genre", label: "Genre" },
  { slug: "concept", label: "Concept" },
  { slug: "artwork", label: "Artwork" },
  { slug: "food", label: "Food & Drink" },
  { slug: "fashion", label: "Fashion" },
];

function EntryTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const open = () => {
    Alert.alert("Entry type", "What kind of entry is this?", [
      ...ENTRY_TYPES.map((t) => ({ text: t.label, onPress: () => onChange(t.slug) })),
      { text: "Cancel", style: "cancel" as const },
    ]);
  };
  const label = ENTRY_TYPES.find((t) => t.slug === value)?.label ?? "Concept";
  return (
    <TouchableOpacity style={styles.picker} onPress={open}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <Ionicons name="chevron-down" size={14} color="#7a6f5c" />
    </TouchableOpacity>
  );
}

export default function DirectorySubmitScreen() {
  const nav = useNavigation();
  const user = useAuthStore((s) => s.user);
  const isPatron = user?.tier === "patron";

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [entryType, setEntryType] = useState("concept");
  const [submitting, setSubmitting] = useState(false);

  const close = () => nav.goBack();
  const canSubmit = title.trim().length > 0 && excerpt.trim().length > 0 && content.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post(`${CULTURE_API}/directory/submit-mobile`, {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        entry_type: entryType,
      });
      Alert.alert(
        "Entry submitted",
        "Thanks — your directory entry is under review and will appear once approved.",
        [{ text: "OK", onPress: close }]
      );
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit entry.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={close}>
          <Ionicons name="close" size={24} color="#14110d" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Text style={styles.headerEmoji}>✦</Text>
          <Text style={styles.title}>Add to Directory</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {!isPatron ? (
        <View style={styles.gate}>
          <Ionicons name="lock-closed-outline" size={32} color="#b38238" />
          <Text style={styles.gateTitle}>Connect Pro membership required</Text>
          <Text style={styles.gateText}>
            Directory submissions — people, places &amp; movements that shape culture — are a Connect Pro
            privilege. Upgrade your membership to start contributing entries.
          </Text>
          <TouchableOpacity style={styles.upgradeBtn} onPress={() => (nav as any).navigate("Me", { screen: "Membership" })}>
            <Text style={styles.upgradeBtnLabel}>Upgrade to Connect Pro</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Add a person, place, movement, or idea to the Culture Directory. Submissions go to editorial
            review before they're published.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Fela Kuti"
              placeholderTextColor="#9e9e9e"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Entry type</Text>
            <EntryTypePicker value={entryType} onChange={setEntryType} />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Excerpt *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { minHeight: 60 }]}
              placeholder="A short one or two sentence summary"
              placeholderTextColor="#9e9e9e"
              value={excerpt}
              onChangeText={setExcerpt}
              multiline
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Content *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { minHeight: 160 }]}
              placeholder="The full entry…"
              placeholderTextColor="#9e9e9e"
              value={content}
              onChangeText={setContent}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitBtnLabel}>Submit entry</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 16, borderBottomWidth: 1, borderBottomColor: "#e8e2d8",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerEmoji: { fontSize: 16 },
  title: { fontSize: 16, fontWeight: "600", color: "#14110d", fontFamily: SERIF },

  gate: { flex: 1, alignItems: "center", justifyContent: "center", padding: 36, gap: 12 },
  gateTitle: { fontSize: 16, fontWeight: "700", color: "#14110d", textAlign: "center" },
  gateText: { fontSize: 13, color: "#7a6f5c", textAlign: "center", lineHeight: 20 },
  upgradeBtn: { backgroundColor: "#b38238", borderRadius: 20, paddingHorizontal: 22, paddingVertical: 11, marginTop: 6 },
  upgradeBtnLabel: { color: "#fff", fontWeight: "700", fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" },

  form: { padding: 18, paddingBottom: 40 },
  intro: { fontSize: 13, color: "#7a6f5c", lineHeight: 19, marginBottom: 18 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#5a5347", marginBottom: 6, letterSpacing: 0.2 },
  input: {
    borderWidth: 1, borderColor: "#e0d8ce", borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#14110d", backgroundColor: "#fff",
  },
  inputMultiline: { textAlignVertical: "top" },
  picker: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderColor: "#e0d8ce", borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  pickerLabel: { fontSize: 14, color: "#14110d" },

  submitBtn: { backgroundColor: "#7a4da0", borderRadius: 20, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  submitBtnDisabled: { backgroundColor: "#e8e2d8" },
  submitBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase" },
});
