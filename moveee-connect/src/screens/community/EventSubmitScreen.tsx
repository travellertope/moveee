import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const FIELDS: Array<{ key: string; label: string; placeholder: string; multiline?: boolean; required?: boolean }> = [
  { key: "title", label: "Event title", placeholder: "e.g. Lagos Photo Festival", required: true },
  { key: "event_date", label: "Event date", placeholder: "YYYY-MM-DD", required: true },
  { key: "end_date", label: "End date (optional)", placeholder: "YYYY-MM-DD" },
  { key: "location", label: "Venue", placeholder: "e.g. The African Artists' Foundation" },
  { key: "city", label: "City", placeholder: "e.g. Lagos" },
  { key: "description", label: "Description", placeholder: "What's it about?", multiline: true },
  { key: "admission", label: "Admission", placeholder: "e.g. Free / £10" },
  { key: "ticketing_url", label: "Ticketing link (optional)", placeholder: "https://…" },
];

type FormState = Record<string, string>;

export default function EventSubmitScreen() {
  const nav = useNavigation();
  const [form, setForm] = useState<FormState>({
    title: "", event_date: "", end_date: "", location: "", city: "",
    description: "", admission: "", ticketing_url: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const set = (key: string) => (v: string) => setForm((prev) => ({ ...prev, [key]: v }));

  const canSubmit = form.title.trim().length > 0 && form.event_date.trim().length > 0;

  const close = () => nav.goBack();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.post(`${CULTURE_API}/events/submit-mobile`, form);
      Alert.alert(
        "Event submitted",
        "Thanks — your event is under review and will be listed once approved.",
        [{ text: "OK", onPress: close }]
      );
    } catch (e: unknown) {
      Alert.alert("Error", e instanceof Error ? e.message : "Could not submit event.");
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
          <Text style={styles.headerEmoji}>📅</Text>
          <Text style={styles.title}>List an Event</Text>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>Share a happening or exhibition with the community. Submissions go to editorial review before they're listed.</Text>

        {FIELDS.map(({ key, label, placeholder, multiline, required }) => (
          <View key={key} style={styles.fieldGroup}>
            <Text style={styles.label}>{label}{required ? " *" : ""}</Text>
            <TextInput
              style={[styles.input, multiline && styles.inputMultiline]}
              placeholder={placeholder}
              placeholderTextColor="#9e9e9e"
              value={form[key]}
              onChangeText={set(key)}
              multiline={multiline}
            />
          </View>
        ))}

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitBtnLabel}>Submit event</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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

  form: { padding: 18, paddingBottom: 40 },
  intro: { fontSize: 13, color: "#7a6f5c", lineHeight: 19, marginBottom: 18 },
  fieldGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "600", color: "#5a5347", marginBottom: 6, letterSpacing: 0.2 },
  input: {
    borderWidth: 1, borderColor: "#e0d8ce", borderRadius: 4,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#14110d", backgroundColor: "#fff",
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },

  submitBtn: { backgroundColor: "#14110d", borderRadius: 20, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  submitBtnDisabled: { backgroundColor: "#e8e2d8" },
  submitBtnLabel: { color: "#fff", fontWeight: "600", fontSize: 14, letterSpacing: 0.4, textTransform: "uppercase" },
});
