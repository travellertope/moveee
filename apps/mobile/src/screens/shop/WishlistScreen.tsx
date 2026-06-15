import React, { useMemo } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useCartStore, type WishlistItem } from "../../store/cartStore";
import { fonts, fontSize, space, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

export default function WishlistScreen() {
  const nav = useNavigation<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { wishlist, toggleWishlist } = useCartStore();

  const renderItem = ({ item }: { item: WishlistItem }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => nav.navigate("ProductDetail", { productId: item.id, product: { id: item.id, slug: item.slug } })}
    >
      <View style={styles.imageBox}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={28} color={c.ghost} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.brand} numberOfLines={1}>{item.brand.toUpperCase()}</Text>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
      </View>

      <TouchableOpacity
        style={styles.removeBtn}
        onPress={() => toggleWishlist(item)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="heart" size={20} color={c.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={22} color={c.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wishlist</Text>
        <View style={{ width: 40 }} />
      </View>

      {wishlist.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={48} color={c.ghost} />
          <Text style={styles.emptyTitle}>Your wishlist is empty</Text>
          <Text style={styles.emptyText}>Tap the heart on any product to save it here.</Text>
          <TouchableOpacity style={styles.browseBtn} onPress={() => nav.navigate("ShopHome")}>
            <Text style={styles.browseBtnText}>Browse the shop</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperDeep },

    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.ghost,
    },
    backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },

    list: { padding: space[4], gap: 12 },

    card: {
      flexDirection: "row", backgroundColor: c.paper,
      borderRadius: radius.xl, overflow: "hidden", ...shadows.card,
      alignItems: "center",
    },
    imageBox: { width: 90, height: 90 },
    image: { width: 90, height: 90 },
    imagePlaceholder: { backgroundColor: c.paperDeep, justifyContent: "center", alignItems: "center" },

    info: { flex: 1, paddingHorizontal: 12, paddingVertical: 10, gap: 4 },
    brand: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.mute, letterSpacing: 1 },
    title: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, lineHeight: 18 },
    price: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre },

    removeBtn: { paddingRight: 16, paddingLeft: 8 },

    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: space[8], gap: 12 },
    emptyTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.lg, color: c.ink },
    emptyText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, textAlign: "center" },
    browseBtn: {
      marginTop: 8, backgroundColor: c.ochre, paddingHorizontal: 24, paddingVertical: 12,
      borderRadius: radius.full,
    },
    browseBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.paper },
  });
}
