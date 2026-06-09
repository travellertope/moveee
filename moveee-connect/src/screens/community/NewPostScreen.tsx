import React, { useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, CULTURE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import StarRating from "../../components/composer/StarRating";
import MultiRating from "../../components/composer/MultiRating";
import PollBuilder, { PollDraft } from "../../components/composer/PollBuilder";
import ItineraryBuilder, { StopDraft } from "../../components/composer/ItineraryBuilder";
import DirectorySearch from "../../components/composer/DirectorySearch";

const PROXY = "https://themoveee.com/api";

// ── Template metadata ─────────────────────────────────────────────────────────
type TemplateId =
  | "post" | "hidden-gem" | "cultural-take" | "food-review"
  | "creative-showcase" | "poll" | "itinerary" | "event" | "quote";

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
  { id: "event",             label: "Event",    emoji: "📅", minText: 0,   maxText: 1000, description: "Submit an event to the Moveee calendar — exhibitions, gigs, screenings, markets, and more.", chips: ["Opening night:", "One night only:", "Catch it before it closes:"] },
  { id: "quote",             label: "Quote",    emoji: "✦",  minText: 10,  maxText: 600,  description: "Share a quote that moved you. Add the author and source below.", chips: ["This has stayed with me:", "Still thinking about this:", "Words I keep returning to:"] },
];

const SECTION_TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

const EVENT_CATEGORIES: { id: string; label: string }[] = [
  { id: "live-music",         label: "Live Music" },
  { id: "independent-film",   label: "Film" },
  { id: "visual-art",         label: "Visual Art" },
  { id: "fashion-streetwear", label: "Fashion" },
  { id: "food-drink",         label: "Food & Drink" },
  { id: "literature",         label: "Literature" },
  { id: "visual-design",      label: "Design" },
  { id: "event-performance",  label: "Performance" },
  { id: "event-community",    label: "Community" },
  { id: "tech-culture",       label: "Tech & Culture" },
];

