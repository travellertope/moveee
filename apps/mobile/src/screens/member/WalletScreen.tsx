import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Modal,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, PanResponder,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../../auth/authStore";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { LedgerEntry } from "../../types";

type Currency = "GBP" | "USD" | "NGN";
type WalletTab = "history" | "cashout";

const NGN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank", "Fidelity", "First Bank",
  "FCMB", "Globus", "GTBank", "Heritage", "Keystone", "Lotus", "Polaris",
  "Providus", "Stanbic IBTC", "Standard Chartered", "Sterling", "SunTrust",
  "Titan Trust", "Union Bank", "UBA", "Unity", "Wema", "Zenith Bank",
];

const SOURCE_LABELS: Record<string, string> = {
  community_post:     "Community post",
  community_comment:  "Community comment",
  post_validated:     "Post validated",
  perk_redeem:        "Perk redeemed",
  cashout:            "Cash out",
  referral:           "Referral bonus",
  event_rsvp:         "Event RSVP",
  event_checkin:      "Event check-in",
  quote_share:        "Share a quote",
  quote_like:         "Quote liked",
  magazine_read:      "Read magazine",
  magazine_share:     "Share magazine",
  directory_entry:    "Directory entry",
  game_complete:      "Game completed",
  game_completed:     "Game completed",
  newsletter_comment: "Newsletter comment",
  newsletter_reaction:"Newsletter reaction",
  profile_completed:  "Profile completed",
  email_verified:     "Email verified",
  poll_vote:          "Poll vote",
  community_like:     "Community like",
};

function groupByMonth(entries: LedgerEntry[]): { month: string; items: LedgerEntry[] }[] {
  const map = new Map<string, LedgerEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.created_at).toLocaleDateString("en-GB", {
      month: "long", year: "numeric",
    });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return Array.from(map.entries()).map(([month, items]) => ({ month, items }));
}

