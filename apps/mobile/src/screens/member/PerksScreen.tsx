import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api, CULTURE_API, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import { ConfirmRedeemDialog } from "../../components/ui/Overlays";
import type { Perk } from "../../types";



interface RedeemResult {
  redemption_id: number;
  qr_token: string;
  expires_at: string;
  new_balance: number;
}

function PerkCard({
  perk,
  credits,
  onRedeem,
}: {
  perk: Perk;
  credits: number;
  onRedeem: (perk: Perk) => void;
}) {
  const canAfford = credits >= perk.credit_cost;
  const soldOut   = perk.max_total > 0 && perk.redeemed_count >= perk.max_total;

  // Derive a short partner name from title if no dedicated field
  const partnerName = (perk as any).partner_name ?? perk.title.split(" ").slice(-2).join(" ");

  return (
    <View style={[styles.card, soldOut && styles.cardSoldOut]}>
      {/* Partner logo placeholder */}
      <View style={styles.partnerLogo}>
        <Ionicons name="image-outline" size={16} color={colors.mute} />
      </View>

      <Text style={styles.partnerName} numberOfLines={1}>
        {partnerName.toUpperCase()}
      </Text>
      <Text style={styles.cardTitle} numberOfLines={2}>{perk.title}</Text>

      <View style={styles.crPill}>
        <Text style={styles.crPillText}>{perk.credit_cost} CR</Text>
      </View>

      {soldOut ? (
        <View style={styles.soldOutBtn}>
          <Text style={styles.soldOutBtnText}>Sold Out</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.redeemBtn, !canAfford && styles.redeemBtnDisabled]}
          onPress={() => canAfford && onRedeem(perk)}
          disabled={!canAfford}
        >
          <Text style={styles.redeemBtnText}>Redeem</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PerksScreen() {
  const nav = useNavigation<any>();
  const { user, updateUser } = useAuthStore() as any;
  const [perks,     setPerks]     = useState<Perk[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [redeeming,     setRedeeming]     = useState(false);
  const [success,       setSuccess]       = useState<{ perk: Perk; result: RedeemResult } | null>(null);
  const [confirmPerk,   setConfirmPerk]   = useState<Perk | null>(null);

  const credits    = user?.credits ?? 0;
  const hasPasskey = user?.hasPasskey ?? false;

  useEffect(() => {
    api.get<Perk[]>(`${CULTURE_API}/perks`, false)
      .then(setPerks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = (perk: Perk) => {
    if (!hasPasskey) return;
    setConfirmPerk(perk);
  };

  const doRedeem = async () => {
    if (!confirmPerk) return;
    const perk = confirmPerk;
    setConfirmPerk(null);
    setRedeeming(true);
    try {
      const result = await api.post<RedeemResult>(
        `${MOBILE_API}/perks/redeem`,
        { perk_id: perk.id }
      );
      setSuccess({ perk, result });
      if (updateUser && result.new_balance !== undefined) {
        updateUser({ credits: result.new_balance });
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not redeem perk.");
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Perks</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Balance banner */}
      <View style={styles.balanceBanner}>
        <View style={styles.balanceLeft}>
          <Text style={styles.balanceStar}>★</Text>
          <Text style={styles.balanceText}>{credits.toLocaleString()} CR available</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.earnMore}>Earn more →</Text>
        </TouchableOpacity>
      </View>

      {/* Passkey gate banner */}
      {!hasPasskey && (
        <TouchableOpacity
          style={styles.passKeyBanner}
          onPress={() => nav.navigate("MemberSettings", { tab: "security" })}
        >
          <Ionicons name="finger-print-outline" size={16} color={colors.gold} />
          <Text style={styles.passKeyBannerText}>
            Passkey required to redeem. Set up in Settings → Security
          </Text>
          <Ionicons name="chevron-forward" size={14} color={colors.gold} />
        </TouchableOpacity>
      )}

      {/* Success banner */}
      {success && (
        <View style={styles.successBanner}>
          <View style={styles.successBannerInner}>
            <Text style={styles.successTitle}>✅ Perk redeemed!</Text>
            <Text style={styles.successSub}>
              You spent {success.perk.credit_cost} CR. Balance: {success.result.new_balance} CR
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => { setSuccess(null); nav.navigate("Coupons"); }}
          >
            <Text style={styles.successLink}>View in Coupons →</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />
      ) : (
        <FlatList
          data={perks}
          keyExtractor={(p) => String(p.id)}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <PerkCard perk={item} credits={credits} onRedeem={handleRedeem} />
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No perks available right now.</Text>
          }
        />
      )}

      {redeeming && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.paper} size="large" />
        </View>
      )}

      <ConfirmRedeemDialog
        visible={confirmPerk !== null}
        perkName={confirmPerk?.title ?? ""}
        cost={confirmPerk?.credit_cost ?? 0}
        balance={credits}
        onCancel={() => setConfirmPerk(null)}
        onConfirm={doRedeem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperDeep },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.paper, paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  backBtn:     { width: 44, height: 44, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },

  // Balance banner
  balanceBanner: {
    height: 64, backgroundColor: colors.paperWarm,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  balanceLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  balanceStar: { fontFamily: fonts.sans, fontSize: 16, color: colors.ochre, marginBottom: 2 },
  balanceText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  earnMore:    { fontFamily: fonts.sans, fontSize: 12, color: colors.ochre },

  // Passkey banner
  passKeyBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    backgroundColor: colors.goldLight, borderRadius: radius.xl,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.goldBorder,
  },
  passKeyBannerText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.gold, flex: 1 },

  // Success banner
  successBanner: {
    marginHorizontal: 16, marginTop: 12,
    backgroundColor: colors.paper, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: colors.success,
    padding: 16, ...shadows.card,
  },
  successBannerInner: { gap: 4, marginBottom: 8 },
  successTitle:       { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  successSub:         { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },
  successLink:        { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ochre, textAlign: "right" },

  // Grid
  grid: { paddingHorizontal: 16, paddingVertical: 16, paddingBottom: space[8] },
  row:  { gap: 12, marginBottom: 12 },

  card: {
    flex: 1, backgroundColor: colors.paper, borderRadius: radius.xl,
    padding: 16, alignItems: "center", gap: 4, ...shadows.card,
  },
  cardSoldOut: { opacity: 0.65 },

  partnerLogo: {
    width: 50, height: 30, backgroundColor: colors.ghost,
    borderRadius: 4, alignItems: "center", justifyContent: "center",
    opacity: 0.3, marginBottom: 8,
  },

  partnerName: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: colors.mute, letterSpacing: 1.5, textTransform: "uppercase",
  },
  cardTitle: {
    fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink,
    textAlign: "center", lineHeight: 18, height: 40, marginTop: 4,
  },
  crPill: {
    backgroundColor: colors.ochre, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 4, marginTop: 4,
  },
  crPillText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.paper },

  redeemBtn: {
    width: "100%", height: 36, backgroundColor: colors.ochre,
    borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  redeemBtnDisabled: { opacity: 0.4 },
  redeemBtnText:     { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },

  soldOutBtn: {
    width: "100%", height: 36, borderWidth: 1, borderColor: colors.ghost,
    borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginTop: 8,
  },
  soldOutBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ghost },

  empty: { textAlign: "center", fontFamily: fonts.sans, color: colors.mute, marginTop: 40 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
});
