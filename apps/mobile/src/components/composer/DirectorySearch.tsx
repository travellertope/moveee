import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API, ApiError } from "../../api/client";
import AudioPreviewButton from "../ui/AudioPreviewButton";

const PROXY = "https://themoveee.com/api";
import { colors, fonts, fontSize, space, radius } from "../../theme";

export interface DirectoryEntry {
  id: number;
  title: string;
  type: string;
  city?: string;
  /** Generic labelled bio field — Author for books, Artist for music,
   * Director for film, … whatever aboutFieldLabel was set to. */
  about?: string;
  thumbnail?: string | null;
  /** Spotify 30s track preview (Music Review only). */
  previewUrl?: string | null;
  /** TMDB genres pre-mapped to the composer's own FILM_GENRES vocabulary
   * (Film Review only) — a suggestion to pre-select genre chips with, not a
   * final answer; the reviewer can still add/remove freely. */
  genres?: string[];
}

/** Normalized shape every /directory/{source}/search proxy returns. */
interface ExternalResult {
  externalId: string;
  title: string;
  about?: string;
  year?: string;
  coverUrl?: string | null;
  genres?: string[];
  description?: string;
  /** Structured infobox fields — stored as dir_infobox_* meta via quick-create. */
  infobox?: Record<string, string>;
}

interface Props {
  onSelect: (entry: DirectoryEntry) => void;
  selected?: DirectoryEntry | null;
  label?: string;
  /** Placeholder text for the search input (default "Search directory…"). */
  placeholder?: string;
  /** Optional slug to pass as ?type= to the backend search endpoint, and as
   * entry_type when quick-creating a new entry (defaults to "place"). */
  typeFilter?: string;
  /** Show a labelled field ("Author", "Artist", "Director", …) instead of
   * City on the quick-create form. */
  aboutFieldLabel?: string;
  /** When set, also searches this external catalog alongside the local
   * directory and offers each result as a one-tap create (prefilled
   * title/about/cover, deduped server-side by external ID). */
  externalSource?: "google_books" | "spotify" | "tmdb" | "google_places";
}

let debounceTimer: ReturnType<typeof setTimeout>;
let externalDebounceTimer: ReturnType<typeof setTimeout>;

