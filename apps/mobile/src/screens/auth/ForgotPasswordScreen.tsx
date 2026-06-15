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
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, { Rect, Path, Circle, Polyline } from "react-native-svg";

const PROXY = "https://themoveee.com/api";
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

function ChevronLeft({ color = colors.ink }: { color?: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRight({ color = colors.mute }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function XIcon({ color = colors.ghost }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// ── Lock illustration ─────────────────────────────────────────────────────────
function LockIllustration() {
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
      {/* Shackle arc */}
      <Path
        d="M22 32V24a14 14 0 0128 0v8"
        stroke={colors.ink}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Body */}
      <Rect x="12" y="32" width="48" height="32" rx="6" fill={colors.ink} />
      {/* Keyhole circle */}
      <Circle cx="36" cy="47" r="5" fill={colors.paperWarm} />
      {/* Keyhole shaft */}
      <Rect x="33.5" y="50" width="5" height="8" rx="2" fill={colors.paperWarm} />
    </Svg>
  );
}

// ── Envelope for sent view ────────────────────────────────────────────────────
function EnvelopeSentIcon() {
  return (
    <View style={envS.wrap}>
      <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
        <Rect x="6" y="18" width="60" height="44" rx="5" fill={colors.paper} stroke={colors.ghost} strokeWidth="2" />
        <Path d="M6 22l30 24 30-24" stroke={colors.ghost} strokeWidth="2" strokeLinecap="round" />
        <Path d="M6 62l24-20" stroke={colors.ghost} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M66 62L42 42" stroke={colors.ghost} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
      <View style={envS.badge}>
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Circle cx="11" cy="11" r="11" fill={colors.ochre} />
          <Polyline points="6 11 9 14 16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}
const envS = StyleSheet.create({
  wrap: { position: "relative", width: 72, height: 72, marginBottom: space[5] },
  badge: { position: "absolute", top: -4, right: -4 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen() {
  const nav = useNavigation<any>();

  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSend() {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(`${PROXY}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Something went wrong. Please try again.");
      }
      setSent(true);
    } catch (e: any) {
      if (e?.name === "AbortError") {
        setError("Request timed out. Please check your connection and try again.");
      } else {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // ── Sent confirmation view ──────────────────────────────────────────────────
  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.sentInner}>
          <EnvelopeSentIcon />
          <Text style={styles.heading}>Check your inbox.</Text>
          <Text style={styles.subheading}>
            We sent a password reset link to:
          </Text>
          <View style={styles.emailChip}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Open email app */}
          <Pressable
            style={styles.openEmailRow}
            onPress={() => Linking.openURL("mailto:")}
          >
            <View style={styles.openEmailLeft}>
              <MailIcon color={colors.ink} />
              <Text style={styles.openEmailText}>Open email app</Text>
            </View>
            <ChevronRight />
          </Pressable>

          {/* Try different email */}
          <Pressable style={styles.outlineBtn} onPress={() => setSent(false)}>
            <Text style={styles.outlineLabel}>Try a different email</Text>
          </Pressable>

          {/* Back to sign in */}
          <Pressable style={styles.ghostBtn} onPress={() => nav.navigate("Login")}>
            <Text style={styles.ghostLabel}>Back to sign in</Text>
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
          {/* Back */}
          <Pressable style={styles.backBtn} onPress={() => nav.navigate("Login")}>
            <ChevronLeft />
            <Text style={styles.backText}>Back to sign in</Text>
          </Pressable>

          {/* Lock illustration */}
          <View style={styles.illustrationWrap}>
            <LockIllustration />
          </View>

          <Text style={styles.heading}>Forgot your password?</Text>
          <Text style={styles.subheading}>
            No worries. Enter your email and we'll send you a reset link.
          </Text>

          {/* Email field */}
          <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
            <View style={styles.inputIcon}>
              <MailIcon color={focused ? colors.ink : colors.ghost} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor={colors.ghost}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              returnKeyType="done"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onSubmitEditing={handleSend}
            />
            {email.length > 0 && (
              <Pressable
                style={styles.inputAction}
                onPress={() => setEmail("")}
                hitSlop={8}
              >
                <XIcon />
              </Pressable>
            )}
          </View>

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          {/* Send button */}
          <Pressable
            style={[styles.primaryBtn, !email.trim() && styles.primaryBtnDisabled]}
            onPress={handleSend}
            disabled={loading || !email.trim()}
          >
            {({ pressed }) =>
              loading ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={[styles.primaryLabel, pressed && { opacity: 0.85 }]}>
                  Send reset link
                </Text>
              )
            }
          </Pressable>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Remember your password?{" "}
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
    paddingTop: space[4],
    paddingBottom: space[8],
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: space[3],
    alignSelf: "flex-start",
    marginBottom: space[4],
  },
  backText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  illustrationWrap: {
    alignItems: "center",
    marginBottom: space[5],
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
  inputIcon: { marginRight: space[2] },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  inputAction: { paddingLeft: space[2], paddingVertical: space[2] },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.error,
    marginBottom: space[4],
    marginLeft: 2,
  },
  primaryBtn: {
    backgroundColor: colors.ochre,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: space[3],
    marginBottom: space[5],
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
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
  // Sent view
  sentInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  emailChip: {
    borderWidth: 1,
    borderColor: colors.ghost,
    borderRadius: 9999,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    marginBottom: space[6],
  },
  emailText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  openEmailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.rule,
    paddingHorizontal: space[5],
    paddingVertical: space[4],
    marginBottom: space[4],
  },
  openEmailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[3],
  },
  openEmailText: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 9999,
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[3],
  },
  outlineLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  ghostBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ochre,
  },
});
