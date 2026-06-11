import React, { useState, useEffect } from "react";
import { INTERESTS } from "@moveee/utils/interest-mappings";
import {
  View, Text, TextInput, Switch, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Passkeys from "react-native-passkeys";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { Passkey } from "../../types";

const PROXY = "https://themoveee.com/api";

type Tab = "profile" | "directory" | "interests" | "newsletters" | "security";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "profile",     label: "Profile" },
  { id: "directory",   label: "Directory" },
  { id: "interests",   label: "Interests" },
  { id: "newsletters", label: "Newsletters" },
  { id: "security",    label: "Security" },
];

// Derived from canonical INTERESTS in packages/utils — single source of truth
const INTEREST_OPTIONS = INTERESTS.map((i) => ({ slug: i.slug, label: i.label, emoji: i.emoji }));

const DISCIPLINE_OPTIONS = [
  "Creative", "Entrepreneur", "Artist", "Filmmaker", "Writer",
  "Designer", "Musician", "Photographer", "Tech", "Legal", "Finance", "Academic",
];

const NEWSLETTERS = [
  { id: "getmelit",     name: "GetMeLit",     desc: "Culture news and dispatches." },
  { id: "culture-drop", name: "Culture Drop", desc: "The flagship culture newsletter." },
];

// ── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTab() {
  const { user, refreshProfile } = useAuthStore();
  const [form, setForm] = useState({
    displayName:       user?.displayName ?? "",
    phone:             user?.phone ?? "",
    whatsapp:          user?.whatsapp ?? "",
    gender:            user?.gender ?? "",
    dateOfBirth:       user?.dateOfBirth ?? "",
    nationality:       user?.nationality ?? "",
    countryOfResidence:user?.countryOfResidence ?? "",
    city:              user?.city ?? "",
    occupation:        user?.occupation ?? "",
  });
  const [saving, setSaving] = useState(false);

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

  const field = (label: string, key: keyof typeof form, opts?: { multiline?: boolean; editable?: boolean }) => (
    <View style={fieldStyles.wrap} key={key}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, opts?.multiline && fieldStyles.inputMulti]}
        value={form[key]}
        onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
        editable={opts?.editable !== false}
        multiline={opts?.multiline}
      />
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {field("Display Name", "displayName")}
      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>Email</Text>
        <TextInput
          style={[fieldStyles.input, { color: colors.mute }]}
          value={user?.email ?? ""}
          editable={false}
        />
      </View>
      {field("Phone", "phone")}
      {field("WhatsApp", "whatsapp")}
      {field("Gender", "gender")}
      {field("Date of Birth", "dateOfBirth")}
      {field("Nationality", "nationality")}
      {field("Country of Residence", "countryOfResidence")}
      {field("City", "city")}
      {field("Occupation", "occupation")}
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving
          ? <ActivityIndicator color={colors.paper} />
          : <Text style={styles.saveBtnText}>Save Changes</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Directory Tab ─────────────────────────────────────────────────────────────
