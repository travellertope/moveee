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

// Shelve and rate an entry from the entry screen itself — the shortcut the
// Culture Log shipped without, where the only way in was the add-a-thing modal
// on ReadingTrackerScreen. Mirrors the web component
// (apps/connect/app/directory/[slug]/EntryLogControl.tsx) exactly: same
// three-status row, same one-tap rating that needs no review, same "an entry
// with no shelf renders nothing" rule.

interface EntryState {
  directoryId: number;
  medium: MediumOrOther;
  status: ShelfStatus | null;
  rating: number;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    label: {
      fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.6,
      textTransform: "uppercase", color: c.mute, marginBottom: 10,
    },
    statuses: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    status: {
      flexGrow: 1, minWidth: 96, minHeight: 44, paddingHorizontal: 10,
      alignItems: "center", justifyContent: "center",
      borderRadius: radius.lg, borderWidth: 1, borderColor: c.ghost,
      backgroundColor: c.paper,
    },
    statusActive: { backgroundColor: c.ink, borderColor: c.ink },
    statusText: { fontFamily: fonts.sansBold, fontSize: 13.5, color: c.ink, textAlign: "center" },
    statusTextActive: { color: c.paper },
    rate: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.ghost + "55" },
    rateLine: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginBottom: 8 },
    stars: { flexDirection: "row", gap: 6 },
    star: {
      width: 48, height: 46, alignItems: "center", justifyContent: "center",
      borderRadius: radius.lg, borderWidth: 1, borderColor: c.ghost, backgroundColor: c.paper,
    },
    starOn: { borderColor: c.ochre },
    starText: { fontSize: 22, lineHeight: 26, color: c.mute },
    starTextOn: { color: c.ochre },
    link: { paddingVertical: 10 },
    linkText: { fontFamily: fonts.mono, fontSize: 12, color: c.ochre },
  });
}

// containerStyle is applied by this component, not by the caller wrapping it,
// so an entry with no shelf leaves no empty card behind.
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<EntryState>(`${MOBILE_API}/reading/entry?directory_id=${directoryId}`);
      setState(res);
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    load();
  }, [load, isAuthenticated]);

  async function pick(status: ShelfStatus) {
    if (busy) return;
    setBusy(true);
    try {
      await api.post(`${MOBILE_API}/reading/shelf`, { directory_id: directoryId, status });
      // Moving off `read` leaves the rating in place on purpose — a re-read
      // shouldn't erase what you thought of it the first time.
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
        directory_id: directoryId,
        rating: next,
      });
      setState((prev) =>
        prev ? { ...prev, rating: next, status: (res?.status ?? prev.status) as ShelfStatus | null } : prev
      );
    } catch {}
    setBusy(false);
  }

  async function remove() {
    if (busy) return;
    setBusy(true);
    try {
      await api.delete(`${MOBILE_API}/reading/shelf?directory_id=${directoryId}`);
      setState((prev) => (prev ? { ...prev, status: null, rating: 0 } : prev));
    } catch {}
    setBusy(false);
  }

  // A person, a movement, a concept has no shelf — you don't finish someone,
  // and TYPE_MEDIA_MAP resolves all of them to 'other'. Those entries still
  // accrue saved lines and reviews; they just have nothing to log.
  if (!isAuthenticated || loading || !state || state.medium === "other") return null;

  return (
    <View style={containerStyle}>
      <Text style={styles.label}>Add to your log</Text>

      <View style={styles.statuses}>
        {SHELF_STATUSES.map((s) => {
          const on = state.status === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.status, on && styles.statusActive]}
              onPress={() => pick(s)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.statusText, on && styles.statusTextActive]}>
                {statusLabel(s, state.medium)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {state.status === "read" && (
        <View style={styles.rate}>
          <Text style={styles.rateLine}>
            {state.rating > 0 ? "Saved. Tap again to change it." : "How was it? One tap, no review needed."}
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

      {state.status && (
        <TouchableOpacity style={styles.link} onPress={remove} disabled={busy}>
          <Text style={styles.linkText}>Remove from your log</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
