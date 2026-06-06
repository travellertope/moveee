import React from "react";
import { Text, StyleSheet, SafeAreaView } from "react-native";

export default function MagazineScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Magazine</Text>
      <Text style={styles.sub}>Articles coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0", justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "800", color: "#14110d" },
  sub: { color: "#9e9e9e", marginTop: 8 },
});
