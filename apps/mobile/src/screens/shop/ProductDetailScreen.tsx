import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, Dimensions, Linking, ActivityIndicator, NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { useCartStore } from "../../store/cartStore";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
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
      {/* Early access banner */}
      {badge === "pro_early_access" && (
        <View style={gS.earlyBanner}>
          <Text style={gS.earlyBannerText}>★  EARLY ACCESS — Available to Pro members</Text>
        </View>
      )}

      {/* Image scroll */}
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

      {/* Prev / Next arrows */}
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

      {/* Wishlist */}
      <TouchableOpacity
        style={[gS.wishlist, badge === "pro_early_access" && { top: 52 }]}
        onPress={() => setLiked((v) => !v)}
      >
        <Ionicons
          name={liked ? "heart" : "heart-outline"}
          size={20}
          color={liked ? colors.error : colors.ink}
        />
      </TouchableOpacity>

      {/* Bottom: dots + count */}
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

const gS = StyleSheet.create({
  container: { width: W, height: 360, position: "relative", backgroundColor: colors.paperDeep },
  scroll: { width: W, height: 360 },
  slide: { width: W, height: 360 },
  placeholder: { backgroundColor: colors.paperDeep },
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

// ── Colour Selector ───────────────────────────────────────────────────────────

function ColourSelector({
  colours,
}: {
  colours: ProductVariantColour[];
}) {
  const [selected, setSelected] = useState(0);
  if (!colours.length) return null;

  return (
    <View style={cS.wrap}>
      <View style={cS.labelRow}>
        <Text style={cS.label}>Colour</Text>
        <Text style={cS.labelValue}>{colours[selected]?.name ?? ""}</Text>
      </View>
      <View style={cS.swatches}>
        {colours.map((c, i) => {
          const active = i === selected;
          const hexColor = c.hex || colors.ghost;
          return (
            <TouchableOpacity
              key={i}
              style={[cS.swatchOuter, active && cS.swatchOuterActive]}
              onPress={() => c.available && setSelected(i)}
              disabled={!c.available}
            >
              <View style={[cS.swatchInner, { backgroundColor: hexColor }]} />
              {!c.available && <View style={cS.swatchUnavailable} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const cS = StyleSheet.create({
  wrap: { marginTop: 24 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  labelValue: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, marginLeft: 4 },
  swatches: { flexDirection: "row", alignItems: "center", gap: 8 },
  swatchOuter: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  swatchOuterActive: { borderColor: colors.ink },
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

// ── Size Selector ─────────────────────────────────────────────────────────────

function SizeSelector({ sizes }: { sizes: ProductVariantSize[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!sizes.length) return null;

  // Auto-select first available
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

const szS = StyleSheet.create({
  wrap: { marginTop: 24 },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  label: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink },
  labelValue: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, marginLeft: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minWidth: 48, height: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.ghost,
    justifyContent: "center",
    alignItems: "center",
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipDisabled: { opacity: 0.4 },
  chipText: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft },
  chipTextActive: { color: "#fff", fontFamily: fonts.sansBold },
  chipTextDisabled: { textDecorationLine: "line-through" },
});

// ── Accordion ─────────────────────────────────────────────────────────────────

function AccordionItem({
  title, children, defaultOpen,
}: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <View style={acS.item}>
      <TouchableOpacity style={acS.header} onPress={() => setOpen((v) => !v)}>
        <Text style={acS.title}>{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          color={colors.inkSoft}
        />
      </TouchableOpacity>
      {open && <View style={acS.body}>{children}</View>}
    </View>
  );
}

const acS = StyleSheet.create({
  item: { borderBottomWidth: 1, borderBottomColor: `${colors.ghost}50` },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  title: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  body: { paddingHorizontal: 4, paddingBottom: 16 },
});

// ── Delivery Strip ────────────────────────────────────────────────────────────

function DeliveryStrip() {
  const items = [
    { icon: "swap-horizontal-outline" as const, label: "Free delivery\nover £75" },
    { icon: "return-down-back-outline" as const, label: "Free returns\nin 14 days" },
    { icon: "checkmark-circle-outline" as const, label: "Vetted\nmaker" },
  ];
  return (
    <View style={dS.strip}>
      {items.map((item, i) => (
        <View key={i} style={[dS.cell, i > 0 && dS.cellBorder]}>
          <Ionicons name={item.icon} size={16} color={colors.ochre} />
          <Text style={dS.cellText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const dS = StyleSheet.create({
  strip: {
    flexDirection: "row",
    backgroundColor: colors.paperDeep,
    borderRadius: 10,
    padding: 12,
    marginTop: 24,
  },
  cell: { flex: 1, alignItems: "center", gap: 4 },
  cellBorder: { borderLeftWidth: 1, borderLeftColor: `${colors.ghost}50` },
  cellText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mute,
    textAlign: "center",
    lineHeight: 14,
  },
});

// ── How It's Made ─────────────────────────────────────────────────────────────

function HowItsMadeSection({ steps }: { steps: HowItsMadeStep[] }) {
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

const hmS = StyleSheet.create({
  section: {
    marginTop: 32,
    marginHorizontal: -24,
    backgroundColor: colors.paperDeep,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  heading: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink, marginBottom: 24 },
  steps: { gap: 12 },
  step: {
    backgroundColor: colors.paper,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    gap: 12,
  },
  stepNum: {
    width: 32, height: 32,
    borderRadius: 16,
    backgroundColor: colors.ochre,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stepNumText: { fontFamily: fonts.sansBold, fontSize: 13, color: "#fff" },
  stepBody: { flex: 1 },
  stepRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  stepTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.ink, flex: 1 },
  stepDuration: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.mute,
    fontStyle: "italic",
    marginLeft: 8,
    marginTop: 1,
    flexShrink: 0,
  },
  stepDesc: { fontFamily: fonts.sans, fontSize: 12, color: colors.inkSoft, marginTop: 4, lineHeight: 16 },
});

// ── Maker Card ────────────────────────────────────────────────────────────────

function MakerCard({ detail }: { detail: ShopProductDetail }) {
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
        {/* Avatar */}
        <View style={mkS.avatarRing}>
          <View style={mkS.avatarInner}>
            {detail.makerAvatarUrl ? (
              <Image
                source={{ uri: detail.makerAvatarUrl }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.paperDeep }]} />
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

const mkS = StyleSheet.create({
  card: {
    marginTop: 24,
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${colors.ghost}30`,
    padding: 16,
    ...shadows.card,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  cardTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  cardAction: { fontFamily: fonts.sans, fontSize: 13, color: colors.ochre },
  makerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarRing: {
    width: 56, height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: 2,
    flexShrink: 0,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: colors.paperDeep,
  },
  makerInfo: { flex: 1 },
  makerName: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink },
  makerMeta: { fontFamily: fonts.mono, fontSize: 11, color: colors.mute, marginTop: 2 },
  makerRating: { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, marginTop: 4 },
  bio: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    marginTop: 12,
  },
  viewAll: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.ochre,
    marginTop: 8,
  },
});

// ── Related Products ──────────────────────────────────────────────────────────

function RelatedProducts({
  products, makerName, onPress,
}: {
  products: ShopProduct[]; makerName: string; onPress: (p: ShopProduct) => void;
}) {
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

const rpS = StyleSheet.create({
  section: { marginTop: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  seeMore: { fontFamily: fonts.sans, fontSize: 13, color: colors.ochre },
  scrollWrap: { marginHorizontal: -24 },
  scroll: { paddingHorizontal: 24, gap: 12, paddingBottom: 8 },
  card: {
    width: 160,
    backgroundColor: colors.paper,
    borderRadius: 12,
    overflow: "hidden",
    flexShrink: 0,
  },
  image: { width: 160, height: 110, position: "relative" },
  placeholder: { backgroundColor: colors.paperDeep },
  body: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
  name: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink, marginBottom: 4 },
  price: { fontFamily: fonts.monoBold, fontSize: 13, color: colors.ink },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const nav = useNavigation<any>();
  const { params } = useRoute<any>();
  const { user } = useAuthStore();
  const { increment } = useCartStore();
  const isPro = user?.tier === "patron";

  // Basic product from params; full detail fetched below
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
    const url = `https://themoveee.com/shop/${product?.slug}`;
    Linking.openURL(url).catch(() => {});
    increment();
  };

  return (
    <View style={s.root}>
      <SafeAreaView edges={["top"]} style={s.safeTop}>
        {/* ── Header ─────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => nav.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={s.headerSub}>Lifestyle</Text>
          <View style={s.headerRight}>
            <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="share-social-outline" size={24} color={colors.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => nav.navigate("Cart")}
              style={{ position: "relative" }}
            >
              <Ionicons name="bag-outline" size={24} color={colors.ink} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* ── Content scroll ─────────────────────────────────────── */}
      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* Gallery */}
        <ImageGallery images={images} badge={product?.badge} isPro={isPro} />

        {/* Content card overlaps gallery */}
        <View style={s.card}>
          {loading && !detail ? (
            <ActivityIndicator style={{ paddingVertical: 40 }} color={colors.gold} />
          ) : (
            <>
              {/* Maker row */}
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

              {/* Title */}
              <Text style={s.title}>{product?.name}</Text>

              {/* Short description */}
              {(detail?.shortDescription || detail?.description) ? (
                <Text style={s.shortDesc}>
                  {detail.shortDescription || detail.description.replace(/<[^>]+>/g, "").slice(0, 200)}
                </Text>
              ) : null}

              {/* Price block */}
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
                          <Text style={{ color: colors.ochre }}>Upgrade →</Text>
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

              {/* Colour selector */}
              {detail?.colours.length ? (
                <ColourSelector colours={detail.colours} />
              ) : null}

              {/* Size selector */}
              {detail?.sizes.length ? (
                <SizeSelector sizes={detail.sizes} />
              ) : null}

              {/* Qty + Add to Bag */}
              <View style={s.addSection}>
                {/* Qty stepper */}
                <View style={s.qtyRow}>
                  <Text style={s.qtyLabel}>Qty</Text>
                  <View style={s.stepper}>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => setQty((q) => Math.max(1, q - 1))}
                    >
                      <Ionicons name="remove" size={16} color={colors.ink} />
                    </TouchableOpacity>
                    <Text style={s.stepNum}>{qty}</Text>
                    <TouchableOpacity
                      style={s.stepBtn}
                      onPress={() => setQty((q) => q + 1)}
                    >
                      <Ionicons name="add" size={16} color={colors.ink} />
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
                  <Ionicons name="heart-outline" size={14} color={colors.mute} />
                  <Text style={s.saveForLaterText}>Save for later</Text>
                </TouchableOpacity>
              </View>

              {/* Delivery strip */}
              <DeliveryStrip />

              {/* Accordion tabs */}
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

              {/* How It's Made */}
              {detail?.howItsMade?.length ? (
                <HowItsMadeSection steps={detail.howItsMade} />
              ) : null}

              {/* As Seen In box */}
              {detail?.asSeenIn && (
                <View style={s.asSeenInBox}>
                  <Ionicons name="book-outline" size={24} color={colors.ochre} />
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

              {/* Maker card */}
              {detail && <MakerCard detail={detail} />}

              {/* Related products */}
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

      {/* ── Sticky bottom bar ───────────────────────────────────── */}
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  safeTop: { backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.rule },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 0 },

  // Header
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: space[4],
    gap: 8,
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "flex-start" },
  headerSub: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.mute, textAlign: "center" },
  headerRight: { flexDirection: "row", gap: 12, alignItems: "center" },

  // Content card
  card: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -32,
    zIndex: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },

  // Maker row
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
    color: colors.mute,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  makerCity: { fontFamily: fonts.mono, fontSize: 10, color: colors.mute },
  vettedBadge: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: "#2D6A4F",
  },

  // Title
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 26,
    color: colors.ink,
    lineHeight: 32,
  },
  shortDesc: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
    marginTop: 12,
  },

  // Price block
  priceBlock: { marginTop: 16, position: "relative" },
  price: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.ink },
  priceRegularStruck: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.ghost,
    textDecorationLine: "line-through",
  },
  proRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  proPrice: { fontFamily: fonts.sansBold, fontSize: 24, color: colors.gold },
  proSavingsBadge: {
    backgroundColor: `${colors.paperWarm}80`,
    borderWidth: 1,
    borderColor: `${colors.gold}20`,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  proSavingsText: { fontFamily: fonts.sans, fontSize: 12, color: "#2D6A4F" },
  proUpsellBox: {
    marginTop: 4,
    backgroundColor: `${colors.paperWarm}80`,
    borderWidth: 1,
    borderColor: `${colors.gold}20`,
    borderRadius: 8,
    padding: 10,
  },
  proUpsellMain: { fontFamily: fonts.sans, fontSize: 14, color: colors.gold },
  proUpsellSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.mute, marginTop: 2 },
  stockLabel: {
    position: "absolute",
    top: 8, right: 0,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: "#2D6A4F",
  },

  // Add section
  addSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: `${colors.ghost}50`,
  },
  qtyRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  qtyLabel: { fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.ghost,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNum: {
    width: 48,
    textAlign: "center",
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.ink,
  },
  addBtn: {
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.ochre,
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
  saveForLaterText: { fontFamily: fonts.sans, fontSize: 13, color: colors.mute },

  // Accordion body text
  accordion: { borderTopWidth: 1, borderTopColor: `${colors.ghost}50` },
  accordionBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
  },

  // As Seen In
  asSeenInBox: {
    marginTop: 32,
    backgroundColor: colors.paperWarm,
    borderRadius: 10,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: `${colors.ghost}30`,
  },
  asSeenInLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.mute },
  asSeenInTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 19,
    marginTop: 2,
  },
  asSeenInLink: { fontFamily: fonts.sans, fontSize: 13, color: colors.ochre, marginTop: 4 },

  // Sticky bar
  stickyBar: {
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    ...shadows.card,
  },
  stickyBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  stickyPrice: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.ink },
  stickyPricePro: { fontFamily: fonts.sansBold, fontSize: 20, color: colors.gold },
  stickyAddBtn: {
    width: 160,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.ochre,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
  },
  stickyAddBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },
});
