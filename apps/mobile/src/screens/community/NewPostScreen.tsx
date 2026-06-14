import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { api, MOBILE_API } from "../../api/client";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import StarRating from "../../components/composer/StarRating";
import MultiRating from "../../components/composer/MultiRating";
import PollBuilder, { PollDraft } from "../../components/composer/PollBuilder";
import ItineraryBuilder, { StopDraft } from "../../components/composer/ItineraryBuilder";
import DirectorySearch from "../../components/composer/DirectorySearch";

import { TEMPLATE_DEFS } from "../../components/community/TemplatePickerSheet";
import type { TemplateId } from "../../components/community/TemplatePickerSheet";
import TemplatePickerSheet from "../../components/community/TemplatePickerSheet";

const PROXY = "https://themoveee.com/api";

interface TemplateMeta {
  id: TemplateId;
  minText: number;
  maxText: number;
  chips: string[];
  placeholder: string;
  showPhoto: boolean;
  showAt: boolean;
  showLocation: boolean;
  multiPhoto: boolean;
}

const TEMPLATES: TemplateMeta[] = [
  {
    id: "post", minText: 1, maxText: 3000,
    chips: ["Hot take:", "Just saw that", "Anyone else noticed"],
    placeholder: "What's on your cultural mind?",
    showPhoto: true, showAt: true, showLocation: false, multiPhoto: true,
  },
  {
    id: "hidden-gem", minText: 50, maxText: 500,
    chips: ["Hidden gem alert:", "Not enough people know about", "If you haven't been to"],
    placeholder: "Tell people why this place is special…",
    showPhoto: true, showAt: false, showLocation: false, multiPhoto: true,
  },
  {
    id: "cultural-take", minText: 100, maxText: 1000,
    chips: ["Here's my honest take on", "I finally watched/read", "Why this matters:"],
    placeholder: "Your take on the culture…",
    showPhoto: false, showAt: false, showLocation: false, multiPhoto: false,
  },
  {
    id: "food-review", minText: 50, maxText: 500,
    chips: ["Came for the hype, and", "Best thing on the menu:", "Honest review:"],
    placeholder: "What did you eat and what did you think?",
    showPhoto: true, showAt: false, showLocation: false, multiPhoto: true,
  },
  {
    id: "book-review", minText: 50, maxText: 800,
    chips: ["Finished it and honestly:", "Had high hopes but", "The kind of book that"],
    placeholder: "What did you think of the book? Who would love it?",
    showPhoto: false, showAt: false, showLocation: false, multiPhoto: false,
  },
  {
    id: "creative-showcase", minText: 0, maxText: 500,
    chips: ["Working on something:", "New piece:", "Behind the work:"],
    placeholder: "Tell us about the work, your process, or inspiration…",
    showPhoto: true, showAt: false, showLocation: false, multiPhoto: true,
  },
  {
    id: "poll", minText: 10, maxText: 280,
    chips: ["Which is better:", "Settle this for me:", "Genuine question:"],
    placeholder: "Ask the community…",
    showPhoto: false, showAt: false, showLocation: false, multiPhoto: false,
  },
  {
    id: "itinerary", minText: 0, maxText: 300,
    chips: ["A perfect day in", "My go-to route:", "For first-timers in"],
    placeholder: "Set the scene — where is this route and who is it for?",
    showPhoto: true, showAt: false, showLocation: true, multiPhoto: true,
  },
  {
    id: "event", minText: 0, maxText: 1000,
    chips: ["Opening night:", "One night only:", "Catch it before it closes:"],
    placeholder: "Describe the event — what makes it worth attending?",
    showPhoto: true, showAt: false, showLocation: false, multiPhoto: true,
  },
  {
    id: "quote", minText: 10, maxText: 600,
    chips: ["This has stayed with me:", "Still thinking about this:", "Words I keep returning to:"],
    placeholder: "The quote…",
    showPhoto: false, showAt: false, showLocation: false, multiPhoto: false,
  },
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

export default function NewPostScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  // Initialise from route param set by TemplatePickerSheet
  const [template, setTemplate] = useState<TemplateId>(route.params?.template ?? "post");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [text, setText] = useState("");
  const [sectionTag, setSectionTag] = useState<string | null>(null);
  const [tagLocked, setTagLocked] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [locationVisible, setLocationVisible] = useState(false);
  const [itineraryCity, setItineraryCity] = useState("");

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
  const tmplDef = TEMPLATE_DEFS.find((t) => t.id === template)!;

  const handleTextChange = (v: string) => {
    setText(v);
    if (!tagLocked && v.length >= 20) {
      const lc = v.toLowerCase();
      const detected = SECTION_TAGS.find((t) => lc.includes(t.toLowerCase()));
      if (detected) setSectionTag(detected);
    }
  };

  const switchTemplate = useCallback((id: TemplateId) => {
    setTemplate(id);
    setText("");
    setTagLocked(false);
    setShowPicker(false);
    setImages([]);
    setLocationVisible(false);
  }, []);

  const MAX_IMAGES = 4;

  const pickImages = useCallback(async (multi = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: multi,
      selectionLimit: multi ? MAX_IMAGES : 1,
      quality: 0.85,
    });
    if (!result.canceled) {
      if (multi) {
        setImages((prev) => {
          const newUris = result.assets.map((a) => a.uri);
          const combined = [...prev, ...newUris];
          if (combined.length > MAX_IMAGES) {
            Alert.alert("Maximum 4 images", "You can add up to 4 images per post.");
          }
          return combined.slice(0, MAX_IMAGES);
        });
      } else {
        setImages([result.assets[0].uri]);
      }
    }
  }, []);

  const removeImage = useCallback((i: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== i));
  }, []);

  const insertAt = useCallback(() => {
    const cur = text;
    setText(cur + (cur.endsWith(" ") || cur === "" ? "@" : " @"));
    setTimeout(() => textRef.current?.focus(), 50);
  }, [text]);

  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const uri of images) {
      try {
        const fileName = uri.split("/").pop() ?? "photo.jpg";
        const fileType = fileName.endsWith(".png") ? "image/png" : "image/jpeg";
        const res = await api.upload<{ url: string }>(`${MOBILE_API}/community/upload-image`, uri, fileName, fileType);
        urls.push(res.url);
      } catch { /* skip */ }
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
      Alert.alert("Media required", "Add at least one image of your work."); return;
    }
    if (template === "poll" && poll.options.filter((o) => o.trim()).length < 2) {
      Alert.alert("Poll options required", "Add at least 2 poll options."); return;
    }
    if (template === "itinerary" && stops.filter((s) => s.name.trim()).length < 2) {
      Alert.alert("Stops required", "Add at least 2 stops."); return;
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
        body.itinerary_city  = itineraryCity.trim() || undefined;
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
  const isSubmitDisabled =
    submitting ||
    (template !== "event" && text.length < tmpl.minText) ||
    (template === "event" && (!eventTitle.trim() || !eventDate));

  // ── Toolbar icon set per template ──────────────────────────────────────────
  const toolbarIcons = useMemo(() => {
    const icons: React.ReactNode[] = [];

    if (tmpl.showPhoto) {
      icons.push(
        <TouchableOpacity
          key="photo"
          onPress={() => pickImages(tmpl.multiPhoto)}
          style={[styles.toolbarIconBtn, images.length > 0 && styles.toolbarIconActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={images.length > 0 ? "camera" : "camera-outline"}
            size={22}
            color={images.length > 0 ? c.gold : c.inkSoft}
          />
          {images.length > 0 && (
            <View style={styles.iconBadge}>
              <Text style={styles.iconBadgeText}>{images.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    }

    if (tmpl.showLocation) {
      icons.push(
        <TouchableOpacity
          key="location"
          onPress={() => setLocationVisible((v) => !v)}
          style={[styles.toolbarIconBtn, locationVisible && styles.toolbarIconActive]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={locationVisible ? "location" : "location-outline"}
            size={22}
            color={locationVisible ? c.gold : c.inkSoft}
          />
        </TouchableOpacity>
      );
    }

    if (tmpl.showAt) {
      icons.push(
        <TouchableOpacity
          key="at"
          onPress={insertAt}
          style={styles.toolbarIconBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.toolbarAt}>@</Text>
        </TouchableOpacity>
      );
    }

    return icons;
  }, [tmpl, images.length, locationVisible, c, pickImages, insertAt]);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerSideBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New {tmplDef?.label ?? "Post"}</Text>
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

        {/* ── Compact template indicator bar ── */}
        <View style={styles.templateBar}>
          <View style={styles.templateBarLeft}>
            <Text style={styles.templateBarEmoji}>{tmplDef?.emoji}</Text>
            <Text style={[styles.templateBarLabel, { color: tmplDef?.color ?? c.ochre }]}>{tmplDef?.label}</Text>
          </View>
          <TouchableOpacity onPress={() => setPickerOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.changeFormatText}>Change format</Text>
          </TouchableOpacity>
        </View>

        {/* ── Template picker sheet ── */}
        <TemplatePickerSheet
          visible={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={(id) => { setPickerOpen(false); switchTemplate(id); }}
        />

        {/* ── Scrollable body ── */}
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── CREATIVE SHOWCASE: upload zone first ── */}
          {template === "creative-showcase" && (
            <TouchableOpacity
              style={[styles.showcaseUpload, images.length > 0 && styles.showcaseUploadFilled]}
              onPress={() => pickImages(true)}
              activeOpacity={0.85}
            >
              {images.length === 0 ? (
                <>
                  <Ionicons name="camera-outline" size={32} color={c.ochre} />
                  <Text style={styles.showcaseUploadTitle}>Add your work</Text>
                  <Text style={styles.showcaseUploadSub}>Photos, screenshots, renders</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={28} color={c.ochre} />
                  <Text style={styles.showcaseUploadTitle}>{images.length} image{images.length > 1 ? "s" : ""} ready</Text>
                  <Text style={styles.showcaseUploadSub}>Tap to change selection</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {/* ── QUOTE: decorative text area ── */}
          {template === "quote" ? (
            <View style={styles.quoteWrap}>
              <Text style={styles.quoteDecorationOpen}>"</Text>
              <TextInput
                ref={textRef}
                style={styles.quoteTextarea}
                value={text}
                onChangeText={handleTextChange}
                multiline
                placeholder={tmpl.placeholder}
                placeholderTextColor={c.ghost}
                maxLength={tmpl.maxText + 50}
              />
              <Text style={styles.quoteDecorationClose}>"</Text>
            </View>
          ) : template === "event" ? (
            /* ── EVENT: title first ── */
            <>
              <View style={styles.eventBanner}>
                <Ionicons name="calendar-outline" size={14} color={c.mute} />
                <Text style={styles.eventBannerText}>This will be added to the Moveee events calendar.</Text>
              </View>
              <TextInput
                style={styles.eventTitleInput}
                value={eventTitle}
                onChangeText={setEventTitle}
                placeholder="Event title *"
                placeholderTextColor={c.ghost}
                autoFocus
              />
            </>
          ) : (
            /* ── ALL OTHER TEMPLATES: starter chips + textarea ── */
            <>
              {text.length === 0 && (
                <View style={styles.guide}>
                  <Text style={styles.guideDesc}>{tmplDef?.desc ?? ""}</Text>
                  <View style={styles.chips}>
                    {tmpl.chips.map((chip) => (
                      <TouchableOpacity
                        key={chip}
                        style={styles.chip}
                        onPress={() => { setText(chip + " "); setTimeout(() => textRef.current?.focus(), 50); }}
                      >
                        <Text style={styles.chipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
              <TextInput
                ref={textRef}
                style={styles.textarea}
                value={text}
                onChangeText={handleTextChange}
                multiline
                placeholder={tmpl.placeholder}
                placeholderTextColor={c.ghost}
                maxLength={tmpl.maxText + 50}
                textAlignVertical="top"
              />
            </>
          )}

          {/* ── Char counter ── */}
          {template !== "event" && (
            <Text style={[
              styles.charCount,
              remaining < 50 && { color: c.gold },
              remaining < 0 && { color: c.ochre },
            ]}>
              {remaining}
            </Text>
          )}

          {/* ── QUOTE: author + source ── */}
          {template === "quote" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Author *</Text>
              <TextInput
                style={styles.input}
                value={quoteAuthor}
                onChangeText={setQuoteAuthor}
                placeholder="Who said this?"
                placeholderTextColor={c.ghost}
              />
              <Text style={[styles.fieldLabel, { marginTop: space[2] }]}>Source</Text>
              <TextInput
                style={styles.input}
                value={quoteSource}
                onChangeText={setQuoteSource}
                placeholder="Book, speech, film… (optional)"
                placeholderTextColor={c.ghost}
              />
            </View>
          )}

          {/* ── FOOD REVIEW: dish name + ratings ── */}
          {template === "food-review" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Dish / item *</Text>
              <TextInput
                style={styles.input}
                value={foodDishName}
                onChangeText={setFoodDishName}
                placeholder="What did you eat?"
                placeholderTextColor={c.ghost}
              />
              <Text style={[styles.fieldLabel, { marginTop: space[2] }]}>Ratings *</Text>
              <MultiRating ratings={foodRatings} onChange={setFoodRatings} />
            </View>
          )}

          {/* ── Directory search (Hidden Gem, Cultural Take, Food Review) ── */}
          {(template === "hidden-gem" || template === "cultural-take" || template === "food-review") && (
            <View style={styles.fieldGroup}>
              <DirectorySearch
                selected={linkedEntry}
                onSelect={setLinkedEntry}
                label={
                  template === "food-review"  ? "Restaurant / venue" :
                  template === "cultural-take" ? "Link a place or work (optional)" :
                  "Link a place *"
                }
              />
            </View>
          )}

          {/* ── HIDDEN GEM: star rating ── */}
          {template === "hidden-gem" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Your rating *</Text>
              <StarRating value={starRating} onChange={setStarRating} />
            </View>
          )}

          {/* ── POLL: options builder ── */}
          {template === "poll" && (
            <View style={styles.fieldGroup}>
              <PollBuilder poll={poll} onChange={setPoll} />
            </View>
          )}

          {/* ── ITINERARY: stops + optional location city ── */}
          {template === "itinerary" && (
            <>
              <View style={styles.fieldGroup}>
                <ItineraryBuilder stops={stops} onChange={setStops} />
              </View>
              {locationVisible && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>City / destination</Text>
                  <TextInput
                    style={styles.input}
                    value={itineraryCity}
                    onChangeText={setItineraryCity}
                    placeholder="e.g. Lagos, London, Tokyo…"
                    placeholderTextColor={c.ghost}
                    autoFocus
                  />
                </View>
              )}
            </>
          )}

          {/* ── EVENT: date + location + category ── */}
          {template === "event" && (
            <View style={styles.fieldGroup}>

              {/* Date rows */}
              <View style={styles.eventDateBlock}>
                <TouchableOpacity style={styles.eventDateRow} onPress={() => openPicker("start", "date")}>
                  <View style={styles.eventDateIconWrap}>
                    <Ionicons name="calendar-outline" size={16} color={c.mute} />
                  </View>
                  <View style={styles.eventDateContent}>
                    <Text style={styles.eventDateRowLabel}>Start date *</Text>
                    <Text style={[styles.eventDateValue, !!eventDate && styles.eventDateValueSet]}>
                      {eventDate ? fmtDate(eventDate) : "Select date"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.ghost} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.eventDateRow} onPress={() => openPicker("start", "time")}>
                  <View style={styles.eventDateIconWrap}>
                    <Ionicons name="time-outline" size={16} color={c.mute} />
                  </View>
                  <View style={styles.eventDateContent}>
                    <Text style={styles.eventDateRowLabel}>Start time *</Text>
                    <Text style={[styles.eventDateValue, !!eventDate && styles.eventDateValueSet]}>
                      {eventDate ? fmtTime(eventDate) : "Select time"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.ghost} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.eventDateRow} onPress={() => openPicker("end", "date")}>
                  <View style={styles.eventDateIconWrap}>
                    <Ionicons name="calendar-outline" size={16} color={c.ghost} />
                  </View>
                  <View style={styles.eventDateContent}>
                    <Text style={styles.eventDateRowLabel}>End date</Text>
                    <Text style={[styles.eventDateValue, !!eventEndDate && styles.eventDateValueSet]}>
                      {eventEndDate ? fmtDate(eventEndDate) : "Optional"}
                    </Text>
                  </View>
                  {eventEndDate ? (
                    <TouchableOpacity onPress={() => setEventEndDate(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name="close-circle" size={18} color={c.ghost} />
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={c.ghost} />
                  )}
                </TouchableOpacity>

                {eventEndDate && (
                  <TouchableOpacity style={styles.eventDateRow} onPress={() => openPicker("end", "time")}>
                    <View style={styles.eventDateIconWrap}>
                      <Ionicons name="time-outline" size={16} color={c.ghost} />
                    </View>
                    <View style={styles.eventDateContent}>
                      <Text style={styles.eventDateRowLabel}>End time</Text>
                      <Text style={[styles.eventDateValue, styles.eventDateValueSet]}>
                        {fmtTime(eventEndDate)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.ghost} />
                  </TouchableOpacity>
                )}
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

              {/* Description textarea */}
              <TextInput
                ref={textRef}
                style={[styles.textarea, { marginTop: space[3] }]}
                value={text}
                onChangeText={setText}
                multiline
                placeholder="Describe the event — what makes it worth attending? (optional)"
                placeholderTextColor={c.ghost}
                maxLength={1000}
                textAlignVertical="top"
              />

              {/* Location block */}
              <View style={styles.locationBlock}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color={c.mute} style={{ marginTop: 14 }} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={eventVenue}
                    onChangeText={setEventVenue}
                    placeholder="Venue or address"
                    placeholderTextColor={c.ghost}
                  />
                </View>
                <TextInput
                  style={[styles.input, { marginTop: 8 }]}
                  value={eventCity}
                  onChangeText={setEventCity}
                  placeholder="City"
                  placeholderTextColor={c.ghost}
                />
              </View>

              {/* Admission + ticket URL */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Admission</Text>
                <TextInput
                  style={styles.input}
                  value={eventAdmission}
                  onChangeText={setEventAdmission}
                  placeholder="Free / £15 adv / £20 door"
                  placeholderTextColor={c.ghost}
                />
                <Text style={[styles.fieldLabel, { marginTop: space[2] }]}>Tickets / info URL</Text>
                <TextInput
                  style={styles.input}
                  value={eventTicketUrl}
                  onChangeText={setEventTicketUrl}
                  placeholder="https://…"
                  placeholderTextColor={c.ghost}
                  autoCapitalize="none"
                  keyboardType="url"
                />
              </View>

              {/* Category chips */}
              <Text style={[styles.fieldLabel, { marginTop: space[3] }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
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
              <View style={{ marginTop: space[3] }}>
                <DirectorySearch selected={eventOrganiser} onSelect={setEventOrganiser} label="Organiser (optional)" />
              </View>
            </View>
          )}

          {/* ── Section tag (most templates) ── */}
          {template !== "food-review" && template !== "quote" && template !== "event" && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Section</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {SECTION_TAGS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.sectionTag, sectionTag === t && styles.sectionTagActive]}
                    onPress={() => { setSectionTag(sectionTag === t ? null : t); setTagLocked(true); }}
                  >
                    <Text style={[styles.sectionTagText, sectionTag === t && styles.sectionTagTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

        </ScrollView>

        {/* ── Image preview strip (above toolbar, only when images selected) ── */}
        {images.length > 0 && template !== "creative-showcase" && (
          <View style={styles.previewStrip}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, padding: 8 }}>
              {images.map((uri, i) => (
                <View key={i} style={styles.previewWrap}>
                  <Image source={{ uri }} style={styles.previewThumb} />
                  <TouchableOpacity style={styles.removeThumb} onPress={() => removeImage(i)}>
                    <Ionicons name="close" size={11} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreBtn} onPress={() => pickImages(tmpl.multiPhoto)}>
                <Ionicons name="add" size={20} color={c.mute} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* ── Bottom toolbar ── */}
        <View style={styles.toolbar}>
          <View style={styles.toolbarLeft}>
            {toolbarIcons}
          </View>
          {template !== "event" && (
            <Text style={[
              styles.toolbarCount,
              remaining < 50 && { color: c.gold },
              remaining < 0 && { color: c.ochre },
            ]}>
              {remaining} left
            </Text>
          )}
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
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    headerSideBtn:    { minWidth: 60, minHeight: 44, justifyContent: "center" },
    headerTitle:      { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    cancelText:       { fontFamily: fonts.sans, fontSize: 14, color: c.ochre },
    postText:         { fontFamily: fonts.sansBold, fontSize: 14, color: c.ochre, textAlign: "right" },
    postTextDisabled: { opacity: 0.35 },

    // Compact template indicator bar
    templateBar: {
      height: 36, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paperWarm,
    },
    templateBarLeft:   { flexDirection: "row", alignItems: "center", gap: 6 },
    templateBarEmoji:  { fontSize: 14, lineHeight: 18 },
    templateBarLabel:  { fontFamily: fonts.sansBold, fontSize: 13 },
    changeFormatText:  { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },

    // Scroll body
    body: { padding: space[4], paddingBottom: 24 },

    // Guide / starter chips
    guide:     { marginBottom: space[3] },
    guideDesc: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, lineHeight: 20, marginBottom: space[2] },
    chips:     { flexDirection: "row", flexWrap: "wrap", gap: space[2] },
    chip: {
      backgroundColor: c.paperDeep, borderRadius: radius.full,
      paddingHorizontal: 14, paddingVertical: 7,
    },
    chipText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft },

    // Main textarea
    textarea: {
      fontFamily: fonts.sans, fontSize: 16, color: c.ink,
      lineHeight: 26, minHeight: 120,
    },
    charCount: {
      fontFamily: fonts.mono, fontSize: 11, color: c.ghost,
      textAlign: "right", marginTop: 4, marginBottom: space[1],
    },

    // Quote
    quoteWrap: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl,
      padding: space[4], paddingTop: space[6], marginBottom: space[3], position: "relative",
    },
    quoteDecorationOpen: {
      position: "absolute", top: 2, left: 14,
      fontFamily: fonts.serif, fontSize: 52, color: c.ghost, opacity: 0.35, lineHeight: 56,
    },
    quoteDecorationClose: {
      fontFamily: fonts.serif, fontSize: 52, color: c.ghost, opacity: 0.35,
      textAlign: "right", lineHeight: 28, marginTop: 4,
    },
    quoteTextarea: {
      fontFamily: fonts.serif, fontSize: 18, fontStyle: "italic", color: c.ink,
      lineHeight: 28, minHeight: 100, textAlignVertical: "top",
    },

    // Creative showcase upload zone
    showcaseUpload: {
      height: 150, borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      borderStyle: "dashed", backgroundColor: c.paperDeep,
      alignItems: "center", justifyContent: "center", gap: 6,
      marginBottom: space[3],
    },
    showcaseUploadFilled: {
      borderColor: c.gold, borderStyle: "solid",
      backgroundColor: "rgba(179,130,56,0.06)",
    },
    showcaseUploadTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: c.inkSoft },
    showcaseUploadSub:   { fontFamily: fonts.mono, fontSize: 11, color: c.mute },

    // Event
    eventBanner: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: c.paperDeep, borderRadius: radius.md,
      paddingVertical: 10, paddingHorizontal: 12, marginBottom: space[3],
    },
    eventBannerText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, flex: 1 },
    eventTitleInput: {
      fontFamily: fonts.serifBold, fontSize: 20, color: c.ink,
      paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: c.rule,
      marginBottom: space[2],
    },
    eventDateBlock: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg,
      overflow: "hidden", marginBottom: space[3],
    },
    eventDateRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      paddingHorizontal: space[3], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paper,
    },
    eventDateIconWrap: { width: 28, alignItems: "center" },
    eventDateContent:  { flex: 1 },
    eventDateRowLabel: { fontFamily: fonts.mono, fontSize: 10, color: c.mute, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2 },
    eventDateValue:    { fontFamily: fonts.sans, fontSize: 14, color: c.ghost },
    eventDateValueSet: { color: c.ink, fontFamily: fonts.sansBold },

    locationBlock:   { gap: 8, marginBottom: space[2] },
    locationRow:     { flexDirection: "row", alignItems: "flex-start", gap: 8 },

    // Common fields
    fieldGroup: { marginTop: space[3], gap: 6 },
    fieldLabel: {
      fontFamily: fonts.mono, fontSize: 11, color: c.mute,
      letterSpacing: 0.8, textTransform: "uppercase",
    },
    input: {
      height: 46, fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      paddingHorizontal: 14, backgroundColor: c.paper,
    },

    // Section / category tags
    chipRow: { gap: 8, paddingVertical: 4 },
    sectionTag: {
      height: 34, paddingHorizontal: 16, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.rule, backgroundColor: c.paper,
      justifyContent: "center",
    },
    sectionTagActive:     { backgroundColor: c.ink, borderColor: c.ink },
    sectionTagText:       { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },
    sectionTagTextActive: { color: c.paper, fontFamily: fonts.sansBold },

    // Date picker
    pickerWrap: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      overflow: "hidden", backgroundColor: c.paperDeep, marginBottom: space[2],
    },
    iosDoneBtn: {
      alignSelf: "flex-end", margin: 8,
      backgroundColor: c.ink, borderRadius: radius.md,
      paddingHorizontal: 14, paddingVertical: 6,
    },
    iosDoneBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },

    // Image preview strip
    previewStrip: {
      borderTopWidth: 1, borderTopColor: c.rule,
      backgroundColor: c.paper,
    },
    previewWrap:  { position: "relative" },
    previewThumb: { width: 64, height: 64, borderRadius: radius.md },
    removeThumb: {
      position: "absolute", top: 3, right: 3,
      backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 8, padding: 3,
    },
    addMoreBtn: {
      width: 64, height: 64, borderRadius: radius.md,
      borderWidth: 1, borderColor: c.rule, borderStyle: "dashed",
      alignItems: "center", justifyContent: "center",
      backgroundColor: c.paperDeep,
    },

    // Bottom toolbar
    toolbar: {
      minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, borderTopWidth: 1, borderTopColor: c.rule,
      paddingHorizontal: space[4], paddingVertical: space[2],
    },
    toolbarLeft:       { flexDirection: "row", alignItems: "center", gap: 20 },
    toolbarIconBtn:    { position: "relative" },
    toolbarIconActive: {},
    iconBadge: {
      position: "absolute", top: -6, right: -8,
      backgroundColor: c.ochre, borderRadius: 8,
      minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3,
    },
    iconBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: "#fff" },
    toolbarAt:    { fontFamily: fonts.sansBold, fontSize: 18, color: c.inkSoft, lineHeight: 22 },
    toolbarCount: { fontFamily: fonts.mono, fontSize: 12, color: c.ghost },
  });
}
