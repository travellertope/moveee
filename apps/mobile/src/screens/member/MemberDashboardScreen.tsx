import React, { useState } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import { SignOutDialog } from "../../components/ui/Overlays";

const BADGE_LABELS: Record<string, string> = {
  "first_post":        "First Post",
  "verified":          "Verified",
  "culture_maker":     "Culture Maker",
  "tastemaker":        "Taste Maker",
  "community_builder": "Community Builder",
  "patron":            "Connect Pro",
  "referred_3":        "Referrer",
  "explorer":          "Explorer",
};

const EARN_TABLE = [
  { action: "Post validated (5+ reactions or 3+ comments)", cr: "+10", rep: "+5" },
  { action: "Hidden Gem / Food Review validated",           cr: "+15", rep: "+10" },
  { action: "Event RSVP",                                   cr: "+1",  rep: "+5" },
  { action: "Event check-in",                               cr: "+2",  rep: "+15" },
  { action: "Refer a member",                               cr: "+3",  rep: "+25" },
  { action: "Newsletter comment",                           cr: "+1",  rep: "+10" },
  { action: "Share a quote",                                cr: "+1",  rep: "+10" },
  { action: "Quote liked",                                  cr: "—",   rep: "+1" },
  { action: "Read magazine",                                cr: "+1",  rep: "+5" },
  { action: "Share magazine",                               cr: "+1",  rep: "+5" },
  { action: "Directory entry",                              cr: "+2",  rep: "+15" },
  { action: "Game completed",                               cr: "+1",  rep: "+5" },
];

const FIGMA_EARN_ROWS = [
  { action: "Publish a post",  cr: "+10", rep: "+5"  },
  { action: "Get 5 reactions", cr: "+5",  rep: "+2"  },
  { action: "Leave a comment", cr: "+2",  rep: "+1"  },
  { action: "Win daily game",  cr: "+30", rep: "0"   },
  { action: "Refer a friend",  cr: "+50", rep: "+10" },
];

const QUICK_LINKS = [
  { emoji: "💰", label: "Wallet",      screen: "Wallet" },
  { emoji: "🎁", label: "Perks",       screen: "Perks" },
  { emoji: "🎟️", label: "Coupons",     screen: "Coupons" },
  { emoji: "📊", label: "Analytics",   screen: "Analytics" },
  { emoji: "📖", label: "Magazine",    screen: "Magazine" },
  { emoji: "⚙️", label: "Settings",    screen: "MemberSettings" },
  { emoji: "📧", label: "Newsletters", screen: "MemberSettings", tab: "newsletters" },
  { emoji: "💎", label: "Membership",  screen: "Membership" },
];

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatMemberSince(registeredAt?: number): string | null {
  if (!registeredAt) return null;
  const d = new Date(registeredAt * 1000);
  const month = d.toLocaleString("default", { month: "long" });
  const year = d.getFullYear();
  return `Member since ${month} ${year}`;
}

