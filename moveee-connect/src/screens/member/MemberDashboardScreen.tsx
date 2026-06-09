import React from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Share,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const BADGE_LABELS: Record<string, string> = {
  "first_post":       "First Post",
  "verified":         "Verified",
  "culture_maker":    "Culture Maker",
  "tastemaker":       "Taste Maker",
  "community_builder":"Community Builder",
  "patron":           "Connect Pro",
  "referred_3":       "Referrer",
  "explorer":         "Explorer",
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

const QUICK_LINKS = [
  { icon: "wallet-outline",          label: "My Wallet",       screen: "Wallet" },
  { icon: "pricetag-outline",        label: "Partner Perks",   screen: "Perks" },
  { icon: "qr-code-outline",         label: "My Coupons",      screen: "Coupons" },
  { icon: "newspaper-outline",       label: "Magazine",        screen: "Magazine" },
  { icon: "settings-outline",        label: "Settings",        screen: "MemberSettings" },
  { icon: "mail-outline",            label: "Newsletters",     screen: "MemberSettings", tab: "newsletters" },
  { icon: "card-outline",            label: "Membership",      screen: "Membership" },
];

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export default function MemberDashboardScreen() {
  const nav = useNavigation<any>();
  const { user, logout } = useAuthStore();

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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: space[10] }}>

        {/* Hero */}
        <View style={styles.hero}>
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
          <Text style={styles.name}>{user.displayName}</Text>
          <View style={[styles.tierBadge, isPro ? styles.tierBadgePro : styles.tierBadgeCitizen]}>
            <Text style={[styles.tierBadgeText, isPro ? styles.tierBadgeTextPro : styles.tierBadgeTextCitizen]}>
              {isPro ? "CONNECT PRO" : "CONNECT CITIZEN"}
            </Text>
          </View>
          {user.city ? <Text style={styles.city}>{user.city}</Text> : null}
        </View>

        {/* Passkey banner */}
        {!user.hasPasskey && (
          <TouchableOpacity
            style={styles.passKeyBanner}
            onPress={() => nav.navigate("MemberSettings", { tab: "security" })}
          >
            <Text style={styles.passKeyBannerIcon}>🔑</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.passKeyBannerTitle}>Set up a passkey to unlock your rewards</Text>
              {user.creditsEscrowed > 0 && (
                <Text style={styles.passKeyBannerSub}>
                  You have {user.creditsEscrowed} credits waiting in escrow →
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Stats bar */}
        <View style={styles.statsBar}>
          {[
            { label: "Culture Points", value: user.credits ?? user.points ?? 0 },
            { label: "Reputation",     value: user.reputation ?? 0 },
            { label: "Badges",         value: (user.badges || []).length },
            { label: "Daily Credits",  value: user.dailyCreditsRemaining ?? 0 },
          ].map((stat, i) => (
            <View key={stat.label} style={[styles.statItem, i > 0 && styles.statItemBorder]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Upgrade CTA (Citizens only) */}
        {!isPro && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => nav.navigate("Membership")}>
            <Text style={styles.upgradeBannerTitle}>Upgrade to Connect Pro</Text>
            <Text style={styles.upgradeBannerSub}>Unlock gated content, perks, and early access →</Text>
          </TouchableOpacity>
        )}

        {/* Badges grid */}
        {(user.badges || []).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>YOUR BADGES</Text>
            <View style={styles.badgesGrid}>
              {(user.badges || []).slice(0, 8).map((badge) => (
                <View key={badge} style={styles.badgeItem}>
                  <Text style={styles.badgeEmoji}>🏅</Text>
                  <Text style={styles.badgeLabel}>{BADGE_LABELS[badge] ?? badge}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Referral */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>YOUR REFERRAL LINK</Text>
          <View style={styles.referralRow}>
            <Text style={styles.referralCode} numberOfLines={1}>
              themoveee.com/register?ref={user.referralCode}
            </Text>
            <TouchableOpacity style={styles.shareBtn} onPress={handleCopyReferral}>
              <Ionicons name="share-outline" size={18} color={colors.gold} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick links */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>QUICK LINKS</Text>
          <View style={styles.menuCard}>
            {QUICK_LINKS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => nav.navigate(item.screen, item.tab ? { tab: item.tab } : undefined)}
              >
                <Ionicons name={item.icon as never} size={20} color={colors.ink} />
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.ghost} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.menuItem, styles.menuItemLast]} onPress={logout}>
              <Ionicons name="log-out-outline" size={20} color={colors.ochre} />
              <Text style={[styles.menuLabel, { color: colors.ochre }]}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* How to Earn table */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>HOW TO EARN</Text>
          <View style={styles.earnTable}>
            <View style={[styles.earnRow, styles.earnHeader]}>
              <Text style={[styles.earnCell, styles.earnActionCell, styles.earnHeaderText]}>Action</Text>
              <Text style={[styles.earnCell, styles.earnHeaderText]}>CR</Text>
              <Text style={[styles.earnCell, styles.earnHeaderText]}>REP</Text>
            </View>
            {EARN_TABLE.map((row, i) => (
              <View key={i} style={[styles.earnRow, i % 2 === 0 && styles.earnRowAlt]}>
                <Text style={[styles.earnCell, styles.earnActionCell, styles.earnActionText]}>{row.action}</Text>
                <Text style={[styles.earnCell, styles.earnAmountText]}>{row.cr}</Text>
                <Text style={[styles.earnCell, styles.earnAmountText]}>{row.rep}</Text>
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  hero: {
    alignItems: "center", paddingHorizontal: space[4], paddingTop: space[6], paddingBottom: space[4], gap: space[2],
  },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.rule, marginBottom: space[1] },
  avatarPro:     { borderWidth: 2, borderColor: colors.gold },
  avatarCitizen: { borderWidth: 1, borderColor: colors.rule },
  avatarFallback: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.ink, justifyContent: "center", alignItems: "center",
  },
  avatarFallbackText: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.paperWarm },
  name: { fontFamily: fonts.serifBold, fontSize: fontSize['2xl'], color: colors.ink },
  tierBadge: {
    borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 3,
  },
  tierBadgePro:     { backgroundColor: colors.gold },
  tierBadgeCitizen: { backgroundColor: "rgba(243,236,224,0.12)", borderWidth: 1, borderColor: colors.rule },
  tierBadgeText: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, letterSpacing: 2 },
  tierBadgeTextPro:     { color: colors.ink },
  tierBadgeTextCitizen: { color: colors.mute },
  city: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 1 },

  passKeyBanner: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    marginHorizontal: space[4], marginBottom: space[3],
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.lg, padding: space[3],
  },
  passKeyBannerIcon: { fontSize: 24 },
  passKeyBannerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  passKeyBannerSub:   { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.gold, marginTop: 2 },

  statsBar: {
    flexDirection: "row",
    marginHorizontal: space[4], marginBottom: space[4],
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule, borderRadius: radius.lg,
    overflow: "hidden",
  },
  statItem: { flex: 1, alignItems: "center", paddingVertical: space[3] },
  statItemBorder: { borderLeftWidth: 1, borderLeftColor: colors.rule },
  statValue: { fontFamily: fonts.sansBold, fontSize: fontSize.md, color: colors.ink },
  statLabel: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1, textTransform: "uppercase", textAlign: "center", marginTop: 2 },

  upgradeBanner: {
    marginHorizontal: space[4], marginBottom: space[4],
    backgroundColor: colors.ink, borderRadius: radius.lg, padding: space[4],
  },
  upgradeBannerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.gold, marginBottom: 4 },
  upgradeBannerSub:   { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.paperWarm },

  section: { marginHorizontal: space[4], marginBottom: space[4] },
  sectionLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.eyebrow, letterSpacing: 2,
    color: colors.mute, textTransform: "uppercase", marginBottom: space[2],
  },

  badgesGrid: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  badgeItem: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, padding: space[2], alignItems: "center", gap: 4,
    minWidth: 72,
  },
  badgeEmoji: { fontSize: 20 },
  badgeLabel: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute, textAlign: "center" },

  referralRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[2],
  },
  referralCode: { flex: 1, fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.inkSoft },
  shareBtn: { padding: 4 },

  menuCard: { backgroundColor: colors.paper, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.rule },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: space[3], paddingHorizontal: space[4], paddingVertical: space[3] + 2,
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink },

  earnTable: { backgroundColor: colors.paper, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.rule },
  earnHeader: { backgroundColor: colors.paperDeep },
  earnRow: { flexDirection: "row", alignItems: "flex-start", paddingHorizontal: space[3], paddingVertical: space[2], borderBottomWidth: 1, borderBottomColor: colors.rule },
  earnRowAlt: { backgroundColor: colors.paperWarm + "88" },
  earnCell: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.inkSoft, paddingHorizontal: 2 },
  earnActionCell: { flex: 1 },
  earnAmountText: { width: 36, textAlign: "center", fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold },
  earnHeaderText: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, letterSpacing: 1, color: colors.mute, textTransform: "uppercase" },
  earnActionText: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.inkSoft },
});
