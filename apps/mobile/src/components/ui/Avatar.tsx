import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "../../theme";
import type { Tier } from "../../types";

interface Props {
  uri?: string | null;
  name: string;
  size: number;
  tier?: Tier;
}

function initials(name: string): string {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export default function Avatar({ uri, name, size, tier }: Props) {
  const isPro = tier === "patron";
  const borderStyle = isPro
    ? { borderWidth: 2, borderColor: colors.gold }
    : { borderWidth: 1, borderColor: colors.rule };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[
          styles.base,
          { width: size, height: size, borderRadius: size / 2 },
          borderStyle,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.base,
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
        borderStyle,
      ]}
    >
      <Text
        style={[
          styles.text,
          { fontSize: Math.max(fontSize.eyebrow, Math.floor(size * 0.35)) },
        ]}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.paperDeep, overflow: "hidden" },
  fallback: { backgroundColor: colors.ink, justifyContent: "center", alignItems: "center" },
  text: { fontFamily: fonts.monoBold, color: colors.paperWarm, letterSpacing: 0.5 },
});
