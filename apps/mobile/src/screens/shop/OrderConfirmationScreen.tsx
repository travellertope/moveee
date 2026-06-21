import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRoute, RouteProp } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useCartStore } from "../../store/cartStore";

type OrderConfirmationParams = {
  OrderConfirmation: {
    orderId: string;
    total: string;
    itemCount: number;
  };
};

function getDeliveryRange(): string {
  const start = new Date();
  start.setDate(start.getDate() + 3);
  const end = new Date();
  end.setDate(end.getDate() + 7);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperWarm },
    scroll: { flexGrow: 1 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6] },
    iconCircle: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: c.ochre,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: space[5],
    },
    heading: {
      fontFamily: fonts.serifBold,
      fontSize: 26,
      color: c.ink,
      textAlign: "center",
      marginBottom: space[2],
    },
    subheading: {
      fontFamily: fonts.sans,
      fontSize: 16,
      color: c.mute,
      textAlign: "center",
      marginBottom: space[3],
    },
    orderId: {
      fontFamily: fonts.monoBold,
      fontSize: 16,
      color: c.ink,
      marginBottom: space[3],
    },
    emailNote: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      marginBottom: space[6],
    },
    card: {
      width: "100%",
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: space[5],
      marginBottom: space[6],
      ...shadows.card,
    },
    imagesRow: { flexDirection: "row", alignItems: "center", marginBottom: space[4] },
    imgCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      borderWidth: 2,
      borderColor: c.paperWarm,
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    summaryLabel: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    summaryTotal: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    divider: { height: 1, backgroundColor: c.ghost + "44", marginVertical: space[4] },
    deliveryRow: { flexDirection: "row", alignItems: "center", gap: space[2] },
    deliveryText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    trackBtn: {
      height: 52,
      borderRadius: radius["2xl"],
      borderWidth: 1.5,
      borderColor: c.ink,
      backgroundColor: c.paper,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: space[3],
    },
    trackBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    continueLink: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.ochre,
      textAlign: "center",
    },
  });
}

const PLACEHOLDER_GRADIENTS: [string, string][] = [
  ["#B38238", "#C5491F"],
  ["#C5491F", "#8A2D10"],
  ["#14110D", "#3A342B"],
];

export default function OrderConfirmationScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNav();
  const route = useRoute<RouteProp<OrderConfirmationParams, "OrderConfirmation">>();
  const { orderId, total, itemCount } = route.params;
  const { items } = useCartStore();

  const deliveryRange = useMemo(() => getDeliveryRange(), []);

  const previewImages = items.slice(0, 3);

  const goShop = () => {
    nav.navigate("ShopHome");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.center}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark-outline" size={40} color={c.paper} />
          </View>

          <Text style={styles.heading}>Order confirmed! 🎉</Text>
          <Text style={styles.subheading}>Your order has been placed.</Text>
          <Text style={styles.orderId}>{orderId}</Text>
          <Text style={styles.emailNote}>A confirmation email has been sent.</Text>

          <View style={styles.card}>
            <View style={styles.imagesRow}>
              {previewImages.length > 0
                ? previewImages.map((item, i) =>
                    item.image ? (
                      <Image
                        key={item.id}
                        source={{ uri: item.image }}
                        style={[styles.imgCircle, i > 0 && { marginLeft: -12 }]}
                      />
                    ) : (
                      <LinearGradient
                        key={item.id}
                        colors={PLACEHOLDER_GRADIENTS[i % PLACEHOLDER_GRADIENTS.length]}
                        style={[styles.imgCircle, i > 0 && { marginLeft: -12 }]}
                      />
                    )
                  )
                : PLACEHOLDER_GRADIENTS.slice(0, Math.min(itemCount, 3)).map((colors, i) => (
                    <LinearGradient
                      key={i}
                      colors={colors}
                      style={[styles.imgCircle, i > 0 && { marginLeft: -12 }]}
                    />
                  ))}
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {itemCount} item{itemCount !== 1 ? "s" : ""}
              </Text>
              <Text style={styles.summaryTotal}>{total}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.deliveryRow}>
              <Text>📦</Text>
              <Text style={styles.deliveryText}>Estimated delivery: {deliveryRange}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.trackBtn} onPress={goShop} activeOpacity={0.8}>
            <Text style={styles.trackBtnText}>Track order</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={goShop} activeOpacity={0.7}>
            <Text style={styles.continueLink}>Continue shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
