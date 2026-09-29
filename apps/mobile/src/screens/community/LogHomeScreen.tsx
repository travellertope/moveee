import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import { useNotificationCount } from "../../features/notifications/useNotificationCount";
import DirectorySearch, { type DirectoryEntry } from "../../components/composer/DirectorySearch";
import type { ShelfEntry, FollowingActivityItem } from "../../features/community/readingTracker";

// "Moveee Home — Log-First" — a from-scratch personal-log home screen,
// built from a user-supplied mockup (see CLAUDE.md's "Log-First" entry).
// Deliberately NOT wired into the bottom tab bar or the app's navigation
// yet — this is a standalone build, per explicit user direction ("build
// the pieces first, wire up nav after"). Backend: Culture_Reading_Tracker,
// generalized in this same pass from books-only to any directory type (see
// that class's own docblock). Deferred, not built in this pass: the Stoop
// proximity banner ("N people within 3 miles want to go too"), a "follow
// this person/topic" affordance (a different relationship than the
// member-to-member Culture_Follows system), and star ratings/comments on
// the "From people you follow" activity rail (would need joining to a
// linked review post, same shape as get_reading_stats()'s review_rows —
// not built here to keep this pass's scope real).

const QUICK_LOG_TYPES: { key: string; label: string; emoji: string; directoryType?: string; template?: string }[] = [
  { key: "book",  label: "Book",  emoji: "📖", directoryType: "book" },
  { key: "film",  label: "Film",  emoji: "🎬", directoryType: "film" },
  { key: "music", label: "Music", emoji: "🎵", template: "music-review" },
  { key: "food",  label: "Food",  emoji: "🍽️", template: "food-review" },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  book: { label: "BOOK", color: "#3A342B" },
  film: { label: "FILM", color: "#1976D2" },
  place: { label: "PLACE", color: "#2D9CDB" },
};

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },
    scroll: { paddingBottom: 32 },

    header: {
      flexDirection: "row", alignItems: "center", paddingHorizontal: 16,
      paddingBottom: 12, gap: 10,
    },
    avatar: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.ochre,
      alignItems: "center", justifyContent: "center",
    },
    avatarImg: { width: 36, height: 36, borderRadius: 18 },
    avatarInitial: { fontFamily: fonts.sansBold, fontSize: 15, color: c.paper },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink, flex: 1 },
    bellWrap: { padding: 4 },
    bellDot: {
      position: "absolute", top: 2, right: 2, width: 8, height: 8, borderRadius: 4,
      backgroundColor: c.ochre,
    },
    divider: { height: 1, backgroundColor: c.ghost + "33" },

    section: { paddingHorizontal: 16, marginTop: 20 },
    sectionLabel: {
      fontFamily: fonts.sansBold, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 10,
    },
    sectionHeaderRow: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10,
    },
    sectionCount: { fontFamily: fonts.mono, fontSize: 11, color: c.ghost },

    quickRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    quickChip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full,
      backgroundColor: c.paperWarm,
    },
    quickChipEmoji: { fontSize: 14 },
    quickChipText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },

    progressScroll: { gap: 10, paddingRight: 16 },
    progressCard: {
      width: 160, backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.lg, ...shadows.card, padding: 12,
    },
    progressBadge: {
      alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2,
      borderRadius: radius.full, marginBottom: 8,
    },
    progressBadgeText: { fontFamily: fonts.sansBold, fontSize: 8, letterSpacing: 0.6 },
    progressTitle: { fontFamily: fonts.serifBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    progressAuthor: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginTop: 2 },
    progressFinish: { fontFamily: fonts.sansBold, fontSize: 11, color: c.ochre, marginTop: 8 },

    goalCard: {
      backgroundColor: c.paperWarm, borderRadius: radius.lg, padding: 14,
    },
    goalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    goalLabel: {
      fontFamily: fonts.sansBold, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1,
    },
    goalBarTrack: {
      height: 6, borderRadius: 3, backgroundColor: c.ghost + "33", marginTop: 10, overflow: "hidden",
    },
    goalBarFill: { height: 6, borderRadius: 3, backgroundColor: c.ochre },
    goalMeta: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft, marginTop: 8 },

    activityCard: {
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.lg, ...shadows.card, padding: 12, marginBottom: 10,
    },
    activityHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    activityAvatar: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: c.ghost,
      alignItems: "center", justifyContent: "center",
    },
    activityAvatarImg: { width: 24, height: 24, borderRadius: 12 },
    activityAvatarInitial: { fontFamily: fonts.sansBold, fontSize: 10, color: c.paper },
    activityHeaderText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1 },
    activityHeaderName: { fontFamily: fonts.sansBold, color: c.ink },
    activityTitle: { fontFamily: fonts.serifBold, fontSize: 16, color: c.ink, marginTop: 6 },
    activityAuthor: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 1 },

    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalSheet: {
      backgroundColor: c.paper, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      padding: 16, maxHeight: "80%",
    },
    modalTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginBottom: 12 },
    modalClose: { alignSelf: "center", paddingVertical: 12 },
    modalCloseText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.mute },
  });
}

