import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, Linking,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import { api, CULTURE_API } from "../../api/client";
import type { Member } from "../../types";

const DISCIPLINES = [
  "All", "Creative", "Entrepreneur", "Artist", "Filmmaker",
  "Writer", "Designer", "Musician", "Photographer", "Tech",
  "Legal", "Finance", "Academic",
];

const LOCATIONS = [
  "All", "Nigeria", "United Kingdom", "United States", "Ghana",
  "South Africa", "Kenya", "France", "Canada", "Other",
];

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function Avatar({ member }: { member: Member }) {
  return (
    <View style={[styles.avatar, member.tier === "patron" && styles.avatarPro]}>
      <Text style={styles.avatarText}>{initials(member.displayName)}</Text>
    </View>
  );
}

function MemberCard({ member, onPress }: { member: Member; onPress: () => void }) {
  const isPro = member.tier === "patron";
  return (
    <TouchableOpacity
      style={[styles.card, isPro ? styles.cardPro : styles.cardCitizen]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <Avatar member={member} />
        {isPro && (
          <View style={styles.proBadge}>
            <Text style={styles.proBadgeText}>PRO</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>{member.displayName}</Text>
      {member.username ? (
        <Text style={styles.handle}>@{member.username}</Text>
      ) : null}
      {member.city ? (
        <Text style={styles.location}>{member.city.toUpperCase()}</Text>
      ) : null}

      {member.disciplines && member.disciplines.length > 0 && (
        <View style={styles.tagsRow}>
          {member.disciplines.slice(0, 3).map((d) => (
            <View key={d} style={styles.tag}>
              <Text style={styles.tagText}>{d}</Text>
            </View>
          ))}
        </View>
      )}

      {member.bio ? (
        <Text style={styles.bio} numberOfLines={2}>{member.bio}</Text>
      ) : null}

      <View style={styles.linksRow}>
        {member.instagram ? (
          <TouchableOpacity onPress={() => Linking.openURL(`https://instagram.com/${member.instagram}`)}>
            <Text style={styles.linkText}>IG</Text>
          </TouchableOpacity>
        ) : null}
        {member.linkedin ? (
          <TouchableOpacity onPress={() => Linking.openURL(member.linkedin)}>
            <Text style={styles.linkText}>LI</Text>
          </TouchableOpacity>
        ) : null}
        {member.website ? (
          <TouchableOpacity onPress={() => Linking.openURL(member.website)}>
            <Text style={styles.linkText}>WEB</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

export default function MemberDirectoryScreen() {
  const nav = useNavigation<any>();
  const [members, setMembers] = useState<Member[]>([]);
  const [filtered, setFiltered] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [discipline, setDiscipline] = useState("All");
  const [location, setLocation] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.get<Member[]>(`${CULTURE_API}/members?per_page=100`, false);
        setMembers(data);
        setFiltered(data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      members.filter((m) => {
        const matchSearch = !q || (
          m.displayName.toLowerCase().includes(q) ||
          (m.occupation || "").toLowerCase().includes(q) ||
          (m.city || "").toLowerCase().includes(q)
        );
        const matchDisc = discipline === "All" || (m.disciplines || []).some(
          (d) => d.toLowerCase() === discipline.toLowerCase()
        );
        const matchLoc = location === "All" || (
          (m.countryOfResidence || "").toLowerCase().includes(location.toLowerCase())
        );
        return matchSearch && matchDisc && matchLoc;
      })
    );
  }, [search, discipline, location, members]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Directory</Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={colors.mute} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members…"
          placeholderTextColor={colors.ghost}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersRow}>
        <TouchableOpacity style={styles.filterBtn} onPress={() => {
          const idx = DISCIPLINES.indexOf(discipline);
          setDiscipline(DISCIPLINES[(idx + 1) % DISCIPLINES.length]);
        }}>
          <Text style={styles.filterBtnText}>
            {discipline === "All" ? "Discipline ▾" : discipline + " ▾"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => {
          const idx = LOCATIONS.indexOf(location);
          setLocation(LOCATIONS[(idx + 1) % LOCATIONS.length]);
        }}>
          <Text style={styles.filterBtnText}>
            {location === "All" ? "Location ▾" : location + " ▾"}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>The directory is growing</Text>
          <Text style={styles.emptyLink}>Join & get listed →</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(m) => m.id}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <MemberCard
              member={item}
              onPress={() => nav.navigate("MemberProfile", { userId: item.id, username: item.username })}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink,
  },

  searchWrap: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: space[4], marginTop: space[3], marginBottom: space[2],
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, paddingHorizontal: space[3], paddingVertical: space[2],
  },
  searchIcon: { marginRight: space[2] },
  searchInput: {
    flex: 1, fontSize: fontSize.base, fontFamily: fonts.sans, color: colors.ink,
  },

  filtersRow: {
    flexDirection: "row", gap: space[2],
    paddingHorizontal: space[4], marginBottom: space[3],
  },
  filterBtn: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: space[1] + 2,
  },
  filterBtnText: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.inkSoft,
  },

  grid: { paddingHorizontal: space[3], paddingBottom: space[6] },
  row: { gap: space[3], marginBottom: space[3] },

  card: {
    flex: 1, backgroundColor: colors.paper,
    borderWidth: 1, borderRadius: radius.lg, padding: space[3],
    gap: space[1],
  },
  cardPro:     { borderColor: colors.gold },
  cardCitizen: { borderColor: colors.rule },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: space[1] },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.ink, justifyContent: "center", alignItems: "center",
  },
  avatarPro: { borderWidth: 1, borderColor: colors.gold },
  avatarText: { fontFamily: fonts.monoBold, fontSize: fontSize.sm, color: colors.paperWarm },

  proBadge: {
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.sm, paddingHorizontal: 5, paddingVertical: 1, alignSelf: "flex-start",
  },
  proBadgeText: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    letterSpacing: 1.5, color: colors.gold,
  },

  name: { fontFamily: fonts.serifBold, fontSize: fontSize.md - 1, color: colors.ink },
  handle: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1 },
  location: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1 },

  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  tag: {
    backgroundColor: colors.goldLight, borderRadius: radius.sm,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  tagText: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: colors.gold },

  bio: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, lineHeight: 16 },

  linksRow: { flexDirection: "row", gap: space[2], marginTop: 2 },
  linkText: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.gold },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: space[2] },
  emptyTitle: { fontFamily: fonts.serif, fontSize: fontSize.lg, color: colors.inkSoft },
  emptyLink: { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.gold },
});
