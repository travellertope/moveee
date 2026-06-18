import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { GameHistoryEntry } from "../../types";

const GAME_LABELS: Record<GameHistoryEntry["game_type"], { name: string; icon: keyof typeof Ionicons.glyphMap }> = {
  trivia:        { name: "Daily Trivia",  icon: "help-circle" },
  "who-said-it": { name: "Who Said It?",  icon: "chatbox-ellipses" },
};

function groupByMonth(entries: GameHistoryEntry[]): { month: string; items: GameHistoryEntry[] }[] {
  const map = new Map<string, GameHistoryEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.created_at).toLocaleDateString("en-GB", {
      month: "long", year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

export default function GameHistoryScreen() {
  const nav    = useNav();
  const c      = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [entries, setEntries]   = useState<GameHistoryEntry[]>([]);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.get<{ entries: GameHistoryEntry[]; pages: number }>(
          `${MOBILE_API}/games/history?page=1&per_page=20`
        );
        setEntries(data.entries ?? []);
        setHasMore((data.pages ?? 1) > 1);
      } catch {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await api.get<{ entries: GameHistoryEntry[]; pages: number }>(
        `${MOBILE_API}/games/history?page=${nextPage}&per_page=20`
      );
      setEntries((prev) => [...prev, ...(data.entries ?? [])]);
      setPage(nextPage);
      setHasMore(nextPage < (data.pages ?? 1));
    } catch {
      // Non-fatal — user can retry by scrolling again.
    } finally {
      setLoadingMore(false);
    }
  };

  const grouped = groupByMonth(entries);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Game History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={c.gold} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
            if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 80) {
              loadMore();
            }
          }}
          scrollEventThrottle={200}
        >
          {entries.length === 0 ? (
            <Text style={styles.emptyText}>No games played yet — head to Games to get started.</Text>
          ) : (
            <View style={[styles.card, shadows.card]}>
              {grouped.map((group, gi) => (
                <View key={group.month}>
                  <View style={styles.monthHeader}>
                    <Text style={styles.monthLabel}>{group.month.toUpperCase()}</Text>
                  </View>
                  {group.items.map((entry, idx) => {
                    const isLast = gi === grouped.length - 1 && idx === group.items.length - 1;
                    const meta = GAME_LABELS[entry.game_type] ?? { name: entry.game_type, icon: "game-controller" as const };
                    const shortDate = new Date(entry.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                    return (
                      <View key={entry.id} style={[styles.row, isLast && styles.rowLast]}>
                        <View style={styles.rowLeft}>
                          <View style={styles.iconCircle}>
                            <Ionicons name={meta.icon} size={16} color={c.ochre} />
                          </View>
                          <View>
                            <Text style={styles.gameName}>{meta.name}</Text>
                            <Text style={styles.rowDate}>{shortDate} · {entry.score}/{entry.max_score} correct</Text>
                          </View>
                        </View>
                        <Text style={styles.creditsText}>+{entry.credits_earned} CR</Text>
                      </View>
                    );
                  })}
                </View>
              ))}
              {loadingMore && (
                <ActivityIndicator color={c.gold} style={{ marginVertical: 12 }} />
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, paddingHorizontal: space[4],
      height: 56,
      borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink },

    loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },

    scrollArea: { flex: 1 },
    content: { padding: space[4], paddingBottom: 60 },

    emptyText: {
      fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute,
      textAlign: "center", marginTop: 40,
    },

    card: {
      backgroundColor: c.paper, borderRadius: radius.lg, overflow: "hidden",
    },

    monthHeader: {
      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6,
      backgroundColor: c.paperDeep,
    },
    monthLabel: {
      fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: c.mute, letterSpacing: 1,
    },

    row: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    rowLast: { borderBottomWidth: 0 },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },

    iconCircle: {
      width: 32, height: 32, borderRadius: radius.full,
      backgroundColor: "rgba(197,73,31,0.1)",
      alignItems: "center", justifyContent: "center",
    },

    gameName: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink, marginBottom: 2 },
    rowDate:  { fontFamily: fonts.sans, fontSize: 12, color: c.mute },

    creditsText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre },
  });
}
