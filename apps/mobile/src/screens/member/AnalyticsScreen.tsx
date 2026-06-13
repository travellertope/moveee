import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Svg, {
  Rect, Line, Polyline, Path, Circle,
  Text as SvgText, Defs, LinearGradient, Stop,
} from "react-native-svg";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { AnalyticsData } from "../../types";

const PROXY = "https://themoveee.com/api";
const RUST  = "#9B3C2A";

// ── Bar chart (credits earned vs spent) ──────────────────────────────────────

function BarChart({ days }: { days: AnalyticsData["credit_days"] }) {
  const W = 300, H = 160;
  const PAD = { l: 20, r: 4, t: 8, b: 20 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const recent = days.slice(-30);
  const maxVal = Math.max(60, ...recent.map((d) => Math.max(d.earned, d.spent)));
  const groupW = chartW / (recent.length || 1);
  const barW   = Math.max(4, groupW * 0.38);

  // Y-axis guide values
  const yLabels = [0, Math.round(maxVal / 3), Math.round((maxVal * 2) / 3), maxVal];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {/* Y gridlines + labels */}
      {yLabels.map((val) => {
        const y = PAD.t + chartH - (val / maxVal) * chartH;
        return (
          <React.Fragment key={val}>
            <Line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke={y === PAD.t + chartH ? colors.ghost : colors.ghost}
              strokeWidth={y === PAD.t + chartH ? 1 : 0.5}
              strokeDasharray={y === PAD.t + chartH ? undefined : "2,4"} />
            <SvgText x={PAD.l - 2} y={y + 4} fontSize={9} fill={colors.mute}
              textAnchor="end" fontFamily={fonts.mono}>{val}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Bars */}
      {recent.map((d, i) => {
        const cx = PAD.l + (i + 0.5) * groupW;
        const earnH = (d.earned / maxVal) * chartH;
        const spentH = (d.spent / maxVal) * chartH;
        const baseY = PAD.t + chartH;
        return (
          <React.Fragment key={d.day}>
            <Rect x={cx - barW - 1} y={baseY - earnH} width={barW} height={Math.max(1, earnH)}
              fill={colors.ochre} rx={2} />
            <Rect x={cx + 1} y={baseY - spentH} width={barW} height={Math.max(0, spentH)}
              fill={RUST} rx={2} />
          </React.Fragment>
        );
      })}

      {/* X-axis labels (start, mid, end) */}
      {recent.length > 0 && (() => {
        const labelIdx = [0, Math.floor(recent.length / 2), recent.length - 1];
        return labelIdx.map((i) => {
          const d = recent[i];
          const cx = PAD.l + (i + 0.5) * groupW;
          const label = d.day.slice(5).replace("-", "/");
          return (
            <SvgText key={i} x={cx} y={H - 4} fontSize={9} fill={colors.mute}
              textAnchor="middle" fontFamily={fonts.mono}>{label}</SvgText>
          );
        });
      })()}
    </Svg>
  );
}

// ── Line chart (reputation per month) ────────────────────────────────────────

function LineChart({ months }: { months: AnalyticsData["rep_months"] }) {
  const W = 300, H = 140;
  const PAD = { l: 22, r: 4, t: 20, b: 20 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const maxVal = Math.max(100, ...months.map((m) => m.reputation));

  const pts = months.map((m, i) => {
    const x = PAD.l + (months.length > 1 ? (i / (months.length - 1)) : 0.5) * chartW;
    const y = PAD.t + chartH - (m.reputation / maxVal) * chartH;
    return { x, y, m };
  });

  const linePath  = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath  = pts.length > 1
    ? `M ${pts[0].x} ${PAD.t + chartH} ${pts.map((p) => `L ${p.x} ${p.y}`).join(" ")} L ${pts[pts.length - 1].x} ${PAD.t + chartH} Z`
    : "";

  const yLabels = [0, Math.round(maxVal / 4), Math.round(maxVal / 2), Math.round((maxVal * 3) / 4), maxVal];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.gold} stopOpacity="0.18" />
          <Stop offset="1" stopColor={colors.gold} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>

      {/* Y gridlines + labels */}
      {yLabels.map((val) => {
        const y = PAD.t + chartH - (val / maxVal) * chartH;
        return (
          <React.Fragment key={val}>
            <Line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y}
              stroke={colors.ghost}
              strokeWidth={y === PAD.t + chartH ? 1 : 0.5}
              strokeDasharray={y === PAD.t + chartH ? undefined : "2,4"} />
            <SvgText x={PAD.l - 2} y={y + 4} fontSize={9} fill={colors.mute}
              textAnchor="end" fontFamily={fonts.mono}>{val}</SvgText>
          </React.Fragment>
        );
      })}

      {/* Area fill */}
      {areaPath ? <Path d={areaPath} fill="url(#areaGrad)" /> : null}

      {/* Line */}
      {pts.length > 1 && (
        <Polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none" stroke={colors.gold} strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round" />
      )}

      {/* Dots */}
      {pts.map((p, i) => {
        const isLast = i === pts.length - 1;
        return (
          <React.Fragment key={i}>
            {isLast && (
              <Line x1={p.x} y1={p.y} x2={p.x} y2={PAD.t + chartH}
                stroke={colors.gold} strokeWidth={1.5} strokeDasharray="3,3" />
            )}
            <Circle cx={p.x} cy={p.y} r={isLast ? 5 : 4}
              fill={colors.gold} stroke="#FFFFFF" strokeWidth={isLast ? 2 : 1.5} />
            {isLast && (
              <>
                <Rect x={p.x - 28} y={p.y - 22} width={56} height={20} rx={10} fill={colors.gold} />
                <SvgText x={p.x} y={p.y - 8} fontSize={9} fill="#FFFFFF"
                  textAnchor="middle" fontFamily={fonts.mono} fontWeight="bold">
                  {p.m.reputation} REP
                </SvgText>
              </>
            )}
          </React.Fragment>
        );
      })}

      {/* X labels */}
      {pts.map((p, i) => (
        <SvgText key={i} x={p.x} y={H - 4} fontSize={9} fill={colors.mute}
          textAnchor="middle" fontFamily={fonts.mono}>
          {p.m.month.slice(5)}
        </SvgText>
      ))}
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AnalyticsScreen() {
  const nav = useNavigation<any>();
  const [data,    setData]    = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get<AnalyticsData>(`${PROXY}/member/analytics`)
      .then(setData)
      .catch(() => setError("Could not load analytics."))
      .finally(() => setLoading(false));
  }, []);

  // Get current month label for the credits chart
  const monthLabel = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Analytics</Text>
        <View style={styles.headerSideBtn} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.gold} /></View>
      ) : error ? (
        <View style={styles.center}><Text style={styles.errorText}>{error}</Text></View>
      ) : data ? (
        <ScrollView
          contentContainerStyle={styles.body}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary stats — single row card with 4 columns */}
          <View style={styles.statsCard}>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={[styles.statValue, { color: colors.ochre }]}>
                {data.balance.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Credits</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={[styles.statValue, { color: colors.gold }]}>
                {data.reputation.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Reputation</Text>
            </View>
            <View style={[styles.statCol, styles.statColBorder]}>
              <Text style={[styles.statValue, { color: colors.ink }]}>
                {data.posts_published}
              </Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={[styles.statValue, { color: colors.ink }]}>
                {data.badge_count}
              </Text>
              <Text style={styles.statLabel}>Badges</Text>
            </View>
          </View>

          {/* Credits chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Credits · Last 30 Days</Text>
              <Text style={styles.sectionSub}>{monthLabel}</Text>
            </View>
            <View style={styles.chartCard}>
              {data.credit_days.length > 0 ? (
                <BarChart days={data.credit_days} />
              ) : (
                <Text style={styles.noData}>No credit activity yet</Text>
              )}
              {/* Legend */}
              <View style={styles.legend}>
                <View style={[styles.legendSwatch, { backgroundColor: colors.ochre }]} />
                <Text style={styles.legendText}>Earned</Text>
                <View style={[styles.legendSwatch, { backgroundColor: RUST }]} />
                <Text style={styles.legendText}>Spent</Text>
              </View>
            </View>
          </View>

          {/* Reputation chart */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Reputation · Last 6 Months</Text>
            </View>
            <View style={styles.chartCard}>
              {data.rep_months.length > 0 ? (
                <LineChart months={data.rep_months} />
              ) : (
                <Text style={styles.noData}>No reputation data yet</Text>
              )}
            </View>
          </View>

          {/* Top posts */}
          {data.top_posts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Posts · Last 90 days</Text>
              </View>
              <View style={styles.chartCard}>
                {data.top_posts.map((p, i) => (
                  <View
                    key={p.ID}
                    style={[styles.postRow, i < data.top_posts.length - 1 && styles.postRowBorder]}
                  >
                    <Text style={styles.postRank}>{i + 1}.</Text>
                    <View style={styles.postBody}>
                      <Text style={styles.postTitle} numberOfLines={2}>{p.post_title}</Text>
                      <View style={styles.postMetaRow}>
                        <Text style={styles.postMeta}>❤️{p.reactions} · 💬{p.comment_count}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], backgroundColor: colors.paper,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  headerSideBtn:  { minWidth: 44, minHeight: 44, justifyContent: "center" },
  headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },

  center:    { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ochre },

  body: { padding: 16, gap: 24, paddingBottom: 48 },

  // Summary stats card
  statsCard: {
    backgroundColor: colors.paper, borderRadius: 12, ...shadows.card,
    flexDirection: "row", padding: 16,
  },
  statCol: { flex: 1, alignItems: "center" },
  statColBorder: { borderRightWidth: 1, borderRightColor: colors.ghost + "80" },
  statValue: { fontFamily: fonts.sansBold, fontSize: 22, lineHeight: 26, marginBottom: 4 },
  statLabel: {
    fontFamily: fonts.sansBold, fontSize: 9, color: colors.mute,
    textTransform: "uppercase", letterSpacing: 1.2,
  },

  // Sections
  section:      { gap: 8 },
  sectionHeader:{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 2 },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  sectionSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },

  chartCard: { backgroundColor: colors.paper, borderRadius: 12, padding: 16, ...shadows.card },

  // Chart legend
  legend: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 8 },
  legendSwatch: { width: 12, height: 12, borderRadius: 2 },
  legendText:   { fontFamily: fonts.sans, fontSize: 11, color: colors.mute },

  noData: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ghost, textAlign: "center", paddingVertical: 24 },

  // Top posts
  postRow:       { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingVertical: 12 },
  postRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.ghost },
  postRank:      { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ochre, width: 24, flexShrink: 0 },
  postBody:      { flex: 1, gap: 6 },
  postTitle:     { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft, lineHeight: 18 },
  postMetaRow:   { alignItems: "flex-end" },
  postMeta:      { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },
});
