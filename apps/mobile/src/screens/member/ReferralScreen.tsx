import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Share, TextInput, ActivityIndicator, Clipboard,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";

interface ReferredUser {
  username: string;
  displayName: string;
  joinedAt: number;
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  referralCount: number;
  repPerReferral: number;
  creditsPerReferral: number;
  referredUsers: ReferredUser[];
  connectorThreshold: number;
  superConnectorThreshold: number;
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },
    scroll: { padding: space[4], paddingBottom: 40, gap: 16 },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl,
      ...shadows.card,
    },
    cardHeader: {
      fontFamily: fonts.sansBold, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
    },
    linkBox: {
      flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 12,
    },
    linkInput: {
      flex: 1, backgroundColor: c.paperDeep, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.rule, paddingHorizontal: 12,
      paddingVertical: 10, fontFamily: fonts.mono, fontSize: 12, color: c.ink,
    },
    copyBtn: {
      borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: c.ink, justifyContent: "center", alignItems: "center",
    },
    copyBtnSuccess: { backgroundColor: c.success ?? "#2D6A4F" },
    copyBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },
    shortUrl: {
      fontFamily: fonts.mono, fontSize: 12, color: c.mute,
      paddingHorizontal: 16, paddingBottom: 14,
    },
    shareBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      marginHorizontal: 16, marginBottom: 16, paddingVertical: 12,
      borderRadius: radius.xl, borderWidth: 1, borderColor: c.ochre, gap: 8,
    },
    shareBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre },
    statsRow: { flexDirection: "row", gap: 12 },
    statCard: {
      flex: 1, backgroundColor: c.paperWarm, borderRadius: radius.xl,
      padding: 16, alignItems: "center", ...shadows.card,
    },
    statValue: {
      fontFamily: fonts.serifBold, fontSize: 28, color: c.ochre,
    },
    statLabel: {
      fontFamily: fonts.mono, fontSize: 10, color: c.mute,
      textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4, textAlign: "center",
    },
    badgeRow: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },
    badgeName: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    badgeSub: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    progressTrack: {
      height: 6, borderRadius: 99, backgroundColor: c.paperDeep, marginTop: 6, overflow: "hidden",
    },
    progressFill: { height: "100%" as any, borderRadius: 99 },
    nudge: {
      fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft,
      paddingHorizontal: 16, paddingBottom: 16, lineHeight: 20,
    },
    listEmpty: {
      fontFamily: fonts.sans, fontSize: 14, color: c.mute,
      padding: 16, textAlign: "center",
    },
    referredRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    referredName: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    referredUsername: { fontFamily: fonts.mono, fontSize: 12, color: c.mute },
    referredTime: { fontFamily: fonts.mono, fontSize: 12, color: c.ghost },
    howRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingBottom: 12, alignItems: "flex-start" },
    howNum: {
      width: 28, height: 28, borderRadius: 14, backgroundColor: c.ochre,
      justifyContent: "center", alignItems: "center", flexShrink: 0,
    },
    howNumText: { fontFamily: fonts.monoBold, fontSize: 12, color: c.paper },
    howText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1, lineHeight: 20 },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  });
}

