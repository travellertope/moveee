import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import StarRating from "../../components/composer/StarRating";
import MultiRating from "../../components/composer/MultiRating";
import PollBuilder, { PollDraft } from "../../components/composer/PollBuilder";
import ItineraryBuilder, { StopDraft } from "../../components/composer/ItineraryBuilder";
import DirectorySearch from "../../components/composer/DirectorySearch";

// ── Template metadata ─────────────────────────────────────────────────────────
type TemplateId =
  | "post" | "hidden-gem" | "cultural-take" | "food-review"
  | "creative-showcase" | "poll" | "itinerary" | "quote";

interface TemplateMeta {
  id: TemplateId;
  label: string;
  emoji: string;
  minText: number;
  maxText: number;
  description: string;
  chips: string[];
}

const TEMPLATES: TemplateMeta[] = [
  { id: "post",              label: "Update",   emoji: "📝", minText: 1,   maxText: 3000, description: "Share news, a link, or a quick thought from your cultural world.", chips: ["Hot take:", "Just saw that", "Anyone else noticed"] },
  { id: "hidden-gem",        label: "Gem",      emoji: "💎", minText: 50,  maxText: 500,  description: "Recommend a place worth visiting — hidden spots, local favourites, underrated venues.", chips: ["Hidden gem alert:", "Not enough people know about", "If you haven't been to"] },
  { id: "cultural-take",     label: "Take",     emoji: "💬", minText: 100, maxText: 1000, description: "Share a cultural opinion on a book, film, event, or idea worth discussing.", chips: ["Here's my honest take on", "I finally watched/read", "Why this matters:"] },
  { id: "food-review",       label: "Food",     emoji: "🍽️",  minText: 50,  maxText: 500,  description: "Review a dish or restaurant. Rate the taste, value, and vibe.", chips: ["Came for the hype, and", "Best thing on the menu:", "Honest review:"] },
  { id: "creative-showcase", label: "Showcase", emoji: "🎨", minText: 0,   maxText: 500,  description: "Share your creative work — art, photography, design, or music.", chips: ["Working on something:", "New piece:", "Behind the work:"] },
  { id: "poll",              label: "Poll",     emoji: "📊", minText: 10,  maxText: 280,  description: "Ask the community something. Great for settling debates or gathering opinions.", chips: ["Which is better:", "Settle this for me:", "Genuine question:"] },
  { id: "itinerary",         label: "Route",    emoji: "🗺️", minText: 0,   maxText: 300,  description: "Share a travel itinerary or a local route worth following.", chips: ["A perfect day in", "My go-to route:", "For first-timers in"] },
  { id: "quote",             label: "Quote",    emoji: "✦",  minText: 10,  maxText: 600,  description: "Share a quote that moved you. Add the author and source below.", chips: ["This has stayed with me:", "Still thinking about this:", "Words I keep returning to:"] },
];

const SECTION_TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

interface DirectoryEntry { id: number; title: string; entry_type: string; city?: string }

