import React, { useState } from "react";
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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Circle, Path, Rect, Polyline } from "react-native-svg";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

// ── Icons ─────────────────────────────────────────────────────────────────────
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
      <Path d="M1 1l22 22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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

// ── Key illustration ──────────────────────────────────────────────────────────
function KeyIllustration() {
  return (
    <View style={keyS.wrap}>
      <Svg width={52} height={52} viewBox="0 0 52 52" fill="none">
        {/* Key ring */}
        <Circle cx="18" cy="18" r="14" stroke={colors.ochre} strokeWidth="3" fill="none" />
        <Circle cx="18" cy="18" r="8" stroke={colors.ochre} strokeWidth="2" fill="none" />
        {/* Shaft */}
        <Path
          d="M28 28l16 16"
          stroke={colors.ink}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Notches */}
        <Path
          d="M36 36l4-4M40 40l4-4"
          stroke={colors.ink}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
const keyS = StyleSheet.create({
  wrap: { alignItems: "center", marginBottom: space[5] },
});

const AUTH_ICON = require("../../../assets/logo.png");

function Wordmark() {
  return (
    <View style={{ alignItems: "center", marginBottom: space[6] }}>
      <Image source={AUTH_ICON} style={{ width: 48, height: 48, borderRadius: 24 }} resizeMode="contain" />
    </View>
  );
}

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

function getRequirements(pw: string) {
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
  return (
    <View style={pwS.wrap}>
      <View style={pwS.bar}>
        {[1, 2, 3, 4].map((n) => (
          <View
            key={n}
            style={[pwS.segment, { backgroundColor: n <= score ? color : colors.ghost }]}
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
  label: { fontFamily: fonts.sansMedium, fontSize: fontSize.xs, marginBottom: space[2] },
  reqs: { gap: 4 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  reqText: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute },
  reqMet: { color: colors.success },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ResetPasswordScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const token: string = params?.token ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const { score } = getStrength(password);
  const passwordsMatch = confirm.length > 0 && password === confirm;
  const isValid = score >= 2 && passwordsMatch;

  async function handleSubmit() {
    setError("");
    if (!isValid) return;
    setLoading(true);
    try {
      await api.post(`${CULTURE_API}/mobile/reset-password`, { token, password }, false);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reset password. The link may have expired.");
    } finally {
      setLoading(false);
    }
  }

  // ── Success view ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successInner}>
          <View style={styles.successCircle}>
            <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
              <Polyline
                points="8 18 15 25 28 12"
                stroke="#fff"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
          <Text style={styles.heading}>Password updated.</Text>
          <Text style={styles.subheading}>
            Your password has been changed successfully. You can now sign in with your new password.
          </Text>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => nav.navigate("Login")}
          >
            {({ pressed }) => (
              <Text style={[styles.primaryLabel, pressed && { opacity: 0.85 }]}>
                Sign in
              </Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────
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
          <Wordmark />
          <KeyIllustration />

          <Text style={styles.heading}>Set a new password.</Text>
          <Text style={styles.subheading}>
            Choose something strong — you won't be able to reuse your last password.
          </Text>

          {!!error && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* New password */}
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor={colors.ghost}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              returnKeyType="next"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
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

          {/* Confirm password */}
          <View style={[styles.inputWrap, confirmFocused && styles.inputWrapFocused]}>
            <TextInput
              style={styles.input}
              placeholder="Confirm new password"
              placeholderTextColor={colors.ghost}
              secureTextEntry={!showConfirm}
              autoComplete="new-password"
              returnKeyType="done"
              value={confirm}
              onChangeText={setConfirm}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              onSubmitEditing={handleSubmit}
            />
            <View style={styles.inputAction}>
              {confirm.length > 0 ? (
                passwordsMatch ? (
                  <CheckIcon color={colors.success} />
                ) : (
                  <CircleIcon color={colors.error} />
                )
              ) : (
                <Pressable onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
                  <EyeIcon visible={showConfirm} />
                </Pressable>
              )}
            </View>
          </View>
          {confirm.length > 0 && !passwordsMatch && (
            <Text style={styles.matchError}>Passwords do not match</Text>
          )}

          {/* Submit */}
          <Pressable
            style={[styles.primaryBtn, !isValid && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || !isValid}
          >
            {({ pressed }) =>
              loading ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={[styles.primaryLabel, pressed && { opacity: 0.85 }]}>
                  Update password
                </Text>
              )
            }
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperWarm },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.ink,
    marginBottom: space[2],
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base - 1,
    color: colors.mute,
    lineHeight: 22,
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
    marginBottom: space[2],
    paddingHorizontal: space[4],
  },
  inputWrapFocused: { borderColor: colors.ink },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  inputAction: { paddingLeft: space[2], paddingVertical: space[2] },
  matchError: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.error,
    marginBottom: space[3],
    marginLeft: 2,
  },
  primaryBtn: {
    backgroundColor: colors.ochre,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space[4],
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
  // Success view
  successInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.ochre,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[5],
  },
});
