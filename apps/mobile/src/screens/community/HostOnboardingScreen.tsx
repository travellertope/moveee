import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform, Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";

const TOTAL_STEPS = 5;

type Country = "United Kingdom" | "Nigeria" | "Other";
type VenueType = "home" | "cafe" | "coworking" | "other";
type AddressVisible = "members_only" | "on_request" | "area_only";

const VENUE_TYPES: { value: VenueType; label: string; icon: string }[] = [
  { value: "home",       label: "Home",            icon: "🏠" },
  { value: "cafe",       label: "Café",            icon: "☕" },
  { value: "coworking",  label: "Coworking space", icon: "💻" },
  { value: "other",      label: "Other",           icon: "📍" },
];

const ADDRESS_OPTIONS: { value: AddressVisible; label: string; desc: string }[] = [
  {
    value: "members_only",
    label: "Members only",
    desc: "Confirmed members see your full address. Everyone else sees your street name only.",
  },
  {
    value: "on_request",
    label: "On request",
    desc: "Your full address is shared only after someone joins and you approve them.",
  },
  {
    value: "area_only",
    label: "Area only",
    desc: "Only your street name is ever shared — best if you'd prefer more privacy.",
  },
];

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerBack: { minWidth: 44, minHeight: 44, justifyContent: "center" },
    headerStep: {
      flex: 1, textAlign: "right",
      fontFamily: fonts.mono, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1,
    },
    progress: {
      height: 2, backgroundColor: c.rule, marginHorizontal: 0,
    },
    progressFill: {
      height: 2, backgroundColor: c.ochre,
    },

    body: { paddingHorizontal: space[4], paddingTop: space[5], paddingBottom: 100 },

    stepHeading: {
      fontFamily: fonts.serifBold, fontSize: 24, color: c.ink,
      lineHeight: 30, marginBottom: space[2],
    },
    stepSub: {
      fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft,
      lineHeight: 20, marginBottom: space[5],
    },
    sectionLabel: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1,
      marginBottom: space[2], marginTop: space[4],
    },

    // Country chips
    countryRow: { gap: 10, marginBottom: 4 },
    countryChip: {
      flexDirection: "row", alignItems: "center", gap: 8,
      borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      paddingVertical: 14, paddingHorizontal: 16,
      backgroundColor: c.paper, marginBottom: 10,
    },
    countryChipActive: { borderColor: c.ochre, backgroundColor: `${c.ochre}0e` },
    countryFlag: { fontSize: 22 },
    countryLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, flex: 1 },
    countryLabelActive: { color: c.ochre },
    countryCheck: { width: 20 },

    // Context note
    contextNote: {
      backgroundColor: c.paperDeep, borderRadius: radius.lg,
      padding: 14, marginTop: space[3], marginBottom: space[1], gap: 6,
    },
    contextNoteIcon: { fontSize: 16 },
    contextNoteText: {
      fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 19,
    },

    // Venue chips (2-column grid)
    venueGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4,
    },
    venueChip: {
      width: "47%", borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      paddingVertical: 14, paddingHorizontal: 12,
      alignItems: "center", gap: 6, backgroundColor: c.paper,
    },
    venueChipActive: { borderColor: c.ochre, backgroundColor: `${c.ochre}0e` },
    venueChipEmoji: { fontSize: 24 },
    venueChipLabel: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },
    venueChipLabelActive: { fontFamily: fonts.sansBold, color: c.ochre },

    // Host note
    hostNoteInput: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: c.paper,
      minHeight: 80, textAlignVertical: "top",
    },

    // Capacity
    capacityRow: {
      flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4,
    },
    capacityBtn: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 1.5, borderColor: c.rule,
      justifyContent: "center", alignItems: "center",
    },
    capacityBtnActive: { borderColor: c.ochre, backgroundColor: c.ochre },
    capacityBtnText: { fontFamily: fonts.sansBold, fontSize: 22, color: c.ink },
    capacityBtnTextActive: { color: "#fff" },
    capacityValue: {
      fontFamily: fonts.serifBold, fontSize: 40, color: c.ink,
      minWidth: 56, textAlign: "center",
    },
    capacityHint: {
      fontFamily: fonts.sans, fontSize: 12, color: c.mute,
      marginTop: space[2], lineHeight: 17,
    },
    accessibleRow: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: 14, borderTopWidth: 1, borderTopColor: c.rule,
      marginTop: space[4], gap: 12,
    },
    accessibleTextBlock: { flex: 1 },
    accessibleLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    accessibleDesc: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },

    // Locality
    localityCommitment: {
      flexDirection: "row", alignItems: "flex-start", gap: 14,
      borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      padding: 16, marginTop: space[4],
    },
    localityCommitmentActive: { borderColor: c.ochre, backgroundColor: `${c.ochre}0e` },
    checkbox: {
      width: 22, height: 22, borderRadius: 5,
      borderWidth: 2, borderColor: c.rule,
      justifyContent: "center", alignItems: "center", flexShrink: 0, marginTop: 1,
    },
    checkboxActive: { borderColor: c.ochre, backgroundColor: c.ochre },
    commitmentText: {
      fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft, lineHeight: 20, flex: 1,
    },
    commitmentTextActive: { color: c.ink },

    // Address visibility
    addrOption: {
      borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      padding: 16, marginBottom: 10,
    },
    addrOptionActive: { borderColor: c.ochre, backgroundColor: `${c.ochre}0e` },
    addrOptionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    addrRadio: {
      width: 20, height: 20, borderRadius: 10,
      borderWidth: 2, borderColor: c.rule,
      justifyContent: "center", alignItems: "center",
    },
    addrRadioActive: { borderColor: c.ochre },
    addrRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.ochre },
    addrLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    addrLabelActive: { color: c.ochre },
    addrDesc: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 18, marginLeft: 30 },

    // Summary checklist
    summaryCard: {
      backgroundColor: c.paperDeep, borderRadius: radius.xl, padding: 16,
      marginTop: space[5], gap: 8,
    },
    summaryTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: c.mute, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    summaryDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.ochre },
    summaryText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1, lineHeight: 18 },

    // Bottom CTA
    footer: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      paddingHorizontal: space[4], paddingBottom: 32, paddingTop: 12,
      backgroundColor: c.paper,
      borderTopWidth: 1, borderTopColor: c.rule,
    },
    nextBtn: {
      height: 52, borderRadius: radius.full,
      backgroundColor: c.ink, justifyContent: "center", alignItems: "center",
    },
    nextBtnDisabled: { backgroundColor: c.ghost },
    nextBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
  });
}

