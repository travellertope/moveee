import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, ActivityIndicator, NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useCartStore } from "../../store/cartStore";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type {
  ShopProduct, ShopProductDetail,
  ProductVariantColour, ProductVariantSize, HowItsMadeStep,
} from "../../types";

const { width: W } = Dimensions.get("window");

// ── Image Gallery ─────────────────────────────────────────────────────────────

function ImageGallery({
  images, badge, isPro,
}: {
  images: string[]; badge?: string | null; isPro: boolean;
}) {
  const c = useColors();
  const gS = useMemo(() => createGalleryStyles(c), [c]);
  const [idx, setIdx] = useState(0);
  const [liked, setLiked] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const total = images.length || 1;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const newIdx = Math.round(e.nativeEvent.contentOffset.x / W);
    setIdx(newIdx);
  };

  const go = (dir: -1 | 1) => {
    const next = Math.max(0, Math.min(total - 1, idx + dir));
    scrollRef.current?.scrollTo({ x: next * W, animated: true });
    setIdx(next);
  };

  return (
    <View style={gS.container}>
      {badge === "pro_early_access" && (
        <View style={gS.earlyBanner}>
          <Text style={gS.earlyBannerText}>★  EARLY ACCESS — Available to Pro members</Text>
        </View>
      )}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
        style={gS.scroll}
      >
        {images.length > 0 ? images.map((uri, i) => (
          <View key={i} style={gS.slide}>
            <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
        )) : (
          <View style={[gS.slide, gS.placeholder]} />
        )}
      </ScrollView>

      {total > 1 && (
        <>
          <TouchableOpacity style={[gS.arrow, gS.arrowLeft]} onPress={() => go(-1)}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={[gS.arrow, gS.arrowRight]} onPress={() => go(1)}>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        style={[gS.wishlist, badge === "pro_early_access" && { top: 52 }]}
        onPress={() => setLiked((v) => !v)}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={20}
          color={liked ? c.error : c.ink}
        />
      </TouchableOpacity>

      {total > 1 && (
        <View style={gS.bottom}>
          <View style={gS.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  gS.dot,
                  { width: i === idx ? 8 : 6, height: i === idx ? 8 : 6, opacity: i === idx ? 1 : 0.4 },
                ]}
              />
            ))}
          </View>
          <Text style={gS.countText}>{total} images</Text>
        </View>
      )}
    </View>
  );
}

function createGalleryStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { width: W, height: 360, position: "relative", backgroundColor: c.paperDeep },
    scroll: { width: W, height: 360 },
    slide: { width: W, height: 360 },
    placeholder: { backgroundColor: c.paperDeep },
    earlyBanner: {
      position: "absolute",
      top: 0, left: 0, right: 0,
      zIndex: 20,
      backgroundColor: "rgba(179,130,56,0.9)",
      paddingVertical: 7,
      alignItems: "center",
    },
    earlyBannerText: {
      fontFamily: fonts.sansBold,
      fontSize: 10,
      color: "#fff",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    arrow: {
      position: "absolute",
      top: "50%",
      marginTop: -18,
      width: 36, height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(255,255,255,0.3)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 10,
    },
    arrowLeft:  { left: 8 },
    arrowRight: { right: 8 },
    wishlist: {
      position: "absolute",
      top: 16, right: 16,
      width: 40, height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.9)",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 20,
      ...shadows.card,
    },
    bottom: {
      position: "absolute",
      bottom: 44, left: 0, right: 0,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
    },
    dots: { flexDirection: "row", gap: 6, alignItems: "center" },
    dot: { borderRadius: 4, backgroundColor: "#fff" },
    countText: { fontFamily: fonts.mono, fontSize: 10, color: "#fff" },
  });
}

// ── Colour Selector ───────────────────────────────────────────────────────────

