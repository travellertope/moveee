import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput, Image,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNav } from "../../hooks/useNav";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useTabletContentStyle } from "../../hooks/useTabletContentStyle";
import { api, MOBILE_API } from "../../api/client";
import type { Hub } from "../../types";
import { useAuthStore } from "../../auth/authStore";
import { hubGradient } from "../../utils/hubGradient";

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paper },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], borderBottomWidth: 1,
      borderBottomColor: c.rule, backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, flex: 1, textAlign: "center" },

    // Hero
    hero: { paddingHorizontal: space[4], paddingTop: space[4], paddingBottom: 4 },
    heroEyebrow: {
      fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.ochre,
      textTransform: "uppercase", letterSpacing: 1, marginBottom: 6,
    },
    heroTitle: { fontFamily: fonts.serifBold, fontSize: 24, color: c.ink, lineHeight: 30 },
    heroSub: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 19, marginTop: 6 },

    searchRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: space[4], paddingBottom: 6 },
    searchInput: {
      flex: 1, height: 40, borderRadius: radius.full, backgroundColor: c.paperDeep,
      paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 13, color: c.ink,
    },
    startBtn: {
      backgroundColor: c.ochre, borderRadius: radius.full,
      paddingHorizontal: 14, height: 36, alignItems: "center", justifyContent: "center",
    },
    startBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },

    section: { paddingTop: 18 },
    sectionHead: {
      flexDirection: "row", alignItems: "baseline", justifyContent: "space-between",
      paddingHorizontal: space[4], marginBottom: 10,
    },
    sectionTitle: { fontFamily: fonts.serifBold, fontSize: 16, color: c.ink },
    sectionMore: {
      fontFamily: fonts.mono, fontSize: 10, color: c.mute,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    rail: { paddingHorizontal: space[4], gap: 12 },

    // "Your Hubs" avatar tiles
    tile: { width: 74, alignItems: "center", gap: 6 },
    tileName: { fontFamily: fonts.sansBold, fontSize: 11, color: c.ink, textAlign: "center", lineHeight: 14 },

    // Trending cards
    trendCard: {
      width: 170, borderRadius: radius.xl, backgroundColor: c.paper, overflow: "hidden", ...shadows.card,
    },
    trendCover: { height: 64, position: "relative" },
    trendSpark: {
      position: "absolute", top: 7, left: 7, backgroundColor: "rgba(20,17,13,0.55)",
      borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3,
    },
    trendSparkText: { fontFamily: fonts.monoBold, fontSize: 9, color: "#fff" },
    trendBody: { padding: 10, gap: 3 },
    trendName: { fontFamily: fonts.serifBold, fontSize: 13, color: c.ink },
    trendStats: { fontFamily: fonts.mono, fontSize: 9.5, color: c.mute },

    // Explore-all grid — contentContainer carries no horizontal padding of
    // its own; gridRow (columnWrapperStyle, applied per row) supplies it,
    // so header sections (which pad themselves individually) and grid rows
    // line up on the same edges without double-padding either.
    contentContainer: { paddingBottom: 40 },
    gridRow: { gap: 10, paddingHorizontal: space[4], marginBottom: 10 },
    gridCard: {
      flex: 1, borderRadius: radius.xl, backgroundColor: c.paper, overflow: "hidden", ...shadows.card,
    },
    gridCover: { height: 72, alignItems: "center", justifyContent: "center" },
    gridCoverLetter: { fontFamily: fonts.serifBold, fontSize: 22, color: "rgba(255,255,255,0.85)" },
    gridBody: { padding: 10, gap: 3 },
    gridName: { fontFamily: fonts.serifBold, fontSize: 14, color: c.ink },
    gridDesc: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, lineHeight: 15 },
    gridFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
    gridStats: { fontFamily: fonts.mono, fontSize: 9, color: c.mute, flexShrink: 1 },
    gridJoined: { fontFamily: fonts.sansBold, fontSize: 9, color: c.success },

    empty: { alignItems: "center", paddingTop: 60, gap: 8, paddingHorizontal: 32 },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center" },
  });
}

