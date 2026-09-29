import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Image } from "react-native";
import { fonts, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import type { SavedLine } from "../../features/community/readingTracker";

// Local relative-time formatter — components/ui/TimeAgo.tsx has an
// equivalent function but doesn't export it (it renders its own fixed-style
// <Text>, not composable with this file's own lineDate style).
function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// "Lines saved from this" — a short quote a member attaches to any
// culture_directory entry (book, person, talk-as-source-context),
// independent of shelf status. From the "Moveee Home — Log-First" mockup:
// "Saving a line counts as a log. It carries the book with it wherever
// it's shared." This is genuinely new — no equivalent web component yet.

const MAX_LEN = 500;

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      marginBottom: 8,
    },
    title: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    count: { fontFamily: fonts.mono, fontSize: 11, color: c.ghost },

    lineCard: {
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: radius.lg, ...shadows.card, padding: 12, marginBottom: 10,
    },
    lineText: {
      fontFamily: fonts.serifItalic, fontSize: 15, lineHeight: 21, color: c.ink,
    },
    lineFooter: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginTop: 8,
    },
    lineMeta: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
    lineAvatar: {
      width: 20, height: 20, borderRadius: 10, backgroundColor: c.ghost,
      alignItems: "center", justifyContent: "center",
    },
    lineAvatarInitial: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper },
    lineAvatarImg: { width: 20, height: 20, borderRadius: 10 },
    lineAuthor: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink },
    lineSource: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    lineDate: { fontFamily: fonts.mono, fontSize: 11, color: c.ghost },
    deleteText: { fontFamily: fonts.sans, fontSize: 11, color: c.error ?? "#c0392b", marginLeft: 8 },

    addBtn: {
      borderWidth: 1, borderStyle: "dashed", borderColor: c.ghost, borderRadius: radius.lg,
      paddingVertical: 12, alignItems: "center",
    },
    addBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
    hint: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, textAlign: "center", marginTop: 6 },

    form: {
      backgroundColor: c.paperWarm, borderRadius: radius.lg, padding: 12,
    },
    input: {
      fontFamily: fonts.serifItalic, fontSize: 15, color: c.ink,
      minHeight: 70, textAlignVertical: "top",
    },
    sourceInput: {
      fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft,
      borderTopWidth: 1, borderTopColor: c.ghost + "33",
      marginTop: 8, paddingTop: 8,
    },
    formActions: { flexDirection: "row", justifyContent: "flex-end", gap: 16, marginTop: 10 },
    cancelText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    saveText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre },
  });
}

function initial(name: string) {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export default function SavedLines({ directoryId }: { directoryId: number }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [lines, setLines] = useState<SavedLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [composing, setComposing] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ lines: SavedLine[] }>(`${MOBILE_API}/reading/saved-lines?directory_id=${directoryId}`);
      setLines(res.lines ?? []);
    } catch {}
    setLoading(false);
  }, [directoryId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    if (!text.trim() || saving) return;
    setSaving(true);
    try {
      await api.post(`${MOBILE_API}/reading/saved-lines`, {
        directory_id: directoryId,
        line_text: text.trim(),
        source_context: source.trim(),
      });
      setText("");
      setSource("");
      setComposing(false);
      load();
    } catch {}
    setSaving(false);
  }

  async function remove(id: number) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    try {
      await api.delete(`${MOBILE_API}/reading/saved-lines/${id}`);
    } catch {
      load(); // restore on failure
    }
  }

  if (loading && lines.length === 0) {
    return <ActivityIndicator size="small" color={c.ochre} style={{ marginVertical: 12 }} />;
  }

  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Lines saved from this</Text>
        {lines.length > 0 && <Text style={styles.count}>{lines.length} line{lines.length !== 1 ? "s" : ""}</Text>}
      </View>

      {lines.map((line) => (
        <View key={line.id} style={styles.lineCard}>
          <Text style={styles.lineText}>"{line.lineText}"</Text>
          <View style={styles.lineFooter}>
            <View style={styles.lineMeta}>
              <View style={styles.lineAvatar}>
                {line.authorAvatar ? (
                  <Image source={{ uri: line.authorAvatar }} style={styles.lineAvatarImg} />
                ) : (
                  <Text style={styles.lineAvatarInitial}>{initial(line.authorName)}</Text>
                )}
              </View>
              <Text style={styles.lineAuthor} numberOfLines={1}>{line.authorName}</Text>
              {!!line.sourceContext && <Text style={styles.lineSource} numberOfLines={1}>{line.sourceContext}</Text>}
            </View>
            <Text style={styles.lineDate}>{timeAgo(line.createdAt)}</Text>
            {isAuthenticated && line.isMine && (
              <TouchableOpacity onPress={() => remove(line.id)}>
                <Text style={styles.deleteText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {isAuthenticated && (
        composing ? (
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="A line worth remembering…"
              placeholderTextColor={c.mute}
              value={text}
              onChangeText={(t) => setText(t.slice(0, MAX_LEN))}
              multiline
              autoFocus
            />
            <TextInput
              style={styles.sourceInput}
              placeholder="Source (optional — e.g. a talk, a chapter)"
              placeholderTextColor={c.mute}
              value={source}
              onChangeText={setSource}
            />
            <View style={styles.formActions}>
              <TouchableOpacity onPress={() => { setComposing(false); setText(""); setSource(""); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submit} disabled={!text.trim() || saving}>
                {saving ? <ActivityIndicator size="small" color={c.ochre} /> : <Text style={styles.saveText}>Save line</Text>}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setComposing(true)}>
              <Text style={styles.addBtnText}>+ Save a line from this</Text>
            </TouchableOpacity>
            <Text style={styles.hint}>Saving a line counts as a log. It carries this with it wherever it's shared.</Text>
          </>
        )
      )}
    </View>
  );
}
