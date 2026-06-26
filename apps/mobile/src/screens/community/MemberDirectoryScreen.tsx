import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Member, Cluster } from "../../types";
import { useAuthStore } from "../../auth/authStore";

function capitalize(s: string) {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function HouseFellowshipSection({
  styles, c,
}: { styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  const nav = useNav();
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
          setNearby((dData?.clusters ?? []).slice(0, 3));
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

  if (loading) return null;

  return (
    <View style={styles.hfSection}>
      <Text style={styles.hfTitle}>House Fellowship</Text>
      <Text style={styles.hfSub}>Weekly, street-level gatherings of Moveee members near you.</Text>

      {myCluster ? (
        <TouchableOpacity
          style={styles.hfCardActive}
          onPress={() => nav.navigate("ClusterScreen", { id: myCluster.id })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.hfCardLabel}>Your House Fellowship</Text>
            <Text style={styles.hfCardName}>{myCluster.name}</Text>
            <Text style={styles.hfCardMeta}>
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
            <View key={cl.id} style={styles.hfCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.hfCardName}>{cl.name}</Text>
                <Text style={styles.hfCardMeta}>
                  {[cl.street, cl.city].filter(Boolean).join(", ")}
                  {cl.meetingDay && cl.meetingTime
                    ? ` · ${capitalize(cl.meetingDay)}s, ${cl.meetingTime}`
                    : ""}
                </Text>
                <Text style={styles.hfCardCount}>
                  {cl.memberCount}{cl.capacity > 0 ? ` / ${cl.capacity}` : ""} members
                </Text>
              </View>
              <TouchableOpacity
                style={styles.hfJoinBtn}
                onPress={() => join(cl.id)}
                disabled={joiningId === cl.id}
              >
                <Text style={styles.hfJoinBtnText}>{joiningId === cl.id ? "Joining…" : "Join →"}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.hfStartBtn} onPress={() => nav.navigate("HostOnboardingScreen")}>
            <Text style={styles.hfStartBtnText}>Start a House Fellowship →</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.hfEmpty}>
          <Text style={styles.hfEmptyText}>No House Fellowship near you yet. Be the first to start one on your street.</Text>
          <TouchableOpacity style={styles.hfStartBtnPrimary} onPress={() => nav.navigate("HostOnboardingScreen")}>
            <Text style={styles.hfStartBtnPrimaryText}>Start a House Fellowship →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const DISCIPLINES = [
  "All", "Photography", "Visual Art", "Music Production", "Fashion",
  "Film", "Literature", "Architecture", "Design", "Tech",
];

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function MemberCard({
  member,
  onPress,
  styles,
  c,
}: {
  member: Member;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  const isPro = member.tier === "patron";
  const interests = member.interests ?? member.disciplines ?? [];
  const shown  = interests.slice(0, 2);
  const extra  = interests.length - 2;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Avatar */}
      <View style={[styles.avatarRing, isPro ? styles.avatarRingPro : styles.avatarRingCitizen]}>
        <View style={styles.avatarInner}>
          <Text style={styles.avatarText}>{initials(member.displayName)}</Text>
        </View>
      </View>

      {/* Identity */}
      <View style={styles.cardNameRow}>
        <Text style={styles.cardName} numberOfLines={1}>{member.displayName}</Text>
        {isPro ? (
          <Ionicons name="checkmark-circle" size={14} color={c.gold} style={styles.proCheck} />
        ) : null}
      </View>
      {member.username ? (
        <Text style={styles.cardHandle}>@{member.username}</Text>
      ) : null}
      {(member.city || member.countryOfResidence) ? (
        <Text style={styles.cardCity}>
          📍 {[member.city, member.countryOfResidence].filter(Boolean).join(", ")}
        </Text>
      ) : null}

      {/* Interest tags */}
      {shown.length > 0 && (
        <View style={styles.tagsRow}>
          {shown.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          {extra > 0 && (
            <View style={styles.tag}>
              <Text style={[styles.tagText, { color: c.ghost }]}>+{extra} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Social icon links */}
      <View style={styles.socialRow}>
        {member.instagram ? (
          <Ionicons name="logo-instagram" size={16} color={c.ghost} />
        ) : null}
        {member.linkedin ? (
          <Ionicons name="logo-linkedin" size={16} color={c.ghost} />
        ) : null}
        {member.website ? (
          <Ionicons name="globe-outline" size={16} color={c.ghost} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MemberDirectoryScreen() {
  const nav = useNav();
  const { user } = useAuthStore() as any;
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [members,    setMembers]    = useState<Member[]>([]);
  const [filtered,   setFiltered]   = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [discOpen,   setDiscOpen]   = useState(false);

  useEffect(() => {
    api.get<Member[]>(`${MOBILE_API}/members?per_page=100`)
      .then((data) => { setMembers(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // People Near Me: scope to the viewer's own city first, falling back to
  // their country if nobody in their exact city matches.
  const nearbyMembers = useMemo(() => {
    const userCity = (user?.city ?? "").trim().toLowerCase();
    const userCountry = (user?.countryOfResidence ?? "").trim().toLowerCase();
    if (!userCity && !userCountry) return members;

    if (userCity) {
      const cityMatches = members.filter((m) => (m.city ?? "").trim().toLowerCase() === userCity);
      if (cityMatches.length > 0) return cityMatches;
    }
    if (userCountry) {
      return members.filter((m) => (m.countryOfResidence ?? "").trim().toLowerCase() === userCountry);
    }
    return members;
  }, [members, user?.city, user?.countryOfResidence]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      nearbyMembers.filter((m) => {
        const matchSearch = !q || (
          (m.displayName || "").toLowerCase().includes(q) ||
          (m.occupation   || "").toLowerCase().includes(q) ||
          (m.city         || "").toLowerCase().includes(q)
        );
        const allInterests = [...(m.interests ?? []), ...(m.disciplines ?? [])];
        const matchDisc = discipline === "All" ||
          allInterests.some((d) => d.toLowerCase().includes(discipline.toLowerCase()));
        return matchSearch && matchDisc;
      })
    );
  }, [search, discipline, nearbyMembers]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>People Near Me</Text>
        <View style={styles.headerSideBtn} />
      </View>

      {/* Search + filter icon row */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={c.mute} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, discipline or city"
            placeholderTextColor={c.ghost}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity
            onPress={() => { setFiltersOpen((v) => !v); setDiscOpen(false); }}
            style={[styles.filterIconBtn, filtersOpen && styles.filterIconBtnActive]}
          >
            <Ionicons name="options-outline" size={20} color={filtersOpen ? c.paper : c.ink} />
            {discipline !== "All" && (
              <View style={styles.filterDot} />
            )}
          </TouchableOpacity>
        </View>

        {/* Filter panel — shown only when filter icon is toggled */}
        {filtersOpen && (
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.filterChip, discipline !== "All" && styles.filterChipActive]}
              onPress={() => {
                if (discipline !== "All") { setDiscipline("All"); }
                else { setDiscOpen(!discOpen); }
              }}
            >
              <Text style={[styles.filterChipText, discipline !== "All" && styles.filterChipTextActive]}>
                {discipline === "All" ? "Industry ▾" : `${discipline} ✕`}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={<HouseFellowshipSection styles={styles} c={c} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No one near you yet.</Text>
              <Text style={styles.emptyDesc}>Members who have opted into the directory will appear here once someone near you joins.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <MemberCard
                member={item}
                onPress={() => nav.navigate("MemberProfile", { userId: item.id, username: item.username })}
                styles={styles}
                c={c}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Dropdown overlays — rendered last so they paint above the grid on Android */}
      {filtersOpen && discOpen && (
        <View style={styles.dropdown}>
          {DISCIPLINES.map((d) => (
            <TouchableOpacity key={d} style={styles.dropdownItem} onPress={() => { setDiscipline(d); setDiscOpen(false); }}>
              <Text style={[styles.dropdownItemText, discipline === d && { color: c.ochre, fontFamily: fonts.sansBold }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], backgroundColor: c.paper,
    },
    headerSideBtn:  { minWidth: 44, minHeight: 44, justifyContent: "center" },
    headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },

    searchSection: {
      backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.ghost,
      paddingBottom: 8,
    },
    searchRow: {
      height: 48, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16,
    },
    searchInput: {
      flex: 1, fontFamily: fonts.sans, fontSize: 14, color: c.ink,
    },
    filterIconBtn: {
      width: 36, height: 36, borderRadius: 18,
      alignItems: "center", justifyContent: "center",
    },
    filterIconBtnActive: { backgroundColor: c.ink },
    filterDot: {
      position: "absolute", top: 4, right: 4,
      width: 7, height: 7, borderRadius: 4,
      backgroundColor: c.ochre, borderWidth: 1.5, borderColor: c.paper,
    },
    chipsRow: {
      flexDirection: "row", alignItems: "center", flexWrap: "wrap",
      paddingHorizontal: 16, gap: 8, paddingVertical: 10,
    },
    filterChip: {
      height: 32, paddingHorizontal: 12, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost, justifyContent: "center",
    },
    filterChipActive:     { backgroundColor: c.ochre, borderColor: c.ochre },
    filterChipText:       { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    filterChipTextActive: { color: c.paper, fontFamily: fonts.sansBold },
    dropdown: {
      position: "absolute", top: 108, left: 16, right: 16, zIndex: 100,
      backgroundColor: c.paper, borderRadius: 8, ...shadows.card, elevation: 20,
      borderWidth: 1, borderColor: c.ghost,
    },
    dropdownItem:     { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.ghost + "50" },
    dropdownItemText: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },

    grid: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40 },
    row:  { gap: 12, marginBottom: 12 },

    card: {
      flex: 1, backgroundColor: c.paper, borderRadius: 12,
      padding: 12, alignItems: "center", gap: 0, ...shadows.card,
    },
    avatarRing: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 2, padding: 2, marginBottom: 8,
      backgroundColor: c.paper,
    },
    avatarRingPro: {
      borderColor: c.gold,
      shadowColor: c.gold,
      shadowOpacity: 0.6,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 0 },
      elevation: 8,
    },
    avatarRingCitizen: { borderColor: c.ghost },
    avatarInner: {
      flex: 1, borderRadius: 20, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center",
    },
    avatarText: { fontFamily: fonts.monoBold, fontSize: 12, color: c.inkSoft },

    cardNameRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3 },
    cardName:   { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, textAlign: "center" },
    proCheck:   { marginTop: 1 },
    cardHandle: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, marginTop: 2 },
    cardCity:   { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginTop: 4 },

    tagsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4, marginTop: 8 },
    tag: {
      borderWidth: 1, borderColor: c.ghost, borderRadius: radius.full,
      paddingHorizontal: 8, paddingVertical: 4,
    },
    tagText: { fontFamily: fonts.sansBold, fontSize: 9, color: c.inkSoft },

    socialRow: { flexDirection: "row", gap: 8, marginTop: 12, justifyContent: "center" },

    empty:     { alignItems: "center", paddingTop: 40, gap: 8 },
    emptyTitle:{ fontFamily: fonts.serifBold, fontSize: 18, color: c.ink },
    emptyDesc: { fontFamily: fonts.sans, fontSize: 14, color: c.mute },

    hfSection: { paddingTop: 16, paddingBottom: 8, gap: 10 },
    hfTitle: { fontFamily: fonts.serifBold, fontSize: 17, color: c.ink },
    hfSub: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: -4, marginBottom: 4 },
    hfCard: {
      flexDirection: "row", alignItems: "center", backgroundColor: c.paper,
      borderRadius: radius.xl, padding: 14, gap: 10, ...shadows.card,
    },
    hfCardActive: {
      flexDirection: "row", alignItems: "center", backgroundColor: c.paper,
      borderRadius: radius.xl, padding: 14, gap: 10, borderWidth: 1.5, borderColor: c.gold, ...shadows.card,
    },
    hfCardLabel: { fontFamily: fonts.monoBold, fontSize: 10, color: c.ochre, textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 },
    hfCardName: { fontFamily: fonts.serifBold, fontSize: 15, color: c.ink },
    hfCardMeta: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 2 },
    hfCardCount: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 4 },
    hfJoinBtn: { backgroundColor: c.ochre, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
    hfJoinBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    hfStartBtn: { alignItems: "center", paddingVertical: 8 },
    hfStartBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    hfEmpty: {
      backgroundColor: c.paper, borderRadius: radius.xl, padding: 16, gap: 10,
      alignItems: "center", ...shadows.card,
    },
    hfEmptyText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center", lineHeight: 19 },
    hfStartBtnPrimary: { backgroundColor: c.ochre, borderRadius: radius.full, paddingHorizontal: 18, paddingVertical: 10 },
    hfStartBtnPrimaryText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },
  });
}