// Draggable slider — purely native PanResponder, no external libs
function CreditSlider({
  value, max, onChange, c, styles,
}: {
  value: number; max: number; onChange: (v: number) => void;
  c: ColorPalette; styles: ReturnType<typeof createStyles>;
}) {
  const trackRef = useRef<View>(null);
  const trackWidth = useRef(0);

  const clamp = useCallback((v: number) => Math.max(0, Math.min(max, Math.round(v))), [max]);
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        if (trackWidth.current > 0) {
          const raw = e.nativeEvent.locationX / trackWidth.current;
          onChange(clamp(raw * max));
        }
      },
      onPanResponderMove: (e) => {
        if (trackWidth.current > 0) {
          const raw = e.nativeEvent.locationX / trackWidth.current;
          onChange(clamp(raw * max));
        }
      },
    })
  ).current;

  return (
    <View
      style={styles.sliderTrack}
      ref={trackRef}
      onLayout={(ev) => { trackWidth.current = ev.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={[styles.sliderFill, { width: `${pct * 100}%` as any }]} />
      {max > 0 && (
        <View style={[styles.sliderThumb, { left: `${pct * 100}%` as any, marginLeft: -10 }]} />
      )}
    </View>
  );
}

// Modal-based bank picker
function BankPicker({
  value, onChange, c, styles,
}: {
  value: string; onChange: (b: string) => void;
  c: ColorPalette; styles: ReturnType<typeof createStyles>;
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
          {value || "Select bank…"}
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
                  key={b}
                  style={[styles.modalOption, value === b && styles.modalOptionActive]}
                  onPress={() => { onChange(b); setOpen(false); }}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalOptionText, value === b && styles.modalOptionTextActive]}>
                    {b}
                  </Text>
                  {value === b && <Ionicons name="checkmark" size={16} color={c.paper} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default function WalletScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore() as any;
  const isPro = user?.tier === "patron";
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<WalletTab>("history");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [creditsPerGbp, setCreditsPerGbp] = useState(200);
  const [balance, setBalance] = useState(user?.credits ?? 0);

  // Cashout form
  const [cashoutCredits, setCashoutCreditsRaw] = useState(0);
  const [currency, setCurrency] = useState<Currency>(() => {
    const c = (user?.countryOfResidence ?? "").toLowerCase();
    if (/nigeria|ng\b/.test(c)) return "NGN";
    if (/united states|usa|\bus\b/.test(c)) return "USD";
    return "GBP";
  });
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { updateUser } = useAuthStore() as any;

  useEffect(() => {
    async function load() {
      try {
        const balRes = await api.get<{ credits: number; credits_per_gbp: number }>(
          `${MOBILE_API}/wallet/balance`
        );
        setBalance(balRes.credits);
        setCreditsPerGbp(balRes.credits_per_gbp ?? 200);
        if (updateUser) updateUser({ credits: balRes.credits });
      } catch {}
      try {
        const histRes = await api.get<{ entries: LedgerEntry[] }>(`${MOBILE_API}/wallet/history`);
        setEntries(histRes.entries ?? []);
      } catch {} finally {
        setLoadingHistory(false);
      }
    }
    load();
  }, []);

  const FEE = 0.40;
  const feeCredits = cashoutCredits > 0 ? Math.round(cashoutCredits * FEE) : 0;
  const netCredits = cashoutCredits - feeCredits;
  const payout    = creditsPerGbp > 0 ? (netCredits / creditsPerGbp).toFixed(2) : "0.00";
  const currencySymbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "₦";

  const cashoutValid =
    cashoutCredits >= 100 && accountName && accountNumber &&
    (currency !== "GBP" || sortCode) &&
    (currency !== "USD" || (bankName && routingNumber)) &&
    (currency !== "NGN" || bankName);

  const handleCashout = async () => {
    if (!cashoutValid) return;
    Alert.alert(
      "Confirm cashout",
      `You'll receive ${currencySymbol}${payout} after a 40% fee. This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: async () => {
            setSubmitting(true);
            try {
              const body: Record<string, unknown> = {
                credits: cashoutCredits, currency,
                account_name: accountName, account_number: accountNumber,
              };
              if (currency === "GBP") body.sort_code = sortCode;
              if (currency === "USD") { body.routing_number = routingNumber; body.bank_name = bankName; }
              if (currency === "NGN") body.bank_name = bankName;
              await api.post(`${MOBILE_API}/wallet/cashout`, body);
              Alert.alert("Requested", "Your cashout request has been submitted for review.");
              setCashoutCreditsRaw(0);
              const balRes = await api.get<{ credits: number; credits_per_gbp: number }>(
                `${MOBILE_API}/wallet/balance`
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

  const grouped = groupByMonth(entries);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* White top block */}
      <View style={styles.whiteBlock}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Wallet</Text>
        </View>

        <View style={styles.balanceHero}>
          <TouchableOpacity
            onPress={() => Alert.alert(
              "Culture Points",
              "Culture Points (Credits) are your spendable currency. Earn them by posting, engaging, and participating in the community. Redeem for partner perks, or cash out to real money (Connect Pro only, 40% fee). Daily cap: 50 credits.",
              [{ text: "Got it" }]
            )}
            style={styles.eyebrowBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.balanceEyebrow}>CULTURE POINTS  ⓘ</Text>
          </TouchableOpacity>
          <Text style={styles.balanceValue}>{balance}</Text>
          <Text style={styles.balanceGbp}>
            ≈ £{creditsPerGbp > 0 ? (balance / creditsPerGbp).toFixed(2) : "0.00"} GBP
          </Text>
          <View style={styles.statsRow}>
            <TouchableOpacity
              onPress={() => Alert.alert(
                "Reputation",
                "Reputation is your permanent standing in the Moveee community — it never decreases. Quality contributions (posts, comments, directory entries) earn reputation. Tiers: Culture Contributor (500), Taste Maker (2,500), Culture Authority (10,000), Culture Icon (25,000 + nomination).",
                [{ text: "Got it" }]
              )}
              activeOpacity={0.7}
            >
              <Text style={styles.statText}>{user?.reputation ?? 0} REP ⓘ</Text>
            </TouchableOpacity>
            <View style={styles.statDot} />
            <Text style={styles.statText}>{user?.dailyCreditsRemaining ?? 0} CR today</Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {(["history", ...(isPro ? ["cashout"] : [])] as WalletTab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={styles.tabBtn}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              {tab === t && <View style={styles.tabIndicator} />}
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === "history" ? "History" : "Cash Out"}
              </Text>
            </TouchableOpacity>
          ))}
          {!isPro && (
            <TouchableOpacity
              style={styles.tabBtn}
              onPress={() => nav.navigate("Membership")}
              activeOpacity={0.7}
            >
              <Text style={styles.tabTextLocked}>Cash Out 🔒</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {tab === "history" ? (
        loadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.gold} />
          </View>
        ) : (
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>
            {entries.length === 0 ? (
              <Text style={styles.emptyText}>No transactions yet.</Text>
            ) : (
              <View style={[styles.historyCard, shadows.card]}>
                {grouped.map((group, gi) => (
                  <View key={group.month}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthLabel}>{group.month.toUpperCase()}</Text>
                    </View>
                    {group.items.map((entry, idx) => {
                      const isPositive = entry.amount > 0;
                      const isLast = gi === grouped.length - 1 && idx === group.items.length - 1;
                      const shortDate = new Date(entry.created_at).toLocaleDateString("en-GB", { month: "short", day: "numeric" });
                      return (
                        <View key={entry.id} style={[styles.ledgerRow, isLast && styles.ledgerRowLast]}>
                          <View style={styles.ledgerLeft}>
                            <View style={[styles.iconCircle, isPositive ? styles.iconCirclePos : styles.iconCircleNeg]}>
                              <Ionicons name={isPositive ? "arrow-up" : "arrow-down"} size={16} color={isPositive ? c.paper : c.ink} />
                            </View>
                            <View>
                              <Text style={styles.ledgerSource}>{SOURCE_LABELS[entry.source] ?? entry.source}</Text>
                              <Text style={styles.ledgerDate}>{shortDate}</Text>
                            </View>
                          </View>
                          <Text style={[styles.ledgerAmount, isPositive ? styles.amountPos : styles.amountNeg]}>
                            {isPositive ? `+${entry.amount} CR` : `–${Math.abs(entry.amount)} CR`}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )
      ) : (
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.cashoutContent} showsVerticalScrollIndicator={false}>
          <View style={[styles.cashoutCard, shadows.card]}>
            <Text style={styles.cashoutLabel}>Credits to cash out</Text>
            <Text style={styles.cashoutAmount}>{cashoutCredits}</Text>

            <CreditSlider
              value={cashoutCredits}
              max={balance}
              onChange={setCashoutCreditsRaw}
              c={c}
              styles={styles}
            />
            <Text style={styles.sliderHint}>Drag or type below · Min 100 · Max {balance}</Text>

            <TextInput
              style={styles.creditsInput}
              value={cashoutCredits > 0 ? String(cashoutCredits) : ""}
              onChangeText={(t) => {
                const n = parseInt(t, 10);
                setCashoutCreditsRaw(isNaN(n) ? 0 : Math.min(n, balance));
              }}
              keyboardType="number-pad"
              placeholder="Or enter credits"
              placeholderTextColor={c.ghost}
            />

            <View style={styles.feeCard}>
              <Text style={styles.feeTitle}>40% processing fee</Text>
              <Text style={styles.feeReceive}>You receive: {netCredits} CR equivalent</Text>
              <Text style={styles.feePayout}>≈ {currencySymbol}{payout} {currency}</Text>
            </View>

            <View style={styles.currencyControl}>
              {(["GBP", "USD", "NGN"] as Currency[]).map((cur) => (
                <TouchableOpacity
                  key={cur}
                  style={[styles.currencyOption, currency === cur && styles.currencyOptionActive]}
                  onPress={() => { setCurrency(cur); setBankName(""); }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.currencyOptionText, currency === cur && styles.currencyOptionTextActive]}>
                    {cur}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.formFields}>
              <View>
                <Text style={styles.fieldLabel}>Account Name</Text>
                <TextInput style={styles.fieldInput} value={accountName} onChangeText={setAccountName} placeholderTextColor={c.ghost} />
              </View>

              {currency === "GBP" && (
                <View>
                  <Text style={styles.fieldLabel}>Sort Code</Text>
                  <TextInput style={[styles.fieldInput, styles.fieldInputMono]} value={sortCode} onChangeText={setSortCode} keyboardType="number-pad" placeholder="00-00-00" placeholderTextColor={c.ghost} />
                </View>
              )}

              {currency === "USD" && (
                <>
                  <View>
                    <Text style={styles.fieldLabel}>Bank Name</Text>
                    <TextInput style={styles.fieldInput} value={bankName} onChangeText={setBankName} placeholderTextColor={c.ghost} />
                  </View>
                  <View>
                    <Text style={styles.fieldLabel}>Routing Number</Text>
                    <TextInput style={[styles.fieldInput, styles.fieldInputMono]} value={routingNumber} onChangeText={setRoutingNumber} keyboardType="number-pad" placeholderTextColor={c.ghost} />
                  </View>
                </>
              )}

              {currency === "NGN" && (
                <View>
                  <Text style={styles.fieldLabel}>Bank Name</Text>
                  <BankPicker value={bankName} onChange={setBankName} c={c} styles={styles} />
                </View>
              )}

              <View>
                <Text style={styles.fieldLabel}>Account Number</Text>
                <TextInput style={[styles.fieldInput, styles.fieldInputMono]} value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" placeholderTextColor={c.ghost} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, (!cashoutValid || submitting) && styles.submitBtnDisabled]}
              onPress={handleCashout}
              disabled={!cashoutValid || submitting}
              activeOpacity={0.85}
            >
              {submitting ? <ActivityIndicator color={c.paper} /> : <Text style={styles.submitBtnText}>Request Cash Out</Text>}
            </TouchableOpacity>

            <Text style={styles.footerNote}>
              Processed within 5 business days. 40% fee applies.
            </Text>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
  safeArea:        { flex: 1, backgroundColor: c.paperWarm },
  whiteBlock:      { backgroundColor: c.paper, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, elevation: 2, shadowColor: c.ink, shadowOpacity: 0.03, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, zIndex: 10 },
  header:          { height: 44, justifyContent: "flex-end", alignItems: "center", position: "relative" },
  backBtn:         { position: "absolute", left: 16, bottom: 8, padding: 4 },
  headerTitle:     { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, alignSelf: "flex-end", paddingBottom: 12 },

  balanceHero:     { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24, alignItems: "center" },
  eyebrowBtn:      { alignSelf: "center" },
  balanceEyebrow:  { fontFamily: fonts.sansBold, fontSize: 9, color: c.mute, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  balanceValue:    { fontFamily: fonts.serifBold, fontSize: 48, color: c.ink, lineHeight: 48 },
  balanceGbp:      { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.gold, marginTop: 4 },
  statsRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24 },
  statText:        { fontFamily: fonts.mono, fontSize: 12, color: c.mute },
  statDot:         { width: 4, height: 4, borderRadius: 2, backgroundColor: c.ghost },

  tabs:            { height: 44, borderTopWidth: 1, borderTopColor: c.ghost + "40", flexDirection: "row", paddingHorizontal: 16, gap: 24 },
  tabBtn:          { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 12, position: "relative" },
  tabIndicator:    { position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: c.ochre, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  tabText:         { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
  tabTextActive:   { fontFamily: fonts.sansBold, color: c.ink },
  tabTextLocked:   { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ghost },

  scrollArea:      { flex: 1, backgroundColor: c.paperWarm },
  loadingContainer:{ flex: 1, justifyContent: "center", alignItems: "center" },

  historyContent:  { padding: 16, paddingBottom: 40 },
  historyCard:     { backgroundColor: c.paper, borderRadius: 12, overflow: "hidden" },
  monthHeader:     { backgroundColor: c.paperDeep, height: 32, paddingHorizontal: 16, justifyContent: "center" },
  monthLabel:      { fontFamily: fonts.monoBold, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 1 },
  ledgerRow:       { height: 64, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c.ghost + "80", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  ledgerRowLast:   { borderBottomWidth: 0 },
  ledgerLeft:      { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle:      { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  iconCirclePos:   { backgroundColor: c.ochre },
  iconCircleNeg:   { backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost + "80" },
  ledgerSource:    { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink, lineHeight: 18 },
  ledgerDate:      { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
  ledgerAmount:    { fontFamily: fonts.sansBold, fontSize: fontSize.base },
  amountPos:       { color: c.ochre },
  amountNeg:       { color: c.error },
  emptyText:       { fontFamily: fonts.mono, fontSize: 12, color: c.mute, textAlign: "center", marginTop: 40 },

  cashoutContent:  { padding: 16, paddingBottom: 40 },
  cashoutCard:     { backgroundColor: c.paper, borderRadius: 12, padding: 24, alignItems: "center" },
  cashoutLabel:    { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginBottom: 8 },
  cashoutAmount:   { fontFamily: fonts.serifBold, fontSize: 32, color: c.ink, marginBottom: 16 },

  sliderTrack:     { height: 8, backgroundColor: c.ghost, borderRadius: 4, width: "100%", marginBottom: 8, position: "relative" },
  sliderFill:      { position: "absolute", left: 0, top: 0, height: 8, backgroundColor: c.ochre, borderRadius: 4 },
  sliderThumb:     { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: c.ochre, borderWidth: 2, borderColor: c.paper, top: -6 },
  sliderHint:      { fontFamily: fonts.mono, fontSize: 10, color: c.mute, marginBottom: 12, alignSelf: "flex-start" },

  creditsInput:    { width: "100%", height: 48, borderWidth: 1, borderColor: c.ghost, borderRadius: 8, paddingHorizontal: 16, fontFamily: fonts.sans, fontSize: 15, color: c.ink, backgroundColor: c.paper },

  feeCard:         { width: "100%", backgroundColor: c.paperDeep, borderRadius: 8, padding: 16, marginTop: 16, alignItems: "center", borderWidth: 1, borderColor: c.ghost + "30" },
  feeTitle:        { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
  feeReceive:      { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, marginTop: 8 },
  feePayout:       { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.gold, marginTop: 2 },

  currencyControl:     { width: "100%", flexDirection: "row", marginTop: 24, backgroundColor: c.paper, borderRadius: 8, padding: 4, borderWidth: 1, borderColor: c.ghost },
  currencyOption:      { flex: 1, height: 36, borderRadius: 6, justifyContent: "center", alignItems: "center" },
  currencyOptionActive:{ backgroundColor: c.ink },
  currencyOptionText:  { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
  currencyOptionTextActive: { fontFamily: fonts.sansBold, color: c.paper },

  formFields:      { width: "100%", marginTop: 24, gap: 16 },
  fieldLabel:      { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginBottom: 4, marginLeft: 4 },
  fieldInput:      { height: 48, backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost, borderRadius: 8, paddingHorizontal: 16, fontSize: 15, fontFamily: fonts.sans, color: c.ink },
  fieldInputMono:  { fontFamily: fonts.mono, letterSpacing: 2 },

  // Bank picker modal
  pickerTrigger:       { height: 48, backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost, borderRadius: 8, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pickerTriggerText:   { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
  modalSafe:           { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalSheet:          { backgroundColor: c.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "75%", paddingBottom: 32 },
  modalHeader:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: c.ghost + "40" },
  modalTitle:          { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink },
  modalOption:         { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.ghost + "30", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalOptionActive:   { backgroundColor: c.ink },
  modalOptionText:     { fontFamily: fonts.sans, fontSize: 15, color: c.ink },
  modalOptionTextActive: { color: c.paper },

  submitBtn:           { width: "100%", height: 52, backgroundColor: c.ochre, borderRadius: 9999, alignItems: "center", justifyContent: "center", marginTop: 24 },
  submitBtnDisabled:   { opacity: 0.5 },
  submitBtnText:       { fontFamily: fonts.sansBold, fontSize: 16, color: c.paper },
  footerNote:          { fontFamily: fonts.sans, fontSize: 11, color: c.mute, textAlign: "center", marginTop: 12 },
  });
}
