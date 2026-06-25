import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Alert, Share,
  Modal, FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import type { AppParamList } from "../../hooks/useNav";
import type { RouteProp } from "@react-navigation/native";

const DAYS = [
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

const COUNTRIES = [
  "Nigeria", "United Kingdom", "United States", "Ghana", "Kenya", "South Africa",
  "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden",
  "UAE", "Jamaica", "Trinidad & Tobago",
];

type Route = RouteProp<AppParamList, "StartClusterScreen">;

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
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    pickerBtnText: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },
    pickerBtnPlaceholder: { color: c.ghost },

    // Onboarding summary card
    summaryCard: {
      backgroundColor: c.paperDeep, borderRadius: radius.xl, padding: 16,
      marginBottom: space[4], gap: 6,
    },
    summaryHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginBottom: 8,
    },
    summaryTitle: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1,
    },
    summaryEditBtn: { fontFamily: fonts.sans, fontSize: 12, color: c.ochre },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    summaryDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: c.ochre, flexShrink: 0 },
    summaryText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1, lineHeight: 17 },

    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center", alignItems: "center",
    },
    modalCard: {
      backgroundColor: c.paper, borderRadius: radius.xl, padding: 20,
      width: "85%", maxHeight: "70%",
    },
    modalTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginBottom: 12 },
    modalRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingVertical: 12, paddingHorizontal: 4,
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    modalRowActive: { backgroundColor: `${c.ochre}10` },
    modalRowText: { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
    modalRowTextActive: { fontFamily: fonts.sansBold, color: c.ochre },

    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828", marginTop: space[2] },
  });
}

export default function StartClusterScreen() {
  const nav = useNav();
  const route = useRoute<Route>();
  const params = route.params ?? {};
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);

  const [name, setName] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [street, setStreet] = useState("");
  // Pre-fill country from onboarding if provided
  const [country, setCountry] = useState(
    (params as { country?: string }).country ?? user?.countryOfResidence ?? ""
  );
  const [meetingDay, setMeetingDay] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onboardingParams = params as {
    country?: string;
    venueType?: string;
    hostNote?: string;
    realisticCapacity?: number;
    accessible?: boolean;
    addressVisible?: string;
    localityConfirmed?: boolean;
  };

  const hasOnboarding = Boolean(onboardingParams.venueType);

  const canSubmit =
    name.trim().length > 0 &&
    city.trim().length > 0 &&
    street.trim().length > 0 &&
    country.trim().length > 0 &&
    meetingDay.length > 0 &&
    meetingTime.trim().length > 0;

  const close = () => nav.goBack();

  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showCountryPicker, setShowCountryPicker] = useState(false);

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
        // Onboarding-collected fields
        venue_type:          onboardingParams.venueType ?? "",
        host_note:           onboardingParams.hostNote ?? "",
        realistic_capacity:  onboardingParams.realisticCapacity ?? 0,
        accessible:          onboardingParams.accessible ? 1 : 0,
        address_visible:     onboardingParams.addressVisible ?? "members_only",
        locality_confirmed:  onboardingParams.localityConfirmed ? 1 : 0,
      };

      const res = await api.post<{ id: number }>(`${MOBILE_API}/cluster/create`, body as Record<string, string>);
      if (res?.id) {
        const url = `https://web.themoveee.com/cluster/${res.id}/invite`;
        Alert.alert(
          "Fellowship created!",
          "Now share the invite link with neighbours and friends. You need at least 4 members to activate.",
          [
            {
              text: "Share invite link",
              onPress: async () => {
                try {
                  await Share.share({
                    message: `Join my House Fellowship "${name.trim()}" on Moveee! ${url}`,
                    url,
                  });
                } catch {}
                nav.replace("ClusterScreen", { id: res.id });
              },
            },
            {
              text: "Later",
              style: "cancel",
              onPress: () => nav.replace("ClusterScreen", { id: res.id }),
            },
          ],
        );
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

  const venueLabel = (v?: string) => {
    const map: Record<string, string> = {
      home: "Home", cafe: "Café", coworking: "Coworking space", other: "Other",
    };
    return v ? (map[v] ?? v) : "";
  };

  const addrLabel = (a?: string) => {
    const map: Record<string, string> = {
      members_only: "Members only", on_request: "On request", area_only: "Area only",
    };
    return a ? (map[a] ?? a) : "";
  };

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
            Name your Fellowship and set your meeting schedule. Members on
            your street can join and you'll unlock check-ins and rewards once
            four people have joined.
          </Text>

          {/* Onboarding summary — shown when arriving via HostOnboardingScreen */}
          {hasOnboarding && (
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <Text style={styles.summaryTitle}>Your setup</Text>
                <TouchableOpacity onPress={() => nav.goBack()}>
                  <Text style={styles.summaryEditBtn}>Edit ↑</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>
                  {venueLabel(onboardingParams.venueType)}
                  {" · "}
                  {onboardingParams.realisticCapacity} people
                  {onboardingParams.accessible ? " · step-free" : ""}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryDot} />
                <Text style={styles.summaryText}>
                  Address: {addrLabel(onboardingParams.addressVisible)}
                </Text>
              </View>
              {onboardingParams.hostNote ? (
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText} numberOfLines={1}>
                    {onboardingParams.hostNote}
                  </Text>
                </View>
              ) : null}
            </View>
          )}

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
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowCountryPicker(true)}>
            <Text style={[styles.pickerBtnText, !country && styles.pickerBtnPlaceholder]}>
              {country || "Select a country"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.mute} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Meeting day</Text>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDayPicker(true)}>
            <Text style={[styles.pickerBtnText, !selectedDay && styles.pickerBtnPlaceholder]}>
              {selectedDay ? selectedDay.label : "Select a day"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.mute} />
          </TouchableOpacity>

          <Text style={styles.sectionLabel}>Meeting time</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. 6:30pm"
            placeholderTextColor={c.ghost}
            value={meetingTime}
            onChangeText={setMeetingTime}
          />

          <Text style={styles.sectionLabel}>Arrival note (optional)</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="e.g. Meet at the blue gate, 3rd house"
            placeholderTextColor={c.ghost}
            value={locationNote}
            onChangeText={setLocationNote}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Day Picker Modal */}
      <Modal visible={showDayPicker} transparent animationType="fade" onRequestClose={() => setShowDayPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDayPicker(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Meeting day</Text>
            {DAYS.map((d) => (
              <TouchableOpacity
                key={d.value}
                style={[styles.modalRow, meetingDay === d.value && styles.modalRowActive]}
                onPress={() => { setMeetingDay(d.value); setShowDayPicker(false); }}
              >
                <Text style={[styles.modalRowText, meetingDay === d.value && styles.modalRowTextActive]}>
                  {d.label}
                </Text>
                {meetingDay === d.value && <Ionicons name="checkmark" size={18} color={c.ochre} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} transparent animationType="fade" onRequestClose={() => setShowCountryPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowCountryPicker(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Country</Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.modalRow, country === item && styles.modalRowActive]}
                  onPress={() => { setCountry(item); setShowCountryPicker(false); }}
                >
                  <Text style={[styles.modalRowText, country === item && styles.modalRowTextActive]}>
                    {item}
                  </Text>
                  {country === item && <Ionicons name="checkmark" size={18} color={c.ochre} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
