import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";

const PROXY = "https://themoveee.com/api";
import { colors, fonts, fontSize, space, radius } from "../../theme";

interface DirectoryEntry {
  id: number;
  title: string;
  type: string;
  city?: string;
}

interface Props {
  onSelect: (entry: DirectoryEntry) => void;
  selected?: DirectoryEntry | null;
  label?: string;
  /** Optional slug to pass as ?type= to the backend search endpoint */
  typeFilter?: string;
}

let debounceTimer: ReturnType<typeof setTimeout>;

export default function DirectorySearch({ onSelect, selected, label, typeFilter }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  // New entry creation state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");

  const search = useCallback((q: string) => {
    clearTimeout(debounceTimer);
    if (!q.trim()) { setResults([]); setShowList(false); return; }
    debounceTimer = setTimeout(async () => {
      setLoading(true);
      try {
        const qs = typeFilter
          ? `q=${encodeURIComponent(q)}&type=${encodeURIComponent(typeFilter)}`
          : `q=${encodeURIComponent(q)}`;
        const data = await api.get<DirectoryEntry[]>(
          `${CULTURE_API}/directory/search?${qs}`,
          false
        );
        setResults(data ?? []);
        setShowList(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    search(v);
  };

  const handleSelect = (entry: DirectoryEntry) => {
    onSelect(entry);
    setQuery("");
    setResults([]);
    setShowList(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const entry = await api.post<DirectoryEntry>(`${PROXY}/directory/quick-create`, {
        title: newName.trim(),
        entry_type: "place",
        city: newCity.trim() || undefined,
      });
      onSelect(entry);
      setCreating(false);
      setNewName("");
      setNewCity("");
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (selected) {
    return (
      <View style={styles.selectedRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedName}>{selected.title}</Text>
          {selected.city ? <Text style={styles.selectedCity}>{selected.city}</Text> : null}
        </View>
        <TouchableOpacity onPress={() => onSelect(null as any)} style={styles.clearBtn}>
          <Ionicons name="close" size={16} color={colors.mute} />
        </TouchableOpacity>
      </View>
    );
  }

  if (creating) {
    return (
      <View style={styles.createCard}>
        <Text style={styles.sectionLabel}>Add to directory</Text>
        <TextInput
          style={styles.input}
          value={newName}
          onChangeText={setNewName}
          placeholder="Place name *"
          placeholderTextColor={colors.ghost}
          autoFocus
        />
        <TextInput
          style={styles.input}
          value={newCity}
          onChangeText={setNewCity}
          placeholder="City (optional)"
          placeholderTextColor={colors.ghost}
        />
        <View style={styles.createBtns}>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={!newName.trim() || loading}>
            {loading ? <ActivityIndicator color={colors.paper} size="small" /> : <Text style={styles.createBtnText}>Add</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={15} color={colors.mute} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleChange}
          placeholder="Search directory…"
          placeholderTextColor={colors.ghost}
        />
        {loading && <ActivityIndicator size="small" color={colors.gold} />}
      </View>

      {showList && (
        <View style={styles.dropdown}>
          {results.length === 0 ? (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
              <TouchableOpacity onPress={() => setCreating(true)}>
                <Text style={styles.addNewLink}>+ Add to directory</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {results.slice(0, 8).map((r) => (
                <TouchableOpacity key={r.id} style={styles.resultRow} onPress={() => handleSelect(r)}>
                  <Text style={styles.resultTitle}>{r.title}</Text>
                  {r.city ? <Text style={styles.resultCity}>{r.city}</Text> : null}
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.addNewRow} onPress={() => setCreating(true)}>
                <Ionicons name="add" size={14} color={colors.gold} />
                <Text style={styles.addNewLink}>Add to directory</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[1] },
  sectionLabel: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 0.8, textTransform: "uppercase" },

  searchRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[2], backgroundColor: colors.paper,
  },
  searchIcon:  { marginRight: 6 },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink, paddingVertical: space[2] },

  dropdown: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    backgroundColor: colors.paper, overflow: "hidden",
  },
  noResults:    { padding: space[3], gap: space[1] },
  noResultsText:{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },

  resultRow: {
    paddingHorizontal: space[3], paddingVertical: space[2] + 2,
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  resultTitle: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink },
  resultCity:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 1 },

  addNewRow:  { flexDirection: "row", alignItems: "center", gap: 4, padding: space[3] },
  addNewLink: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold },

  // selected
  selectedRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[2],
  },
  selectedName: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  selectedCity: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  clearBtn:     { padding: 4 },

  // create form
  createCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.md, padding: space[3], gap: space[2],
  },
  input: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: space[3], paddingVertical: space[2], backgroundColor: colors.paperDeep,
  },
  createBtns: { flexDirection: "row", gap: space[2] },
  createBtn: {
    flex: 1, backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: space[2], alignItems: "center",
  },
  createBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },
  cancelBtn:     { paddingHorizontal: space[3], paddingVertical: space[2], alignItems: "center" },
  cancelBtnText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },
});