export default function NewPostScreen() {
  const nav = useNavigation<any>();

  const [template, setTemplate] = useState<TemplateId>("post");
  const [text, setText] = useState("");
  const [sectionTag, setSectionTag] = useState<string | null>(null);
  const [tagLocked, setTagLocked] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Template-specific state
  const [starRating, setStarRating]   = useState(0);
  const [foodRatings, setFoodRatings] = useState({ taste: 0, value: 0, vibe: 0 });
  const [foodDishName, setFoodDishName] = useState("");
  const [linkedEntry, setLinkedEntry]   = useState<DirectoryEntry | null>(null);
  const [poll, setPoll]   = useState<PollDraft>({ options: ["", ""], durationDays: 3 });
  const [stops, setStops] = useState<StopDraft[]>([{ name: "", note: "" }, { name: "", note: "" }]);
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteSource, setQuoteSource] = useState("");

  const textRef = useRef<TextInput>(null);
  const tmpl = TEMPLATES.find((t) => t.id === template)!;

  const handleTextChange = (v: string) => {
    setText(v);
    if (!tagLocked && v.length >= 20) {
      const lc = v.toLowerCase();
      const detected = SECTION_TAGS.find((t) => lc.includes(t.toLowerCase()));
      if (detected) setSectionTag(detected);
    }
  };

  const pickImages = async (multi = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: multi,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(result.assets.map((a) => a.uri));
    }
  };

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      try {
        const fileName = uri.split("/").pop() ?? "photo.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        const res = await api.upload<{ url: string }>(`${CULTURE_API}/community/upload-image`, uri, fileName, fileType);
        urls.push(res.url);
      } catch {
        // skip failed uploads
      }
    }
    return urls;
  };

  const validateAndSubmit = async () => {
    if (text.length < tmpl.minText) {
      Alert.alert("Too short", `Need at least ${tmpl.minText} characters for this template.`); return;
    }
    if (template === "hidden-gem" && starRating === 0) {
      Alert.alert("Rating required", "Please give a star rating."); return;
    }
    if ((template === "hidden-gem" || template === "cultural-take") && !linkedEntry) {
      Alert.alert("Place required", "Please link a directory entry."); return;
    }
    if (template === "food-review" && (!foodDishName || foodRatings.taste === 0)) {
      Alert.alert("Dish details required", "Please add the dish name and taste rating."); return;
    }
    if (template === "creative-showcase" && images.length === 0) {
      Alert.alert("Media required", "Please add at least one image."); return;
    }
    if (template === "poll" && poll.options.filter((o) => o.trim()).length < 2) {
      Alert.alert("Poll options required", "Add at least 2 poll options."); return;
    }
    if (template === "itinerary" && stops.filter((s) => s.name.trim()).length < 2) {
      Alert.alert("Stops required", "Add at least 2 itinerary stops."); return;
    }
    if (template === "quote" && !quoteAuthor.trim()) {
      Alert.alert("Author required", "Please enter the quote author."); return;
    }

    setSubmitting(true);
    try {
      const uploadedUrls = await uploadImages();

      if (template === "quote") {
        await api.post(`${CULTURE_API}/community/quote`, {
          text, author: quoteAuthor, source: quoteSource || undefined,
        } as Record<string, unknown>);
        nav.goBack();
        return;
      }

      const body: Record<string, unknown> = {
        content:       text,
        tag:           template === "food-review" ? "Food" : sectionTag,
        template_type: template,
        gallery_images: uploadedUrls.length > 1 ? uploadedUrls : undefined,
        image_url:      uploadedUrls[0] ?? undefined,
      };

      if (template === "hidden-gem") {
        body.star_rating          = starRating;
        body.linked_directory_id  = linkedEntry?.id;
      }
      if (template === "cultural-take") {
        body.linked_directory_id = linkedEntry?.id;
      }
      if (template === "food-review") {
        body.food_dish_name       = foodDishName;
        body.food_rating_taste    = foodRatings.taste;
        body.food_rating_value    = foodRatings.value;
        body.food_rating_vibe     = foodRatings.vibe;
        body.linked_directory_id  = linkedEntry?.id;
      }
      if (template === "poll") {
        const expiresAt = new Date(Date.now() + poll.durationDays * 24 * 60 * 60 * 1000).toISOString();
        body.poll_options    = poll.options.filter((o) => o.trim());
        body.poll_expires_at = expiresAt;
      }
      if (template === "itinerary") {
        body.itinerary_stops = stops.filter((s) => s.name.trim());
      }

      await api.post(`${CULTURE_API}/community/submit`, body);
      nav.goBack();
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Could not submit post.");
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = tmpl.maxText - text.length;
  const showGuide = text.length === 0;
  const multi = ["hidden-gem", "food-review", "creative-showcase"].includes(template);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New post</Text>
          <TouchableOpacity
            style={[styles.postBtn, (submitting || text.length < tmpl.minText) && styles.postBtnDisabled]}
            onPress={validateAndSubmit}
            disabled={submitting || text.length < tmpl.minText}
          >
            {submitting
              ? <ActivityIndicator color={colors.paper} size="small" />
              : <Text style={styles.postBtnText}>Post</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Template selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateStrip} contentContainerStyle={styles.templateStripContent}>
          {TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templatePill, template === t.id && styles.templatePillActive]}
              onPress={() => { setTemplate(t.id); setText(""); setTagLocked(false); }}
            >
              <Text style={[styles.templatePillText, template === t.id && styles.templatePillTextActive]}>
                {t.emoji} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* Guide */}
          {showGuide && (
            <View style={styles.guide}>
              <Text style={styles.guideDesc}>{tmpl.description}</Text>
              <View style={styles.chips}>
                {tmpl.chips.map((chip) => (
                  <TouchableOpacity key={chip} style={styles.chip} onPress={() => { setText(chip + " "); textRef.current?.focus(); }}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Main textarea */}
          <TextInput
            ref={textRef}
            style={[styles.textarea, template === "quote" && styles.textareaQuote]}
            value={text}
            onChangeText={handleTextChange}
            multiline
            placeholder={template === "quote" ? "The quote text…" : "What's on your cultural mind?"}
            placeholderTextColor={colors.ghost}
            maxLength={tmpl.maxText + 50}
          />

          {/* Char counter */}
          <Text style={[styles.charCount, remaining < 50 && { color: colors.gold }, remaining < 0 && { color: colors.ochre }]}>
            {remaining}
          </Text>

          {/* Quote fields */}
          {template === "quote" && (
            <View style={styles.fieldGroup}>
              <TextInput style={styles.input} value={quoteAuthor} onChangeText={setQuoteAuthor} placeholder="Author *" placeholderTextColor={colors.ghost} />
              <TextInput style={styles.input} value={quoteSource} onChangeText={setQuoteSource} placeholder="Source (optional)" placeholderTextColor={colors.ghost} />
            </View>
          )}

          {/* Directory search */}
          {(template === "hidden-gem" || template === "cultural-take" || template === "food-review") && (
            <View style={styles.fieldGroup}>
              <DirectorySearch selected={linkedEntry} onSelect={setLinkedEntry} label="Link a place" />
            </View>
          )}

          {/* Star rating */}
          {template === "hidden-gem" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Rating *</Text>
              <StarRating value={starRating} onChange={setStarRating} />
            </View>
          )}

          {/* Food fields */}
          {template === "food-review" && (
            <View style={styles.fieldGroup}>
              <TextInput style={styles.input} value={foodDishName} onChangeText={setFoodDishName} placeholder="Dish / item name *" placeholderTextColor={colors.ghost} />
              <Text style={styles.fieldLabel}>Ratings *</Text>
              <MultiRating ratings={foodRatings} onChange={setFoodRatings} />
            </View>
          )}

          {/* Poll */}
          {template === "poll" && (
            <View style={styles.fieldGroup}>
              <PollBuilder poll={poll} onChange={setPoll} />
            </View>
          )}

          {/* Itinerary */}
          {template === "itinerary" && (
            <View style={styles.fieldGroup}>
              <ItineraryBuilder stops={stops} onChange={setStops} />
            </View>
          )}

          {/* Section tag */}
          {template !== "food-review" && template !== "quote" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Section tag</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTags}>
                {SECTION_TAGS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.sectionTag, sectionTag === t && styles.sectionTagActive]}
                    onPress={() => { setSectionTag(t); setTagLocked(true); }}
                  >
                    <Text style={[styles.sectionTagText, sectionTag === t && styles.sectionTagTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Image picker */}
          {template !== "poll" && template !== "quote" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                {template === "creative-showcase" ? "Media (required)" : "Image (optional)"}
              </Text>
              <TouchableOpacity style={styles.imagePicker} onPress={() => pickImages(multi)}>
                <Ionicons name="image-outline" size={20} color={colors.mute} />
                <Text style={styles.imagePickerText}>
                  {images.length > 0 ? `${images.length} image${images.length > 1 ? "s" : ""} selected` : "Add image"}
                </Text>
              </TouchableOpacity>
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewStrip}>
                  {images.map((uri, i) => (
                    <View key={i} style={styles.previewWrap}>
                      <Image source={{ uri }} style={styles.previewThumb} />
                      <TouchableOpacity style={styles.removeThumb} onPress={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}>
                        <Ionicons name="close" size={12} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  cancelBtn:   { padding: 4 },
  cancelText:  { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },
  postBtn: {
    backgroundColor: colors.ink, borderRadius: radius.full,
    paddingHorizontal: space[4], paddingVertical: space[1] + 2,
    minWidth: 60, alignItems: "center",
  },
  postBtnDisabled: { opacity: 0.4 },
  postBtnText:     { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  templateStrip:        { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.rule },
  templateStripContent: { paddingHorizontal: space[3], paddingVertical: space[2], gap: space[2] },
  templatePill: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: space[1] + 2,
  },
  templatePillActive:     { backgroundColor: colors.ink, borderColor: colors.ink },
  templatePillText:       { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  templatePillTextActive: { color: colors.paper },

  body: { padding: space[4], paddingBottom: space[10] },

  guide:     { marginBottom: space[3] },
  guideDesc: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute, marginBottom: space[2] },
  chips:     { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  chip: {
    backgroundColor: colors.paperDeep, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.full, paddingHorizontal: space[3], paddingVertical: space[1],
  },
  chipText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft },

  textarea: {
    fontFamily: fonts.sans, fontSize: fontSize.base + 1, color: colors.ink,
    lineHeight: 24, minHeight: 120, textAlignVertical: "top",
  },
  textareaQuote: { fontFamily: fonts.serif, fontStyle: "italic", fontSize: fontSize.lg },
  charCount: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost, textAlign: "right", marginBottom: space[2] },

  fieldGroup: { marginTop: space[3], gap: space[2] },
  fieldLabel: {
    fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute,
    letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 4,
  },
  input: {
    fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2], backgroundColor: colors.paperDeep,
  },

  sectionTags: { gap: space[2], paddingVertical: 2 },
  sectionTag: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.full,
    paddingHorizontal: space[3], paddingVertical: space[1],
  },
  sectionTagActive:    { backgroundColor: colors.ink, borderColor: colors.ink },
  sectionTagText:      { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
  sectionTagTextActive:{ color: colors.paper },

  imagePicker: {
    flexDirection: "row", alignItems: "center", gap: space[2],
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[3],
    backgroundColor: colors.paperDeep,
  },
  imagePickerText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute },
  previewStrip: { marginTop: space[2] },
  previewWrap: { position: "relative", marginRight: space[2] },
  previewThumb: { width: 72, height: 72, borderRadius: radius.md },
  removeThumb: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, padding: 2,
  },
});