export default function ReferralScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<ReferralData>(`${MOBILE_API}/user/referrals`);
        setData(res);
      } catch {
        // fallback: build from user store
        if (user?.referralCode) {
          setData({
            referralCode: user.referralCode,
            referralUrl: `https://connect.themoveee.com/register?ref=${user.referralCode}`,
            referralCount: user.referralCount ?? 0,
            repPerReferral: 30,
            creditsPerReferral: 5,
            referredUsers: [],
            connectorThreshold: 3,
            superConnectorThreshold: 10,
          });
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCopy = () => {
    if (!data?.referralUrl) return;
    Clipboard.setString(data.referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!data?.referralUrl) return;
    try {
      await Share.share({
        message: `Join me on Moveee — the community for people who live for culture. Use my link: ${data.referralUrl}`,
        url: data.referralUrl,
      });
    } catch { /* user cancelled */ }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.ochre} />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Refer a Friend</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingWrap}>
          <Text style={{ color: c.mute, fontSize: 14 }}>Unable to load referral data.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    referralUrl, referralCode, referralCount, repPerReferral, creditsPerReferral,
    referredUsers, connectorThreshold, superConnectorThreshold,
  } = data;

  const connectorPct = Math.min(100, (referralCount / connectorThreshold) * 100);
  const superPct = Math.min(100, (referralCount / superConnectorThreshold) * 100);
  const nextBadge = referralCount < connectorThreshold
    ? { label: "Connector", target: connectorThreshold }
    : referralCount < superConnectorThreshold
    ? { label: "Super Connector", target: superConnectorThreshold }
    : null;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer a Friend</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Share link card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Your Referral Link</Text>
          <View style={styles.linkBox}>
            <TextInput
              style={styles.linkInput}
              value={referralUrl}
              editable={false}
              selectTextOnFocus
              numberOfLines={1}
            />
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={handleCopy}
              activeOpacity={0.8}
            >
              <Text style={styles.copyBtnText}>{copied ? "✓" : "Copy"}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.shortUrl}>Short link: connect.themoveee.com/r/{referralCode}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={18} color={c.ochre} />
            <Text style={styles.shareBtnText}>Share via WhatsApp / DMs</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{referralCount}</Text>
            <Text style={styles.statLabel}>Friends{"\n"}referred</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>+{referralCount * repPerReferral}</Text>
            <Text style={styles.statLabel}>Rep{"\n"}earned</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>+{referralCount * creditsPerReferral}</Text>
            <Text style={styles.statLabel}>Credits{"\n"}earned</Text>
          </View>
        </View>

        {/* Badge progress */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Badge Progress</Text>
          <View style={styles.badgeRow}>
            {[
              { label: "🔗 Connector", target: connectorThreshold, pct: connectorPct },
              { label: "⚡ Super Connector", target: superConnectorThreshold, pct: superPct },
            ].map(({ label, target, pct }) => (
              <View key={label}>
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Text style={styles.badgeName}>{label}</Text>
                  <Text style={styles.badgeSub}>
                    {Math.min(referralCount, target)}/{target}
                    {referralCount >= target ? " ✓" : ""}
                  </Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[
                    styles.progressFill,
                    { width: `${pct}%`, backgroundColor: pct >= 100 ? "#2D6A4F" : c.ochre },
                  ]} />
                </View>
              </View>
            ))}
          </View>
          {nextBadge && (
            <Text style={styles.nudge}>
              Refer <Text style={{ fontWeight: "700" }}>{nextBadge.target - referralCount}</Text> more friend
              {nextBadge.target - referralCount !== 1 ? "s" : ""} to unlock the <Text style={{ fontWeight: "700" }}>{nextBadge.label}</Text> badge.
            </Text>
          )}
        </View>

        {/* Friends list */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Friends you've invited ({referredUsers.length})</Text>
          {referredUsers.length === 0 ? (
            <Text style={styles.listEmpty}>No one has joined with your link yet.{"\n"}Share it to get started!</Text>
          ) : (
            referredUsers.map((u, i) => (
              <View
                key={u.username}
                style={[styles.referredRow, i === referredUsers.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View>
                  <Text style={styles.referredName}>{u.displayName}</Text>
                  <Text style={styles.referredUsername}>@{u.username}</Text>
                </View>
                <Text style={styles.referredTime}>{timeAgo(u.joinedAt)}</Text>
              </View>
            ))
          )}
        </View>

        {/* How it works */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>How it works</Text>
          {[
            { n: "1", text: `Share your link via WhatsApp, Instagram DMs, or text.` },
            { n: "2", text: `Your friend signs up at connect.themoveee.com using your link.` },
            { n: "3", text: `You earn +${repPerReferral} reputation and +${creditsPerReferral} credits — instantly.` },
            { n: "4", text: `Refer ${connectorThreshold} friends → Connector badge. Refer ${superConnectorThreshold} → Super Connector.` },
          ].map(({ n, text }) => (
            <View key={n} style={styles.howRow}>
              <View style={styles.howNum}>
                <Text style={styles.howNumText}>{n}</Text>
              </View>
              <Text style={styles.howText}>{text}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
