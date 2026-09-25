import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity, Image, Modal, Alert, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useTabletContentStyle } from "../../hooks/useTabletContentStyle";
import DirectorySearch, { DirectoryEntry } from "../../components/composer/DirectorySearch";
import type { ColorPalette } from "../../theme";

type ShelfStatus = "want_to_read" | "currently_reading" | "read";

const TABS: { key: ShelfStatus; label: string }[] = [
  { key: "want_to_read", label: "Want to Read" },
  { key: "currently_reading", label: "Reading" },
  { key: "read", label: "Read" },
];

interface ShelfEntry {
  directoryId: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  author: string;
  averageRating: number | null;
  status: ShelfStatus;
  startedAt: string | null;
  finishedAt: string | null;
}

interface Goal {
  year: number;
  targetBooks: number | null;
  booksRead: number;
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export default function ReadingTrackerScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const tabletCap = useTabletContentStyle(680);

  const [tab, setTab] = useState<ShelfStatus>("want_to_read");
  const [counts, setCounts] = useState<Record<ShelfStatus, number>>({
    want_to_read: 0, currently_reading: 0, read: 0,
  });
  const [entries, setEntries] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");

  const loadCounts = useCallback(() => {
    api.get<Record<ShelfStatus, number>>(`${MOBILE_API}/reading/shelf/counts`)
      .then(setCounts)
      .catch(() => {});
  }, []);

  const loadGoal = useCallback(() => {
    api.get<Goal>(`${MOBILE_API}/reading/goal`)
      .then(setGoal)
      .catch(() => {});
  }, []);

  function saveGoal() {
    const target = parseInt(goalInput, 10);
    if (!target || target < 1) return;
    api.post<Goal>(`${MOBILE_API}/reading/goal`, { target_books: target })
      .then(setGoal)
      .catch(() => {})
      .finally(() => setEditingGoal(false));
  }

  const loadShelf = useCallback((status: ShelfStatus) => {
    setLoading(true);
    api.get<{ entries: ShelfEntry[]; total: number }>(`${MOBILE_API}/reading/shelf?status=${status}`)
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCounts(); loadGoal(); }, [loadCounts, loadGoal]);
  useEffect(() => { loadShelf(tab); }, [tab, loadShelf]);

  function moveShelf(directoryId: number, status: ShelfStatus) {
    setEntries((prev) => (status === tab ? prev : prev.filter((e) => e.directoryId !== directoryId)));
    api.post(`${MOBILE_API}/reading/shelf`, { directory_id: directoryId, status })
      .catch(() => {})
      .finally(() => {
        loadCounts();
        if (status === "read") loadGoal();
        if (status === tab) loadShelf(tab);
      });
  }

