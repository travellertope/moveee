import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import { fonts, fontSize, space, radius } from "../../theme";
import { api, CULTURE_API } from "../../api/client";
import { TYPE_BADGE } from "./DiscoverCard";

export type SortOption = "relevant" | "recent" | "rating";

const REGIONS: { slug: string; label: string }[] = [
  { slug: "nigeria", label: "Nigeria" },
  { slug: "ghana", label: "Ghana" },
  { slug: "uk", label: "UK" },
  { slug: "usa", label: "USA" },
  { slug: "pan-african", label: "Pan-African" },
];

const SORTS: { value: SortOption; label: string }[] = [
  { value: "relevant", label: "Most Relevant" },
  { value: "recent", label: "Recently Added" },
  { value: "rating", label: "Highest Rated" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  type: string | null;
  region: string | null;
  sort: SortOption;
  query: string;
  onApply: (filters: { type: string | null; region: string | null; sort: SortOption }) => void;
}

export default function DiscoverFilterSheet({ visible, onClose, type, region, sort, query, onApply }: Props) {
  const c = useColors();
  const styles = createStyles(c);

  const [draftType, setDraftType] = useState(type);
  const [draftRegion, setDraftRegion] = useState(region);
  const [draftSort, setDraftSort] = useState(sort);
  const [count, setCount] = useState<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!visible) return;
    setDraftType(type);
    setDraftRegion(region);
    setDraftSort(sort);
  }, [visible, type, region, sort]);

  useEffect(() => {
    if (!visible) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (draftType) params.set("type", draftType);
        if (draftRegion) params.set("region", draftRegion);
        params.set("sort", draftSort);
        params.set("per_page", "1");
        const data = await api.get<{ total: number }>(
          `${CULTURE_API}/directory/browse?${params.toString()}`,
          false
        );
        setCount(data?.total ?? 0);
      } catch {
        setCount(null);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [visible, query, draftType, draftRegion, draftSort]);

  return (
    <BottomSheet visible={visible} onClose={onClose} initialState="full">
      <View style={styles.body}>
        <Text style={styles.heading}>Filter Discover</Text>

        <Text style={styles.sectionLabel}>Type</Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[styles.pill, !draftType && styles.pillActive]}
            onPress={() => setDraftType(null)}
          >
            <Text style={[styles.pillText, !draftType && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {Object.entries(TYPE_BADGE).map(([slug, badge]) => {
            const active = draftType === slug;
            return (
              <TouchableOpacity
                key={slug}
                style={[styles.pill, active && { backgroundColor: badge.color, borderColor: badge.color }]}
                onPress={() => setDraftType(active ? null : slug)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>
                  {badge.emoji} {badge.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Region</Text>
        <View style={styles.pillRow}>
          <TouchableOpacity
            style={[styles.pill, !draftRegion && styles.pillActive]}
            onPress={() => setDraftRegion(null)}
          >
            <Text style={[styles.pillText, !draftRegion && styles.pillTextActive]}>All</Text>
          </TouchableOpacity>
          {REGIONS.map((r) => {
            const active = draftRegion === r.slug;
            return (
              <TouchableOpacity
                key={r.slug}
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setDraftRegion(active ? null : r.slug)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionLabel}>Sort by</Text>
        <View style={styles.sortList}>
          {SORTS.map((s) => {
            const active = draftSort === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                style={styles.sortRow}
                onPress={() => setDraftSort(s.value)}
              >
                <View style={[styles.radio, active && styles.radioActive]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.sortLabel}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.applyBtn}
          onPress={() => onApply({ type: draftType, region: draftRegion, sort: draftSort })}
        >
          <Text style={styles.applyBtnText}>
            {count === null ? "Show entries" : `Show ${count} ${count === 1 ? "entry" : "entries"}`}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const createStyles = (c: ColorPalette) =>
  StyleSheet.create({
    body: { paddingHorizontal: space[4], paddingBottom: space[6] },
    heading: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm + 2,
      color: c.ink,
      marginBottom: space[3],
    },
    sectionLabel: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs,
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      marginTop: space[4],
      marginBottom: space[2],
    },
    pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    pill: {
      borderWidth: 1,
      borderColor: c.rule,
      borderRadius: radius.full,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    pillActive: { backgroundColor: c.ink, borderColor: c.ink },
    pillText: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: c.ink },
    pillTextActive: { color: "#FFFFFF" },
    sortList: { gap: space[1] },
    sortRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 10 },
    radio: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: c.rule,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: { borderColor: c.ochre },
    radioDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.ochre },
    sortLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink },
    footer: {
      paddingHorizontal: space[4],
      paddingTop: space[3],
      paddingBottom: space[2],
      borderTopWidth: 1,
      borderTopColor: c.rule,
    },
    applyBtn: {
      backgroundColor: c.ink,
      borderRadius: radius.full,
      paddingVertical: 14,
      alignItems: "center",
    },
    applyBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: "#FFFFFF",
    },
  });
