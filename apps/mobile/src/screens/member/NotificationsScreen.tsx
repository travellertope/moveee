import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNav, type AppNavProp } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import type { FeedItem, Notification } from "../../types";
import PostDetailSheet from "../../components/community/PostDetailSheet";

/**
 * Maps a notification to where tapping it should go. Most types route to a
 * fixed in-app destination (wallet, coupons, referrals, etc.) derived purely
 * from `type`. The three types tied to a specific community post (mention,
 * comment_received, new_follower_post) need the actual post fetched first
 * since the bottom-sheet viewer requires a full FeedItem, not just an id —
 * see `handle_get_community_post` (PHP) / `/mobile/community/post`. These
 * three return the fetched FeedItem instead of navigating, so the caller can
 * present it via `PostDetailSheet` (the app's standard post viewer) rather
 * than the legacy full-screen `PostDetailScreen`.
 */
async function openNotification(item: Notification, nav: AppNavProp): Promise<FeedItem | void> {
  const meta = item.meta ?? {};
  const postId = meta.post_id;

  switch (item.type) {
    case "mention":
    case "comment_received":
    case "new_follower_post": {
      if (!postId) break;
      try {
        const { item: post } = await api.get<{ item: FeedItem }>(
          `${MOBILE_API}/community/post?post_id=${postId}`
        );
        return post;
      } catch {
        // Post may have been deleted/unpublished since the notification fired — no-op.
      }
      break;
    }
    case "new_follower": {
      const followerId = meta.follower_id;
      if (followerId) nav.navigate("MemberProfile", { userId: String(followerId) });
      break;
    }
    case "badge_unlocked":
      nav.navigate("MemberDashboard");
      break;
    case "credit_earned":
    case "cashout_approved":
    case "cashout_rejected":
    case "escrow_released":
    case "post_validated":
      nav.navigate("Wallet");
      break;
    case "perk_redeemed":
    case "perk_expiring":
      nav.navigate("Coupons");
      break;
    case "referral_received":
      nav.navigate("Referral");
      break;
    case "event_rsvp":
      nav.navigate("MyEvents");
      break;
    case "cluster_activated":
    case "cluster_forming_expired":
    case "cluster_new_host":
    case "cluster_election_started":
    case "cluster_checkin_reminder": {
      const clusterId = meta.cluster_id;
      if (clusterId) nav.navigate("ClusterScreen", { id: Number(clusterId) });
      break;
    }
    case "system":
    default:
      break;
  }
}

const PAGE_SIZE = 20;

function getTypeMeta(c: ColorPalette) {
  return {
    credit_earned:    { emoji: "★",  accent: c.ochre,   border: true  },
    post_validated:   { emoji: "★",  accent: c.ochre,   border: true  },
    badge_unlocked:   { emoji: "✦",  accent: c.gold,    border: true  },
    perk_expiring:    { emoji: "⏰", accent: c.warning,  border: true  },
    perk_redeemed:    { emoji: "🎁", accent: c.success,  border: false },
    cashout_approved: { emoji: "✅", accent: c.ghost,    border: false },
    cashout_rejected: { emoji: "⚠️", accent: c.error,   border: true  },
    escrow_released:  { emoji: "🔓", accent: c.success,  border: false },
    comment_received: { emoji: "💬", accent: c.success,  border: false },
    system:           { emoji: "📢", accent: c.ghost,    border: false },
    referral_received: { emoji: "🎉", accent: c.success,  border: false },
    mention:           { emoji: "📌", accent: c.ochre,    border: false },
    new_follower:      { emoji: "👤", accent: c.gold,     border: false },
    new_follower_post: { emoji: "📰", accent: c.gold,     border: false },
    event_rsvp:        { emoji: "🎫", accent: c.ochre,    border: false },
    cluster_activated:        { emoji: "🏘️", accent: c.success, border: false },
    cluster_forming_expired:  { emoji: "⌛", accent: c.warning, border: false },
    cluster_new_host:         { emoji: "🗳️", accent: c.gold,    border: false },
    cluster_election_started: { emoji: "🏛️", accent: c.ochre,   border: false },
    cluster_checkin_reminder: { emoji: "📅", accent: c.gold,    border: false },
  } as Record<string, { emoji: string; accent: string; border: boolean }>;
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60)    return "Just now";
  if (secs < 3600)  return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  if (secs < 172800) return "Yesterday";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
}

function groupNotifications(notifications: Notification[]) {
  const today: Notification[] = [];
  const earlier: Notification[] = [];
  for (const n of notifications) {
    (isToday(n.created_at) ? today : earlier).push(n);
  }
  const sections = [];
  if (today.length)   sections.push({ title: "Today",   data: today });
  if (earlier.length) sections.push({ title: "Earlier", data: earlier });
  return sections;
}

