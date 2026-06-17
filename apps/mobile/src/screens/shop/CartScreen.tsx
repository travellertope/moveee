import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../auth/authStore";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { openInApp } from "../../utils/openInApp";
import { api, MOBILE_API } from "../../api/client";

// WooCommerce checkout lives on the CMS (WordPress) host
const CHECKOUT_BASE = "https://cms.themoveee.com/checkout";

const PRO_DISCOUNT_RATE = 0.10;

export default function CartScreen() {
  const nav = useNav();
  const { user } = useAuthStore();
  const { items, removeItem, updateQty, clearCart } = useCartStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [voucher, setVoucher]         = useState("");
  const [appliedVoucher, setApplied]   = useState("");
  const [couponDiscount, setCouponDisc] = useState(0);   // real discount from API
  const [couponError, setCouponError]   = useState("");
  const [validating, setValidating]     = useState(false);
  const [editing, setEditing]           = useState(false);
  const [view, setView]                 = useState<"cart" | "checkout">("cart");
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isPatron    = user?.tier === "patron";
  const subtotal    = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const proDiscount = isPatron ? subtotal * PRO_DISCOUNT_RATE : 0;
  const total       = subtotal - proDiscount - couponDiscount;
  const totalQty  = items.reduce((sum, i) => sum + i.qty, 0);

  useEffect(() => {
    if (view !== "checkout") return;

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: false,
    }).start(async () => {
      try {
        // Build checkout path — append coupon if the user has one applied
        let redirectPath = "/checkout";
        if (appliedVoucher) {
          redirectPath += `?coupon_code=${encodeURIComponent(appliedVoucher)}`;
        }

        // Exchange the user's JWT for a one-time token so the in-app browser
        // lands on checkout already logged in with cart items pre-populated.
        const { url } = await api.post<{ url: string }>(
          `${MOBILE_API}/checkout-token`,
          {
            redirect_to: redirectPath,
            cart_items: items.map((i) => ({ id: i.id, qty: i.qty })),
          },
        );
        await openInApp(url);
      } catch {
        // Fallback: open checkout directly without auto-login
        let checkoutUrl = CHECKOUT_BASE;
        if (appliedVoucher) {
          checkoutUrl += `?coupon_code=${encodeURIComponent(appliedVoucher)}`;
        }
        await openInApp(checkoutUrl);
      } finally {
        setView("cart");
      }
    });
  }, [view]);

  const handleApplyVoucher = async () => {
    const code = voucher.trim().toUpperCase();
    if (!code) return;
    setCouponError("");
    setValidating(true);
    try {
      const res = await api.post<{
        valid: boolean;
        code: string;
        discount_type: string;
        discount_amount: number;
        discount_value: number;
        description: string;
      }>(`${MOBILE_API}/validate-coupon`, { code, subtotal });
      setApplied(res.code);
      setCouponDisc(res.discount_value);
      setVoucher("");
    } catch (e: any) {
      const msg = e?.message || "Invalid promo code.";
      setCouponError(msg);
    } finally {
      setValidating(false);
    }
  };

  const handleRemoveVoucher = () => {
    setApplied("");
    setCouponDisc(0);
    setCouponError("");
  };

  const handleCheckout = () => {
    setView("checkout");
  };

  // ── Checkout loading screen ───────────────────────────────────────────────
  if (view === "checkout") {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.paper }]}>
        <View style={styles.checkoutContainer}>
          <Image
            source={require("../../../assets/logo.png")}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            resizeMode="contain"
          />
          <Text style={styles.checkoutHeading}>Taking you to secure checkout...</Text>
          <Text style={styles.checkoutSub}>
            You'll complete your purchase in our secure payment partner.
          </Text>

          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>

          {appliedVoucher ? (
            <View style={styles.voucherAppliedBadge}>
              <Ionicons name="pricetag" size={12} color={c.gold} />
              <Text style={styles.voucherAppliedText}>Code "{appliedVoucher}" will be applied</Text>
            </View>
          ) : null}

          <View style={styles.badgeRow}>
            {[
              { icon: "lock-closed-outline", label: "SSL Secure" },
              { icon: "card-outline", label: "Visa · Mastercard · PayPal" },
              { icon: "return-down-back-outline", label: "Free Returns" },
            ].map((b) => (
              <View key={b.label} style={styles.badge}>
                <Ionicons name={b.icon as any} size={12} color={c.mute} />
                <Text style={styles.badgeText}>{b.label}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity onPress={() => setView("cart")}>
            <Text style={styles.cancelLink}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Empty cart ────────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: c.paperWarm }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={22} color={c.ink} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Bag</Text>
          <View style={styles.headerBtn} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={72} color={c.ghost} />
          <Text style={styles.emptyHeading}>Your bag is empty.</Text>
          <Text style={styles.emptySub}>Find something beautiful in the Lifestyle shop.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => nav.navigate("ShopHome")}>
            <Text style={styles.browseBtnText}>Browse the shop →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.navigate("TheEdit")}>
            <Text style={styles.editLink}>Or explore curated picks →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Cart ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.paperWarm }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Bag</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setEditing((v) => !v)}
        >
          <Text style={styles.editText}>{editing ? "Done" : "Edit"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            {editing && (
              <TouchableOpacity
                style={styles.deleteCircle}
                onPress={() => removeItem(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="remove-circle" size={24} color="#C5491F" />
              </TouchableOpacity>
            )}
            <View style={styles.itemImageBox}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.imagePlaceholder]} />
              )}
            </View>
            <View style={styles.itemContent}>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              {item.variant ? (
                <Text style={styles.itemVariant}>{item.variant}</Text>
              ) : null}
              <View style={styles.itemFooter}>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, item.qty <= 1 && styles.qtyBtnDisabled]}
                    onPress={() => updateQty(item.id, item.qty - 1)}
                    disabled={item.qty <= 1}
                  >
                    <Ionicons name="remove" size={14} color={item.qty <= 1 ? c.ghost : c.ink} />
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.id, item.qty + 1)}
                  >
                    <Ionicons name="add" size={14} color={c.ink} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Text style={styles.removeLink}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.itemPrice}>£{(item.price * item.qty).toFixed(2)}</Text>
          </View>
        ))}

        {/* Voucher / Promo */}
        <View style={styles.voucherCard}>
          <Ionicons name="pricetag-outline" size={20} color={appliedVoucher ? c.gold : c.mute} />
          <TextInput
            style={styles.voucherInput}
            placeholder={appliedVoucher ? `Applied: ${appliedVoucher}` : "Add promo code"}
            placeholderTextColor={appliedVoucher ? c.gold : c.ghost}
            value={voucher}
            onChangeText={(t) => { setVoucher(t); setCouponError(""); }}
            autoCapitalize="characters"
            returnKeyType="done"
            onSubmitEditing={handleApplyVoucher}
            editable={!appliedVoucher && !validating}
          />
          {appliedVoucher ? (
            <TouchableOpacity onPress={handleRemoveVoucher}>
              <Text style={styles.removeVoucherBtn}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleApplyVoucher} disabled={!voucher.trim() || validating}>
              <Text style={[styles.applyBtn, (!voucher.trim() || validating) && { opacity: 0.4 }]}>
                {validating ? "…" : "Apply"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {couponError ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: fontSize.tiny, color: "#C5491F", paddingHorizontal: space[4], marginBottom: space[2] }}>
            {couponError}
          </Text>
        ) : null}

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal ({totalQty} items)</Text>
            <Text style={styles.summaryValue}>£{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: c.mute }]}>Calculated at checkout</Text>
          </View>
          {isPatron && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pro member discount</Text>
              <Text style={[styles.summaryValue, { color: c.gold }]}>–£{proDiscount.toFixed(2)}</Text>
            </View>
          )}
          {appliedVoucher ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Promo code "{appliedVoucher}"</Text>
              <Text style={[styles.summaryValue, { color: c.gold }]}>Applied at checkout</Text>
            </View>
          ) : null}
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Estimated total</Text>
            <Text style={styles.totalValue}>£{total.toFixed(2)}</Text>
          </View>
          <Text style={styles.taxNote}>Taxes included</Text>
        </View>

        {/* Pro savings strip */}
        {!isPatron && subtotal > 0 && (
          <TouchableOpacity
            style={styles.proStrip}
            onPress={() => nav.navigate("Connect", { screen: "Membership" } as any)}
          >
            <Text style={styles.proStripText}>
              ★ Pro members save £{(subtotal * PRO_DISCOUNT_RATE).toFixed(2)} on this order
            </Text>
            <Text style={styles.proStripCta}>UPGRADE →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        </TouchableOpacity>
        <Text style={styles.secureNote}>🔒 Secure checkout · Powered by Moveee</Text>
      </View>
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
    editText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: "#C5491F" },

    scroll: { flex: 1 },
    scrollContent: { padding: space[4], gap: 12 },

    itemCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
      ...shadows.card,
    },
    deleteCircle: { marginRight: -4 },
    itemImageBox: {},
    itemImage: { width: 80, height: 80, borderRadius: 8 },
    imagePlaceholder: { backgroundColor: c.ghost + "60" },
    itemContent: { flex: 1, gap: 4 },
    itemBrand: {
      fontFamily: fonts.monoBold,
      fontSize: 9,
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    itemTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
    itemVariant: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: c.mute },
    itemFooter: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
    qtyRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: radius.full,
      overflow: "hidden",
    },
    qtyBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
    qtyBtnDisabled: { opacity: 0.4 },
    qtyNum: {
      width: 24,
      textAlign: "center",
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    removeLink: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: "#C5491F" },
    itemPrice: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink, alignSelf: "flex-start" },

    voucherCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      ...shadows.card,
    },
    voucherInput: {
      flex: 1,
      height: 40,
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: 8,
      paddingHorizontal: 12,
    },
    applyBtn: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: "#C5491F" },
    removeVoucherBtn: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },

    summaryCard: {
      backgroundColor: c.paperWarm,
      borderRadius: 12,
      padding: 16,
    },
    summaryRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      height: 40,
    },
    summaryLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    summaryValue: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink },
    summaryDivider: { height: 1, backgroundColor: c.ghost, marginVertical: 8 },
    totalLabel: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    totalValue: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    taxNote: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.mute, marginTop: 4 },

    proStrip: {
      backgroundColor: c.gold,
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    proStripText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 13, color: "#fff" },
    proStripCta: { fontFamily: fonts.monoBold, fontSize: 10, color: "#fff" },

    footer: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: c.paper,
      padding: 16,
      paddingBottom: 34,
      borderTopWidth: 1,
      borderTopColor: c.rule,
    },
    checkoutBtn: {
      height: 56,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.fab,
    },
    checkoutBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
    secureNote: {
      textAlign: "center",
      fontFamily: fonts.sans,
      fontSize: 11,
      color: c.mute,
      marginTop: 8,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: space[8],
      gap: 12,
    },
    emptyHeading: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    emptySub: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      maxWidth: 260,
    },
    browseBtn: {
      width: 280,
      height: 52,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 8,
    },
    browseBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
    editLink: { fontFamily: fonts.sans, fontSize: 13, color: "#C5491F" },

    checkoutContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: space[8],
      gap: 12,
    },
    checkoutLogo: { fontFamily: fonts.serifBold, fontSize: 28, color: c.ink },
    checkoutHeading: {
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
      textAlign: "center",
    },
    checkoutSub: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      maxWidth: 280,
    },
    progressTrack: {
      width: 280,
      height: 4,
      backgroundColor: c.ghost,
      borderRadius: 2,
      overflow: "hidden",
      marginTop: 8,
    },
    progressFill: { height: 4, backgroundColor: "#C5491F", borderRadius: 2 },
    voucherAppliedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: c.goldLight,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: c.goldBorder,
    },
    voucherAppliedText: { fontFamily: fonts.sansBold, fontSize: 11, color: c.gold },
    badgeRow: {
      flexDirection: "row",
      gap: 8,
      flexWrap: "wrap",
      justifyContent: "center",
      marginTop: 8,
    },
    badge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: radius.full,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    badgeText: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    cancelLink: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginTop: 16 },
  });
}
