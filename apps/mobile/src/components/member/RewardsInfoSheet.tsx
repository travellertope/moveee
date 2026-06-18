import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Modal, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const PROXY = "https://themoveee.com/api";
const SHEET_MAX_H = Dimensions.get("window").height * 0.85;

interface Action {
  action: string;
  label: string;
  rep: number;
  credits: number;
}

interface Tier {
  slug: string;
  label: string;
  min_rep: number;
  perks: string;
  nomination_only?: boolean;
}

interface PointsConfig {
  actions: Action[];
  tiers: Tier[];
  daily_cap: number;
}

type Tab = "credits" | "reputation";

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    backdropTap: { flex: 1 },
    sheet: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      height: SHEET_MAX_H,
    },
    handle: {
      width: 36, height: 4, borderRadius: 2,
      backgroundColor: c.rule, alignSelf: "center", marginTop: 10,
    },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    title: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink },
    closeBtn: { padding: 4 },
    tabs: {
      flexDirection: "row",
      borderBottomWidth: 1, borderBottomColor: c.rule,
      paddingHorizontal: space[4],
    },
    tab: {
      paddingVertical: space[3], paddingHorizontal: space[4],
      marginRight: space[2], borderBottomWidth: 2, borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: c.ochre },
    tabText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    tabTextActive: { fontFamily: fonts.sansBold, color: c.ink },
    scroll: { flex: 1, padding: space[4] },
    intro: {
      fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft,
      lineHeight: 20, marginBottom: space[4],
    },
    capBanner: {
      backgroundColor: c.paperDeep,
      borderRadius: radius.md, padding: space[3],
      marginBottom: space[4], flexDirection: "row", alignItems: "center", gap: space[2],
    },
    capText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink, flex: 1 },
    capBold: { fontFamily: fonts.sansBold },
    sectionTitle: {
      fontFamily: fonts.sansBold, fontSize: fontSize.xs,
      color: c.mute, letterSpacing: 0.8, textTransform: "uppercase",
      marginBottom: space[2], marginTop: space[1],
    },
    row: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    rowLabel: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink },
    badge: {
      borderRadius: radius.sm, paddingHorizontal: 8, paddingVertical: 3,
      minWidth: 44, alignItems: "center", marginLeft: space[2],
    },
    badgeCredit: { backgroundColor: "#fef3c7" },
    badgeRep: { backgroundColor: "#ede9fe" },
    badgeText: { fontFamily: fonts.monoBold, fontSize: 11 },
    badgeCreditText: { color: "#92400e" },
    badgeRepText: { color: "#5b21b6" },
    tierCard: {
      borderRadius: radius.lg, padding: space[3],
      marginBottom: space[3],
      borderWidth: 1, borderColor: c.rule,
      backgroundColor: c.paperDeep,
    },
    tierHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
    tierName: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    tierRep: { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: c.mute },
    tierPerks: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    nomChip: {
      backgroundColor: "#fef9c3", borderRadius: radius.sm,
      paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start", marginTop: 4,
    },
    nomText: { fontFamily: fonts.sans, fontSize: 10, color: "#854d0e" },
    loader: { padding: space[8], alignItems: "center" },
  });
}

interface Props {
  visible: boolean;
  initialTab?: Tab;
  intro?: string;
  onClose: () => void;
}

export default function RewardsInfoSheet({ visible, initialTab = "credits", intro, onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && !config) {
      setLoading(true);
      fetch(`${PROXY}/mobile/points-config`)
        .then((r) => r.json())
        .then((d) => setConfig(d))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (visible) setTab(initialTab);
  }, [visible]);

  const creditActions = config?.actions.filter((a) => a.credits > 0) ?? [];
  const repActions = config?.actions.filter((a) => a.rep > 0) ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdropTap} activeOpacity={1} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>How Rewards Work</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={c.mute} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            {(["credits", "reputation"] as Tab[]).map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
                <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                  {t === "credits" ? "Credits" : "Reputation"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loader}><ActivityIndicator color={c.ochre} /></View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              {intro ? <Text style={styles.intro}>{intro}</Text> : null}
              {tab === "credits" ? (
                <>
                  <View style={styles.capBanner}>
                    <Ionicons name="flash" size={16} color="#92400e" />
                    <Text style={styles.capText}>
                      Daily cap:{" "}
                      <Text style={styles.capBold}>{config?.daily_cap ?? 50} credits</Text>
                      {" "}— resets at midnight UTC.
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Earn Credits</Text>
                  {creditActions.map((a) => (
                    <View key={a.action} style={styles.row}>
                      <Text style={styles.rowLabel}>{a.label}</Text>
                      <View style={[styles.badge, styles.badgeCredit]}>
                        <Text style={[styles.badgeText, styles.badgeCreditText]}>+{a.credits}</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.sectionTitle, { marginTop: space[5] }]}>Spend Credits</Text>
                  {[
                    "Redeem partner perks in the Perks tab",
                    "Cash out to GBP/USD/NGN (Connect Pro only)",
                  ].map((item) => (
                    <View key={item} style={styles.row}>
                      <Text style={styles.rowLabel}>{item}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <>
                  <View style={styles.capBanner}>
                    <Ionicons name="trending-up" size={16} color="#5b21b6" />
                    <Text style={styles.capText}>
                      Reputation is <Text style={styles.capBold}>permanent</Text> — it never decreases and cannot be spent. It unlocks higher tiers and privileges.
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Earn Reputation</Text>
                  {repActions.map((a) => (
                    <View key={a.action} style={styles.row}>
                      <Text style={styles.rowLabel}>{a.label}</Text>
                      <View style={[styles.badge, styles.badgeRep]}>
                        <Text style={[styles.badgeText, styles.badgeRepText]}>+{a.rep} REP</Text>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.sectionTitle, { marginTop: space[5] }]}>Reputation Tiers</Text>
                  {(config?.tiers ?? []).map((tier) => (
                    <View key={tier.slug} style={styles.tierCard}>
                      <View style={styles.tierHeader}>
                        <Text style={styles.tierName}>{tier.label}</Text>
                        <Text style={styles.tierRep}>{tier.min_rep.toLocaleString()} REP</Text>
                      </View>
                      <Text style={styles.tierPerks}>{tier.perks}</Text>
                      {tier.nomination_only && (
                        <View style={styles.nomChip}>
                          <Text style={styles.nomText}>Nomination only</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </>
              )}
              <SafeAreaView edges={["bottom"]} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}
