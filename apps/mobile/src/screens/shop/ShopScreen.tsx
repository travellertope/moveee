import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Linking, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useCartStore } from "../../store/cartStore";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ShopProduct, ShopCategory, ShopVendor } from "../../types";

// ── Badge helpers ─────────────────────────────────────────────────────────────

function BadgeLabel({ badge, stockQuantity }: { badge?: string | null; stockQuantity?: number | null }) {
  if (!badge) return null;
  let label = "";
  let bg = colors.ochre;
  let textColor = "#fff";

  if (badge === "new")               { label = "NEW"; }
  else if (badge === "pro_early_access") { label = "PRO EARLY ACCESS"; bg = colors.gold; }
  else if (badge === "sale")         { label = "SALE"; bg = colors.ochre; }
  else if (badge === "low_stock")    {
    label = `ONLY ${stockQuantity ?? "FEW"} LEFT`;
    bg = colors.ink;
  }

  return (
    <View style={[badgeS.pill, { backgroundColor: bg }]}>
      <Text style={[badgeS.text, { color: textColor }]}>{label}</Text>
    </View>
  );
}
const badgeS = StyleSheet.create({
  pill: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: radius.full,
  },
  text: { fontFamily: fonts.sansBold, fontSize: 9 },
});

// ── PriceRow ──────────────────────────────────────────────────────────────────

