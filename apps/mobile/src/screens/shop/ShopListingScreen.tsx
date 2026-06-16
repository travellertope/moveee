import React, { useEffect, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Linking, Image, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useCartStore, type WishlistItem } from "../../store/cartStore";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ShopProduct, ShopCategory } from "../../types";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Badge helpers ─────────────────────────────────────────────────────────────

type BadgePos = "topLeft" | "topRight" | "bottomLeft";

function BadgeLabel({
  badge, stockQuantity, pos = "topLeft",
}: {
  badge?: string | null; stockQuantity?: number | null; pos?: BadgePos;
}) {
  const c = useColors();
  const badgeS = useMemo(() => createBadgeStyles(c), [c]);
  if (!badge) return null;
  let label = "";
  let bg = c.ochre;

  if (badge === "new")               { label = "NEW"; }
  else if (badge === "pro_early_access") { label = "PRO EARLY ACCESS"; bg = c.gold; }
  else if (badge === "sale")         { label = "SALE"; bg = c.error; }
  else if (badge === "low_stock")    { label = `${stockQuantity ?? "FEW"} LEFT`; bg = c.ink; }

  const posStyle = pos === "topRight"
    ? { top: 8, right: 8 }
    : pos === "bottomLeft"
    ? { bottom: 8, left: 8 }
    : { top: 8, left: 8 };

  return (
    <View style={[badgeS.badge, posStyle, { backgroundColor: bg }]}>
      <Text style={badgeS.badgeText}>{label}</Text>
    </View>
  );
}

function createBadgeStyles(c: ColorPalette) {
  return StyleSheet.create({
    badge: {
      position: "absolute",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    badgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper },
  });
}

// ── PriceRow ──────────────────────────────────────────────────────────────────

