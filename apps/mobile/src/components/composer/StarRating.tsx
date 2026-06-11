import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, fonts, fontSize, space } from "../../theme";

interface Props {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  size?: number;
}

export default function StarRating({ value, onChange, label, size = 28 }: Props) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <TouchableOpacity key={n} onPress={() => onChange(n)}>
            <Text style={[styles.star, { fontSize: size, color: n <= value ? colors.gold : colors.ghost }]}>
              ★
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:  { flexDirection: "row", alignItems: "center", gap: space[2] },
  label: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, minWidth: 50 },
  stars: { flexDirection: "row", gap: 2 },
  star:  { lineHeight: 34 },
});
