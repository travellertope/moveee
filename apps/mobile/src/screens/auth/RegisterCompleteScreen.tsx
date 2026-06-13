"use client";
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Path, Circle, Polyline } from "react-native-svg";
import { api, CULTURE_API, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import { INTERESTS } from "@moveee/utils/interest-mappings";

// ── Helpers ───────────────────────────────────────────────────────────────────
function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M12 5l-7 7 7 7" stroke={colors.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
function CheckIcon({ size = 14, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const COUNTRIES = [
  "Nigeria", "United Kingdom", "United States", "Ghana", "Kenya", "South Africa",
  "Canada", "Australia", "Germany", "France", "Netherlands", "Sweden",
  "UAE", "Jamaica", "Trinidad & Tobago", "Other",
];

// ── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <View style={stepS.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[stepS.dot, i < step ? stepS.dotDone : i === step ? stepS.dotActive : stepS.dotIdle]}
        />
      ))}
    </View>
  );
}
const stepS = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: space[5] },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotDone: { backgroundColor: colors.ochre },
  dotActive: { backgroundColor: colors.ink, width: 20 },
  dotIdle: { backgroundColor: colors.ghost },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function RegisterCompleteScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { email, username, password } = params as {
    email: string;
    username: string;
    password: string;
  };

  const [step, setStep] = useState(0); // 0=profile, 1=interests, 2=tier

  // Step 0 — profile
  const [dob, setDob] = useState("");
  const [country, setCountry] = useState("");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [city, setCity] = useState("");
  const [occupation, setOccupation] = useState("");

  // Step 1 — interests
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Step 2 — tier
  const [tier, setTier] = useState<"citizen" | "patron">("citizen");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Validation ──────────────────────────────────────────────────────────────
  function step0Valid() {
    if (!dob.trim()) return false;
    if (!country) return false;
    if (!city.trim()) return false;
    return true;
  }

  function toggleInterest(slug: string) {
    setSelectedInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await api.post(
        `${CULTURE_API}/mobile/register`,
        {
          email,
          username,
          password,
          date_of_birth: dob.trim(),
          country_of_residence: country,
          city: city.trim(),
          occupation: occupation.trim(),
          tier,
        },
        false
      );
      nav.replace("VerifyEmail", {
        email,
        password,
        pendingInterests: selectedInterests,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => (step > 0 ? setStep(step - 1) : nav.goBack())} hitSlop={8}>
            <BackIcon />
          </Pressable>
          <Text style={styles.headerTitle}>
            {step === 0 ? "Your profile" : step === 1 ? "Your interests" : "Choose your plan"}
          </Text>
          <View style={{ width: 20 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <StepDots step={step} total={3} />

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* ── Step 0: Profile ──────────────────────────────────────────── */}
          {step === 0 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepHeading}>Tell us a bit about you.</Text>
              <Text style={styles.stepSub}>This helps personalise your experience.</Text>

              <Text style={styles.label}>Date of birth <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.ghost}
                value={dob}
                onChangeText={setDob}
                keyboardType="numbers-and-punctuation"
              />

              <Text style={styles.label}>Country of residence <Text style={styles.required}>*</Text></Text>
              <Pressable style={styles.input} onPress={() => setShowCountryPicker(!showCountryPicker)}>
                <Text style={country ? styles.inputText : styles.inputPlaceholder}>
                  {country || "Select country"}
                </Text>
              </Pressable>
              {showCountryPicker && (
                <View style={styles.countryList}>
                  <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                    {COUNTRIES.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={styles.countryItem}
                        onPress={() => { setCountry(c); setShowCountryPicker(false); }}
                      >
                        <Text style={[styles.countryItemText, country === c && { color: colors.ochre }]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <Text style={styles.label}>City <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Lagos, London, New York"
                placeholderTextColor={colors.ghost}
                value={city}
                onChangeText={setCity}
              />

              <Text style={styles.label}>Occupation <Text style={styles.optional}>(optional)</Text></Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Designer, Student, Engineer"
                placeholderTextColor={colors.ghost}
                value={occupation}
                onChangeText={setOccupation}
              />

              <Pressable
                style={[styles.primaryBtn, !step0Valid() && styles.primaryBtnDisabled]}
                onPress={() => step0Valid() && setStep(1)}
                disabled={!step0Valid()}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>
            </View>
          )}

          {/* ── Step 1: Interests ────────────────────────────────────────── */}
          {step === 1 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepHeading}>What moves you?</Text>
              <Text style={styles.stepSub}>
                Pick at least 3 interests to personalise your feed.{" "}
                <Text style={selectedInterests.length >= 3 ? styles.countGood : styles.countBad}>
                  {selectedInterests.length} selected
                </Text>
              </Text>

              <View style={styles.interestGrid}>
                {INTERESTS.map((interest) => {
                  const active = selectedInterests.includes(interest.slug);
                  return (
                    <Pressable
                      key={interest.slug}
                      style={[styles.interestChip, active && styles.interestChipActive]}
                      onPress={() => toggleInterest(interest.slug)}
                    >
                      <Text style={styles.interestEmoji}>{interest.emoji}</Text>
                      <Text style={[styles.interestLabel, active && styles.interestLabelActive]}>
                        {interest.label}
                      </Text>
                      {active && (
                        <View style={styles.interestCheck}>
                          <CheckIcon size={10} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                style={[styles.primaryBtn, selectedInterests.length < 3 && styles.primaryBtnDisabled]}
                onPress={() => selectedInterests.length >= 3 && setStep(2)}
                disabled={selectedInterests.length < 3}
              >
                <Text style={styles.primaryBtnText}>Continue</Text>
              </Pressable>

              <Pressable onPress={() => setStep(2)} style={styles.skipBtn}>
                <Text style={styles.skipText}>Skip for now</Text>
              </Pressable>
            </View>
          )}

          {/* ── Step 2: Tier ─────────────────────────────────────────────── */}
          {step === 2 && (
            <View style={styles.stepWrap}>
              <Text style={styles.stepHeading}>Choose your plan.</Text>
              <Text style={styles.stepSub}>You can always upgrade later.</Text>

              {/* Citizen card */}
              <Pressable
                style={[styles.tierCard, tier === "citizen" && styles.tierCardActive]}
                onPress={() => setTier("citizen")}
              >
                <View style={styles.tierCardHeader}>
                  <View>
                    <Text style={styles.tierEyebrow}>FREE FOREVER</Text>
                    <Text style={styles.tierName}>Connect Citizen</Text>
                  </View>
                  <View style={[styles.tierRadio, tier === "citizen" && styles.tierRadioActive]}>
                    {tier === "citizen" && <View style={styles.tierRadioDot} />}
                  </View>
                </View>
                <Text style={styles.tierDesc}>
                  Access the community feed, events, games, newsletters, and directory.
                </Text>
              </Pressable>

              {/* Pro card */}
              <Pressable
                style={[styles.tierCard, styles.tierCardPro, tier === "patron" && styles.tierCardProActive]}
                onPress={() => setTier("patron")}
              >
                <View style={styles.tierCardHeader}>
                  <View>
                    <Text style={[styles.tierEyebrow, { color: colors.gold }]}>CONNECT PRO ★</Text>
                    <Text style={styles.tierName}>Connect Pro</Text>
                    <Text style={styles.tierPriceNote}>Upgrade via web after sign up</Text>
                  </View>
                  <View style={[styles.tierRadio, tier === "patron" && styles.tierRadioProActive]}>
                    {tier === "patron" && <View style={[styles.tierRadioDot, { backgroundColor: colors.gold }]} />}
                  </View>
                </View>
                <Text style={styles.tierDesc}>
                  Everything in Citizen + Connect Pro badge, gated content, early access, pro shop pricing.
                </Text>
              </Pressable>

              <Pressable
                style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.paper} />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {tier === "patron" ? "Create account & upgrade →" : "Create account →"}
                  </Text>
                )}
              </Pressable>

              <Text style={styles.termsNote}>
                By creating an account you agree to our{" "}
                <Text style={styles.termsLink}>Terms</Text> and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space[5],
    paddingVertical: space[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  headerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },

  scroll: {
    paddingHorizontal: space[5],
    paddingTop: space[5],
    paddingBottom: space[10],
  },

  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.lg,
    padding: space[4],
    marginBottom: space[4],
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },

  stepWrap: { gap: space[1] },
  stepHeading: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: space[1],
  },
  stepSub: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    marginBottom: space[4],
    lineHeight: 20,
  },

  label: {
    fontFamily: fonts.sansMedium ?? fonts.sans,
    fontSize: fontSize.sm,
    color: colors.inkSoft,
    marginTop: space[3],
    marginBottom: space[1],
  },
  required: { color: colors.ochre },
  optional: { color: colors.ghost, fontFamily: fonts.sans },

  input: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    height: 48,
    paddingHorizontal: space[4],
    backgroundColor: colors.paper,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
    justifyContent: "center",
  },
  inputText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  inputPlaceholder: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ghost,
  },

  countryList: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    marginTop: 2,
    overflow: "hidden",
  },
  countryItem: {
    paddingVertical: 10,
    paddingHorizontal: space[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  countryItemText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.inkSoft,
  },

  primaryBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space[5],
  },
  primaryBtnDisabled: { opacity: 0.35 },
  primaryBtnText: {
    fontFamily: fonts.sansBold ?? fonts.sans,
    fontSize: fontSize.base,
    color: colors.paper,
  },

  skipBtn: { alignItems: "center", paddingVertical: space[3] },
  skipText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    textDecorationLine: "underline",
  },

  // Interests
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: space[4],
  },
  interestChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.paper,
    position: "relative",
  },
  interestChipActive: {
    borderColor: colors.ochre,
    backgroundColor: "#FEF0EB",
  },
  interestEmoji: { fontSize: 14 },
  interestLabel: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.inkSoft,
  },
  interestLabelActive: { color: colors.ochre },
  interestCheck: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.ochre,
    alignItems: "center",
    justifyContent: "center",
  },
  countGood: { color: colors.ochre, fontFamily: fonts.sansBold ?? fonts.sans },
  countBad: { color: colors.ghost },

  // Tier cards
  tierCard: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.lg,
    padding: space[4],
    backgroundColor: colors.paper,
    marginBottom: space[3],
    gap: space[2],
  },
  tierCardActive: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  tierCardPro: { borderColor: colors.goldBorder },
  tierCardProActive: { borderColor: colors.gold, borderWidth: 2 },
  tierCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  tierEyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.5,
    color: colors.mute,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  tierName: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.xl,
    color: colors.ink,
  },
  tierPriceNote: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.mute,
    marginTop: 2,
  },
  tierDesc: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    lineHeight: 20,
  },
  tierRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.ghost,
    alignItems: "center",
    justifyContent: "center",
  },
  tierRadioActive: { borderColor: colors.ink },
  tierRadioProActive: { borderColor: colors.gold },
  tierRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ink,
  },

  termsNote: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.ghost,
    textAlign: "center",
    marginTop: space[3],
    lineHeight: 16,
  },
  termsLink: { textDecorationLine: "underline", color: colors.mute },
});
