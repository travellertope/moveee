import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import { api, MOBILE_API } from "../../api/client";
import type { Member } from "../../types";

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

function MemberCard({ member, onPress }: { member: Member; onPress: () => void }) {
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
              <Text style={[styles.tagText, { color: colors.ghost }]}>+{extra} more</Text>
            </View>
          )}
        </View>
      )}

      {/* Social icon links */}
      <View style={styles.socialRow}>
        {member.instagram ? (
          <Ionicons name="logo-instagram" size={16} color={colors.ghost} />
        ) : null}
        {member.linkedin ? (
          <Ionicons name="logo-linkedin" size={16} color={colors.ghost} />
        ) : null}
        {member.website ? (
          <Ionicons name="globe-outline" size={16} color={colors.ghost} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MemberDirectoryScreen() {
  const nav = useNavigation<any>();
  const [members,    setMembers]    = useState<Member[]>([]);
  const [filtered,   setFiltered]   = useState<Member[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [location,   setLocation]   = useState("All");
  const [discOpen,   setDiscOpen]   = useState(false);
  const [locOpen,    setLocOpen]    = useState(false);

  useEffect(() => {
    api.get<Member[]>(`${MOBILE_API}/members?per_page=100`)
      .then((data) => { setMembers(data ?? []); setFiltered(data ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
        return matchSearch && matchDisc && matchLoc;
      })
    );
  }, [search, discipline, location, members]);

  const activeFilters = [
    discipline !== "All" && { label: discipline, clear: () => setDiscipline("All") },
    location   !== "All" && { label: location,   clear: () => setLocation("All")   },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Directory</Text>
        <View style={styles.headerSideBtn} />
      </View>

      {/* Search + filter icon row */}
      <View style={styles.searchSection}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.mute} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, discipline or city"
            placeholderTextColor={colors.ghost}
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity onPress={() => { setDiscOpen(!discOpen); setLocOpen(false); }}>
            <Ionicons name="options-outline" size={20} color={colors.ink} />
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
                <Text style={[styles.dropdownItemText, discipline === d && { color: colors.ochre, fontFamily: fonts.sansBold }]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        {/* Dropdown — Locations */}
        {locOpen && (
          <View style={styles.dropdown}>
            {LOCATIONS.map((l) => (
              <TouchableOpacity key={l} style={styles.dropdownItem} onPress={() => { setLocation(l); setLocOpen(false); }}>
                <Text style={[styles.dropdownItemText, location === l && { color: colors.ochre, fontFamily: fonts.sansBold }]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />
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
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], backgroundColor: colors.paper,
  },
  headerSideBtn:  { minWidth: 44, minHeight: 44, justifyContent: "center" },
  headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },

  // Search section
  searchSection: {
    backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.ghost,
    paddingBottom: 8,
  },
  searchRow: {
    height: 48, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  searchInput: {
    flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink,
  },
  chipsRow: {
    height: 44, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 8, marginTop: 8,
  },
  filterChip: {
    height: 32, paddingHorizontal: 12, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.ghost, justifyContent: "center",
  },
  filterChipActive:     { backgroundColor: colors.ochre, borderColor: colors.ochre },
  filterChipText:       { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft },
  filterChipTextActive: { color: colors.paper, fontFamily: fonts.sansBold },
  activeChip: {
    height: 32, paddingHorizontal: 10, borderRadius: radius.full,
    backgroundColor: colors.ochre, flexDirection: "row", alignItems: "center",
  },
  activeChipText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.paper },
  activeChipX:    { fontFamily: fonts.sans, fontSize: 11, color: colors.paper },

  // Dropdowns
  dropdown: {
    position: "absolute", top: 52, left: 16, right: 16, zIndex: 100,
    backgroundColor: colors.paper, borderRadius: 8, ...shadows.card,
    borderWidth: 1, borderColor: colors.ghost,
  },
  dropdownItem:     { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.ghost + "50" },
  dropdownItemText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },

  // Grid
  countText: {
    fontFamily: fonts.mono, fontSize: 10, color: colors.mute,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
  },
  grid: { paddingHorizontal: 16, paddingBottom: 40 },
  row:  { gap: 12, marginBottom: 12 },

  // Card
  card: {
    flex: 1, backgroundColor: colors.paper, borderRadius: 12,
    padding: 12, alignItems: "center", gap: 0, ...shadows.card,
  },
  avatarRing: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, padding: 2, marginBottom: 8,
  },
  avatarRingPro:     { borderColor: colors.gold },
  avatarRingCitizen: { borderColor: colors.ghost },
  avatarInner: {
    flex: 1, borderRadius: 20, backgroundColor: colors.paperDeep,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.inkSoft },

  cardName:   { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink, textAlign: "center" },
  cardHandle: { fontFamily: fonts.mono, fontSize: 10, color: colors.mute, marginTop: 2 },
  cardCity:   { fontFamily: fonts.sans, fontSize: 11, color: colors.mute, marginTop: 4 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4, marginTop: 8 },
  tag: {
    borderWidth: 1, borderColor: colors.ghost, borderRadius: radius.full,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  tagText: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.inkSoft },

  socialRow: { flexDirection: "row", gap: 8, marginTop: 12, justifyContent: "center" },

  // Empty state
  empty:     { alignItems: "center", paddingTop: 40, gap: 8 },
  emptyTitle:{ fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink },
  emptyDesc: { fontFamily: fonts.sans, fontSize: 14, color: colors.mute },
});
