import React, { useState, useRef, useMemo } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { detectRegion } from "../../features/community/useFeedRecommendations";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
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
  { id: "post",              label: "Post",             emoji: "✏️",  minText: 1,   maxText: 3000, description: "Share news, a link, or a quick thought from your cultural world.", chips: ["Hot take:", "Just saw that", "Anyone else noticed"] },
  { id: "hidden-gem",        label: "Hidden Gem",       emoji: "💎",  minText: 50,  maxText: 500,  description: "Recommend a place worth visiting — hidden spots, local favourites, underrated venues.", chips: ["Hidden gem alert:", "Not enough people know about", "If you haven't been to"] },
  { id: "cultural-take",     label: "Cultural Take",    emoji: "💬",  minText: 100, maxText: 1000, description: "Share a cultural opinion on a book, film, event, or idea worth discussing.", chips: ["Here's my honest take on", "I finally watched/read", "Why this matters:"] },
  { id: "food-review",       label: "Food Review",      emoji: "🍽️",  minText: 50,  maxText: 500,  description: "Review a dish or restaurant. Rate the taste, value, and vibe.", chips: ["Came for the hype, and", "Best thing on the menu:", "Honest review:"] },
  { id: "creative-showcase", label: "Creative Showcase",emoji: "🎨",  minText: 0,   maxText: 500,  description: "Share your creative work — art, photography, design, or music.", chips: ["Working on something:", "New piece:", "Behind the work:"] },
  { id: "poll",              label: "Poll",             emoji: "📊",  minText: 10,  maxText: 280,  description: "Ask the community something. Great for settling debates or gathering opinions.", chips: ["Which is better:", "Settle this for me:", "Genuine question:"] },
  { id: "itinerary",         label: "Itinerary",        emoji: "🗺️",  minText: 0,   maxText: 300,  description: "Share a travel itinerary or a local route worth following.", chips: ["A perfect day in", "My go-to route:", "For first-timers in"] },
  { id: "event",             label: "Event",            emoji: "📅",  minText: 0,   maxText: 1000, description: "Submit an event to the Moveee calendar — exhibitions, gigs, screenings, markets, and more.", chips: ["Opening night:", "One night only:", "Catch it before it closes:"] },
  { id: "quote",             label: "Quote",            emoji: "✦",   minText: 10,  maxText: 600,  description: "Share a quote that moved you. Add the author and source below.", chips: ["This has stayed with me:", "Still thinking about this:", "Words I keep returning to:"] },
];

const SECTION_TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

const EVENT_CATEGORIES: { id: string; label: string }[] = [
  { id: "live-music",         label: "Music" },
  { id: "visual-art",         label: "Art" },
  { id: "food-drink",         label: "Food" },
  { id: "event-performance",  label: "Sport" },
  { id: "event-community",    label: "Culture" },
  { id: "tech-culture",       label: "Tech" },
  { id: "independent-film",   label: "Film" },
  { id: "fashion-streetwear", label: "Fashion" },
  { id: "literature",         label: "Literature" },
  { id: "visual-design",      label: "Design" },
];

interface DirectoryEntry { id: number; title: string; entry_type: string; city?: string }

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// Templates requiring Taste Maker (2 500 rep)
const TASTE_MAKER_TEMPLATES = new Set<TemplateId>(["poll", "itinerary"]);

