import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Image, ImageBackground,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useCartStore } from "../../store/cartStore";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ShopProduct, ShopCategory, ShopVendor } from "../../types";

// ── Badge helpers ─────────────────────────────────────────────────────────────

function BadgeLabel({ badge, stockQuantity }: { badge?: string | null; stockQuantity?: number | null }) {
  const c = useColors();
  const badgeS = useMemo(() => createBadgeStyles(c), [c]);
  if (!badge) return null;
  let label = "";
  let bg = c.ochre;
  let textColor = c.paper;

  if (badge === "new")               { label = "NEW"; }
  else if (badge === "pro_early_access") { label = "PRO EARLY ACCESS"; bg = c.gold; }
  else if (badge === "sale")         { label = "SALE"; bg = c.ochre; }
  else if (badge === "low_stock")    {
    label = `ONLY ${stockQuantity ?? "FEW"} LEFT`;
    bg = c.ink;
  }

  return (
    <View style={[badgeS.pill, { backgroundColor: bg }]}>
      <Text style={[badgeS.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function createBadgeStyles(c: ColorPalette) {
  return StyleSheet.create({
    pill: {
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: radius.full,
    },
    text: { fontFamily: fonts.sansBold, fontSize: 9 },
  });
}

// ── PriceRow ──────────────────────────────────────────────────────────────────

function PriceRow({
  price, regularPrice, salePrice, proPrice, currencySymbol, isPro, small,
}: {
  price: string; regularPrice: string; salePrice: string;
  proPrice?: string | null; currencySymbol: string;
  isPro: boolean; small?: boolean;
}) {
  const c = useColors();
  const baseSize = small ? 14 : 16;
  const proSize  = small ? 11 : 13;
  const hasSale  = salePrice && salePrice !== regularPrice;

  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {hasSale && (
          <Text style={{ fontFamily: fonts.mono, fontSize: proSize, color: c.ghost, textDecorationLine: "line-through" }}>
            {currencySymbol}{regularPrice}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.monoBold, fontSize: baseSize, color: hasSale ? c.ochre : c.ink }}>
          {currencySymbol}{price}
        </Text>
      </View>
      {proPrice && (
        <Text style={{ fontFamily: fonts.mono, fontSize: proSize, color: c.gold }}>
          {currencySymbol}{proPrice} for Pro ★
        </Text>
      )}
    </View>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCardLarge({
  product, isPro, onAddToBag, onPress,
}: {
  product: ShopProduct; isPro: boolean; onAddToBag: (p: ShopProduct) => void; onPress?: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity style={[styles.productCardLarge, shadows.card]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.productCardLargeImage}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        <View style={styles.badgeTopRight}>
          <BadgeLabel badge={product.badge} stockQuantity={product.stockQuantity} />
        </View>
      </View>
      <View style={styles.productCardBody}>
        <Text style={styles.makerLabel} numberOfLines={1}>{product.makerName.toUpperCase()}{product.makerCity ? ` · ${product.makerCity}` : ""}</Text>
        <Text style={styles.productNameLarge} numberOfLines={2}>{product.name}</Text>
        <View style={{ marginBottom: 16 }}>
          <PriceRow
            price={product.price}
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            proPrice={product.proPrice}
            currencySymbol={product.currencySymbol}
            isPro={isPro}
          />
        </View>
        <TouchableOpacity style={styles.addToBagBtn} onPress={() => onAddToBag(product)}>
          <Text style={styles.addToBagBtnText}>Add to bag</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ProductCardSmall({
  product, isPro, onAddToBag, onPress,
}: {
  product: ShopProduct; isPro: boolean; onAddToBag: (p: ShopProduct) => void; onPress?: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity style={[styles.productCardSmall, shadows.card]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.productCardSmallImage}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        <View style={styles.badgeTopLeft}>
          <BadgeLabel badge={product.badge} stockQuantity={product.stockQuantity} />
        </View>
      </View>
      <View style={styles.productCardSmallBody}>
        <Text style={styles.makerLabel} numberOfLines={1}>{product.makerName.toUpperCase()}</Text>
        <Text style={styles.productNameSmall} numberOfLines={2}>{product.name}</Text>
        <View style={{ marginTop: "auto", marginBottom: 12 }}>
          <PriceRow
            price={product.price}
            regularPrice={product.regularPrice}
            salePrice={product.salePrice}
            proPrice={product.proPrice}
            currencySymbol={product.currencySymbol}
            isPro={isPro}
            small
          />
        </View>
        <TouchableOpacity style={styles.addToBagBtnSmall} onPress={() => onAddToBag(product)}>
          <Text style={styles.addToBagBtnText}>Add to bag</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function ProductCardGrid({
  product, isPro, onPress,
}: {
  product: ShopProduct; isPro: boolean; onPress: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const hasSale = product.salePrice && product.salePrice !== product.regularPrice;
  return (
    <TouchableOpacity style={[styles.gridCard, shadows.card]} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.gridCardImage}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        {product.badge === "low_stock" ? (
          <View style={styles.badgeBottomLeft}>
            <BadgeLabel badge={product.badge} stockQuantity={product.stockQuantity} />
          </View>
        ) : (
          <View style={styles.badgeTopLeft}>
            <BadgeLabel badge={product.badge} stockQuantity={product.stockQuantity} />
          </View>
        )}
      </View>
      <View style={styles.gridCardBody}>
        <Text style={styles.makerLabel} numberOfLines={1}>{product.makerName.toUpperCase()}</Text>
        <Text style={styles.gridCardName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.gridCardPrice}>
          {hasSale && (
            <Text style={styles.gridPriceOriginal}>{product.currencySymbol}{product.regularPrice}</Text>
          )}
          <Text style={[styles.gridPriceCurrent, hasSale && { color: c.ochre }]}>
            {product.currencySymbol}{product.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── VendorCard ────────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: ShopVendor }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <View style={[styles.vendorCard, shadows.card]}>
      <View style={styles.vendorAvatar}>
        {vendor.logoUrl ? (
          <Image source={{ uri: vendor.logoUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.vendorName} numberOfLines={1}>{vendor.name}</Text>
        {vendor.city ? <Text style={styles.vendorCity}>{vendor.city}</Text> : null}
        <Text style={styles.vendorCount}>{vendor.productCount} product{vendor.productCount !== 1 ? "s" : ""}</Text>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

const CATEGORIES_STATIC = [
  "All", "Ceramics", "Textiles", "Leather", "Jewellery", "Objects", "Paper",
];

export default function ShopScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore();
  const { itemCount, wishlist } = useCartStore();
  const wishlistCount = wishlist.length;
  const isPro = user?.tier === "patron";
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [activeCategory, setActiveCategory] = useState("");
  const [products, setProducts]       = useState<ShopProduct[]>([]);
  const [categories, setCategories]   = useState<ShopCategory[]>([]);
  const [vendors, setVendors]         = useState<ShopVendor[]>([]);
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [hasMore, setHasMore]         = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    const catParam = activeCategory ? `&category=${activeCategory}` : "";
    Promise.all([
      api.get<{ products: ShopProduct[]; pages: number }>(`${MOBILE_API}/shop/products?per_page=20${catParam}`, false),
      api.get<ShopCategory[]>(`${MOBILE_API}/shop/categories`, false),
      api.get<ShopVendor[]>(`${MOBILE_API}/shop/vendors`, false),
    ]).then(([productRes, cats, vends]) => {
      setProducts(productRes.products);
      setHasMore(productRes.pages > 1);
      setCategories(cats);
      setVendors(vends);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [activeCategory]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    const nextPage = page + 1;
    setLoadingMore(true);
    const catParam = activeCategory ? `&category=${activeCategory}` : "";
    try {
      const res = await api.get<{ products: ShopProduct[]; pages: number }>(
        `${MOBILE_API}/shop/products?per_page=20&page=${nextPage}${catParam}`, false
      );
      setProducts((prev) => [...prev, ...res.products]);
      setHasMore(nextPage < res.pages);
      setPage(nextPage);
    } catch {} finally { setLoadingMore(false); }
  };

  const { addItem } = useCartStore();

  const handleAddToBag = (product: ShopProduct) => {
    addItem({
      id:        String(product.id),
      productId: product.id,
      title:     product.name,
      brand:     product.makerName,
      price:     parseFloat(product.price) || 0,
      image:     product.imageUrl ?? undefined,
    });
    nav.navigate("Cart");
  };

  const pillLabels = useMemo(() => {
    if (categories.length === 0) return CATEGORIES_STATIC;
    return ["All", ...categories.map((c) => c.name)];
  }, [categories]);

  const featured   = products.slice(0, 1);
  const featSmall  = products.slice(1, 3);
  const gridItems  = products.slice(3);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Lifestyle</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => nav.navigate("ShopSearch")}
          >
            <Ionicons name="search-outline" size={22} color={c.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => nav.navigate("Wishlist")}
          >
            <Ionicons name={wishlistCount > 0 ? "heart" : "heart-outline"} size={22} color={wishlistCount > 0 ? c.error : c.ink} />
            {wishlistCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{wishlistCount > 9 ? "9+" : wishlistCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => nav.navigate("Cart")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="bag-outline" size={22} color={c.ink} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 200) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* ── Hero Banner ── */}
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" }}
          style={styles.hero}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay} pointerEvents="none" />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Vetted Makers · Handcrafted Objects</Text>
            <Text style={styles.heroTitle}>Objects that carry{"\n"}a story.</Text>
            <Text style={styles.heroSub}>Curated from independent makers and creators worldwide.</Text>
            <TouchableOpacity style={styles.heroBtn} onPress={() => nav.navigate("TheEdit")}>
              <Text style={styles.heroBtnText}>Shop the edit →</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* ── Category Scroll ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
          style={styles.categoryScrollWrap}
        >
          {pillLabels.map((label) => {
            const slug = label === "All" ? "" : label.toLowerCase();
            const isActive = activeCategory === slug;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => {
                  if (label === "All") {
                    setActiveCategory("");
                  } else {
                    nav.navigate("ShopListing", { categoryName: label, categorySlug: slug });
                  }
                }}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={c.gold} />
        ) : (
          <>
            {/* ── Featured Picks ── */}
            {featured.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Picks</Text>
                  <TouchableOpacity onPress={() => nav.navigate("TheEdit")}><Text style={styles.sectionAction}>The Edit →</Text></TouchableOpacity>
                </View>

                <ProductCardLarge product={featured[0]} isPro={isPro} onAddToBag={handleAddToBag} onPress={() => nav.navigate("ProductDetail", { slug: featured[0].slug })} />

                {featSmall.length > 0 && (
                  <View style={styles.smallGrid}>
                    {featSmall.map((p) => (
                      <View key={p.id} style={{ flex: 1 }}>
                        <ProductCardSmall product={p} isPro={isPro} onAddToBag={handleAddToBag} onPress={() => nav.navigate("ProductDetail", { slug: p.slug })} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* ── Editorial Bridge ── */}
            <TouchableOpacity
              style={styles.editorialBridge}
              onPress={() => nav.navigate("Magazine")}
            >
              <Ionicons name="book-outline" size={20} color={c.ochre} />
              <View style={{ flex: 1 }}>
                <Text style={styles.editorialTitle}>As seen in The Magazine →</Text>
                <Text style={styles.editorialSub} numberOfLines={1}>
                  Explore the heritage of indigo dyeing techniques.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.ink} />
            </TouchableOpacity>

            {/* ── All Products Grid ── */}
            {gridItems.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>All Products</Text>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={styles.sectionActionMuted}>Sort: Featured</Text>
                    <Text style={styles.sortChevron}>▼</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.gridWrap}>
                  {gridItems.map((p) => (
                    <View key={p.id} style={styles.gridItem}>
                      <ProductCardGrid
                        product={p}
                        isPro={isPro}
                        onPress={() => nav.navigate("ProductDetail", { productId: p.id, product: p })}
                      />
                    </View>
                  ))}
                </View>
                {loadingMore && (
                  <ActivityIndicator style={{ paddingVertical: 20 }} color={c.gold} />
                )}
              </View>
            )}

            {/* ── Meet the Makers ── */}
            {vendors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Meet the Makers</Text>
                  <TouchableOpacity onPress={() => nav.navigate("ShopListing", { categoryName: "All Products", categorySlug: "" })}><Text style={styles.sectionAction}>See all →</Text></TouchableOpacity>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.vendorScroll}
                >
                  {vendors.map((v, i) => <VendorCard key={`${v.name}-${i}`} vendor={v} />)}
                </ScrollView>
              </View>
            )}

            {/* ── Pro Band ── */}
            <View style={styles.proBand}>
              <Text style={styles.proBandEyebrow}>★ Connect Pro Members</Text>
              <Text style={styles.proBandTitle}>Early access · Member pricing · Free returns</Text>
              <TouchableOpacity
                style={styles.proBandBtn}
                onPress={() => nav.navigate("Connect", { screen: "Membership" } as any)}
              >
                <Text style={styles.proBandBtnText}>Upgrade →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: space[4],
      backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink },
    headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
    iconBtn: { position: "relative" },
    cartBadge: {
      position: "absolute", top: -4, right: -4,
      width: 16, height: 16, borderRadius: 8,
      backgroundColor: c.ochre, borderWidth: 1.5, borderColor: c.paper,
      alignItems: "center", justifyContent: "center",
    },
    cartBadgeText: { fontFamily: fonts.monoBold, fontSize: 8, color: c.paper },

    scrollContent: { paddingBottom: 100 },

    hero: { height: 240, width: "100%", overflow: "hidden", position: "relative" },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10,8,5,0.68)",
    },
    heroContent: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      padding: space[4], paddingBottom: space[5],
    },
    heroEyebrow: {
      fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
      color: "#E8C97A", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8,
    },
    heroTitle: {
      fontFamily: fonts.serifBold, fontSize: 30,
      color: "#FFFFFF", lineHeight: 36, marginBottom: 6,
    },
    heroSub: { fontFamily: fonts.sans, fontSize: 14, color: "rgba(255,255,255,0.75)", marginBottom: 16 },
    heroBtn: {
      height: 38, paddingHorizontal: 18,
      borderWidth: 1.5, borderColor: "rgba(255,255,255,0.5)",
      backgroundColor: "rgba(255,255,255,0.12)",
      borderRadius: radius.full, alignSelf: "flex-start",
      alignItems: "center", justifyContent: "center",
    },
    heroBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#FFFFFF" },

    categoryScrollWrap: {
      height: 56, marginTop: 0,
      backgroundColor: c.paper,
      borderBottomWidth: 1, borderBottomColor: c.ruleDark,
    },
    categoryRow: { paddingHorizontal: space[4], gap: 8, alignItems: "center", height: 56 },
    categoryPill: {
      height: 34, paddingHorizontal: 14,
      borderRadius: radius.full, backgroundColor: "transparent",
      borderWidth: 1, borderColor: c.ghost,
      alignItems: "center", justifyContent: "center",
    },
    categoryPillActive: { backgroundColor: c.ink, borderColor: c.ink },
    categoryPillText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    categoryPillTextActive: { color: c.paper, fontFamily: fonts.sansBold },

    section: { paddingTop: 24, paddingBottom: 8 },
    sectionHeader: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], marginBottom: 12,
    },
    sectionTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    sectionAction: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },
    sectionActionMuted: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    sortChevron: { fontSize: 10, color: c.mute },

    productCardLarge: {
      marginHorizontal: space[4], backgroundColor: c.paper,
      borderRadius: radius.xl, overflow: "hidden", marginBottom: 12,
    },
    productCardLargeImage: { width: "100%", height: 200, position: "relative" },
    productCardBody: { padding: space[4] },
    productNameLarge: {
      fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginBottom: 6,
    },

    productCardSmall: {
      backgroundColor: c.paper, borderRadius: radius.xl, overflow: "hidden", flex: 1,
    },
    productCardSmallImage: { width: "100%", height: 140, position: "relative" },
    productCardSmallBody: {
      padding: 12, flex: 1, flexDirection: "column",
    },
    productNameSmall: {
      fontFamily: fonts.sansBold, fontSize: 13, color: c.ink,
      marginBottom: 6, minHeight: 36,
    },

    smallGrid: { flexDirection: "row", gap: 12, paddingHorizontal: space[4] },

    gridCard: {
      backgroundColor: c.paper, borderRadius: radius.xl,
      overflow: "hidden", flex: 1,
    },
    gridCardImage: { width: "100%", aspectRatio: 1, position: "relative" },
    gridCardBody: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
    gridCardName: {
      fontFamily: fonts.sansBold, fontSize: 13, color: c.ink,
      marginBottom: 8, minHeight: 36,
    },
    gridCardPrice: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: "auto" },
    gridPriceOriginal: {
      fontFamily: fonts.mono, fontSize: 12, color: c.ghost,
      textDecorationLine: "line-through",
    },
    gridPriceCurrent: { fontFamily: fonts.monoBold, fontSize: 14, color: c.ink },

    gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: space[4] },
    gridItem: { width: "47%" },

    makerLabel: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1.5,
      marginBottom: 4,
    },
    imagePlaceholder: { backgroundColor: c.paperDeep },
    badgeTopLeft:   { position: "absolute", top: 8, left: 8 },
    badgeTopRight:  { position: "absolute", top: 12, right: 12 },
    badgeBottomLeft: { position: "absolute", bottom: 8, left: 8 },

    addToBagBtn: {
      width: "100%", height: 40, backgroundColor: c.ochre,
      borderRadius: radius.full, alignItems: "center", justifyContent: "center",
    },
    addToBagBtnSmall: {
      width: "100%", height: 36, backgroundColor: c.ochre,
      borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginTop: "auto",
    },
    addToBagBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },

    editorialBridge: {
      height: 64, paddingHorizontal: space[4],
      flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: c.paperDeep,
      borderTopWidth: 1, borderBottomWidth: 1,
      borderColor: c.ruleDark,
      marginTop: 8,
    },
    editorialTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    editorialSub: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },

    vendorScroll: { paddingHorizontal: space[4], gap: 12 },
    vendorCard: {
      width: 170, height: 100, backgroundColor: c.paper,
      borderRadius: radius.xl, padding: 12,
      flexDirection: "row", alignItems: "center",
    },
    vendorAvatar: {
      width: 44, height: 44, borderRadius: 22,
      borderWidth: 2, borderColor: c.gold,
      overflow: "hidden", marginRight: 12, flexShrink: 0,
    },
    vendorName: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    vendorCity: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, marginBottom: 4 },
    vendorCount: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },

    proBand: {
      backgroundColor: c.ink,
      paddingVertical: 48, paddingHorizontal: space[4],
      alignItems: "center",
    },
    proBandEyebrow: {
      fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
      color: "#E8C97A", textTransform: "uppercase",
      letterSpacing: 2, marginBottom: 8,
    },
    proBandTitle: {
      fontFamily: fonts.serifBold, fontSize: 20, color: "#FFFFFF",
      textAlign: "center", marginBottom: 20, lineHeight: 28,
    },
    proBandBtn: {
      height: 42, paddingHorizontal: 24,
      borderRadius: radius.full, borderWidth: 1.5, borderColor: "#E8C97A",
      alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(232,201,122,0.08)",
    },
    proBandBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#E8C97A" },
  });
}
