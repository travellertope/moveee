import React, { useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

export type TemplateId =
  | "post" | "hidden-gem" | "cultural-take" | "food-review" | "book-review" | "music-review"
  | "creative-showcase" | "poll" | "itinerary" | "event" | "quote";

export interface TemplateDef {
  id: TemplateId;
  emoji: string;
  label: string;
  desc: string;
  color: string;
}

export const TEMPLATE_DEFS: TemplateDef[] = [
  { id: "post",              emoji: "✏️",  label: "Post",             desc: "Share a thought or cultural moment",  color: "#B38238" },
  { id: "hidden-gem",        emoji: "💎",  label: "Hidden Gem",       desc: "Recommend a place worth discovering", color: "#2D6A4F" },
  { id: "cultural-take",     emoji: "🔥",  label: "Cultural Take",    desc: "Drop a hot take on culture",          color: "#C5491F" },
  { id: "food-review",       emoji: "🍽️",  label: "Food Review",      desc: "Review a dish or restaurant",         color: "#B38238" },
  { id: "book-review",       emoji: "📚",  label: "Book Review",      desc: "Review a book you've read",           color: "#6B48A8" },
  { id: "music-review",      emoji: "🎵",  label: "Music Review",     desc: "Review an album you've heard",        color: "#0D7377" },
  { id: "creative-showcase", emoji: "🎨",  label: "Showcase",         desc: "Show your creative work",             color: "#C5491F" },
  { id: "poll",              emoji: "📊",  label: "Poll",             desc: "Ask the community",                   color: "#6B48A8" },
  { id: "itinerary",         emoji: "🗺️",  label: "Itinerary",        desc: "Share a route or trip",               color: "#2D6A4F" },
  { id: "event",             emoji: "📅",  label: "Event",            desc: "Announce an event",                   color: "#B38238" },
  { id: "quote",             emoji: "❝",   label: "Quote",            desc: "Share a quote you love",              color: "#3A342B" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (id: TemplateId) => void;
  /** Hub-scoped composer (docs/hubs-plan.md §3.1) — when set, only these
   * template ids are shown, not just dimmed. */
  allowedIds?: TemplateId[];
}

export default function TemplatePickerSheet({ visible, onClose, onSelect, allowedIds }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const defs = allowedIds ? TEMPLATE_DEFS.filter((t) => allowedIds.includes(t.id)) : TEMPLATE_DEFS;

  const handleSelect = useCallback((id: TemplateId) => {
    onClose();
    // Small delay so the sheet closes before the screen pushes
    setTimeout(() => onSelect(id), 120);
  }, [onClose, onSelect]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={18} color={c.inkSoft} />
        </TouchableOpacity>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>Create a post</Text>
          <Text style={styles.subtitle}>Choose a format to get started.</Text>
        </View>

        <View style={styles.divider} />

        {/* 2×2 Template grid */}
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {defs.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.card}
              onPress={() => handleSelect(t.id)}
              activeOpacity={0.78}
            >
              <View style={styles.iconCircle}>
                <Text style={styles.iconEmoji}>{t.emoji}</Text>
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardLabel}>{t.label}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{t.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(20,17,13,0.45)",
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "78%",
      backgroundColor: c.paper,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingBottom: 34,
      ...shadows.modal,
    },
    handle: {
      width: 28,
      height: 4,
      borderRadius: 2,
      backgroundColor: c.ghost,
      alignSelf: "center",
      marginTop: 10,
    },
    closeBtn: {
      position: "absolute",
      top: 14,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.paperDeep,
      alignItems: "center",
      justifyContent: "center",
    },

    titleBlock: {
      paddingHorizontal: space[4],
      paddingTop: space[4],
      paddingBottom: 0,
    },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
      lineHeight: 26,
    },
    subtitle: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      marginTop: 4,
    },

    divider: {
      height: 1,
      backgroundColor: c.rule,
      marginTop: space[3],
    },

    grid: {
      padding: space[4],
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    card: {
      width: "48%",
      height: 76,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paperWarm,
      borderRadius: radius.xl,
      padding: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.paperDeep,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    iconEmoji: {
      fontSize: 18,
      lineHeight: 22,
    },
    cardText: {
      flex: 1,
      marginLeft: 10,
      overflow: "hidden",
    },
    cardLabel: {
      fontFamily: fonts.sansBold,
      fontSize: 14,
      color: c.ink,
    },
    cardDesc: {
      fontFamily: fonts.sans,
      fontSize: 11,
      color: c.mute,
      lineHeight: 15,
      marginTop: 2,
    },
  });
}
