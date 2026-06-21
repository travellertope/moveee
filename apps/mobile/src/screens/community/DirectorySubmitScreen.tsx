import React, { useMemo, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

// ── Interest tags ─────────────────────────────────────────────────────────────

const INTERESTS = [
  { slug: "fashion-streetwear", label: "Fashion & Streetwear",      emoji: "👗" },
  { slug: "food-drink",         label: "Specialty Coffee & Dining", emoji: "☕" },
  { slug: "live-music",         label: "Live Music",                emoji: "🎵" },
  { slug: "music-production",   label: "Music Production",          emoji: "🎧" },
  { slug: "independent-film",   label: "Independent Film",          emoji: "🎬" },
  { slug: "visual-art",         label: "Visual Art",                emoji: "🎨" },
  { slug: "architecture",       label: "Architecture",              emoji: "🏛️" },
  { slug: "photography",        label: "Photography",               emoji: "📷" },
  { slug: "literature",         label: "Literature & Poetry",       emoji: "📚" },
  { slug: "visual-design",      label: "Visual Design",             emoji: "✏️" },
  { slug: "tech-culture",       label: "Tech & Digital Culture",    emoji: "💻" },
  { slug: "sport-wellness",     label: "Sport & Wellness",          emoji: "⚽" },
  { slug: "travel",             label: "Travel & Exploration",      emoji: "✈️" },
  { slug: "ideas",              label: "Ideas & Culture Theory",    emoji: "💡" },
  { slug: "street-food",        label: "Street Food & Markets",     emoji: "🍜" },
  { slug: "nightlife",          label: "Nightlife & Bars",          emoji: "🍸" },
];

// ── Entry types ───────────────────────────────────────────────────────────────

const ENTRY_TYPES = [
  { slug: "person",    label: "Person",      emoji: "👤" },
  { slug: "place",     label: "Place",        emoji: "📍" },
  { slug: "food",      label: "Food & Drink", emoji: "🍽️" },
  { slug: "book",      label: "Book",         emoji: "📖" },
  { slug: "film",      label: "Film",         emoji: "🎬" },
  { slug: "genre",     label: "Genre",        emoji: "🎵" },
  { slug: "movement",  label: "Movement",     emoji: "✊" },
  { slug: "artwork",   label: "Artwork",      emoji: "🎨" },
  { slug: "concept",   label: "Concept",      emoji: "💡" },
  { slug: "fashion",   label: "Fashion",      emoji: "👗" },
  { slug: "tv-series", label: "TV Series",    emoji: "📺" },
];

const BODY_PLACEHOLDERS: Record<string, string> = {
  person:      "What should people know? Their influence, legacy, key works…",
  place:       "Describe this place — what makes it significant to culture?",
  food:        "Tell us about this dish, restaurant, or food tradition…",
  book:        "Overview — themes, why it matters, cultural impact…",
  film:        "Story, director, cultural significance…",
  genre:       "Origins, sound, key artists, its influence…",
  movement:    "When did it start, who founded it, what did it stand for?",
  artwork:     "Who made it, when, what it represents…",
  concept:     "Its origins, meaning, and cultural resonance…",
  fashion:     "Origins, cultural meaning, key designers or materials…",
  "tv-series": "Creator, themes, why it matters culturally…",
};

const EXCERPT_PLACEHOLDERS: Record<string, string> = {
  person:      "e.g. Pioneering Nigerian musician and political activist…",
  place:       "e.g. A legendary jazz club in Harlem, New York…",
  food:        "e.g. A slow-cooked West African stew of black-eyed beans…",
  book:        "e.g. A landmark novel exploring diaspora identity…",
  film:        "e.g. A groundbreaking superhero film set in a fictional African nation…",
  genre:       "e.g. A danceable West African pop genre with roots in highlife…",
  movement:    "e.g. A 1930s literary movement of Black francophone intellectuals…",
  artwork:     "e.g. A large-scale double self-portrait by Frida Kahlo, 1939…",
  concept:     "e.g. A Nguni Bantu philosophy meaning 'humanity towards others'…",
  fashion:     "e.g. A four-piece formal attire from the Yoruba people of West Africa…",
  "tv-series": "e.g. A South African teen crime drama set in Cape Town…",
};

// ── Structured improve fields per entry type ──────────────────────────────────
// These mirror the About card fields shown on DirectoryDetailScreen.
// All optional — members fill in only what they know.

const IMPROVE_FIELDS: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  person: [
    { key: "Born",         label: "Born",         placeholder: "e.g. 1938, Abeokuta, Nigeria" },
    { key: "Died",         label: "Died",         placeholder: "e.g. 1997, Lagos, Nigeria" },
    { key: "Nationality",  label: "Nationality",  placeholder: "e.g. Nigerian" },
    { key: "Occupation",   label: "Occupation",   placeholder: "e.g. Musician · Activist · Composer" },
    { key: "Known for",    label: "Known for",    placeholder: "e.g. Afrobeat · Political Resistance" },
    { key: "Active years", label: "Active years", placeholder: "e.g. 1958–1997" },
    { key: "Awards",       label: "Awards",       placeholder: "e.g. Grammy nomination 1999" },
  ],
  place: [
    { key: "Country",           label: "Country",           placeholder: "e.g. Nigeria" },
    { key: "Region",            label: "Region",            placeholder: "e.g. Lagos State" },
    { key: "Population",        label: "Population",        placeholder: "e.g. ~15 million (metro)" },
    { key: "Official language", label: "Official language", placeholder: "e.g. English · Yoruba" },
    { key: "Currency",          label: "Currency",          placeholder: "e.g. Nigerian Naira (₦)" },
    { key: "Founded",           label: "Founded",           placeholder: "e.g. ~1450 CE" },
  ],
  food: [
    { key: "Origin country",  label: "Origin country",  placeholder: "e.g. West Africa (disputed)" },
    { key: "Food type",       label: "Food type",       placeholder: "e.g. Main course · Rice dish" },
    { key: "Main ingredients",label: "Main ingredients",placeholder: "e.g. Long-grain rice · Tomatoes" },
    { key: "Also known as",   label: "Also known as",   placeholder: "e.g. Benachin · Thieboudienne" },
  ],
  book: [
    { key: "Author",    label: "Author",    placeholder: "e.g. Chinua Achebe" },
    { key: "Published", label: "Published", placeholder: "e.g. 1958" },
    { key: "Genre",     label: "Genre",     placeholder: "e.g. Literary Fiction · Post-Colonial" },
    { key: "Publisher", label: "Publisher", placeholder: "e.g. Heinemann" },
    { key: "Language",  label: "Language",  placeholder: "e.g. English" },
    { key: "Pages",     label: "Pages",     placeholder: "e.g. 209" },
  ],
  film: [
    { key: "Director",           label: "Director",           placeholder: "e.g. Ryan Coogler" },
    { key: "Year",               label: "Year",               placeholder: "e.g. 2018" },
    { key: "Starring",           label: "Starring",           placeholder: "e.g. Chadwick Boseman · Lupita Nyong'o" },
    { key: "Cinematographer",    label: "Cinematographer",    placeholder: "e.g. Rachel Morrison" },
    { key: "Country",            label: "Country",            placeholder: "e.g. USA" },
    { key: "Language",           label: "Language",           placeholder: "e.g. English · Xhosa" },
    { key: "Runtime",            label: "Runtime",            placeholder: "e.g. 134 min" },
    { key: "Production company", label: "Production company", placeholder: "e.g. Marvel Studios" },
  ],
  genre: [
    { key: "Origin country", label: "Origin country", placeholder: "e.g. Nigeria · Ghana · UK" },
    { key: "Origin decade",  label: "Origin decade",  placeholder: "e.g. 2000s" },
    { key: "Tempo",          label: "Tempo",          placeholder: "e.g. Typically 90–100 BPM" },
    { key: "Key artists",    label: "Key artists",    placeholder: "e.g. Wizkid · Davido · Burna Boy" },
    { key: "Related genres", label: "Related genres", placeholder: "e.g. Afropop · Amapiano" },
    { key: "Subgenres",      label: "Subgenres",      placeholder: "e.g. Afro-fusion · Afro-soul" },
  ],
  movement: [
    { key: "Founders",          label: "Founders",          placeholder: "e.g. Aimé Césaire · Léopold Sédar Senghor" },
    { key: "Origin country",    label: "Origin country",    placeholder: "e.g. France (Francophone diaspora)" },
    { key: "Active period",     label: "Active period",     placeholder: "e.g. 1930s–1960s" },
    { key: "Ideology",          label: "Ideology",          placeholder: "e.g. Anti-colonialism · Black consciousness" },
    { key: "Key figures",       label: "Key figures",       placeholder: "e.g. Frantz Fanon · Paulette Nardal" },
    { key: "Related movements", label: "Related movements", placeholder: "e.g. Pan-Africanism · Harlem Renaissance" },
  ],
  artwork: [
    { key: "Artist",           label: "Artist",           placeholder: "e.g. Frida Kahlo" },
    { key: "Year",             label: "Year",             placeholder: "e.g. 1939" },
    { key: "Medium",           label: "Medium",           placeholder: "e.g. Oil on canvas" },
    { key: "Dimensions",       label: "Dimensions",       placeholder: "e.g. 173.5 × 173 cm" },
    { key: "Current location", label: "Current location", placeholder: "e.g. Museo de Arte Moderno, Mexico City" },
    { key: "Art collection",   label: "Art collection",   placeholder: "e.g. Permanent collection — MAM" },
    { key: "Style",            label: "Style",            placeholder: "e.g. Surrealism · Mexican Folk Art" },
  ],
  concept: [
    { key: "Origin",            label: "Origin",            placeholder: "e.g. Nguni Bantu peoples, Southern Africa" },
    { key: "Field",             label: "Field",             placeholder: "e.g. Philosophy · Ethics" },
    { key: "Related concepts",  label: "Related concepts",  placeholder: "e.g. Ubuntu · Communalism" },
  ],
  fashion: [
    { key: "Origin",        label: "Origin",        placeholder: "e.g. Yoruba people, West Africa" },
    { key: "Era",           label: "Era",           placeholder: "e.g. Pre-colonial — present" },
    { key: "Key designers", label: "Key designers", placeholder: "e.g. Names, houses, or brands" },
    { key: "Materials",     label: "Materials",     placeholder: "e.g. Aso-oke fabric · Gold thread" },
  ],
  "tv-series": [
    { key: "Creator",      label: "Creator",      placeholder: "e.g. Shonda Rhimes" },
    { key: "First aired",  label: "First aired",  placeholder: "e.g. 2005" },
    { key: "Network",      label: "Network",      placeholder: "e.g. ABC · Netflix" },
    { key: "Seasons",      label: "Seasons",      placeholder: "e.g. 8" },
    { key: "Country",      label: "Country",      placeholder: "e.g. USA" },
    { key: "Genre",        label: "Genre",        placeholder: "e.g. Drama · Medical" },
  ],
};

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paper },

    // Header — exact match of NewPostScreen
    header: {
      height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerSideBtn: { minWidth: 60, minHeight: 44, justifyContent: "center" },
    cancelText:    { fontFamily: fonts.sans, fontSize: 14, color: c.ochre },
    headerTitle:   { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    submitText:    { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre, textAlign: "right" },
    submitDisabled:{ opacity: 0.35 },

    // Type bar — mirrors NewPostScreen's template bar
    typeBar: {
      height: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paperWarm,
    },
    typeBarLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
    typeBarEmoji: { fontSize: 14, lineHeight: 18 },
    typeBarLabel: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
    changeText:   { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },

    // Scroll body
    body: { padding: space[4], paddingBottom: 40 },

    // Section labels
    sectionLabel: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.mute, textTransform: "uppercase", letterSpacing: 1,
      marginBottom: space[2], marginTop: space[4],
    },

    // Title — large serif like NewPostScreen cultural-take headline
    titleInput: {
      fontFamily: fonts.serifBold, fontSize: 20, color: c.ink,
      lineHeight: 28, minHeight: 56, textAlignVertical: "top",
    },

    // Excerpt — bordered like NewPostScreen's borderedTextarea
    excerptInput: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      lineHeight: 22, minHeight: 60, textAlignVertical: "top",
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      padding: 12, backgroundColor: c.paper,
    },

    // Full body — open textarea like NewPostScreen's main textarea
    bodyInput: {
      fontFamily: fonts.sans, fontSize: 16, color: c.ink,
      lineHeight: 26, minHeight: 160, textAlignVertical: "top",
    },

    // Interest chips
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
    chip: {
      backgroundColor: c.paperDeep, borderRadius: radius.full,
      paddingHorizontal: 14, paddingVertical: 7,
    },
    chipSelected: { backgroundColor: c.ink },
    chipText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },
    chipTextSelected: { color: c.paper },

    charCount: {
      fontFamily: fonts.mono, fontSize: 11, color: c.ghost,
      textAlign: "right", marginTop: 4,
    },

    // Divider — negative-margin to bleed edge like NewPostScreen
    divider: {
      height: 1, backgroundColor: c.rule, marginVertical: space[3],
      marginHorizontal: -space[4],
    },

    // Improve mode
    improveBanner: {
      borderLeftWidth: 3, borderLeftColor: c.ochre,
      backgroundColor: c.paperWarm, borderRadius: radius.md,
      padding: 14, marginBottom: space[4],
    },
    improveBannerTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, marginBottom: 4 },
    improveBannerSub:   { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 19 },
    improveTextarea: {
      fontFamily: fonts.sans, fontSize: 16, color: c.ink,
      lineHeight: 26, minHeight: 200, textAlignVertical: "top",
    },

    // Structured improve fields
    structuredSection: {
      marginTop: space[4],
    },
    fieldRow: {
      marginBottom: space[3],
    },
    fieldLabel: {
      fontFamily: fonts.sansBold, fontSize: 12, color: c.mute,
      textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4,
    },
    fieldInput: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      paddingHorizontal: 12, paddingVertical: 10, backgroundColor: c.paper,
    },
    improveNote: {
      fontFamily: fonts.sansItalic, fontSize: 12, color: c.mute,
      lineHeight: 18, marginTop: space[3],
    },

    // Pro gate
    gate:         { flex: 1, alignItems: "center", justifyContent: "center", padding: 36, gap: 12 },
    gateTitle:    { fontFamily: fonts.sansBold, fontSize: 16, color: c.ink, textAlign: "center" },
    gateText:     { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, textAlign: "center", lineHeight: 20 },
    upgradeBtn:   { backgroundColor: c.ochre, borderRadius: radius.full, paddingHorizontal: 22, paddingVertical: 11, marginTop: 6 },
    upgradeBtnLabel: { fontFamily: fonts.sansBold, color: c.paper, fontSize: 13, letterSpacing: 0.4, textTransform: "uppercase" },
  });
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function DirectorySubmitScreen() {
  const nav   = useNav();
  const route = useRoute<any>();
  const { improvingSlug, improvingTitle, improvingEntryType } = route.params ?? {};
  const isImproveMode = !!improvingSlug;

  const c      = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const user   = useAuthStore((s) => s.user);
  const isPatron = user?.tier === "patron";

  const [entryType,  setEntryType]  = useState("concept");
  const [title,      setTitle]      = useState(improvingTitle ?? "");
  const [excerpt,    setExcerpt]    = useState("");
  const [content,    setContent]    = useState("");
  const [interests,   setInterests]   = useState<string[]>([]);
  const [aboutFields, setAboutFields] = useState<Record<string, string>>({});
  const [submitting,  setSubmitting]  = useState(false);

  const improveFields = IMPROVE_FIELDS[improvingEntryType ?? ""] ?? [];

  const setAboutField = (key: string, value: string) =>
    setAboutFields((prev) => ({ ...prev, [key]: value }));

  const toggleInterest = (slug: string) =>
    setInterests((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  const close = () => nav.goBack();
  const currentType = ENTRY_TYPES.find((t) => t.slug === entryType) ?? ENTRY_TYPES[8];

  const hasStructuredData = Object.values(aboutFields).some((v) => v.trim().length > 0);
  const canSubmit = isImproveMode
    ? content.trim().length > 10 || hasStructuredData
    : title.trim().length > 0 && content.trim().length > 20;

  const pickType = () => {
    Alert.alert(
      "Entry type",
      "What kind of entry is this?",
      [
        ...ENTRY_TYPES.map((t) => ({ text: `${t.emoji}  ${t.label}`, onPress: () => setEntryType(t.slug) })),
        { text: "Cancel", style: "cancel" as const },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const filledFields = Object.entries(aboutFields)
        .filter(([, v]) => v.trim().length > 0)
        .map(([label, value]) => ({ label, value }));

      const body: Record<string, unknown> = {
        title:      title.trim() || improvingTitle || "",
        excerpt:    excerpt.trim(),
        content:    content.trim(),
        entry_type: entryType,
        interests,
      };
      if (improvingSlug) body.improving_slug = improvingSlug;
      if (filledFields.length > 0) body.about_fields = filledFields;
      await api.post(`${MOBILE_API}/directory/submit`, body as Record<string, string>);
      Alert.alert(
        isImproveMode ? "Improvement submitted ✓" : "Entry submitted ✓",
        isImproveMode
          ? "Thanks for contributing. Our editors will review your suggestion and merge it into the entry."
          : "Thanks — your entry goes to editorial review and will be published once approved.",
        [{ text: "Done", onPress: close }]
      );
    } catch (e: unknown) {
      Alert.alert("Couldn't submit", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pro gate ──────────────────────────────────────────────────────────────
  if (!isPatron) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerSideBtn} onPress={close}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isImproveMode ? "Improve Entry" : "Add to Directory"}</Text>
          <View style={styles.headerSideBtn} />
        </View>
        <View style={styles.gate}>
          <Ionicons name="lock-closed-outline" size={32} color={c.ochre} />
          <Text style={styles.gateTitle}>Moveee Pro required</Text>
          <Text style={styles.gateText}>
            Directory contributions are a Moveee Pro privilege. Upgrade to start adding
            people, places, and movements to the Culture Directory.
          </Text>
          <TouchableOpacity
            style={styles.upgradeBtn}
            onPress={() => nav.navigate("Connect", { screen: "Membership" } as any)}
          >
            <Text style={styles.upgradeBtnLabel}>Upgrade to Moveee Pro</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerSideBtn} onPress={close}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isImproveMode ? "Improve Entry" : "Add to Directory"}</Text>
        <TouchableOpacity
          style={styles.headerSideBtn}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color={c.ochre} />
            : <Text style={[styles.submitText, !canSubmit && styles.submitDisabled]}>Submit</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Type bar (new entry only) */}
      {!isImproveMode && (
        <View style={styles.typeBar}>
          <View style={styles.typeBarLeft}>
            <Text style={styles.typeBarEmoji}>{currentType.emoji}</Text>
            <Text style={styles.typeBarLabel}>{currentType.label}</Text>
          </View>
          <TouchableOpacity onPress={pickType}>
            <Text style={styles.changeText}>Change type</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isImproveMode ? (
            /* ── Improve mode ── */
            <>
              <View style={styles.improveBanner}>
                <Text style={styles.improveBannerTitle}>Improving: {improvingTitle}</Text>
                <Text style={styles.improveBannerSub}>
                  Fill in what you know — only add fields you're confident about. Our editors
                  will review and merge your contribution.
                </Text>
              </View>

              {/* Structured fields (when entry type is known) */}
              {improveFields.length > 0 && (
                <View style={styles.structuredSection}>
                  <Text style={styles.sectionLabel}>About details</Text>
                  {improveFields.map((field) => (
                    <View key={field.key} style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>{field.label}</Text>
                      <TextInput
                        style={styles.fieldInput}
                        placeholder={field.placeholder}
                        placeholderTextColor={c.ghost}
                        value={aboutFields[field.key] ?? ""}
                        onChangeText={(v) => setAboutField(field.key, v)}
                        returnKeyType="next"
                      />
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Additional notes</Text>
              <TextInput
                style={styles.improveTextarea}
                placeholder="Any other corrections, context, or information to add…"
                placeholderTextColor={c.ghost}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={2000}
                autoFocus={improveFields.length === 0}
              />
              <Text style={styles.charCount}>{content.length} / 2000</Text>
              <Text style={styles.improveNote}>
                Leave fields blank if you're unsure — only share what you know for certain.
              </Text>
            </>
          ) : (
            /* ── New entry ── */
            <>
              {/* Large serif title — same feel as CulturalTake headline */}
              <TextInput
                style={styles.titleInput}
                placeholder={`${currentType.emoji}  ${currentType.label} name`}
                placeholderTextColor={c.ghost}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>One-line summary</Text>
              <TextInput
                style={styles.excerptInput}
                placeholder={EXCERPT_PLACEHOLDERS[entryType] ?? "A short one-sentence description…"}
                placeholderTextColor={c.ghost}
                value={excerpt}
                onChangeText={setExcerpt}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{excerpt.length} / 200</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Tell us more</Text>
              <TextInput
                style={styles.bodyInput}
                placeholder={BODY_PLACEHOLDERS[entryType] ?? "The full entry…"}
                placeholderTextColor={c.ghost}
                value={content}
                onChangeText={setContent}
                multiline
                maxLength={3000}
              />
              <Text style={styles.charCount}>{content.length} / 3000</Text>

              <View style={styles.divider} />

              <Text style={styles.sectionLabel}>Related interests</Text>
              <View style={styles.chipsWrap}>
                {INTERESTS.map((it) => {
                  const sel = interests.includes(it.slug);
                  return (
                    <TouchableOpacity
                      key={it.slug}
                      style={[styles.chip, sel && styles.chipSelected]}
                      onPress={() => toggleInterest(it.slug)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                        {it.emoji}  {it.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
