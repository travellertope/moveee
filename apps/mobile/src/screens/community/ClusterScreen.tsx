import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Cluster, ClusterStatus } from "../../types";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

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
    notFoundCard: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 20,
      alignItems: "center", gap: 10, ...shadows.card,
    },
    notFoundTitle: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, textAlign: "center" },
    notFoundText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center", lineHeight: 19 },
    backLink: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre, marginTop: 4 },
    nameBlock: { gap: 4 },
    eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    name: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    address: { fontFamily: fonts.mono, fontSize: 12, color: c.mute },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 16, gap: 8, ...shadows.card,
    },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
    cardBody: { fontFamily: fonts.sans, fontSize: 14, color: c.ink, lineHeight: 20 },
    locationNote: { fontFamily: fonts.sans, fontSize: 13, color: c.ink, lineHeight: 19, marginTop: 4 },
    memberCount: { fontFamily: fonts.mono, fontSize: 12, color: c.mute, marginTop: 6 },
    joinBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      height: 48, alignItems: "center", justifyContent: "center",
    },
    joinBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    leaveBtn: { alignItems: "center", paddingVertical: 8 },
    leaveBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#C62828" },
    memberLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    errorText: { fontFamily: fonts.sans, fontSize: 12, color: "#C62828" },
  });
}

export default function ClusterScreen() {
  const route = useRoute<any>();
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const clusterId: number = route.params?.id;

  const [cluster, setCluster] = useState<Cluster | null>(null);
  const [status, setStatus] = useState<ClusterStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [clusterRes, statusRes] = await Promise.all([
          api.get<Cluster>(`${MOBILE_API}/cluster/${clusterId}`),
          api.get<ClusterStatus>(`${MOBILE_API}/cluster/${clusterId}/status`),
        ]);
        setCluster(clusterRes ?? null);
        setStatus(statusRes ?? { isMember: false, role: null, joinedAt: null });
      } catch {
        setCluster(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [clusterId]);

  const join = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/join`, {});
      setStatus((s) => ({ isMember: true, role: s?.role ?? null, joinedAt: s?.joinedAt ?? null }));
    } catch {
      setError("Could not join right now.");
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    setBusy(true);
    setError("");
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/leave`, {});
      setStatus((s) => ({ isMember: false, role: s?.role ?? null, joinedAt: s?.joinedAt ?? null }));
    } catch {
      setError("Could not leave right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>House Fellowship</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.ochre} />
        </View>
      ) : !cluster ? (
        <View style={[styles.scroll, { flex: 1, justifyContent: "center" }]}>
          <View style={styles.notFoundCard}>
            <Ionicons name="alert-circle-outline" size={28} color={c.ochre} />
            <Text style={styles.notFoundTitle}>Not found</Text>
            <Text style={styles.notFoundText}>This House Fellowship doesn't exist or has been removed.</Text>
            <TouchableOpacity onPress={() => nav.goBack()}>
              <Text style={styles.backLink}>← Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.nameBlock}>
            <Text style={styles.eyebrow}>People Near Me › House Fellowship</Text>
            <Text style={styles.name}>{cluster.name}</Text>
            <Text style={styles.address}>
              {[cluster.street, cluster.city, cluster.country].filter(Boolean).join(", ")}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardLabel}>Meeting</Text>
            <Text style={styles.cardBody}>
              {cluster.meetingDay && cluster.meetingTime
                ? `${capitalize(cluster.meetingDay)}s, ${cluster.meetingTime}`
                : "Meeting time not set yet."}
            </Text>
            {status?.isMember && cluster.locationNote ? (
              <Text style={styles.locationNote}>
                <Text style={{ fontFamily: fonts.sansBold }}>Location note: </Text>
                {cluster.locationNote}
              </Text>
            ) : null}
            <Text style={styles.memberCount}>
              {cluster.memberCount}{cluster.capacity > 0 ? ` / ${cluster.capacity}` : ""} members
            </Text>
          </View>

          <View style={styles.card}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            {status?.isMember ? (
              <>
                <Text style={styles.memberLabel}>You're a member</Text>
                <TouchableOpacity style={styles.leaveBtn} onPress={() => setConfirmLeave(true)} disabled={busy}>
                  <Text style={styles.leaveBtnText}>{busy ? "Leaving…" : "Leave House Fellowship"}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.memberLabel}>Join this House Fellowship</Text>
                <TouchableOpacity style={styles.joinBtn} onPress={join} disabled={busy}>
                  <Text style={styles.joinBtnText}>{busy ? "Joining…" : "Join →"}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      )}

      <ConfirmDialog
        visible={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={leave}
        title="Leave this House Fellowship?"
        confirmLabel="Leave"
        destructive
      />
    </SafeAreaView>
  );
}
