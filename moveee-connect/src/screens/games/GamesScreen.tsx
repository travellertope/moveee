import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const GAMES = [
  { name: "Crossword", icon: "grid-outline" },
  { name: "Sudoku", icon: "calculator-outline" },
  { name: "Trivia", icon: "help-circle-outline" },
  { name: "Who Said It?", icon: "chatbubble-ellipses-outline" },
];

export default function GamesScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Games</Text>
      <View style={styles.grid}>
        {GAMES.map((g) => (
          <TouchableOpacity key={g.name} style={styles.card}>
            <Ionicons name={g.icon as never} size={32} color="#b38238" />
            <Text style={styles.label}>{g.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  title: { fontSize: 24, fontWeight: "800", color: "#14110d", padding: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", padding: 12, gap: 12 },
  card: {
    width: "46%", backgroundColor: "#fff", borderRadius: 12, padding: 20,
    alignItems: "center", gap: 10,
    shadowColor: "#14110d", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  label: { fontWeight: "600", fontSize: 14, color: "#14110d", textAlign: "center" },
});
