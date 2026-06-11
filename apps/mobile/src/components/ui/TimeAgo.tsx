import React from "react";
import { Text, StyleSheet } from "react-native";

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function TimeAgo({ date }: { date: string }) {
  return <Text style={styles.text}>{timeAgo(date)}</Text>;
}

const styles = StyleSheet.create({
  text: { fontSize: 12, color: "#9e9e9e" },
});
