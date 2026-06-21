import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useNav } from "../../hooks/useNav";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";
import { api, MOBILE_API } from "../../api/client";

interface MyCluster {
  id: number;
  name: string;
  meetingDay?: string;
  meetingTime?: string;
}

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export default function HouseFellowshipReminderCard() {
  const c = useColors();
  const styles = createStyles(c);
  const nav = useNav();
  const [cluster, setCluster] = useState<MyCluster | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ clusters: MyCluster[] }>(`${MOBILE_API}/cluster/my-clusters`)
      .then((data) => {
        if (cancelled) return;
        const today = DAY_NAMES[new Date().getDay()];
        const match = (data?.clusters ?? []).find(
          (cl) => (cl.meetingDay ?? "").toLowerCase() === today
        );
        if (match) setCluster(match);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!cluster) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => nav.navigate("ClusterScreen", { id: cluster.id })}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.eyebrow}>House Fellowship · Today</Text>
        <Text style={styles.body}>
          {cluster.name} meets today{cluster.meetingTime ? ` at ${cluster.meetingTime}` : ""} — check in when you arrive.
        </Text>
      </View>
      <View style={styles.cta}>
        <Text style={styles.ctaText}>Check in →</Text>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: space[3],
      backgroundColor: c.ink,
      borderRadius: radius.lg,
      padding: space[4],
      marginHorizontal: space[4],
      marginBottom: space[3],
    },
    eyebrow: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.eyebrow,
      letterSpacing: 0.4,
      textTransform: "uppercase",
      color: c.ochre,
    },
    body: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.paper,
      marginTop: 4,
    },
    cta: {
      flexShrink: 0,
      backgroundColor: c.ochre,
      borderRadius: radius.md,
      paddingVertical: space[2],
      paddingHorizontal: space[3],
    },
    ctaText: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      letterSpacing: 0.3,
      textTransform: "uppercase",
      color: c.ink,
    },
  });
}
