import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Hub, HubStatus } from "../../types";
import { useAuthStore } from "../../auth/authStore";

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },
    loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll: { padding: space[4], paddingBottom: 40, gap: 16 },
    notFoundText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center" },
    name: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    meta: { fontFamily: fonts.mono, fontSize: 12, color: c.mute, marginTop: 4 },
    card: { backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 16, gap: 8, ...shadows.card },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    cardBody: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, lineHeight: 20 },
    row: { flexDirection: "row", gap: 10, alignItems: "center" },
    joinBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      height: 44, paddingHorizontal: 20, alignItems: "center", justifyContent: "center",
    },
    joinBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    followBtn: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
      height: 44, paddingHorizontal: 20, alignItems: "center", justifyContent: "center",
    },
    followBtnActive: { borderColor: c.ochre },
    followBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    leaveBtn: { paddingVertical: 8 },
    leaveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#C62828" },
    ownerText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828" },
  });
}

export default function HubDetailScreen() {
  const nav = useNav();
  const route = useRoute<any>();
  const slug: string = route.params?.slug;
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore() as any;

  const [loading, setLoading] = useState(true);
  const [hub, setHub] = useState<Hub | null>(null);
  const [status, setStatus] = useState<HubStatus>({ isMember: false, role: null, isFollowing: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const hubData = await api.get<Hub>(`${MOBILE_API}/hub/slug/${slug}`, false);
        setHub(hubData);
        if (hubData && user) {
          const statusData = await api.get<HubStatus>(`${MOBILE_API}/hub/${hubData.id}/status`);
          setStatus(statusData);
        }
      } catch {
        setHub(null);
      }
      setLoading(false);
    })();
  }, [slug, user]);

  const join = async () => {
    if (!hub) return;
    setBusy(true);
    setError("");
    try {
      const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/join`, {});
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || "Could not join right now.");
    }
    setBusy(false);
  };

  const leave = async () => {
    if (!hub || status.role === "owner") return;
    Alert.alert("Leave Hub", "Leave this Hub?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Leave", style: "destructive", onPress: async () => {
          setBusy(true);
          try {
            const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/leave`, {});
            setStatus(s);
          } catch (e: any) {
            setError(e?.message || "Could not leave right now.");
          }
          setBusy(false);
        },
      },
    ]);
  };

  const toggleFollow = async () => {
    if (!hub) return;
    setBusy(true);
    try {
      const path = status.isFollowing ? "unfollow" : "follow";
      const s = await api.post<HubStatus>(`${MOBILE_API}/hub/${hub.id}/${path}`, {});
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || "Something went wrong.");
    }
    setBusy(false);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{hub?.name || "Hub"}</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={c.gold} /></View>
      ) : !hub ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.notFoundText}>This Hub doesn't exist or has been removed.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View>
            <Text style={styles.name}>{hub.name}</Text>
            <Text style={styles.meta}>
              {hub.memberCount} member{hub.memberCount === 1 ? "" : "s"} · {hub.postCount} post{hub.postCount === 1 ? "" : "s"}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>About</Text>
            <Text style={styles.cardBody}>{hub.description}</Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.row}>
              {status.isMember ? (
                status.role === "owner" ? (
                  <Text style={styles.ownerText}>You own this Hub</Text>
                ) : (
                  <TouchableOpacity onPress={leave} disabled={busy} style={styles.leaveBtn}>
                    <Text style={styles.leaveBtnText}>{busy ? "Leaving…" : "Leave Hub"}</Text>
                  </TouchableOpacity>
                )
              ) : (
                <TouchableOpacity style={styles.joinBtn} onPress={join} disabled={busy}>
                  <Text style={styles.joinBtnText}>{busy ? "Joining…" : "Join →"}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.followBtn, status.isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
                disabled={busy}
              >
                <Text style={styles.followBtnText}>{status.isFollowing ? "Following ✓" : "Follow"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Posts</Text>
            <Text style={styles.cardBody}>
              {status.isMember
                ? "Posting into this Hub is coming soon."
                : "Join this Hub to post and comment. Posts will appear here once posting is live."}
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
