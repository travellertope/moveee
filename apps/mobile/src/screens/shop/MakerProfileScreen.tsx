import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Share,
  ActivityIndicator,
  Dimensions,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api, MOBILE_API } from "../../api/client";
import { useCartStore } from "../../store/cartStore";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

// ── Types ─────────────────────────────────────────────────────────────────────

interface MakerProduct {
  id: number;
  title: string;
  price: number;
  salePrice?: number;
  badge?: "new" | "low_stock" | "sale";
  badgeLabel?: string;
  image?: string;
  proPrice?: number;
}

interface MakerProfile {
  id: number;
  name: string;
  slug: string;
  city: string;
  country: string;
  bio: string;
  website?: string;
  vetted: boolean;
  rating: number;
  established?: number;
  freeReturns?: boolean;
  avatarUrl?: string;
  storySlug?: string;
  products: MakerProduct[];
}

type MakerProfileRouteParams = {
  MakerProfile: { makerId: number; makerSlug?: string };
};

// ── Placeholder data ───────────────────────────────────────────────────────────

const PLACEHOLDER: MakerProfile = {
  id: 0,
  name: "Bisi Ceramics",
  slug: "bisi-ceramics",
  city: "Lagos",
  country: "Nigeria",
  bio: "Handcrafted ceramics inspired by Yoruba form and texture. Each piece is wheel-thrown or hand-built in our Lagos studio, fired in our kiln, and glazed with locally sourced materials.\n\nWe work slowly and intentionally — making things that outlast trends.",
  website: "https://bisiceramics.com",
  vetted: true,
  rating: 4.9,
  established: 2019,
  freeReturns: true,
  products: [],
};

const { width: SCREEN_W } = Dimensions.get("window");
const PRODUCT_COL_GAP = 12;
const PRODUCT_COL_PADDING = 16;
const PRODUCT_CARD_W = (SCREEN_W - PRODUCT_COL_PADDING * 2 - PRODUCT_COL_GAP) / 2;

// ── Sub-components ─────────────────────────────────────────────────────────────

function SkeletonBox({ w, h, radius: r = 6 }: { w: number | string; h: number; radius?: number }) {
  const c = useColors();
  return (
    <View
      style={{
        width: w as number,
        height: h,
        borderRadius: r,
        backgroundColor: c.paperDeep,
        opacity: 0.6,
      }}
    />
  );
}

