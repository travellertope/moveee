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
  credits_variable?: boolean;
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

const TAB_INTRO: Record<Tab, string> = {
  credits: "Moveee Credits are your spendable currency — earn them by posting, engaging, and participating in the community. Redeem them for partner perks, or cash out to real money (Moveee Pro only, 40% fee). Credits reset daily up to the cap below.",
  reputation: "Points are your permanent standing in the Moveee community — they never decrease and can't be spent. Quality contributions earn points, which unlock higher tiers and exclusive privileges.",
};

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
    table: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      overflow: "hidden", marginBottom: space[5],
    },
    tableHeaderRow: {
      flexDirection: "row", backgroundColor: c.paperDeep,
      paddingVertical: space[2], paddingHorizontal: space[3],
    },
    tableHeaderCell: {
      fontFamily: fonts.sansBold, fontSize: fontSize.xs,
      color: c.mute, letterSpacing: 0.5, textTransform: "uppercase",
    },
    tableRow: {
      flexDirection: "row", alignItems: "center",
      paddingVertical: space[2] + 2, paddingHorizontal: space[3],
      borderTopWidth: 1, borderTopColor: c.rule,
    },
    tableActivityCell: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink, paddingRight: space[2] },
    tableNumCell: { width: 64, fontFamily: fonts.monoBold, fontSize: fontSize.sm, textAlign: "right" },
    tableCreditNum: { color: "#92400e", width: 78 },
    tableRepNum: { color: "#5b21b6" },
    tableDash: { color: c.ghost },
    loader: { padding: space[8], alignItems: "center" },
    errorBox: {
      backgroundColor: c.paperDeep, borderRadius: radius.md, padding: space[4],
      alignItems: "center", marginTop: space[2],
    },
    errorText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center" },
    retryBtn: { marginTop: space[3], paddingVertical: 6, paddingHorizontal: 14, borderRadius: radius.full, backgroundColor: c.ink },
    retryText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.paper },
  });
}

interface Props {
  visible: boolean;
  initialTab?: Tab;
  onClose: () => void;
}

export default function RewardsInfoSheet({ visible, initialTab = "credits", onClose }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const loadConfig = () => {
    setLoading(true);
    setLoadError(false);
    fetch(`${PROXY}/mobile/points-config`)
      .then((r) => {
        if (!r.ok) throw new Error(`points-config ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (!d || !Array.isArray(d.actions) || !Array.isArray(d.tiers)) {
          throw new Error("points-config malformed response");
        }
        setConfig(d);
      })
      .catch((e) => {
        console.warn("[RewardsInfoSheet] failed to load points-config:", e);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (visible && !config) loadConfig();
    if (visible) setTab(initialTab);
  }, [visible]);

  const breakdownRows = [...(config?.actions ?? [])].sort(
    (a, b) => (b.rep + b.credits) - (a.rep + a.credits)
  );

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
                  {t === "credits" ? "Credits" : "Points"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <View style={styles.loader}><ActivityIndicator color={c.ochre} /></View>
          ) : (
            <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.intro}>{TAB_INTRO[tab]}</Text>
              {loadError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>Couldn't load the rewards breakdown right now.</Text>
                  <TouchableOpacity style={styles.retryBtn} onPress={loadConfig} activeOpacity={0.8}>
                    <Text style={styles.retryText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
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
                  <Text style={styles.sectionTitle}>Spend Credits</Text>
                  {[
                    "Redeem partner perks in the Perks tab",
                    "Cash out to GBP/USD/NGN (Moveee Pro only)",
                  ].map((item) => (
                    <View key={item} style={styles.row}>
                      <Text style={styles.rowLabel}>{item}</Text>
                    </View>
                  ))}
                  <Text style={[styles.sectionTitle, { marginTop: space[5] }]}>Earn Credits &amp; Points</Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Activity</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableNumCell]}>Credits</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableNumCell]}>Points</Text>
                    </View>
                    {breakdownRows.map((a) => (
                      <View key={a.action} style={styles.tableRow}>
                        <Text style={styles.tableActivityCell}>{a.label}</Text>
                        <Text style={[styles.tableNumCell, styles.tableCreditNum, !a.credits && styles.tableDash]}>
                          {a.credits > 0 ? `${a.credits_variable ? "Up to " : ""}+${a.credits}` : "—"}
                        </Text>
                        <Text style={[styles.tableNumCell, styles.tableRepNum, !a.rep && styles.tableDash]}>
                          {a.rep > 0 ? `+${a.rep}` : "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.capBanner}>
                    <Ionicons name="trending-up" size={16} color="#5b21b6" />
                    <Text style={styles.capText}>
                      Points are <Text style={styles.capBold}>permanent</Text> — they never decrease and cannot be spent. They unlock higher tiers and privileges.
                    </Text>
                  </View>
                  <Text style={styles.sectionTitle}>Points Tiers</Text>
                  {(config?.tiers ?? []).map((tier) => (
                    <View key={tier.slug} style={styles.tierCard}>
                      <View style={styles.tierHeader}>
                        <Text style={styles.tierName}>{tier.label}</Text>
                        <Text style={styles.tierRep}>{tier.min_rep.toLocaleString()} PTS</Text>
                      </View>
                      <Text style={styles.tierPerks}>{tier.perks}</Text>
                      {tier.nomination_only && (
                        <View style={styles.nomChip}>
                          <Text style={styles.nomText}>Nomination only</Text>
                        </View>
                      )}
                    </View>
                  ))}
                  <Text style={[styles.sectionTitle, { marginTop: space[5] }]}>Earn Credits &amp; Points</Text>
                  <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Activity</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableNumCell]}>Credits</Text>
                      <Text style={[styles.tableHeaderCell, styles.tableNumCell]}>Points</Text>
                    </View>
                    {breakdownRows.map((a) => (
                      <View key={a.action} style={styles.tableRow}>
                        <Text style={styles.tableActivityCell}>{a.label}</Text>
                        <Text style={[styles.tableNumCell, styles.tableCreditNum, !a.credits && styles.tableDash]}>
                          {a.credits > 0 ? `${a.credits_variable ? "Up to " : ""}+${a.credits}` : "—"}
                        </Text>
                        <Text style={[styles.tableNumCell, styles.tableRepNum, !a.rep && styles.tableDash]}>
                          {a.rep > 0 ? `+${a.rep}` : "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
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