export default function MemberDashboardScreen() {
  const nav = useNavigation<any>();
  const { user, logout } = useAuthStore();
  const [earnExpanded, setEarnExpanded] = useState(true);
  const [signOutVisible, setSignOutVisible] = useState(false);

  if (!user) return null;

  const isPro = user.tier === "patron";

  const handleCopyReferral = async () => {
    const link = `https://themoveee.com/register?ref=${user.referralCode}`;
    try {
      await Share.share({ message: link });
    } catch {
      // silent
    }
  };

  const memberSince = formatMemberSince(user.registeredAt);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <View style={styles.headerCenter}>
          <Text style={styles.headerWordmark}>moveee</Text>
          <Text style={styles.headerSub}>connect</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={() => setSignOutVisible(true)}>
          <Text style={styles.headerSignOut}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card 1: Hero Profile */}
        <View style={styles.card}>
          <View style={styles.heroRow}>
            {user.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={[styles.avatar, isPro ? styles.avatarPro : styles.avatarCitizen]}
              />
            ) : (
              <View style={[styles.avatarFallback, isPro ? styles.avatarPro : styles.avatarCitizen]}>
                <Text style={styles.avatarFallbackText}>{initials(user.displayName)}</Text>
              </View>
            )}
            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={1}>{user.displayName}</Text>
              {isPro ? (
                <View style={styles.tierBadgePro}>
                  <Text style={styles.tierTextPro}>★ CONNECT PRO</Text>
                </View>
              ) : (
                <View style={styles.tierBadgeCitizen}>
                  <Text style={styles.tierTextCitizen}>CONNECT CITIZEN</Text>
                </View>
              )}
              {user.city ? (
                <Text style={styles.heroCity}>📍 {user.city}</Text>
              ) : null}
              {memberSince ? (
                <Text style={styles.heroMemberSince}>{memberSince}</Text>
              ) : null}
            </View>
          </View>
        </View>

        {/* Card 2: Passkey Banner */}
        {!user.hasPasskey && (
          <TouchableOpacity
            style={styles.passKeyBanner}
            onPress={() => nav.navigate("MemberSettings", { tab: "security" })}
          >
            <Ionicons name="finger-print-outline" size={20} color={colors.ochre} />
            <View style={styles.passKeyBannerBody}>
              <Text style={styles.passKeyBannerTitle}>Set up passkey login</Text>
              <Text style={styles.passKeyBannerSub}>
                {user.creditsEscrowed > 0
                  ? `You have ${user.creditsEscrowed} credits waiting in escrow →`
                  : "Log in faster with biometrics"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.ink} />
          </TouchableOpacity>
        )}

        {/* Card 3: Stats Bar */}
        <View style={[styles.card, styles.statsCard]}>
          {[
            { label: "Credits",    value: user.credits ?? 0,                  accent: isPro ? colors.ochre : colors.ink },
            { label: "Reputation", value: user.reputation ?? 0,               accent: isPro ? colors.gold  : colors.ink },
            { label: "Badges",     value: (user.badges || []).length,          accent: colors.ink },
            { label: "Daily Left", value: user.dailyCreditsRemaining ?? 0,    accent: colors.ink },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.statItem, i > 0 && styles.statItemBorder]}>
              <Text style={[styles.statValue, { color: stat.accent }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Card 4: Upgrade Banner (Citizen only) */}
        {!isPro && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => nav.navigate("Membership")}>
            <View style={styles.upgradeBannerLeft}>
              <Text style={styles.upgradeBannerTitle}>Upgrade to Connect Pro</Text>
              <Text style={styles.upgradeBannerSub}>Unlock perks, earn more</Text>
            </View>
            <View style={styles.upgradeBtn}>
              <Text style={styles.upgradeBtnText}>Upgrade →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Card 5: Badges */}
        {(user.badges || []).length > 0 && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardHeaderLabel}>My Badges</Text>
              <Text style={styles.cardHeaderAction}>See all →</Text>
            </View>
            <View style={styles.badgesRow}>
              {(user.badges || []).slice(0, 6).map((badge) => (
                <View key={badge} style={styles.badgePill}>
                  <Text style={styles.badgePillEmoji}>🏅</Text>
                  <Text style={styles.badgePillLabel}>{BADGE_LABELS[badge] ?? badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Card 6: Referral Link */}
        <TouchableOpacity style={[styles.card, styles.referralCard]} onPress={handleCopyReferral}>
          <Ionicons name="link-outline" size={20} color={colors.ochre} />
          <Text style={styles.referralText} numberOfLines={1}>
            moveee.com/r/{user.username}
          </Text>
          <Ionicons name="copy-outline" size={20} color={colors.mute} />
        </TouchableOpacity>

        {/* Card 7: Quick Links Menu */}
        <View style={[styles.card, styles.menuCard]}>
          {QUICK_LINKS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, i === QUICK_LINKS.length - 1 && styles.menuItemLast]}
              onPress={() => nav.navigate(item.screen as never, item.tab ? { tab: item.tab } : undefined)}
            >
              <Text style={styles.menuEmoji}>{item.emoji}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.ghost} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Card 8: How to Earn Points */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.earnHeaderRow}
            onPress={() => setEarnExpanded((v) => !v)}
          >
            <Text style={styles.cardHeaderLabel}>How to Earn Points</Text>
            <Ionicons
              name={earnExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.ghost}
            />
          </TouchableOpacity>
          {earnExpanded && (
            <View style={styles.earnTableWrap}>
              <View style={styles.earnColHeaderRow}>
                <Text style={[styles.earnColHeader, { flex: 1 }]}>Action</Text>
                <Text style={[styles.earnColHeader, styles.earnAmountCol]}>CR</Text>
                <Text style={[styles.earnColHeader, styles.earnAmountCol]}>REP</Text>
              </View>
              {FIGMA_EARN_ROWS.map((row, i) => (
                <View
                  key={i}
                  style={[styles.earnRow, i % 2 === 0 ? styles.earnRowEven : styles.earnRowOdd]}
                >
                  <Text style={[styles.earnCell, { flex: 1 }]}>{row.action}</Text>
                  <Text style={[styles.earnAmountCell, styles.earnAmountCol, { color: colors.ochre }]}>
                    {row.cr}
                  </Text>
                  <Text style={[
                    styles.earnAmountCell,
                    styles.earnAmountCol,
                    { color: row.rep === "0" ? colors.mute : colors.gold },
                  ]}>
                    {row.rep}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <SignOutDialog
        visible={signOutVisible}
        onCancel={() => setSignOutVisible(false)}
        onConfirm={() => { setSignOutVisible(false); logout(); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paperWarm,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule + "50",
    paddingHorizontal: 16,
  },
  headerSpacer: { width: 60 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  headerWordmark: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 20,
  },
  headerSub: {
    fontFamily: fonts.sansBold,
    fontSize: 8,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 2,
    marginTop: 2,
  },
  headerRight: { width: 60, alignItems: "flex-end" },
  headerSignOut: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ochre,
  },

  /* ── ScrollView ── */
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },

  /* ── Generic card ── */
  card: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    marginHorizontal: 16,
    ...shadows.card,
  },

  /* ── Card 1: Hero ── */
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.rule,
  },
  avatarPro: {
    borderWidth: 3,
    borderColor: colors.gold,
    padding: 2,
  },
  avatarCitizen: {
    borderWidth: 2,
    borderColor: colors.ghost,
    padding: 2,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarFallbackText: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.paper,
  },
  heroInfo: {
    marginLeft: 16,
    gap: 8,
    flex: 1,
  },
  heroName: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 22,
  },
  tierBadgePro: {
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  tierTextPro: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.gold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tierBadgeCitizen: {
    backgroundColor: colors.paperDeep,
    borderWidth: 1,
    borderColor: colors.ghost,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  tierTextCitizen: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: colors.mute,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroCity: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  heroMemberSince: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.ghost,
  },

  /* ── Card 2: Passkey Banner ── */
  passKeyBanner: {
    backgroundColor: colors.paperDeep,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.ochre,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    ...shadows.card,
  },
  passKeyBannerBody: {
    flex: 1,
    marginLeft: 10,
    gap: 2,
  },
  passKeyBannerTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
  },
  passKeyBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
  },

  /* ── Card 3: Stats Bar ── */
  statsCard: {
    flexDirection: "row",
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statItemBorder: {
    borderLeftWidth: 1,
    borderLeftColor: colors.ghost,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: colors.ink,
  },
  statLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    textTransform: "uppercase",
    color: colors.mute,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: "center",
  },

  /* ── Card 4: Upgrade Banner ── */
  upgradeBanner: {
    backgroundColor: colors.ochre,
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    ...shadows.card,
  },
  upgradeBannerLeft: { flex: 1, gap: 4 },
  upgradeBannerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: colors.paper,
  },
  upgradeBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
  },
  upgradeBtn: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "white",
    borderRadius: 9999,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  upgradeBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.paper,
  },

  /* ── Card header row (shared by Badges + Earn) ── */
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cardHeaderLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
  },
  cardHeaderAction: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ochre,
  },

  /* ── Card 5: Badges ── */
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 16,
    paddingTop: 12,
  },
  badgePill: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.ghost,
    borderRadius: 9999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  badgePillEmoji: { fontSize: 14 },
  badgePillLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    color: colors.ink,
  },

  /* ── Card 6: Referral ── */
  referralCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  referralText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.inkSoft,
  },

  /* ── Card 7: Quick Links ── */
  menuCard: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    overflow: "hidden",
  },
  menuItem: {
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.ghost,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuEmoji: { fontSize: 20, width: 20, textAlign: "center" },
  menuLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.ink,
    marginLeft: 16,
    flex: 1,
  },

  /* ── Card 8: Earn Table ── */
  earnHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 8,
  },
  earnTableWrap: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  earnColHeaderRow: {
    flexDirection: "row",
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  earnColHeader: {
    fontFamily: fonts.monoBold,
    fontSize: 10,
    color: colors.mute,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  earnAmountCol: {
    width: 50,
    textAlign: "right",
  },
  earnRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 4,
  },
  earnRowEven: { backgroundColor: colors.paperDeep },
  earnRowOdd:  { backgroundColor: colors.paper },
  earnCell: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.ink,
  },
  earnAmountCell: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    textAlign: "right",
  },
});
