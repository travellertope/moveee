import React, { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Switch } from "react-native";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";

export interface ShopFilters {
  category: string;
  sortBy: "featured" | "newest" | "price_asc" | "price_desc";
  inStockOnly: boolean;
  onSaleOnly: boolean;
}

interface ShopFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: ShopFilters) => void;
  resultCount?: number;
}

const CATEGORIES = ["All", "Ceramics", "Textiles", "Leather", "Jewellery", "Objects", "Paper"];
const SORT_OPTIONS: { label: string; value: ShopFilters["sortBy"] }[] = [
  { label: "Featured", value: "featured" },
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { paddingHorizontal: space[4], paddingBottom: space[6] },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: space[4],
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.md, color: c.ink },
    resetText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre },
    sectionLabel: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: space[3],
      marginTop: space[5],
    },
    categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
    categoryPill: {
      paddingHorizontal: space[4],
      paddingVertical: space[2],
      borderRadius: radius["2xl"],
      borderWidth: 1,
      borderColor: c.rule,
    },
    categoryPillActive: {
      backgroundColor: c.ink,
      borderColor: c.ink,
    },
    categoryPillText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    categoryPillTextActive: { color: c.paper },
    sortRow: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
      gap: space[3],
    },
    sortLabel: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft },
    radioOuter: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
    },
    radioOuterActive: { borderColor: c.ochre },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.ochre },
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      height: 44,
    },
    toggleLabel: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft },
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.rule,
      justifyContent: "center",
      paddingHorizontal: 3,
    },
    toggleActive: { backgroundColor: c.ochre, borderColor: c.ochre },
    toggleInactive: { backgroundColor: c.ghost + "33" },
    toggleKnob: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: c.paper,
    },
    footer: { marginTop: space[6] },
    applyBtn: {
      height: 52,
      borderRadius: radius["2xl"],
      backgroundColor: c.ochre,
      alignItems: "center",
      justifyContent: "center",
    },
    applyText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
  });
}

export default function ShopFilterSheet({ visible, onClose, onApply, resultCount }: ShopFilterSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [category, setCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<ShopFilters["sortBy"]>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [onSaleOnly, setOnSaleOnly] = useState(false);

  const handleReset = () => {
    setCategory("All");
    setSortBy("featured");
    setInStockOnly(false);
    setOnSaleOnly(false);
  };

  const handleApply = () => {
    onApply({ category: category === "All" ? "" : category, sortBy, inStockOnly, onSaleOnly });
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Filter Products</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>Category</Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, active && styles.categoryPillActive]}
                onPress={() => setCategory(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryPillText, active && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Sort By</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = sortBy === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={styles.sortRow}
              onPress={() => setSortBy(opt.value)}
              activeOpacity={0.7}
            >
              <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
                {active && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.sortLabel}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.sectionLabel}>Availability</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>In stock only</Text>
          <TouchableOpacity
            style={[styles.toggle, inStockOnly ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => setInStockOnly((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleKnob, { alignSelf: inStockOnly ? "flex-end" : "flex-start" }]} />
          </TouchableOpacity>
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>On sale</Text>
          <TouchableOpacity
            style={[styles.toggle, onSaleOnly ? styles.toggleActive : styles.toggleInactive]}
            onPress={() => setOnSaleOnly((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.toggleKnob, { alignSelf: onSaleOnly ? "flex-end" : "flex-start" }]} />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply} activeOpacity={0.85}>
            <Text style={styles.applyText}>
              Show{resultCount !== undefined ? ` ${resultCount}` : ""} products
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}
