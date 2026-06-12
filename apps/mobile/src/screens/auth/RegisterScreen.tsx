import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

// ── Icons ─────────────────────────────────────────────────────────────────────
function MailIcon({ color = colors.ghost }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M2 7l10 7 10-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function UserIcon({ color = colors.ghost }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.8" />
      <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ color = colors.ghost }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M8 11V7a4 4 0 118 0v4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="12" cy="16" r="1.5" fill={color} />
    </Svg>
  );
}

function EyeIcon({ visible, color = colors.ghost }: { visible: boolean; color?: string }) {
  if (visible) {
    return (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke={color} strokeWidth="1.8" />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
      <Path
        d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
        stroke={color} strokeWidth="1.8" strokeLinecap="round"
      />
      <Line x1="1" y1="1" x2="23" y2="23" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CircleIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// ── Wordmark ──────────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <View style={wmS.wrap}>
      <Text style={wmS.moveee}>moveee</Text>
      <Text style={wmS.connect}>connect</Text>
      <View style={wmS.line} />
    </View>
  );
}
const wmS = StyleSheet.create({
  wrap: { alignItems: "center" },
  moveee: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.5,
  },
  connect: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 3,
  },
  line: { width: 32, height: 2, backgroundColor: colors.ochre, marginTop: 10 },
});

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: "Weak", color: colors.error },
    { label: "Fair", color: colors.warning },
    { label: "Strong", color: colors.success },
    { label: "Very strong", color: colors.success },
  ];
  return { score, ...(levels[score - 1] ?? { label: "", color: colors.ghost }) };
}

type Req = { met: boolean; label: string };

function getRequirements(pw: string): Req[] {
  return [
    { met: pw.length >= 8, label: "At least 8 characters" },
    { met: /[A-Z]/.test(pw), label: "One uppercase letter" },
    { met: /[0-9]/.test(pw), label: "One number" },
    { met: /[^A-Za-z0-9]/.test(pw), label: "One special character" },
  ];
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  const reqs = getRequirements(password);
  const segW = (reqs.length > 0 ? 1 : 0);
  void segW;

  return (
    <View style={pwS.wrap}>
      {/* 4-segment bar */}
      <View style={pwS.bar}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[
              pwS.segment,
              { backgroundColor: n <= score ? color : colors.ghost },
            ]}
          />
        ))}
      </View>
      <Text style={[pwS.label, { color }]}>{label}</Text>
      <View style={pwS.reqs}>
        {reqs.map((r) => (
          <View key={r.label} style={pwS.reqRow}>
            {r.met ? <CheckIcon color={colors.success} /> : <CircleIcon color={colors.ghost} />}
            <Text style={[pwS.reqText, r.met && pwS.reqMet]}>{r.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const pwS = StyleSheet.create({
  wrap: { marginBottom: space[4] },
  bar: { flexDirection: "row", gap: 4, marginBottom: space[1] },
  segment: { flex: 1, height: 4, borderRadius: 9999 },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.xs,
    marginBottom: space[2],
  },
  reqs: { gap: 4 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reqText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.mute,
  },
  reqMet: { color: colors.success },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const nav = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const { score } = getStrength(password);
  const isValid =
    email.trim().length > 0 &&
    username.trim().length > 0 &&
    password.length >= 8 &&
    score >= 2;

  async function handleRegister() {
    setError("");
    if (!isValid) return;
    setLoading(true);
    try {
      await api.post(`${CULTURE_API}/mobile/register`, { email, username, password }, false);
      nav.replace("VerifyEmail", { email });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backBtn}
              onPress={() => nav.goBack()}
              hitSlop={8}
            >
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={colors.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </Pressable>
            <Wordmark />
            <View style={{ width: 44 }} />
          </View>

          <Text style={styles.heading}>Create your account.</Text>
          <Text style={styles.subheading}>Just three fields to get started.</Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email */}
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <View style={styles.inputIcon}>
              <MailIcon color={emailFocused ? colors.ink : colors.ghost} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.ghost}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="next"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              onSubmitEditing={() => usernameRef.current?.focus()}
            />
          </View>

          {/* Username */}
          <View style={[styles.inputWrap, usernameFocused && styles.inputWrapFocused]}>
            <View style={styles.inputIcon}>
              <UserIcon color={usernameFocused ? colors.ink : colors.ghost} />
            </View>
            <TextInput
              ref={usernameRef}
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.ghost}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              value={username}
              onChangeText={(t) => setUsername(t.replace(/[^a-zA-Z0-9_]/g, ""))}
              onFocus={() => setUsernameFocused(true)}
              onBlur={() => setUsernameFocused(false)}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>
          <Text style={styles.inputHint}>Letters, numbers, and underscores only</Text>

          {/* Password */}
          <View
            style={[
              styles.inputWrap,
              passwordFocused && styles.inputWrapFocused,
              { marginBottom: space[2] },
            ]}
          >
            <View style={styles.inputIcon}>
              <LockIcon color={passwordFocused ? colors.ink : colors.ghost} />
            </View>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.ghost}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onSubmitEditing={handleRegister}
            />
            <Pressable
              style={styles.inputAction}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <EyeIcon visible={showPassword} />
            </Pressable>
          </View>

          <PasswordStrength password={password} />

          {/* Submit */}
          <Pressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleRegister}
            disabled={loading || !isValid}
          >
            {({ pressed }) =>
              loading ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={[styles.primaryLabel, pressed && { opacity: 0.85 }]}>
                  Create account
                </Text>
              )
            }
          </Pressable>

          {/* Terms */}
          <Text style={styles.terms}>
            By creating an account you agree to our{" "}
            <Text style={styles.termsLink}>Terms</Text> and{" "}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{" "}
              <Text style={styles.footerLink} onPress={() => nav.navigate("Login")}>
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperWarm },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: space[6],
    paddingTop: space[5],
    paddingBottom: space[8],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space[6],
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.ink,
    marginBottom: space[1],
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base - 1,
    color: colors.mute,
    marginBottom: space[6],
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[4],
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.error,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ghost,
    height: 52,
    marginBottom: space[3],
    paddingHorizontal: space[4],
  },
  inputWrapFocused: { borderColor: colors.ink },
  inputIcon: { marginRight: space[2] },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  inputAction: { paddingLeft: space[2], paddingVertical: space[2] },
  inputHint: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
    marginTop: -space[2],
    marginBottom: space[3],
    marginLeft: 2,
  },
  primaryBtn: {
    backgroundColor: colors.ochre,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[4],
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
  terms: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mute,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: space[4],
  },
  termsLink: { color: colors.ochre },
  footer: { alignItems: "center" },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
  },
  footerLink: {
    fontFamily: fonts.sansMedium,
    color: colors.ochre,
  },
});
