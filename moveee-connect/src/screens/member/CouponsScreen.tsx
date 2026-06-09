import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { Redemption } from "../../types";

const PROXY = "https://themoveee.com/api";
const QR_BASE = "https://themoveee.com/api/perks/verify?token=";

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function CouponCard({ redemption }: { redemption: Redemption }) {
  const days = daysUntil(redemption.expires_at);
  const isUsed    = redemption.status === "used"    || redemption.qr_scanned === 1;
  const isExpired = redemption.status === "expired" || days <= 0;
  const isUrgent  = !isUsed && !isExpired && days <= 2;

  const qrValue = `${QR_BASE}${redemption.qr_token}`;

  return (
    <View style={[styles.card, (isUsed || isExpired) && styles.cardDimmed]}>
      <Text style={styles.cardTitle}>{redemption.perk_title ?? "Partner Perk"}</Text>

      <View style={styles.qrArea}>
        <QRCode
          value={qrValue}
          size={200}
          backgroundColor={colors.paper}
          color={colors.ink}
        />
      </View>

      <View style={styles.cardFooter}>
        {redemption.expires_at && (
          <Text style={[styles.expiryText, isUrgent && styles.expiryUrgent]}>
            {isExpired ? "Expired" : isUsed ? "" : `Expires in ${days} day${days !== 1 ? "s" : ""} · ${new Date(redemption.expires_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
          </Text>
        )}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, isUsed || isExpired ? styles.statusDotGrey : styles.statusDotGreen]} />
          <Text style={styles.statusText}>
            {isUsed ? "Used" : isExpired ? "Expired" : "Active"}
          </Text>
        </View>
      </View>

      {(isUsed || isExpired) && (
        <View style={styles.overlay}>
          <View style={styles.overlayBadge}>
            <Text style={styles.overlayBadgeText}>{isUsed ? "Used" : "Expired"}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function CouponsScreen() {
  const nav = useNavigation<any>();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Redemption[]>(`${PROXY}/perks/redemptions`)
      .then(setRedemptions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />
      ) : redemptions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No active coupons yet.</Text>
          <TouchableOpacity onPress={() => nav.navigate("Perks")}>
            <Text style={styles.emptyLink}>Browse partner perks to redeem your credits →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {redemptions.map((r) => <CouponCard key={r.id} redemption={r} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },

  list: { padding: space[4], gap: space[4], paddingBottom: space[8] },

  card: {
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, padding: space[4], overflow: "hidden",
  },
  cardDimmed: { opacity: 0.7 },
  cardTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink, marginBottom: space[3] },

  qrArea: { alignItems: "center", marginBottom: space[3] },

  cardFooter: { gap: 4 },
  expiryText:  { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  expiryUrgent:{ color: colors.ochre },

  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot:       { width: 8, height: 8, borderRadius: 4 },
  statusDotGreen:  { backgroundColor: colors.communityText },
  statusDotGrey:   { backgroundColor: colors.ghost },
  statusText:      { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center", alignItems: "center",
  },
  overlayBadge: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingHorizontal: space[4], paddingVertical: space[2],
  },
  overlayBadgeText: { fontFamily: fonts.monoBold, fontSize: fontSize.md, color: colors.paper, letterSpacing: 2 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: space[6], gap: space[3] },
  emptyTitle: { fontFamily: fonts.serif, fontSize: fontSize.lg, color: colors.inkSoft, textAlign: "center" },
  emptyLink:  { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.gold, textAlign: "center" },
});
