import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import TierBadge from "../../components/ui/TierBadge";
import type { User } from "../../types";

export default function MemberProfileScreen() {
  const { params } = useRoute<any>();
  const nav = useNavigation();
  const [member, setMember] = useState<Partial<User> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Partial<User>>(`${MOBILE_API}/member/${params.userId}`)
      .then(setMember)
      .finally(() => setLoading(false));
  }, [params.userId]);

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => nav.goBack()}>
        <Ionicons name="arrow-back" size={24} color="#14110d" />
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={{ flex: 1 }} color="#b38238" />
      ) : member ? (
        <ScrollView>
          <View style={styles.hero}>
            <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
            <Text style={styles.name}>{member.displayName}</Text>
            {member.tier && <TierBadge tier={member.tier} />}
            <Text style={styles.meta}>{member.city}, {member.countryOfResidence}</Text>
            <Text style={styles.meta}>{member.occupation}</Text>
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.error}>Member not found.</Text>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  back: { padding: 16 },
  hero: { alignItems: "center", padding: 24, gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#e0d8cc", marginBottom: 8 },
  name: { fontSize: 22, fontWeight: "800", color: "#14110d" },
  meta: { fontSize: 14, color: "#9e9e9e" },
  error: { textAlign: "center", marginTop: 40, color: "#9e9e9e" },
});
