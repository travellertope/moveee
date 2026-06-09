import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { Notification } from "../../types";

const PROXY = "https://themoveee.com/api";
const PAGE_SIZE = 20;

const TYPE_META: Record<string, { emoji: string; color: string }> = {
  credit_earned:     { emoji: "✦",  color: colors.gold },
  badge_unlocked:    { emoji: "🏅", color: "#9c6aff" },
  perk_expiring:     { emoji: "⏳", color: colors.ochre },
  perk_redeemed:     { emoji: "🎁", color: colors.communityText },
  cashout_approved:  { emoji: "💸", color: colors.communityText },
  cashout_rejected:  { emoji: "⚠️", color: colors.ochre },
  escrow_released:   { emoji: "🔓", color: colors.communityText },
  comment_received:  { emoji: "💬", color: colors.gold },
  post_validated:    { emoji: "✅", color: colors.communityText },
  system:            { emoji: "📢", color: colors.mute },
};

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export default function NotificationsScreen() {
  const nav = useNavigation<any>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offset, setOffset]     = useState(0);
  const [hasMore, setHasMore]   = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (reset = false) => {
    const nextOffset = reset ? 0 : offset;
    if (!reset && loadingMore) return;
    reset ? setRefreshing(true) : setLoadingMore(true);
    try {
      const data = await api.get<Notification[]>(
        `${PROXY}/notifications?limit=${PAGE_SIZE}&offset=${nextOffset}`
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
      await api.post(`${PROXY}/notifications`, {} as Record<string, unknown>);
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
    } catch { /* silent */ }
  };

  const markRead = async (id: number) => {
    try {
      await api.post(`${PROXY}/notifications`, { notification_id: id } as Record<string, unknown>);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const renderItem = ({ item }: { item: Notification }) => {
    const meta = TYPE_META[item.type] ?? TYPE_META.system;
    const isUnread = !item.read_at;

    return (
      <TouchableOpacity
        style={[styles.row, isUnread && styles.rowUnread]}
        onPress={() => {
          if (isUnread) markRead(item.id);
        }}
        activeOpacity={0.7}
      >
        <View style={[styles.emojiWrap, { borderColor: meta.color + "33" }]}>
          <Text style={styles.emoji}>{meta.emoji}</Text>
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={[styles.rowTitle, isUnread && styles.rowTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.rowTime}>{timeAgo(item.created_at)}</Text>
          </View>
          <Text style={styles.rowDesc} numberOfLines={2}>{item.body}</Text>
        </View>
        {isUnread && <View style={[styles.unreadDot, { backgroundColor: meta.color }]} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.gold} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(n) => String(n.id)}
          renderItem={renderItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setOffset(0); load(true); }}
              tintColor={colors.gold}
            />
          }
          onEndReached={() => hasMore && load()}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-outline" size={40} color={colors.ghost} />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          }
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: space[4] }} color={colors.gold} /> : null}
          contentContainerStyle={notifications.length === 0 ? styles.listEmpty : undefined}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  backBtn:      { padding: 4, marginRight: space[2] },
  headerTitle:  { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink, flex: 1 },
  markAllBtn:   { paddingHorizontal: space[2], paddingVertical: 4 },
  markAllText:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold },

  row: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    gap: space[3],
  },
  rowUnread: { backgroundColor: colors.goldLight },

  emojiWrap: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, justifyContent: "center", alignItems: "center",
    backgroundColor: colors.paperDeep,
  },
  emoji: { fontSize: 18 },

  rowBody: { flex: 1, gap: 3 },
  rowTop:  { flexDirection: "row", alignItems: "center", gap: space[2] },
  rowTitle: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute,
    flex: 1,
  },
  rowTitleUnread: { fontFamily: fonts.sansBold, color: colors.ink },
  rowTime:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost },
  rowDesc:  { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, lineHeight: 18 },

  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 6 },

  center:    { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8], gap: space[3] },
  listEmpty: { flexGrow: 1 },
  emptyText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ghost, textAlign: "center" },
});