function HubAvatar({ hub, size, textSize }: { hub: Hub; size: number; textSize: number }) {
  return (
    <LinearGradient
      colors={hubGradient(hub.id)}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.28, alignItems: "center", justifyContent: "center" }}
    >
      <Text style={{ fontFamily: fonts.serifBold, fontSize: textSize, color: "#fff" }}>
        {(hub.name || "?").slice(0, 1).toUpperCase()}
      </Text>
    </LinearGradient>
  );
}

export default function HubsScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = React.useMemo(() => createStyles(c), [c]);
  const tabletCap = useTabletContentStyle(680);
  const { user } = useAuthStore() as any;

  const [q, setQ] = useState("");
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [myJoined, setMyJoined] = useState<Hub[]>([]);
  const [trending, setTrending] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);

  const joinedIds = useMemo(() => new Set(myJoined.map((h) => h.id)), [myJoined]);

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

  // Trending is independent of the search query — it sits above the
  // search/grid section, same as "Your Hubs", so it's fetched once.
  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<{ hubs: Hub[] }>(`${MOBILE_API}/hub/discover?sort=trending&per_page=8`, false);
        setTrending(data?.hubs ?? []);
      } catch {
        setTrending([]);
      }
    })();
  }, []);

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

  const listHeader = (
    <>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>Topic Communities</Text>
        <Text style={styles.heroTitle}>Find your corner.</Text>
        <Text style={styles.heroSub}>Built by members, for the niches the main Sections don't cover.</Text>
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

      {myJoined.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your Hubs</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {myJoined.map((h) => (
              <TouchableOpacity key={h.id} style={styles.tile} onPress={() => nav.navigate("HubDetail", { slug: h.slug })}>
                <HubAvatar hub={h} size={58} textSize={20} />
                <Text style={styles.tileName} numberOfLines={2}>{h.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {trending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>🔥 Trending</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
            {trending.map((h) => (
              <TouchableOpacity key={h.id} style={styles.trendCard} onPress={() => nav.navigate("HubDetail", { slug: h.slug })}>
                <View style={styles.trendCover}>
                  {h.coverImageUrl ? (
                    <Image source={{ uri: h.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={hubGradient(h.id)} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                  )}
                  <View style={styles.trendSpark}>
                    <Text style={styles.trendSparkText}>▲ Trending</Text>
                  </View>
                </View>
                <View style={styles.trendBody}>
                  <Text style={styles.trendName} numberOfLines={1}>{h.name}</Text>
                  <Text style={styles.trendStats}>{h.memberCount} members</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={[styles.section, styles.sectionHead]}>
        <Text style={styles.sectionTitle}>Explore all</Text>
        <Text style={styles.sectionMore}>{hubs.length} Hub{hubs.length === 1 ? "" : "s"}</Text>
      </View>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hubs</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading && hubs.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : (
        <FlatList
          data={hubs}
          keyExtractor={(h) => String(h.id)}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No Hubs found. Be the first to start one.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridCard} onPress={() => nav.navigate("HubDetail", { slug: item.slug })}>
              <View style={styles.gridCover}>
                {item.coverImageUrl ? (
                  <Image source={{ uri: item.coverImageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                ) : (
                  <>
                    <LinearGradient colors={hubGradient(item.id)} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
                    <Text style={styles.gridCoverLetter}>{(item.name || "?").slice(0, 1).toUpperCase()}</Text>
                  </>
                )}
              </View>
              <View style={styles.gridBody}>
                <Text style={styles.gridName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.gridDesc} numberOfLines={2}>{item.description}</Text>
                <View style={styles.gridFoot}>
                  <Text style={styles.gridStats} numberOfLines={1}>
                    {item.memberCount} member{item.memberCount === 1 ? "" : "s"}
                  </Text>
                  {joinedIds.has(item.id) && <Text style={styles.gridJoined}>✓ Joined</Text>}
                </View>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={[styles.contentContainer, tabletCap]}
        />
      )}
    </SafeAreaView>
  );
}