interface DirectoryEntry { id: number; title: string; entry_type: string; city?: string }

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

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

  // Event-specific state
  const [eventTitle,     setEventTitle]     = useState("");
  const [eventDate,      setEventDate]      = useState<Date | null>(null);
  const [eventEndDate,   setEventEndDate]   = useState<Date | null>(null);
  const [eventVenue,     setEventVenue]     = useState("");
  const [eventCity,      setEventCity]      = useState("");
  const [eventAdmission, setEventAdmission] = useState("");
  const [eventTicketUrl, setEventTicketUrl] = useState("");
  const [eventCategory,  setEventCategory]  = useState("");
  const [eventOrganiser, setEventOrganiser] = useState<DirectoryEntry | null>(null);

  // Date/time picker state
  const [showPicker,   setShowPicker]   = useState(false);
  const [pickerMode,   setPickerMode]   = useState<"date" | "time">("date");
  const [pickerTarget, setPickerTarget] = useState<"start" | "end">("start");

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

  const openPicker = (target: "start" | "end", mode: "date" | "time") => {
    setPickerTarget(target);
    setPickerMode(mode);
    setShowPicker(true);
  };

  const pickerValue = (): Date =>
    (pickerTarget === "start" ? eventDate : eventEndDate) ?? new Date();

  const onPickerChange = (event: any, date?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (!date || event.type === "dismissed") return;
    const apply = (base: Date | null): Date => {
      const result = new Date(base ?? Date.now());
      if (pickerMode === "date") {
        result.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        result.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      return result;
    };
    if (pickerTarget === "start") setEventDate(apply(eventDate));
    else setEventEndDate(apply(eventEndDate));
  };

  const validateAndSubmit = async () => {
    if (template !== "event" && text.length < tmpl.minText) {
      Alert.alert("Too short", `Need at least ${tmpl.minText} characters for this template.`); return;
    }
    if (template === "event") {
      if (!eventTitle.trim()) { Alert.alert("Title required", "Add an event title."); return; }
      if (!eventDate) { Alert.alert("Date required", "Select a start date and time."); return; }
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
      // Event: different upload + submit endpoints (Next.js proxy)
      if (template === "event") {
        let imageUrl: string | undefined;
        if (images.length > 0) {
          const uri = images[0];
          const fileName = uri.split("/").pop() ?? "event.jpg";
          const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
          try {
            const res = await api.upload<{ url: string }>(`${PROXY}/events/upload-image`, uri, fileName, fileType);
            imageUrl = res.url;
          } catch { /* skip */ }
        }
        await api.post(`${PROXY}/events/member-submit`, {
          title:        eventTitle.trim(),
          description:  text.trim() || undefined,
          start_date:   eventDate!.toISOString(),
          end_date:     eventEndDate?.toISOString() || undefined,
          venue:        eventVenue.trim() || undefined,
          city:         eventCity.trim() || undefined,
          category:     eventCategory || undefined,
          admission:    eventAdmission.trim() || undefined,
          ticket_url:   eventTicketUrl.trim() || undefined,
          organiser_id: eventOrganiser?.id || undefined,
          image_url:    imageUrl,
        } as Record<string, unknown>);
        Alert.alert("Event submitted", "Your event will appear on the events calendar shortly.");
        nav.goBack();
        return;
      }

      const uploadedUrls = await uploadImages();

      if (template === "quote") {
        await api.post(`${CULTURE_API}/community/quote`, {
          text, author: quoteAuthor, source: quoteSource || undefined,
        } as Record<string, unknown>);
        nav.goBack();
        return;
      }

      const body: Record<string, unknown> = {
        content:        text,
        tag:            template === "food-review" ? "Food" : sectionTag,
        template_type:  template,
        gallery_images: uploadedUrls.length > 1 ? uploadedUrls : undefined,
        image_url:      uploadedUrls[0] ?? undefined,
      };

      if (template === "hidden-gem") {
        body.star_rating         = starRating;
        body.linked_directory_id = linkedEntry?.id;
      }
      if (template === "cultural-take") {
        body.linked_directory_id = linkedEntry?.id;
      }
      if (template === "food-review") {
        body.food_dish_name      = foodDishName;
        body.food_rating_taste   = foodRatings.taste;
        body.food_rating_value   = foodRatings.value;
        body.food_rating_vibe    = foodRatings.vibe;
        body.linked_directory_id = linkedEntry?.id;
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
  const showGuide = text.length === 0 && template !== "event";
  const multi = ["hidden-gem", "food-review", "creative-showcase"].includes(template);
  const isSubmitDisabled =
    submitting ||
    (template !== "event" && text.length < tmpl.minText) ||
    (template === "event" && (!eventTitle.trim() || !eventDate));

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
            style={[styles.postBtn, isSubmitDisabled && styles.postBtnDisabled]}
            onPress={validateAndSubmit}
            disabled={isSubmitDisabled}
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
              onPress={() => { setTemplate(t.id); setText(""); setTagLocked(false); setShowPicker(false); }}
            >
              <Text style={[styles.templatePillText, template === t.id && styles.templatePillTextActive]}>
                {t.emoji} {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* Guide chips (not shown for event template) */}
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

          {/* Event title — above the description textarea */}
          {template === "event" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Event title *</Text>
              <TextInput
                style={styles.input}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Event title"
                placeholderTextColor={colors.ghost}
                autoFocus
              />
            </View>
          )}

          {/* Main textarea */}
          <TextInput
            ref={textRef}
            style={[styles.textarea, template === "quote" && styles.textareaQuote]}
            value={text}
            onChangeText={handleTextChange}
            multiline
            placeholder={
              template === "quote"  ? "The quote text…"               :
              template === "event"  ? "Event description (optional)…" :
              "What's on your cultural mind?"
            }
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

          {/* ── Event fields ──────────────────────────────────────────── */}
          {template === "event" && (
            <View style={styles.fieldGroup}>

              {/* Start date & time */}
              <Text style={styles.fieldLabel}>Start date & time *</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={[styles.dateBtn, { flex: 2 }]} onPress={() => openPicker("start", "date")}>
                  <Ionicons name="calendar-outline" size={14} color={colors.mute} />
                  <Text style={[styles.dateBtnText, !!eventDate && styles.dateBtnTextSet]}>
                    {eventDate ? fmtDate(eventDate) : "Set date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateBtn, { flex: 1 }]} onPress={() => openPicker("start", "time")}>
                  <Ionicons name="time-outline" size={14} color={colors.mute} />
                  <Text style={[styles.dateBtnText, !!eventDate && styles.dateBtnTextSet]}>
                    {eventDate ? fmtTime(eventDate) : "Time"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* End date & time */}
              <Text style={styles.fieldLabel}>End date & time (optional)</Text>
              <View style={styles.dateRow}>
                <TouchableOpacity style={[styles.dateBtn, { flex: 2 }]} onPress={() => openPicker("end", "date")}>
                  <Ionicons name="calendar-outline" size={14} color={colors.mute} />
                  <Text style={[styles.dateBtnText, !!eventEndDate && styles.dateBtnTextSet]}>
                    {eventEndDate ? fmtDate(eventEndDate) : "Set date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.dateBtn, { flex: 1 }]} onPress={() => openPicker("end", "time")}>
                  <Ionicons name="time-outline" size={14} color={colors.mute} />
                  <Text style={[styles.dateBtnText, !!eventEndDate && styles.dateBtnTextSet]}>
                    {eventEndDate ? fmtTime(eventEndDate) : "Time"}
                  </Text>
                </TouchableOpacity>
                {eventEndDate && (
                  <TouchableOpacity onPress={() => setEventEndDate(null)} style={styles.clearEndDate}>
                    <Ionicons name="close" size={16} color={colors.mute} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Date/time picker (inline on iOS, modal dialog on Android) */}
              {showPicker && (
                <View style={styles.pickerWrap}>
                  {Platform.OS === "ios" && (
                    <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.iosDoneBtn}>
                      <Text style={styles.iosDoneBtnText}>Done</Text>
                    </TouchableOpacity>
                  )}
                  <DateTimePicker
                    value={pickerValue()}
                    mode={pickerMode}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={onPickerChange}
                  />
                </View>
              )}

              {/* Venue + City side by side */}
              <View style={styles.rowFields}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Venue</Text>
                  <TextInput
                    style={styles.input}
                    value={eventVenue}
                    onChangeText={setEventVenue}
                    placeholder="Venue name"
                    placeholderTextColor={colors.ghost}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    style={styles.input}
                    value={eventCity}
                    onChangeText={setEventCity}
                    placeholder="City"
                    placeholderTextColor={colors.ghost}
                  />
                </View>
              </View>

              {/* Category */}
              <Text style={styles.fieldLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTags}>
                {EVENT_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.sectionTag, eventCategory === cat.id && styles.sectionTagActive]}
                    onPress={() => setEventCategory(eventCategory === cat.id ? "" : cat.id)}
                  >
                    <Text style={[styles.sectionTagText, eventCategory === cat.id && styles.sectionTagTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Admission + Ticketing URL */}
              <TextInput
                style={styles.input}
                value={eventAdmission}
                onChangeText={setEventAdmission}
                placeholder="Admission (e.g. Free, £10)"
                placeholderTextColor={colors.ghost}
              />
              <TextInput
                style={styles.input}
                value={eventTicketUrl}
                onChangeText={setEventTicketUrl}
                placeholder="Ticketing URL (optional)"
                placeholderTextColor={colors.ghost}
                autoCapitalize="none"
                keyboardType="url"
              />

              {/* Organiser */}
              <DirectorySearch selected={eventOrganiser} onSelect={setEventOrganiser} label="Organiser (optional)" />
            </View>
          )}

          {/* Section tag (not for food-review, quote, or event) */}
          {template !== "food-review" && template !== "quote" && template !== "event" && (
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

  // Event-specific styles
  dateRow:        { flexDirection: "row", gap: space[2] },
  dateBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[2],
    backgroundColor: colors.paperDeep,
  },
  dateBtnText:    { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost },
  dateBtnTextSet: { color: colors.ink },
  clearEndDate:   { padding: 4, justifyContent: "center" },
  rowFields:      { flexDirection: "row", gap: space[2] },
  pickerWrap: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    overflow: "hidden", backgroundColor: colors.paperDeep,
  },
  iosDoneBtn: {
    alignSelf: "flex-end", margin: space[2],
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingHorizontal: space[3], paddingVertical: space[1],
  },
  iosDoneBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.paper },
});
