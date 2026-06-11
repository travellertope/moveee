import React from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const CITIZEN_PERKS = [
  "Pulse feed & community posts",
  "Member directory listing",
  "Online event access",
  "GetMeLit & Culture Drop newsletters",
  "Culture points & badges",
];

const PRO_PERKS = [
  "Everything in Connect Citizen, plus:",
  "Connect Pro badge on posts",
  "Exclusive gated content & editorials",
  "Early access to product drops",
  "Pro pricing on Moveee Shop",
  "Early access to new features",
];

export default function MembershipScreen() {
  const nav = useNavigation<any>();
  const { user, isAuthenticated } = useAuthStore();
  const isPro = user?.tier === "patron";

  const handleUpgrade = () => {
    Linking.openURL("https://themoveee.com/register?upgrade=patron");
  };

  const handleJoinFree = () => {
    nav.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Choose the plan that works for you.</Text>

        {/* Citizen card */}
        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>FREE FOREVER</Text>
          <Text style={styles.cardName}>Connect Citizen</Text>
          <View style={styles.divider} />
          {CITIZEN_PERKS.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Ionicons name="checkmark" size={15} color={colors.mute} />
              <Text style={styles.perkText}>{p}</Text>
            </View>
          ))}
          {isAuthenticated && !isPro ? (
            <View style={styles.currentPlanBadge}>
              <Text style={styles.currentPlanText}>Your current plan</Text>
            </View>
          ) : !isAuthenticated ? (
            <TouchableOpacity style={styles.ctaSecondary} onPress={handleJoinFree}>
              <Text style={styles.ctaSecondaryText}>Join free →</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Pro card */}
        <View style={[styles.card, styles.proCard]}>
          <View style={styles.proEyebrowRow}>
            <Text style={[styles.cardEyebrow, styles.proEyebrow]}>CONNECT PRO</Text>
            <Text style={styles.proStar}>★</Text>
          </View>
          <Text style={styles.cardName}>Connect Pro</Text>
          <Text style={styles.proPrice}>Upgrade on the web</Text>
          <View style={styles.divider} />
          {PRO_PERKS.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Ionicons
                name="checkmark"
                size={15}
                color={p.startsWith("Everything") ? colors.mute : colors.gold}
              />
              <Text style={[styles.perkText, !p.startsWith("Everything") && styles.perkTextPro]}>
                {p}
              </Text>
            </View>
          ))}
          {isPro ? (
            <View style={[styles.currentPlanBadge, styles.currentPlanBadgePro]}>
              <Text style={[styles.currentPlanText, { color: colors.gold }]}>Your current plan</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.ctaPro} onPress={handleUpgrade}>
              <Text style={styles.ctaProText}>Upgrade →</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.footnote}>
          Upgrades are managed on the web. Tap "Upgrade →" to open your browser and complete the purchase.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.paperWarm,
  },
  backBtn:     { padding: 4, marginRight: space[2] },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },

  body: { padding: space[4], gap: space[4], paddingBottom: space[10] },

  intro: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute, textAlign: "center" },

  card: {
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.rule,
    padding: space[5], gap: space[2],
  },
  proCard: { borderWidth: 2, borderColor: colors.gold },

  cardEyebrow: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    letterSpacing: 1.8, textTransform: "uppercase", color: colors.mute,
  },
  proEyebrowRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
  proEyebrow: { color: colors.gold },
  proStar: { color: colors.gold, fontSize: fontSize.base },

  cardName: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: colors.ink },
  proPrice: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.mute },

  divider: { height: 1, backgroundColor: colors.rule, marginVertical: space[1] },

  perkRow: { flexDirection: "row", alignItems: "flex-start", gap: space[2] },
  perkText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft, flex: 1, lineHeight: 20 },
  perkTextPro: { color: colors.ink },

  currentPlanBadge: {
    marginTop: space[2], paddingVertical: space[2], paddingHorizontal: space[3],
    backgroundColor: colors.paperDeep, borderRadius: radius.md, alignItems: "center",
    borderWidth: 1, borderColor: colors.rule,
  },
  currentPlanBadgePro: { backgroundColor: colors.goldLight, borderColor: colors.goldBorder },
  currentPlanText: { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 1 },

  ctaSecondary: {
    marginTop: space[2], paddingVertical: space[2], alignItems: "center",
  },
  ctaSecondaryText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.mute },

  ctaPro: {
    marginTop: space[2], backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: space[3], alignItems: "center",
  },
  ctaProText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  footnote: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost, textAlign: "center", lineHeight: 16 },
});
