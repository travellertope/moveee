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
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import * as Passkeys from "react-native-passkeys";
import { useAuthStore } from "../../auth/authStore";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { User } from "../../types";

const PROXY = "https://themoveee.com/api";

// ── Icons ─────────────────────────────────────────────────────────────────────
function MailIcon({ color = colors.ghost }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <Path d="M2 7l10 7 10-7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
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
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"
          stroke={color}
          strokeWidth="1.8"
        />
        <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.8" />
      </Svg>
    );
  }
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line
        x1="1"
        y1="1"
        x2="23"
        y2="23"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FingerprintIcon({ color = colors.ink }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 10a2 2 0 00-2 2c0 1.02-.1 2.51-.26 4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M14 13.12c0 2.38.19 4.86.62 6.88M8 14c0 2.5-.49 4.96-.78 6.18M12 8a4 4 0 014 4c0 1.5-.15 3.14-.29 4.47"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M4.67 12.57A8 8 0 0112 4a8 8 0 018 8c0 1.88-.18 3.7-.5 5.48"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
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
  wrap: { alignItems: "center", marginBottom: space[6] },
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function LoginScreen() {
  const nav = useNavigation<any>();
  const { login, loginWithToken, isLoading, error: authError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [localError, setLocalError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const passwordRef = useRef<TextInput>(null);

  async function handleSubmit() {
    setLocalError("");
    if (!email.trim() || !password) {
      setLocalError("Please enter your email and password.");
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e: unknown) {
      setLocalError(
        e instanceof Error ? e.message : "Sign in failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasskeyLogin() {
    if (passkeyLoading) return;
    if (!Passkeys.isSupported()) {
      setLocalError("Passkeys are not supported on this device.");
      return;
    }
    setLocalError("");
    setPasskeyLoading(true);
    try {
      const optData = await api.post<any>(
        `${PROXY}/auth/passkey/login-options`,
        {},
        false
      );
      const credential = await Passkeys.get(optData);
      if (!credential) return;

      const result = await api.post<{ token: string; user: User }>(
        `${PROXY}/auth/passkey/login-verify`,
        {
          id: credential.id,
          rawId: credential.rawId,
          type: credential.type,
          response: {
            clientDataJSON: credential.response.clientDataJSON,
            authenticatorData: (credential.response as any).authenticatorData,
            signature: (credential.response as any).signature,
            userHandle: (credential.response as any).userHandle,
          },
          _challenge_key: optData._challenge_key,
        },
        false
      );
      await loginWithToken(result.token, result.user);
    } catch (e: any) {
      if (!e?.message?.toLowerCase().includes("cancel")) {
        setLocalError("Passkey sign-in failed. Please use your password instead.");
      }
    } finally {
      setPasskeyLoading(false);
    }
  }

  const displayError = localError || authError;
  const canSubmit = email.trim().length > 0 && password.length > 0;

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

          <Text style={styles.heading}>Welcome back.</Text>
          <Text style={styles.subheading}>Sign in to your Moveee account.</Text>

          {!!displayError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{displayError}</Text>
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
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <View style={styles.inputIcon}>
              <LockIcon color={passwordFocused ? colors.ink : colors.ghost} />
            </View>
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.ghost}
              secureTextEntry={!showPassword}
              autoComplete="password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onSubmitEditing={handleSubmit}
            />
            <Pressable
              style={styles.inputAction}
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={8}
            >
              <EyeIcon visible={showPassword} />
            </Pressable>
          </View>

          {/* Forgot password */}
          <Pressable
            style={styles.forgotWrap}
            onPress={() => nav.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          {/* Sign in button */}
          <Pressable
            style={[styles.primaryBtn, !canSubmit && styles.primaryBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            {({ pressed }) =>
              submitting ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={[styles.primaryLabel, pressed && { opacity: 0.85 }]}>
                  Sign in
                </Text>
              )
            }
          </Pressable>

          {/* OR divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Passkey */}
          <Pressable
            style={[styles.outlineBtn, passkeyLoading && { opacity: 0.6 }]}
            onPress={handlePasskeyLogin}
            disabled={passkeyLoading}
          >
            {({ pressed }) => (
              <View style={[styles.outlineBtnInner, pressed && { opacity: 0.7 }]}>
                {passkeyLoading ? (
                  <ActivityIndicator color={colors.ink} size="small" />
                ) : (
                  <>
                    <FingerprintIcon />
                    <Text style={styles.outlineLabel}>Continue with passkey</Text>
                  </>
                )}
              </View>
            )}
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account?{" "}
              <Text style={styles.footerLink} onPress={() => nav.navigate("Register")}>
                Create one
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
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
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
  forgotWrap: { alignSelf: "flex-end", marginBottom: space[5], paddingVertical: 4 },
  forgotText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.ochre,
  },
  primaryBtn: {
    backgroundColor: colors.ochre,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: space[5],
    gap: space[3],
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.rule },
  dividerText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  outlineBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
  },
  outlineLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  footer: { alignItems: "center", marginTop: space[6] },
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
