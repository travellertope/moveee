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

  const inner = uri ? (
    <Image
      source={{ uri }}
      style={{ width: size, height: size, borderRadius: size / 2 }}
    />
  ) : (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={[styles.text, { fontSize: Math.max(fontSize.eyebrow, Math.floor(size * 0.35)) }]}>
        {initials(name)}
      </Text>
    </View>
  );

  // Pro: shadow-only outer wrapper (no overflow) + clipping inner wrapper
  if (isPro) {
    return (
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          shadowColor: colors.gold,
          shadowOpacity: 0.6,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
          elevation: 8,
        }}
      >
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2.5,
            borderColor: colors.gold,
            overflow: "hidden",
          }}
        >
          {inner}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: colors.rule },
      ]}
    >
      {inner}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
  fallback: { backgroundColor: colors.ink, justifyContent: "center", alignItems: "center" },
  text: { fontFamily: fonts.monoBold, color: colors.paperWarm, letterSpacing: 0.5 },
});
