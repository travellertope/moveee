import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { fonts, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import {
  SHELF_STATUSES,
  statusLabel,
  type MediumOrOther,
  type ShelfStatus,
} from "../../features/community/readingTracker";

// Shelve and rate an entry from the entry screen itself. Single trigger button
// that expands an inline option list — mirrors the web component redesign.

interface EntryState {
  directoryId: number;
  medium: MediumOrOther;
  status: ShelfStatus | null;
  rating: number;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    // Trigger button
    trigger: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 14, paddingVertical: 11,
      borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.ghost,
      backgroundColor: c.paper,
    },
    triggerSet: { backgroundColor: c.ink, borderColor: c.ink },
    triggerDot: {
      width: 7, height: 7, borderRadius: 99,
      backgroundColor: c.paper, opacity: 0.65,
    },
    triggerLabel: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    triggerLabelSet: { color: c.paper },
    triggerChevron: { fontFamily: fonts.mono, fontSize: 10, color: c.ink, opacity: 0.4 },
    triggerChevronSet: { color: c.paper },
    // Options list
    options: {
      marginTop: 6,
      borderRadius: radius.lg, borderWidth: 1.5, borderColor: c.ghost,
      backgroundColor: c.paper, overflow: "hidden",
    },
    option: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: 14, paddingVertical: 11,
      borderTopWidth: 1, borderTopColor: c.ghost + "88",
    },
    optionFirst: { borderTopWidth: 0 },
    optionCheck: { width: 14, fontFamily: fonts.sans, fontSize: 12, color: c.ochre },
    optionLabel: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, flex: 1 },
    optionLabelActive: { fontFamily: fonts.sansBold },
    optionRemove: { color: c.mute, fontSize: 13 },
    // Rating
    rate: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.ghost + "55" },
    rateLine: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginBottom: 8 },
    stars: { flexDirection: "row", gap: 6 },
    star: {
      width: 44, height: 42, alignItems: "center", justifyContent: "center",
      borderRadius: radius.lg, borderWidth: 1, borderColor: c.ghost, backgroundColor: c.paper,
    },
    starOn: { borderColor: c.ochre },
    starText: { fontSize: 20, lineHeight: 24, color: c.mute },
    starTextOn: { color: c.ochre },
  });
}

export default function EntryLogControl({
  directoryId,
  containerStyle,
}: {
  directoryId: number;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [state, setState] = useState<EntryState | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<EntryState>(`${MOBILE_API}/reading/entry?directory_id=${directoryId}`);
      setState(res);
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    load();
  }, [load, isAuthenticated]);

  async function pick(status: ShelfStatus) {
    if (busy) return;
    setOpen(false);
    setBusy(true);
    try {
      await api.post(`${MOBILE_API}/reading/shelf`, { directory_id: directoryId, status });
      setState((prev) => (prev ? { ...prev, status } : prev));
    } catch {}
    setBusy(false);
  }

  async function rate(rating: number) {
    if (busy) return;
    const next = rating === state?.rating ? 0 : rating;
    setBusy(true);
    try {
      const res = await api.post<{ status?: ShelfStatus }>(`${MOBILE_API}/reading/rating`, {
        directory_id: directoryId, rating: next,
      });
      setState((prev) =>
        prev ? { ...prev, rating: next, status: (res?.status ?? prev.status) as ShelfStatus | null } : prev
      );
    } catch {}
    setBusy(false);
  }

  async function remove() {
    if (busy) return;
    setOpen(false);
    setBusy(true);
    try {
      await api.delete(`${MOBILE_API}/reading/shelf?directory_id=${directoryId}`);
      setState((prev) => (prev ? { ...prev, status: null, rating: 0 } : prev));
    } catch {}
    setBusy(false);
  }

  if (!isAuthenticated || loading || !state || state.medium === "other") return null;

  const isSet = !!state.status;
  const label = isSet ? statusLabel(state.status!, state.medium) : "Add to Log";
  const isRead = state.status === "read";

  return (
    <View style={containerStyle}>
      {/* Trigger */}
      <TouchableOpacity
        style={[styles.trigger, isSet && styles.triggerSet]}
        onPress={() => setOpen((v) => !v)}
        disabled={busy}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        {isSet && <View style={styles.triggerDot} />}
        <Text style={[styles.triggerLabel, isSet && styles.triggerLabelSet]}>{label}</Text>
        <Text style={[styles.triggerChevron, isSet && styles.triggerChevronSet]}>
          {open ? "▴" : "▾"}
        </Text>
      </TouchableOpacity>

      {/* Options */}
      {open && (
        <View style={styles.options}>
          {SHELF_STATUSES.map((s, i) => {
            const active = state.status === s;
            return (
              <TouchableOpacity
                key={s}
                style={[styles.option, i === 0 && styles.optionFirst]}
                onPress={() => pick(s)}
                disabled={busy}
                accessibilityRole="menuitem"
              >
                <Text style={styles.optionCheck}>{active ? "✓" : ""}</Text>
                <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                  {statusLabel(s, state.medium)}
                </Text>
              </TouchableOpacity>
            );
          })}
          {isSet && (
            <TouchableOpacity
              style={styles.option}
              onPress={remove}
              disabled={busy}
              accessibilityRole="menuitem"
            >
              <Text style={styles.optionCheck} />
              <Text style={[styles.optionLabel, styles.optionRemove]}>Remove from log</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Rating — visible when watched/read and options are closed */}
      {isRead && !open && (
        <View style={styles.rate}>
          <Text style={styles.rateLine}>
            {state.rating > 0 ? "Saved. Tap again to change." : "How was it? One tap, no review needed."}
          </Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => {
              const on = n <= state.rating;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.star, on && styles.starOn]}
                  onPress={() => rate(n)}
                  disabled={busy}
                  accessibilityRole="button"
                  accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
                >
                  <Text style={[styles.starText, on && styles.starTextOn]}>{on ? "★" : "☆"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}
