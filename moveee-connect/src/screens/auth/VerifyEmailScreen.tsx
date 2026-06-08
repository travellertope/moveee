import React from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

export default function VerifyEmailScreen() {
  const { params } = useRoute<any>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Ionicons name="mail-outline" size={64} color="#b38238" />
        <Text style={styles.title}>Check your inbox</Text>
        <Text style={styles.body}>
          We sent a verification link to{"\n"}
          <Text style={styles.email}>{params?.email}</Text>
        </Text>
        <Text style={styles.hint}>
          Tap the link in the email to complete your registration. You can then log in here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  title: { fontSize: 24, fontWeight: "800", color: "#14110d", marginTop: 20, marginBottom: 12 },
  body: { fontSize: 16, color: "#14110d", textAlign: "center", lineHeight: 24, marginBottom: 16 },
  email: { fontWeight: "700", color: "#b38238" },
  hint: { fontSize: 14, color: "#9e9e9e", textAlign: "center", lineHeight: 20 },
});
