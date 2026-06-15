import React, { useState, useEffect, useMemo } from "react";
import { INTERESTS } from "@moveee/utils/interest-mappings";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Pressable,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
// try/catch: real module in EAS builds, no-op stub in Expo Go (native binary not bundled)
let Passkeys: { isSupported: () => boolean; create: (o: unknown) => Promise<unknown>; get: (o: unknown) => Promise<unknown> } = {
  isSupported: () => false, create: async () => null, get: async () => null,
};
try { Passkeys = require("react-native-passkeys"); } catch {}
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";

const PROXY = "https://themoveee.com/api";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useThemeStore, type ThemeMode } from "../../store/themeStore";
import type { Passkey } from "../../types";



type Tab = "profile" | "directory" | "interests" | "newsletters" | "security" | "appearance";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "profile",     label: "Profile" },
  { id: "directory",   label: "Directory" },
  { id: "interests",   label: "Interests" },
  { id: "newsletters", label: "Newsletters" },
  { id: "security",    label: "Security" },
  { id: "appearance",  label: "Appearance" },
];

// Derived from canonical INTERESTS in packages/utils — single source of truth
const INTEREST_OPTIONS = INTERESTS.map((i) => ({ slug: i.slug, label: i.label, emoji: i.emoji }));

const DISCIPLINE_OPTIONS = [
  "Creative", "Entrepreneur", "Artist", "Filmmaker", "Writer",
  "Designer", "Musician", "Photographer", "Tech", "Legal", "Finance", "Academic",
];

const NEWSLETTERS = [
  {
    id: "getmelit",
    name: "GetMeLit",
    desc: "Weekly cultural digest — African arts, diaspora news, and cultural moments.",
    cadence: "✉️ Weekly · Every Monday",
  },
  {
    id: "culture-drop",
    name: "Culture Drop",
    desc: "Monthly curated drops from across the cultural landscape.",
    cadence: "✉️ Monthly · First Monday",
  },
];

// ── Custom Toggle ─────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const c = useColors();
  const styles = useMemo(() => createToggleStyles(c), [c]);
  return (
    <TouchableOpacity
      onPress={() => onChange(!value)}
      style={[styles.track, value && styles.trackOn]}
      activeOpacity={0.8}
    >
      <View style={[styles.knob, value && styles.knobOn]} />
    </TouchableOpacity>
  );
}
function createToggleStyles(c: ColorPalette) {
  return StyleSheet.create({
    track: {
      width: 44, height: 24, borderRadius: 12,
      backgroundColor: c.ghost, justifyContent: "center", padding: 2,
    },
    trackOn: { backgroundColor: c.ochre },
    knob: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: c.paper,
      shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 2, elevation: 1,
    },
    knobOn: { alignSelf: "flex-end" },
  });
}

// ── Sticky Save Button ────────────────────────────────────────────────────────
function StickyButton({ label, onPress, loading }: { label: string; onPress: () => void; loading: boolean }) {
  const c = useColors();
  const styles = useMemo(() => createStickyStyles(c), [c]);
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.btn} onPress={onPress} disabled={loading} activeOpacity={0.85}>
        {loading
          ? <ActivityIndicator color={c.paper} />
          : <Text style={styles.btnText}>{label}</Text>
        }
      </TouchableOpacity>
    </View>
  );
}
function createStickyStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: c.paper, paddingHorizontal: 16,
      paddingBottom: 34, paddingTop: 16,
      borderTopWidth: 1, borderTopColor: c.rule + "30",
    },
    btn: {
      height: 52, borderRadius: radius.full, backgroundColor: c.ochre,
      alignItems: "center", justifyContent: "center",
    },
    btnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
  });
}

// ── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, refreshProfile } = useAuthStore();
  const c = useColors();
  const profileStyles = useMemo(() => createProfileStyles(c), [c]);
  const pf = useMemo(() => createPfStyles(c), [c]);
  const [form, setForm] = useState({
    displayName:        user?.displayName ?? "",
    phone:              user?.phone ?? "",
    whatsapp:           user?.whatsapp ?? "",
    gender:             user?.gender ?? "",
    dateOfBirth:        user?.dateOfBirth ?? "",
    nationality:        user?.nationality ?? "",
    countryOfResidence: user?.countryOfResidence ?? "",
    city:               user?.city ?? "",
    occupation:         user?.occupation ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);

  // Parse stored "YYYY-MM-DD" string to a Date for the picker
  const dobDate = form.dateOfBirth
    ? new Date(form.dateOfBirth + "T12:00:00")
    : new Date(new Date().getFullYear() - 25, 0, 1);

  function onDobChange(_: unknown, selected?: Date) {
    if (Platform.OS === "android") setShowDobPicker(false);
    if (selected) {
      const y = selected.getFullYear();
      const m = String(selected.getMonth() + 1).padStart(2, "0");
      const d = String(selected.getDate()).padStart(2, "0");
      setForm((f) => ({ ...f, dateOfBirth: `${y}-${m}-${d}` }));
    }
  }

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`${MOBILE_API}/me`, {
        display_name:         form.displayName,
        phone:                form.phone,
        whatsapp:             form.whatsapp,
        gender:               form.gender,
        date_of_birth:        form.dateOfBirth,
        nationality:          form.nationality,
        country_of_residence: form.countryOfResidence,
        city:                 form.city,
        occupation:           form.occupation,
      });
      await refreshProfile();
      Alert.alert("Saved", "Profile updated.");
    } catch {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]) return;
    try {
      await api.upload(`${PROXY}/mobile/me/avatar`, result.assets[0].uri, "avatar");
      await refreshProfile();
    } catch {
      Alert.alert("Error", "Could not upload photo.");
    }
  };

  const GENDER_OPTIONS = ["Woman", "Man", "Non-binary", "Prefer not to say"];

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Avatar */}
        <View style={profileStyles.avatarSection}>
          <View style={profileStyles.avatarRing}>
            <View style={profileStyles.avatarCircle}>
              <Text style={profileStyles.avatarInitials}>
                {(user?.displayName ?? user?.name ?? "?")[0]?.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity style={profileStyles.cameraBtn} onPress={handleAvatarPick}>
              <Ionicons name="camera-outline" size={14} color={c.ink} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleAvatarPick}>
            <Text style={profileStyles.editPhotoText}>Edit photo</Text>
          </TouchableOpacity>
        </View>

        {/* Display name */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Display Name</Text>
          <TextInput
            style={pf.input}
            value={form.displayName}
            onChangeText={(v) => setForm((f) => ({ ...f, displayName: v }))}
            placeholderTextColor={c.ghost}
          />
        </View>

        {/* Email (locked) */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Email</Text>
          <View style={{ position: "relative" }}>
            <TextInput
              style={[pf.input, pf.inputLocked]}
              value={user?.email ?? ""}
              editable={false}
            />
            <Ionicons
              name="lock-closed-outline" size={16} color={c.ghost}
              style={{ position: "absolute", right: 12, top: 18 }}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Phone</Text>
          <View style={pf.prefixRow}>
            <View style={pf.prefixBox}>
              <Text style={pf.prefixText}>🇬🇧 +44</Text>
            </View>
            <TextInput
              style={pf.prefixInput}
              value={form.phone}
              onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
              keyboardType="phone-pad"
              placeholder="7700 900000"
              placeholderTextColor={c.ghost}
            />
          </View>
        </View>

        {/* WhatsApp */}
        <View style={pf.wrap}>
          <Text style={pf.label}>WhatsApp</Text>
          <View style={pf.prefixRow}>
            <View style={pf.prefixBox}>
              <Text style={pf.prefixText}>🇬🇧 +44</Text>
            </View>
            <TextInput
              style={pf.prefixInput}
              value={form.whatsapp}
              onChangeText={(v) => setForm((f) => ({ ...f, whatsapp: v }))}
              keyboardType="phone-pad"
              placeholder="7700 900000"
              placeholderTextColor={c.ghost}
            />
          </View>
        </View>

        {/* Gender */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Gender</Text>
          <View style={profileStyles.genderGrid}>
            {GENDER_OPTIONS.map((g) => {
              const active = form.gender === g;
              return (
                <TouchableOpacity
                  key={g}
                  style={[profileStyles.genderBtn, active && profileStyles.genderBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, gender: g }))}
                  activeOpacity={0.75}
                >
                  <Text style={[profileStyles.genderText, active && profileStyles.genderTextActive]}>{g}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* DOB */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Date of Birth</Text>
          <TouchableOpacity style={pf.selectRow} activeOpacity={0.7} onPress={() => setShowDobPicker(true)}>
            <Text style={form.dateOfBirth ? pf.selectText : pf.selectPlaceholder}>
              {form.dateOfBirth || "Select date"}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={c.ghost} />
          </TouchableOpacity>

          {/* Android: inline picker */}
          {showDobPicker && Platform.OS === "android" && (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={onDobChange}
            />
          )}

          {/* iOS: modal picker */}
          {Platform.OS === "ios" && (
            <Modal visible={showDobPicker} transparent animationType="slide">
              <Pressable style={pf.modalOverlay} onPress={() => setShowDobPicker(false)}>
                <Pressable style={pf.modalSheet} onPress={(e) => e.stopPropagation()}>
                  <View style={pf.modalHeader}>
                    <Text style={pf.modalCancel} onPress={() => setShowDobPicker(false)}>Cancel</Text>
                    <Text style={pf.modalDone} onPress={() => setShowDobPicker(false)}>Done</Text>
                  </View>
                  <DateTimePicker
                    value={dobDate}
                    mode="date"
                    display="spinner"
                    maximumDate={new Date()}
                    onChange={onDobChange}
                    style={{ width: "100%" }}
                  />
                </Pressable>
              </Pressable>
            </Modal>
          )}
        </View>

        {/* Nationality */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Nationality</Text>
          <TouchableOpacity style={pf.selectRow} activeOpacity={0.7}>
            <Text style={form.nationality ? pf.selectText : pf.selectPlaceholder}>
              {form.nationality || "Select country"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.ghost} />
          </TouchableOpacity>
        </View>

        {/* Country of Residence */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Country of Residence</Text>
          <TouchableOpacity style={pf.selectRow} activeOpacity={0.7}>
            <Text style={form.countryOfResidence ? pf.selectText : pf.selectPlaceholder}>
              {form.countryOfResidence || "Select country"}
            </Text>
            <Ionicons name="chevron-down" size={16} color={c.ghost} />
          </TouchableOpacity>
        </View>

        {/* City */}
        <View style={pf.wrap}>
          <Text style={pf.label}>City</Text>
          <TextInput
            style={pf.input}
            value={form.city}
            onChangeText={(v) => setForm((f) => ({ ...f, city: v }))}
            placeholder="e.g. London"
            placeholderTextColor={c.ghost}
          />
        </View>

        {/* Occupation */}
        <View style={pf.wrap}>
          <Text style={pf.label}>Occupation</Text>
          <TextInput
            style={pf.input}
            value={form.occupation}
            onChangeText={(v) => setForm((f) => ({ ...f, occupation: v }))}
            placeholder="What do you do?"
            placeholderTextColor={c.ghost}
          />
        </View>
      </ScrollView>
      <StickyButton label="Save Changes" onPress={save} loading={saving} />
    </View>
  );
}

function createProfileStyles(c: ColorPalette) {
  return StyleSheet.create({
    avatarSection: { alignItems: "center", marginBottom: 24, marginTop: 8 },
    avatarRing: {
      width: 102, height: 102, borderRadius: 51,
      borderWidth: 3, borderColor: c.gold,
      padding: 2, marginBottom: 8, position: "relative",
      justifyContent: "center", alignItems: "center",
    },
    avatarCircle: {
      width: 90, height: 90, borderRadius: 45,
      backgroundColor: c.goldLight,
      justifyContent: "center", alignItems: "center",
    },
    avatarInitials:    { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: c.gold },
    cameraBtn: {
      position: "absolute", bottom: 0, right: 0,
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost + "4D",
      justifyContent: "center", alignItems: "center",
      shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
    },
    editPhotoText: { fontFamily: fonts.sans, fontSize: 12, color: c.ochre },
    genderGrid:    { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    genderBtn: {
      flex: 1, minWidth: "45%", height: 44, borderRadius: 6,
      justifyContent: "center", alignItems: "center",
      backgroundColor: c.paper,
      borderWidth: 1, borderColor: c.ghost,
    },
    genderBtnActive:  { backgroundColor: c.ink, borderColor: c.ink },
    genderText:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    genderTextActive: { color: c.paper },
  });
}

function createPfStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap:  { marginBottom: 14 },
    label: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginBottom: 6 },
    input: {
      height: 52, borderWidth: 1, borderColor: c.ghost,
      borderRadius: 6, paddingHorizontal: 16,
      fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink,
      backgroundColor: c.paper,
    },
    inputLocked: { backgroundColor: c.paperDeep, color: c.ghost, paddingRight: 40 },
    prefixRow: {
      flexDirection: "row", height: 52,
      borderWidth: 1, borderColor: c.ghost,
      borderRadius: 6, overflow: "hidden",
      backgroundColor: c.paper,
    },
    prefixBox: {
      backgroundColor: c.paperDeep, paddingHorizontal: 12,
      justifyContent: "center", alignItems: "center",
      borderRightWidth: 1, borderRightColor: c.ghost,
    },
    prefixText:        { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    prefixInput: {
      flex: 1, paddingHorizontal: 12,
      fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink,
    },
    selectRow: {
      height: 52, borderWidth: 1, borderColor: c.ghost, borderRadius: 6,
      paddingHorizontal: 16, flexDirection: "row", alignItems: "center",
      backgroundColor: c.paper, justifyContent: "space-between",
    },
    selectText:        { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink },
    selectPlaceholder: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ghost },
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end",
    },
    modalSheet: {
      backgroundColor: c.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16,
      paddingBottom: 24,
    },
    modalHeader: {
      flexDirection: "row", justifyContent: "space-between",
      paddingHorizontal: space[5], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    modalCancel: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },
    modalDone:   { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ochre },
  });
}

// ── Directory Tab ─────────────────────────────────────────────────────────────
function DirectoryTab() {
  const { user, refreshProfile } = useAuthStore();
  const c = useColors();
  const dirStyles = useMemo(() => createDirStyles(c), [c]);
  const pf = useMemo(() => createPfStyles(c), [c]);
  const [optIn, setOptIn]             = useState(user?.directoryOptIn ?? false);
  const [bio, setBio]                 = useState(user?.directoryBio ?? "");
  const [disciplines, setDisciplines] = useState<string[]>(user?.directoryDisciplines ?? []);
  const [instagram, setInstagram]     = useState(user?.directoryInstagram ?? "");
  const [linkedin, setLinkedin]       = useState(user?.directoryLinkedIn ?? "");
  const [website, setWebsite]         = useState(user?.directoryWebsite ?? "");
  const [saving, setSaving]           = useState(false);

  const toggleDiscipline = (d: string) => {
    setDisciplines((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      if (prev.length >= 5) return prev; // max 5
      return [...prev, d];
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`${MOBILE_API}/me`, {
        directory_opt_in:      optIn,
        directory_bio:         bio,
        directory_disciplines: disciplines,
        directory_instagram:   instagram,
        directory_linkedin:    linkedin,
        directory_website:     website,
      });
      await refreshProfile();
      Alert.alert("Saved", "Directory profile updated.");
    } catch {
      Alert.alert("Error", "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        {/* Directory opt-in toggle */}
        <View style={dirStyles.toggleRow}>
          <View style={{ flex: 1 }}>
            <Text style={dirStyles.toggleLabel}>Show in member directory</Text>
            <Text style={dirStyles.toggleSub}>Let other members find and connect with you.</Text>
          </View>
          <ToggleSwitch value={optIn} onChange={setOptIn} />
        </View>

        {/* Bio */}
        <View style={{ marginBottom: 14 }}>
          <Text style={pf.label}>Bio</Text>
          <TextInput
            style={dirStyles.bioInput}
            value={bio}
            onChangeText={(v) => setBio(v.slice(0, 280))}
            multiline
            placeholder="A short bio visible in the directory…"
            placeholderTextColor={c.ghost}
            textAlignVertical="top"
          />
          <Text style={dirStyles.charCount}>{bio.length} / 280</Text>
        </View>

        {/* Disciplines */}
        <View style={{ marginBottom: 20 }}>
          <Text style={pf.label}>Select up to 5 disciplines</Text>
          <View style={dirStyles.pillsWrap}>
            {DISCIPLINE_OPTIONS.map((d) => {
              const active = disciplines.includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  style={[dirStyles.pill, active && dirStyles.pillActive]}
                  onPress={() => toggleDiscipline(d)}
                  activeOpacity={0.75}
                >
                  <Text style={[dirStyles.pillText, active && dirStyles.pillTextActive]}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Social Links */}
        <Text style={dirStyles.socialHeader}>Social Links</Text>

        {/* Instagram */}
        <View style={{ marginBottom: 12 }}>
          <View style={dirStyles.socialRow}>
            <View style={dirStyles.socialPrefix}>
              <Text style={dirStyles.socialPrefixText}>@</Text>
            </View>
            <TextInput
              style={dirStyles.socialInput}
              value={instagram}
              onChangeText={setInstagram}
              placeholder="yourhandle"
              placeholderTextColor={c.ghost}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* LinkedIn */}
        <View style={{ marginBottom: 12 }}>
          <View style={dirStyles.socialRow}>
            <View style={dirStyles.socialPrefix}>
              <Text style={dirStyles.socialPrefixText}>linkedin.com/</Text>
            </View>
            <TextInput
              style={dirStyles.socialInput}
              value={linkedin}
              onChangeText={setLinkedin}
              placeholder="in/yourhandle"
              placeholderTextColor={c.ghost}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Website */}
        <View style={{ marginBottom: 12 }}>
          <View style={dirStyles.socialRow}>
            <View style={dirStyles.socialPrefix}>
              <Text style={dirStyles.socialPrefixText}>🌐</Text>
            </View>
            <TextInput
              style={dirStyles.socialInput}
              value={website}
              onChangeText={setWebsite}
              placeholder="https://yoursite.com"
              placeholderTextColor={c.ghost}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>
      </ScrollView>
      <StickyButton label="Save Changes" onPress={save} loading={saving} />
    </View>
  );
}

function createDirStyles(c: ColorPalette) {
  return StyleSheet.create({
    toggleRow: {
      flexDirection: "row", alignItems: "center",
      height: 80, borderBottomWidth: 1, borderBottomColor: c.ghost,
      marginBottom: 20,
    },
    toggleLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    toggleSub:   { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },

    bioInput: {
      borderWidth: 1, borderColor: c.ghost, borderRadius: 6,
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14,
      minHeight: 140, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink,
      backgroundColor: c.paper,
    },
    charCount: {
      fontFamily: fonts.mono, fontSize: 11, color: c.mute,
      textAlign: "right", marginTop: 4,
    },

    pillsWrap:      { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      height: 32, paddingHorizontal: 14, borderRadius: radius.full,
      justifyContent: "center", alignItems: "center",
      borderWidth: 1, borderColor: c.ghost,
    },
    pillActive:     { backgroundColor: c.ink, borderColor: c.ink },
    pillText:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    pillTextActive: { color: c.paper },

    socialHeader: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, marginBottom: 12 },
    socialRow: {
      flexDirection: "row", height: 52,
      borderWidth: 1, borderColor: c.ghost, borderRadius: 6,
      overflow: "hidden", backgroundColor: c.paper,
    },
    socialPrefix: {
      backgroundColor: c.paperDeep, paddingHorizontal: 12,
      justifyContent: "center", alignItems: "center",
      borderRightWidth: 1, borderRightColor: c.ghost,
    },
    socialPrefixText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    socialInput: {
      flex: 1, paddingHorizontal: 12,
      fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink,
    },
  });
}

// ── Interests Tab ─────────────────────────────────────────────────────────────
function InterestsTab() {
  const { user, refreshProfile } = useAuthStore();
  const c = useColors();
  const intStyles = useMemo(() => createIntStyles(c), [c]);
  const [selected, setSelected] = useState<string[]>(user?.interests ?? []);
  const [saving, setSaving] = useState(false);

  const toggle = (i: string) => {
    setSelected((prev) => prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]);
  };

  const save = async () => {
    if (selected.length < 3) {
      Alert.alert("Too few", "Please select at least 3 interests.");
      return;
    }
    setSaving(true);
    try {
      await api.post(`${MOBILE_API}/me`, { interests: selected });
      await refreshProfile();
      Alert.alert("Saved", "Interests updated.");
    } catch {
      Alert.alert("Error", "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const rows: (typeof INTEREST_OPTIONS[number])[][] = [];
  for (let i = 0; i < INTEREST_OPTIONS.length; i += 2) {
    rows.push(INTEREST_OPTIONS.slice(i, i + 2));
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
        <Text style={intStyles.heading}>What are you into?</Text>
        <Text style={intStyles.sub}>Select at least 3 to personalise your Connect feed.</Text>

        {rows.map((row, ri) => (
          <View key={ri} style={intStyles.row}>
            {row.map((item) => {
              const active = selected.includes(item.slug);
              return (
                <TouchableOpacity
                  key={item.slug}
                  style={[intStyles.card, active && intStyles.cardActive, shadows.card]}
                  onPress={() => toggle(item.slug)}
                  activeOpacity={0.8}
                >
                  <Text style={intStyles.cardEmoji}>{item.emoji}</Text>
                  <Text style={intStyles.cardLabel} numberOfLines={2}>{item.label}</Text>
                  {active ? (
                    <Ionicons name="checkmark" size={20} color={c.ochre} />
                  ) : (
                    <View style={intStyles.emptyCircle} />
                  )}
                </TouchableOpacity>
              );
            })}
            {row.length === 1 && <View style={intStyles.cardPlaceholder} />}
          </View>
        ))}
      </ScrollView>
      <StickyButton label="Save Interests" onPress={save} loading={saving} />
    </View>
  );
}

function createIntStyles(c: ColorPalette) {
  return StyleSheet.create({
    heading:         { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink, marginBottom: 6 },
    sub:             { fontFamily: fonts.sans, fontSize: 14, color: c.mute, marginBottom: 20 },
    row:             { flexDirection: "row", gap: 10, marginBottom: 10 },
    card: {
      flex: 1, height: 72, borderRadius: 12,
      backgroundColor: c.paper, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, gap: 10,
    },
    cardActive: {
      backgroundColor: c.paperDeep,
      borderLeftWidth: 3, borderLeftColor: c.ochre,
    },
    cardEmoji:       { fontSize: 22 },
    cardLabel:       { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, flex: 1 },
    emptyCircle: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 1, borderColor: c.ghost,
    },
    cardPlaceholder: { flex: 1 },
  });
}

function deriveSegment(countryOfResidence?: string): string {
  const c = (countryOfResidence ?? "").toLowerCase().trim();
  if (/nigeria/.test(c)) return "ng";
  if (/ghana/.test(c)) return "gh";
  if (/kenya/.test(c)) return "ke";
  if (/south africa/.test(c)) return "za";
  if (/united kingdom|uk\b|gb\b/.test(c)) return "uk";
  if (/united states|usa/.test(c)) return "us";
  if (/canada/.test(c)) return "ca";
  if (/australia/.test(c)) return "au";
  return "";
}

// ── Newsletters Tab ───────────────────────────────────────────────────────────
function NewslettersTab() {
  const { user } = useAuthStore();
  const c = useColors();
  const nlStyles = useMemo(() => createNlStyles(c), [c]);
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({
    getmelit:       false,
    "culture-drop": false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ lists: string[] }>(`${MOBILE_API}/newsletter-preferences`)
      .then((data) => {
        const map: Record<string, boolean> = {};
        (data.lists || []).forEach((l) => { map[l] = true; });
        setSubscribed((prev) => ({ ...prev, ...map }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (id: string, val: boolean) => {
    const next = { ...subscribed, [id]: val };
    setSubscribed(next);
    const lists = Object.entries(next).filter(([, v]) => v).map(([k]) => k);
    const segment = deriveSegment(user?.countryOfResidence);
    await api.post(`${MOBILE_API}/newsletter-preferences`, { lists, ...(segment ? { segment } : {}) }).catch(() => {});
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={c.ochre} />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={nlStyles.heading}>Your Newsletters</Text>
      <Text style={nlStyles.sub}>Manage which newsletters you receive.</Text>

      {NEWSLETTERS.map((nl) => {
        const isOn = subscribed[nl.id] ?? false;
        return (
          <View key={nl.id} style={[nlStyles.card, shadows.card]}>
            {isOn && (
              <View style={nlStyles.badgeWrap}>
                <Text style={nlStyles.badge}>SUBSCRIBED</Text>
              </View>
            )}
            <Text style={[nlStyles.nlName, isOn && { paddingRight: 80 }]}>{nl.name}</Text>
            <Text style={nlStyles.nlDesc}>{nl.desc}</Text>
            <View style={nlStyles.cardFooter}>
              <Text style={nlStyles.cadence}>{nl.cadence}</Text>
              <ToggleSwitch value={isOn} onChange={(v) => toggle(nl.id, v)} />
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function createNlStyles(c: ColorPalette) {
  return StyleSheet.create({
    heading: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink, marginBottom: 6 },
    sub:     { fontFamily: fonts.sans, fontSize: 14, color: c.mute, marginBottom: 20 },
    card: {
      backgroundColor: c.paper, borderRadius: 12, padding: 16,
      marginBottom: 12, position: "relative",
    },
    badgeWrap: { position: "absolute", top: 14, right: 14 },
    badge: {
      fontFamily: fonts.sansBold, fontSize: 9, color: c.success,
      backgroundColor: c.success + "1A", borderRadius: radius.full,
      paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden",
      letterSpacing: 0.5,
    },
    nlName:     { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, marginBottom: 4 },
    nlDesc:     { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, marginBottom: 12 },
    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    cadence:    { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
  });
}

// ── Appearance Tab ────────────────────────────────────────────────────────────
const THEME_OPTIONS: { id: ThemeMode; label: string; desc: string }[] = [
  { id: "light",  label: "Light",          desc: "Always use the light theme." },
  { id: "dark",   label: "Dark",           desc: "Always use the dark theme." },
  { id: "system", label: "System default", desc: "Match your device's appearance settings automatically." },
];

function AppearanceTab() {
  const { mode, setMode } = useThemeStore();
  const c = useColors();
  const apStyles = useMemo(() => createApStyles(c), [c]);

  return (
    <ScrollView contentContainerStyle={apStyles.content}>
      <Text style={apStyles.sectionHeader}>Appearance</Text>

      <View style={apStyles.optionsBlock}>
        {THEME_OPTIONS.map((opt, i) => {
          const isActive = mode === opt.id;
          const isLast = i === THEME_OPTIONS.length - 1;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[apStyles.optionRow, !isLast && apStyles.optionRowBorder]}
              onPress={() => setMode(opt.id)}
              activeOpacity={0.7}
            >
              <View style={[apStyles.radio, isActive && apStyles.radioActive]}>
                {isActive && <View style={apStyles.radioDot} />}
              </View>
              <View style={apStyles.optionText}>
                <Text style={[apStyles.optionLabel, isActive && apStyles.optionLabelActive]}>
                  {opt.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={apStyles.hint}>
        System default will match your device's appearance settings automatically.
      </Text>
    </ScrollView>
  );
}

function createApStyles(c: ColorPalette) {
  return StyleSheet.create({
    content: { paddingTop: 24, paddingBottom: 40 },
    sectionHeader: {
      fontFamily: fonts.sansBold, fontSize: 14, color: c.ink,
      paddingHorizontal: 16, marginBottom: 8,
    },
    optionsBlock: {
      backgroundColor: c.paper,
      borderTopWidth: 1, borderBottomWidth: 1,
      borderColor: c.ghost,
    },
    optionRow: {
      height: 52, paddingHorizontal: 16,
      flexDirection: "row", alignItems: "center", gap: 12,
    },
    optionRowBorder: { borderBottomWidth: 1, borderBottomColor: c.ghost },
    radio: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 1, borderColor: c.ghost,
      alignItems: "center", justifyContent: "center",
    },
    radioActive: { borderColor: c.ochre },
    radioDot: {
      width: 10, height: 10, borderRadius: 5,
      backgroundColor: c.ochre,
    },
    optionText: { flex: 1 },
    optionLabel: { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
    optionLabelActive: { fontFamily: fonts.sansBold },
    hint: {
      paddingHorizontal: 16, paddingTop: 12,
      fontFamily: fonts.sans, fontSize: 13,
      color: c.mute, lineHeight: 18,
    },
  });
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { user, updateUser } = useAuthStore();
  const c = useColors();
  const secStyles = useMemo(() => createSecStyles(c), [c]);
  const [passkeys,   setPasskeys]   = useState<Passkey[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [adding,     setAdding]     = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [supported,  setSupported]  = useState(true);
  const [trashHover, setTrashHover] = useState<string | null>(null);

  useEffect(() => {
    setSupported(Passkeys.isSupported());
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setLoading(true);
    try {
      const data = await api.get<Passkey[]>(`${MOBILE_API}/passkey/list`);
      setPasskeys(Array.isArray(data) ? data : []);
    } catch {
      setPasskeys([]);
    } finally {
      setLoading(false);
    }
  };

  const addPasskey = async () => {
    if (!supported) {
      Alert.alert(
        "Not supported",
        "Passkeys require iOS 16+ or Android 9+. Please update your device."
      );
      return;
    }
    setAdding(true);
    try {
      const optData = await api.post<any>(`${PROXY}/auth/passkey/register-options`, {}, true);
      const credential = await Passkeys.create(optData);
      if (!credential) return; // user cancelled

      await api.post(`${MOBILE_API}/passkey/register-verify`, {
        id:                credential.id,
        rawId:             credential.rawId,
        type:              credential.type,
        clientDataJSON:    credential.response.clientDataJSON,
        attestationObject: credential.response.attestationObject,
        transports:        (credential.response as any).transports ?? [],
        device_name:       Platform.OS === "ios" ? "iPhone" : "Android",
      });

      updateUser({ hasPasskey: true, passkeyCount: (user?.passkeyCount ?? 0) + 1 });
      await loadPasskeys();
      Alert.alert("Passkey added", "Your passkey has been registered successfully.");
    } catch (e: any) {
      if (e?.message?.includes("cancel") || e?.code === "USER_CANCELLED") return;
      Alert.alert("Error", "Could not register passkey. Please try again.");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = (credential_id: string) => {
    if (passkeys.length === 1) {
      Alert.alert(
        "Last passkey",
        "Deleting your only passkey will lock you out of perks and cashouts. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => doDelete(credential_id) },
        ]
      );
    } else {
      Alert.alert("Delete passkey", "Remove this passkey from your account?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => doDelete(credential_id) },
      ]);
    }
  };

  const doDelete = async (credential_id: string) => {
    try {
      await api.delete(`${MOBILE_API}/passkey/delete`, { credential_id });
      const remaining = passkeys.filter((p) => p.credential_id !== credential_id);
      setPasskeys(remaining);
      if (remaining.length === 0) updateUser({ hasPasskey: false, passkeyCount: 0 });
      else updateUser({ passkeyCount: remaining.length });
    } catch {
      Alert.alert("Error", "Could not delete passkey.");
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Text style={secStyles.heading}>Security</Text>

      {/* Change Password card */}
      <View style={[secStyles.card, shadows.card, { marginBottom: 16 }]}>
        <TouchableOpacity
          style={secStyles.passwordRow}
          activeOpacity={0.7}
          disabled={changingPw}
          onPress={async () => {
            setChangingPw(true);
            try {
              await api.post(`${MOBILE_API}/user/reset-password`, {});
              Alert.alert("Email sent", "Check your inbox for a password reset link.");
            } catch {
              Alert.alert("Error", "Could not send reset email.");
            } finally {
              setChangingPw(false);
            }
          }}
        >
          <Ionicons name="lock-closed-outline" size={20} color={c.ochre} />
          <Text style={secStyles.passwordLabel}>Change Password</Text>
          {changingPw
            ? <ActivityIndicator size="small" color={c.ghost} />
            : <Ionicons name="chevron-forward" size={18} color={c.ghost} />}
        </TouchableOpacity>
        <Text style={secStyles.passwordSub}>We'll send a reset link to your email</Text>
      </View>

      {/* Passkeys card */}
      <View style={[secStyles.card, shadows.card]}>
        <View style={secStyles.passkeyHeader}>
          <Text style={secStyles.passkeyTitle}>Passkeys</Text>
          <Text style={secStyles.passkeySub}>Log in faster with biometrics</Text>
        </View>

        {!supported && (
          <View style={secStyles.unsupportedBanner}>
            <Ionicons name="warning-outline" size={16} color={c.ochre} />
            <Text style={secStyles.unsupportedText}>
              Passkeys require iOS 16+ or Android 9+.
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={c.ochre} style={{ marginVertical: 16 }} />
        ) : passkeys.length === 0 ? (
          <View style={secStyles.emptyPasskeys}>
            <Ionicons name="finger-print-outline" size={32} color={c.ghost} />
            <Text style={secStyles.emptyPasskeysText}>No passkeys set up yet.</Text>
          </View>
        ) : (
          <View style={secStyles.passkeyList}>
            {passkeys.map((pk, i) => (
              <View
                key={pk.credential_id}
                style={[secStyles.passkeyRow, i > 0 && secStyles.passkeyRowBorder]}
              >
                <Ionicons name="finger-print-outline" size={24} color={c.ochre} />
                <View style={{ flex: 1 }}>
                  <Text style={secStyles.pkDevice}>{pk.device_name || "Unknown device"}</Text>
                  <Text style={secStyles.pkDate}>
                    {new Date(pk.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(pk.credential_id)}
                  onPressIn={() => setTrashHover(pk.credential_id)}
                  onPressOut={() => setTrashHover(null)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="trash-outline" size={20}
                    color={trashHover === pk.credential_id ? c.error : c.ghost}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Add passkey button */}
        <TouchableOpacity
          style={[secStyles.addPasskeyBtn, (adding || !supported) && { opacity: 0.6 }]}
          disabled={adding || !supported}
          onPress={addPasskey}
          activeOpacity={0.75}
        >
          {adding ? (
            <ActivityIndicator color={c.ink} size="small" />
          ) : (
            <>
              <Ionicons name="finger-print-outline" size={18} color={c.ink} />
              <Text style={secStyles.addPasskeyText}>Add a new passkey</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createSecStyles(c: ColorPalette) {
  return StyleSheet.create({
    heading:  { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink, marginBottom: 20 },
    card:     { backgroundColor: c.paper, borderRadius: 12, overflow: "hidden", marginBottom: 4 },

    passwordRow: {
      height: 52, flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16,
    },
    passwordLabel: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink, flex: 1 },
    passwordSub:   {
      fontFamily: fonts.sans, fontSize: 12, color: c.mute,
      marginLeft: 44, paddingBottom: 14,
    },

    passkeyHeader:  { padding: 16, paddingBottom: 8 },
    passkeyTitle:   { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    passkeySub:     { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },

    unsupportedBanner: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: "#fef3ee", borderWidth: 1, borderColor: c.ochre + "40",
      borderRadius: 6, margin: 16, padding: 12,
    },
    unsupportedText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre, flex: 1 },

    emptyPasskeys:     { alignItems: "center", gap: 8, paddingVertical: 24 },
    emptyPasskeysText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },

    passkeyList:      { borderTopWidth: 1, borderTopColor: c.ghost + "4D" },
    passkeyRow: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 14,
    },
    passkeyRowBorder: { borderTopWidth: 1, borderTopColor: c.ghost + "4D" },
    pkDevice: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    pkDate:   { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },

    addPasskeyBtn: {
      margin: 16, height: 44, borderWidth: 1, borderColor: c.ink, borderRadius: 8,
      flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    },
    addPasskeyText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink },
  });
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MemberSettingsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const c = useColors();
  const mainStyles = useMemo(() => createMainStyles(c), [c]);
  const initialTab: Tab = route.params?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <SafeAreaView style={mainStyles.container}>
      {/* Header */}
      <View style={mainStyles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={mainStyles.headerTitle}>Settings</Text>
      </View>

      {/* Tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={mainStyles.tabStrip}
        contentContainerStyle={mainStyles.tabStripContent}
      >
        {TAB_LABELS.map(({ id, label }) => {
          const active = activeTab === id;
          return (
            <TouchableOpacity
              key={id}
              style={[mainStyles.tab, active && mainStyles.tabActive]}
              onPress={() => setActiveTab(id)}
            >
              <Text style={[mainStyles.tabText, active && mainStyles.tabTextActive]}>{label}</Text>
              {active && <View style={mainStyles.tabUnderline} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {activeTab === "profile"     && <ProfileTab />}
      {activeTab === "directory"   && <DirectoryTab />}
      {activeTab === "interests"   && <InterestsTab />}
      {activeTab === "newsletters" && <NewslettersTab />}
      {activeTab === "security"    && <SecurityTab />}
      {activeTab === "appearance"  && <AppearanceTab />}
    </SafeAreaView>
  );
}

function createMainStyles(c: ColorPalette) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.paper },

    header: {
      flexDirection: "row", alignItems: "center", gap: 12,
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink },

    tabStrip:        { flexGrow: 0, height: 44, borderBottomWidth: 1, borderBottomColor: c.rule },
    tabStripContent: { paddingHorizontal: 0, flexDirection: "row" },
    tab: {
      paddingHorizontal: 16, height: 44,
      justifyContent: "center", alignItems: "center",
      position: "relative",
    },
    tabActive:    {},
    tabText:      { fontFamily: fonts.sans, fontSize: 14, color: c.mute },
    tabTextActive: { fontFamily: fonts.sansBold, color: c.ink },
    tabUnderline: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      height: 2, backgroundColor: c.ochre,
    },
  });
}