const COUNTRY_FLAGS: Record<Country, string> = {
  "United Kingdom": "🇬🇧",
  "Nigeria": "🇳🇬",
  "Other": "🌍",
};

export default function HostOnboardingScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState(1);

  // Step 1
  const [country, setCountry] = useState<Country | "">("");

  // Step 2
  const [venueType, setVenueType] = useState<VenueType | "">("");
  const [hostNote, setHostNote] = useState("");

  // Step 3
  const [capacity, setCapacity] = useState(8);
  const [accessible, setAccessible] = useState(false);

  // Step 4
  const [localityConfirmed, setLocalityConfirmed] = useState(false);

  // Step 5
  const [addressVisible, setAddressVisible] = useState<AddressVisible>("members_only");

  const isUK = country === "United Kingdom";
  const isNG = country === "Nigeria";

  const progressWidth = `${(step / TOTAL_STEPS) * 100}%` as const;

  const canAdvance =
    (step === 1 && country !== "") ||
    (step === 2 && venueType !== "") ||
    (step === 3) ||
    (step === 4 && localityConfirmed) ||
    (step === 5);

  const handleBack = () => {
    if (step === 1) {
      nav.goBack();
    } else {
      setStep((s) => s - 1);
    }
  };

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      nav.navigate("StartClusterScreen", {
        country: country as string,
        venueType: venueType as string,
        hostNote: hostNote.trim(),
        realisticCapacity: capacity,
        accessible,
        addressVisible,
        localityConfirmed,
      });
    }
  };

  const venueLabel =
    VENUE_TYPES.find((v) => v.value === venueType)?.label ?? venueType;

  const addrLabel =
    ADDRESS_OPTIONS.find((a) => a.value === addressVisible)?.label ?? addressVisible;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBack} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerStep}>
          Step {step} of {TOTAL_STEPS}
        </Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progress}>
        <View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Step 1: Country ── */}
          {step === 1 && (
            <>
              <Text style={styles.stepHeading}>Culture, close to home.</Text>
              <Text style={styles.stepSub}>
                A Stoop is a small, weekly gathering of Moveee members
                in your area — watching films together, listening to
                music, reading aloud, cooking, and engaging with culture in
                the company of your neighbours.{"\n\n"}
                Where are you hosting from?
              </Text>

              {(["United Kingdom", "Nigeria", "Other"] as Country[]).map((c_) => (
                <TouchableOpacity
                  key={c_}
                  style={[styles.countryChip, country === c_ && styles.countryChipActive]}
                  onPress={() => setCountry(c_)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.countryFlag}>{COUNTRY_FLAGS[c_]}</Text>
                  <Text style={[styles.countryLabel, country === c_ && styles.countryLabelActive]}>
                    {c_}
                  </Text>
                  {country === c_ && (
                    <Ionicons name="checkmark-circle" size={20} color={c.ochre} />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ── Step 2: Venue type ── */}
          {step === 2 && (
            <>
              <Text style={styles.stepHeading}>Your hosting space.</Text>
              <Text style={styles.stepSub}>
                Stoops happen in real spaces — a living room, a café
                back room, a coworking lounge. What kind of space are you hosting in?
              </Text>

              <View style={styles.venueGrid}>
                {VENUE_TYPES.map((vt) => (
                  <TouchableOpacity
                    key={vt.value}
                    style={[styles.venueChip, venueType === vt.value && styles.venueChipActive]}
                    onPress={() => setVenueType(vt.value)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.venueChipEmoji}>{vt.icon}</Text>
                    <Text style={[
                      styles.venueChipLabel,
                      venueType === vt.value && styles.venueChipLabelActive,
                    ]}>
                      {vt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {isUK && (
                <View style={styles.contextNote}>
                  <Text style={styles.contextNoteText}>
                    🏘️{"  "}If you're renting, quickly check your tenancy agreement
                    for hosting small gatherings. Background music is generally fine;
                    for live sessions, a quick word with neighbours goes a long way.
                  </Text>
                </View>
              )}
              {isNG && (
                <View style={styles.contextNote}>
                  <Text style={styles.contextNoteText}>
                    🔌{"  "}If you're in a gated estate, let security know you're
                    hosting. It's worth having a backup plan if NEPA strikes — an
                    outdoor area or a neighbour's generator can save the evening.
                  </Text>
                </View>
              )}

              <Text style={styles.sectionLabel}>Host note (optional)</Text>
              <TextInput
                style={styles.hostNoteInput}
                placeholder={
                  "Share anything members should know about your space: what you've got set up, the vibe to expect, what to bring…"
                }
                placeholderTextColor={c.ghost}
                value={hostNote}
                onChangeText={setHostNote}
                multiline
                numberOfLines={4}
              />
            </>
          )}

          {/* ── Step 3: Capacity ── */}
          {step === 3 && (
            <>
              <Text style={styles.stepHeading}>How many can you fit?</Text>
              <Text style={styles.stepSub}>
                Set a realistic gathering size for your space. This helps members
                know what to expect and gives them a fair shot at joining before
                spots fill up.
              </Text>

              <Text style={styles.sectionLabel}>Gathering size</Text>
              <View style={styles.capacityRow}>
                <TouchableOpacity
                  style={[styles.capacityBtn, capacity <= 2 && styles.capacityBtnActive]}
                  onPress={() => setCapacity((n) => Math.max(2, n - 1))}
                >
                  <Text style={[styles.capacityBtnText, capacity <= 2 && styles.capacityBtnTextActive]}>
                    −
                  </Text>
                </TouchableOpacity>
                <Text style={styles.capacityValue}>{capacity}</Text>
                <TouchableOpacity
                  style={[styles.capacityBtn, capacity >= 20 && styles.capacityBtnActive]}
                  onPress={() => setCapacity((n) => Math.min(20, n + 1))}
                >
                  <Text style={[styles.capacityBtnText, capacity >= 20 && styles.capacityBtnTextActive]}>
                    +
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.capacityHint}>
                Cooking sessions work best at 6–8. Film screenings and music
                listening sessions can comfortably go to 10–12.{isNG ? "\n\nFor an open compound or outdoor setup, 12–16 is fine." : ""}
              </Text>

              <View style={styles.accessibleRow}>
                <View style={styles.accessibleTextBlock}>
                  <Text style={styles.accessibleLabel}>Step-free access</Text>
                  <Text style={styles.accessibleDesc}>
                    Your venue is accessible to people with limited mobility.
                  </Text>
                </View>
                <Switch
                  value={accessible}
                  onValueChange={setAccessible}
                  trackColor={{ false: c.rule, true: c.ochre }}
                  thumbColor="#fff"
                />
              </View>
            </>
          )}

          {/* ── Step 4: Locality ── */}
          {step === 4 && (
            <>
              <Text style={styles.stepHeading}>Staying close.</Text>
              <Text style={styles.stepSub}>
                Stoop is rooted in proximity — the whole point is
                meeting the people in your area, regularly, not
                pulling together a guest list from across the city.
              </Text>

              {isUK && (
                <View style={styles.contextNote}>
                  <Text style={styles.contextNoteText}>
                    🚶{"  "}This works best when you can walk to the gathering,
                    or it's a short bus or tube ride. If your Stoop starts
                    drawing people from two neighbourhoods away, it's drifted
                    from what it's meant to be.
                  </Text>
                </View>
              )}
              {isNG && (
                <View style={styles.contextNote}>
                  <Text style={styles.contextNoteText}>
                    🏘️{"  "}Even within a neighbourhood, a 10-minute drive or
                    okada ride is fine. This isn't a city-wide event — it should
                    feel like your own corner of Lagos, Abuja, or wherever you
                    call home.
                  </Text>
                </View>
              )}
              {!isUK && !isNG && (
                <View style={styles.contextNote}>
                  <Text style={styles.contextNoteText}>
                    🗺️{"  "}Keep it walkable or a short ride. A Stoop
                    that stays genuinely local — the same small area — tends to
                    build something real.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.localityCommitment, localityConfirmed && styles.localityCommitmentActive]}
                onPress={() => setLocalityConfirmed((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, localityConfirmed && styles.checkboxActive]}>
                  {localityConfirmed && (
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  )}
                </View>
                <Text style={[styles.commitmentText, localityConfirmed && styles.commitmentTextActive]}>
                  I'm committed to hosting within my local area and to attending
                  most sessions myself — not just running a group from a distance.
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Step 5: Address visibility + summary ── */}
          {step === 5 && (
            <>
              <Text style={styles.stepHeading}>Who sees your address?</Text>
              <Text style={styles.stepSub}>
                Choose how much location detail is shared with people browsing
                or joining your Stoop.
              </Text>

              {ADDRESS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.addrOption, addressVisible === opt.value && styles.addrOptionActive]}
                  onPress={() => setAddressVisible(opt.value)}
                  activeOpacity={0.8}
                >
                  <View style={styles.addrOptionHeader}>
                    <View style={[styles.addrRadio, addressVisible === opt.value && styles.addrRadioActive]}>
                      {addressVisible === opt.value && <View style={styles.addrRadioInner} />}
                    </View>
                    <Text style={[styles.addrLabel, addressVisible === opt.value && styles.addrLabelActive]}>
                      {opt.label}
                    </Text>
                  </View>
                  <Text style={styles.addrDesc}>{opt.desc}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Your Stoop setup</Text>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Hosting from: {country}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Venue type: {venueLabel}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Space for {capacity} people
                    {accessible ? " · step-free access" : ""}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Address: {addrLabel}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryDot} />
                  <Text style={styles.summaryText}>
                    Local commitment confirmed ✓
                  </Text>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Footer CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, !canAdvance && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={!canAdvance}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {step === TOTAL_STEPS ? "Set up my Stoop →" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