function initial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export default function LogHomeScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { unread } = useNotificationCount();

  const [inProgress, setInProgress] = useState<ShelfEntry[]>([]);
  const [goal, setGoal] = useState<{ year: number; targetBooks: number | null; booksRead: number } | null>(null);
  const [activity, setActivity] = useState<FollowingActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [logModalType, setLogModalType] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [progressRes, goalRes, activityRes] = await Promise.allSettled([
      api.get<{ entries: ShelfEntry[] }>(`${MOBILE_API}/reading/shelf?status=currently_reading`),
      api.get<{ year: number; targetBooks: number | null; booksRead: number }>(`${MOBILE_API}/reading/goal`),
      api.get<{ activity: FollowingActivityItem[] }>(`${MOBILE_API}/reading/following-activity`),
    ]);
    if (progressRes.status === "fulfilled") setInProgress(progressRes.value.entries ?? []);
    if (goalRes.status === "fulfilled") setGoal(goalRes.value);
    if (activityRes.status === "fulfilled") setActivity(activityRes.value.activity ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function finishFromProgress(entry: ShelfEntry) {
    setInProgress((prev) => prev.filter((e) => e.directoryId !== entry.directoryId));
    try {
      await api.post(`${MOBILE_API}/reading/shelf`, { directory_id: entry.directoryId, status: "read" });
      load();
    } catch {
      load(); // restore real state on failure
    }
  }

  async function handlePickEntry(entry: DirectoryEntry) {
    setLogModalType(null);
    try {
      await api.post(`${MOBILE_API}/reading/shelf`, { directory_id: entry.id, status: "want_to_read" });
      load();
    } catch {}
  }

  function handleQuickLog(item: (typeof QUICK_LOG_TYPES)[number]) {
    if (item.template) {
      nav.navigate("NewPost", { template: item.template });
    } else {
      setLogModalType(item.directoryType ?? item.key);
    }
  }

  const displayName = user?.displayName || user?.username || "You";
  const goalTarget = goal?.targetBooks ?? null;
  const goalRead = goal?.booksRead ?? 0;
  const goalRemaining = goalTarget != null ? Math.max(0, goalTarget - goalRead) : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarInitial}>{initial(displayName)}</Text>
          )}
        </View>
        <Text style={styles.headerTitle}>Your log</Text>
        <TouchableOpacity style={styles.bellWrap} onPress={() => nav.navigate("Notifications")}>
          <Ionicons name="notifications-outline" size={22} color={c.ink} />
          {unread > 0 && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* ── Log something ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Log something</Text>
          <View style={styles.quickRow}>
            {QUICK_LOG_TYPES.map((item) => (
              <TouchableOpacity key={item.key} style={styles.quickChip} onPress={() => handleQuickLog(item)}>
                <Text style={styles.quickChipEmoji}>{item.emoji}</Text>
                <Text style={styles.quickChipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── In progress ── */}
        {(loading || inProgress.length > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>In progress</Text>
              {inProgress.length > 0 && <Text style={styles.sectionCount}>{inProgress.length} open</Text>}
            </View>
            {loading ? (
              <ActivityIndicator size="small" color={c.ochre} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.progressScroll}>
                {inProgress.map((entry) => {
                  const badge = (entry.type && TYPE_BADGE[entry.type]) || TYPE_BADGE.book;
                  return (
                    <TouchableOpacity
                      key={entry.directoryId}
                      style={styles.progressCard}
                      onPress={() => nav.push("DirectoryDetail", { id: entry.directoryId, title: entry.title, entryType: entry.type ?? undefined })}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.progressBadge, { backgroundColor: badge.color + "1A" }]}>
                        <Text style={[styles.progressBadgeText, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                      <Text style={styles.progressTitle} numberOfLines={2}>{entry.title}</Text>
                      {!!entry.author && <Text style={styles.progressAuthor} numberOfLines={1}>{entry.author}</Text>}
                      <TouchableOpacity onPress={() => finishFromProgress(entry)}>
                        <Text style={styles.progressFinish}>Finish · rate →</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Your year in culture ── */}
        {!loading && goal && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your year in culture</Text>
            <TouchableOpacity style={styles.goalCard} onPress={() => nav.navigate("ReadingTracker")} activeOpacity={0.8}>
              <View style={styles.goalRow}>
                <Text style={styles.goalLabel}>{goal.year}</Text>
              </View>
              {goalTarget != null ? (
                <>
                  <View style={styles.goalBarTrack}>
                    <View style={[styles.goalBarFill, { width: `${Math.min(100, (goalRead / goalTarget) * 100)}%` }]} />
                  </View>
                  <Text style={styles.goalMeta}>{goalRead} logged · {goalRemaining} to go</Text>
                </>
              ) : (
                <Text style={styles.goalMeta}>{goalRead} logged this year — set a goal to track progress →</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ── From people you follow ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>From people you follow</Text>
          {loading ? (
            <ActivityIndicator size="small" color={c.ochre} />
          ) : activity.length === 0 ? (
            <Text style={styles.emptyText}>Follow people to see what they're logging here.</Text>
          ) : (
            activity.map((item) => (
              <TouchableOpacity
                key={`${item.userId}-${item.directoryId}`}
                style={styles.activityCard}
                onPress={() => nav.push("DirectoryDetail", { id: item.directoryId, title: item.title, entryType: item.type ?? undefined })}
                activeOpacity={0.8}
              >
                <View style={styles.activityHeaderRow}>
                  <View style={styles.activityAvatar}>
                    {item.userAvatar ? (
                      <Image source={{ uri: item.userAvatar }} style={styles.activityAvatarImg} />
                    ) : (
                      <Text style={styles.activityAvatarInitial}>{initial(item.userName)}</Text>
                    )}
                  </View>
                  <Text style={styles.activityHeaderText}>
                    <Text style={styles.activityHeaderName}>{item.userName}</Text> logged this
                  </Text>
                </View>
                <Text style={styles.activityTitle} numberOfLines={1}>{item.title}</Text>
                {!!item.author && <Text style={styles.activityAuthor} numberOfLines={1}>{item.author}</Text>}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* ── Quick-log search modal (Book/Film) ── */}
      <Modal visible={!!logModalType} animationType="slide" transparent onRequestClose={() => setLogModalType(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.modalTitle}>
              Add a {logModalType === "film" ? "film" : "book"} to your log
            </Text>
            <DirectorySearch
              onSelect={handlePickEntry}
              typeFilter={logModalType ?? "book"}
            />
            <TouchableOpacity style={styles.modalClose} onPress={() => setLogModalType(null)}>
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
