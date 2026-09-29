import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useNav } from "../../hooks/useNav";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useLocation } from "../../features/location/useLocation";

// Stoop proximity banner — "N people within 3 miles want to go too. Start a
// Stoop here?" — shown on a Place directory entry when the viewer has
// members interested in that same place nearby. See
// Culture_Reading_Tracker::get_place_proximity() for the backend and
// class-culture-geolocation.php for the one-time-GPS-snapshot privacy model.
//
// Three states:
//  1. No saved location yet — a compact prompt to turn location on.
//  2. Location saved but nobody nearby wants to go — render nothing (this is
//     a signal-driven nudge, not always-on marketing copy, per this
//     codebase's "hide the whole section when empty" convention).
//  3. Location saved and count > 0 — the real banner + "Start a Stoop here".

const RADIUS_MILES = 3;

interface ProximityResult {
  hasLocation: boolean;
  count: number;
  examples: { userId: number; name: string; avatar: string | null }[];
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: 16, marginTop: 12,
      backgroundColor: c.paperWarm, borderRadius: radius.lg,
      padding: 14, ...shadows.card,
    },
    promptRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    promptText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1 },
    promptBtn: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ochre,
    },
    promptBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ochre },

    row: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatars: { flexDirection: "row" },
    avatar: {
      width: 26, height: 26, borderRadius: 13, backgroundColor: c.ghost,
      borderWidth: 2, borderColor: c.paperWarm, marginLeft: -8,
      alignItems: "center", justifyContent: "center",
    },
    avatarFirst: { marginLeft: 0 },
    avatarInitial: { fontFamily: fonts.sansBold, fontSize: 11, color: c.paper },
    avatarImg: { width: 26, height: 26, borderRadius: 13 },
    text: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, flex: 1 },
    textBold: { fontFamily: fonts.sansBold, color: c.ink },

    startBtn: {
      alignSelf: "flex-start", marginTop: 10,
      paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.full,
      backgroundColor: c.ink,
    },
    startBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },

    turnOff: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginTop: 8 },
  });
}

function initial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export default function StoopProximityBanner({ directoryId }: { directoryId: number }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { requesting, deniedPermission, requestAndSaveLocation, clearLocation } = useLocation();

  const [result, setResult] = useState<ProximityResult | null>(null);
  const [hasEnabledLocation, setHasEnabledLocation] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get<ProximityResult>(
        `${MOBILE_API}/reading/place-proximity?directory_id=${directoryId}`
      );
      setResult(res);
      setHasEnabledLocation(res.hasLocation);
    } catch {
      setResult(null);
    }
  }, [directoryId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
  }, [isAuthenticated, load]);

  async function handleEnable() {
    const ok = await requestAndSaveLocation();
    if (ok) load();
  }

  async function handleTurnOff() {
    const ok = await clearLocation();
    if (ok) {
      setResult({ hasLocation: false, count: 0, examples: [] });
      setHasEnabledLocation(false);
    }
  }

  if (!isAuthenticated || result === null) return null;

  // No location saved — show a compact opt-in prompt instead of the banner.
  if (!result.hasLocation) {
    return (
      <View style={styles.wrap}>
        <View style={styles.promptRow}>
          <Text style={styles.promptText}>
            Turn on location to see who's nearby for places you're interested in.
          </Text>
          <TouchableOpacity style={styles.promptBtn} onPress={handleEnable} disabled={requesting}>
            {requesting ? (
              <ActivityIndicator size="small" color={c.ochre} />
            ) : (
              <Text style={styles.promptBtnText}>Turn on</Text>
            )}
          </TouchableOpacity>
        </View>
        {deniedPermission && (
          <Text style={[styles.promptText, { marginTop: 8, color: c.mute }]}>
            Location permission was denied — you can enable it later from your phone's Settings.
          </Text>
        )}
      </View>
    );
  }

  // Location saved but nobody nearby — hide entirely, per this component's
  // "signal-driven nudge, not always-on copy" design.
  if (result.count === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {result.examples.length > 0 && (
          <View style={styles.avatars}>
            {result.examples.map((ex, i) => (
              <View key={ex.userId} style={[styles.avatar, i === 0 && styles.avatarFirst]}>
                {ex.avatar ? (
                  <Image source={{ uri: ex.avatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarInitial}>{initial(ex.name)}</Text>
                )}
              </View>
            ))}
          </View>
        )}
        <Text style={styles.text}>
          <Text style={styles.textBold}>{result.count}</Text>{" "}
          {result.count === 1 ? "person" : "people"} within {RADIUS_MILES} miles want to go too.
        </Text>
      </View>
      <TouchableOpacity style={styles.startBtn} onPress={() => nav.navigate("HostOnboardingScreen")}>
        <Text style={styles.startBtnText}>Start a Stoop here →</Text>
      </TouchableOpacity>
      {hasEnabledLocation && (
        <TouchableOpacity onPress={handleTurnOff}>
          <Text style={styles.turnOff}>Using your location for this · Turn off</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
