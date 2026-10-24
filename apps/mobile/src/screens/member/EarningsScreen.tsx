import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useTabletContentStyle } from "../../hooks/useTabletContentStyle";

// Flutterwave bank codes for NGN transfers
const NGN_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank",                     code: "044" },
  { name: "Citibank Nigeria",                code: "023" },
  { name: "Ecobank Nigeria",                 code: "050" },
  { name: "Fidelity Bank",                   code: "070" },
  { name: "First Bank of Nigeria",           code: "011" },
  { name: "FCMB",                            code: "214" },
  { name: "Globus Bank",                     code: "103" },
  { name: "GTBank",                          code: "058" },
  { name: "Heritage Bank",                   code: "030" },
  { name: "Keystone Bank",                   code: "082" },
  { name: "Lotus Bank",                      code: "303" },
  { name: "Polaris Bank",                    code: "076" },
  { name: "Providus Bank",                   code: "101" },
  { name: "Stanbic IBTC Bank",               code: "221" },
  { name: "Standard Chartered",             code: "068" },
  { name: "Sterling Bank",                   code: "232" },
  { name: "SunTrust Bank",                   code: "100" },
  { name: "Titan Trust Bank",               code: "102" },
  { name: "Union Bank of Nigeria",           code: "032" },
  { name: "UBA",                             code: "033" },
  { name: "Unity Bank",                      code: "215" },
  { name: "Wema Bank",                       code: "035" },
  { name: "Zenith Bank",                     code: "057" },
];

type EarningsTab = "overview" | "history" | "payout";

interface EarningRow {
  id: number;
  event_id: number;
  net_amount: string;
  gross_amount: string;
  platform_fee: string;
  currency: string;
  status: string;
  created_at: string;
  event_title?: string;
}

interface BalanceEntry {
  available: number;
  paid_out: number;
}

