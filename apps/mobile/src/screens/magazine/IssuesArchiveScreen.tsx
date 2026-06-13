import React, { useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useIssues, type MagazineIssue } from "../../features/magazine/useMagazine";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

// ── Past issue grid card ──────────────────────────────────────────────────────
function PastIssueCard({
  issue,
  onPress,
  styles,
}: {
  issue: MagazineIssue;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity style={styles.pastCard} onPress={onPress} activeOpacity={0.88}>
      {issue.coverImage ? (
        <Image source={{ uri: issue.coverImage }} style={styles.pastCardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.pastCardImage, styles.pastCardImagePlaceholder]} />
      )}
      <View style={styles.pastCardBody}>
        <Text style={styles.pastCardNumber}>Issue #{issue.number}</Text>
        <Text style={styles.pastCardTitle} numberOfLines={2}>
          {issue.title}
        </Text>
        <Text style={styles.pastCardMeta}>
          {issue.articleCount} articles · {issue.date}
        </Text>
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.pastCardLink}>Read →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function IssuesArchiveScreen() {
  const nav = useNavigation<any>();
  const { issues, loading, error } = useIssues();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const latestIssue = issues[0] ?? null;
  const pastIssues = issues.slice(1);

  if (loading && issues.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={c.gold} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && issues.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issues</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Latest Issue Hero Card */}
        {latestIssue ? (
          <View style={styles.heroCard}>
            {latestIssue.coverImage ? (
              <Image source={{ uri: latestIssue.coverImage }} style={styles.heroCardImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroCardImage, styles.heroCoverPlaceholder]} />
            )}
            {/* LATEST badge top-left of cover */}
            <View style={styles.latestBadge}>
              <Text style={styles.latestBadgeText}>LATEST</Text>
            </View>

            <View style={styles.heroCardBody}>
              <Text style={styles.heroIssueNumber}>Issue #{latestIssue.number}</Text>
              <Text style={styles.heroIssueTitle}>{latestIssue.title}</Text>
              {latestIssue.description ? (
                <Text style={styles.heroIssueDesc} numberOfLines={3}>
                  {latestIssue.description}
                </Text>
              ) : null}
              <TouchableOpacity>
                <Text style={styles.heroIssueLink}>Explore this issue →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Past Issues heading */}
        {pastIssues.length > 0 ? (
          <Text style={styles.pastHeading}>Past Issues</Text>
        ) : null}

        {/* 2-column grid */}
        {pastIssues.length > 0 ? (
          <View style={styles.grid}>
            {pastIssues.map((issue) => (
              <PastIssueCard key={issue.id} issue={issue} onPress={() => {}} styles={styles} />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },
    center: { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8] },
    errorText: { fontFamily: fonts.sans, color: c.ochre, textAlign: "center" },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: c.paper,
      paddingHorizontal: space[4],
      paddingVertical: space[3],
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
    },
    backBtn: { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
    backIcon: { fontSize: 28, color: c.ink, lineHeight: 32 },
    headerTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 18,
      color: c.ink,
      textAlign: "center",
      flex: 1,
    },
    headerSpacer: { width: 44 },

    // Latest issue hero card
    heroCard: {
      marginHorizontal: space[4],
      marginTop: space[4],
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      ...shadows.card,
      position: "relative",
    },
    heroCardImage: { width: "100%", height: 200, backgroundColor: c.ochre },
    heroCoverPlaceholder: { backgroundColor: c.ochre },
    latestBadge: {
      position: "absolute",
      top: 12,
      left: 12,
      backgroundColor: c.ochre,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    latestBadgeText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.eyebrow,
      color: "#FFFFFF",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    heroCardBody: { padding: space[4] },
    heroIssueNumber: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: c.ochre,
      textTransform: "uppercase",
      fontWeight: "700",
    },
    heroIssueTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 22,
      color: c.ink,
      marginTop: 4,
      lineHeight: 28,
    },
    heroIssueDesc: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      marginTop: 4,
      lineHeight: 20,
    },
    heroIssueLink: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ochre,
      marginTop: 8,
    },

    // Past issues
    pastHeading: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
      paddingHorizontal: space[4],
      paddingTop: space[5],
      paddingBottom: space[3],
    },
    grid: {
      paddingHorizontal: space[4],
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    pastCard: {
      width: "48%",
      backgroundColor: c.paper,
      borderRadius: radius.xl,
      overflow: "hidden",
      paddingBottom: 10,
      ...shadows.card,
    },
    pastCardImage: { width: "100%", height: 130, backgroundColor: c.paperDeep },
    pastCardImagePlaceholder: { backgroundColor: c.paperDeep },
    pastCardBody: { paddingHorizontal: 10, paddingTop: 10, flexDirection: "column" },
    pastCardNumber: {
      fontFamily: fonts.mono,
      fontSize: 10,
      color: c.ochre,
      textTransform: "uppercase",
      fontWeight: "700",
    },
    pastCardTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 13,
      color: c.ink,
      marginTop: 2,
      lineHeight: 18,
      minHeight: 36,
    },
    pastCardMeta: {
      fontFamily: fonts.sans,
      fontSize: 11,
      color: c.mute,
      marginTop: 2,
    },
    pastCardLink: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: c.ochre,
      marginTop: 4,
    },
  });
}
