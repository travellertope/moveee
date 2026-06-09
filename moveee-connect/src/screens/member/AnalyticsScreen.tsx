import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Line, Polyline, Circle, Text as SvgText } from "react-native-svg";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { AnalyticsData } from "../../types";

const PROXY = "https://themoveee.com/api";

// ── Bar chart (credits earned/spent) ─────────────────────────────────────────

function BarChart({ days }: { days: AnalyticsData["credit_days"] }) {
  const W = 320, H = 120, PAD = { l: 28, r: 8, t: 8, b: 24 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const recent = days.slice(-28);
  const maxVal = Math.max(1, ...recent.map((d) => Math.max(d.earned, d.spent)));
  const barW = Math.max(2, (chartW / (recent.length || 1)) - 2);

  return (
    <Svg width={W} height={H}>
      {/* Y gridlines */}
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.t + chartH * (1 - frac);
        return (
          <Line key={frac} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
            stroke={colors.rule} strokeWidth={1} />
        );
      })}
      {/* Bars */}
      {recent.map((d, i) => {
        const x = PAD.l + (i / recent.length) * chartW;
        const earnH = (d.earned / maxVal) * chartH;
        const spentH = (d.spent / maxVal) * chartH;
        return (
          <React.Fragment key={d.day}>
            <Rect x={x} y={PAD.t + chartH - earnH} width={barW} height={earnH}
              fill={colors.gold} opacity={0.85} />
            <Rect x={x + barW + 1} y={PAD.t + chartH - spentH} width={barW * 0.7} height={spentH}
              fill={colors.ochre} opacity={0.75} />
          </React.Fragment>
        );
      })}
      {/* X label (first + last) */}
      {recent.length > 0 && (
        <>
          <SvgText x={PAD.l} y={H - 6} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
            {recent[0].day.slice(5)}
          </SvgText>
          <SvgText x={W - PAD.r - 22} y={H - 6} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
            {recent[recent.length - 1].day.slice(5)}
          </SvgText>
        </>
      )}
      {/* Y max label */}
      <SvgText x={0} y={PAD.t + 8} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
        {maxVal}
      </SvgText>
    </Svg>
  );
}

// ── Line chart (reputation per month) ────────────────────────────────────────

function LineChart({ months }: { months: AnalyticsData["rep_months"] }) {
  const W = 320, H = 100, PAD = { l: 28, r: 8, t: 8, b: 24 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const maxVal = Math.max(1, ...months.map((m) => m.reputation));

  const pts = months.map((m, i) => {
    const x = PAD.l + (months.length > 1 ? (i / (months.length - 1)) : 0.5) * chartW;
    const y = PAD.t + chartH - (m.reputation / maxVal) * chartH;
    return { x, y, m };
  });

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <Svg width={W} height={H}>
      {[0, 0.5, 1].map((frac) => {
        const y = PAD.t + chartH * (1 - frac);
        return <Line key={frac} x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke={colors.rule} strokeWidth={1} />;
      })}
      {pts.length > 1 && (
        <Polyline points={polyline} fill="none" stroke={colors.gold} strokeWidth={2} />
      )}
      {pts.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3} fill={colors.gold} />
      ))}
      {pts.length > 0 && (
        <>
          <SvgText x={PAD.l} y={H - 6} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
            {pts[0].m.month.slice(5)}
          </SvgText>
          {pts.length > 1 && (
            <SvgText x={W - PAD.r - 16} y={H - 6} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
              {pts[pts.length - 1].m.month.slice(5)}
            </SvgText>
          )}
        </>
      )}
      <SvgText x={0} y={PAD.t + 8} fontSize={8} fill={colors.mute} fontFamily={fonts.mono}>
        {maxVal}
      </SvgText>
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const nav = useNavigation<any>();
  const [data, setData]     = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    api.get<AnalyticsData>(`${PROXY}/member/analytics`)
      .then(setData)
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Analytics</Text>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : data ? (
        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

          {/* Summary stats */}
          <View style={styles.statsGrid}>
            {[
              { label: "Balance",   value: `${data.balance} cr` },
              { label: "Reputation", value: String(data.reputation) },
              { label: "Published", value: String(data.posts_published) },
              { label: "Badges",    value: String(data.badge_count) },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Credits chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Culture Points (last 28 days)</Text>
            <View style={styles.legend}>
              <View style={[styles.legendDot, { backgroundColor: colors.gold }]} />
              <Text style={styles.legendText}>Earned</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.ochre }]} />
              <Text style={styles.legendText}>Spent</Text>
            </View>
            {data.credit_days.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart days={data.credit_days} />
              </ScrollView>
            ) : (
              <Text style={styles.noData}>No credit activity yet</Text>
            )}
          </View>

          {/* Reputation chart */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reputation earned per month</Text>
            {data.rep_months.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <LineChart months={data.rep_months} />
              </ScrollView>
            ) : (
              <Text style={styles.noData}>No reputation data yet</Text>
            )}
          </View>

          {/* Top posts */}
          {data.top_posts.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top posts (last 90 days)</Text>
              {data.top_posts.map((p, i) => (
                <View key={p.ID} style={styles.topPostRow}>
                  <View style={styles.topPostRank}>
                    <Text style={styles.topPostRankText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topPostTitle} numberOfLines={1}>{p.post_title}</Text>
                  <View style={styles.topPostMeta}>
                    <Ionicons name="heart-outline" size={11} color={colors.mute} />
                    <Text style={styles.topPostMetaText}>{p.reactions}</Text>
                    <Ionicons name="chatbubble-outline" size={11} color={colors.mute} />
                    <Text style={styles.topPostMetaText}>{p.comment_count}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  backBtn:     { padding: 4, marginRight: space[2] },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },

  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ochre },

  body: { padding: space[4], gap: space[4], paddingBottom: space[10] },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: space[3] },
  statCard: {
    flex: 1, minWidth: "44%",
    backgroundColor: colors.paperDeep, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.rule,
    padding: space[3], alignItems: "center",
  },
  statValue: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 2 },

  section: {
    backgroundColor: colors.paperDeep, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.rule,
    padding: space[3], gap: space[2],
  },
  sectionTitle: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, textTransform: "uppercase", letterSpacing: 0.8 },

  legend: { flexDirection: "row", alignItems: "center", gap: space[2] },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  noData: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ghost, textAlign: "center", paddingVertical: space[4] },

  topPostRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    paddingVertical: space[2],
    borderTopWidth: 1, borderTopColor: colors.rule,
  },
  topPostRank: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.gold, justifyContent: "center", alignItems: "center",
  },
  topPostRankText: { fontFamily: fonts.monoBold, fontSize: fontSize.tiny, color: "#fff" },
  topPostTitle:    { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ink, flex: 1 },
  topPostMeta:     { flexDirection: "row", alignItems: "center", gap: 3 },
  topPostMetaText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
});