export default function NewPostScreen() {
  const nav = useNavigation<any>();
  const { user } = useAuthStore() as any;
  const userRegion = detectRegion(user?.countryOfResidence);
  const userRep: number = user?.reputation ?? 0;
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

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
        const res = await api.upload<{ url: string }>(`${MOBILE_API}/community/upload-image`, uri, fileName, fileType);
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
        await api.post(`${MOBILE_API}/community/quote`, {
          text, author: quoteAuthor, source: quoteSource || undefined,
        } as Record<string, unknown>);
        nav.goBack();
        return;
      }

      const body: Record<string, unknown> = {
        content:          text,
        tag:              template === "food-review" ? "Food" : sectionTag,
        template_type:    template,
        gallery_images:   uploadedUrls.length > 1 ? uploadedUrls : undefined,
        image_url:        uploadedUrls[0] ?? undefined,
        community_region: userRegion ?? undefined,
        city:             user?.city ?? undefined,
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

      await api.post(`${MOBILE_API}/community/submit`, body);
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
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={styles.headerSideBtn}
            onPress={validateAndSubmit}
            disabled={isSubmitDisabled}
          >
            {submitting
              ? <ActivityIndicator color={c.ochre} size="small" />
              : <Text style={[styles.postText, isSubmitDisabled && styles.postTextDisabled]}>Post</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Template selector strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templateStrip}
          contentContainerStyle={styles.templateStripContent}
        >
          {TEMPLATES.map((t) => {
            const locked = TASTE_MAKER_TEMPLATES.has(t.id) && userRep < 2500;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.templateChip, template === t.id && styles.templateChipActive, locked && styles.templateChipLocked]}
                onPress={() => {
                  if (locked) {
                    Alert.alert("Taste Maker required", `${t.label} posts unlock at 2,500 reputation (Taste Maker).`, [{ text: "OK" }]);
                    return;
                  }
                  setTemplate(t.id); setText(""); setTagLocked(false); setShowPicker(false);
                }}
              >
                <Text style={[styles.templateChipText, template === t.id && styles.templateChipTextActive, locked && styles.templateChipTextLocked]}>
                  {locked ? "🔒" : t.emoji} {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">

          {/* Guide chips */}
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

          {/* Event title */}
          {template === "event" && (
            <>
              {/* Calendar info banner */}
              <View style={styles.eventBanner}>
                <Text style={styles.eventBannerText}>📅 This will be added to the Moveee events calendar.</Text>
              </View>
              <TextInput
                style={styles.eventTitleInput}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Event title"
                placeholderTextColor={c.ghost}
                autoFocus
              />
            </>
          )}

          {/* Quote textarea with decorative wrapper */}
          {template === "quote" ? (
            <View style={styles.quoteArea}>
              <Text style={styles.quoteDecoration}>"</Text>
              <TextInput
                ref={textRef}
                style={styles.quoteTextarea}
                value={text}
                onChangeText={handleTextChange}
                multiline
                placeholder="The quote text…"
                placeholderTextColor={c.ghost}
                maxLength={tmpl.maxText + 50}
              />
              <Text style={styles.charCountInline}>{remaining} remaining</Text>
            </View>
          ) : (
            /* Main textarea for all other templates */
            template !== "event" || true ? (
              <TextInput
                ref={textRef}
                style={styles.textarea}
                value={text}
                onChangeText={handleTextChange}
                multiline
                placeholder={
                  template === "event"     ? "Event description (optional)…" :
                  template === "itinerary" ? "Describe this route… where, when, who for?" :
                  "What's on your cultural mind?"
                }
                placeholderTextColor={c.ghost}
                maxLength={tmpl.maxText + 50}
              />
            ) : null
          )}

          {/* Char counter (not for quote — shown inline) */}
          {template !== "quote" && (
            <Text style={[styles.charCount, remaining < 50 && { color: c.gold }, remaining < 0 && { color: c.ochre }]}>
              {remaining}
            </Text>
          )}

          {/* Quote author + source fields */}
          {template === "quote" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Author</Text>
              <TextInput style={styles.input} value={quoteAuthor} onChangeText={setQuoteAuthor} placeholder="Author *" placeholderTextColor={c.ghost} />
              <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Source (optional)</Text>
              <TextInput style={styles.input} value={quoteSource} onChangeText={setQuoteSource} placeholder="Source (optional)" placeholderTextColor={c.ghost} />
              {/* Quote category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTags}>
                {["📚 Book", "🎙️ Speech", "🎬 Film"].map((cat) => (
                  <TouchableOpacity key={cat} style={styles.sectionTag}>
                    <Text style={styles.sectionTagText}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
              <TextInput style={styles.input} value={foodDishName} onChangeText={setFoodDishName} placeholder="Dish / item name *" placeholderTextColor={c.ghost} />
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

          {/* Event fields */}
          {template === "event" && (
            <View style={styles.fieldGroup}>

              {/* Date rows */}
              <View style={styles.eventDateBlock}>
                {/* Start date */}
                <View style={styles.eventDateRow}>
                  <Text style={styles.eventDateEmoji}>📅</Text>
                  <Text style={styles.eventDateLabel}>Start date</Text>
                  <TouchableOpacity style={styles.eventDateInput} onPress={() => openPicker("start", "date")}>
                    <Text style={[styles.eventDateInputText, !!eventDate && styles.eventDateInputTextSet]}>
                      {eventDate ? fmtDate(eventDate) : "Set date"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* Start time */}
                <View style={styles.eventDateRow}>
                  <Text style={styles.eventDateEmoji}>🕐</Text>
                  <Text style={styles.eventDateLabel}>Start time</Text>
                  <TouchableOpacity style={styles.eventDateInput} onPress={() => openPicker("start", "time")}>
                    <Text style={[styles.eventDateInputText, !!eventDate && styles.eventDateInputTextSet]}>
                      {eventDate ? fmtTime(eventDate) : "Time"}
                    </Text>
                  </TouchableOpacity>
                </View>
                {/* End date */}
                <View style={styles.eventDateRow}>
                  <Text style={[styles.eventDateEmoji, { opacity: 0.4 }]}>📅</Text>
                  <Text style={styles.eventDateLabel}>End date</Text>
                  <TouchableOpacity style={styles.eventDateInput} onPress={() => openPicker("end", "date")}>
                    <Text style={[styles.eventDateInputText, !!eventEndDate && styles.eventDateInputTextSet]}>
                      {eventEndDate ? fmtDate(eventEndDate) : "Optional"}
                    </Text>
                  </TouchableOpacity>
                  {eventEndDate && (
                    <TouchableOpacity onPress={() => setEventEndDate(null)} style={{ paddingLeft: 4 }}>
                      <Ionicons name="close" size={16} color={c.mute} />
                    </TouchableOpacity>
                  )}
                </View>
                {/* End time */}
                <View style={styles.eventDateRow}>
                  <Text style={[styles.eventDateEmoji, { opacity: 0.4 }]}>🕐</Text>
                  <Text style={styles.eventDateLabel}>End time</Text>
                  <TouchableOpacity style={styles.eventDateInput} onPress={() => openPicker("end", "time")}>
                    <Text style={[styles.eventDateInputText, !!eventEndDate && styles.eventDateInputTextSet]}>
                      {eventEndDate ? fmtTime(eventEndDate) : "Optional"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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

              {/* Location meta */}
              <View style={styles.eventMetaBlock}>
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventMetaIcon}>📍</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={eventVenue}
                    onChangeText={setEventVenue}
                    placeholder="Venue, address"
                    placeholderTextColor={c.ghost}
                  />
                </View>
                <TextInput
                  style={styles.input}
                  value={eventCity}
                  onChangeText={setEventCity}
                  placeholder="City"
                  placeholderTextColor={c.ghost}
                />
                <View style={styles.eventMetaRow}>
                  <View style={styles.currencyPrefix}>
                    <Text style={styles.currencyText}>£</Text>
                  </View>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={eventAdmission}
                    onChangeText={setEventAdmission}
                    placeholder="Admission (e.g. Free / £15 adv)"
                    placeholderTextColor={c.ghost}
                  />
                </View>
                <View style={styles.eventMetaRow}>
                  <Text style={styles.eventMetaIcon}>🔗</Text>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={eventTicketUrl}
                    onChangeText={setEventTicketUrl}
                    placeholder="https://..."
                    placeholderTextColor={c.ghost}
                    autoCapitalize="none"
                    keyboardType="url"
                  />
                </View>
              </View>

              {/* Category chips */}
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
              {template === "creative-showcase" ? (
                /* Showcase: large upload area */
                <TouchableOpacity style={styles.showcaseUpload} onPress={() => pickImages(true)}>
                  <Ionicons name="camera-outline" size={28} color={c.ochre} />
                  <Text style={styles.showcaseUploadText}>Add your work</Text>
                  <Text style={styles.showcaseUploadSub}>photos, screenshots, renders</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.imagePicker} onPress={() => pickImages(multi)}>
                  <Ionicons name="image-outline" size={20} color={c.mute} />
                  <Text style={styles.imagePickerText}>
                    {images.length > 0 ? `${images.length} image${images.length > 1 ? "s" : ""} selected` : "Add image (optional)"}
                  </Text>
                </TouchableOpacity>
              )}
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

        {/* Bottom media toolbar */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarIcons}>
            <TouchableOpacity onPress={() => pickImages(multi)}>
              <Ionicons name="camera-outline" size={24} color={template === "creative-showcase" ? c.ochre : c.mute} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="attach-outline" size={24} color={c.mute} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="location-outline" size={24} color={c.mute} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="happy-outline" size={24} color={c.mute} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.toolbarAt}>@</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.toolbarCount}>{remaining} remaining</Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.paper },

  // Header
  header: {
    height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.ghost,
    backgroundColor: c.paper,
  },
  headerSideBtn:   { minWidth: 44, minHeight: 44, justifyContent: "center" },
  headerTitle:     { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
  cancelText:      { fontFamily: fonts.sans, fontSize: 14, color: c.ochre },
  postText:        { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre, textAlign: "right" },
  postTextDisabled:{ opacity: 0.35 },

  // Template strip
  templateStrip:        { flexGrow: 0, maxHeight: 48, borderBottomWidth: 1, borderBottomColor: c.ghost, backgroundColor: c.paper },
  templateStripContent: { paddingHorizontal: space[4], alignItems: "center", gap: 8 },
  templateChip: {
    height: 36, paddingHorizontal: 10, borderRadius: radius.full,
    backgroundColor: c.paperDeep, justifyContent: "center",
  },
  templateChipActive:     { backgroundColor: c.ochre },
  templateChipLocked:     { opacity: 0.45 },
  templateChipText:       { fontFamily: fonts.sansBold, fontSize: 12, color: c.inkSoft },
  templateChipTextActive: { color: c.paper },
  templateChipTextLocked: { color: c.mute },

  body: { padding: space[4], paddingBottom: 100 },

  // Guide
  guide:     { marginBottom: space[3] },
  guideDesc: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, marginBottom: space[2] },
  chips:     { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
  chip: {
    backgroundColor: c.paperDeep, borderRadius: radius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  chipText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },

  // Textarea
  textarea: {
    fontFamily: fonts.sans, fontSize: 15, color: c.ink,
    lineHeight: 24, minHeight: 100, textAlignVertical: "top",
  },
  charCount: {
    fontFamily: fonts.mono, fontSize: 11, color: c.mute,
    textAlign: "right", marginBottom: space[2],
  },

  // Quote area
  quoteArea: {
    backgroundColor: c.paperWarm, padding: 16,
    borderRadius: radius.md, minHeight: 140, marginBottom: space[3], position: "relative",
  },
  quoteDecoration: {
    position: "absolute", top: 4, left: 12,
    fontFamily: fonts.serif, fontSize: 40, color: c.ghost, opacity: 0.4, lineHeight: 44,
  },
  quoteTextarea: {
    fontFamily: fonts.serif, fontSize: 16, fontStyle: "italic", color: c.ink,
    lineHeight: 26, minHeight: 100, textAlignVertical: "top", marginTop: 16,
    backgroundColor: "transparent",
  },
  charCountInline: {
    fontFamily: fonts.mono, fontSize: 11, color: c.mute, textAlign: "right", marginTop: 4,
  },

  // Fields
  fieldGroup: { marginTop: 12, gap: 8 },
  fieldLabel: {
    fontFamily: fonts.mono, fontSize: 12, color: c.mute,
    letterSpacing: 0.8, textTransform: "uppercase",
  },
  input: {
    height: 44, fontFamily: fonts.sans, fontSize: 14, color: c.ink,
    borderWidth: 1, borderColor: c.ghost, borderRadius: 8,
    paddingHorizontal: 16, backgroundColor: c.paper,
  },

  // Section tags
  sectionTags: { gap: 8, paddingVertical: 2 },
  sectionTag: {
    height: 32, paddingHorizontal: 16, borderRadius: radius.full,
    borderWidth: 1, borderColor: c.ghost, backgroundColor: c.paper,
    justifyContent: "center",
  },
  sectionTagActive:     { backgroundColor: c.ink, borderColor: c.ink },
  sectionTagText:       { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },
  sectionTagTextActive: { color: c.paper, fontFamily: fonts.sansBold },

  // Event styles
  eventBanner: {
    backgroundColor: c.paperDeep, borderRadius: 8,
    padding: 10, marginBottom: 12,
  },
  eventBannerText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
  eventTitleInput: {
    height: 52, fontFamily: fonts.sansBold, fontSize: 17, color: c.ink,
    borderWidth: 1, borderColor: c.ghost, borderRadius: 8,
    paddingHorizontal: 16, backgroundColor: c.paper, marginBottom: 12,
  },
  eventDateBlock:   { gap: 10, marginBottom: 12 },
  eventDateRow:     { flexDirection: "row", alignItems: "center", gap: 8 },
  eventDateEmoji:   { fontSize: 16, width: 20, textAlign: "center" },
  eventDateLabel:   { fontFamily: fonts.sans, fontSize: 12, color: c.mute, width: 72 },
  eventDateInput: {
    flex: 1, height: 48, borderWidth: 1, borderColor: c.ghost,
    borderRadius: 8, paddingHorizontal: 12, backgroundColor: c.paper,
    justifyContent: "center",
  },
  eventDateInputText:    { fontFamily: fonts.sans, fontSize: 14, color: c.ghost },
  eventDateInputTextSet: { color: c.ink },
  eventMetaBlock:  { gap: 10, marginBottom: 12 },
  eventMetaRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  eventMetaIcon:   { fontSize: 16, width: 24, textAlign: "center" },
  currencyPrefix: {
    backgroundColor: c.paperDeep, borderRadius: 4,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  currencyText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.inkSoft },

  // Image pickers
  imagePicker: {
    flexDirection: "row", alignItems: "center", gap: 8,
    height: 48, borderWidth: 1, borderColor: c.ghost, borderRadius: 8,
    paddingHorizontal: 16, backgroundColor: c.paper,
  },
  imagePickerText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },
  showcaseUpload: {
    height: 140, borderWidth: 1, borderColor: c.ghost, borderRadius: 12,
    borderStyle: "dashed", backgroundColor: c.paperDeep,
    alignItems: "center", justifyContent: "center", gap: 6,
  },
  showcaseUploadText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.inkSoft },
  showcaseUploadSub:  { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
  previewStrip: { marginTop: 8 },
  previewWrap:  { position: "relative", marginRight: 8 },
  previewThumb: { width: 72, height: 72, borderRadius: 8 },
  removeThumb: {
    position: "absolute", top: 4, right: 4,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 8, padding: 2,
  },

  // Date picker
  pickerWrap: {
    borderWidth: 1, borderColor: c.ghost, borderRadius: 8,
    overflow: "hidden", backgroundColor: c.paperDeep,
  },
  iosDoneBtn: {
    alignSelf: "flex-end", margin: 8,
    backgroundColor: c.ink, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  iosDoneBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },

  // Bottom toolbar
  toolbar: {
    height: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: c.paper, borderTopWidth: 1, borderTopColor: c.ghost,
    paddingHorizontal: 16,
  },
  toolbarIcons: { flexDirection: "row", alignItems: "center", gap: 20 },
  toolbarAt: {
    fontFamily: fonts.sans, fontSize: 20, color: c.mute,
    lineHeight: 24, includeFontPadding: false,
  },
  toolbarCount: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
  });
}
