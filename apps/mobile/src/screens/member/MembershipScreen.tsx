import React, { useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { openInApp } from "../../utils/openInApp";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { fonts, fontSize, space, radius } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";

const CITIZEN_PERKS = [
  "Pulse feed & community posts",
  "Member directory listing",
  "All events — online & in-person",
  "GetMeLit & Culture Drop newsletters",
  "1 game play per day",
  "50 culture credits per day",
  "Culture points & badges",
];

const PRO_PERKS = [
  "Everything in Connect Citizen, plus:",
  "Patron-only articles & editorials",
  "10% off in the Moveee Shop",
  "Early access to new product drops",
  "Cash out your credits",
  "100 culture credits per day",
  "5 game plays per day",
  "Poll & itinerary post templates",
  "Connect Pro badge on profile & posts",
  "Early access to new features",
];

export default function MembershipScreen() {
  const nav = useNav();
  const { user, isAuthenticated } = useAuthStore();
  const isPro = user?.tier === "patron";

  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const handleUpgrade = () => {
    openInApp("https://web.themoveee.com/register?upgrade=patron");
  };

  const handleJoinFree = () => {
    nav.navigate("Register");
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Membership</Text>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Choose the plan that works for you.</Text>

        <View style={styles.card}>
          <Text style={styles.cardEyebrow}>FREE FOREVER</Text>
          <Text style={styles.cardName}>Connect Citizen</Text>
          <View style={styles.divider} />
          {CITIZEN_PERKS.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Ionicons name="checkmark" size={15} color={c.mute} />
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
                color={p.startsWith("Everything") ? c.mute : c.gold}
              />
              <Text style={[styles.perkText, !p.startsWith("Everything") && styles.perkTextPro]}>
                {p}
              </Text>
            </View>
          ))}
          {isPro ? (
            <View style={[styles.currentPlanBadge, styles.currentPlanBadgePro]}>
              <Text style={[styles.currentPlanText, { color: c.gold }]}>Your current plan</Text>
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

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paperWarm,
    },
    backBtn:     { padding: 4, marginRight: space[2] },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink },

    body: { padding: space[4], gap: space[4], paddingBottom: space[10] },

    intro: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center" },

    card: {
      backgroundColor: c.paper, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.rule,
      padding: space[5], gap: space[2],
    },
    proCard: { borderWidth: 2, borderColor: c.gold },

    cardEyebrow: {
      fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
      letterSpacing: 1.8, textTransform: "uppercase", color: c.mute,
    },
    proEyebrowRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
    proEyebrow: { color: c.gold },
    proStar: { color: c.gold, fontSize: fontSize.base },

    cardName: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: c.ink },
    proPrice: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: c.mute },

    divider: { height: 1, backgroundColor: c.rule, marginVertical: space[1] },

    perkRow: { flexDirection: "row", alignItems: "flex-start", gap: space[2] },
    perkText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft, flex: 1, lineHeight: 20 },
    perkTextPro: { color: c.ink },

    currentPlanBadge: {
      marginTop: space[2], paddingVertical: space[2], paddingHorizontal: space[3],
      backgroundColor: c.paperDeep, borderRadius: radius.md, alignItems: "center",
      borderWidth: 1, borderColor: c.rule,
    },
    currentPlanBadgePro: { backgroundColor: c.goldLight, borderColor: c.goldBorder },
    currentPlanText: { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: c.mute, letterSpacing: 1 },

    ctaSecondary: {
      marginTop: space[2], paddingVertical: space[2], alignItems: "center",
    },
    ctaSecondaryText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.mute },

    ctaPro: {
      marginTop: space[2], backgroundColor: c.ink, borderRadius: radius.md,
      paddingVertical: space[3], alignItems: "center",
    },
    ctaProText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    footnote: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.ghost, textAlign: "center", lineHeight: 16 },
  });
}
