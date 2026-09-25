import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { fonts, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { MOOD_TAGS, MOOD_LABELS, PACES, PACE_LABELS, type Pace, type BookMoodPace as BookMoodPaceData } from "../../features/community/readingTracker";

// Mood/pace tags — Phase 3 of the Reading Tracker, see
// docs/reading-tracker-plan.md §1.3/§3.4. Mirrors the web component
// (apps/connect/app/directory/[slug]/BookMoodPace.tsx) exactly — same
// aggregate-chips-always-visible + sign-in-gated-voting-prompt shape.

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginTop: 4 },
    row: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
      paddingVertical: 8, gap: 16,
    },
    label: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, width: 60, flexShrink: 0 },
    chips: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 4, justifyContent: "flex-end" },
    chip: {
      fontFamily: fonts.monoBold, fontSize: 9, letterSpacing: 0.6, textTransform: "uppercase",
      paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius.full,
      backgroundColor: c.ochre + "1F", color: c.ochre, overflow: "hidden",
    },
    value: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, textAlign: "right" },
    voteLink: { paddingVertical: 8 },
    voteLinkText: { fontFamily: fonts.mono, fontSize: 12, color: c.ochre },
    form: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: c.ghost + "33" },
    formLabel: {
      fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6, textTransform: "uppercase",
      color: c.mute, marginTop: 8, marginBottom: 6,
    },
    formChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    formChip: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost,
    },
    formChipActive: { backgroundColor: c.ink, borderColor: c.ink },
    formChipText: { fontFamily: fonts.mono, fontSize: 11, color: c.inkSoft },
    formChipTextActive: { color: c.paper },
    formActions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
    submitBtn: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.full, backgroundColor: c.ochre,
    },
    submitBtnDisabled: { opacity: 0.5 },
    submitText: {
      fontFamily: fonts.mono, fontSize: 10.5, letterSpacing: 0.5, textTransform: "uppercase", color: "#fff",
    },
    cancelText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
  });
}

export default function BookMoodPace({ directoryId }: { directoryId: number }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [data, setData] = useState<BookMoodPaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftMoods, setDraftMoods] = useState<string[]>([]);
  const [draftPace, setDraftPace] = useState<Pace | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<BookMoodPaceData>(`${MOBILE_API}/reading/mood-pace?directory_id=${directoryId}`);
      setData(res);
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    load();
  }, [load]);

  function startVoting() {
    setDraftMoods(data?.myVote?.moods ?? []);
    setDraftPace(data?.myVote?.pace ?? null);
    setEditing(true);
  }

  function toggleMood(mood: string) {
    setDraftMoods((prev) => (prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]));
  }

  async function submitVote() {
    if (!draftPace) return;
    setSaving(true);
    try {
      const res = await api.post<BookMoodPaceData>(`${MOBILE_API}/reading/mood-vote`, {
        directory_id: directoryId,
        moods: draftMoods,
        pace: draftPace,
      });
      setData(res);
      setEditing(false);
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <View style={styles.wrap}>
        <ActivityIndicator size="small" color={c.ochre} />
      </View>
    );
  }

  const hasAggregate = !!data && (data.moods.length > 0 || !!data.pace);

  return (
    <View style={styles.wrap}>
      {hasAggregate && (
        <>
          {data!.moods.length > 0 && (
            <View style={styles.row}>
              <Text style={styles.label}>Mood</Text>
              <View style={styles.chips}>
                {data!.moods.map((m) => (
                  <Text key={m} style={styles.chip}>
                    {MOOD_LABELS[m as (typeof MOOD_TAGS)[number]] ?? m}
                  </Text>
                ))}
              </View>
            </View>
          )}
          {data!.pace && (
            <View style={styles.row}>
              <Text style={styles.label}>Pace</Text>
              <Text style={styles.value}>{PACE_LABELS[data!.pace]}</Text>
            </View>
          )}
        </>
      )}

      {isAuthenticated && !editing && (
        <TouchableOpacity style={styles.voteLink} onPress={startVoting}>
          <Text style={styles.voteLinkText}>
            {data?.myVote ? "Edit your mood/pace vote →" : "How would you describe this book? →"}
          </Text>
        </TouchableOpacity>
      )}

      {isAuthenticated && editing && (
        <View style={styles.form}>
          <Text style={styles.formLabel}>Moods (pick as many as fit)</Text>
          <View style={styles.formChips}>
            {MOOD_TAGS.map((mood) => {
              const active = draftMoods.includes(mood);
              return (
                <TouchableOpacity
                  key={mood}
                  style={[styles.formChip, active && styles.formChipActive]}
                  onPress={() => toggleMood(mood)}
                >
                  <Text style={[styles.formChipText, active && styles.formChipTextActive]}>{MOOD_LABELS[mood]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.formLabel}>Pace</Text>
          <View style={styles.formChips}>
            {PACES.map((pace) => {
              const active = draftPace === pace;
              return (
                <TouchableOpacity
                  key={pace}
                  style={[styles.formChip, active && styles.formChipActive]}
                  onPress={() => setDraftPace(pace)}
                >
                  <Text style={[styles.formChipText, active && styles.formChipTextActive]}>{PACE_LABELS[pace]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={[styles.submitBtn, (!draftPace || saving) && styles.submitBtnDisabled]}
              disabled={!draftPace || saving}
              onPress={submitVote}
            >
              <Text style={styles.submitText}>{saving ? "Saving…" : "Submit"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
