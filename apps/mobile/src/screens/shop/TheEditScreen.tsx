import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNav } from "../../hooks/useNav";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../auth/authStore";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { api, MOBILE_API } from "../../api/client";

const EDIT_HERO_IMAGE = require("../../../assets/edit-hero.jpg");

interface EditProduct {
  id?: string;
  productId: number;
  slug?: string;
  title: string;
  brand: string;
  city?: string;
  price: number;
  proPrice?: number;
  currency?: string;
  currencySymbol?: string;
  image?: string;
  badge?: "new" | "low_stock" | "sale" | null;
  badgeLabel?: string;
  storySlug?: string;
  storyTitle?: string;
  editorialQuote?: string;
  originalPrice?: number | null;
}

interface EditStory {
  slug: string;
  title: string;
  category: string;
  readTime?: number | null;
  image?: string;
}

interface TheEditResponse {
  hero: EditProduct | null;
  season_picks: EditProduct[];
  stories: EditStory[];
  grid: EditProduct[];
}

export default function TheEditScreen() {
  const nav = useNav();
  const { user } = useAuthStore();
  const { addItem, itemCount } = useCartStore();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [heroPick, setHeroPick]   = useState<EditProduct | null>(null);
  const [seasonPicks, setSeasonPicks] = useState<EditProduct[]>([]);
  const [gridPicks, setGridPicks] = useState<EditProduct[]>([]);
  const [stories, setStories]     = useState<EditStory[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(false);

  const fetchEdit = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await api.get<TheEditResponse>(`${MOBILE_API}/shop/the-edit`, false);
      setHeroPick(data.hero);
      setSeasonPicks(data.season_picks ?? []);
      setGridPicks(data.grid ?? []);
      setStories(data.stories ?? []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEdit(); }, [fetchEdit]);

  const isPatron = user?.tier === "patron";

  const handleAdd = (item: EditProduct) => {
    addItem({
      id: String(item.productId),
      productId: item.productId,
      title: item.title,
      brand: item.brand,
      price: item.price,
      image: item.image,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.paperWarm }]} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>The Edit</Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => nav.navigate("Cart")}
        >
          <Ionicons name="bag-outline" size={22} color={c.ink} />
          {itemCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{itemCount > 9 ? "9+" : itemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <ImageBackground source={EDIT_HERO_IMAGE} style={styles.hero} resizeMode="cover">
          <LinearGradient
            colors={["rgba(20,17,13,0.78)", "rgba(20,17,13,0.42)", "rgba(20,17,13,0.15)"]}
            style={styles.heroOverlay}
          >
            <Text style={styles.heroLabel}>THE MOVEEE EDIT</Text>
            <Text style={styles.heroHeading}>Objects. Stories. Makers.</Text>
            <Text style={styles.heroSub}>
              Curated pieces featured in The Moveee Magazine.
            </Text>
          </LinearGradient>
        </ImageBackground>

        {/* Loading / error state */}
        {loading && (
          <ActivityIndicator color={c.gold} style={{ marginTop: 40 }} />
        )}
        {!loading && error && (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, marginBottom: 12 }}>
              Couldn't load The Edit.
            </Text>
            <TouchableOpacity onPress={fetchEdit}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre }}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* As Seen in Magazine — hero feature card */}
        {!loading && heroPick && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>AS SEEN IN THE MAGAZINE</Text>

            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => nav.navigate("ProductDetail", { id: heroPick.productId })}
              activeOpacity={0.92}
            >
              <View style={styles.featureImageBox}>
                {heroPick.image ? (
                  <Image source={{ uri: heroPick.image }} style={styles.featureImage} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={["#E27D60", "#C5491F"]} style={styles.featureImage} />
                )}
                {heroPick.storySlug && (
                  <TouchableOpacity
                    style={styles.storyTag}
                    onPress={() => nav.navigate("Magazine", { screen: "Article", params: { slug: heroPick.storySlug } } as any)}
                  >
                    <Ionicons name="book-outline" size={10} color={c.inkSoft} />
                    <Text style={styles.storyTagText}>Read Story</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={styles.featureContent}>
                {heroPick.storyTitle ? (
                  <Text style={styles.featureStoryLabel}>📖 Story: {heroPick.storyTitle}</Text>
                ) : null}
                <Text style={styles.featureTitle}>{heroPick.title}</Text>
                <Text style={styles.featureMaker}>
                  {heroPick.brand}{heroPick.city ? ` · ${heroPick.city}` : ""}
                </Text>
                {heroPick.editorialQuote ? (
                  <View style={styles.quoteBlock}>
                    <Text style={styles.quoteText}>"{heroPick.editorialQuote}"</Text>
                  </View>
                ) : null}
                <View style={styles.featurePriceRow}>
                  <Text style={styles.featurePrice}>
                    {heroPick.currencySymbol ?? "£"}{heroPick.price?.toFixed(2)}
                  </Text>
                  {isPatron && heroPick.proPrice ? (
                    <Text style={styles.featureProPrice}>
                      {heroPick.currencySymbol ?? "£"}{heroPick.proPrice.toFixed(2)} for Pro ★
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity style={styles.addToBagBtn} onPress={() => handleAdd(heroPick)}>
                  <Text style={styles.addToBagText}>Add to Bag</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* This Season's Picks */}
        {!loading && seasonPicks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THIS SEASON'S PICKS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.picksScroll}
          >
            {seasonPicks.map((item) => (
              <TouchableOpacity key={item.productId} style={styles.pickCard} onPress={() => nav.navigate("ProductDetail", { id: item.productId })} activeOpacity={0.9}>
                <View style={styles.pickImageBox}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.pickImage} />
                  ) : (
                    <LinearGradient
                      colors={["#d4a373", "#c8a27b"]}
                      style={styles.pickImage}
                    />
                  )}
                  {item.badge && item.badgeLabel && (
                    <View
                      style={[
                        styles.pickBadge,
                        item.badge === "sale"
                          ? styles.pickBadgeSale
                          : styles.pickBadgeDark,
                      ]}
                    >
                      <Text style={styles.pickBadgeText}>{item.badgeLabel}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.pickContent}>
                  <Text style={styles.pickBrand} numberOfLines={1}>
                    {item.brand}
                  </Text>
                  <Text style={styles.pickTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.pickPriceRow}>
                    <View>
                      {item.originalPrice && (
                        <Text style={styles.pickStrike}>£{item.originalPrice}</Text>
                      )}
                      <Text style={styles.pickPrice}>£{item.price}</Text>
                      {item.proPrice && isPatron && (
                        <Text style={styles.pickProPrice}>£{item.proPrice} Pro</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.pickAddBtn}
                      onPress={() => handleAdd(item)}
                    >
                      <Text style={styles.pickAddText}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        )}

        {/* Editorial Stories */}
        {!loading && stories.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STORIES FEATURING THESE OBJECTS</Text>
          {stories.map((story) => (
            <TouchableOpacity
              key={story.slug}
              style={styles.storyCard}
              onPress={() => nav.navigate("Magazine", { screen: "Article", params: { slug: story.slug } } as any)}
            >
              {story.image ? (
                <Image source={{ uri: story.image }} style={styles.storyImage} resizeMode="cover" />
              ) : (
                <LinearGradient colors={["#E27D60", "#E8A87C"]} style={styles.storyImage} />
              )}
              <View style={styles.storyContent}>
                <Text style={styles.storyCat}>{story.category}</Text>
                <Text style={styles.storyTitle} numberOfLines={2}>
                  {story.title}
                </Text>
                {story.readTime ? (
                  <Text style={styles.storyTime}>{story.readTime} min read</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={16} color={c.ghost} />
            </TouchableOpacity>
          ))}
        </View>
        )}

        {/* All Edit Picks Grid */}
        {!loading && gridPicks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ALL EDIT PICKS</Text>
          <View style={styles.grid}>
            {gridPicks.map((item) => (
              <TouchableOpacity key={item.productId} style={styles.gridCard} onPress={() => nav.navigate("ProductDetail", { id: item.productId })} activeOpacity={0.9}>
                <View style={styles.gridImageBox}>
                  {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.gridImage} />
                  ) : (
                    <LinearGradient
                      colors={["#c9b99a", "#d4a373"]}
                      style={styles.gridImage}
                    />
                  )}
                  {item.badge && item.badgeLabel && (
                    <View
                      style={[
                        styles.gridBadge,
                        item.badge === "new"
                          ? styles.gridBadgeNew
                          : item.badge === "low_stock"
                          ? styles.gridBadgeLow
                          : styles.gridBadgeSale,
                      ]}
                    >
                      <Text style={styles.gridBadgeText}>{item.badgeLabel}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.gridContent}>
                  <Text style={styles.gridBrand} numberOfLines={1}>
                    {item.brand}
                  </Text>
                  <Text style={styles.gridTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.gridPriceRow}>
                    <View>
                      <Text style={styles.gridPrice}>£{item.price}</Text>
                      {item.proPrice && isPatron && (
                        <Text style={styles.gridProPrice}>£{item.proPrice} Pro</Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.gridAddBtn}
                      onPress={() => handleAdd(item)}
                    >
                      <Ionicons name="add" size={16} color={c.ink} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        )}

        {/* Sign-off band */}
        <View style={styles.signOff}>
          <View style={styles.signOffLine} />
          <View style={styles.signOffContent}>
            <Text style={styles.signOffHeading}>
              Hand-picked by the Moveee editorial team.
            </Text>
            <Text style={styles.signOffSub}>
              Every object in The Edit has been featured in our magazine.
            </Text>
          </View>
          <View style={styles.signOffLine} />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    headerBtn: { width: 40, alignItems: "center", position: "relative" },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
    },
    cartBadge: {
      position: "absolute",
      top: -4,
      right: -4,
      backgroundColor: "#C5491F",
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      paddingHorizontal: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    cartBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: "#fff" },

    hero: { height: 240 },
    heroOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      padding: 24,
      paddingBottom: 28,
    },
    heroLabel: {
      fontFamily: fonts.monoBold,
      fontSize: 9,
      color: "#B38238",
      letterSpacing: 3,
      marginBottom: 6,
    },
    heroHeading: {
      fontFamily: fonts.serifBold,
      fontSize: 26,
      color: "#fff",
      marginBottom: 4,
    },
    heroSub: { fontFamily: fonts.sans, fontSize: 14, color: "rgba(255,255,255,0.8)" },

    section: { paddingHorizontal: space[4], marginTop: 24 },
    sectionLabel: {
      fontFamily: fonts.mono,
      fontSize: 9,
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 1.5,
      marginBottom: 12,
    },

    // Feature card
    featureCard: {
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
      ...shadows.card,
    },
    featureImageBox: { position: "relative" },
    featureImage: { width: "100%", aspectRatio: 16 / 9 },
    storyTag: {
      position: "absolute",
      top: 10,
      right: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,255,255,0.9)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    storyTagText: { fontFamily: fonts.sansBold, fontSize: 10, color: c.inkSoft },
    featureContent: { padding: 20, gap: 8 },
    featureStoryLabel: { fontFamily: fonts.sans, fontSize: 12, color: c.mute, fontStyle: "italic" },
    featureTitle: { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    featureMaker: { fontFamily: fonts.sans, fontSize: 13, color: c.mute },
    quoteBlock: {
      borderLeftWidth: 2,
      borderLeftColor: "#C5491F",
      backgroundColor: c.paperWarm,
      padding: 12,
      borderRadius: 4,
    },
    quoteText: { fontFamily: fonts.serif, fontSize: 14, color: c.inkSoft, lineHeight: 22, fontStyle: "italic" },
    featurePriceRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    featurePrice: { fontFamily: fonts.sansBold, fontSize: 18, color: c.ink },
    featureProPrice: { fontFamily: fonts.sansBold, fontSize: 12, color: c.gold },
    addToBagBtn: {
      height: 44,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    addToBagText: { fontFamily: fonts.sansBold, fontSize: 15, color: "#fff" },

    // Season picks
    picksScroll: { paddingRight: space[4], gap: 12 },
    pickCard: {
      width: 200,
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
      ...shadows.card,
    },
    pickImageBox: { position: "relative" },
    pickImage: { width: "100%", height: 160 },
    pickBadge: {
      position: "absolute",
      top: 8,
      left: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    pickBadgeSale: { backgroundColor: "#C62828" },
    pickBadgeDark: { backgroundColor: "rgba(20,17,13,0.7)" },
    pickBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: "#fff" },
    pickContent: { padding: 12, gap: 4 },
    pickBrand: { fontFamily: fonts.mono, fontSize: 9, color: c.mute, textTransform: "uppercase" },
    pickTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    pickStrike: { fontFamily: fonts.sans, fontSize: 11, color: c.mute, textDecorationLine: "line-through" },
    pickPrice: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    pickProPrice: { fontFamily: fonts.sans, fontSize: 11, color: c.gold },
    pickPriceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 },
    pickAddBtn: {
      height: 32,
      paddingHorizontal: 14,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    pickAddText: { fontFamily: fonts.sansBold, fontSize: 12, color: "#fff" },

    // Stories
    storyCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 10,
      ...shadows.card,
    },
    storyImage: { width: 120, height: 100 },
    storyContent: { flex: 1, padding: 12, gap: 4 },
    storyCat: { fontFamily: fonts.monoBold, fontSize: 9, color: "#C5491F", textTransform: "uppercase", letterSpacing: 1 },
    storyTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    storyTime: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },

    // Grid
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
    },
    gridCard: {
      width: "47%",
      backgroundColor: c.paper,
      borderRadius: 12,
      overflow: "hidden",
      ...shadows.card,
    },
    gridImageBox: { position: "relative" },
    gridImage: { width: "100%", aspectRatio: 1 },
    gridBadge: {
      position: "absolute",
      bottom: 8,
      left: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    gridBadgeNew: { backgroundColor: "#C5491F" },
    gridBadgeLow: { backgroundColor: "rgba(20,17,13,0.7)" },
    gridBadgeSale: { backgroundColor: "#C62828" },
    gridBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: "#fff" },
    gridContent: { padding: 12, gap: 2 },
    gridBrand: { fontFamily: fonts.mono, fontSize: 9, color: c.mute, textTransform: "uppercase" },
    gridTitle: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, minHeight: 36 },
    gridPriceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    gridPrice: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    gridProPrice: { fontFamily: fonts.sans, fontSize: 11, color: c.gold },
    gridAddBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: c.paperWarm,
      alignItems: "center",
      justifyContent: "center",
    },

    // Sign-off
    signOff: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: space[4],
      marginTop: 32,
      gap: 12,
    },
    signOffLine: { flex: 1, height: 1, backgroundColor: "rgba(179,130,56,0.2)" },
    signOffContent: { alignItems: "center", gap: 4 },
    signOffHeading: {
      fontFamily: fonts.serif,
      fontStyle: "italic",
      fontSize: 18,
      color: c.ink,
      textAlign: "center",
    },
    signOffSub: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, textAlign: "center" },
  });
}