  function removeFromShelf(directoryId: number) {
    Alert.alert("Remove from shelf?", "This book will be taken off your Reading Tracker.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: () => {
          setEntries((prev) => prev.filter((e) => e.directoryId !== directoryId));
          api.delete(`${MOBILE_API}/reading/shelf?directory_id=${directoryId}`)
            .catch(() => {})
            .finally(loadCounts);
        },
      },
    ]);
  }

  function addBook(entry: DirectoryEntry) {
    setAddOpen(false);
    api.post(`${MOBILE_API}/reading/shelf`, { directory_id: entry.id, status: "want_to_read" })
      .then(() => {
        loadCounts();
        if (tab === "want_to_read") loadShelf("want_to_read");
      })
      .catch(() => {});
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reading Tracker</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={24} color={c.ink} />
        </TouchableOpacity>
      </View>

      {goal ? (
        <View style={styles.goalCard}>
          {editingGoal || goal.targetBooks === null ? (
            <View style={styles.goalEdit}>
              <Text style={styles.goalLabel}>Set your {goal.year} reading goal</Text>
              <View style={styles.goalEditRow}>
                <TextInput
                  style={styles.goalInput}
                  keyboardType="number-pad"
                  placeholder="e.g. 24"
                  placeholderTextColor={c.mute}
                  defaultValue={goal.targetBooks ? String(goal.targetBooks) : ""}
                  onChangeText={setGoalInput}
                />
                <TouchableOpacity style={styles.goalSaveBtn} onPress={saveGoal}>
                  <Text style={styles.goalSaveBtnText}>Save</Text>
                </TouchableOpacity>
                {goal.targetBooks !== null && (
                  <TouchableOpacity onPress={() => setEditingGoal(false)}>
                    <Text style={styles.goalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingGoal(true)}>
              <Text style={styles.goalText}>
                {goal.booksRead} of {goal.targetBooks} books this year
              </Text>
              <View style={styles.goalBar}>
                <View
                  style={[
                    styles.goalBarFill,
                    { width: `${Math.min(100, (goal.booksRead / (goal.targetBooks || 1)) * 100)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      <View style={styles.tabRow}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>
              {t.label} ({counts[t.key]})
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="book-outline" size={64} color={c.ghost} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>
            {tab === "want_to_read" ? "Nothing on your list yet" :
             tab === "currently_reading" ? "You're not currently reading anything" :
             "No finished books yet"}
          </Text>
          <TouchableOpacity style={styles.addBookBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.addBookBtnText}>+ Add a Book</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.grid, tabletCap]} showsVerticalScrollIndicator={false}>
          {entries.map((e) => (
            <View key={e.directoryId} style={styles.card}>
              {e.thumbnail ? (
                <Image source={{ uri: e.thumbnail }} style={styles.cover} />
              ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                  <Ionicons name="book" size={28} color={c.ghost} />
                </View>
              )}
              <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
              {!!e.author && <Text style={styles.cardAuthor} numberOfLines={1}>{e.author}</Text>}
              {tab === "read" && e.finishedAt ? (
                <Text style={styles.cardFinished}>Finished {fmtDate(e.finishedAt)}</Text>
              ) : null}
              <View style={styles.cardActions}>
                {TABS.filter((t) => t.key !== e.status).map((t) => (
                  <TouchableOpacity key={t.key} onPress={() => moveShelf(e.directoryId, t.key)}>
                    <Text style={styles.cardActionText}>→ {t.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity onPress={() => removeFromShelf(e.directoryId)}>
                  <Text style={styles.cardRemoveText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={addOpen} animationType="slide" onRequestClose={() => setAddOpen(false)} presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add a book</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => setAddOpen(false)}>
              <Ionicons name="close" size={22} color={c.ink} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: space[4] }}>
            <DirectorySearch
              onSelect={addBook}
              selected={null}
              typeFilter="book"
              aboutFieldLabel="Author"
              externalSource="google_books"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperDeep },

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    backBtn:     { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
    addBtn:      { width: 44, height: 44, alignItems: "flex-end", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },

    goalCard: {
      backgroundColor: c.paper, marginHorizontal: space[3], marginTop: space[3],
      padding: space[3], borderRadius: radius.xl, ...shadows.card,
    },
    goalText: { fontFamily: fonts.mono, fontSize: 12, color: c.ink, marginBottom: 8 },
    goalBar: {
      height: 8, borderRadius: radius.full, backgroundColor: c.paperDeep, overflow: "hidden",
    },
    goalBarFill: { height: "100%", backgroundColor: c.ochre, borderRadius: radius.full },
    goalEdit: { gap: 10 },
    goalLabel: {
      fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6,
      textTransform: "uppercase", color: c.mute,
    },
    goalEditRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    goalInput: {
      width: 80, height: 40, paddingHorizontal: 10,
      borderWidth: 1, borderColor: c.ghost, borderRadius: radius.md,
      fontFamily: fonts.sans, fontSize: 14, color: c.ink, backgroundColor: c.paper,
    },
    goalSaveBtn: {
      height: 40, paddingHorizontal: 16, borderRadius: radius.lg,
      backgroundColor: c.ink, alignItems: "center", justifyContent: "center",
    },
    goalSaveBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    goalCancelText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },

    tabRow: {
      flexDirection: "row", backgroundColor: c.paper,
      borderBottomWidth: 1, borderBottomColor: c.ghost,
      paddingHorizontal: space[3], paddingTop: space[2],
    },
    tab: {
      paddingVertical: 10, paddingHorizontal: 10, marginRight: 4,
      borderBottomWidth: 2, borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: c.ochre },
    tabText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    tabTextActive: { fontFamily: fonts.sansBold, color: c.ink },

    grid: {
      flexDirection: "row", flexWrap: "wrap",
      padding: 16, gap: 14, paddingBottom: 40,
    },
    card: {
      width: "47%", backgroundColor: c.paper, borderRadius: radius.xl,
      padding: 12, ...shadows.card,
    },
    cover: { width: "100%", aspectRatio: 2 / 3, borderRadius: radius.md, marginBottom: 8 },
    coverPlaceholder: { backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center" },
    cardTitle:  { fontFamily: fonts.serifBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    cardAuthor: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },
    cardFinished: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, marginTop: 4 },
    cardActions: { marginTop: 8, gap: 4 },
    cardActionText: { fontFamily: fonts.sans, fontSize: 11, color: c.gold },
    cardRemoveText: { fontFamily: fonts.sans, fontSize: 11, color: c.error },

    empty: {
      flex: 1, backgroundColor: c.paperWarm,
      alignItems: "center", justifyContent: "center",
      padding: 24, gap: space[3],
    },
    emptyTitle: {
      fontFamily: fonts.serifBold, fontSize: 18, color: c.ink,
      textAlign: "center", maxWidth: 260,
    },
    addBookBtn: {
      height: 48, paddingHorizontal: 24,
      backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center",
    },
    addBookBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
  });
}
