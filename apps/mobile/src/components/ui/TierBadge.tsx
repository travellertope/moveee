import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Tier } from "../../types";

export default function TierBadge({ tier }: { tier: Tier }) {
  const isPro = tier === "patron";
  return (
    <View style={[styles.badge, isPro ? styles.pro : styles.citizen]}>
      <Text style={[styles.label, isPro ? styles.proLabel : styles.citizenLabel]}>
        {isPro ? "Pro" : "Citizen"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 },
  pro: { backgroundColor: "#b38238" },
  citizen: { backgroundColor: "#e0d8cc" },
  label: { fontSize: 10, fontWeight: "700" },
  proLabel: { color: "#fff" },
  citizenLabel: { color: "#14110d" },
});
