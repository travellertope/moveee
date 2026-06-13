import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import type { Redemption } from "../../types";


const QR_BASE = "https://themoveee.com/api/perks/verify?token=";

function daysUntil(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function CouponCard({ redemption, styles, c }: { redemption: Redemption; styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  const days      = daysUntil(redemption.expires_at);
  const isUsed    = redemption.status === "used"    || redemption.qr_scanned === 1;
  const isExpired = redemption.status === "expired" || days <= 0;
  const isUrgent  = !isUsed && !isExpired && days <= 3;
  const isActive  = !isUsed && !isExpired;

  const qrValue   = `${QR_BASE}${redemption.qr_token}`;
  const couponCode = redemption.qr_token.slice(0, 12).toUpperCase();

  const partnerName = (redemption as any).partner_name
    ?? (redemption.perk_title?.split(" ").slice(0, 2).join(" ") ?? "Partner");

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTopRow}>
          <Text style={styles.partnerName}>{partnerName.toUpperCase()}</Text>
          <View style={[styles.statusBadge, isActive ? styles.statusActive : styles.statusExpired]}>
            <Text style={styles.statusBadgeText}>{isUsed ? "USED" : isExpired ? "EXPIRED" : "ACTIVE"}</Text>
          </View>
        </View>
        <Text style={styles.perkTitle}>{redemption.perk_title ?? "Partner Perk"}</Text>
        {redemption.expires_at ? (
          <Text style={[styles.expiryText, isUrgent && styles.expiryUrgent, (isExpired || isUsed) && styles.expiryGrey]}>
            {isExpired
              ? `Expired ${fmtDate(redemption.expires_at)}`
              : isUsed
              ? `Used · ${fmtDate(redemption.expires_at)}`
              : `Expires in ${days} day${days !== 1 ? "s" : ""} · ${fmtDate(redemption.expires_at)}`}
          </Text>
        ) : null}
      </View>

      <View style={[styles.qrArea, (isExpired || isUsed) && { opacity: 0.4 }]}>
        <QRCode
          value={qrValue}
          size={200}
          backgroundColor={c.paper}
          color={isActive ? c.ink : c.ghost}
        />
        <Text style={[styles.qrHint, !isActive && { color: c.ghost }]}>
          Show this code in-store
        </Text>
        <Text style={[styles.couponCode, !isActive && { color: c.ghost }]}>
          {couponCode}
        </Text>

        {(isExpired || isUsed) && (
          <View style={styles.watermarkWrap} pointerEvents="none">
            <Text style={styles.watermark}>{isUsed ? "USED" : "EXPIRED"}</Text>
          </View>
        )}
      </View>

      <View style={styles.perforationWrap}>
        <View style={styles.perforationCircleLeft} />
        <View style={styles.perforationLine} />
        <View style={styles.perforationCircleRight} />
      </View>

      <View style={[styles.cardFooter, (isExpired || isUsed) && { opacity: 0.6 }]}>
        <Text style={styles.footerText}>
          Present this QR code to the partner at point of sale to receive your discount.
        </Text>
      </View>
    </View>
  );
}

export default function CouponsScreen() {
  const nav = useNavigation<any>();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading,     setLoading]     = useState(true);

  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  useEffect(() => {
    api.get<Redemption[]>(`${MOBILE_API}/perks/redemptions`)
      .then(setRedemptions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Coupons</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.gold} />
      ) : redemptions.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="qr-code-outline" size={64} color={c.ghost} style={{ marginBottom: 20 }} />
          <Text style={styles.emptyTitle}>No coupons yet</Text>
          <Text style={styles.emptyDesc}>Redeem partner perks to get your coupons here.</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => nav.navigate("Perks")}
          >
            <Text style={styles.browseBtnText}>Browse Perks →</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {redemptions.map((r) => <CouponCard key={r.id} redemption={r} styles={styles} c={c} />)}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperDeep },

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    backBtn:     { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },

    list: { padding: 16, gap: 20, paddingBottom: 40 },

    card: {
      backgroundColor: c.paper, borderRadius: radius.xl, overflow: "visible", ...shadows.card,
    },

    cardTop: { padding: 24, paddingBottom: 0 },
    cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    partnerName: {
      fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
      color: c.mute, letterSpacing: 1.5, textTransform: "uppercase",
    },
    statusBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
    statusActive:  { backgroundColor: c.success },
    statusExpired: { backgroundColor: c.error },
    statusBadgeText: { fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow, color: c.paper, letterSpacing: 1 },

    perkTitle:   { fontFamily: fonts.sansBold, fontSize: 18, color: c.ink, marginTop: 8 },
    expiryText:  { fontFamily: fonts.sans, fontSize: 12, color: c.warning, marginTop: 8 },
    expiryUrgent:{ color: c.error },
    expiryGrey:  { color: c.mute },

    qrArea: {
      alignItems: "center", marginTop: 24, marginBottom: 8, position: "relative",
    },
    qrHint:    { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.mute, marginTop: 8 },
    couponCode: {
      fontFamily: fonts.monoBold, fontSize: 16, color: c.ink,
      letterSpacing: 2, marginTop: 4,
    },
    watermarkWrap: {
      position: "absolute", top: 0, bottom: 0, left: 0, right: 0,
      alignItems: "center", justifyContent: "center",
    },
    watermark: {
      fontFamily: fonts.sansBold, fontSize: 48, color: c.ghost,
      opacity: 0.4, transform: [{ rotate: "-45deg" }], letterSpacing: 4,
    },

    perforationWrap: {
      flexDirection: "row", alignItems: "center",
      marginVertical: 20, paddingHorizontal: 0,
      position: "relative", height: 4,
    },
    perforationCircleLeft: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: c.paperDeep,
      position: "absolute", left: -10, top: -8, zIndex: 2,
    },
    perforationCircleRight: {
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: c.paperDeep,
      position: "absolute", right: -10, top: -8, zIndex: 2,
    },
    perforationLine: {
      flex: 1, height: 0,
      borderStyle: "dashed", borderWidth: 1, borderColor: c.ghost,
      marginHorizontal: 4,
    },

    cardFooter: { paddingHorizontal: 16, paddingBottom: 16 },
    footerText: {
      fontFamily: fonts.sans, fontSize: 12, color: c.mute,
      textAlign: "center", lineHeight: 18,
    },

    empty: {
      flex: 1, backgroundColor: c.paperWarm,
      alignItems: "center", justifyContent: "center",
      padding: 24, gap: space[3],
    },
    emptyTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    emptyDesc:  {
      fontFamily: fonts.sans, fontSize: 14, color: c.mute,
      textAlign: "center", maxWidth: 260, lineHeight: 20,
    },
    browseBtn: {
      height: 52, width: "100%", maxWidth: 280,
      backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center",
      shadowColor: c.ochre, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    browseBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
  });
}
