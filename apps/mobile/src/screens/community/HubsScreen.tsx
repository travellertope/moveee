import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Hub } from "../../types";
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
    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: space[4] },
    searchInput: {
      flex: 1, height: 40, borderRadius: radius.full, backgroundColor: c.paperWarm,
      paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 13, color: c.ink,
    },
    startBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: 14, height: 36, alignItems: "center", justifyContent: "center",
    },
    startBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    sectionLabel: {
      fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase",
      letterSpacing: 1, paddingHorizontal: space[4], marginTop: 12, marginBottom: 6,
    },
    card: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl, padding: 14,
      marginHorizontal: space[4], marginBottom: 10, gap: 4, ...shadows.card,
    },
    cardName: { fontFamily: fonts.serifBold, fontSize: 16, color: c.ink },
    cardDesc: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 18 },
    cardMeta: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 4 },
    empty: { alignItems: "center", paddingTop: 60, gap: 8, paddingHorizontal: 32 },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center" },
  });
}

export default function HubsScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore() as any;

  const [q, setQ] = useState("");
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [myJoined, setMyJoined] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort: "popular", per_page: "20" });
      if (query) params.set("q", query);
      const data = await api.get<{ hubs: Hub[] }>(`${MOBILE_API}/hub/discover?${params}`, false);
      setHubs(data?.hubs ?? []);
    } catch {
      setHubs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(q), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await api.get<{ joined: Hub[]; followed: Hub[] }>(`${MOBILE_API}/hub/my-hubs`);
        setMyJoined(data?.joined ?? []);
      } catch {
        setMyJoined([]);
      }
    })();
  }, [user]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hubs</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Hubs…"
          placeholderTextColor={c.mute}
          value={q}
          onChangeText={setQ}
        />
        <TouchableOpacity
          style={styles.startBtn}
          onPress={() => nav.navigate("HubCreateScreen")}
        >
          <Text style={styles.startBtnText}>Start →</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : (
        <FlatList
          data={hubs}
          keyExtractor={(h) => String(h.id)}
          ListHeaderComponent={
            myJoined.length > 0 ? (
              <>
                <Text style={styles.sectionLabel}>Hubs you've joined</Text>
                {myJoined.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={styles.card}
                    onPress={() => nav.navigate("HubDetail", { slug: h.slug })}
                  >
                    <Text style={styles.cardName}>{h.name}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>{h.description}</Text>
                  </TouchableOpacity>
                ))}
                <Text style={styles.sectionLabel}>Discover</Text>
              </>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No Hubs found. Be the first to start one.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => nav.navigate("HubDetail", { slug: item.slug })}
            >
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <Text style={styles.cardMeta}>
                {item.memberCount} member{item.memberCount === 1 ? "" : "s"} · {item.postCount} post{item.postCount === 1 ? "" : "s"}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </SafeAreaView>
  );
}