interface EarningsData {
  balance: Record<string, BalanceEntry>;
  history: { items: EarningRow[]; total: number };
  fee_rate: number;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatNGN(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount;
  return "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Modal bank picker — same pattern as WalletScreen
function BankPicker({
  value, onChange, c, styles,
}: {
  value: { name: string; code: string } | null;
  onChange: (b: { name: string; code: string }) => void;
  c: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={styles.pickerTrigger}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text style={[styles.pickerTriggerText, !value && { color: c.ghost }]}>
          {value?.name ?? "Select bank…"}
        </Text>
        <Ionicons name="chevron-down" size={16} color={c.mute} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bank</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={c.ink} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {NGN_BANKS.map((b) => (
                <TouchableOpacity
                  key={b.code}
                  style={[styles.modalOption, value?.code === b.code && styles.modalOptionActive]}
                  onPress={() => { onChange(b); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, value?.code === b.code && styles.modalOptionTextActive]}>
                    {b.name}
                  </Text>
                  {value?.code === b.code && (
                    <Ionicons name="checkmark" size={16} color={c.paper} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default function EarningsScreen() {
  const nav    = useNav();
  const c      = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const cap    = useTabletContentStyle(680);

  const [tab, setTab]       = useState<EarningsTab>("overview");
  const [loading, setLoading] = useState(true);
  const [data, setData]     = useState<EarningsData | null>(null);

  // Payout form
  const [amount, setAmount]           = useState("");
  const [bank, setBank]               = useState<{ name: string; code: string } | null>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName]   = useState("");
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get<EarningsData>(`${CULTURE_API}/creator/earnings?per_page=50`);
        setData(res);
      } catch {} finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const ngnBalance  = data?.balance?.NGN ?? { available: 0, paid_out: 0 };
  const amountNum   = parseFloat(amount) || 0;
  const feePercent  = Math.round((data?.fee_rate ?? 0.20) * 100);
  const history     = data?.history?.items ?? [];
  const totalRows   = data?.history?.total ?? 0;

  const formValid =
    amountNum > 0 && amountNum <= ngnBalance.available &&
    bank !== null && accountNumber.trim().length === 10 && accountName.trim().length > 0;

  async function handlePayout() {
    if (!formValid || submitting) return;
    Alert.alert(
      "Confirm Payout Request",
      `Request ${formatNGN(amountNum)} to ${accountName} at ${bank!.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              await api.post(`${CULTURE_API}/creator/payout-request`, {
                amount: amountNum,
                currency: "NGN",
                bank_code: bank!.code,
                account_number: accountNumber.trim(),
                account_name: accountName.trim(),
              });
              Alert.alert("Request Submitted", "We'll process your payout within 1–2 business days.");
              setAmount(""); setBank(null); setAccountNumber(""); setAccountName("");
              // Refresh balance
              try {
                const res = await api.get<EarningsData>(`${CULTURE_API}/creator/earnings?per_page=50`);
                setData(res);
              } catch {}
              setTab("overview");
            } catch (err: any) {
              Alert.alert("Error", err?.message ?? "Could not submit payout request.");
            } finally {
              setSubmitting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* White header block */}
      <View style={styles.whiteBlock}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Earnings</Text>
        </View>

        {/* Balance hero */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroEyebrow}>AVAILABLE (NGN)</Text>
          <Text style={styles.heroValue}>{formatNGN(ngnBalance.available)}</Text>
          <Text style={styles.heroSub}>
            {formatNGN(ngnBalance.paid_out)} paid out · {feePercent}% platform fee
          </Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {(["overview", "history", "payout"] as EarningsTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tabBtn}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              {tab === t && <View style={styles.tabIndicator} />}
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "overview" ? "Overview" : t === "history" ? "History" : "Payout"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={c.gold} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, cap]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Overview ── */}
          {tab === "overview" && (
            <>
              {Object.keys(data?.balance ?? {}).length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="cash-outline" size={40} color={c.ghost} style={{ marginBottom: 12 }} />
                  <Text style={styles.emptyTitle}>No earnings yet</Text>
                  <Text style={styles.emptyBody}>
                    Once attendees pay for your events, your earnings will appear here.
                  </Text>
                </View>
              ) : (
                Object.entries(data!.balance).map(([currency, b]) => (
                  <View key={currency} style={[styles.statCard, shadows.card]}>
                    <Text style={styles.statCardTitle}>{currency} Earnings</Text>
                    <View style={styles.statRow}>
                      <View style={styles.statCell}>
                        <Text style={styles.statLabel}>Available</Text>
                        <Text style={[styles.statValue, { color: c.ochre }]}>
                          {currency === "NGN" ? formatNGN(b.available) : b.available.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statCell}>
                        <Text style={styles.statLabel}>Paid Out</Text>
                        <Text style={styles.statValue}>
                          {currency === "NGN" ? formatNGN(b.paid_out) : b.paid_out.toFixed(2)}
                        </Text>
                      </View>
                      <View style={styles.statDivider} />
                      <View style={styles.statCell}>
                        <Text style={styles.statLabel}>Total</Text>
                        <Text style={styles.statValue}>
                          {currency === "NGN" ? formatNGN(b.available + b.paid_out) : (b.available + b.paid_out).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.statFooter}>
                      Net after {feePercent}% platform fee
                    </Text>
                  </View>
                ))
              )}
            </>
          )}

          {/* ── History ── */}
          {tab === "history" && (
            <>
              {history.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>No transactions yet</Text>
                </View>
              ) : (
                <View style={[styles.listCard, shadows.card]}>
                  {history.map((row, idx) => (
                    <View
                      key={row.id}
                      style={[styles.histRow, idx === history.length - 1 && styles.histRowLast]}
                    >
                      <View style={[
                        styles.histIcon,
                        row.status === "available" ? styles.histIconAvail : styles.histIconPaid,
                      ]}>
                        <Ionicons
                          name={row.status === "available" ? "checkmark" : "checkmark-done"}
                          size={14}
                          color={row.status === "available" ? c.ochre : c.mute}
                        />
                      </View>
                      <View style={styles.histMeta}>
                        <Text style={styles.histTitle} numberOfLines={1}>
                          {row.event_title ?? `Event #${row.event_id}`}
                        </Text>
                        <Text style={styles.histDate}>{formatDate(row.created_at)}</Text>
                      </View>
                      <View style={styles.histRight}>
                        <Text style={[styles.histAmount, row.status === "paid_out" && { color: c.mute }]}>
                          +{row.currency === "NGN" ? formatNGN(row.net_amount) : row.net_amount}
                        </Text>
                        <Text style={[
                          styles.histStatus,
                          row.status === "available" ? styles.histStatusAvail : styles.histStatusPaid,
                        ]}>
                          {row.status === "available" ? "Available" : "Paid out"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {totalRows > history.length && (
                <Text style={styles.moreNote}>Showing {history.length} of {totalRows}</Text>
              )}
            </>
          )}

          {/* ── Payout ── */}
          {tab === "payout" && (
            <View style={[styles.payoutCard, shadows.card]}>
              {ngnBalance.available <= 0 ? (
                <View style={styles.emptyWrap}>
                  <Text style={styles.emptyTitle}>No balance to withdraw</Text>
                  <Text style={styles.emptyBody}>You have no available NGN earnings.</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.payoutAvail}>
                    Available: {formatNGN(ngnBalance.available)}
                  </Text>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Amount (NGN)</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={amount}
                      onChangeText={setAmount}
                      keyboardType="decimal-pad"
                      placeholder={`Max: ${formatNGN(ngnBalance.available)}`}
                      placeholderTextColor={c.ghost}
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Bank</Text>
                    <BankPicker value={bank} onChange={setBank} c={c} styles={styles} />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Account Number (10 digits)</Text>
                    <TextInput
                      style={[styles.fieldInput, styles.fieldInputMono]}
                      value={accountNumber}
                      onChangeText={setAccountNumber}
                      keyboardType="number-pad"
                      maxLength={10}
                      placeholder="NUBAN"
                      placeholderTextColor={c.ghost}
                      returnKeyType="done"
                    />
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Account Name</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={accountName}
                      onChangeText={setAccountName}
                      placeholder="Name on account"
                      placeholderTextColor={c.ghost}
                      returnKeyType="done"
                      autoCapitalize="words"
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.submitBtn, (!formValid || submitting) && styles.submitBtnDisabled]}
                    onPress={handlePayout}
                    disabled={!formValid || submitting}
                    activeOpacity={0.85}
                  >
                    {submitting
                      ? <ActivityIndicator color={c.paper} />
                      : <Text style={styles.submitBtnText}>Request Payout</Text>
                    }
                  </TouchableOpacity>

                  <Text style={styles.footerNote}>
                    Processed within 1–2 business days. Only NGN withdrawals are supported.
                  </Text>
                </>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safeArea:       { flex: 1, backgroundColor: c.paperWarm },
    whiteBlock:     { backgroundColor: c.paper, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 2, shadowColor: c.ink, shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, zIndex: 10 },
    header:         { height: 44, justifyContent: "flex-end", alignItems: "center", position: "relative" },
    backBtn:        { position: "absolute", left: 16, bottom: 8, padding: 4 },
    headerTitle:    { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, paddingBottom: 12 },

    heroBlock:      { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 20, alignItems: "center" },
    heroEyebrow:    { fontFamily: fonts.sansBold, fontSize: 9, color: c.mute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
    heroValue:      { fontFamily: fonts.serifBold, fontSize: 36, color: c.ink, lineHeight: 40 },
    heroSub:        { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.gold, marginTop: 4, textAlign: "center" },

    tabs:           { height: 44, borderTopWidth: 1, borderTopColor: c.ghost + "40", flexDirection: "row", paddingHorizontal: 16, gap: 8 },
    tabBtn:         { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12, position: "relative" },
    tabIndicator:   { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: c.ochre, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
    tabText:        { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    tabTextActive:  { fontFamily: fonts.sansBold, color: c.ink },

    loadingWrap:    { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll:         { flex: 1, backgroundColor: c.paperWarm },
    scrollContent:  { padding: 16, paddingBottom: 40 },

    emptyWrap:      { paddingVertical: 48, alignItems: "center" },
    emptyTitle:     { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, marginBottom: 8 },
    emptyBody:      { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", paddingHorizontal: 24, lineHeight: 20 },

    // Overview stat cards
    statCard:       { backgroundColor: c.paper, borderRadius: 12, padding: 20, marginBottom: 16 },
    statCardTitle:  { fontFamily: fonts.sansBold, fontSize: 13, color: c.mute, marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 },
    statRow:        { flexDirection: "row", alignItems: "stretch" },
    statCell:       { flex: 1, alignItems: "center" },
    statDivider:    { width: 1, backgroundColor: c.ghost + "60", marginVertical: 4 },
    statLabel:      { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginBottom: 6 },
    statValue:      { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink },
    statFooter:     { fontFamily: fonts.sans, fontSize: 11, color: c.ghost, marginTop: 16, textAlign: "center" },

    // History list
    listCard:       { backgroundColor: c.paper, borderRadius: 12, overflow: "hidden", marginBottom: 16 },
    histRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.ghost + "60", gap: 12 },
    histRowLast:    { borderBottomWidth: 0 },
    histIcon:       { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    histIconAvail:  { backgroundColor: c.ochre + "20", borderWidth: 1, borderColor: c.ochre + "40" },
    histIconPaid:   { backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost + "60" },
    histMeta:       { flex: 1, minWidth: 0 },
    histTitle:      { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    histDate:       { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    histRight:      { alignItems: "flex-end" },
    histAmount:     { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre },
    histStatus:     { fontFamily: fonts.mono, fontSize: 10, marginTop: 2 },
    histStatusAvail:{ color: c.ochre },
    histStatusPaid: { color: c.mute },
    moreNote:       { fontFamily: fonts.mono, fontSize: 11, color: c.ghost, textAlign: "center", marginTop: 8 },

    // Payout form
    payoutCard:     { backgroundColor: c.paper, borderRadius: 12, padding: 24 },
    payoutAvail:    { fontFamily: fonts.sansBold, fontSize: 15, color: c.ochre, marginBottom: 20, textAlign: "center" },
    fieldGroup:     { marginBottom: 16 },
    fieldLabel:     { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginBottom: 6, marginLeft: 4 },
    fieldInput:     { height: 48, backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost, borderRadius: 8, paddingHorizontal: 16, fontSize: 15, fontFamily: fonts.sans, color: c.ink },
    fieldInputMono: { fontFamily: fonts.mono, letterSpacing: 2 },

    pickerTrigger:      { height: 48, backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost, borderRadius: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    pickerTriggerText:  { fontFamily: fonts.sans, fontSize: 15, color: c.ink },

    modalSafe:          { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
    modalSheet:         { backgroundColor: c.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 32 },
    modalHeader:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: c.ghost + "40" },
    modalTitle:         { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink },
    modalOption:        { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.ghost + "30", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    modalOptionActive:  { backgroundColor: c.ink },
    modalOptionText:    { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
    modalOptionTextActive: { color: c.paper },

    submitBtn:          { height: 52, backgroundColor: c.ochre, borderRadius: 9999, alignItems: "center", justifyContent: "center", marginTop: 8 },
    submitBtnDisabled:  { opacity: 0.5 },
    submitBtnText:      { fontFamily: fonts.sansBold, fontSize: 16, color: c.paper },
    footerNote:         { fontFamily: fonts.sans, fontSize: 11, color: c.mute, textAlign: "center", marginTop: 12 },
  });
}
