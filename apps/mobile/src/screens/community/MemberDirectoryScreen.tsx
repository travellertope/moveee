import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import type { Member } from "../../types";
import { useAuthStore } from "../../auth/authStore";

const DISCIPLINES = [
  "All", "Photography", "Visual Art", "Music Production", "Fashion",
  "Film", "Literature", "Architecture", "Design", "Tech",
];

const LOCATIONS = [
  "All", "Nigeria", "United Kingdom", "United States",
  "Ghana", "Kenya", "Canada", "South Africa",
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
          {/* Initials placeholder — swap for Image when avatarUrl exists */}
          <Text style={styles.avatarText}>{initials(member.displayName)}</Text>
        </View>
      </View>

      {/* Identity */}
      <Text style={styles.cardName} numberOfLines={1}>{member.displayName}</Text>
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
  const nav = useNavigation<any>();
  const { user } = useAuthStore() as any;
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [members,    setMembers]    = useState<Member[]>([]);
  const [filtered,   setFiltered]   = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [discipline, setDiscipline] = useState("All");
  // Default location to user's country so they see local members first
  const [location, setLocation] = useState(() => {
    const c = user?.countryOfResidence ?? "";
    if (!c) return "All";
    if (/nigeria/i.test(c)) return "Nigeria";
    if (/united kingdom|uk|gb/i.test(c)) return "United Kingdom";
    if (/united states|usa/i.test(c)) return "United States";
    if (/ghana/i.test(c)) return "Ghana";
    if (/kenya/i.test(c)) return "Kenya";
    if (/canada/i.test(c)) return "Canada";
    if (/south africa/i.test(c)) return "South Africa";
    return "All";
  });
  const [discOpen,   setDiscOpen]   = useState(false);
  const [locOpen,    setLocOpen]    = useState(false);
  const [cityFilter, setCityFilter] = useState("All");

  useEffect(() => {
    api.get<Member[]>(`${MOBILE_API}/members?per_page=100`)
      .then((data) => { setMembers(data ?? []); setFiltered(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Derive city list from loaded members — user's city first
  const availableCities = useMemo(() => {
    const userCity = (user?.city ?? "").trim();
    const seen = new Set<string>();
    const cities: string[] = ["All"];
    if (userCity) { cities.push(userCity); seen.add(userCity.toLowerCase()); }
    members.forEach((m) => {
      const c = (m.city ?? "").trim();
      if (c && !seen.has(c.toLowerCase())) { seen.add(c.toLowerCase()); cities.push(c); }
    });
    return cities;
  }, [members, user?.city]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      members.filter((m) => {
        const matchSearch = !q || (
          (m.displayName || "").toLowerCase().includes(q) ||
          (m.occupation   || "").toLowerCase().includes(q) ||
          (m.city         || "").toLowerCase().includes(q)
        );
        const allInterests = [...(m.interests ?? []), ...(m.disciplines ?? [])];
        const matchDisc = discipline === "All" ||
          allInterests.some((d) => d.toLowerCase().includes(discipline.toLowerCase()));
        const matchLoc = location === "All" ||
          (m.countryOfResidence || "").toLowerCase().includes(location.toLowerCase());
        const matchCity = cityFilter === "All" ||
          (m.city || "").toLowerCase() === cityFilter.toLowerCase();
        return matchSearch && matchDisc && matchLoc && matchCity;
      })
    );
  }, [search, discipline, location, cityFilter, members]);

  const activeFilters = [
    discipline !== "All" && { label: discipline, clear: () => setDiscipline("All") },
    location   !== "All" && { label: location,   clear: () => setLocation("All")   },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Directory</Text>
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
          <TouchableOpacity onPress={() => { setDiscOpen(!discOpen); setLocOpen(false); }}>
            <Ionicons name="options-outline" size={20} color={c.ink} />
          </TouchableOpacity>
        </View>

        {/* Filter chips row */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, discipline !== "All" && styles.filterChipActive]}
            onPress={() => { setDiscOpen(!discOpen); setLocOpen(false); }}
          >
            <Text style={[styles.filterChipText, discipline !== "All" && styles.filterChipTextActive]}>
              {discipline === "All" ? "All Disciplines" : discipline} ▾
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, location !== "All" && styles.filterChipActive]}
            onPress={() => { setLocOpen(!locOpen); setDiscOpen(false); }}
          >
            <Text style={[styles.filterChipText, location !== "All" && styles.filterChipTextActive]}>
              {location === "All" ? "All Locations" : location} ▾
            </Text>
          </TouchableOpacity>
          {activeFilters.map((f) => (
            <TouchableOpacity key={f.label} style={styles.activeChip} onPress={f.clear}>
              <Text style={styles.activeChipText}>{f.label}</Text>
              <Text style={styles.activeChipX}> ✕</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dropdown — Disciplines */}
        {discOpen && (
          <View style={styles.dropdown}>
            {DISCIPLINES.map((d) => (
              <TouchableOpacity key={d} style={styles.dropdownItem} onPress={() => { setDiscipline(d); setDiscOpen(false); }}>
                <Text style={[styles.dropdownItemText, discipline === d && { color: c.ochre, fontFamily: fonts.sansBold }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Dropdown — Locations */}
        {locOpen && (
          <View style={styles.dropdown}>
            {LOCATIONS.map((l) => (
              <TouchableOpacity key={l} style={styles.dropdownItem} onPress={() => { setLocation(l); setLocOpen(false); }}>
                <Text style={[styles.dropdownItemText, location === l && { color: c.ochre, fontFamily: fonts.sansBold }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* City strip — only shown when there are cities and a country is selected */}
      {availableCities.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ backgroundColor: c.paperWarm, borderBottomWidth: 1, borderBottomColor: c.ghost }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8, flexDirection: "row" }}
        >
          {availableCities.map((city) => {
            const isActive = city === cityFilter;
            const label = city === "All" ? "All cities" : (city === user?.city ? `📍 ${city}` : city);
            return (
              <TouchableOpacity
                key={city}
                onPress={() => setCityFilter(city)}
                style={{
                  paddingHorizontal: 12, paddingVertical: 5, borderRadius: 99,
                  borderWidth: 1,
                  borderColor: isActive ? c.ink : c.ghost,
                  backgroundColor: isActive ? c.ink : "transparent",
                }}
              >
                <Text style={{
                  fontFamily: fonts.mono, fontSize: 10,
                  color: isActive ? c.paper : c.mute,
                }}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          ListHeaderComponent={
            <Text style={styles.countText}>{filtered.length} members</Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No members found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your filters.</Text>
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
      paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    searchInput: {
      flex: 1, fontFamily: fonts.sans, fontSize: 14, color: c.ink,
    },
    chipsRow: {
      height: 44, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 16, gap: 8, marginTop: 8,
    },
    filterChip: {
      height: 32, paddingHorizontal: 12, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost, justifyContent: "center",
    },
    filterChipActive:     { backgroundColor: c.ochre, borderColor: c.ochre },
    filterChipText:       { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    filterChipTextActive: { color: c.paper, fontFamily: fonts.sansBold },
    activeChip: {
      height: 32, paddingHorizontal: 10, borderRadius: radius.full,
      backgroundColor: c.ochre, flexDirection: "row", alignItems: "center",
    },
    activeChipText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },
    activeChipX:    { fontFamily: fonts.sans, fontSize: 11, color: c.paper },

    dropdown: {
      position: "absolute", top: 52, left: 16, right: 16, zIndex: 100,
      backgroundColor: c.paper, borderRadius: 8, ...shadows.card,
      borderWidth: 1, borderColor: c.ghost,
    },
    dropdownItem:     { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.ghost + "50" },
    dropdownItemText: { fontFamily: fonts.sans, fontSize: 14, color: c.ink },

    countText: {
      fontFamily: fonts.mono, fontSize: 10, color: c.mute,
      paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
    },
    grid: { paddingHorizontal: 16, paddingBottom: 40 },
    row:  { gap: 12, marginBottom: 12 },

    card: {
      flex: 1, backgroundColor: c.paper, borderRadius: 12,
      padding: 12, alignItems: "center", gap: 0, ...shadows.card,
    },
    avatarRing: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 2, padding: 2, marginBottom: 8,
    },
    avatarRingPro:     { borderColor: c.gold },
    avatarRingCitizen: { borderColor: c.ghost },
    avatarInner: {
      flex: 1, borderRadius: 20, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center",
    },
    avatarText: { fontFamily: fonts.monoBold, fontSize: 12, color: c.inkSoft },

    cardName:   { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, textAlign: "center" },
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
  });
}
