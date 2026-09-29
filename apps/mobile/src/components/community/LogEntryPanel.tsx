import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import {
  shelfLabelsFor,
  type ShelfStatus,
  type SocialProof,
} from "../../features/community/readingTracker";

// "Add to your log" + social proof — from the "Moveee Home — Log-First"
// mockup. Sits right below the title/about card on a Book/Film/Place
// directory entry. The shelf mechanism itself (Culture_Reading_Tracker) was
// already generic across directory types before this pass — only the
// button labels vary per type (see shelfLabelsFor()). Person entries (and
// any other type not in SHELF_LABELS) render nothing from this component —
// there's no "read/watched/been" concept for a person, only saved lines
// (see SavedLines.tsx) and the follow-a-figure affordance, which is a
// separate, not-yet-built feature (see CLAUDE.md).

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginHorizontal: 16, marginTop: 12 },
    label: {
      fontFamily: fonts.sansBold, fontSize: 11, color: c.mute,
      textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 8,
    },
    btnRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    btn: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost,
    },
    btnActive: { backgroundColor: c.ink, borderColor: c.ink },
    btnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    btnTextActive: { color: c.paper },

    proofCard: {
      marginTop: 14, backgroundColor: c.paperWarm, borderRadius: radius.lg,
      padding: 12,
    },
    proofRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    proofAvatars: { flexDirection: "row" },
    proofAvatar: {
      width: 24, height: 24, borderRadius: 12, backgroundColor: c.ghost,
      borderWidth: 2, borderColor: c.paperWarm, marginLeft: -8,
      alignItems: "center", justifyContent: "center",
    },
    proofAvatarFirst: { marginLeft: 0 },
    proofAvatarInitial: { fontFamily: fonts.sansBold, fontSize: 10, color: c.paper },
    proofAvatarImg: { width: 24, height: 24, borderRadius: 12 },
    proofText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1 },
    proofTextBold: { fontFamily: fonts.sansBold, color: c.ink },
  });
}

function initial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export default function LogEntryPanel({
  directoryId,
  entryType,
  actionLabel = "log",
}: {
  directoryId: number;
  entryType: string;
  actionLabel?: string;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const labels = shelfLabelsFor(entryType);

  const [status, setStatus] = useState<ShelfStatus | null>(null);
  const [proof, setProof] = useState<SocialProof | null>(null);
  const [saving, setSaving] = useState(false);

  const loadProof = useCallback(async () => {
    try {
      const res = await api.get<SocialProof>(`${MOBILE_API}/reading/social-proof?directory_id=${directoryId}`);
      setProof(res);
    } catch {}
  }, [directoryId]);

  useEffect(() => {
    if (!labels) return;
    loadProof();
  }, [labels, loadProof]);

  async function setShelf(next: ShelfStatus) {
    if (saving) return;
    const prev = status;
    setStatus(next === status ? null : next); // tap the active button to clear it
    setSaving(true);
    try {
      if (next === prev) {
        await api.delete(`${MOBILE_API}/reading/shelf?directory_id=${directoryId}`);
      } else {
        await api.post(`${MOBILE_API}/reading/shelf`, { directory_id: directoryId, status: next });
      }
      loadProof();
    } catch {
      setStatus(prev); // revert optimistic update on failure
    }
    setSaving(false);
  }

  if (!labels) return null;

  const buttons = (Object.keys(labels) as ShelfStatus[]);

  return (
    <View style={styles.wrap}>
      {isAuthenticated && (
        <>
          <Text style={styles.label}>Add to your {actionLabel}</Text>
          <View style={styles.btnRow}>
            {buttons.map((st) => {
              const active = status === st;
              return (
                <TouchableOpacity
                  key={st}
                  style={[styles.btn, active && styles.btnActive]}
                  onPress={() => setShelf(st)}
                  disabled={saving}
                >
                  {saving && active ? (
                    <ActivityIndicator size="small" color={c.paper} />
                  ) : (
                    <Text style={[styles.btnText, active && styles.btnTextActive]}>{labels[st]}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {proof && (proof.doneCount > 0 || proof.wantCount > 0) && (
        <View style={styles.proofCard}>
          <View style={styles.proofRow}>
            {proof.examples.length > 0 && (
              <View style={styles.proofAvatars}>
                {proof.examples.map((ex, i) => (
                  <View key={ex.userId} style={[styles.proofAvatar, i === 0 && styles.proofAvatarFirst]}>
                    {ex.avatar ? (
                      <Image source={{ uri: ex.avatar }} style={styles.proofAvatarImg} />
                    ) : (
                      <Text style={styles.proofAvatarInitial}>{initial(ex.name)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
            <Text style={styles.proofText}>
              <Text style={styles.proofTextBold}>{proof.doneCount}</Text> {proof.doneCount === 1 ? "person" : "people"} you follow {labels.read === "Been" ? "have been" : "have logged it"}
              {proof.wantCount > 0 && (
                <Text> · <Text style={styles.proofTextBold}>{proof.wantCount}</Text> want to {labels.read === "Been" ? "go" : "read it"}</Text>
              )}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
