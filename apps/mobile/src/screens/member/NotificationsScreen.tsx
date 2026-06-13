import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, SectionList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { Notification } from "../../types";

const PAGE_SIZE = 20;

// Left border color + icon circle background per notification type
const TYPE_META: Record<string, { emoji: string; accent: string; border: boolean }> = {
  credit_earned:    { emoji: "★",  accent: colors.ochre,   border: true  },
  post_validated:   { emoji: "★",  accent: colors.ochre,   border: true  },
  badge_unlocked:   { emoji: "✦",  accent: colors.gold,    border: true  },
  perk_expiring:    { emoji: "⏰", accent: colors.warning,  border: true  },
  perk_redeemed:    { emoji: "🎁", accent: colors.success,  border: false },
  cashout_approved: { emoji: "✅", accent: colors.ghost,    border: false },
  cashout_rejected: { emoji: "⚠️", accent: colors.error,   border: true  },
  escrow_released:  { emoji: "🔓", accent: colors.success,  border: false },
  comment_received: { emoji: "💬", accent: colors.success,  border: false },
  system:           { emoji: "📢", accent: colors.ghost,    border: false },
};

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

function NotifRow({ item, onPress }: { item: Notification; onPress: () => void }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.system;
  const isUnread = !item.read_at;
  const isOld = !isToday(item.created_at);

  return (
    <TouchableOpacity
      style={[styles.row, isOld && styles.rowOld]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left accent border for priority types */}
      {meta.border && (
        <View style={[styles.accentBorder, { backgroundColor: meta.accent }]} />
      )}

      {/* Icon circle */}
      <View style={[
        styles.iconCircle,
        isOld
          ? { backgroundColor: colors.ghost + "40" }
          : { backgroundColor: meta.accent },
      ]}>
        <Text style={styles.iconEmoji}>{meta.emoji}</Text>
      </View>

      {/* Content */}
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text
            style={[styles.rowTitle, isOld && styles.rowTitleOld]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <View style={styles.rowMeta}>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: colors.ochre }]} />}
            <Text style={[styles.rowTime, isOld && { color: colors.ghost }]}>
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
  const nav = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [offset,       setOffset]       = useState(0);
  const [hasMore,      setHasMore]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);

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

  const unreadCount = notifications.filter((n) => !n.read_at).length;
  const sections = groupNotifications(notifications);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={styles.headerSideBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
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
        /* Empty state */
        <View style={styles.empty}>
          <Ionicons name="notifications-outline" size={64} color={colors.ghost} style={{ marginBottom: 20 }} />
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
              onPress={() => !item.read_at && markRead(item.id)}
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
              tintColor={colors.gold}
            />
          }
          onEndReached={() => hasMore && load()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore
              ? <ActivityIndicator style={{ padding: space[4] }} color={colors.gold} />
              : null
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          stickySectionHeadersEnabled
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperDeep },

  header: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], backgroundColor: colors.paper,
    borderBottomWidth: 0,
  },
  headerSideBtn:  { minWidth: 44, minHeight: 44, justifyContent: "center" },
  headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  markAllText:    { fontFamily: fonts.sans, fontSize: 13, color: colors.ochre, textAlign: "right" },

  // Section header
  sectionHeader: {
    height: 32, backgroundColor: colors.paperWarm,
    justifyContent: "center", paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ghost + "80",
  },
  sectionHeaderText: {
    fontFamily: fonts.mono, fontSize: 9, color: colors.mute,
    textTransform: "uppercase", letterSpacing: 1.2,
  },

  // Row
  row: {
    minHeight: 72, flexDirection: "row", alignItems: "flex-start",
    backgroundColor: colors.paper, paddingHorizontal: 16, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
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
    fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink,
    lineHeight: 18, flex: 1,
  },
  rowTitleOld: { color: colors.inkSoft },
  rowMeta: { flexDirection: "column", alignItems: "flex-end", gap: 4 },
  rowTime: { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  rowDesc: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.mute,
    marginTop: 4, lineHeight: 18,
  },

  // Empty state
  empty: {
    flex: 1, backgroundColor: colors.paperWarm,
    alignItems: "center", justifyContent: "center",
    padding: 24, paddingBottom: 80,
  },
  emptyTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: colors.ink, marginBottom: 12 },
  emptyDesc:  { fontFamily: fonts.sans, fontSize: 14, color: colors.mute, textAlign: "center" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
