import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Tier } from "../../types";

export default function TierBadge({ tier }: { tier: Tier }) {
  const isPro = tier === "patron";
  if (!isPro) {
    return (
      <View style={styles.citizen}>
        <Ionicons name="person-outline" size={9} color="#6b6560" />
      </View>
    );
  }
  return (
    <View style={styles.pro}>
      <Ionicons name="ribbon" size={10} color="#fff" />
    </View>
  );
}

const styles = StyleSheet.create({
  pro: {
    backgroundColor: "#b38238",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  citizen: {
    backgroundColor: "#e0d8cc",
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
