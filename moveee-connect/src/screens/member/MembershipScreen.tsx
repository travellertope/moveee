import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  Alert, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const PRO_SKU = "moveee_connect_pro_monthly";

const PERKS = [
  "Full community feed access",
  "Post links and rich media",
  "Attend exclusive Pro events",
  "Access all newsletter editions",
  "Priority support",
];

export default function MembershipScreen() {
  const nav = useNavigation();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    // TODO: wire react-native-iap once Google Play console is configured
    Alert.alert(
      "Upgrade to Connect Pro",
      "Google Play Billing will be wired here. SKU: " + PRO_SKU
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#14110d" />
      </TouchableOpacity>

      <View style={styles.inner}>
        <Text style={styles.title}>Connect Pro</Text>
        <Text style={styles.price}>$X / month</Text>

        {PERKS.map((p) => (
          <View key={p} style={styles.perk}>
            <Ionicons name="checkmark-circle" size={20} color="#b38238" />
            <Text style={styles.perkText}>{p}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.btn} onPress={handleUpgrade} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnLabel}>Upgrade via Google Play</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  back: { padding: 16 },
  inner: { padding: 24, alignItems: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "#14110d", marginBottom: 6 },
  price: { fontSize: 18, color: "#b38238", fontWeight: "700", marginBottom: 28 },
  perk: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "stretch", marginBottom: 14 },
  perkText: { fontSize: 15, color: "#14110d" },
  btn: { backgroundColor: "#14110d", borderRadius: 12, padding: 16, alignSelf: "stretch", alignItems: "center", marginTop: 28 },
  btnLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
