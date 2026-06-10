import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius } from "../../theme";

export interface StopDraft {
  name: string;
  note: string;
}

interface Props {
  stops: StopDraft[];
  onChange: (s: StopDraft[]) => void;
}

export default function ItineraryBuilder({ stops, onChange }: Props) {
  const update = (i: number, patch: Partial<StopDraft>) => {
    onChange(stops.map((s, idx) => idx === i ? { ...s, ...patch } : s));
  };

  const add = () => onChange([...stops, { name: "", note: "" }]);
  const remove = (i: number) => {
    if (stops.length <= 2) return;
    onChange(stops.filter((_, idx) => idx !== i));
  };

  return (
    <View style={styles.wrap}>
      {stops.map((stop, i) => (
        <View key={i} style={styles.stopCard}>
          <View style={styles.stopHeader}>
            <View style={styles.circle}>
              <Text style={styles.circleText}>{i + 1}</Text>
            </View>
            <Text style={styles.stopLabel}>Stop {i + 1}</Text>
            {stops.length > 2 && (
              <TouchableOpacity onPress={() => remove(i)} style={styles.removeBtn}>
                <Ionicons name="close-circle-outline" size={18} color={colors.mute} />
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            value={stop.name}
            onChangeText={(v) => update(i, { name: v })}
            placeholder="Place name *"
            placeholderTextColor={colors.ghost}
          />
          <TextInput
            style={[styles.input, styles.inputNote]}
            value={stop.note}
            onChangeText={(v) => update(i, { note: v })}
            placeholder="Optional note…"
            placeholderTextColor={colors.ghost}
            multiline
          />
        </View>
      ))}
      <TouchableOpacity style={styles.addBtn} onPress={add}>
        <Ionicons name="add" size={16} color={colors.gold} />
        <Text style={styles.addBtnText}>Add stop</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
  stopCard: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.md, padding: space[3], gap: space[2],
  },
  stopHeader: { flexDirection: "row", alignItems: "center", gap: space[2] },
  circle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.gold, justifyContent: "center", alignItems: "center",
  },
  circleText: { fontFamily: fonts.monoBold, fontSize: fontSize.tiny, color: "#fff" },
  stopLabel:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, flex: 1 },
  removeBtn:  { padding: 2 },
  input: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.sm,
    paddingHorizontal: space[3], paddingVertical: space[1] + 2, backgroundColor: colors.paperDeep,
  },
  inputNote: { minHeight: 50, textAlignVertical: "top" },
  addBtn:     { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: space[1] },
  addBtnText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.gold },
});
