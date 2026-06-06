import React from "react";
import { Text, StyleSheet, SafeAreaView } from "react-native";

export default function EventDetailScreen() {
  return (
    <SafeAreaView style={styles.c}>
      <Text style={styles.t}>Event Detail</Text>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: "#f3ece0", justifyContent: "center", alignItems: "center" },
  t: { fontSize: 20, color: "#14110d" },
});
