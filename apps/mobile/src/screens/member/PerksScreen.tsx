import React, { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { Perk } from "../../types";

const PROXY = "https://themoveee.com/api";

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
  const soldOut = perk.max_total > 0 && perk.redeemed_count >= perk.max_total;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{perk.title}</Text>
      <Text style={styles.cardDesc}>{perk.description}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.creditCost}>{perk.credit_cost} credits</Text>
        {soldOut ? (
          <View style={styles.soldOutBadge}>
            <Text style={styles.soldOutText}>Sold out</Text>
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
    </View>
  );
}

export default function PerksScreen() {
  const nav = useNavigation<any>();
  const { user, updateUser } = useAuthStore() as any;
  const [perks, setPerks] = useState<Perk[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState<{ perk: Perk; result: RedeemResult } | null>(null);

  const credits = user?.credits ?? 0;
  const hasPasskey = user?.hasPasskey ?? false;

  useEffect(() => {
    api.get<Perk[]>(`${CULTURE_API}/perks`, false)
      .then(setPerks)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (perk: Perk) => {
    if (!hasPasskey) return;
    Alert.alert(
      `Redeem "${perk.title}"`,
      `This will deduct ${perk.credit_cost} credits from your balance.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setRedeeming(true);
            try {
              const result = await api.post<RedeemResult>(
                `${PROXY}/perks/redeem`,
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
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Perks</Text>
      </View>

      {/* Credit balance */}
      <View style={styles.balanceHero}>
        <Text style={styles.balanceLabel}>CULTURE POINTS</Text>
        <Text style={styles.balanceValue}>{credits}</Text>
      </View>

      {/* Passkey gate banner */}
      {!hasPasskey && (
        <TouchableOpacity
          style={styles.passKeyBanner}
          onPress={() => nav.navigate("MemberSettings", { tab: "security" })}
        >
          <Text style={styles.passKeyBannerText}>
            🔑 Passkey required to redeem perks. Set up a passkey in Settings → Security →
          </Text>
        </TouchableOpacity>
      )}

      {/* Success banner */}
      {success && (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>Perk redeemed! ✓</Text>
          <Text style={styles.successSub}>New balance: {success.result.new_balance} credits</Text>
          <TouchableOpacity onPress={() => { setSuccess(null); nav.navigate("Coupons"); }}>
            <Text style={styles.successLink}>View in My Coupons →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSuccess(null)} style={styles.successDismiss}>
            <Text style={styles.successDismissText}>Dismiss</Text>
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

  balanceHero: { alignItems: "center", paddingVertical: space[5] },
  balanceLabel: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, letterSpacing: 2, color: colors.mute, textTransform: "uppercase" },
  balanceValue: { fontFamily: fonts.serifBold, fontSize: fontSize['3xl'], color: colors.ink, marginTop: space[1] },

  passKeyBanner: {
    marginHorizontal: space[4], marginBottom: space[3],
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.md, padding: space[3],
  },
  passKeyBannerText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.gold },

  successBanner: {
    marginHorizontal: space[4], marginBottom: space[3],
    backgroundColor: colors.communityBg, borderWidth: 1, borderColor: colors.communityBorder,
    borderRadius: radius.md, padding: space[4], gap: space[1],
  },
  successTitle:   { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },
  successSub:     { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft },
  successLink:    { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.communityText, letterSpacing: 1 },
  successDismiss: { marginTop: space[1] },
  successDismissText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  grid: { paddingHorizontal: space[3], paddingBottom: space[6] },
  row: { gap: space[3], marginBottom: space[3] },

  card: {
    flex: 1, backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, padding: space[3], gap: space[2],
  },
  cardTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.base, color: colors.ink },
  cardDesc:  { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space[1] },
  creditCost: { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: colors.gold },

  redeemBtn:         { backgroundColor: colors.ink, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: space[1] + 2 },
  redeemBtnDisabled: { opacity: 0.4 },
  redeemBtnText:     { fontFamily: fonts.sansBold, fontSize: fontSize.xs, color: colors.paper },

  soldOutBadge: { backgroundColor: colors.paperDeep, borderRadius: radius.sm, paddingHorizontal: space[2], paddingVertical: 2 },
  soldOutText:  { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute },

  empty: { textAlign: "center", fontFamily: fonts.sans, color: colors.mute, marginTop: 40 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center", alignItems: "center",
  },
});
