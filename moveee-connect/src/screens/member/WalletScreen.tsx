import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { LedgerEntry } from "../../types";

const PROXY = "https://themoveee.com/api";

type Currency = "GBP" | "USD" | "NGN";
type WalletTab = "history" | "cashout";

const NGN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank", "Fidelity", "First Bank",
  "FCMB", "Globus", "GTBank", "Heritage", "Keystone", "Lotus", "Polaris",
  "Providus", "Stanbic IBTC", "Standard Chartered", "Sterling", "SunTrust",
  "Titan Trust", "Union Bank", "UBA", "Unity", "Wema", "Zenith Bank",
];

const SOURCE_LABELS: Record<string, string> = {
  post_validated:  "Post validated",
  perk_redeem:     "Perk redeemed",
  cashout:         "Cash out",
  referral:        "Referral bonus",
  event_rsvp:      "Event RSVP",
  event_checkin:   "Event check-in",
  quote_share:     "Share a quote",
  magazine_read:   "Read magazine",
  magazine_share:  "Share magazine",
  directory_entry: "Directory entry",
  game_complete:   "Game completed",
  newsletter_comment: "Newsletter comment",
};

function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const isPositive = entry.amount > 0;
  return (
    <View style={styles.ledgerRow}>
      <Text style={[styles.ledgerAmount, isPositive ? styles.positive : styles.negative]}>
        {isPositive ? "+" : ""}{entry.amount} cr
      </Text>
      <Text style={styles.ledgerSource}>
        {SOURCE_LABELS[entry.source] ?? entry.source}
      </Text>
      <Text style={styles.ledgerDate}>
        {new Date(entry.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const nav = useNavigation<any>();
  const { user, updateUser } = useAuthStore() as any;
  const [tab, setTab] = useState<WalletTab>("history");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [creditsPerGbp, setCreditsPerGbp] = useState(10);
  const [balance, setBalance] = useState(user?.credits ?? 0);

  // Cashout form
  const [cashoutCredits, setCashoutCredits] = useState("");
  const [currency, setCurrency] = useState<Currency>("GBP");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const balRes = await api.get<{ credits: number; credits_per_gbp: number; user_id: string }>(
          `${PROXY}/wallet/balance`
        );
        setBalance(balRes.credits);
        setCreditsPerGbp(balRes.credits_per_gbp ?? 10);
        if (updateUser) updateUser({ credits: balRes.credits });
      } catch {}
      try {
        const histRes = await api.get<{ entries: LedgerEntry[] }>(`${PROXY}/wallet/history`);
        setEntries(histRes.entries ?? []);
      } catch {} finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, []);

  const creditsNum = parseInt(cashoutCredits, 10) || 0;
  const feeCredits = creditsNum > 0 ? Math.round(creditsNum * 0.3) : 0;
  const netCredits = creditsNum - feeCredits;
  const payout = creditsPerGbp > 0 ? (netCredits / creditsPerGbp).toFixed(2) : "0.00";
  const currencySymbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "₦";

  const cashoutValid = creditsNum >= 100 && accountName && accountNumber &&
    (currency !== "GBP" || sortCode) &&
    (currency !== "USD" || (bankName && routingNumber)) &&
    (currency !== "NGN" || bankName);

  const handleCashout = async () => {
    if (!cashoutValid) return;
    Alert.alert(
      "Confirm cashout",
      `You'll receive ${currencySymbol}${payout} after a 30% fee. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              const body: Record<string, unknown> = {
                credits: creditsNum, currency, account_name: accountName,
                account_number: accountNumber,
              };
              if (currency === "GBP") body.sort_code = sortCode;
              if (currency === "USD") { body.routing_number = routingNumber; body.bank_name = bankName; }
              if (currency === "NGN") body.bank_name = bankName;

              await api.post(`${PROXY}/wallet/cashout`, body);
              Alert.alert("Requested", "Your cashout request has been submitted for review.");
              setCashoutCredits("");
              const balRes = await api.get<{ credits: number; credits_per_gbp: number; user_id: string }>(
                `${PROXY}/wallet/balance`
              );
              setBalance(balRes.credits);
              if (updateUser) updateUser({ credits: balRes.credits });
            } catch (err: any) {
              Alert.alert("Error", err?.message ?? "Could not submit cashout request.");
            } finally {
              setSubmitting(false);
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
        <Text style={styles.headerTitle}>My Wallet</Text>
      </View>

      {/* Balance hero */}
      <View style={styles.balanceHero}>
        <Text style={styles.balanceLabel}>CULTURE POINTS</Text>
        <Text style={styles.balanceValue}>{balance}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(["history", "cashout"] as WalletTab[]).map((t) => (
          <TouchableOpacity key={t} style={[styles.tabBtn, tab === t && styles.tabBtnActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
              {t === "history" ? "History" : "Cash Out"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "history" ? (
        loadingHistory ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.gold} />
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: space[6] }}>
            {entries.length === 0 ? (
              <Text style={styles.empty}>No transactions yet.</Text>
            ) : (
              entries.map((e) => <LedgerRow key={e.id} entry={e} />)
            )}
          </ScrollView>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.cashoutForm}>
          <Text style={styles.infoLine}>Minimum 100 credits. A flat 30% fee applies.</Text>

          <Text style={styles.fieldLabel}>Credits to cash out</Text>
          <TextInput
            style={styles.input}
            value={cashoutCredits}
            onChangeText={setCashoutCredits}
            keyboardType="number-pad"
            placeholder="e.g. 500"
            placeholderTextColor={colors.ghost}
          />

          {creditsNum >= 100 && (
            <Text style={styles.feePreview}>
              Fee: 30% ({feeCredits} cr) · You receive: {currencySymbol}{payout}
            </Text>
          )}

          <Text style={styles.fieldLabel}>Currency</Text>
          <View style={styles.currencyRow}>
            {(["GBP", "USD", "NGN"] as Currency[]).map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.currencyBtn, currency === c && styles.currencyBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyBtnText, currency === c && styles.currencyBtnTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Account Name *</Text>
          <TextInput style={styles.input} value={accountName} onChangeText={setAccountName} />

          {currency === "GBP" && (
            <>
              <Text style={styles.fieldLabel}>Sort Code *</Text>
              <TextInput style={styles.input} value={sortCode} onChangeText={setSortCode} keyboardType="number-pad" placeholder="00-00-00" placeholderTextColor={colors.ghost} />
            </>
          )}
          {currency === "USD" && (
            <>
              <Text style={styles.fieldLabel}>Bank Name *</Text>
              <TextInput style={styles.input} value={bankName} onChangeText={setBankName} />
              <Text style={styles.fieldLabel}>Routing Number *</Text>
              <TextInput style={styles.input} value={routingNumber} onChangeText={setRoutingNumber} keyboardType="number-pad" />
            </>
          )}
          {currency === "NGN" && (
            <>
              <Text style={styles.fieldLabel}>Bank Name *</Text>
              <View style={styles.bankList}>
                {NGN_BANKS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.bankOption, bankName === b && styles.bankOptionActive]}
                    onPress={() => setBankName(b)}
                  >
                    <Text style={[styles.bankOptionText, bankName === b && styles.bankOptionTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Account Number *</Text>
          <TextInput style={styles.input} value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />

          <TouchableOpacity
            style={[styles.submitBtn, (!cashoutValid || submitting) && styles.submitBtnDisabled]}
            onPress={handleCashout}
            disabled={!cashoutValid || submitting}
          >
            {submitting
              ? <ActivityIndicator color={colors.paper} />
              : <Text style={styles.submitBtnText}>Request Cashout</Text>
            }
          </TouchableOpacity>
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

  balanceHero: { alignItems: "center", paddingVertical: space[5] },
  balanceLabel: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, letterSpacing: 2, color: colors.mute, textTransform: "uppercase" },
  balanceValue: { fontFamily: fonts.serifBold, fontSize: fontSize['3xl'], color: colors.ink, marginTop: space[1] },

  tabs: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.rule },
  tabBtn: { flex: 1, paddingVertical: space[3], alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabBtnActive: { borderBottomColor: colors.ink },
  tabBtnText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 1 },
  tabBtnTextActive: { color: colors.ink },

  ledgerRow: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule, backgroundColor: colors.paper, gap: space[3],
  },
  ledgerAmount: { fontFamily: fonts.monoBold, fontSize: fontSize.sm, width: 60 },
  positive: { color: colors.communityText },
  negative: { color: colors.mute },
  ledgerSource: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft },
  ledgerDate:   { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost },

  cashoutForm: { padding: space[4], paddingBottom: space[10] },
  infoLine: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, marginBottom: space[4] },

  fieldLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6, marginTop: space[3],
  },
  input: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2], backgroundColor: colors.paper,
  },
  feePreview: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold,
    marginTop: space[1], marginBottom: space[1],
  },

  currencyRow: { flexDirection: "row", gap: space[2] },
  currencyBtn: {
    flex: 1, borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingVertical: space[2], alignItems: "center",
  },
  currencyBtnActive:    { backgroundColor: colors.ink, borderColor: colors.ink },
  currencyBtnText:      { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.mute },
  currencyBtnTextActive:{ color: colors.paper },

  bankList: { gap: space[1] },
  bankOption: {
    paddingHorizontal: space[3], paddingVertical: space[2],
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md, backgroundColor: colors.paper,
  },
  bankOptionActive:    { backgroundColor: colors.ink, borderColor: colors.ink },
  bankOptionText:      { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft },
  bankOptionTextActive:{ color: colors.paper },

  submitBtn: {
    backgroundColor: colors.ink, borderRadius: radius.lg, paddingVertical: space[3],
    alignItems: "center", marginTop: space[5],
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  empty: { textAlign: "center", fontFamily: fonts.sans, color: colors.mute, marginTop: 40, padding: space[4] },
});
