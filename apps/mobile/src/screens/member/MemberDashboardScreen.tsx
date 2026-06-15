import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, Share, Alert, Animated, Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { useThemeStore } from "../../store/themeStore";
import RewardsInfoSheet from "../../components/member/RewardsInfoSheet";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const LOGO_LIGHT = require("../../../assets/logo-black.png");
const LOGO_DARK  = require("../../../assets/logo-white.png");
const LOGO_H = 26;
const LOGO_W = Math.round((717 / 107) * LOGO_H);
import { SignOutDialog } from "../../components/ui/Overlays";

// ── Reputation tiers ──────────────────────────────────────────────────────────

const REP_TIERS = [
  { label: "Member",             min: 0,     max: 500   },
  { label: "Culture Contributor",min: 500,   max: 2500  },
  { label: "Taste Maker",        min: 2500,  max: 10000 },
  { label: "Culture Authority",  min: 10000, max: 25000 },
  { label: "Culture Icon",       min: 25000, max: null  },
] as const;

function getRepTier(rep: number) {
  return [...REP_TIERS].reverse().find((t) => rep >= t.min) ?? REP_TIERS[0];
}

function ReputationBar({ reputation, c, styles }: {
  reputation: number; c: ColorPalette; styles: ReturnType<typeof createStyles>;
}) {
  const tier = getRepTier(reputation);
  const pct  = tier.max ? Math.min(1, (reputation - tier.min) / (tier.max - tier.min)) : 1;
  const next = REP_TIERS.find((t) => t.min > reputation);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 700, delay: 200, useNativeDriver: false }).start();
  }, [pct]);

  return (
    <View style={styles.repBar}>
      <View style={styles.repBarRow}>
        <Text style={styles.repTierLabel}>{tier.label}</Text>
        <Text style={styles.repScore}>{reputation} REP</Text>
      </View>
      <View style={styles.repTrack}>
        <Animated.View style={[styles.repFill, { width: anim.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }) }]} />
      </View>
      <Text style={styles.repNext}>
        {next ? `${tier.max! - reputation} to ${next.label}` : "Highest tier reached ✦"}
      </Text>
    </View>
  );
}

// ── Badge icon-only with tooltip ─────────────────────────────────────────────

const BADGE_META: Record<string, { emoji: string; name: string; bg: string; ring: string }> = {
  // posting & content
  first_post:           { emoji: "📝", name: "First Post",          bg: "#FEF9C3", ring: "#CA8A04" },
  post_validated:       { emoji: "✅", name: "Validated Post",       bg: "#D1FAE5", ring: "#059669" },
  hidden_gem:           { emoji: "💎", name: "Hidden Gem",           bg: "#EDE9FE", ring: "#7C3AED" },
  food_critic:          { emoji: "🍽️", name: "Food Critic",          bg: "#FCE7F3", ring: "#BE185D" },
  book_reviewer:        { emoji: "📚", name: "Book Reviewer",        bg: "#F0FDF4", ring: "#15803D" },
  creative_showcase:    { emoji: "🎨", name: "Creative Showcase",    bg: "#F3E8FF", ring: "#9333EA" },
  culture_maker:        { emoji: "🎨", name: "Culture Maker",        bg: "#F3E8FF", ring: "#7C3AED" },
  quote_sharer:         { emoji: "💬", name: "Quote Sharer",         bg: "#FEF3C7", ring: "#D97706" },
  itinerary_maker:      { emoji: "🗺️", name: "Itinerary Maker",      bg: "#D1FAE5", ring: "#065F46" },
  // community & social
  community_builder:    { emoji: "🏗️", name: "Community Builder",    bg: "#FEE2E2", ring: "#DC2626" },
  connector:            { emoji: "🔗", name: "Connector",            bg: "#DBEAFE", ring: "#2563EB" },
  referred_1:           { emoji: "🤝", name: "First Referral",       bg: "#D1FAE5", ring: "#16A34A" },
  referred_3:           { emoji: "🤝", name: "Referrer",             bg: "#D1FAE5", ring: "#059669" },
  referred_10:          { emoji: "🌟", name: "Super Referrer",       bg: "#FEF9C3", ring: "#CA8A04" },
  // profile & account
  verified:             { emoji: "✅", name: "Verified",             bg: "#D1FAE5", ring: "#059669" },
  profile_complete:     { emoji: "🪪",  name: "Profile Complete",     bg: "#EDE9FE", ring: "#7C3AED" },
  passkey_set:          { emoji: "🔐", name: "Passkey Set",          bg: "#DBEAFE", ring: "#1D4ED8" },
  // tier & status
  patron:               { emoji: "⭐", name: "Connect Pro",          bg: "#FEF9C3", ring: "#B45309" },
  tastemaker:           { emoji: "✨", name: "Taste Maker",           bg: "#FEF3C7", ring: "#D97706" },
  culture_contributor:  { emoji: "🏆", name: "Culture Contributor",  bg: "#FEE2E2", ring: "#B91C1C" },
  culture_authority:    { emoji: "👑", name: "Culture Authority",    bg: "#FEF9C3", ring: "#92400E" },
  culture_icon:         { emoji: "🦁", name: "Culture Icon",         bg: "#1C1917", ring: "#CA8A04" },
  // participation
  explorer:             { emoji: "🧭", name: "Explorer",             bg: "#E0F2FE", ring: "#0369A1" },
  event_goer:           { emoji: "🎟️", name: "Event Goer",           bg: "#FCE7F3", ring: "#9D174D" },
  event_checkin:        { emoji: "📍", name: "Checked In",           bg: "#FEE2E2", ring: "#DC2626" },
  directory_contributor:{ emoji: "🗂️", name: "Directory Contributor",bg: "#E0F2FE", ring: "#075985" },
  game_winner:          { emoji: "🎮", name: "Game Winner",          bg: "#D1FAE5", ring: "#065F46" },
  streak_7:             { emoji: "🔥", name: "7-Day Streak",         bg: "#FEE2E2", ring: "#DC2626" },
  streak_30:            { emoji: "💥", name: "30-Day Streak",        bg: "#FEF9C3", ring: "#B45309" },
  // newsletter
  newsletter_reader:    { emoji: "📰", name: "Newsletter Reader",    bg: "#F0FDF4", ring: "#15803D" },
  newsletter_commenter: { emoji: "✍️", name: "Newsletter Commenter", bg: "#FEF3C7", ring: "#D97706" },
};

