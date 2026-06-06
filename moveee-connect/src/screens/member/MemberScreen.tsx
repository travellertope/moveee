import React from "react";
import {
  View, Text, Image, StyleSheet, SafeAreaView,
  TouchableOpacity, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import TierBadge from "../../components/ui/TierBadge";

export default function MemberScreen() {
  const nav = useNavigation<any>();
  const { user, logout } = useAuthStore();

  if (!user) return null;

  const isPro = user.tier === "patron";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.hero}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <Text style={styles.name}>{user.displayName}</Text>
          <TierBadge tier={user.tier} />
          <View style={styles.pointsRow}>
            <Ionicons name="star" size={16} color="#b38238" />
            <Text style={styles.points}>{user.points} points</Text>
          </View>
        </View>

        {!isPro && (
          <TouchableOpacity style={styles.upgradeCard} onPress={() => nav.navigate("Membership")}>
            <Text style={styles.upgradeTitle}>Upgrade to Connect Pro</Text>
            <Text style={styles.upgradeSub}>Unlock full community access and perks</Text>
          </TouchableOpacity>
        )}

        <View style={styles.menu}>
          {[
            { icon: "settings-outline", label: "Settings", screen: "Settings" },
            { icon: "card-outline", label: "Membership", screen: "Membership" },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.menuItem}
              onPress={() => nav.navigate(item.screen)}
            >
              <Ionicons name={item.icon as never} size={22} color="#14110d" />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.menuItem} onPress={logout}>
            <Ionicons name="log-out-outline" size={22} color="#c0392b" />
            <Text style={[styles.menuLabel, { color: "#c0392b" }]}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  hero: { alignItems: "center", padding: 28, gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#e0d8cc", marginBottom: 8 },
  name: { fontSize: 22, fontWeight: "800", color: "#14110d" },
  pointsRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  points: { fontSize: 14, color: "#b38238", fontWeight: "600" },
  upgradeCard: {
    margin: 16, backgroundColor: "#14110d", borderRadius: 12, padding: 18,
  },
  upgradeTitle: { color: "#b38238", fontWeight: "800", fontSize: 16, marginBottom: 4 },
  upgradeSub: { color: "#f3ece0", fontSize: 13 },
  menu: { margin: 16, backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" },
  menuItem: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 16,
    borderBottomWidth: 1, borderBottomColor: "#f3ece0",
  },
  menuLabel: { flex: 1, fontSize: 15, color: "#14110d" },
});