function ColourSelector({
  colours,
}: {
  colours: ProductVariantColour[];
}) {
  const c = useColors();
  const cS = useMemo(() => createColourStyles(c), [c]);
  const [selected, setSelected] = useState(0);
  if (!colours.length) return null;

  return (
    <View style={cS.wrap}>
      <View style={cS.labelRow}>
        <Text style={cS.label}>Colour</Text>
        <Text style={cS.labelValue}>{colours[selected]?.name ?? ""}</Text>
      </View>
      <View style={cS.swatches}>
        {colours.map((col, i) => {
          const active = i === selected;
          const hexColor = col.hex || c.ghost;
          return (
            <TouchableOpacity
              key={i}
              style={[cS.swatchOuter, active && cS.swatchOuterActive]}
              onPress={() => col.available && setSelected(i)}
              disabled={!col.available}
            >
              <View style={[cS.swatchInner, { backgroundColor: hexColor }]} />
              {!col.available && <View style={cS.swatchUnavailable} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function createColourStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginTop: 24 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    label: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink },
    labelValue: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginLeft: 4 },
    swatches: { flexDirection: "row", alignItems: "center", gap: 8 },
    swatchOuter: {
      width: 44, height: 44,
      borderRadius: 22,
      borderWidth: 2,
      borderColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    swatchOuterActive: { borderColor: c.ink },
    swatchInner: {
      width: 36, height: 36,
      borderRadius: 18,
    },
    swatchUnavailable: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.5)",
    },
  });
}

// ── Size Selector ─────────────────────────────────────────────────────────────

function SizeSelector({ sizes }: { sizes: ProductVariantSize[] }) {
  const c = useColors();
  const szS = useMemo(() => createSizeStyles(c), [c]);
  const [selected, setSelected] = useState<number | null>(null);
  if (!sizes.length) return null;

  const firstAvail = sizes.findIndex((s) => s.available);

  const getActive = () => (selected !== null ? selected : firstAvail);

  return (
    <View style={szS.wrap}>
      <View style={szS.labelRow}>
        <Text style={szS.label}>Size</Text>
        {getActive() >= 0 && (
          <Text style={szS.labelValue}>{sizes[getActive()]?.name}</Text>
        )}
      </View>
      <View style={szS.chips}>
        {sizes.map((s, i) => {
          const active = getActive() === i;
          return (
            <TouchableOpacity
              key={i}
              style={[
                szS.chip,
                active && szS.chipActive,
                !s.available && szS.chipDisabled,
              ]}
              onPress={() => s.available && setSelected(i)}
              disabled={!s.available}
            >
              <Text
                style={[
                  szS.chipText,
                  active && szS.chipTextActive,
                  !s.available && szS.chipTextDisabled,
                ]}
              >
                {s.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function createSizeStyles(c: ColorPalette) {
  return StyleSheet.create({
    wrap: { marginTop: 24 },
    labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
    label: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink },
    labelValue: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginLeft: 4 },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      minWidth: 48, height: 40,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: c.ghost,
      justifyContent: "center",
      alignItems: "center",
    },
    chipActive: { backgroundColor: c.ink, borderColor: c.ink },
    chipDisabled: { opacity: 0.4 },
    chipText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    chipTextActive: { color: c.paper, fontFamily: fonts.sansBold },
    chipTextDisabled: { textDecorationLine: "line-through" },
  });
}

// ── Accordion ─────────────────────────────────────────────────────────────────

function AccordionItem({
  title, children, defaultOpen,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const c = useColors();
  const acS = useMemo(() => createAccordionStyles(c), [c]);
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <View style={acS.item}>
      <TouchableOpacity style={acS.header} onPress={() => setOpen((v) => !v)}>
        <Text style={acS.title}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={c.inkSoft}
        />
      </TouchableOpacity>
      {open && <View style={acS.body}>{children}</View>}
    </View>
  );
}

function createAccordionStyles(c: ColorPalette) {
  return StyleSheet.create({
    item: { borderBottomWidth: 1, borderBottomColor: `${c.ghost}50` },
    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },
    title: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    body: { paddingHorizontal: 4, paddingBottom: 16 },
  });
}

// ── Delivery Strip ────────────────────────────────────────────────────────────

function DeliveryStrip() {
  const c = useColors();
  const dS = useMemo(() => createDeliveryStyles(c), [c]);
  const items = [
    { icon: "swap-horizontal-outline" as const, label: "Free delivery\nover £75" },
    { icon: "return-down-back-outline" as const, label: "Free returns\nin 14 days" },
    { icon: "checkmark-circle-outline" as const, label: "Vetted\nmaker" },
  ];
  return (
    <View style={dS.strip}>
      {items.map((item, i) => (
        <View key={i} style={[dS.cell, i > 0 && dS.cellBorder]}>
          <Ionicons name={item.icon} size={16} color={c.ochre} />
          <Text style={dS.cellText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function createDeliveryStyles(c: ColorPalette) {
  return StyleSheet.create({
    strip: {
      flexDirection: "row",
      backgroundColor: c.paperDeep,
      borderRadius: 10,
      padding: 12,
      marginTop: 24,
    },
    cell: { flex: 1, alignItems: "center", gap: 4 },
    cellBorder: { borderLeftWidth: 1, borderLeftColor: `${c.ghost}50` },
    cellText: {
      fontFamily: fonts.sans,
      fontSize: 10,
      color: c.mute,
      textAlign: "center",
      lineHeight: 14,
    },
  });
}

// ── How It's Made ─────────────────────────────────────────────────────────────

function HowItsMadeSection({ steps }: { steps: HowItsMadeStep[] }) {
  const c = useColors();
  const hmS = useMemo(() => createHowItsMadeStyles(c), [c]);
  if (!steps.length) return null;
  return (
    <View style={hmS.section}>
      <Text style={hmS.heading}>How It's Made</Text>
      <View style={hmS.steps}>
        {steps.map((s, i) => (
          <View key={i} style={[hmS.step, shadows.card]}>
            <View style={hmS.stepNum}>
              <Text style={hmS.stepNumText}>{s.step ?? i + 1}</Text>
            </View>
            <View style={hmS.stepBody}>
              <View style={hmS.stepRow}>
                <Text style={hmS.stepTitle}>{s.title}</Text>
                <Text style={hmS.stepDuration}>{s.duration}</Text>
              </View>
              <Text style={hmS.stepDesc}>{s.description}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function createHowItsMadeStyles(c: ColorPalette) {
  return StyleSheet.create({
    section: {
      marginTop: 32,
      marginHorizontal: -24,
      backgroundColor: c.paperDeep,
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    heading: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink, marginBottom: 24 },
    steps: { gap: 12 },
    step: {
      backgroundColor: c.paper,
      borderRadius: 10,
      padding: 16,
      flexDirection: "row",
      gap: 12,
    },
    stepNum: {
      width: 32, height: 32,
      borderRadius: 16,
      backgroundColor: c.ochre,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    stepNumText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#fff" },
    stepBody: { flex: 1 },
    stepRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    stepTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, flex: 1 },
    stepDuration: {
      fontFamily: fonts.mono,
      fontSize: 10,
      color: c.mute,
      fontStyle: "italic",
      marginLeft: 8,
      marginTop: 1,
      flexShrink: 0,
    },
    stepDesc: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft, marginTop: 4, lineHeight: 16 },
  });
}

// ── Maker Card ────────────────────────────────────────────────────────────────

function MakerCard({ detail }: { detail: ShopProductDetail }) {
  const c = useColors();
  const mkS = useMemo(() => createMakerStyles(c), [c]);
  const stars = Math.round(detail.makerRating);
  return (
    <View style={mkS.card}>
      <View style={mkS.cardHeader}>
        <Text style={mkS.cardTitle}>About the Maker</Text>
        <TouchableOpacity onPress={() => {}}>
          <Text style={mkS.cardAction}>See full shop →</Text>
        </TouchableOpacity>
      </View>
      <View style={mkS.makerRow}>
        <View style={mkS.avatarRing}>
          <View style={mkS.avatarInner}>
            {detail.makerAvatarUrl ? (
              <Image
                source={{ uri: detail.makerAvatarUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.paperDeep }]} />
            )}
          </View>
        </View>
        <View style={mkS.makerInfo}>
          <Text style={mkS.makerName}>{detail.makerName}</Text>
          {(detail.makerCity || detail.makerSince) && (
            <Text style={mkS.makerMeta}>
              {detail.makerCity ? `📍 ${detail.makerCity}` : ""}
              {detail.makerCity && detail.makerSince ? " · " : ""}
              {detail.makerSince ? `Since ${detail.makerSince}` : ""}
            </Text>
          )}
          {detail.makerRating > 0 && (
            <Text style={mkS.makerRating}>
              {"★".repeat(Math.min(5, stars))}{"☆".repeat(Math.max(0, 5 - stars))} {detail.makerRating.toFixed(1)} · {detail.makerProductCount} products
            </Text>
          )}
        </View>
      </View>
      {detail.makerBio ? (
        <Text style={mkS.bio} numberOfLines={3}>{detail.makerBio}</Text>
      ) : null}
      <TouchableOpacity>
        <Text style={mkS.viewAll}>View all their products →</Text>
      </TouchableOpacity>
    </View>
  );
}

function createMakerStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      marginTop: 24,
      backgroundColor: c.paper,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${c.ghost}30`,
      padding: 16,
      ...shadows.card,
    },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    cardAction: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },
    makerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    avatarRing: {
      width: 56, height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: c.gold,
      padding: 2,
      flexShrink: 0,
    },
    avatarInner: {
      flex: 1,
      borderRadius: 24,
      overflow: "hidden",
      backgroundColor: c.paperDeep,
    },
    makerInfo: { flex: 1 },
    makerName: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    makerMeta: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    makerRating: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 4 },
    bio: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.inkSoft,
      lineHeight: 19,
      marginTop: 12,
    },
    viewAll: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.ochre,
      marginTop: 8,
    },
  });
}

// ── Related Products ──────────────────────────────────────────────────────────

function RelatedProducts({
  products, makerName, onPress,
}: {
  products: ShopProduct[]; makerName: string; onPress: (p: ShopProduct) => void;
}) {
  const c = useColors();
  const rpS = useMemo(() => createRelatedStyles(c), [c]);
  if (!products.length) return null;
  return (
    <View style={rpS.section}>
      <View style={rpS.header}>
        <Text style={rpS.title}>From {makerName}</Text>
        <TouchableOpacity><Text style={rpS.seeMore}>See more →</Text></TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={rpS.scroll}
        style={rpS.scrollWrap}
      >
        {products.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[rpS.card, shadows.card]}
            onPress={() => onPress(p)}
            activeOpacity={0.85}
          >
            <View style={rpS.image}>
              {p.imageUrl ? (
                <Image source={{ uri: p.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <View style={[StyleSheet.absoluteFill, rpS.placeholder]} />
              )}
            </View>
            <View style={rpS.body}>
              <Text style={rpS.name} numberOfLines={1}>{p.name}</Text>
              <Text style={rpS.price}>{p.currencySymbol}{p.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function createRelatedStyles(c: ColorPalette) {
  return StyleSheet.create({
    section: { marginTop: 32 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    title: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    seeMore: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },
    scrollWrap: { marginHorizontal: -24 },
    scroll: { paddingHorizontal: 24, gap: 12, paddingBottom: 8 },
    card: {
      width: 160,
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
      flexShrink: 0,
    },
    image: { width: 160, height: 110, position: "relative" },
    placeholder: { backgroundColor: c.paperDeep },
    body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
    name: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink, marginBottom: 4 },
    price: { fontFamily: fonts.monoBold, fontSize: 13, color: c.ink },
  });
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const isPro = user?.tier === "patron";
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);

  const seed: ShopProduct = params?.product;

  const [detail, setDetail] = useState<ShopProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!seed?.id) return;
    api.get<ShopProductDetail>(`${MOBILE_API}/shop/products/${seed.id}`, false)
      .then(setDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [seed?.id]);

  const product = detail ?? seed;
  const images = detail?.images ?? (seed?.imageUrl ? [seed.imageUrl] : []);
  const displayPrice = isPro && detail?.proPrice ? detail.proPrice : product?.price;
  const inStock = product?.stockStatus !== "outofstock";

  const handleAddToBag = () => {
    if (!product) return;
    addItem({
      id:        String(product.id) + (undefined ?? ""),
      productId: product.id,
      title:     product.name,
      brand:     product.makerName,
      variant:   undefined ?? undefined,
      price:     parseFloat(displayPrice ?? product.price) || 0,
      image:     (detail?.images?.[0] ?? product.imageUrl) ?? undefined,
    });
    nav.navigate("Cart");
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.safeTop}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => nav.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={c.ink} />
          </TouchableOpacity>
          <Text style={s.headerSub}>Lifestyle</Text>
          <View style={s.headerRight}>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={24} color={c.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => nav.navigate("Cart")}
              style={{ position: "relative" }}
            >
              <Ionicons name="bag-outline" size={24} color={c.ink} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <ImageGallery images={images} badge={product?.badge} isPro={isPro} />

        <View style={s.card}>
          {loading && !detail ? (
            <ActivityIndicator style={{ paddingVertical: 40 }} color={c.gold} />
          ) : (
            <>
              <View style={s.makerRow}>
                <View style={s.makerLeft}>
                  <Text style={s.makerName}>{product?.makerName?.toUpperCase()}</Text>
                  {product?.makerCity ? (
                    <Text style={s.makerCity}>📍 {product.makerCity}</Text>
                  ) : null}
                </View>
                {detail?.vetted && (
                  <Text style={s.vettedBadge}>Vetted Maker ✓</Text>
                )}
              </View>

              <Text style={s.title}>{product?.name}</Text>

              {(detail?.shortDescription || detail?.description) ? (
                <Text style={s.shortDesc}>
                  {detail.shortDescription || detail.description.replace(/<[^>]+>/g, "").slice(0, 200)}
                </Text>
              ) : null}

              <View style={s.priceBlock}>
                {isPro && detail?.proPrice ? (
                  <>
                    <Text style={s.priceRegularStruck}>
                      Regular price {product?.currencySymbol}{product?.regularPrice}
                    </Text>
                    <View style={s.proRow}>
                      <Text style={s.proPrice}>
                        {product?.currencySymbol}{detail.proPrice}
                      </Text>
                      <View style={s.proSavingsBadge}>
                        <Text style={s.proSavingsText}>
                          ★ Connect Pro · Saving {product?.currencySymbol}
                          {(parseFloat(product?.regularPrice || "0") - parseFloat(detail.proPrice)).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={s.price}>{product?.currencySymbol}{product?.price}</Text>
                    {detail?.proPrice && (
                      <View style={s.proUpsellBox}>
                        <Text style={s.proUpsellMain}>
                          ★ Connect Pro price: {product?.currencySymbol}{detail.proPrice}
                        </Text>
                        <Text style={s.proUpsellSub}>
                          Connect Pro members save 10% ·{" "}
                          <Text style={{ color: c.ochre }}>Upgrade →</Text>
                        </Text>
                      </View>
                    )}
                  </>
                )}
                <Text style={s.stockLabel}>
                  {inStock
                    ? `In stock${product?.stockQuantity ? ` · ${product.stockQuantity} available` : ""}`
                    : "Out of stock"}
                </Text>
              </View>

              {detail?.colours.length ? (
                <ColourSelector colours={detail.colours} />
              ) : null}

              {detail?.sizes.length ? (
                <SizeSelector sizes={detail.sizes} />
              ) : null}

              <View style={s.addSection}>
                <View style={s.qtyRow}>
                  <Text style={s.qtyLabel}>Qty</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons name="remove" size={16} color={c.ink} />
                    </TouchableOpacity>
                    <Text style={s.stepNum}>{qty}</Text>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => setQty((q) => q + 1)}
                    >
                      <Ionicons name="add" size={16} color={c.ink} />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={[s.addBtn, !inStock && s.addBtnDisabled]}
                  onPress={handleAddToBag}
                  disabled={!inStock}
                >
                  <Text style={s.addBtnText}>
                    {inStock ? "Add to Bag" : "Out of Stock"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.saveForLater}>
                  <Ionicons name="heart-outline" size={14} color={c.mute} />
                  <Text style={s.saveForLaterText}>Save for later</Text>
                </TouchableOpacity>
              </View>

              <DeliveryStrip />

              <View style={[s.accordion, { marginTop: 24 }]}>
                {detail?.description ? (
                  <AccordionItem title="Description" defaultOpen>
                    <Text style={s.accordionBody}>
                      {detail.description.replace(/<[^>]+>/g, "")}
                    </Text>
                  </AccordionItem>
                ) : null}
                <AccordionItem title="Materials & Care">
                  <Text style={s.accordionBody}>Details about materials and care instructions.</Text>
                </AccordionItem>
                <AccordionItem title="Delivery & Returns">
                  <Text style={s.accordionBody}>Free delivery on orders over £75. Free returns within 14 days.</Text>
                </AccordionItem>
                <AccordionItem title="About the Maker">
                  <Text style={s.accordionBody}>{detail?.makerBio || `Handcrafted by ${product?.makerName}.`}</Text>
                </AccordionItem>
                {detail?.asSeenIn && (
                  <AccordionItem title="As Seen In">
                    <Text style={s.accordionBody}>{detail.asSeenIn.title}</Text>
                  </AccordionItem>
                )}
              </View>

              {detail?.howItsMade?.length ? (
                <HowItsMadeSection steps={detail.howItsMade} />
              ) : null}

              {detail?.asSeenIn && (
                <View style={s.asSeenInBox}>
                  <Ionicons name="book-outline" size={24} color={c.ochre} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.asSeenInLabel}>As seen in</Text>
                    <Text style={s.asSeenInTitle} numberOfLines={2}>
                      {detail.asSeenIn.title}
                    </Text>
                    <TouchableOpacity
                      onPress={() => nav.navigate("Magazine", {
                        screen: "Article",
                        params: { slug: detail.asSeenIn!.slug },
                      })}
                    >
                      <Text style={s.asSeenInLink}>Read the story →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {detail && <MakerCard detail={detail} />}

              {detail?.relatedProducts?.length ? (
                <RelatedProducts
                  products={detail.relatedProducts}
                  makerName={detail.makerName}
                  onPress={(p) => nav.push("ProductDetail", { product: p })}
                />
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]} style={s.stickyBar}>
        <View style={s.stickyBarInner}>
          <View>
            {isPro && detail?.proPrice ? (
              <Text style={s.stickyPricePro}>
                {product?.currencySymbol}{detail.proPrice} ★
              </Text>
            ) : (
              <Text style={s.stickyPrice}>
                {product?.currencySymbol}{product?.price}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={[s.stickyAddBtn, !inStock && s.addBtnDisabled]}
            onPress={handleAddToBag}
            disabled={!inStock}
          >
            <Text style={s.stickyAddBtnText}>Add to Bag</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.paper },
    safeTop: { backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.rule },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 0 },

    header: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      gap: 8,
    },
    backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-start" },
    headerSub: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: c.mute, textAlign: "center" },
    headerRight: { flexDirection: "row", gap: 12, alignItems: "center" },

    card: {
      backgroundColor: c.paper,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      marginTop: -32,
      zIndex: 20,
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 140,
    },

    makerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    makerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
    makerName: {
      fontFamily: fonts.sansBold,
      fontSize: 9,
      color: c.mute,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    makerCity: { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    vettedBadge: {
      fontFamily: fonts.sansBold,
      fontSize: 10,
      color: "#2D6A4F",
    },

    title: {
      fontFamily: fonts.serifBold,
      fontSize: 26,
      color: c.ink,
      lineHeight: 32,
    },
    shortDesc: {
      fontFamily: fonts.sans,
      fontSize: 15,
      color: c.inkSoft,
      lineHeight: 22,
      marginTop: 12,
    },

    priceBlock: { marginTop: 16, position: "relative" },
    price: { fontFamily: fonts.sansBold, fontSize: 24, color: c.ink },
    priceRegularStruck: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.ghost,
      textDecorationLine: "line-through",
    },
    proRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
    proPrice: { fontFamily: fonts.sansBold, fontSize: 24, color: c.gold },
    proSavingsBadge: {
      backgroundColor: `${c.paperWarm}80`,
      borderWidth: 1,
      borderColor: `${c.gold}20`,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    proSavingsText: { fontFamily: fonts.sans, fontSize: 12, color: "#2D6A4F" },
    proUpsellBox: {
      marginTop: 4,
      backgroundColor: `${c.paperWarm}80`,
      borderWidth: 1,
      borderColor: `${c.gold}20`,
      borderRadius: 8,
      padding: 10,
    },
    proUpsellMain: { fontFamily: fonts.sans, fontSize: 14, color: c.gold },
    proUpsellSub: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginTop: 2 },
    stockLabel: {
      position: "absolute",
      top: 8, right: 0,
      fontFamily: fonts.mono,
      fontSize: 10,
      color: "#2D6A4F",
    },

    addSection: {
      marginTop: 24,
      paddingTop: 24,
      borderTopWidth: 1,
      borderTopColor: `${c.ghost}50`,
    },
    qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
    qtyLabel: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    stepper: { flexDirection: "row", alignItems: "center" },
    stepBtn: {
      width: 36, height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: c.ghost,
      justifyContent: "center",
      alignItems: "center",
    },
    stepNum: {
      width: 48,
      textAlign: "center",
      fontFamily: fonts.sansBold,
      fontSize: 15,
      color: c.ink,
    },
    addBtn: {
      height: 56,
      borderRadius: 28,
      backgroundColor: c.ochre,
      justifyContent: "center",
      alignItems: "center",
    },
    addBtnDisabled: { opacity: 0.5 },
    addBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
    saveForLater: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
      paddingVertical: 4,
    },
    saveForLaterText: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },

    accordion: { borderTopWidth: 1, borderTopColor: `${c.ghost}50` },
    accordionBody: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.inkSoft,
      lineHeight: 22,
    },

    asSeenInBox: {
      marginTop: 32,
      backgroundColor: c.paperWarm,
      borderRadius: 10,
      padding: 16,
      flexDirection: "row",
      gap: 12,
      alignItems: "flex-start",
      borderWidth: 1,
      borderColor: `${c.ghost}30`,
    },
    asSeenInLabel: { fontFamily: fonts.sans, fontSize: 11, color: c.mute },
    asSeenInTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
      lineHeight: 19,
      marginTop: 2,
    },
    asSeenInLink: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre, marginTop: 4 },

    stickyBar: {
      backgroundColor: c.paper,
      borderTopWidth: 1,
      borderTopColor: c.rule,
      ...shadows.card,
    },
    stickyBarInner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    stickyPrice: { fontFamily: fonts.sansBold, fontSize: 20, color: c.ink },
    stickyPricePro: { fontFamily: fonts.sansBold, fontSize: 20, color: c.gold },
    stickyAddBtn: {
      width: 160,
      height: 48,
      borderRadius: 24,
      backgroundColor: c.ochre,
      justifyContent: "center",
      alignItems: "center",
      ...shadows.card,
    },
    stickyAddBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
  });
}
