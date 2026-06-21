import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Tier } from "../../types";

export default function TierBadge({ tier }: { tier: Tier }) {
  const isPro = tier === "patron";
  if (!isPro) return null;
  return <Ionicons name="checkmark-circle" size={14} color="#B38238" style={styles.check} />;
}

const styles = StyleSheet.create({
  check: {
    marginTop: 1,
  },
});