function NotifRow({
  item, onPress, navigating, styles, c,
}: {
  item: Notification;
  onPress: () => void;
  navigating: boolean;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  const typeMeta = getTypeMeta(c);
  const meta = typeMeta[item.type] ?? typeMeta.system;
  const isUnread = !item.read_at;
  const isOld = !isToday(item.created_at);

  return (
    <TouchableOpacity
      style={[styles.row, isOld && styles.rowOld]}
      onPress={onPress}
      disabled={navigating}
      activeOpacity={0.7}
    >
      {meta.border && (
        <View style={[styles.accentBorder, { backgroundColor: meta.accent }]} />
      )}

      <View style={[
        styles.iconCircle,
        isOld
          ? { backgroundColor: c.ghost + "40" }
          : { backgroundColor: meta.accent },
      ]}>
        {navigating
          ? <ActivityIndicator size="small" color={c.ink} />
          : <Text style={styles.iconEmoji}>{meta.emoji}</Text>}
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, isOld && styles.rowTitleOld]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.rowMeta}>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: c.ochre }]} />}
            <Text style={[styles.rowTime, isOld && { color: c.ghost }]}>
              {timeAgo(item.created_at)}
            </Text>
          </View>
        </View>
        <Text style={styles.rowDesc} numberOfLines={2}>{item.body}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const nav = useNav();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [offset,       setOffset]       = useState(0);
  const [hasMore,      setHasMore]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);
  const [sheetItem, setSheetItem] = useState<FeedItem | null>(null);

  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const load = useCallback(async (reset = false) => {
    const nextOffset = reset ? 0 : offset;
    if (!reset && loadingMore) return;
    reset ? setRefreshing(true) : setLoadingMore(true);
    try {
      const data = await api.get<Notification[]>(
        `${MOBILE_API}/notifications?limit=${PAGE_SIZE}&offset=${nextOffset}`
      );
      const items = data ?? [];
      setNotifications((prev) => reset ? items : [...prev, ...items]);
      setHasMore(items.length === PAGE_SIZE);
      setOffset(nextOffset + items.length);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [offset, loadingMore]);

  useEffect(() => { load(true); }, []);

  const markAllRead = async () => {
    try {
      await api.post(`${MOBILE_API}/notifications`, {} as Record<string, unknown>);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch { /* silent */ }
  };

  const markRead = async (id: number) => {
    try {
      await api.post(`${MOBILE_API}/notifications`, { notification_id: id } as Record<string, unknown>);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch { /* silent */ }
  };

  const handlePress = async (item: Notification) => {
    if (!item.read_at) markRead(item.id);
    setNavigatingId(item.id);
    try {
      const post = await openNotification(item, nav);
      if (post) setSheetItem(post);
    } finally {
      setNavigatingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const sections = groupNotifications(notifications);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
            <Ionicons name="chevron-back" size={22} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSideBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={c.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={unreadCount > 0 ? markAllRead : undefined}
          style={styles.headerSideBtn}
        >
          {unreadCount > 0 && (
            <Text style={styles.markAllText}>Mark all read</Text>
          )}
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={64} color={c.ghost} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptyDesc}>New activity will appear here.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => String(n.id)}
          renderItem={({ item }) => (
            <NotifRow
              item={item}
              onPress={() => handlePress(item)}
              navigating={navigatingId === item.id}
              styles={styles}
              c={c}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setOffset(0); load(true); }}
              tintColor={c.gold}
            />
          }
          onEndReached={() => hasMore && load()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator style={{ padding: space[4] }} color={c.gold} />
              : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          stickySectionHeadersEnabled
        />
      )}

      <PostDetailSheet
        item={sheetItem}
        visible={sheetItem !== null}
        onClose={() => setSheetItem(null)}
      />
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperDeep },

    header: {
      height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], backgroundColor: c.paper,
      borderBottomWidth: 0,
    },
    headerSideBtn:  { minWidth: 44, minHeight: 44, justifyContent: "center" },
    headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    markAllText:    { fontFamily: fonts.sans, fontSize: 13, color: c.ochre, textAlign: "right" },

    sectionHeader: {
      height: 32, backgroundColor: c.paperWarm,
      justifyContent: "center", paddingHorizontal: 16,
      borderBottomWidth: 1, borderBottomColor: c.ghost + "80",
    },
    sectionHeaderText: {
      fontFamily: fonts.mono, fontSize: 9, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1.2,
    },

    row: {
      minHeight: 72, flexDirection: "row", alignItems: "flex-start",
      backgroundColor: c.paper, paddingHorizontal: 16, paddingVertical: 16,
      borderBottomWidth: 1, borderBottomColor: c.ghost,
      gap: 12, position: "relative",
    },
    rowOld: { opacity: 0.9 },
    accentBorder: {
      position: "absolute", left: 0, top: 0, bottom: 0, width: 3,
    },

    iconCircle: {
      width: 40, height: 40, borderRadius: 20,
      justifyContent: "center", alignItems: "center", flexShrink: 0,
    },
    iconEmoji: { fontSize: 16 },

    rowBody: { flex: 1 },
    rowTop:  { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 },
    rowTitle: {
      fontFamily: fonts.sansBold, fontSize: 14, color: c.ink,
      lineHeight: 18, flex: 1,
    },
    rowTitleOld: { color: c.inkSoft },
    rowMeta: { flexDirection: "column", alignItems: "flex-end", gap: 4 },
    rowTime: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    unreadDot: { width: 8, height: 8, borderRadius: 4 },
    rowDesc: {
      fontFamily: fonts.sans, fontSize: 13, color: c.mute,
      marginTop: 4, lineHeight: 18,
    },

    empty: {
      flex: 1, backgroundColor: c.paperWarm,
      alignItems: "center", justifyContent: "center",
      padding: 24, paddingBottom: 80,
    },
    emptyTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink, marginBottom: 12 },
    emptyDesc:  { fontFamily: fonts.sans, fontSize: 14, color: c.mute, textAlign: "center" },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },
  });
}
