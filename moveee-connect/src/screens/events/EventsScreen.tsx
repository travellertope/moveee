import React from "react";
import { Text, StyleSheet, SafeAreaView } from "react-native";

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.c}>
      <Text style={styles.t}>Events</Text>
      <Text style={styles.s}>Coming soon</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#f3ece0", justifyContent: "center", alignItems: "center" },
  t: { fontSize: 24, fontWeight: "800", color: "#14110d" },
  s: { color: "#9e9e9e", marginTop: 8 },
});
