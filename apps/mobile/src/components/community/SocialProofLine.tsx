import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fonts } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import type { SocialProof } from "../../features/community/readingTracker";

// "N people you follow have logged this" — split out of the old,
// now-deleted LogEntryPanel.tsx during the SDK 57 merge, since
// EntryLogControl.tsx (main's generalized shelf/rating control) has no
// equivalent of this line and Culture_Reading_Tracker::get_social_proof()
// has no web/mobile-shared counterpart to reuse instead. Deliberately its
// own small component rather than folded back into EntryLogControl — that
// component is mirrored 1:1 with the web version
// (apps/connect/app/directory/[slug]/EntryLogControl.tsx) and shouldn't
// diverge just to grow a Log-First-only feature onto it.
function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginTop: 8 },
    text: { fontFamily: fonts.sans, fontSize: 12.5, color: c.mute },
    bold: { fontFamily: fonts.sansBold, color: c.ink },
  });
}

export default function SocialProofLine({ directoryId }: { directoryId: number }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [proof, setProof] = useState<SocialProof | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<SocialProof>(`${MOBILE_API}/reading/social-proof?directory_id=${directoryId}`);
      setProof(res);
    } catch {}
  }, [directoryId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
  }, [load, isAuthenticated]);

  if (!proof || (proof.doneCount === 0 && proof.wantCount === 0)) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>
        <Text style={styles.bold}>{proof.doneCount}</Text> {proof.doneCount === 1 ? "person" : "people"} you follow{" "}
        {proof.doneCount === 1 ? "has" : "have"} logged this
        {proof.wantCount > 0 && (
          <>
            {" "}
            · <Text style={styles.bold}>{proof.wantCount}</Text> want to
          </>
        )}
      </Text>
    </View>
  );
}
