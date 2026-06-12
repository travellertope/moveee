import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Svg, { Rect, Path, Circle, Polyline } from "react-native-svg";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const RESEND_COOLDOWN = 30;

// ── Envelope icon ─────────────────────────────────────────────────────────────
function EnvelopeIcon() {
  return (
    <View style={iconS.wrap}>
      <Svg width={72} height={72} viewBox="0 0 72 72" fill="none">
        {/* Body */}
        <Rect x="6" y="18" width="60" height="44" rx="5" fill={colors.paper} stroke={colors.ghost} strokeWidth="2" />
        {/* V fold */}
        <Path d="M6 22l30 24 30-24" stroke={colors.ghost} strokeWidth="2" strokeLinecap="round" />
        {/* Corner fold lines */}
        <Path d="M6 62l24-20" stroke={colors.ghost} strokeWidth="1.5" strokeLinecap="round" />
        <Path d="M66 62L42 42" stroke={colors.ghost} strokeWidth="1.5" strokeLinecap="round" />
      </Svg>
      {/* Ochre badge */}
      <View style={iconS.badge}>
        <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
          <Circle cx="11" cy="11" r="11" fill={colors.ochre} />
          <Polyline points="6 11 9 14 16 8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </View>
    </View>
  );
}
const iconS = StyleSheet.create({
  wrap: { position: "relative", width: 72, height: 72, marginBottom: space[5] },
  badge: { position: "absolute", top: -4, right: -4 },
});

// ── Screen ────────────────────────────────────────────────────────────────────
export default function VerifyEmailScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const email: string = params?.email ?? "";

  const [countdown, setCountdown] = useState(0);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resentError, setResentError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    if (countdown > 0 || resending) return;
    setResentError("");
    setResending(true);
    try {
      await api.post(`${CULTURE_API}/mobile/resend-verification`, { email }, false);
      setResent(true);
      setCountdown(RESEND_COOLDOWN);
      setTimeout(() => setResent(false), 4000);
    } catch (e: unknown) {
      setResentError(e instanceof Error ? e.message : "Failed to resend. Please try again.");
    } finally {
      setResending(false);
    }
  }

  const resendDisabled = countdown > 0 || resending;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.inner}>
        <EnvelopeIcon />

        <Text style={styles.heading}>Check your inbox.</Text>
        <Text style={styles.subheading}>We've sent a verification link to:</Text>

        {/* Email chip */}
        <View style={styles.emailChip}>
          <Text style={styles.emailText}>{email}</Text>
        </View>

        <Text style={styles.body}>
          Tap the link in the email to verify your address and complete registration.
          The link expires in 24 hours.
        </Text>

        {/* Success banner */}
        {resent && (
          <View style={styles.successBanner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Polyline points="20 6 9 17 4 12" stroke={colors.success} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.successText}>Email resent successfully</Text>
          </View>
        )}

        {!!resentError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{resentError}</Text>
          </View>
        )}

        {/* Resend button */}
        <Pressable
          style={[styles.outlineBtn, resendDisabled && styles.outlineBtnDisabled]}
          onPress={handleResend}
          disabled={resendDisabled}
        >
          {resending ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Text style={[styles.outlineLabel, resendDisabled && styles.outlineLabelDisabled]}>
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend email"}
            </Text>
          )}
        </Pressable>

        {/* Different account */}
        <Pressable style={styles.footerBtn} onPress={() => nav.navigate("Login")}>
          <Text style={styles.footerText}>Sign in with a different account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperWarm },
  inner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space[6],
    paddingVertical: space[8],
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.ink,
    marginBottom: space[1],
    textAlign: "center",
  },
  subheading: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base - 1,
    color: colors.mute,
    textAlign: "center",
    marginBottom: space[3],
  },
  emailChip: {
    borderWidth: 1,
    borderColor: colors.ghost,
    borderRadius: 9999,
    paddingHorizontal: space[5],
    paddingVertical: space[2],
    marginBottom: space[4],
  },
  emailText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
    marginBottom: space[5],
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[4],
    alignSelf: "stretch",
  },
  successText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.success,
  },
  errorBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: radius.lg,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    marginBottom: space[4],
    alignSelf: "stretch",
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.error,
    textAlign: "center",
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.ink,
    borderRadius: 9999,
    height: 48,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[4],
  },
  outlineBtnDisabled: { borderColor: colors.ghost },
  outlineLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  outlineLabelDisabled: { color: colors.ghost },
  footerBtn: { paddingVertical: space[3] },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    textDecorationLine: "underline",
  },
});
