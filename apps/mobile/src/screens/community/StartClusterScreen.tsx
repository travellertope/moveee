import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";

const DAYS = [
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerSideBtn: { minWidth: 60, minHeight: 44, justifyContent: "center" },
    cancelText:    { fontFamily: fonts.sans, fontSize: 14, color: c.ochre },
    headerTitle:   { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    submitText:    { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre, textAlign: "right" },
    submitDisabled:{ opacity: 0.35 },

    body: { padding: space[4], paddingBottom: 40 },
    intro: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 19, marginBottom: space[4] },

    sectionLabel: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1,
      marginBottom: space[2], marginTop: space[4],
    },
    fieldInput: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: c.paper,
    },
    pickerBtn: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: c.paper,
    },
    pickerBtnText: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },
    pickerBtnPlaceholder: { color: c.ghost },

    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828", marginTop: space[2] },
  });
}

export default function StartClusterScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [street, setStreet] = useState("");
  const [country, setCountry] = useState(user?.countryOfResidence ?? "");
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit =
    name.trim().length > 0 &&
    city.trim().length > 0 &&
    street.trim().length > 0 &&
    country.trim().length > 0 &&
    meetingDay.length > 0 &&
    meetingTime.trim().length > 0;

  const close = () => nav.goBack();

  const pickDay = () => {
    Alert.alert(
      "Meeting day",
      "Which day does this House Fellowship meet?",
      [
        ...DAYS.map((d) => ({ text: d.label, onPress: () => setMeetingDay(d.value) })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        city: city.trim(),
        street: street.trim(),
        country: country.trim(),
        meeting_day: meetingDay,
        meeting_time: meetingTime.trim(),
        location_note: locationNote.trim(),
      };
      if (capacity.trim()) body.capacity = Number(capacity.trim());
      const res = await api.post<{ id: number }>(`${MOBILE_API}/cluster/create`, body as Record<string, string>);
      if (res?.id) {
        nav.replace("ClusterScreen", { id: res.id });
      } else {
        setError("Could not create this House Fellowship right now.");
      }
    } catch {
      setError("Could not create this House Fellowship right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedDay = DAYS.find((d) => d.value === meetingDay);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideBtn} onPress={close}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Start a House Fellowship</Text>
        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          <Text style={[styles.submitText, (!canSubmit || submitting) && styles.submitDisabled]}>
            {submitting ? "Creating…" : "Create"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.intro}>
            Start a weekly meet-up for Moveee members on your street. Open to all members — no
            tier requirement.
          </Text>

          <Text style={styles.sectionLabel}>Name</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Allen Avenue House Fellowship"
            placeholderTextColor={c.ghost}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.sectionLabel}>Street</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Allen Avenue"
            placeholderTextColor={c.ghost}
            value={street}
            onChangeText={setStreet}
          />

          <Text style={styles.sectionLabel}>City</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Lagos"
            placeholderTextColor={c.ghost}
            value={city}
            onChangeText={setCity}
          />

          <Text style={styles.sectionLabel}>Country</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Nigeria"
            placeholderTextColor={c.ghost}
            value={country}
            onChangeText={setCountry}
          />

          <Text style={styles.sectionLabel}>Meeting day</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={pickDay}>
            <Text style={[styles.pickerBtnText, !selectedDay && styles.pickerBtnPlaceholder]}>
              {selectedDay ? selectedDay.label : "Select a day"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Meeting time</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. 6:30pm"
            placeholderTextColor={c.ghost}
            value={meetingTime}
            onChangeText={setMeetingTime}
          />

          <Text style={styles.sectionLabel}>Location note (optional)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Meet at the blue gate, 3rd house"
            placeholderTextColor={c.ghost}
            value={locationNote}
            onChangeText={setLocationNote}
          />

          <Text style={styles.sectionLabel}>Capacity override (optional)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Leave blank for default"
            placeholderTextColor={c.ghost}
            value={capacity}
            onChangeText={setCapacity}
            keyboardType="number-pad"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