function PriceRow({
  product, isPro, compact,
}: {
  product: ShopProduct; isPro: boolean; compact?: boolean;
}) {
  const c = useColors();
  const hasSale = product.salePrice && product.salePrice !== product.regularPrice;
  const sym = product.currencySymbol;
  const bigSize = compact ? 14 : 15;
  const smSize  = compact ? 11 : 12;

  return (
    <View style={{ gap: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
        {hasSale && (
          <Text style={{ fontFamily: fonts.mono, fontSize: smSize, color: c.ghost, textDecorationLine: "line-through" }}>
            {sym}{product.regularPrice}
          </Text>
        )}
        <Text style={{ fontFamily: fonts.monoBold, fontSize: bigSize, color: hasSale ? c.ochre : c.ink }}>
          {sym}{product.price}
        </Text>
      </View>
      {product.proPrice && (
        <Text style={{ fontFamily: fonts.mono, fontSize: smSize, color: c.gold }}>
          {sym}{product.proPrice} for Pro ★
        </Text>
      )}
    </View>
  );
}

// ── Grid card ─────────────────────────────────────────────────────────────────

function GridCard({
  product, isPro, colW, onPress, onAddToBag,
}: {
  product: ShopProduct; isPro: boolean; colW: number;
  onPress: () => void; onAddToBag: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { toggleWishlist, isWishlisted } = useCartStore();
  const liked = isWishlisted(product.id);

  const handleWishlist = () => {
    const item: WishlistItem = {
      id: product.id, title: product.name, brand: product.makerName,
      price: product.currencySymbol + product.price, image: product.imageUrl, slug: product.slug,
    };
    toggleWishlist(item);
  };

  return (
    <TouchableOpacity
      style={[styles.gridCard, { width: colW }, shadows.card]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={[styles.gridCardImage, { width: colW }]}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        <BadgeLabel
          badge={product.badge}
          stockQuantity={product.stockQuantity}
          pos={product.badge === "low_stock" ? "bottomLeft" : "topLeft"}
        />
        <TouchableOpacity
          style={styles.wishlistBtn}
          onPress={handleWishlist}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={14}
            color={liked ? c.error : c.ink}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.gridCardBody}>
        <Text style={styles.makerLabel} numberOfLines={1}>
          {product.makerName.toUpperCase()}
        </Text>
        <Text style={styles.productName} numberOfLines={2}>
          {product.name}
        </Text>
        <View style={styles.gridCardFooter}>
          <PriceRow product={product} isPro={isPro} compact />
          <TouchableOpacity
            style={styles.addCircleBtn}
            onPress={onAddToBag}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="add" size={14} color={c.ink} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── List card ─────────────────────────────────────────────────────────────────

function ListCard({
  product, isPro, onPress, onAddToBag,
}: {
  product: ShopProduct; isPro: boolean;
  onPress: () => void; onAddToBag: () => void;
}) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  return (
    <TouchableOpacity
      style={[styles.listCard, shadows.card]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View style={styles.listCardImage}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.imagePlaceholder]} />
        )}
        <BadgeLabel
          badge={product.badge}
          stockQuantity={product.stockQuantity}
          pos={product.badge === "low_stock" ? "bottomLeft" : "topLeft"}
        />
      </View>

      <View style={styles.listCardBody}>
        <Text style={styles.makerLabel} numberOfLines={1}>
          {product.makerName.toUpperCase()}
        </Text>
        <Text style={styles.listProductName} numberOfLines={2}>
          {product.name}
        </Text>
        {product.categories?.length > 0 && (
          <Text style={styles.listExcerpt} numberOfLines={1}>
            {product.categories[0]}
          </Text>
        )}
        <View style={styles.listCardFooter}>
          <PriceRow product={product} isPro={isPro} />
          <TouchableOpacity style={styles.addToBagBtn} onPress={onAddToBag}>
            <Text style={styles.addToBagBtnText}>Add to bag</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

type ViewMode = "grid" | "list";
type SortOption = "featured" | "price_asc" | "price_desc" | "newest";

export default function ShopListingScreen() {
  const nav = useNav();
  const { params } = useRoute<any>();
  const { user } = useAuthStore();
  const { itemCount, addItem } = useCartStore();
  const isPro = user?.tier === "patron";
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const categoryName: string = params?.categoryName ?? "All Products";
  const categorySlug: string = params?.categorySlug ?? "";
  const makerFilter: string  = params?.makerName ?? "";

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sort, setSort]         = useState<SortOption>("featured");
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [activeSlug, setActiveSlug] = useState(categorySlug);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [hasMore, setHasMore]   = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [total, setTotal]       = useState(0);

  const fetchProducts = async (catSlug: string, pageNum = 1, append = false) => {
    const catParam   = catSlug ? `&category=${catSlug}` : "";
    const sortParam  = sort !== "featured" ? `&orderby=${sort}` : "";
    const makerParam = makerFilter ? `&maker=${encodeURIComponent(makerFilter)}` : "";
    try {
      const res = await api.get<{ products: ShopProduct[]; pages: number; total: number }>(
        `${MOBILE_API}/shop/products?per_page=20&page=${pageNum}${catParam}${sortParam}${makerParam}`,
        false
      );
      setProducts((prev) => append ? [...prev, ...res.products] : res.products);
      setHasMore(pageNum < res.pages);
      setTotal(res.total ?? res.products.length);
    } catch {}
  };

  useEffect(() => {
    api.get<ShopCategory[]>(`${MOBILE_API}/shop/categories`, false)
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchProducts(activeSlug, 1, false).finally(() => setLoading(false));
  }, [activeSlug, sort]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    const next = page + 1;
    setLoadingMore(true);
    await fetchProducts(activeSlug, next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const handleAddToBag = (product: ShopProduct) => {
    addItem({
      id: `${product.id}`,
      productId: product.id,
      title: product.name,
      brand: product.makerName,
      price: parseFloat(product.price) || 0,
      image: product.imageUrl ?? undefined,
    });
    nav.navigate("Cart");
  };

  const colW = (SCREEN_W - 32 - 12) / 2;

  const pillLabels = useMemo(() => {
    const cats = categories.map((cat) => ({ name: cat.name, slug: cat.slug }));
    return [{ name: "All", slug: "" }, ...cats];
  }, [categories]);

  const activeName = pillLabels.find((p) => p.slug === activeSlug)?.name ?? categoryName;

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => nav.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {activeName}
        </Text>
        <TouchableOpacity
          style={styles.cartBtn}
          onPress={() => nav.navigate("Cart")}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="bag-outline" size={24} color={c.ink} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.filterBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
          style={styles.pillScroll}
        >
          {pillLabels.map((p) => {
            const active = p.slug === activeSlug;
            return (
              <TouchableOpacity
                key={p.slug}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setActiveSlug(p.slug)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sortRow}>
          <View style={styles.sortLeft}>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>Sort: Featured</Text>
              <Text style={styles.sortChevron}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>Filter</Text>
              <Ionicons name="options-outline" size={14} color={c.inkSoft} />
            </TouchableOpacity>
          </View>

          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === "grid" && styles.viewBtnActive]}
              onPress={() => setViewMode("grid")}
            >
              <Ionicons
                name="grid"
                size={16}
                color={viewMode === "grid" ? c.paper : c.ink}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === "list" && styles.viewBtnActive]}
              onPress={() => setViewMode("list")}
            >
              <Ionicons
                name="list"
                size={16}
                color={viewMode === "list" ? c.paper : c.ink}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.gold} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={64} color={c.ghost} />
          <Text style={styles.emptyTitle}>No products found.</Text>
          <Text style={styles.emptyBody}>
            Try a different category or clear your filters.
          </Text>
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setActiveSlug("")}
          >
            <Text style={styles.clearBtnText}>Clear filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          key={viewMode}
          data={products}
          keyExtractor={(p) => String(p.id)}
          numColumns={viewMode === "grid" ? 2 : 1}
          columnWrapperStyle={viewMode === "grid" ? styles.gridRow : undefined}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <Text style={styles.resultsCount}>{total} products</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator style={{ paddingVertical: 24 }} color={c.gold} />
            ) : null
          }
          renderItem={({ item }) =>
            viewMode === "grid" ? (
              <GridCard
                product={item}
                isPro={isPro}
                colW={colW}
                onPress={() => nav.navigate("ProductDetail", { product: item })}
                onAddToBag={() => handleAddToBag(item)}
              />
            ) : (
              <ListCard
                product={item}
                isPro={isPro}
                onPress={() => nav.navigate("ProductDetail", { product: item })}
                onAddToBag={() => handleAddToBag(item)}
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      gap: 8,
    },
    backBtn: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
    headerTitle: {
      flex: 1,
      fontFamily: fonts.serifBold,
      fontSize: fontSize.lg,
      color: c.ink,
      textAlign: "center",
    },
    cartBtn: { width: 28, height: 28, justifyContent: "center", alignItems: "center", position: "relative" },
    cartBadge: {
      position: "absolute",
      top: -2, right: -2,
      width: 14, height: 14,
      borderRadius: 7,
      backgroundColor: c.ochre,
      justifyContent: "center",
      alignItems: "center",
    },
    cartBadgeText: { fontFamily: fonts.monoBold, fontSize: 8, color: c.paper },

    filterBar: {
      backgroundColor: c.paper,
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
    },
    pillScroll: { maxHeight: 56 },
    pillRow: {
      paddingHorizontal: space[4],
      paddingVertical: 10,
      gap: 8,
      alignItems: "center",
    },
    pill: {
      height: 36,
      paddingHorizontal: 12,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.ghost,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.paper,
    },
    pillActive: {
      backgroundColor: c.ochre,
      borderColor: c.ochre,
    },
    pillText: {
      fontFamily: fonts.sansBold,
      fontSize: 13,
      color: c.inkSoft,
    },
    pillTextActive: { color: c.paper },

    sortRow: {
      height: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: space[4],
    },
    sortLeft: { flexDirection: "row", gap: 8 },
    sortBtn: {
      height: 32,
      paddingHorizontal: 12,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: c.ghost,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    sortBtnText: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },
    sortChevron: { fontFamily: fonts.sans, fontSize: 8, color: c.inkSoft, marginTop: 1 },
    viewToggle: {
      flexDirection: "row",
      gap: 4,
      backgroundColor: c.paperDeep,
      padding: 4,
      borderRadius: 8,
    },
    viewBtn: {
      width: 28, height: 28,
      borderRadius: 6,
      justifyContent: "center",
      alignItems: "center",
    },
    viewBtnActive: {
      backgroundColor: c.ink,
      shadowColor: c.ink,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 1,
    },

    resultsCount: {
      fontFamily: fonts.mono,
      fontSize: 10,
      color: c.mute,
      marginHorizontal: space[4],
      marginTop: 12,
      marginBottom: 4,
    },

    listContent: { paddingHorizontal: 16, paddingBottom: 80 },
    gridRow: { gap: 12, marginBottom: 16 },

    wishlistBtn: {
      position: "absolute",
      top: 8, right: 8,
      width: 28, height: 28,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.9)",
      justifyContent: "center",
      alignItems: "center",
      ...shadows.card,
    },

    gridCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
    },
    gridCardImage: {
      aspectRatio: 1,
      overflow: "hidden",
      position: "relative",
    },
    imagePlaceholder: { backgroundColor: c.paperDeep },
    gridCardBody: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 16,
      gap: 4,
    },
    makerLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 9,
      color: c.mute,
      letterSpacing: 0.5,
    },
    productName: {
      fontFamily: fonts.sansBold,
      fontSize: 13,
      color: c.ink,
      lineHeight: 18,
      minHeight: 36,
      marginBottom: 8,
    },
    gridCardFooter: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: "auto" as any,
    },
    addCircleBtn: {
      width: 28, height: 28,
      borderRadius: 14,
      backgroundColor: c.paperDeep,
      justifyContent: "center",
      alignItems: "center",
    },

    listCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      flexDirection: "row",
      alignItems: "stretch",
      gap: 12,
      padding: 12,
      marginBottom: 8,
    },
    listCardImage: {
      width: 100, height: 100,
      borderRadius: 8,
      overflow: "hidden",
      position: "relative",
      flexShrink: 0,
    },
    listCardBody: {
      flex: 1,
      paddingVertical: 4,
      gap: 2,
    },
    listProductName: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
      lineHeight: 19,
    },
    listExcerpt: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: c.inkSoft,
    },
    listCardFooter: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: "auto" as any,
      paddingTop: 8,
    },
    addToBagBtn: {
      height: 32,
      paddingHorizontal: 16,
      borderRadius: radius.full,
      backgroundColor: c.ochre,
      justifyContent: "center",
      alignItems: "center",
    },
    addToBagBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: 11,
      color: c.paper,
    },

    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: space[8],
      gap: 12,
    },
    emptyTitle: {
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
      marginTop: 8,
    },
    emptyBody: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.mute,
      textAlign: "center",
      lineHeight: 21,
      maxWidth: 260,
    },
    clearBtn: {
      height: 48,
      width: 200,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: c.ink,
      justifyContent: "center",
      alignItems: "center",
      marginTop: 4,
    },
    clearBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
    },
  });
}
