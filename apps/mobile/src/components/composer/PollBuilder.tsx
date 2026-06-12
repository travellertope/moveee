import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius } from "../../theme";

export interface PollDraft {
  options: string[];
  durationDays: 1 | 3 | 5 | 7;
}

interface Props {
  poll: PollDraft;
  onChange: (p: PollDraft) => void;
}

const DURATIONS: Array<1 | 3 | 5 | 7> = [1, 3, 5, 7];

export default function PollBuilder({ poll, onChange }: Props) {
  const updateOption = (i: number, val: string) => {
    const next = [...poll.options];
    next[i] = val;
    onChange({ ...poll, options: next });
  };

  const addOption = () => {
    if (poll.options.length >= 4) return;
    onChange({ ...poll, options: [...poll.options, ""] });
  };

  const removeOption = (i: number) => {
    if (poll.options.length <= 2) return;
    onChange({ ...poll, options: poll.options.filter((_, idx) => idx !== i) });
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>Poll Options (min 2, max 4)</Text>
      {poll.options.map((opt, i) => (
        <View key={i} style={styles.optionRow}>
          <TextInput
            style={styles.optionInput}
            value={opt}
            onChangeText={(v) => updateOption(i, v)}
            placeholder={`Option ${i + 1}`}
            placeholderTextColor={colors.ghost}
          />
          {poll.options.length > 2 && (
            <TouchableOpacity onPress={() => removeOption(i)} style={styles.removeBtn}>
              <Ionicons name="close" size={16} color={colors.mute} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {poll.options.length < 4 && (
        <TouchableOpacity style={styles.addBtn} onPress={addOption}>
          <Ionicons name="add" size={16} color={colors.gold} />
          <Text style={styles.addBtnText}>Add option</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.sectionLabel, { marginTop: space[3] }]}>Duration</Text>
      <View style={styles.durRow}>
        {DURATIONS.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.durBtn, poll.durationDays === d && styles.durBtnActive]}
            onPress={() => onChange({ ...poll, durationDays: d })}
          >
            <Text style={[styles.durText, poll.durationDays === d && styles.durTextActive]}>
              {d}d
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  sectionLabel: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 0.8, textTransform: "uppercase" },

  optionRow:   { flexDirection: "row", alignItems: "center", gap: space[1] },
  optionInput: {
    flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2], backgroundColor: colors.paper,
  },
  removeBtn: { padding: 6 },

  addBtn:     { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: space[1] },
  addBtnText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.gold },

  durRow:          { flexDirection: "row", gap: space[2] },
  durBtn:          { borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[1] + 2 },
  durBtnActive:    { backgroundColor: colors.ink, borderColor: colors.ink },
  durText:         { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.mute },
  durTextActive:   { color: colors.paper },
});
