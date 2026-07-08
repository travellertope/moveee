import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Cluster } from "../../types";
import { useAuthStore } from "../../auth/authStore";

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
    scroll: { padding: space[4], paddingBottom: 40, gap: 10 },
    title: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    sub: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginBottom: 6 },
    card: {
      flexDirection: "row", alignItems: "center", backgroundColor: c.paper,
      borderRadius: radius.xl, padding: 14, gap: 10, ...shadows.card,
    },
    cardActive: {
      flexDirection: "row", alignItems: "center", backgroundColor: c.paper,
      borderRadius: radius.xl, padding: 14, gap: 10, borderWidth: 1.5, borderColor: c.gold, ...shadows.card,
    },
    cardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.ochre, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
    cardName: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink },
    cardMeta: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },
    cardCount: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 4 },
    joinBtn: { backgroundColor: c.ochre, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
    joinBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    startBtn: { alignItems: "center", paddingVertical: 8, marginTop: 4 },
    startBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    empty: {
      backgroundColor: c.paper, borderRadius: radius.xl, padding: 16, gap: 10,
      alignItems: "center", ...shadows.card,
    },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center", lineHeight: 19 },
    startBtnPrimary: { backgroundColor: c.ochre, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 10 },
    startBtnPrimaryText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },
  });
}

export default function StoopHomeScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore() as any;

  const [loading, setLoading] = useState(true);
  const [myCluster, setMyCluster] = useState<Cluster | null>(null);
  const [nearby, setNearby] = useState<Cluster[]>([]);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ clusters: Cluster[] }>(`${MOBILE_API}/cluster/my-clusters`);
        const clusters = data?.clusters ?? [];
        const active = clusters.find((cl) => cl.status !== "archived") ?? null;
        setMyCluster(active);

        if (!active) {
          const params = new URLSearchParams();
          const city = (user?.city ?? "").trim();
          const country = (user?.countryOfResidence ?? "").trim();
          if (city) params.set("city", city);
          else if (country) params.set("country", country);
          const dData = await api.get<{ clusters: Cluster[] }>(`${MOBILE_API}/cluster/discover?${params}`);
          setNearby((dData?.clusters ?? []).slice(0, 10));
        }
      } catch {
        setMyCluster(null);
        setNearby([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.city, user?.countryOfResidence]);

  const join = async (clusterId: number) => {
    setJoiningId(clusterId);
    try {
      await api.post(`${MOBILE_API}/cluster/${clusterId}/join`, {});
      nav.navigate("ClusterScreen", { id: clusterId });
    } catch {
      // no-op, leave card as-is
    } finally {
      setJoiningId(null);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Stoop</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}><ActivityIndicator color={c.gold} /></View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Stoop</Text>
          <Text style={styles.sub}>Weekly, area-level gatherings of Moveee members near you.</Text>

          {myCluster ? (
            <TouchableOpacity
              style={styles.cardActive}
              onPress={() => nav.navigate("ClusterScreen", { id: myCluster.id })}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardLabel}>Your Stoop</Text>
                <Text style={styles.cardName}>{myCluster.name}</Text>
                <Text style={styles.cardMeta}>
                  {[myCluster.street, myCluster.city].filter(Boolean).join(", ")}
                  {myCluster.meetingDay && myCluster.meetingTime
                    ? ` · ${capitalize(myCluster.meetingDay)}s, ${myCluster.meetingTime}`
                    : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.mute} />
            </TouchableOpacity>
          ) : nearby.length > 0 ? (
            <>
              {nearby.map((cl) => (
                <View key={cl.id} style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{cl.name}</Text>
                    <Text style={styles.cardMeta}>
                      {[cl.street, cl.city].filter(Boolean).join(", ")}
                      {cl.meetingDay && cl.meetingTime
                        ? ` · ${capitalize(cl.meetingDay)}s, ${cl.meetingTime}`
                        : ""}
                    </Text>
                    <Text style={styles.cardCount}>
                      {cl.memberCount}{cl.capacity > 0 ? ` / ${cl.capacity}` : ""} members
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => join(cl.id)}
                    disabled={joiningId === cl.id}
                  >
                    <Text style={styles.joinBtnText}>{joiningId === cl.id ? "Joining…" : "Join →"}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.startBtn} onPress={() => nav.navigate("HostOnboardingScreen")}>
                <Text style={styles.startBtnText}>Start a Stoop →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No Stoop near you yet. Be the first to start one in your area.</Text>
              <TouchableOpacity style={styles.startBtnPrimary} onPress={() => nav.navigate("HostOnboardingScreen")}>
                <Text style={styles.startBtnPrimaryText}>Start a Stoop →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
