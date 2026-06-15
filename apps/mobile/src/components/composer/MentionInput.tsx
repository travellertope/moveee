import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { MemberResult } from "./UserSearch";

const AVATAR_PALETTE: Array<[string, string]> = [
  ["#9b51e0", "#f2994a"],
  ["#2D9CDB", "#9b51e0"],
  ["#C5491F", "#E2A684"],
  ["#B38238", "#E2A684"],
  ["#8E54E9", "#4776E6"],
  ["#00695C", "#4B6CB7"],
];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xfffffff;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length][0];
}

let debounceTimer: ReturnType<typeof setTimeout>;

interface Props extends Omit<TextInputProps, "value" | "onChangeText" | "ref"> {
  value: string;
  onChangeText: (text: string) => void;
  inputRef?: React.RefObject<TextInput>;
}

export default function MentionInput({
  value,
  onChangeText,
  inputRef,
  style,
  ...rest
}: Props) {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [results, setResults] = useState<MemberResult[]>([]);
  const [loading, setLoading] = useState(false);
  const selectionRef = useRef({ start: 0, end: 0 });
  const prevLenRef = useRef(value.length);

  const handleChange = useCallback(
    (newText: string) => {
      onChangeText(newText);

      // Approximate cursor after typing: old cursor + characters inserted
      const delta = newText.length - prevLenRef.current;
      prevLenRef.current = newText.length;
      const approxCursor = Math.max(
        0,
        Math.min(newText.length, selectionRef.current.start + Math.max(0, delta))
      );
      const textBeforeCursor = newText.slice(0, approxCursor);
      const match = textBeforeCursor.match(/@(\w*)$/);

      if (match) {
        const query = match[1];
        const atPos = approxCursor - match[0].length;
        setMentionStart(atPos);
        setMentionQuery(query);

        clearTimeout(debounceTimer);
        if (query.length === 0) {
          // @ just typed — wait for at least 1 char
          setResults([]);
          return;
        }
        debounceTimer = setTimeout(async () => {
          setLoading(true);
          try {
            const data = await api.get<MemberResult[]>(
              `${CULTURE_API}/members?search=${encodeURIComponent(query)}&per_page=8`,
              true
            );
            setResults(data ?? []);
          } catch {
            setResults([]);
          } finally {
            setLoading(false);
          }
        }, 300);
      } else {
        setMentionQuery(null);
        setResults([]);
        clearTimeout(debounceTimer);
      }
    },
    [onChangeText]
  );

  const handleSelect = useCallback(
    (member: MemberResult) => {
      const cursor = selectionRef.current.start;
      const before = value.slice(0, mentionStart);
      const after = value.slice(cursor);
      onChangeText(`${before}@${member.username} ${after}`);
      setMentionQuery(null);
      setResults([]);
    },
    [value, mentionStart, onChangeText]
  );

  const showDropdown = mentionQuery !== null && (loading || results.length > 0);

  return (
    <View>
      {showDropdown && (
        <View style={styles.dropdown}>
          {loading && results.length === 0 ? (
            <ActivityIndicator color={colors.gold} style={{ padding: 10 }} />
          ) : (
            results.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.resultRow}
                onPress={() => handleSelect(r)}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: avatarColor(r.display_name) }]}>
                  <Text style={styles.avatarInitial}>
                    {r.display_name[0]?.toUpperCase() ?? "?"}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultName}>{r.display_name}</Text>
                  <Text style={styles.resultMeta}>
                    @{r.username}
                    {r.occupation ? `  ·  ${r.occupation}` : ""}
                  </Text>
                </View>
                {r.tier === "patron" && (
                  <View style={styles.proBadge}>
                    <Ionicons name="ribbon" size={9} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      <TextInput
        ref={inputRef}
        style={style}
        value={value}
        onChangeText={handleChange}
        onSelectionChange={(e) => {
          selectionRef.current = e.nativeEvent.selection;
        }}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    backgroundColor: colors.paper,
    overflow: "hidden",
    marginBottom: 6,
    // Subtle shadow so it feels like a popover
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: -2 },
    elevation: 4,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space[2],
    paddingHorizontal: space[3],
    paddingVertical: space[2] + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarInitial: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: "#fff",
  },
  resultName: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  resultMeta: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.mute,
    marginTop: 1,
  },
  proBadge: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
});