function PriceRow({
  price, regularPrice, salePrice, proPrice, currencySymbol, isPro, small,
}: {
  price: string; regularPrice: string; salePrice: string;
  proPrice?: string | null; currencySymbol: string;
  isPro: boolean; small?: boolean;
}) {
  const baseSize = small ? 14 : 16;
  const proSize  = small ? 11 : 13;
  const hasSale  = salePrice && salePrice !== regularPrice;

  return (
    <View style={{ gap: 2 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
        {hasSale && (
          <Text style={{ fontFamily: fonts.mono, fontSize: proSize, color: colors.ghost, textDecorationLine: "line-through" }}>
            {currencySymbol}{regularPrice}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.monoBold, fontSize: baseSize, color: hasSale ? colors.ochre : colors.ink }}>
          {currencySymbol}{price}
        </Text>
      </View>
      {proPrice && (
        <Text style={{ fontFamily: fonts.mono, fontSize: proSize, color: colors.gold }}>
          {currencySymbol}{proPrice} for Pro ★
        </Text>
      )}
    </View>
  );
}

// ── ProductCard ───────────────────────────────────────────────────────────────

function ProductCardLarge({
  product, isPro, onAddToBag,
}: {
  product: ShopProduct; isPro: boolean; onAddToBag: (p: ShopProduct) => void;
}) {
  return (
    <View style={[styles.productCardLarge, shadows.card]}>
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
    </View>
  );
}

function ProductCardSmall({
  product, isPro, onAddToBag,
}: {
  product: ShopProduct; isPro: boolean; onAddToBag: (p: ShopProduct) => void;
}) {
  return (
    <View style={[styles.productCardSmall, shadows.card]}>
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
    </View>
  );
}

function ProductCardGrid({
  product, isPro, onPress,
}: {
  product: ShopProduct; isPro: boolean; onPress: () => void;
}) {
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
          <Text style={[styles.gridPriceCurrent, hasSale && { color: colors.ochre }]}>
            {product.currencySymbol}{product.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── VendorCard ────────────────────────────────────────────────────────────────

function VendorCard({ vendor }: { vendor: ShopVendor }) {
  const isPro = false; // Vendor tier, not user — use gold border for featured
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
  const { itemCount } = useCartStore();
  const isPro = user?.tier === "patron";

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

  const handleAddToBag = (product: ShopProduct) => {
    // Open WooCommerce checkout URL in browser
    const url = `https://themoveee.com/shop/${product.slug}`;
    Linking.openURL(url).catch(() => {});
  };

  // Build category pill labels from fetched categories (fallback to static)
  const pillLabels = useMemo(() => {
    if (categories.length === 0) return CATEGORIES_STATIC;
    return ["All", ...categories.map((c) => c.name)];
  }, [categories]);

  // Split products into featured (first 3) and grid (rest)
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
          >
            <Ionicons name="search-outline" size={22} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => nav.navigate("Cart")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="bag-outline" size={22} color={colors.ink} />
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
        <View style={styles.hero}>
          <View style={styles.heroGradient} />
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>Vetted Makers · Handcrafted Objects</Text>
            <Text style={styles.heroTitle}>Objects that carry a story.</Text>
            <Text style={styles.heroSub}>Curated from independent makers across the diaspora.</Text>
            <TouchableOpacity style={styles.heroBtn}>
              <Text style={styles.heroBtnText}>Shop the edit →</Text>
            </TouchableOpacity>
          </View>
        </View>

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
                onPress={() => setActiveCategory(slug)}
              >
                <Text style={[styles.categoryPillText, isActive && styles.categoryPillTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={{ marginTop: 60 }} color={colors.gold} />
        ) : (
          <>
            {/* ── Featured Picks ── */}
            {featured.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Featured Picks</Text>
                  <TouchableOpacity><Text style={styles.sectionAction}>The Edit →</Text></TouchableOpacity>
                </View>

                <ProductCardLarge product={featured[0]} isPro={isPro} onAddToBag={handleAddToBag} />

                {featSmall.length > 0 && (
                  <View style={styles.smallGrid}>
                    {featSmall.map((p) => (
                      <View key={p.id} style={{ flex: 1 }}>
                        <ProductCardSmall product={p} isPro={isPro} onAddToBag={handleAddToBag} />
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
              <Ionicons name="book-outline" size={20} color={colors.ochre} />
              <View style={{ flex: 1 }}>
                <Text style={styles.editorialTitle}>As seen in The Magazine →</Text>
                <Text style={styles.editorialSub} numberOfLines={1}>
                  Explore the heritage of indigo dyeing techniques.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.ink} />
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
                  <ActivityIndicator style={{ paddingVertical: 20 }} color={colors.gold} />
                )}
              </View>
            )}

            {/* ── Meet the Makers ── */}
            {vendors.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Meet the Makers</Text>
                  <TouchableOpacity><Text style={styles.sectionAction}>See all →</Text></TouchableOpacity>
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
                onPress={() => nav.navigate("Me", { screen: "Membership" })}
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.paperWarm },

  // Header
  header: {
    height: 56, flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingHorizontal: space[4],
    backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconBtn: { position: "relative" },
  cartBadge: {
    position: "absolute", top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.ochre, borderWidth: 1.5, borderColor: colors.paper,
    alignItems: "center", justifyContent: "center",
  },
  cartBadgeText: { fontFamily: fonts.monoBold, fontSize: 8, color: "#fff" },

  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: { height: 200, width: "100%", overflow: "hidden", position: "relative" },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#C5491F",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,17,13,0.55)",
  },
  heroContent: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    padding: space[4],
  },
  heroEyebrow: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.gold, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6,
  },
  heroTitle: {
    fontFamily: fonts.serifBold, fontSize: 28,
    color: "#fff", lineHeight: 32, marginBottom: 4,
  },
  heroSub: { fontFamily: fonts.sans, fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 12 },
  heroBtn: {
    height: 36, paddingHorizontal: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: radius.full, alignSelf: "flex-start",
    alignItems: "center", justifyContent: "center",
  },
  heroBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: "#fff" },

  // Category pills
  categoryScrollWrap: { height: 56, marginTop: 8 },
  categoryRow: { paddingHorizontal: space[4], gap: 8, alignItems: "center", height: 56 },
  categoryPill: {
    height: 40, paddingHorizontal: 12,
    borderRadius: radius.full, backgroundColor: colors.paper,
    borderWidth: 1, borderColor: colors.ghost,
    alignItems: "center", justifyContent: "center",
  },
  categoryPillActive: { backgroundColor: colors.ochre, borderColor: colors.ochre },
  categoryPillText: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft },
  categoryPillTextActive: { color: "#fff", fontFamily: fonts.sansBold },

  // Section layout
  section: { paddingTop: 24, paddingBottom: 8 },
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], marginBottom: 12,
  },
  sectionTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  sectionAction: { fontFamily: fonts.sans, fontSize: 13, color: colors.ochre },
  sectionActionMuted: { fontFamily: fonts.sans, fontSize: 13, color: colors.mute },
  sortChevron: { fontSize: 10, color: colors.mute },

  // Large product card
  productCardLarge: {
    marginHorizontal: space[4], backgroundColor: colors.paper,
    borderRadius: radius.xl, overflow: "hidden", marginBottom: 12,
  },
  productCardLargeImage: { width: "100%", height: 200, position: "relative" },
  productCardBody: { padding: space[4] },
  productNameLarge: {
    fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink, marginBottom: 6,
  },

  // Small card
  productCardSmall: {
    backgroundColor: colors.paper, borderRadius: radius.xl, overflow: "hidden", flex: 1,
  },
  productCardSmallImage: { width: "100%", height: 140, position: "relative" },
  productCardSmallBody: {
    padding: 12, flex: 1, flexDirection: "column",
  },
  productNameSmall: {
    fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink,
    marginBottom: 6, minHeight: 36,
  },

  smallGrid: { flexDirection: "row", gap: 12, paddingHorizontal: space[4] },

  // Grid card
  gridCard: {
    backgroundColor: colors.paper, borderRadius: radius.xl,
    overflow: "hidden", flex: 1,
  },
  gridCardImage: { width: "100%", aspectRatio: 1, position: "relative" },
  gridCardBody: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 },
  gridCardName: {
    fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink,
    marginBottom: 8, minHeight: 36,
  },
  gridCardPrice: { flexDirection: "row", alignItems: "baseline", gap: 4, marginTop: "auto" },
  gridPriceOriginal: {
    fontFamily: fonts.mono, fontSize: 12, color: colors.ghost,
    textDecorationLine: "line-through",
  },
  gridPriceCurrent: { fontFamily: fonts.monoBold, fontSize: 14, color: colors.ink },

  gridWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: space[4] },
  gridItem: { width: "47%" },

  // Shared
  makerLabel: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.mute, textTransform: "uppercase", letterSpacing: 1.5,
    marginBottom: 4,
  },
  imagePlaceholder: { backgroundColor: colors.paperDeep },
  badgeTopLeft:   { position: "absolute", top: 8, left: 8 },
  badgeTopRight:  { position: "absolute", top: 12, right: 12 },
  badgeBottomLeft: { position: "absolute", bottom: 8, left: 8 },

  addToBagBtn: {
    width: "100%", height: 40, backgroundColor: colors.ochre,
    borderRadius: radius.full, alignItems: "center", justifyContent: "center",
  },
  addToBagBtnSmall: {
    width: "100%", height: 36, backgroundColor: colors.ochre,
    borderRadius: radius.full, alignItems: "center", justifyContent: "center", marginTop: "auto",
  },
  addToBagBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#fff" },

  // Editorial bridge
  editorialBridge: {
    height: 64, paddingHorizontal: space[4],
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#EDE6DA",
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: "rgba(200,191,176,0.4)",
    marginTop: 8,
  },
  editorialTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  editorialSub: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },

  // Vendors
  vendorScroll: { paddingHorizontal: space[4], gap: 12 },
  vendorCard: {
    width: 170, height: 100, backgroundColor: colors.paper,
    borderRadius: radius.xl, padding: 12,
    flexDirection: "row", alignItems: "center",
  },
  vendorAvatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: colors.gold,
    overflow: "hidden", marginRight: 12, flexShrink: 0,
  },
  vendorName: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink },
  vendorCity: { fontFamily: fonts.sans, fontSize: 11, color: colors.mute, marginBottom: 4 },
  vendorCount: { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },

  // Pro band
  proBand: {
    backgroundColor: colors.ochre,
    paddingVertical: 48, paddingHorizontal: space[4],
    alignItems: "center",
  },
  proBandEyebrow: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.gold, textTransform: "uppercase",
    letterSpacing: 2, marginBottom: 8,
  },
  proBandTitle: {
    fontFamily: fonts.serifBold, fontSize: 18, color: "#fff",
    textAlign: "center", marginBottom: 20,
  },
  proBandBtn: {
    height: 40, paddingHorizontal: 20,
    borderRadius: radius.full, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center", justifyContent: "center",
  },
  proBandBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#fff" },
});