function slugToName(slug: string): string {
  return slug
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Deterministic colour from slug for unknown badges
const FALLBACK_PALETTES: Array<{ bg: string; ring: string }> = [
  { bg: "#FEF3C7", ring: "#D97706" }, { bg: "#D1FAE5", ring: "#059669" },
  { bg: "#DBEAFE", ring: "#2563EB" }, { bg: "#FCE7F3", ring: "#BE185D" },
  { bg: "#EDE9FE", ring: "#7C3AED" }, { bg: "#E0F2FE", ring: "#0369A1" },
];
function fallbackPalette(slug: string): { bg: string; ring: string } {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) & 0xfffffff;
  return FALLBACK_PALETTES[h % FALLBACK_PALETTES.length];
}

function BadgeIcons({ badges, styles }: { badges: string[]; styles: ReturnType<typeof createStyles> }) {
  const [tooltip, setTooltip] = useState<{ emoji: string; name: string; bg: string; ring: string } | null>(null);
  if (!badges.length) return null;
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingHorizontal: 16, paddingBottom: 16, paddingTop: 4 }}
      >
        {badges.map((slug) => {
          const known = BADGE_META[slug];
          const { bg, ring } = known ?? fallbackPalette(slug);
          const name  = known?.name  ?? slugToName(slug);
          return (
            <TouchableOpacity
              key={slug}
              style={[styles.badgeIconBtn, { backgroundColor: bg, borderColor: ring }]}
              onPress={() => setTooltip({ emoji: "ribbon", name, bg, ring })}
              activeOpacity={0.75}
            >
              <Ionicons name="ribbon" size={24} color={ring} />
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <Modal visible={!!tooltip} transparent animationType="fade" onRequestClose={() => setTooltip(null)}>
        <TouchableOpacity style={styles.tooltipOverlay} activeOpacity={1} onPress={() => setTooltip(null)}>
          <View style={styles.tooltipBox}>
            <Ionicons name="ribbon" size={48} color={tooltip?.ring ?? "#B38238"} />
            <Text style={styles.tooltipName}>{tooltip?.name}</Text>
            <Text style={styles.tooltipHint}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}


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
  { emoji: "🔖", label: "Saved",       screen: "SavedArticles" },
  { emoji: "📊", label: "Analytics",   screen: "Analytics" },
  { emoji: "🔗", label: "Refer a Friend", screen: "Referral" },
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
  const [rewardsSheet, setRewardsSheet] = useState<{ visible: boolean; tab: "credits" | "reputation" }>({ visible: false, tab: "credits" });
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const isDark = mode === "dark" || (mode === "system" && systemScheme === "dark");

  if (!user) return null;

  const isPro = user.tier === "patron";

  const handleCopyReferral = async () => {
    const link = `https://connect.themoveee.com/register?ref=${user.referralCode}`;
    try {
      await Share.share({
        message: `Join me on Moveee — the community for people who live for culture. Use my link: ${link}`,
        url: link,
      });
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
          <Image
            source={isDark ? LOGO_DARK : LOGO_LIGHT}
            style={{ width: LOGO_W, height: LOGO_H }}
            resizeMode="contain"
          />
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
            <Ionicons name="finger-print-outline" size={20} color={c.ochre} />
            <View style={styles.passKeyBannerBody}>
              <Text style={styles.passKeyBannerTitle}>Set up passkey login</Text>
              <Text style={styles.passKeyBannerSub}>
                {user.creditsEscrowed > 0
                  ? `You have ${user.creditsEscrowed} credits waiting in escrow →`
                  : "Log in faster with biometrics"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.ink} />
          </TouchableOpacity>
        )}

        {/* Card 3: Stats Bar */}
        <View style={[styles.card, styles.statsCard]}>
          {/* Credits — with info tooltip */}
          <TouchableOpacity
            style={styles.statItem}
            onPress={() => setRewardsSheet({ visible: true, tab: "credits" })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, { color: isPro ? c.ochre : c.ink }]}>{user.credits ?? 0}</Text>
            <Text style={styles.statLabel}>Credits <Text style={styles.infoIcon}>ⓘ</Text></Text>
          </TouchableOpacity>

          {/* Reputation — with info sheet */}
          <TouchableOpacity
            style={[styles.statItem, styles.statItemBorder]}
            onPress={() => setRewardsSheet({ visible: true, tab: "reputation" })}
            activeOpacity={0.7}
          >
            <Text style={[styles.statValue, { color: isPro ? c.gold : c.ink }]}>{user.reputation ?? 0}</Text>
            <Text style={styles.statLabel}>Reputation <Text style={styles.infoIcon}>ⓘ</Text></Text>
          </TouchableOpacity>

          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={[styles.statValue, { color: c.ink }]}>{(user.badges || []).length}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>

          <View style={[styles.statItem, styles.statItemBorder]}>
            <Text style={[styles.statValue, { color: c.ink }]}>{user.dailyCreditsRemaining ?? 0}</Text>
            <Text style={styles.statLabel}>Daily Left</Text>
          </View>
        </View>

        {/* Reputation bar */}
        <View style={[styles.card, { paddingHorizontal: 16, paddingVertical: 14 }]}>
          <ReputationBar reputation={user.reputation ?? 0} c={c} styles={styles} />
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
            <View style={[styles.cardHeaderRow, { paddingBottom: 4 }]}>
              <Text style={styles.cardHeaderLabel}>My Badges</Text>
              <Text style={styles.badgeCount}>{(user.badges || []).length} earned</Text>
            </View>
            <BadgeIcons badges={user.badges || []} styles={styles} />
          </View>
        )}

        {/* Card 6: Referral Link */}
        <View style={[styles.card, { padding: 0, overflow: "hidden" }]}>
          <TouchableOpacity
            style={[styles.referralCard, { borderBottomWidth: 1, borderBottomColor: c.rule }]}
            onPress={() => nav.navigate("Referral" as never)}
            activeOpacity={0.85}
          >
            <Ionicons name="people-outline" size={20} color={c.ochre} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.referralText, { marginBottom: 1 }]} numberOfLines={1}>
                Refer a friend · {user.referralCount ?? 0} joined
              </Text>
              <Text style={{ fontFamily: "monospace", fontSize: 11, color: c.mute }} numberOfLines={1}>
                connect.themoveee.com/r/{user.referralCode || user.username}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={c.ghost} />
          </TouchableOpacity>
          <TouchableOpacity
            style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, paddingHorizontal: 14 }}
            onPress={handleCopyReferral}
            activeOpacity={0.8}
          >
            <Ionicons name="share-social-outline" size={16} color={c.ochre} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre }}>
              Share my referral link
            </Text>
          </TouchableOpacity>
        </View>

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
              <Ionicons name="chevron-forward" size={12} color={c.ghost} />
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
              color={c.ghost}
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
                  <Text style={[styles.earnAmountCell, styles.earnAmountCol, { color: c.ochre }]}>
                    {row.cr}
                  </Text>
                  <Text style={[
                    styles.earnAmountCell,
                    styles.earnAmountCol,
                    { color: row.rep === "0" ? c.mute : c.gold },
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
      <RewardsInfoSheet
        visible={rewardsSheet.visible}
        initialTab={rewardsSheet.tab}
        onClose={() => setRewardsSheet((s) => ({ ...s, visible: false }))}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) { return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.paperWarm,
  },

  /* ── Header ── */
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    backgroundColor: c.paper,
    borderBottomWidth: 1,
    borderBottomColor: c.rule + "50",
    paddingHorizontal: 16,
  },
  headerSpacer: { width: 60 },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: { width: 60, alignItems: "flex-end" },
  headerSignOut: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.ochre,
  },

  /* ── ScrollView ── */
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 120,
    gap: 12,
  },

  /* ── Generic card ── */
  card: {
    backgroundColor: c.paper,
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
    backgroundColor: c.rule,
  },
  avatarPro: {
    borderWidth: 3,
    borderColor: c.gold,
    padding: 2,
  },
  avatarCitizen: {
    borderWidth: 2,
    borderColor: c.ghost,
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
    color: c.paper,
  },
  heroInfo: {
    marginLeft: 16,
    gap: 8,
    flex: 1,
  },
  heroName: {
    fontFamily: fonts.serifBold,
    fontSize: 22,
    color: c.ink,
    lineHeight: 22,
  },
  tierBadgePro: {
    backgroundColor: c.goldLight,
    borderWidth: 1,
    borderColor: c.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  tierTextPro: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: c.gold,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  tierBadgeCitizen: {
    backgroundColor: c.paperDeep,
    borderWidth: 1,
    borderColor: c.ghost,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    alignSelf: "flex-start",
  },
  tierTextCitizen: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    color: c.mute,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroCity: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.mute,
  },
  heroMemberSince: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: c.ghost,
  },

  /* ── Card 2: Passkey Banner ── */
  passKeyBanner: {
    backgroundColor: c.paperDeep,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: c.ochre,
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
    color: c.ink,
  },
  passKeyBannerSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: c.mute,
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
    borderLeftColor: c.ghost,
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 20,
    color: c.ink,
  },
  statLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 9,
    textTransform: "uppercase",
    color: c.mute,
    letterSpacing: 1,
    marginTop: 4,
    textAlign: "center",
  },
  infoIcon: {
    fontSize: 13,
    color: "#b34a2e",
    textTransform: "none" as const,
  },

  /* ── Card 4: Upgrade Banner ── */
  upgradeBanner: {
    backgroundColor: c.ochre,
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
    color: c.paper,
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
    color: c.paper,
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
    color: c.ink,
  },
  cardHeaderAction: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: c.ochre,
  },

  /* ── Reputation bar ── */
  repBar:      { width: "100%" },
  repBarRow:   { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  repTierLabel:{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
  repScore:    { fontFamily: fonts.mono, fontSize: 12, color: c.ochre },
  repTrack:    { height: 6, backgroundColor: c.ghost, borderRadius: 3, overflow: "hidden" },
  repFill:     { height: 6, backgroundColor: c.ochre, borderRadius: 3 },
  repNext:     { fontFamily: fonts.mono, fontSize: 10, color: c.mute, marginTop: 5 },

  /* ── Card 5: Badges (icon-only horizontal scroll) ── */
  badgeCount: {
    fontFamily: fonts.mono, fontSize: 11, color: c.mute,
  },
  badgeIconBtn: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2,
    justifyContent: "center", alignItems: "center",
  },
  badgeIconEmoji: { fontSize: 24 },

  /* ── Badge tooltip modal ── */
  tooltipOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" },
  tooltipBox:     { backgroundColor: c.paper, borderRadius: 18, paddingHorizontal: 32, paddingVertical: 24, alignItems: "center", gap: 8, minWidth: 180, ...shadows.modal },
  tooltipEmoji:   { fontSize: 44 },
  tooltipName:    { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, textAlign: "center" },
  tooltipHint:    { fontFamily: fonts.mono, fontSize: 10, color: c.ghost, textAlign: "center" },

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
    color: c.inkSoft,
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
    borderBottomColor: c.ghost,
  },
  menuItemLast: { borderBottomWidth: 0 },
  menuEmoji: { fontSize: 20, width: 20, textAlign: "center" },
  menuLabel: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: c.ink,
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
    color: c.mute,
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
  earnRowEven: { backgroundColor: c.paperDeep },
  earnRowOdd:  { backgroundColor: c.paper },
  earnCell: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: c.ink,
  },
  earnAmountCell: {
    fontFamily: fonts.sansBold,
    fontSize: 12,
    textAlign: "right",
  },
}); }
