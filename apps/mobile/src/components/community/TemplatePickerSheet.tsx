import React, { useCallback, useMemo } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Pressable, Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fonts, fontSize, space, radius, shadows, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";

export type TemplateId =
  | "post" | "hidden-gem" | "food-review" | "book-review" | "music-review" | "film-review"
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
  { id: "hidden-gem",        emoji: "💎",  label: "Place",            desc: "Recommend a place worth discovering", color: "#2D6A4F" },
  { id: "food-review",       emoji: "🍽️",  label: "Food Review",      desc: "Review a dish or food item",          color: "#B38238" },
  { id: "book-review",       emoji: "📚",  label: "Book Review",      desc: "Review a book you've read",           color: "#6B48A8" },
  { id: "music-review",      emoji: "🎵",  label: "Music Review",     desc: "Review an album you've heard",        color: "#0D7377" },
  { id: "film-review",       emoji: "🎬",  label: "Film Review",      desc: "Review a film you've watched",        color: "#2B4C7E" },
  { id: "creative-showcase", emoji: "🎨",  label: "Showcase",         desc: "Show your creative work",             color: "#7a241c" },
  { id: "poll",              emoji: "📊",  label: "Poll",             desc: "Ask the community",                   color: "#6B48A8" },
  { id: "itinerary",         emoji: "🗺️",  label: "Itinerary",        desc: "Share a travel itinerary or weekend route", color: "#2D6A4F" },
  { id: "event",             emoji: "📅",  label: "Event",            desc: "Announce an event",                   color: "#B38238" },
  { id: "quote",             emoji: "❝",   label: "Quote",            desc: "Share a quote you love",              color: "#3A342B" },
];

// Review family (July 2026) — Hidden Gem/Food/Music/Book/Film Review share
// one "Review" entry point in the picker; once inside NewPostScreen, a tab
// row (see NewPostScreen.tsx's renderReviewTabs) switches between subtypes.
// Mirrors packages/shared/components/pulse/TypePickerModal.tsx's REVIEW_FAMILY
// — keep both in sync.
export const REVIEW_FAMILY: TemplateId[] = ["hidden-gem", "food-review", "music-review", "book-review", "film-review"];
export const REVIEW_DEFAULT: TemplateId = "hidden-gem";
export const REVIEW_TAB_META: Record<string, { label: string; emoji: string }> = {
  "hidden-gem":   { label: "Place", emoji: "💎" },
  "food-review":  { label: "Food",  emoji: "🍽️" },
  "music-review": { label: "Music", emoji: "🎵" },
  "book-review":  { label: "Book",  emoji: "📚" },
  "film-review":  { label: "Film",  emoji: "🎬" },
};
export function isReviewTemplate(id: TemplateId): boolean {
  return REVIEW_FAMILY.includes(id);
}
const REVIEW_CARD_DEF: TemplateDef = {
  id: REVIEW_DEFAULT, emoji: "⭐", label: "Review",
  desc: "Rate a place, dish, album, book, or film", color: "#B38238",
};

// Update family (July 2026) — Post/Poll/Quote share one "Updates" entry
// point in the picker; once inside NewPostScreen, a tab row (see
// NewPostScreen.tsx's renderSubtypeTabs) switches between them. Cultural
// Take was removed entirely — its directory-linking idea lives on as an
// optional field on the plain Post form. Mirrors
// packages/shared/components/pulse/SubmitPost.tsx's UPDATE_FAMILY — keep
// both in sync.
export const UPDATE_FAMILY: TemplateId[] = ["post", "poll", "quote"];
export const UPDATE_DEFAULT: TemplateId = "post";
export const UPDATE_TAB_META: Record<string, { label: string; emoji: string }> = {
  post:  { label: "Update", emoji: "✏️" },
  poll:  { label: "Poll",   emoji: "📊" },
  quote: { label: "Quote",  emoji: "💬" },
};
export function isUpdateTemplate(id: TemplateId): boolean {
  return UPDATE_FAMILY.includes(id);
}
const UPDATE_CARD_DEF: TemplateDef = {
  id: UPDATE_DEFAULT, emoji: "✏️", label: "Updates",
  desc: "Share a thought, a poll, or a quote", color: "#B38238",
};

// Reputation-gated top-level tiles — mirrors the server-side gate in
// handle_submit_post() and packages/shared/components/pulse/SubmitPost.tsx's
// web-only TEMPLATE_REP_GATE, which mobile never had a picker-level
// equivalent of (the first sign of the gate used to be a submit-time 403).
// Only individual, standalone tiles are listed here — Poll lives inside the
// merged "Updates" tile above, where Update/Quote are ungated, so it can't
// be gated at this level without also blocking the ungated subtypes; that
// gate still only surfaces once inside the composer's subtype tabs.
const TEMPLATE_REP_GATE: Partial<Record<TemplateId, { rep: number; label: string }>> = {
  itinerary: { rep: 2500, label: "Taste Maker (2,500 rep) or Moveee Pro" },
  event:     { rep: 500,  label: "Culture Contributor (500 rep) or Moveee Pro" },
};

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
  const { user } = useAuthStore();
  const isPro = user?.tier === "patron";
  const rep = user?.reputation ?? 0;
  const isLocked = useCallback(
    (id: TemplateId) => {
      const gate = TEMPLATE_REP_GATE[id];
      return !!gate && !isPro && rep < gate.rep;
    },
    [isPro, rep]
  );
  const rawDefs = allowedIds ? TEMPLATE_DEFS.filter((t) => allowedIds.includes(t.id)) : TEMPLATE_DEFS;
  // Collapse the review family into one "Review" card and the update family
  // into one "Updates" card, each inserted at the position of its first
  // family member still present.
  const defs = useMemo(() => {
    const out: TemplateDef[] = [];
    let reviewInserted = false;
    let updateInserted = false;
    for (const t of rawDefs) {
      if (isReviewTemplate(t.id)) {
        if (!reviewInserted) { out.push(REVIEW_CARD_DEF); reviewInserted = true; }
      } else if (isUpdateTemplate(t.id)) {
        if (!updateInserted) { out.push(UPDATE_CARD_DEF); updateInserted = true; }
      } else {
        out.push(t);
      }
    }
    return out;
  }, [rawDefs]);

  const handleSelect = useCallback((id: TemplateId) => {
    if (isLocked(id)) {
      Alert.alert(
        "Not quite yet",
        `${TEMPLATE_REP_GATE[id]?.label} is needed to post this format.`
      );
      return;
    }
    onClose();
    // Small delay so the sheet closes before the screen pushes
    setTimeout(() => onSelect(id), 120);
  }, [onClose, onSelect, isLocked]);

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
          {defs.map((t) => {
            const locked = isLocked(t.id);
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.card, locked && styles.cardLocked]}
                onPress={() => handleSelect(t.id)}
                activeOpacity={0.78}
              >
                <View style={[styles.iconCircle, { backgroundColor: `${t.color}1F` }]}>
                  <Text style={styles.iconEmoji}>{t.emoji}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={styles.cardLabel}>{t.label}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {locked ? `🔒 ${TEMPLATE_REP_GATE[t.id]?.label}` : t.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFill,
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
      height: 78,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.paperDeep,
      borderRadius: radius.xl,
      padding: 12,
      borderWidth: 1,
      borderColor: "transparent",
    },
    cardLocked: { opacity: 0.55 },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    iconEmoji: {
      fontSize: 19,
      lineHeight: 23,
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
