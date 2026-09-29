import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { fonts, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";

// Follow a directory-entry catalog item (a Person or a Place — gated by
// PROXIMITY_TYPES below) — a different relationship from member-to-member
// Culture_Follows, since the followed side isn't necessarily a Moveee
// account at all. See Culture_Directory_Follows (PHP) for the backend: a
// follower gets notified whenever a new community post links to this entry.

const SUPPORTED_TYPES = new Set(["person", "place"]);

interface FollowStatus {
  isFollowing: boolean;
  followersCount: number;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, marginTop: 10 },
    btn: {
      paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost,
    },
    btnActive: { backgroundColor: c.ink, borderColor: c.ink },
    btnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    btnTextActive: { color: c.paper },
    count: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
  });
}

export default function DirectoryFollowButton({
  directoryId,
  entryType,
}: {
  directoryId: number;
  entryType: string;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [status, setStatus] = useState<FollowStatus | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<FollowStatus>(`${MOBILE_API}/directory/${directoryId}/follow-status`);
      setStatus(res);
    } catch {}
  }, [directoryId]);

  useEffect(() => {
    if (!isAuthenticated || !SUPPORTED_TYPES.has(entryType)) return;
    load();
  }, [isAuthenticated, entryType, load]);

  async function toggle() {
    if (saving || !status) return;
    const next = !status.isFollowing;
    setStatus({ isFollowing: next, followersCount: status.followersCount + (next ? 1 : -1) });
    setSaving(true);
    try {
      const res = await api.post<FollowStatus>(
        `${MOBILE_API}/directory/${directoryId}/${next ? "follow" : "unfollow"}`,
        {}
      );
      setStatus(res);
    } catch {
      load(); // revert to real state on failure
    }
    setSaving(false);
  }

  if (!isAuthenticated || !SUPPORTED_TYPES.has(entryType) || !status) return null;

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[styles.btn, status.isFollowing && styles.btnActive]}
        onPress={toggle}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator size="small" color={status.isFollowing ? c.paper : c.ochre} />
        ) : (
          <Text style={[styles.btnText, status.isFollowing && styles.btnTextActive]}>
            {status.isFollowing ? "Following" : "Follow"}
          </Text>
        )}
      </TouchableOpacity>
      {status.followersCount > 0 && (
        <Text style={styles.count}>
          {status.followersCount} {status.followersCount === 1 ? "follower" : "followers"}
        </Text>
      )}
    </View>
  );
}