function DirectoryTab() {
  const { user, refreshProfile } = useAuthStore();
  const [optIn, setOptIn] = useState(user?.directoryOptIn ?? false);
  const [bio, setBio] = useState(user?.directoryBio ?? "");
  const [disciplines, setDisciplines] = useState<string[]>(user?.directoryDisciplines ?? []);
  const [instagram, setInstagram] = useState(user?.directoryInstagram ?? "");
  const [linkedin, setLinkedin] = useState(user?.directoryLinkedIn ?? "");
  const [website, setWebsite] = useState(user?.directoryWebsite ?? "");
  const [saving, setSaving] = useState(false);

  const toggleDiscipline = (d: string) => {
    setDisciplines((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`${MOBILE_API}/me`, {
        directory_opt_in:     optIn,
        directory_bio:        bio,
        directory_disciplines: disciplines,
        directory_instagram:  instagram,
        directory_linkedin:   linkedin,
        directory_website:    website,
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
    <ScrollView contentContainerStyle={styles.tabContent}>
      <View style={styles.toggleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.toggleLabel}>List me in the member directory</Text>
          <Text style={styles.toggleSub}>Visible to all Connect members</Text>
        </View>
        <Switch
          value={optIn}
          onValueChange={setOptIn}
          trackColor={{ true: colors.gold, false: colors.rule }}
          thumbColor={colors.paper}
        />
      </View>

      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>Bio <Text style={styles.charCount}>{bio.length}/280</Text></Text>
        <TextInput
          style={[fieldStyles.input, fieldStyles.inputMulti]}
          value={bio} onChangeText={(v) => setBio(v.slice(0, 280))}
          multiline
          placeholder="A short bio visible in the directory…"
          placeholderTextColor={colors.ghost}
        />
      </View>

      <Text style={fieldStyles.label}>Disciplines</Text>
      <View style={styles.chipsWrap}>
        {DISCIPLINE_OPTIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, disciplines.includes(d) && styles.chipActive]}
            onPress={() => toggleDiscipline(d)}
          >
            <Text style={[styles.chipText, disciplines.includes(d) && styles.chipTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>Instagram Handle</Text>
        <TextInput style={fieldStyles.input} value={instagram} onChangeText={setInstagram} placeholder="@handle" placeholderTextColor={colors.ghost} />
      </View>
      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>LinkedIn URL</Text>
        <TextInput style={fieldStyles.input} value={linkedin} onChangeText={setLinkedin} />
      </View>
      <View style={fieldStyles.wrap}>
        <Text style={fieldStyles.label}>Website URL</Text>
        <TextInput style={fieldStyles.input} value={website} onChangeText={setWebsite} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Interests Tab ─────────────────────────────────────────────────────────────
function InterestsTab() {
  const { user, refreshProfile } = useAuthStore();
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

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      <Text style={styles.helperText}>Select at least 3 interests to personalise your feed.</Text>
      <View style={styles.chipsWrap}>
        {INTEREST_OPTIONS.map((i) => (
          <TouchableOpacity
            key={i.slug}
            style={[styles.chip, selected.includes(i.slug) && styles.chipActive]}
            onPress={() => toggle(i.slug)}
          >
            <Text style={[styles.chipText, selected.includes(i.slug) && styles.chipTextActive]}>{i.emoji} {i.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving}>
        {saving ? <ActivityIndicator color={colors.paper} /> : <Text style={styles.saveBtnText}>Save Interests</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ── Newsletters Tab ───────────────────────────────────────────────────────────
function NewslettersTab() {
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({
    getmelit:     false,
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
    await api.post(`${MOBILE_API}/newsletter-preferences`, { lists }).catch(() => {});
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />;

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {NEWSLETTERS.map((nl) => (
        <View key={nl.id} style={styles.nlRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.nlName}>{nl.name}</Text>
            <Text style={styles.nlDesc}>{nl.desc}</Text>
          </View>
          <Switch
            value={subscribed[nl.id] ?? false}
            onValueChange={(v) => toggle(nl.id, v)}
            trackColor={{ true: colors.gold, false: colors.rule }}
            thumbColor={colors.paper}
          />
        </View>
      ))}
    </ScrollView>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab() {
  const { user, updateUser } = useAuthStore();
  const [passkeys,  setPasskeys]  = useState<Passkey[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [adding,    setAdding]    = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    setSupported(Passkeys.isSupported());
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setLoading(true);
    try {
      const data = await api.get<Passkey[]>(`${PROXY}/auth/passkey/list`);
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
      const optData = await api.get<{ options: any }>(`${PROXY}/auth/passkey/register-options`);
      const credential = await Passkeys.create(optData.options);
      if (!credential) return; // user cancelled

      await api.post(`${PROXY}/auth/passkey/register-verify`, {
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
      await api.delete(`${PROXY}/auth/passkey/delete`, { credential_id });
      const remaining = passkeys.filter((p) => p.credential_id !== credential_id);
      setPasskeys(remaining);
      if (remaining.length === 0) updateUser({ hasPasskey: false, passkeyCount: 0 });
      else updateUser({ passkeyCount: remaining.length });
    } catch {
      Alert.alert("Error", "Could not delete passkey.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.tabContent}>
      {/* Change password */}
      <View style={styles.securityCard}>
        <Text style={styles.securityCardTitle}>Change Password</Text>
        <Text style={styles.securityCardDesc}>
          We'll send a password reset link to your registered email address.
        </Text>
        <TouchableOpacity
          style={styles.outlineBtn}
          onPress={async () => {
            try {
              await api.post(`${MOBILE_API}/user/reset-password`, {});
              Alert.alert("Email sent", "Check your inbox for a password reset link.");
            } catch {
              Alert.alert("Error", "Could not send reset email.");
            }
          }}
        >
          <Text style={styles.outlineBtnText}>Send Reset Email</Text>
        </TouchableOpacity>
      </View>

      {/* Passkey manager */}
      <View style={styles.passkeysSection}>
        <Text style={styles.sectionTitle}>Passkeys</Text>
        <Text style={styles.passkeyIntro}>
          Passkeys are required to redeem perks and request credit cashouts.
          Your device biometrics (Face ID, fingerprint) authenticate the action.
        </Text>

        {!supported && (
          <View style={styles.unsupportedBanner}>
            <Ionicons name="warning-outline" size={16} color={colors.ochre} />
            <Text style={styles.unsupportedText}>
              Passkeys require iOS 16+ or Android 9+.
            </Text>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.gold} style={{ marginVertical: space[4] }} />
        ) : passkeys.length === 0 ? (
          <View style={styles.noPasskeys}>
            <Ionicons name="key-outline" size={32} color={colors.ghost} />
            <Text style={styles.noPasskeysText}>No passkeys set up yet.</Text>
          </View>
        ) : (
          <View style={styles.passkeyList}>
            {passkeys.map((pk, i) => (
              <View
                key={pk.credential_id}
                style={[styles.passkeyRow, i > 0 && styles.passkeyRowBorder]}
              >
                <Ionicons name="key-outline" size={18} color={colors.gold} style={{ marginTop: 1 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.passkeyDevice}>{pk.device_name || "Unknown device"}</Text>
                  <Text style={styles.passkeySub}>
                    Added{" "}
                    {new Date(pk.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                    {pk.last_used_at
                      ? ` · Last used ${new Date(pk.last_used_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                      : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(pk.credential_id)}
                  style={styles.deleteBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.ochre} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveBtn, (adding || !supported) && { opacity: 0.6 }]}
          disabled={adding || !supported}
          onPress={addPasskey}
        >
          {adding
            ? <ActivityIndicator color={colors.paper} />
            : <Text style={styles.saveBtnText}>+ Add a passkey</Text>
          }
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function MemberSettingsScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const initialTab: Tab = route.params?.tab ?? "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Tab strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabStrip}
        contentContainerStyle={styles.tabStripContent}
      >
        {TAB_LABELS.map(({ id, label }) => (
          <TouchableOpacity
            key={id}
            style={[styles.tab, activeTab === id && styles.tabActive]}
            onPress={() => setActiveTab(id)}
          >
            <Text style={[styles.tabText, activeTab === id && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === "profile"     && <ProfileTab />}
      {activeTab === "directory"   && <DirectoryTab />}
      {activeTab === "interests"   && <InterestsTab />}
      {activeTab === "newsletters" && <NewslettersTab />}
      {activeTab === "security"    && <SecurityTab />}
    </SafeAreaView>
  );
}

const fieldStyles = StyleSheet.create({
  wrap:       { marginBottom: space[3] },
  label:      { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginBottom: 6, letterSpacing: 0.8, textTransform: "uppercase" },
  input: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2],
    backgroundColor: colors.paper,
  },
  inputMulti: { minHeight: 80, textAlignVertical: "top" },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },

  tabStrip: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.rule },
  tabStripContent: { paddingHorizontal: space[4], gap: space[1] },
  tab: { paddingHorizontal: space[3], paddingVertical: space[3], borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: colors.ink },
  tabText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 1 },
  tabTextActive: { color: colors.ink },

  tabContent: { padding: space[4], paddingBottom: space[10] },

  saveBtn: {
    backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: space[3],
    alignItems: "center", marginTop: space[4],
  },
  saveBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  outlineBtn: {
    borderWidth: 1, borderColor: colors.ink, borderRadius: radius.md,
    paddingVertical: space[2], paddingHorizontal: space[4], alignSelf: "flex-start", marginTop: space[2],
  },
  outlineBtnText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ink },

  helperText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, marginBottom: space[3] },
  charCount:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: space[2], marginBottom: space[4] },
  chip: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: space[1] + 2,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },
  chipTextActive: { color: colors.paper },

  toggleRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3],
    marginBottom: space[3],
  },
  toggleLabel: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  toggleSub:   { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },

  nlRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[3],
    marginBottom: space[3],
  },
  nlName: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  nlDesc: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },

  securityCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, padding: space[4], marginBottom: space[4],
  },
  securityCardTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink, marginBottom: 4 },
  securityCardDesc:  { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },

  passkeysSection: { gap: space[3] },
  sectionTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },
  passkeyIntro: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, lineHeight: 18 },

  unsupportedBanner: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    backgroundColor: "#fef3ee", borderWidth: 1, borderColor: colors.ochre + "40",
    borderRadius: radius.md, padding: space[3],
  },
  unsupportedText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ochre, flex: 1 },

  noPasskeys: {
    alignItems: "center", gap: space[2],
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, paddingVertical: space[6],
  },
  noPasskeysText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute },

  passkeyList: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, overflow: "hidden",
  },
  passkeyRow: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    paddingHorizontal: space[3], paddingVertical: space[3],
  },
  passkeyRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  passkeyDevice: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  passkeySub:    { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },
  deleteBtn:     { padding: space[1] },
});
