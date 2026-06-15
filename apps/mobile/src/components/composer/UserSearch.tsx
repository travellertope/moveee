import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

export interface MemberResult {
  id: number;
  username: string;
  display_name: string;
  occupation?: string;
  city?: string;
  tier?: string;
}

interface Props {
  onSelect: (member: MemberResult | null) => void;
  selected?: MemberResult | null;
  label?: string;
  placeholder?: string;
}

const AVATAR_PALETTE: Array<[string, string]> = [
  ["#9b51e0", "#f2994a"], ["#2D9CDB", "#9b51e0"], ["#C5491F", "#E2A684"],
  ["#B38238", "#E2A684"], ["#8E54E9", "#4776E6"], ["#00695C", "#4B6CB7"],
];
function avatarGradient(name: string): [string, string] {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

let debounceTimer: ReturnType<typeof setTimeout>;

export default function UserSearch({ onSelect, selected, label, placeholder }: Props) {
  const [query,   setQuery]   = useState("");
  const [results, setResults] = useState<MemberResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  const search = useCallback((q: string) => {
    clearTimeout(debounceTimer);
    if (!q.trim()) { setResults([]); setShowList(false); return; }
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.get<MemberResult[]>(
          `${CULTURE_API}/members?search=${encodeURIComponent(q)}&per_page=10`,
          true
        );
        setResults(data ?? []);
        setShowList(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    search(v);
  };

  const handleSelect = (member: MemberResult) => {
    onSelect(member);
    setQuery("");
    setResults([]);
    setShowList(false);
  };

  if (selected) {
    const [g1, g2] = avatarGradient(selected.display_name);
    return (
      <View style={styles.selectedRow}>
        <LinearGradient colors={[g1, g2]} style={styles.selectedAvatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedName}>{selected.display_name}</Text>
          <Text style={styles.selectedHandle}>@{selected.username}</Text>
        </View>
        <TouchableOpacity onPress={() => onSelect(null)} style={styles.clearBtn}>
          <Ionicons name="close" size={16} color={colors.mute} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.searchRow}>
        <Text style={styles.atSign}>@</Text>
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder ?? "Search members…"}
          placeholderTextColor={colors.ghost}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading
          ? <ActivityIndicator size="small" color={colors.gold} />
          : <Ionicons name="search-outline" size={15} color={colors.mute} />
        }
      </View>

      {showList && (
        <View style={styles.dropdown}>
          {results.length === 0 ? (
            <Text style={styles.noResultsText}>No members found for "{query}"</Text>
          ) : (
            results.slice(0, 8).map((r) => {
              const [g1, g2] = avatarGradient(r.display_name);
              return (
                <TouchableOpacity
                  key={r.id}
                  style={styles.resultRow}
                  onPress={() => handleSelect(r)}
                  activeOpacity={0.75}
                >
                  <LinearGradient colors={[g1, g2]} style={styles.resultAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultName}>{r.display_name}</Text>
                    <Text style={styles.resultMeta}>
                      @{r.username}{r.occupation ? `  ·  ${r.occupation}` : ""}{r.city ? `  ·  ${r.city}` : ""}
                    </Text>
                  </View>
                  {r.tier === "patron" && (
                    <View style={styles.proBadge}>
                      <Ionicons name="ribbon" size={9} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  sectionLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs,
    color: colors.mute, letterSpacing: 0.8, textTransform: "uppercase",
  },

  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[2], backgroundColor: colors.paper,
  },
  atSign: {
    fontFamily: fonts.sansBold, fontSize: 15, color: colors.mute, marginRight: 4,
  },
  searchInput: {
    flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base,
    color: colors.ink, paddingVertical: space[2],
  },

  dropdown: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    backgroundColor: colors.paper, overflow: "hidden",
  },
  noResultsText: {
    fontFamily: fonts.sans, fontSize: fontSize.sm,
    color: colors.mute, padding: space[3],
  },

  resultRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    paddingHorizontal: space[3], paddingVertical: space[2] + 2,
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  resultAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  resultName:   { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  resultMeta:   { fontFamily: fonts.mono, fontSize: 10, color: colors.mute, marginTop: 1 },

  proBadge: {
    backgroundColor: colors.gold, borderRadius: radius.sm,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  proBadgeText: { fontFamily: fonts.sansBold, fontSize: 8, color: colors.paper },

  selectedRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    backgroundColor: colors.goldLight ?? "#FDF6E7",
    borderWidth: 1, borderColor: colors.goldBorder ?? "#E8D5A3",
    borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2],
  },
  selectedAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  selectedName:   { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  selectedHandle: { fontFamily: fonts.mono, fontSize: 11, color: colors.mute },
  clearBtn:       { padding: 4 },
});