function ProductCard({
  product,
  makerName,
}: {
  product: MakerProduct;
  makerName: string;
}) {
  const c = useColors();
  const s = useMemo(() => createProductCardStyles(c), [c]);
  const addItem = useCartStore((st) => st.addItem);
  const [wished, setWished] = useState(false);

  const displayPrice = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;

  const badgeBg =
    product.badge === "sale"
      ? "#C62828"
      : product.badge === "low_stock"
      ? "rgba(20,17,13,0.7)"
      : c.gold; // "new"

  return (
    <View style={s.card}>
      {/* Image area */}
      <View style={s.imageWrap}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={s.image} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={["#D4B896", "#A67C52", "#C5491F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.image}
          />
        )}

        {/* Badge */}
        {product.badge && (
          <View
            style={[
              s.badge,
              product.badge === "low_stock" ? s.badgeBottomLeft : s.badgeTopLeft,
              { backgroundColor: badgeBg },
            ]}
          >
            <Text style={s.badgeText}>
              {product.badge === "new"
                ? "NEW"
                : product.badge === "sale"
                ? "SALE"
                : product.badgeLabel ?? "LOW STOCK"}
            </Text>
          </View>
        )}

        {/* Wishlist */}
        <TouchableOpacity
          style={s.wishBtn}
          onPress={() => setWished((w) => !w)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={wished ? "heart" : "heart-outline"}
            size={16}
            color={wished ? "#C62828" : c.ink}
          />
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={s.info}>
        <Text style={s.brand} numberOfLines={1}>
          {makerName.toUpperCase()}
        </Text>
        <Text style={s.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={s.priceRow}>
          <View style={s.priceLeft}>
            {hasDiscount && (
              <Text style={s.originalPrice}>£{product.price.toFixed(2)}</Text>
            )}
            <Text style={[s.price, hasDiscount && { color: c.ochre }]}>
              £{displayPrice.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={s.addBtn}
            onPress={() =>
              addItem({
                id: String(product.id),
                productId: product.id,
                title: product.title,
                brand: makerName,
                price: displayPrice,
              })
            }
          >
            <Ionicons name="add" size={18} color={c.ink} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function createProductCardStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      width: PRODUCT_CARD_W,
      backgroundColor: c.paper,
      borderRadius: radius.md,
      ...shadows.card,
      overflow: "hidden",
    },
    imageWrap: {
      width: "100%",
      aspectRatio: 1,
      position: "relative",
    },
    image: {
      width: "100%",
      height: "100%",
    },
    badge: {
      position: "absolute",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    badgeTopLeft: { top: 8, left: 8 },
    badgeBottomLeft: { bottom: 8, left: 8 },
    badgeText: {
      fontFamily: fonts.sansBold,
      fontSize: 9,
      color: "#FFFFFF",
      letterSpacing: 0.5,
    },
    wishBtn: {
      position: "absolute",
      top: 8,
      right: 8,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.90)",
      alignItems: "center",
      justifyContent: "center",
    },
    info: {
      padding: 10,
    },
    brand: {
      fontFamily: fonts.mono,
      fontSize: 9,
      color: c.mute,
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    title: {
      fontFamily: fonts.sansBold,
      fontSize: 13,
      color: c.ink,
      lineHeight: 18,
      minHeight: 36,
      marginBottom: 8,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    priceLeft: {
      flexDirection: "column",
    },
    originalPrice: {
      fontFamily: fonts.sans,
      fontSize: 11,
      color: c.mute,
      textDecorationLine: "line-through",
    },
    price: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
    },
    addBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: "#F3ECE0",
      alignItems: "center",
      justifyContent: "center",
    },
  });
}

// ── Main screen ────────────────────────────────────────────────────────────────

export default function MakerProfileScreen() {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<MakerProfileRouteParams, "MakerProfile">>();
  const { makerId } = route.params;

  const [maker, setMaker] = useState<MakerProfile>(PLACEHOLDER);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(`${MOBILE_API}/shop/maker/${makerId}`, false);
        if (!cancelled) setMaker(data as MakerProfile);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Failed to load maker");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [makerId]);

  const handleShare = useCallback(async () => {
    await Share.share({
      message: `Check out ${maker.name} on Moveee — ${maker.city}, ${maker.country}`,
      url: maker.website ?? `https://themoveee.com/makers/${maker.slug}`,
    });
  }, [maker]);

  const handleOrigins = useCallback(() => {
    if (maker.storySlug) {
      navigation.navigate("Magazine", { screen: "Article", params: { slug: maker.storySlug } } as any);
    }
  }, [maker.storySlug, navigation]);

  const handleDirectory = useCallback(() => {
    navigation.navigate("MemberDirectory");
  }, [navigation]);

  // Split products into rows of 2
  const products = maker.products ?? [];

  return (
    <SafeAreaView style={s.safe} edges={["top", "bottom"]}>
      {/* ── Header ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>

        <Text style={s.headerTitle} numberOfLines={1}>
          {maker.name}
        </Text>

        <TouchableOpacity
          onPress={handleShare}
          style={s.headerBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="share-social-outline" size={20} color={c.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={s.hero}>
          <LinearGradient
            colors={["#A66C52", "#C5491F", "#E2B19B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Dark overlay (bottom to top) */}
          <LinearGradient
            colors={["rgba(20,17,13,0.8)", "rgba(20,17,13,0.4)", "transparent"]}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Bottom-left content */}
          <View style={s.heroContent}>
            {/* Avatar */}
            <View style={s.avatarWrap}>
              {maker.avatarUrl ? (
                <Image
                  source={{ uri: maker.avatarUrl }}
                  style={s.avatar}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={["#D4B896", "#A67C52"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={s.avatar}
                />
              )}
            </View>

            <View style={s.heroText}>
              <Text style={s.heroName}>{maker.name}</Text>
              <Text style={s.heroLocation}>
                📍 {maker.city}, {maker.country}
              </Text>

              {maker.vetted && (
                <View style={s.vettedPill}>
                  <Text style={s.vettedText}>✓ Vetted Maker</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Stats bar ── */}
        <View style={s.statsBar}>
          {[
            {
              value: String(products.length),
              label: "PRODUCTS",
            },
            {
              value: `${maker.rating ?? "—"}★`,
              label: "RATING",
              isGold: true,
            },
            {
              value: maker.established ? String(maker.established) : "—",
              label: "EST.",
            },
            {
              value: maker.freeReturns ? "↩" : "—",
              label: "FREE RETURNS",
            },
          ].map((stat, i, arr) => (
            <React.Fragment key={stat.label}>
              <View style={s.statCell}>
                <Text style={[s.statValue, stat.isGold && { color: c.gold }]}>
                  {stat.value}
                </Text>
                <Text style={s.statLabel}>{stat.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={s.statDivider} />}
            </React.Fragment>
          ))}
        </View>

        {/* ── About card ── */}
        <View style={s.card}>
          <Text style={s.cardTitle}>About the Maker</Text>
          <Text style={s.bioText}>{maker.bio}</Text>

          {maker.website && (
            <TouchableOpacity
              style={s.linkRow}
              onPress={() => Linking.openURL(maker.website!)}
            >
              <Ionicons name="globe-outline" size={16} color={c.ochre} style={{ marginRight: 8 }} />
              <Text style={s.linkText} numberOfLines={1}>
                {maker.website.replace(/^https?:\/\//, "")}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={s.linkRow} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={16} color={c.mute} style={{ marginRight: 8 }} />
            <Text style={s.shareLinkText}>Share this maker</Text>
          </TouchableOpacity>
        </View>

        {/* ── Origins bridge ── */}
        {maker.storySlug && (
          <TouchableOpacity style={s.originsBridge} onPress={handleOrigins} activeOpacity={0.75}>
            <Ionicons name="book-outline" size={20} color={c.ochre} style={{ marginRight: 12 }} />
            <Text style={s.originsText}>
              Read the Maker's story in Origins Journal →
            </Text>
            <Ionicons name="chevron-forward" size={16} color={c.ghost} />
          </TouchableOpacity>
        )}

        {/* ── Products section ── */}
        <View style={s.productsSection}>
          <View style={s.productsSectionHeader}>
            <Text style={s.productsSectionTitle}>All Products</Text>
            <TouchableOpacity style={s.sortBtn}>
              <Text style={s.sortText}>Sort ▼</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={s.productGrid}>
              {[0, 1, 2, 3].map((i) => (
                <View key={i} style={{ width: PRODUCT_CARD_W, marginBottom: 12 }}>
                  <SkeletonBox w={PRODUCT_CARD_W} h={PRODUCT_CARD_W} radius={12} />
                  <View style={{ padding: 10 }}>
                    <SkeletonBox w={60} h={10} />
                    <View style={{ height: 6 }} />
                    <SkeletonBox w={PRODUCT_CARD_W - 20} h={14} />
                    <View style={{ height: 4 }} />
                    <SkeletonBox w={80} h={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : products.length === 0 ? (
            <View style={s.emptyProducts}>
              <Text style={s.emptyText}>No products listed yet.</Text>
            </View>
          ) : (
            <View style={s.productGrid}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} makerName={maker.name} />
              ))}
            </View>
          )}
        </View>

        {/* ── Contact card ── */}
        <View style={[s.card, { marginBottom: 32 }]}>
          <Text style={s.cardTitle}>Questions about a product?</Text>
          <Text style={s.contactBody}>
            Message the maker through our community directory.
          </Text>
          <TouchableOpacity style={s.linkRow} onPress={handleDirectory}>
            <Ionicons name="person-outline" size={16} color={c.ochre} style={{ marginRight: 8 }} />
            <Text style={s.linkText}>View in Directory →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: c.paperWarm,
    },

    // Header
    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paperWarm,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      paddingHorizontal: 16,
    },
    headerBtn: {
      width: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.sansBold,
      fontSize: 15,
      color: c.ink,
    },

    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 0 },

    // Hero
    hero: {
      height: 220,
      width: "100%",
      justifyContent: "flex-end",
      overflow: "hidden",
    },
    heroContent: {
      flexDirection: "row",
      alignItems: "flex-end",
      padding: 16,
      paddingBottom: 18,
    },
    avatarWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 2,
      borderColor: "#B38238",
      overflow: "hidden",
      marginRight: 12,
      flexShrink: 0,
    },
    avatar: {
      width: "100%",
      height: "100%",
    },
    heroText: {
      flex: 1,
      justifyContent: "flex-end",
    },
    heroName: {
      fontFamily: fonts.serifBold,
      fontSize: 22,
      color: "#FFFFFF",
      lineHeight: 28,
    },
    heroLocation: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: "rgba(255,255,255,0.80)",
      marginTop: 2,
    },
    vettedPill: {
      alignSelf: "flex-start",
      marginTop: 6,
      backgroundColor: "rgba(45,106,79,0.90)",
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    vettedText: {
      fontFamily: fonts.sansBold,
      fontSize: 10,
      color: "#FFFFFF",
      letterSpacing: 0.3,
    },

    // Stats bar
    statsBar: {
      height: 64,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      ...shadows.card,
    },
    statCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    statValue: {
      fontFamily: fonts.sansBold,
      fontSize: 20,
      color: c.ink,
      lineHeight: 24,
    },
    statLabel: {
      fontFamily: fonts.mono,
      fontSize: 9,
      color: c.mute,
      letterSpacing: 0.5,
      marginTop: 2,
    },
    statDivider: {
      width: 1,
      height: 32,
      backgroundColor: c.rule,
    },

    // Cards
    card: {
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: c.paper,
      borderRadius: 12,
      padding: 16,
      ...shadows.card,
    },
    cardTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
      marginBottom: 8,
    },
    bioText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.inkSoft,
      lineHeight: 24,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 12,
    },
    linkText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.ochre,
      flex: 1,
    },
    shareLinkText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.mute,
    },

    // Origins bridge
    originsBridge: {
      flexDirection: "row",
      alignItems: "center",
      height: 64,
      backgroundColor: "#EBE5DC",
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: c.rule,
      paddingHorizontal: 16,
      marginTop: 16,
    },
    originsText: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
      flex: 1,
    },

    // Products section
    productsSection: {
      marginTop: 16,
      paddingHorizontal: PRODUCT_COL_PADDING,
    },
    productsSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    productsSectionTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
    },
    sortBtn: {},
    sortText: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.mute,
    },
    productGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: PRODUCT_COL_GAP,
    },
    emptyProducts: {
      paddingVertical: 32,
      alignItems: "center",
    },
    emptyText: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.mute,
    },

    // Contact card
    contactBody: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.mute,
      lineHeight: 20,
    },
  });
}
