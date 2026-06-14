import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";
import { MOBILE_API } from "../../api/client";

const RECENT_SEARCHES = ["ceramics", "Lagos makers", "Textiles"];
const POPULAR_CHIPS = ["Ceramics", "Lagos makers", "Textiles", "Under £50", "Jewellery", "NEW arrivals"];

interface SearchResult {
  id: number;
  title: string;
  brand: string;
  price: string;
  image?: string;
  type: "Product" | "Maker";
  slug: string;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.paperWarm },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: space[4],
      paddingVertical: space[3],
      borderBottomWidth: 1,
      borderBottomColor: c.rule,
      gap: space[3],
    },
    backBtn: { padding: 4 },
    inputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paper,
      borderRadius: radius["2xl"],
      borderWidth: 1,
      borderColor: c.rule,
      paddingHorizontal: space[4],
      height: 40,
    },
    input: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.ink,
      paddingVertical: 0,
    },
    clearBtn: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: space[2],
    },
    body: { flex: 1 },
    section: { paddingTop: space[5], paddingHorizontal: space[4] },
    sectionLabel: {
      fontFamily: fonts.monoBold,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: space[3],
    },
    recentRow: {
      flexDirection: "row",
      alignItems: "center",
      height: 48,
      gap: space[3],
    },
    recentText: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink },
    popularGrid: { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
    chip: {
      paddingHorizontal: space[4],
      paddingVertical: space[2],
      borderRadius: radius["2xl"],
      borderWidth: 1,
      borderColor: c.rule,
    },
    chipText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    resultsMeta: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.mute,
      paddingHorizontal: space[4],
      paddingTop: space[4],
      paddingBottom: space[2],
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultRow: {
      flexDirection: "row",
      alignItems: "center",
      height: 64,
      paddingHorizontal: space[4],
      gap: space[3],
    },
    resultImg: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: c.rule },
    resultTexts: { flex: 1 },
    resultBrand: {
      fontFamily: fonts.mono,
      fontSize: fontSize.eyebrow,
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    resultTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, marginTop: 1 },
    badgePill: {
      paddingHorizontal: space[2],
      paddingVertical: 2,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.rule,
      alignSelf: "flex-start",
      marginTop: 2,
    },
    badgePillText: { fontFamily: fonts.sans, fontSize: fontSize.eyebrow, color: c.mute },
    resultPrice: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.mute },
    divider: { height: 1, backgroundColor: c.rule, marginHorizontal: space[4] },
    loader: { paddingTop: space[8] },
  });
}

export default function ShopSearchScreen() {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const nav = useNavigation<any>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${MOBILE_API}/shop/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results || data || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, doSearch]);

  const handleChip = (text: string) => {
    setQuery(text);
  };

  const renderResult = ({ item, index }: { item: SearchResult; index: number }) => (
    <>
      <TouchableOpacity
        style={styles.resultRow}
        onPress={() => nav.navigate("ProductDetail", { productId: item.id })}
        activeOpacity={0.7}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.resultImg} />
        ) : (
          <LinearGradient colors={[c.gold, c.ochre]} style={styles.resultImg} />
        )}
        <View style={styles.resultTexts}>
          <Text style={styles.resultBrand}>{item.brand}</Text>
          <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{item.type}</Text>
          </View>
        </View>
        <Text style={styles.resultPrice}>{item.price}</Text>
      </TouchableOpacity>
      {index < results.length - 1 && <View style={styles.divider} />}
    </>
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Ionicons name="chevron-back" size={24} color={c.ink} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search products, makers…"
            placeholderTextColor={c.ghost}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery("")}>
              <Ionicons name="close" size={12} color={c.paper} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.body}>
        {query.length === 0 ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Recent</Text>
              {RECENT_SEARCHES.map((s) => (
                <TouchableOpacity key={s} style={styles.recentRow} onPress={() => handleChip(s)} activeOpacity={0.7}>
                  <Ionicons name="time-outline" size={16} color={c.mute} />
                  <Text style={styles.recentText}>{s}</Text>
                  <TouchableOpacity onPress={() => {}} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="close" size={14} color={c.ghost} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.section, { paddingTop: space[6] }]}>
              <Text style={styles.sectionLabel}>Popular</Text>
              <View style={styles.popularGrid}>
                {POPULAR_CHIPS.map((chip) => (
                  <TouchableOpacity key={chip} style={styles.chip} onPress={() => handleChip(chip)} activeOpacity={0.7}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <>
            {loading ? (
              <ActivityIndicator style={styles.loader} color={c.ochre} />
            ) : (
              <>
                <Text style={styles.resultsMeta}>
                  {results.length} result{results.length !== 1 ? "s" : ""} for &lsquo;{query}&rsquo;
                </Text>
                <FlatList
                  data={results}
                  keyExtractor={(item) => String(item.id)}
                  renderItem={renderResult}
                  keyboardShouldPersistTaps="handled"
                />
              </>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
