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
import {
  MOOD_LABELS, PACE_LABELS, MEDIA, MEDIUM_LABELS, MEDIUM_EMOJI, SHELF_STATUSES,
  statusLabel,
  type Pace, type ReadingStats, type ReadingGoal, type ShelfCounts,
  type Medium, type MediumOrOther, type ShelfStatus,
} from "../../features/community/readingTracker";

/**
 * How to search for / create an entry of each medium. Mirrors the web copy in
 * ReadingTrackerClient.tsx — `typeFilter` is a single slug because
 * DirectorySearch reuses it as the created entry's own type.
 */
const MEDIA_SEARCH: Record<Medium, {
  typeFilter: string;
  aboutFieldLabel?: string;
  externalSource?: "google_books" | "spotify" | "tmdb";
}> = {
  book:  { typeFilter: "book",  aboutFieldLabel: "Author",   externalSource: "google_books" },
  film:  { typeFilter: "film",  aboutFieldLabel: "Director", externalSource: "tmdb" },
  music: { typeFilter: "album", aboutFieldLabel: "Artist",   externalSource: "spotify" },
  food:  { typeFilter: "food" },
  place: { typeFilter: "place" },
};

const EMPTY_COUNTS: ShelfCounts = {
  want_to_read: 0, currently_reading: 0, read: 0, total: 0,
  byMedium: {} as ShelfCounts["byMedium"],
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Phase 4 stats colors — kept local to this file rather than the theme,
// since they're specific to the pace-breakdown segmented bar and don't need
// to be a reusable design-system token. "medium" reuses the real ochre
// accent color (c.ochre) at render time, not a hardcoded hex.
function paceColor(pace: Pace, c: ColorPalette): string {
  if (pace === "slow") return "#7a9cc6";
  if (pace === "fast") return "#c67a4a";
  return c.ochre;
}

interface ShelfEntry {
  directoryId: number;
  title: string;
  slug: string;
  thumbnail: string | null;
  author: string;
  averageRating: number | null;
  medium: MediumOrOther;
  status: ShelfStatus;
  /** This member's own rating, 0-5. 0 means unrated. */
  rating: number;
  startedAt: string | null;
  finishedAt: string | null;
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
  const [medium, setMedium] = useState<MediumOrOther | "all">("all");
  const [addMedium, setAddMedium] = useState<Medium>("book");
  const [counts, setCounts] = useState<ShelfCounts>(EMPTY_COUNTS);
  const [entries, setEntries] = useState<ShelfEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [goal, setGoal] = useState<ReadingGoal | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [statsExpanded, setStatsExpanded] = useState(false);

  const loadCounts = useCallback(() => {
    api.get<ShelfCounts>(`${MOBILE_API}/reading/shelf/counts`)
      .then((d) => setCounts({ ...EMPTY_COUNTS, ...d }))
      .catch(() => {});
  }, []);

  const loadGoal = useCallback(() => {
    api.get<ReadingGoal>(`${MOBILE_API}/reading/goal`)
      .then(setGoal)
      .catch(() => {});
  }, []);

  const loadStats = useCallback(() => {
    api.get<ReadingStats>(`${MOBILE_API}/reading/stats`)
      .then(setStats)
      .catch(() => {});
  }, []);

  function saveGoal() {
    const target = parseInt(goalInput, 10);
    if (!target || target < 1) return;
    api.post<ReadingGoal>(`${MOBILE_API}/reading/goal`, { target_books: target })
      .then(setGoal)
      .catch(() => {})
      .finally(() => setEditingGoal(false));
  }

  const loadShelf = useCallback((status: ShelfStatus, med: MediumOrOther | "all") => {
    setLoading(true);
    const q = med === "all" ? "" : `&medium=${med}`;
    api.get<{ entries: ShelfEntry[]; total: number }>(`${MOBILE_API}/reading/shelf?status=${status}${q}`)
      .then((data) => setEntries(data.entries ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadCounts(); loadGoal(); loadStats(); }, [loadCounts, loadGoal, loadStats]);
  useEffect(() => { loadShelf(tab, medium); }, [tab, medium, loadShelf]);

  // Only offer a medium chip once something is actually on that shelf — an
  // empty "Music (0)" chip is noise, not a feature.
  const mediumChips = useMemo(() => {
    const present = ([...MEDIA, "other"] as MediumOrOther[])
      .filter((m) => (counts.byMedium?.[m]?.total ?? 0) > 0);
    return present.length > 1 ? present : [];
  }, [counts]);

  const tabCount = (status: ShelfStatus) =>
    medium === "all" ? counts[status] : counts.byMedium?.[medium]?.[status] ?? 0;

  function moveShelf(directoryId: number, status: ShelfStatus) {
    setEntries((prev) => (status === tab ? prev : prev.filter((e) => e.directoryId !== directoryId)));
    api.post(`${MOBILE_API}/reading/shelf`, { directory_id: directoryId, status })
      .catch(() => {})
      .finally(() => {
        loadCounts();
        if (status === "read") { loadGoal(); loadStats(); }
        if (status === tab) loadShelf(tab, medium);
      });
  }

  /**
   * One tap, no review. Tapping the star you're already on clears the rating
   * (0) — the only way back out of a misfire. Optimistic; the refetches
   * reconcile. A rating > 0 also marks the entry read server-side, so a card
   * rated from another tab leaves that tab.
   */
  function rate(directoryId: number, current: number, next: number) {
    const value = current === next ? 0 : next;
    setEntries((prev) =>
      prev.map((e) => (e.directoryId === directoryId ? { ...e, rating: value } : e)),
    );
    api.post(`${MOBILE_API}/reading/rating`, { directory_id: directoryId, rating: value })
      .catch(() => {})
      .finally(() => {
        loadCounts();
        if (value > 0 && tab !== "read") { loadShelf(tab, medium); loadGoal(); loadStats(); }
      });
  }

  function removeFromShelf(directoryId: number) {
    Alert.alert("Remove from your log?", "This will be taken off your Culture Log.", [
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

  function addEntry(entry: DirectoryEntry) {
    setAddOpen(false);
    api.post(`${MOBILE_API}/reading/shelf`, { directory_id: entry.id, status: "want_to_read" })
      .then(() => {
        loadCounts();
        if (tab === "want_to_read") loadShelf("want_to_read", medium);
      })
      .catch(() => {});
  }

  const goalTarget = goal?.target ?? goal?.targetBooks ?? null;
  const goalLogged = goal?.logged ?? goal?.booksRead ?? 0;
  const statsLogged = stats?.entries_logged ?? stats?.books_read ?? 0;
  const statsPerMonth = stats?.per_month ?? stats?.books_per_month ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Culture Log</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
          <Ionicons name="add" size={24} color={c.ink} />
        </TouchableOpacity>
      </View>

      {goal ? (
        <View style={styles.goalCard}>
          {editingGoal || goalTarget === null ? (
            <View style={styles.goalEdit}>
              <Text style={styles.goalLabel}>Set your {goal.year} goal</Text>
              <View style={styles.goalEditRow}>
                <TextInput
                  style={styles.goalInput}
                  keyboardType="number-pad"
                  placeholder="e.g. 24"
                  placeholderTextColor={c.mute}
                  defaultValue={goalTarget ? String(goalTarget) : ""}
                  onChangeText={setGoalInput}
                />
                <TouchableOpacity style={styles.goalSaveBtn} onPress={saveGoal}>
                  <Text style={styles.goalSaveBtnText}>Save</Text>
                </TouchableOpacity>
                {goalTarget !== null && (
                  <TouchableOpacity onPress={() => setEditingGoal(false)}>
                    <Text style={styles.goalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setEditingGoal(true)}>
              <Text style={styles.goalText}>
                {goalLogged} of {goalTarget} logged this year
              </Text>
              <View style={styles.goalBar}>
                <View
                  style={[
                    styles.goalBarFill,
                    { width: `${Math.min(100, (goalLogged / (goalTarget || 1)) * 100)}%` },
                  ]}
                />
              </View>
            </TouchableOpacity>
          )}
        </View>
      ) : null}

      {stats ? (
        <View style={styles.statsCard}>
          <TouchableOpacity style={styles.statsHeaderRow} onPress={() => setStatsExpanded((v) => !v)}>
            <View>
              <Text style={styles.statsTitle}>Your Year in Culture</Text>
              <Text style={styles.statsCount}>{statsLogged} thing{statsLogged === 1 ? "" : "s"} logged in {stats.year}</Text>
            </View>
            <Ionicons name={statsExpanded ? "chevron-up" : "chevron-down"} size={20} color={c.mute} />
          </TouchableOpacity>

          {statsExpanded && (
            <ScrollView style={styles.statsBody} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {/* What you logged, by medium */}
              {(() => {
                const rows = ([...MEDIA, "other"] as MediumOrOther[])
                  .map((m) => ({ medium: m, count: stats.medium_breakdown?.[m] ?? 0 }))
                  .filter((r) => r.count > 0)
                  .sort((a, b) => b.count - a.count);
                if (rows.length === 0) return null;
                const maxMedium = Math.max(1, ...rows.map((r) => r.count));
                return (
                  <>
                    <Text style={styles.statsSectionLabel}>What You Logged</Text>
                    {rows.map((r) => (
                      <View key={r.medium} style={styles.barRow}>
                        <Text style={styles.barRowLabel}>
                          {MEDIUM_EMOJI[r.medium]} {MEDIUM_LABELS[r.medium]}
                        </Text>
                        <View style={styles.barRowTrack}>
                          <View style={[styles.barRowFill, { width: `${(r.count / maxMedium) * 100}%` }]} />
                        </View>
                        <Text style={styles.barRowCount}>{r.count}</Text>
                      </View>
                    ))}
                  </>
                );
              })()}

              {/* Logged per month */}
              <Text style={styles.statsSectionLabel}>By Month</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthScroll}>
                {statsPerMonth.map((m) => {
                  const maxMonth = Math.max(1, ...statsPerMonth.map((x) => x.count));
                  const label = MONTH_LABELS[parseInt(m.month.slice(5, 7), 10) - 1] ?? m.month;
                  return (
                    <View key={m.month} style={styles.monthCol}>
                      <View style={styles.monthBarTrack}>
                        <View style={[styles.monthBarFill, { height: `${m.count === 0 ? 0 : Math.max(8, (m.count / maxMonth) * 100)}%` }]} />
                      </View>
                      <Text style={styles.monthCount}>{m.count}</Text>
                      <Text style={styles.monthLabel}>{label}</Text>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Pace */}
              {Object.values(stats.pace_breakdown).some((v) => v > 0) && (
                <>
                  <Text style={styles.statsSectionLabel}>Pace · Books only</Text>
                  <View style={styles.paceBar}>
                    {(Object.keys(stats.pace_breakdown) as Pace[]).map((pace) => {
                      const total = Math.max(1, (Object.values(stats.pace_breakdown) as number[]).reduce((s, v) => s + v, 0));
                      const count = stats.pace_breakdown[pace];
                      if (count <= 0) return null;
                      return (
                        <View key={pace} style={{ width: `${(count / total) * 100}%`, height: "100%", backgroundColor: paceColor(pace, c) }} />
                      );
                    })}
                  </View>
                  <View style={styles.paceLegend}>
                    {(Object.keys(stats.pace_breakdown) as Pace[]).map((pace) => (
                      <View key={pace} style={styles.paceLegendItem}>
                        <View style={[styles.paceDot, { backgroundColor: paceColor(pace, c) }]} />
                        <Text style={styles.paceLegendText}>{PACE_LABELS[pace]} ({stats.pace_breakdown[pace]})</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Moods */}
              {Object.keys(stats.mood_breakdown).length > 0 && (
                <>
                  <Text style={styles.statsSectionLabel}>Moods · Books only</Text>
                  {(() => {
                    const maxMood = Math.max(1, ...Object.values(stats.mood_breakdown));
                    return Object.entries(stats.mood_breakdown).map(([mood, count]) => (
                      <View key={mood} style={styles.barRow}>
                        <Text style={styles.barRowLabel}>{MOOD_LABELS[mood as keyof typeof MOOD_LABELS] ?? mood}</Text>
                        <View style={styles.barRowTrack}>
                          <View style={[styles.barRowFill, { width: `${(count / maxMood) * 100}%` }]} />
                        </View>
                        <Text style={styles.barRowCount}>{count}</Text>
                      </View>
                    ));
                  })()}
                </>
              )}

              {/* Ratings */}
              {Object.values(stats.rating_distribution).some((v) => v > 0) && (
                <>
                  <Text style={styles.statsSectionLabel}>
                    Your ratings
                    {stats.average_rating != null
                      ? `  ${stats.average_rating.toFixed(1)} avg across ${stats.rated_count}`
                      : ""}
                  </Text>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const total = Math.max(1, (Object.values(stats.rating_distribution) as number[]).reduce((s, v) => s + v, 0));
                    const count = stats.rating_distribution[String(stars)] ?? 0;
                    return (
                      <View key={stars} style={styles.barRow}>
                        <Text style={styles.barRowLabel}>{stars} star{stars === 1 ? "" : "s"}</Text>
                        <View style={styles.barRowTrack}>
                          <View style={[styles.barRowFill, { width: `${(count / total) * 100}%` }]} />
                        </View>
                        <Text style={styles.barRowCount}>{count}</Text>
                      </View>
                    );
                  })}
                </>
              )}

              {/* Top genres */}
              {stats.top_genres.length > 0 && (
                <>
                  <Text style={styles.statsSectionLabel}>Top Genres</Text>
                  {stats.top_genres.map((g, i) => (
                    <View key={g.genre} style={styles.genreRow}>
                      <Text style={styles.genreRank}>{i + 1}</Text>
                      <Text style={styles.genreName}>{g.genre}</Text>
                      <Text style={styles.genreCount}>{g.count}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>
          )}
        </View>
      ) : null}

      {mediumChips.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaRow}
        >
          <TouchableOpacity
            style={[styles.mediaChip, medium === "all" && styles.mediaChipActive]}
            onPress={() => setMedium("all")}
          >
            <Text style={[styles.mediaChipText, medium === "all" && styles.mediaChipTextActive]}>
              All ({counts.total})
            </Text>
          </TouchableOpacity>
          {mediumChips.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.mediaChip, medium === m && styles.mediaChipActive]}
              onPress={() => setMedium(m)}
            >
              <Text style={[styles.mediaChipText, medium === m && styles.mediaChipTextActive]}>
                {MEDIUM_EMOJI[m]} {MEDIUM_LABELS[m]} ({counts.byMedium?.[m]?.total ?? 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.tabRow}>
        {SHELF_STATUSES.map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>
              {statusLabel(key, medium)} ({tabCount(key)})
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
             tab === "currently_reading" ? "Nothing in progress right now" :
             "Nothing logged yet"}
          </Text>
          <TouchableOpacity style={styles.addBookBtn} onPress={() => setAddOpen(true)}>
            <Text style={styles.addBookBtnText}>+ Add to your log</Text>
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
                  <Text style={styles.coverPlaceholderGlyph}>{MEDIUM_EMOJI[e.medium] ?? "✦"}</Text>
                </View>
              )}
              <Text style={styles.cardTitle} numberOfLines={2}>{e.title}</Text>
              {!!e.author && <Text style={styles.cardAuthor} numberOfLines={1}>{e.author}</Text>}
              {tab === "read" && e.finishedAt ? (
                <Text style={styles.cardFinished}>Finished {fmtDate(e.finishedAt)}</Text>
              ) : null}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => rate(e.directoryId, e.rating, n)}
                    hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${n} star${n === 1 ? "" : "s"}`}
                  >
                    <Text style={n <= e.rating ? styles.starOn : styles.starOff}>
                      {n <= e.rating ? "\u2605" : "\u2606"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.cardActions}>
                {SHELF_STATUSES.filter((key) => key !== e.status).map((key) => (
                  <TouchableOpacity key={key} onPress={() => moveShelf(e.directoryId, key)}>
                    {/* the card's own medium, not the active filter — a card
                        always describes itself in its own verbs */}
                    <Text style={styles.cardActionText}>→ {statusLabel(key, e.medium)}</Text>
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
            <Text style={styles.headerTitle}>Add to your log</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => setAddOpen(false)}>
              <Ionicons name="close" size={22} color={c.ink} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: space[4] }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mediaRow}
            >
              {MEDIA.map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[styles.mediaChip, addMedium === m && styles.mediaChipActive]}
                  onPress={() => setAddMedium(m)}
                >
                  <Text style={[styles.mediaChipText, addMedium === m && styles.mediaChipTextActive]}>
                    {MEDIUM_EMOJI[m]} {MEDIUM_LABELS[m]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <DirectorySearch
              // Remount on medium change so the query and results don't carry
              // over from the previous type's search.
              key={addMedium}
              onSelect={addEntry}
              selected={null}
              typeFilter={MEDIA_SEARCH[addMedium].typeFilter}
              aboutFieldLabel={MEDIA_SEARCH[addMedium].aboutFieldLabel}
              externalSource={MEDIA_SEARCH[addMedium].externalSource}
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

    mediaRow: { paddingHorizontal: space[3], paddingTop: space[3], gap: 8 },
    mediaChip: {
      paddingHorizontal: 13, paddingVertical: 7,
      borderRadius: radius.full, borderWidth: 1, borderColor: c.ruleDark,
      backgroundColor: c.paper,
    },
    mediaChipActive: { backgroundColor: c.ink, borderColor: c.ink },
    mediaChipText: { fontFamily: fonts.monoBold, fontSize: 10.5, color: c.ink },
    mediaChipTextActive: { color: c.paper },

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

    // Phase 4 — "Your Year in Culture" stats section (docs/reading-tracker-plan.md §4).
    statsCard: {
      backgroundColor: c.paper, marginHorizontal: space[3], marginTop: space[3],
      borderRadius: radius.xl, ...shadows.card, overflow: "hidden",
    },
    statsHeaderRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: space[3],
    },
    statsTitle: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink },
    statsCount: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    statsBody: {
      maxHeight: 340,
      paddingHorizontal: space[3], paddingBottom: space[3],
      borderTopWidth: 1, borderTopColor: c.ghost,
    },
    statsSectionLabel: {
      fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase",
      color: c.mute, marginTop: space[3], marginBottom: space[2],
    },
    monthScroll: { maxHeight: 110 },
    monthCol: {
      width: 34, alignItems: "center", justifyContent: "flex-end", height: 100, marginRight: 6,
    },
    monthBarTrack: { width: 18, flex: 1, justifyContent: "flex-end" },
    monthBarFill: { width: "100%", backgroundColor: c.ochre, borderRadius: 2, minHeight: 0 },
    monthCount: { fontFamily: fonts.mono, fontSize: 9, color: c.mute, marginTop: 3 },
    monthLabel: { fontFamily: fonts.mono, fontSize: 8.5, color: c.mute, marginTop: 1 },

    paceBar: {
      flexDirection: "row", height: 12, borderRadius: radius.full,
      overflow: "hidden", backgroundColor: c.paperDeep,
    },
    paceLegend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginTop: 8 },
    paceLegendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    paceDot: { width: 8, height: 8, borderRadius: 4 },
    paceLegendText: { fontFamily: fonts.mono, fontSize: 10.5, color: c.mute },

    barRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
    barRowLabel: { fontFamily: fonts.sans, fontSize: 11.5, color: c.ink, width: 84 },
    barRowTrack: {
      flex: 1, height: 7, borderRadius: radius.full, backgroundColor: c.paperDeep, overflow: "hidden",
    },
    barRowFill: { height: "100%", backgroundColor: c.ochre, borderRadius: radius.full },
    barRowCount: { fontFamily: fonts.mono, fontSize: 10.5, color: c.mute, width: 24, textAlign: "right" },

    genreRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    genreRank: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, width: 16 },
    genreName: { fontFamily: fonts.sans, fontSize: 12.5, color: c.ink, flex: 1 },
    genreCount: { fontFamily: fonts.mono, fontSize: 10.5, color: c.mute },

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
    coverPlaceholderGlyph: { fontSize: 26 },
    coverPlaceholder: { backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center" },
    cardTitle:  { fontFamily: fonts.serifBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    starRow:    { flexDirection: "row", gap: 2, marginTop: 6 },
    starOn:     { fontSize: 16, color: c.gold },
    starOff:    { fontSize: 16, color: c.mute },
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
