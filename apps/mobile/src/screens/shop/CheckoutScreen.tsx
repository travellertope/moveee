import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { WebView } from "react-native-webview";
import { useNav } from "../../hooks/useNav";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../auth/authStore";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { api, MOBILE_API } from "../../api/client";

// WooCommerce/gateway redirect paths that signal payment completion
const PAYMENT_DONE_PATTERNS = ["order-received", "checkout/thank-you", "checkout/success"];

interface ShippingRate {
  id: string;
  label: string;
  cost: number;
}

interface ShippingOption {
  packageKey: string;
  rates: ShippingRate[];
}

interface TotalsResponse {
  quoteToken: string;
  expiresInSeconds: number;
  shippingAvailable: boolean;
  shippingOptions: ShippingOption[];
  display: {
    currency: string;
    currencySymbol: string;
    subtotal: string;
    discount: string;
    shipping: string;
    tax: string;
    total: string;
  };
}

interface PayResponse {
  url: string;
  reference: string;
  gateway: "paystack" | "stripe";
}

interface OrderStatusResponse {
  status: string;
  id?: number;
  total?: number;
  currency?: string;
}

type Step = "address" | "review" | "paying";

export default function CheckoutScreen() {
  const nav = useNav();
  const { params } = useRoute<any>();
  const couponCode: string | undefined = params?.couponCode;
  const { user } = useAuthStore();
  const { items, clearCart } = useCartStore();
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const [step, setStep] = useState<Step>("address");
  const [name, setName] = useState(user?.displayName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address1, setAddress1] = useState("");
  const [city, setCity] = useState(user?.city ?? "");
  const [state, setState] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState(user?.countryOfResidence ?? "");

  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [totals, setTotals] = useState<TotalsResponse | null>(null);

  const [paying, setPaying] = useState(false);
  const [payReference, setPayReference] = useState<string | null>(null);
  const [payUrl, setPayUrl] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const canSubmitAddress = !!(address1.trim() && city.trim() && country.trim() && name.trim() && email.trim());

  const handleGetTotals = async () => {
    if (!canSubmitAddress) return;
    setQuoting(true);
    setQuoteError("");
    try {
      const countryParam = country ? `?country=${encodeURIComponent(country)}` : "";
      const res = await api.post<TotalsResponse>(
        `${MOBILE_API}/checkout/totals${countryParam}`,
        {
          cart_items: items.map((i) => ({ id: i.productId, variation_id: i.variationId, qty: i.qty })),
          country,
          state,
          city,
          postcode,
          address_1: address1,
          coupon_code: couponCode,
        },
      );
      setTotals(res);
      setStep("review");
    } catch (e: any) {
      setQuoteError(e?.message || "Could not calculate totals — please check your address.");
    } finally {
      setQuoting(false);
    }
  };

  const checkOrderOnce = async (reference: string) => {
    try {
      const order = await api.get<OrderStatusResponse>(
        `${MOBILE_API}/checkout/order-by-reference/${reference}`,
      );
      if (order.status && order.status !== "pending") {
        if (pollRef.current) clearInterval(pollRef.current);
        clearCart();
        nav.navigate("OrderConfirmation", {
          orderId: `#${order.id}`,
          total: `${totals?.display.currencySymbol ?? "£"}${totals?.display.total ?? ""}`,
          itemCount: items.reduce((sum, i) => sum + i.qty, 0),
        });
        return true;
      }
    } catch {
      // keep polling — order may not exist yet if webhook is delayed
    }
    return false;
  };

  const startPolling = (reference: string) => {
    setPayReference(reference);
    setPayUrl(null);
    setStep("paying");
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const done = await checkOrderOnce(reference);
      if (done) return;
      if (attempts >= 40) {
        // ~2 minutes at 3s intervals
        if (pollRef.current) clearInterval(pollRef.current);
        Alert.alert(
          "Still processing",
          "Your payment is taking longer than expected to confirm. We'll email you once it's complete.",
        );
        setStep("review");
      }
    }, 3000);
  };

  const handlePay = async () => {
    if (!totals) return;
    setPaying(true);
    try {
      const countryParam = country ? `?country=${encodeURIComponent(country)}` : "";
      const res = await api.post<PayResponse>(`${MOBILE_API}/checkout/pay${countryParam}`, {
        quote_token: totals.quoteToken,
        name,
        email,
        phone,
      });
      setPayUrl(res.url);
      setPayReference(res.reference);
    } catch (e: any) {
      Alert.alert("Payment failed to start", e?.message || "Please try again.");
    } finally {
      setPaying(false);
    }
  };

  const handleWebViewNavChange = (navState: { url: string }) => {
    const url = navState.url || "";
    if (PAYMENT_DONE_PATTERNS.some((p) => url.includes(p)) && payReference) {
      setPayUrl(null);
      startPolling(payReference);
    }
  };

  const handleCloseWebView = () => {
    setPayUrl(null);
    if (payReference) checkOrderOnce(payReference);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[s.safe, { backgroundColor: c.paperWarm }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={s.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={c.ink} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Checkout</Text>
          <View style={s.headerBtn} />
        </View>
        <View style={s.center}>
          <Text style={s.emptyText}>Your bag is empty.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.paperWarm }]}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => (step === "address" ? nav.goBack() : setStep("address"))}
          style={s.headerBtn}
        >
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Checkout</Text>
        <View style={s.headerBtn} />
      </View>

      {step === "paying" ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={c.gold} />
          <Text style={s.payingHeading}>Confirming your payment…</Text>
          <Text style={s.payingSub}>
            This usually takes a few seconds. Don't close the app.
          </Text>
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
          {step === "address" ? (
            <>
              <Text style={s.sectionTitle}>Contact</Text>
              <TextInput style={s.input} placeholder="Full name" placeholderTextColor={c.ghost} value={name} onChangeText={setName} />
              <TextInput style={s.input} placeholder="Email" placeholderTextColor={c.ghost} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              <TextInput style={s.input} placeholder="Phone" placeholderTextColor={c.ghost} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

              <Text style={s.sectionTitle}>Delivery address</Text>
              <TextInput style={s.input} placeholder="Address" placeholderTextColor={c.ghost} value={address1} onChangeText={setAddress1} />
              <TextInput style={s.input} placeholder="City" placeholderTextColor={c.ghost} value={city} onChangeText={setCity} />
              <TextInput style={s.input} placeholder="State / Region (optional)" placeholderTextColor={c.ghost} value={state} onChangeText={setState} />
              <TextInput style={s.input} placeholder="Postcode (optional)" placeholderTextColor={c.ghost} value={postcode} onChangeText={setPostcode} />
              <TextInput style={s.input} placeholder="Country" placeholderTextColor={c.ghost} value={country} onChangeText={setCountry} />

              {quoteError ? <Text style={s.errorText}>{quoteError}</Text> : null}

              <TouchableOpacity
                style={[s.primaryBtn, !canSubmitAddress && s.primaryBtnDisabled]}
                disabled={!canSubmitAddress || quoting}
                onPress={handleGetTotals}
              >
                {quoting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={s.primaryBtnText}>Continue to review</Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={s.sectionTitle}>Deliver to</Text>
              <View style={s.addressCard}>
                <Text style={s.addressLine}>{name}</Text>
                <Text style={s.addressLine}>{address1}</Text>
                <Text style={s.addressLine}>
                  {[city, state, postcode].filter(Boolean).join(", ")}
                </Text>
                <Text style={s.addressLine}>{country}</Text>
              </View>

              <Text style={s.sectionTitle}>Order summary</Text>
              <View style={s.summaryCard}>
                {items.map((item) => (
                  <View key={item.id} style={s.summaryRow}>
                    <Text style={s.summaryLabel} numberOfLines={1}>
                      {item.qty} × {item.title}
                    </Text>
                    <Text style={s.summaryValue}>
                      {totals?.display.currencySymbol}
                      {(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                ))}
                <View style={s.summaryDivider} />
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Subtotal</Text>
                  <Text style={s.summaryValue}>{totals?.display.currencySymbol}{totals?.display.subtotal}</Text>
                </View>
                {totals && parseFloat(totals.display.discount) > 0 ? (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Discount</Text>
                    <Text style={[s.summaryValue, { color: c.gold }]}>-{totals.display.currencySymbol}{totals.display.discount}</Text>
                  </View>
                ) : null}
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Shipping</Text>
                  <Text style={s.summaryValue}>
                    {totals?.shippingAvailable
                      ? `${totals.display.currencySymbol}${totals.display.shipping}`
                      : "Not available to this address"}
                  </Text>
                </View>
                {totals && parseFloat(totals.display.tax) > 0 ? (
                  <View style={s.summaryRow}>
                    <Text style={s.summaryLabel}>Tax</Text>
                    <Text style={s.summaryValue}>{totals.display.currencySymbol}{totals.display.tax}</Text>
                  </View>
                ) : null}
                <View style={s.summaryDivider} />
                <View style={s.summaryRow}>
                  <Text style={s.totalLabel}>Total</Text>
                  <Text style={s.totalValue}>{totals?.display.currencySymbol}{totals?.display.total}</Text>
                </View>
              </View>

              {!totals?.shippingAvailable ? (
                <Text style={s.errorText}>
                  We can't currently ship to this address. Please check the details or try a different address.
                </Text>
              ) : null}

              <TouchableOpacity
                style={[s.primaryBtn, (!totals?.shippingAvailable || paying) && s.primaryBtnDisabled]}
                disabled={!totals?.shippingAvailable || paying}
                onPress={handlePay}
              >
                {paying ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Pay {totals?.display.currencySymbol}{totals?.display.total}</Text>}
              </TouchableOpacity>
              <Text style={s.secureNote}>🔒 Secure payment · Paystack / Stripe</Text>
            </>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      <Modal visible={!!payUrl} animationType="slide" onRequestClose={handleCloseWebView}>
        <SafeAreaView style={[s.safe, { backgroundColor: c.paper }]}>
          <View style={s.header}>
            <TouchableOpacity onPress={handleCloseWebView} style={s.headerBtn}>
              <Ionicons name="close" size={24} color={c.ink} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Secure payment</Text>
            <View style={s.headerBtn} />
          </View>
          {payUrl ? (
            <WebView
              source={{ uri: payUrl }}
              onNavigationStateChange={handleWebViewNavChange}
              startInLoadingState
              renderLoading={() => (
                <View style={s.center}>
                  <ActivityIndicator size="large" color={c.gold} />
                </View>
              )}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1 },
    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      paddingHorizontal: space[4],
      ...shadows.card,
    },
    headerBtn: { width: 44, alignItems: "center" },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
    },
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6], gap: 8 },
    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },
    payingHeading: { fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginTop: 16 },
    payingSub: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center", maxWidth: 260 },

    scroll: { flex: 1 },
    scrollContent: { padding: space[4] },

    sectionTitle: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      height: 48,
      backgroundColor: c.paper,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.ghost,
      paddingHorizontal: 14,
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      marginBottom: 10,
    },
    errorText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: "#C5491F",
      marginTop: 4,
      marginBottom: 8,
    },

    addressCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: 14,
      gap: 2,
      ...shadows.card,
    },
    addressLine: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink },

    summaryCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: 16,
      ...shadows.card,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
      height: 32,
    },
    summaryLabel: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    summaryValue: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink },
    summaryDivider: { height: 1, backgroundColor: c.ghost, marginVertical: 8 },
    totalLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    totalValue: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },

    primaryBtn: {
      height: 56,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
      ...shadows.fab,
    },
    primaryBtnDisabled: { opacity: 0.5 },
    primaryBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
    secureNote: {
      textAlign: "center",
      fontFamily: fonts.sans,
      fontSize: 11,
      color: c.mute,
      marginTop: 10,
    },
  });
}