export default function DirectorySearch({ onSelect, selected, label, placeholder, typeFilter, aboutFieldLabel, externalSource }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<DirectoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  // New entry creation state
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newAbout, setNewAbout] = useState("");
  const [newYear, setNewYear] = useState("");

  // External catalog search
  const [externalResults, setExternalResults] = useState<ExternalResult[]>([]);
  const [externalLoading, setExternalLoading] = useState(false);
  const [creatingExternalId, setCreatingExternalId] = useState<string | null>(null);

  // Was silently swallowed before (see handleSelectExternal/handleCreate) —
  // a failed pick looked identical to a working tap, with zero feedback.
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const describeError = (err: unknown) =>
    err instanceof ApiError
      ? err.message || "Something went wrong. Please try again."
      : "Could not reach the server. Check your connection and try again.";

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
  }, [typeFilter]);

  const searchExternal = useCallback((q: string) => {
    clearTimeout(externalDebounceTimer);
    if (!externalSource || !q.trim()) { setExternalResults([]); return; }
    externalDebounceTimer = setTimeout(async () => {
      setExternalLoading(true);
      try {
        const data = await api.get<ExternalResult[]>(
          `${PROXY}/external/${externalSource}/search?q=${encodeURIComponent(q)}`,
          false
        );
        setExternalResults(data ?? []);
      } catch {
        setExternalResults([]);
      } finally {
        setExternalLoading(false);
      }
    }, 350);
  }, [externalSource]);

  const handleChange = (v: string) => {
    setQuery(v);
    setErrorMsg(null);
    search(v);
    searchExternal(v);
  };

  const handleSelect = (entry: DirectoryEntry) => {
    onSelect(entry);
    setQuery("");
    setResults([]);
    setExternalResults([]);
    setShowList(false);
    setErrorMsg(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const aboutValue = aboutFieldLabel ? newAbout.trim() || undefined : undefined;
      const yearValue = newYear.trim() || undefined;
      const infoboxFields: Record<string, string> = {};
      if (yearValue) infoboxFields.year = yearValue;
      if (aboutFieldLabel && aboutValue) infoboxFields[aboutFieldLabel.toLowerCase()] = aboutValue;
      const entry = await api.post<DirectoryEntry>(`${PROXY}/directory/quick-create`, {
        title: newName.trim(),
        entry_type: typeFilter || "place",
        city: aboutFieldLabel ? undefined : newCity.trim() || undefined,
        about_label: aboutFieldLabel || undefined,
        about_value: aboutValue,
        infobox: Object.keys(infoboxFields).length ? infoboxFields : undefined,
      });
      onSelect(entry);
      setCreating(false);
      setNewName("");
      setNewCity("");
      setNewAbout("");
      setNewYear("");
    } catch (err) {
      setErrorMsg(describeError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExternal = async (r: ExternalResult) => {
    if (!externalSource) return;
    setCreatingExternalId(r.externalId);
    setErrorMsg(null);
    try {
      // Spotify only — album search results carry no track data, so the
      // 30s preview clip is resolved lazily here, just for the picked
      // album, rather than fanning out one extra call per search result.
      let previewUrl: string | null = null;
      if (externalSource === "spotify") {
        try {
          const preview = await api.get<{ previewUrl: string | null }>(
            `${PROXY}/external/spotify/preview?albumId=${encodeURIComponent(r.externalId)}`,
            false
          );
          previewUrl = preview?.previewUrl ?? null;
        } catch { /* preview is optional */ }
      }

      // TMDB only — search results carry no crew data, so the director and
      // runtime are resolved lazily here, just for the picked film.
      let about = r.about;
      const infobox: Record<string, string> = { ...(r.infobox ?? {}) };
      if (externalSource === "tmdb") {
        try {
          const credits = await api.get<{ director: string | null; runtime: string | null }>(
            `${PROXY}/external/tmdb/credits?movieId=${encodeURIComponent(r.externalId)}`,
            false
          );
          if (credits?.director) about = credits.director;
          if (credits?.runtime) infobox.runtime = credits.runtime;
        } catch { /* director/runtime optional */ }
      }

      const entry = await api.post<DirectoryEntry>(`${PROXY}/directory/quick-create`, {
        title: r.title,
        entry_type: typeFilter || "place",
        about_label: aboutFieldLabel || undefined,
        about_value: about || undefined,
        external_source: externalSource,
        external_id: r.externalId,
        cover_image_url: r.coverUrl || undefined,
        preview_url: previewUrl || undefined,
        excerpt: r.description || undefined,
        infobox: Object.keys(infobox).length ? infobox : undefined,
      });
      handleSelect({ ...entry, thumbnail: entry.thumbnail ?? r.coverUrl ?? null, previewUrl: entry.previewUrl ?? previewUrl ?? null, genres: r.genres });
    } catch (err) {
      setErrorMsg(describeError(err));
    } finally {
      setCreatingExternalId(null);
    }
  };

  if (selected) {
    return (
      <View style={styles.selectedRow}>
        {selected.thumbnail ? <Image source={{ uri: selected.thumbnail }} style={styles.selectedThumb} /> : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.selectedName}>{selected.title}</Text>
          {selected.about ? <Text style={styles.selectedCity}>{selected.about}</Text> : selected.city ? <Text style={styles.selectedCity}>{selected.city}</Text> : null}
        </View>
        {selected.previewUrl ? <AudioPreviewButton uri={selected.previewUrl} /> : null}
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
          placeholder={aboutFieldLabel ? "Title *" : "Place name *"}
          placeholderTextColor={colors.ghost}
          autoFocus
        />
        {aboutFieldLabel ? (
          <TextInput
            style={styles.input}
            value={newAbout}
            onChangeText={setNewAbout}
            placeholder={`${aboutFieldLabel} (optional)`}
            placeholderTextColor={colors.ghost}
          />
        ) : (
          <TextInput
            style={styles.input}
            value={newCity}
            onChangeText={setNewCity}
            placeholder="City (optional)"
            placeholderTextColor={colors.ghost}
          />
        )}
        {aboutFieldLabel ? (
          <TextInput
            style={styles.input}
            value={newYear}
            onChangeText={setNewYear}
            placeholder="Year (optional)"
            placeholderTextColor={colors.ghost}
            keyboardType="number-pad"
            maxLength={4}
          />
        ) : null}
        <View style={styles.createBtns}>
          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={!newName.trim() || loading}>
            {loading ? <ActivityIndicator color={colors.paper} size="small" /> : <Text style={styles.createBtnText}>Add</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreating(false)}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        {errorMsg && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
      </View>
    );
  }

  const externalSourceLabel = externalSource === "google_books" ? "Google Books" : externalSource === "spotify" ? "iTunes" : externalSource === "google_places" ? "Google Maps" : "TMDB";
  const noLocalMatches = showList && results.length === 0;
  const noExternalMatches = !externalSource || (!externalLoading && externalResults.length === 0);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.sectionLabel}>{label}</Text> : null}
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={15} color={colors.mute} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder ?? "Search directory…"}
          placeholderTextColor={colors.ghost}
        />
        {(loading || externalLoading) && <ActivityIndicator size="small" color={colors.gold} />}
      </View>

      {showList && (
        <View style={styles.dropdown}>
          {results.slice(0, 8).map((r) => (
            <TouchableOpacity key={r.id} style={styles.resultRow} onPress={() => handleSelect(r)}>
              <Text style={styles.resultTitle}>{r.title}</Text>
              {r.about ? <Text style={styles.resultCity}>{r.about}</Text> : r.city ? <Text style={styles.resultCity}>{r.city}</Text> : null}
            </TouchableOpacity>
          ))}

          {externalSource && (externalLoading || externalResults.length > 0) && (
            <View style={styles.externalGroup}>
              <Text style={styles.externalLabel}>From {externalSourceLabel}</Text>
              {externalResults.map((r) => (
                <TouchableOpacity
                  key={r.externalId}
                  style={styles.resultRow}
                  onPress={() => handleSelectExternal(r)}
                  disabled={creatingExternalId === r.externalId}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                    {r.coverUrl ? <Image source={{ uri: r.coverUrl }} style={styles.resultThumb} /> : null}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.resultTitle}>{r.title}</Text>
                      {(r.about || r.year) && (
                        <Text style={styles.resultCity}>{[r.about, r.year].filter(Boolean).join(" · ")}</Text>
                      )}
                    </View>
                  </View>
                  {creatingExternalId === r.externalId && <ActivityIndicator size="small" color={colors.gold} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {noLocalMatches && noExternalMatches && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
              <TouchableOpacity onPress={() => setCreating(true)}>
                <Text style={styles.addNewLink}>+ Add manually</Text>
              </TouchableOpacity>
            </View>
          )}
          {!(noLocalMatches && noExternalMatches) && (
            <TouchableOpacity style={styles.addNewRow} onPress={() => setCreating(true)}>
              <Ionicons name="add" size={14} color={colors.gold} />
              <Text style={styles.addNewLink}>Add manually</Text>
            </TouchableOpacity>
          )}
          {errorMsg && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={colors.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
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
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[3], paddingVertical: space[2] + 2,
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  resultTitle: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink },
  resultCity:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 1 },
  resultThumb: { width: 28, height: 28, borderRadius: 4 },

  externalGroup: { borderTopWidth: 1, borderTopColor: colors.rule, paddingTop: 2 },
  externalLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute,
    letterSpacing: 0.8, textTransform: "uppercase", paddingHorizontal: space[3], paddingTop: space[2],
  },

  addNewRow:  { flexDirection: "row", alignItems: "center", gap: 4, padding: space[3] },
  addNewLink: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold },

  errorRow:  { flexDirection: "row", alignItems: "flex-start", gap: 6, padding: space[3], paddingTop: 0 },
  errorText: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.error, lineHeight: 16 },

  // selected
  selectedRow: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[2],
  },
  selectedThumb: { width: 32, height: 32, borderRadius: 4 },
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
