import React, { useState, useRef, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, Image, FlatList,
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
    chips: ["🎵 What I'm listening to", "🎬 Film reaction", "✨ Discovery", "📍 This place", "💬 Hot take"],
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
    placeholder: "Explain your take…",
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

const SHOWCASE_MEDIUMS = ["Photography", "Film", "Digital Art", "Illustration", "Music", "Writing"];
const CUISINE_TAGS = ["Nigerian", "Pan-African", "West African", "Continental", "Fusion", "Seafood"];
const PRICE_RANGES_NGN = ["₦", "₦₦", "₦₦₦", "₦₦₦₦"];
const PRICE_RANGES_GBP = ["£", "££", "£££", "££££"];
const BOOK_STATUSES = ["Finished", "Reading", "Want to Read"] as const;
const BOOK_GENRES = ["Classic Literature", "African Lit", "Post-Colonial", "Fiction", "Historical", "Non-Fiction", "Thriller", "Romance"];
const QUOTE_TYPES = ["Person", "Book", "Film", "Speech", "Song"];

interface DirectoryEntry { id: number; title: string; entry_type: string; city?: string }

const fmtDate = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// ── Inline photos section ─────────────────────────────────────────────────────
function InlinePhotosSection({
  images,
  onAdd,
  onRemove,
  styles,
  c,
}: {
  images: string[];
  onAdd: () => void;
  onRemove: (i: number) => void;
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  return (
    <View style={styles.photosSection}>
      <Text style={styles.fieldLabel}>Photos (optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photosRow}>
        <TouchableOpacity style={styles.photoAddTile} onPress={onAdd}>
          <Ionicons name="camera-outline" size={20} color={c.ghost} />
          <Text style={styles.photoAddText}>Add</Text>
        </TouchableOpacity>
        {images.map((uri, i) => (
          <View key={i} style={styles.photoThumbWrap}>
            <Image source={{ uri }} style={styles.photoThumb} />
            <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => onRemove(i)}>
              <Text style={{ color: c.ink, fontSize: 10 }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Text style={styles.photosHint}>Up to 4 photos</Text>
    </View>
  );
}

// ── Book ratings breakdown ────────────────────────────────────────────────────
function BookRatingsRow({
  label,
  value,
  onChange,
  styles,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.bookRatingsRow}>
      <Text style={styles.bookRatingsLabel}>{label}</Text>
      <StarRating value={value} onChange={onChange} />
    </View>
  );
}

export default function NewPostScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const [template, setTemplate] = useState<TemplateId>(route.params?.template ?? "post");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [text, setText] = useState("");
  const [sectionTag, setSectionTag] = useState<string | null>(null);
  const [tagLocked, setTagLocked] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [itineraryCity, setItineraryCity] = useState("");

  // Template-specific state
  const [starRating, setStarRating] = useState(0);
  const [foodRatings, setFoodRatings] = useState({ taste: 0, value: 0, vibe: 0 });
  const [foodDishName, setFoodDishName] = useState("");
  const [linkedEntry, setLinkedEntry] = useState<DirectoryEntry | null>(null);
  const [poll, setPoll] = useState<PollDraft>({ options: ["", ""], durationDays: 3 });
  const [stops, setStops] = useState<StopDraft[]>([{ name: "", note: "" }, { name: "", note: "" }]);
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteSource, setQuoteSource] = useState("");

  // Hidden Gem extras
  const [hiddenGemPlaceName, setHiddenGemPlaceName] = useState("");
  const [hiddenGemLocation, setHiddenGemLocation] = useState("");
  const [hiddenGemPriceRange, setHiddenGemPriceRange] = useState("");
  const [hiddenGemOpeningHours, setHiddenGemOpeningHours] = useState("");

  // Cultural Take extras
  const [culturalTakeHeadline, setCulturalTakeHeadline] = useState("");

  // Food Review extras
  const [cuisineTag, setCuisineTag] = useState("");
  const [foodPriceRange, setFoodPriceRange] = useState("");

  // Creative Showcase extras
  const [showcaseTitle, setShowcaseTitle] = useState("");
  const [showcaseMedium, setShowcaseMedium] = useState("");
  const [showcaseCollaborator, setShowcaseCollaborator] = useState("");

  // Book Review state
  const [bookEntry, setBookEntry] = useState<{ id: number; title: string; author: string; year?: string } | null>(null);
  const [bookSearch, setBookSearch] = useState("");
  const [bookSearchResults, setBookSearchResults] = useState<Array<{ id: number; title: string; author: string; year?: string }>>([]);
  const [bookSearchOpen, setBookSearchOpen] = useState(false);
  const [bookStatus, setBookStatus] = useState<"Finished" | "Reading" | "Want to Read" | "">("");
  const [bookOverallRating, setBookOverallRating] = useState(0);
  const [bookRatings, setBookRatings] = useState({ writing: 0, story: 0, characters: 0, pacing: 0 });
  const [bookFavQuote, setBookFavQuote] = useState("");
  const [bookRecommend, setBookRecommend] = useState<boolean | null>(null);
  const [bookGenres, setBookGenres] = useState<string[]>([]);

  // Itinerary extras
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [itineraryBudget, setItineraryBudget] = useState("");
  const [itineraryDuration, setItineraryDuration] = useState("");
  const [itineraryBestTime, setItineraryBestTime] = useState("");

  // Quote extras
  const [quoteSharingReason, setQuoteSharingReason] = useState("");
  const [quoteType, setQuoteType] = useState("");

  // Poll extras
  const [pollDescription, setPollDescription] = useState("");

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [eventEndDate, setEventEndDate] = useState<Date | null>(null);
  const [eventVenue, setEventVenue] = useState("");
  const [eventAddress, setEventAddress] = useState("");
  const [eventCity, setEventCity] = useState("");
  const [eventAdmission, setEventAdmission] = useState("");
  const [eventTicketUrl, setEventTicketUrl] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventOrganiser, setEventOrganiser] = useState<DirectoryEntry | null>(null);

  // Date/time picker state
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<"date" | "time">("date");
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
    if (template === "cultural-take") {
      if (culturalTakeHeadline.trim().length < 10) {
        Alert.alert("Headline too short", "Your take headline needs at least 10 characters."); return;
      }
      if (text.trim().length < 50) {
        Alert.alert("Explanation too short", "Explain your take in at least 50 characters."); return;
      }
    } else if (template === "creative-showcase") {
      if (!showcaseTitle.trim()) { Alert.alert("Title required", "Add a title for your work."); return; }
      if (text.trim().length < 10) { Alert.alert("Description too short", "Tell us about the work."); return; }
      if (images.length === 0) { Alert.alert("Media required", "Add at least one image of your work."); return; }
    } else if (template === "book-review") {
      if (!bookEntry) { Alert.alert("Book required", "Search and select a book."); return; }
      if (!bookStatus) { Alert.alert("Status required", "Select your reading status."); return; }
      if (bookOverallRating === 0) { Alert.alert("Rating required", "Give an overall rating."); return; }
      if (text.trim().length < 50) { Alert.alert("Review too short", "Write at least 50 characters."); return; }
      if (bookRecommend === null) { Alert.alert("Recommendation required", "Would you recommend this book?"); return; }
    } else if (template === "itinerary") {
      if (!itineraryTitle.trim()) { Alert.alert("Title required", "Add a trip title."); return; }
      if (stops.filter((s) => s.name.trim()).length < 2) {
        Alert.alert("Stops required", "Add at least 2 stops."); return;
      }
    } else if (template === "event") {
      if (!eventTitle.trim()) { Alert.alert("Title required", "Add an event title."); return; }
      if (!eventDate) { Alert.alert("Date required", "Select a start date and time."); return; }
    } else if (template === "hidden-gem") {
      if (!linkedEntry) { Alert.alert("Place required", "Please link a directory entry."); return; }
      if (text.trim().length < tmpl.minText) {
        Alert.alert("Too short", `Need at least ${tmpl.minText} characters.`); return;
      }
    } else if (template === "food-review") {
      if (!foodDishName) { Alert.alert("Dish required", "Please add the dish name."); return; }
      if (foodRatings.taste === 0) { Alert.alert("Rating required", "Please add a taste rating."); return; }
      if (text.trim().length < tmpl.minText) {
        Alert.alert("Too short", `Need at least ${tmpl.minText} characters.`); return;
      }
    } else if (template !== "event" && text.length < tmpl.minText) {
      Alert.alert("Too short", `Need at least ${tmpl.minText} characters for this template.`); return;
    }

    if (template === "poll" && poll.options.filter((o) => o.trim()).length < 2) {
      Alert.alert("Poll options required", "Add at least 2 poll options."); return;
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
          venue_address: eventAddress.trim() || undefined,
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

      if (template === "quote") {
        await api.post(`${MOBILE_API}/community/quote`, {
          text, author: quoteAuthor, source: quoteSource || undefined,
          sharing_reason: quoteSharingReason || undefined,
          quote_type: quoteType || undefined,
        } as Record<string, unknown>);
        nav.goBack();
        return;
      }

      if (template === "book-review") {
        await api.post(`${MOBILE_API}/community/submit`, {
          template_type: "book-review",
          content: text,
          book_title: bookEntry!.title,
          book_author: bookEntry!.author,
          book_status: bookStatus,
          book_overall_rating: bookOverallRating,
          book_rating_writing: bookRatings.writing,
          book_rating_story: bookRatings.story,
          book_rating_characters: bookRatings.characters,
          book_rating_pacing: bookRatings.pacing,
          book_fav_quote: bookFavQuote || undefined,
          book_recommend: bookRecommend,
          book_genres: bookGenres.length > 0 ? bookGenres : undefined,
        } as Record<string, unknown>);
        nav.goBack();
        return;
      }

      const uploadedUrls = await uploadImages();

      const body: Record<string, unknown> = {
        content:        text,
        tag:            template === "food-review" ? "Food" : sectionTag,
        template_type:  template,
        gallery_images: uploadedUrls.length > 1 ? uploadedUrls : undefined,
        image_url:      uploadedUrls[0] ?? undefined,
      };

      if (template === "hidden-gem") {
        body.star_rating         = starRating || undefined;
        body.linked_directory_id = linkedEntry?.id;
        body.place_name          = hiddenGemPlaceName.trim() || undefined;
        body.place_location      = hiddenGemLocation.trim() || undefined;
        body.price_range         = hiddenGemPriceRange || undefined;
        body.opening_hours       = hiddenGemOpeningHours.trim() || undefined;
      }
      if (template === "cultural-take") {
        body.headline            = culturalTakeHeadline.trim();
        body.linked_directory_id = linkedEntry?.id || undefined;
      }
      if (template === "food-review") {
        body.food_dish_name      = foodDishName;
        body.food_rating_taste   = foodRatings.taste;
        body.food_rating_value   = foodRatings.value;
        body.food_rating_vibe    = foodRatings.vibe;
        body.linked_directory_id = linkedEntry?.id;
        body.cuisine_tag         = cuisineTag || undefined;
        body.price_range         = foodPriceRange || undefined;
      }
      if (template === "creative-showcase") {
        body.showcase_title      = showcaseTitle.trim();
        body.showcase_medium     = showcaseMedium || undefined;
        body.collaborator        = showcaseCollaborator.trim() || undefined;
      }
      if (template === "poll") {
        const expiresAt = new Date(Date.now() + poll.durationDays * 24 * 60 * 60 * 1000).toISOString();
        body.poll_options        = poll.options.filter((o) => o.trim());
        body.poll_expires_at     = expiresAt;
        body.poll_description    = pollDescription.trim() || undefined;
      }
      if (template === "itinerary") {
        body.itinerary_title     = itineraryTitle.trim();
        body.itinerary_stops     = stops.filter((s) => s.name.trim());
        body.itinerary_city      = itineraryCity.trim() || undefined;
        body.itinerary_budget    = itineraryBudget || undefined;
        body.itinerary_duration  = itineraryDuration.trim() || undefined;
        body.itinerary_best_time = itineraryBestTime.trim() || undefined;
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

  const isSubmitDisabled = useMemo(() => {
    if (submitting) return true;
    if (template === "event") return !eventTitle.trim() || !eventDate;
    if (template === "cultural-take") return culturalTakeHeadline.trim().length < 10 || text.trim().length < 50;
    if (template === "creative-showcase") return !showcaseTitle.trim() || text.trim().length < 10 || images.length === 0;
    if (template === "book-review") return !bookEntry || !bookStatus || bookOverallRating === 0 || text.trim().length < 50 || bookRecommend === null;
    if (template === "itinerary") return !itineraryTitle.trim() || stops.filter((s) => s.name.trim()).length < 2;
    if (template === "hidden-gem") return !linkedEntry || text.trim().length < tmpl.minText;
    return text.length < tmpl.minText;
  }, [submitting, template, text, eventTitle, eventDate, culturalTakeHeadline, showcaseTitle, images.length,
    bookEntry, bookStatus, bookOverallRating, bookRecommend, itineraryTitle, stops, linkedEntry, tmpl.minText]);

  // ── Toolbar ──────────────────────────────────────────────────────────────────
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
  }, [tmpl, images.length, c, pickImages, insertAt]);

  // ── Render helpers ────────────────────────────────────────────────────────────
  const renderDivider = () => <View style={styles.divider} />;

  const renderPriceChips = (options: string[], value: string, onChange: (v: string) => void) => (
    <View style={styles.priceChipRow}>
      {options.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.priceChip, value === p && styles.priceChipActive]}
          onPress={() => onChange(value === p ? "" : p)}
        >
          <Text style={[styles.priceChipText, value === p && styles.priceChipTextActive]}>{p}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderPrefixedInput = (
    prefix: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
    keyboardType?: any,
    autoCapitalize?: any
  ) => (
    <View style={styles.prefixedInputWrap}>
      <Text style={styles.prefixIcon}>{prefix}</Text>
      <TextInput
        style={styles.prefixedInput}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.ghost}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "sentences"}
      />
    </View>
  );

  const renderSectionTags = (marginTop?: number) => (
    <View style={[styles.fieldGroup, marginTop != null ? { marginTop } : undefined]}>
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
  );

  // ── Template body renderers ───────────────────────────────────────────────────
  const renderStandardPost = () => (
    <>
      {/* Section tags FIRST */}
      {renderSectionTags(0)}
      {/* Guide chips */}
      {text.length === 0 && (
        <View style={[styles.guide, { marginTop: space[3] }]}>
          <Text style={styles.guideDesc}>{tmplDef?.desc ?? ""}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {tmpl.chips.map((chip) => (
              <TouchableOpacity
                key={chip}
                style={styles.chip}
                onPress={() => { setText(chip + " "); setTimeout(() => textRef.current?.focus(), 50); }}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      <TextInput
        ref={textRef}
        style={[styles.textarea, { marginTop: space[2] }]}
        value={text}
        onChangeText={handleTextChange}
        multiline
        placeholder={tmpl.placeholder}
        placeholderTextColor={c.ghost}
        maxLength={tmpl.maxText + 50}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, remaining < 50 && { color: c.gold }, remaining < 0 && { color: c.ochre }]}>
        {remaining}
      </Text>
      <InlinePhotosSection
        images={images}
        onAdd={() => pickImages(true)}
        onRemove={removeImage}
        styles={styles}
        c={c}
      />
    </>
  );

  const renderHiddenGem = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Place name *</Text>
        <TextInput
          style={styles.input}
          value={hiddenGemPlaceName}
          onChangeText={setHiddenGemPlaceName}
          placeholder="What's this place called?"
          placeholderTextColor={c.ghost}
        />
      </View>
      <View style={[styles.fieldGroup]}>
        <Text style={styles.fieldLabel}>Location</Text>
        {renderPrefixedInput("📍", hiddenGemLocation, setHiddenGemLocation, "Area, city or address")}
      </View>
      <View style={styles.fieldGroup}>
        <DirectorySearch
          selected={linkedEntry}
          onSelect={setLinkedEntry}
          label="Link this place in the Directory"
        />
      </View>
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Tell us about it *</Text>
        <TextInput
          ref={textRef}
          style={styles.borderedTextarea}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="Tell people why this place is special…"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={styles.fieldLabel}>Rating (optional)</Text>
          <StarRating value={starRating} onChange={setStarRating} />
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price range (optional)</Text>
        {renderPriceChips(PRICE_RANGES_NGN, hiddenGemPriceRange, setHiddenGemPriceRange)}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Opening hours (optional)</Text>
        {renderPrefixedInput("🕐", hiddenGemOpeningHours, setHiddenGemOpeningHours, "e.g. Mon–Sat 10am–10pm")}
      </View>
      {renderDivider()}
      <InlinePhotosSection
        images={images}
        onAdd={() => pickImages(true)}
        onRemove={removeImage}
        styles={styles}
        c={c}
      />
    </>
  );

  const renderCulturalTake = () => (
    <>
      <TextInput
        style={styles.culturalHeadline}
        value={culturalTakeHeadline}
        onChangeText={setCulturalTakeHeadline}
        multiline
        placeholder="Your take *"
        placeholderTextColor={c.ghost}
        textAlignVertical="top"
      />
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Explain your take *</Text>
        <TextInput
          ref={textRef}
          style={[styles.borderedTextarea, { minHeight: 200 }]}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="Go deeper…"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <DirectorySearch
          selected={linkedEntry}
          onSelect={setLinkedEntry}
          label="Related place or work (optional)"
        />
      </View>
      {renderDivider()}
      {renderSectionTags(space[2])}
    </>
  );

  const renderFoodReview = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Dish / Item *</Text>
        <TextInput
          style={styles.input}
          value={foodDishName}
          onChangeText={setFoodDishName}
          placeholder="What did you eat?"
          placeholderTextColor={c.ghost}
        />
      </View>
      <View style={styles.fieldGroup}>
        <DirectorySearch
          selected={linkedEntry}
          onSelect={setLinkedEntry}
          label="Restaurant or venue"
        />
      </View>
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Ratings *</Text>
        <MultiRating ratings={foodRatings} onChange={setFoodRatings} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Your review *</Text>
        <TextInput
          ref={textRef}
          style={styles.borderedTextarea}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="What did you eat and what did you think?"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Cuisine (optional)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {CUISINE_TAGS.map((ct) => (
            <TouchableOpacity
              key={ct}
              style={[styles.sectionTag, cuisineTag === ct && styles.sectionTagActive]}
              onPress={() => setCuisineTag(cuisineTag === ct ? "" : ct)}
            >
              <Text style={[styles.sectionTagText, cuisineTag === ct && styles.sectionTagTextActive]}>{ct}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Price range (optional)</Text>
        {renderPriceChips(PRICE_RANGES_NGN, foodPriceRange, setFoodPriceRange)}
      </View>
      {renderDivider()}
      <InlinePhotosSection
        images={images}
        onAdd={() => pickImages(true)}
        onRemove={removeImage}
        styles={styles}
        c={c}
      />
    </>
  );

  const renderCreativeShowcase = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Title of your work *</Text>
        <TextInput
          style={styles.input}
          value={showcaseTitle}
          onChangeText={setShowcaseTitle}
          placeholder="What is this piece called?"
          placeholderTextColor={c.ghost}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Medium</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SHOWCASE_MEDIUMS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.sectionTag, showcaseMedium === m && styles.sectionTagActive]}
              onPress={() => setShowcaseMedium(showcaseMedium === m ? "" : m)}
            >
              <Text style={[styles.sectionTagText, showcaseMedium === m && styles.sectionTagTextActive]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>About this work *</Text>
        <TextInput
          ref={textRef}
          style={styles.borderedTextarea}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="Tell us about the work, your process, or inspiration…"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Collaborator (optional)</Text>
        <View style={styles.prefixedInputWrap}>
          <Text style={styles.prefixIcon}>@</Text>
          <TextInput
            style={styles.prefixedInput}
            value={showcaseCollaborator}
            onChangeText={setShowcaseCollaborator}
            placeholder="username or name"
            placeholderTextColor={c.ghost}
            autoCapitalize="none"
          />
        </View>
      </View>
      {renderDivider()}
      {/* Upload zone */}
      <TouchableOpacity
        style={[styles.showcaseUploadZone, images.length > 0 && styles.showcaseUploadZoneFilled]}
        onPress={() => pickImages(true)}
        activeOpacity={0.85}
      >
        {images.length === 0 ? (
          <>
            <Ionicons name="camera-outline" size={28} color={c.ochre} />
            <Text style={styles.showcaseUploadTitle}>Add photos or video</Text>
            <Text style={styles.showcaseUploadSub}>Tap to select files</Text>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="checkmark-circle" size={20} color={c.ochre} />
            <Text style={styles.showcaseUploadTitle}>{images.length} file{images.length > 1 ? "s" : ""} selected</Text>
          </View>
        )}
      </TouchableOpacity>
    </>
  );

  const renderBookReview = () => (
    <>
      {/* Book search */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Book *</Text>
        <View style={styles.prefixedInputWrap}>
          <Text style={styles.prefixIcon}>🔍</Text>
          <TextInput
            style={styles.prefixedInput}
            value={bookSearch}
            onChangeText={(v) => {
              setBookSearch(v);
              setBookSearchOpen(v.length > 1);
            }}
            placeholder="Search by title or author"
            placeholderTextColor={c.ghost}
          />
        </View>
        {bookSearchOpen && bookSearchResults.length === 0 && (
          <TouchableOpacity
            style={styles.bookSearchNoResult}
            onPress={() => {
              if (bookSearch.trim()) {
                setBookEntry({ id: Date.now(), title: bookSearch.trim(), author: "" });
                setBookSearch("");
                setBookSearchOpen(false);
              }
            }}
          >
            <Text style={styles.bookSearchNoResultText}>Add "{bookSearch}" as a new book</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Book card */}
      {bookEntry && (
        <View style={styles.bookCard}>
          <View style={styles.bookCover} />
          <View style={{ flex: 1 }}>
            <Text style={styles.bookTitle}>{bookEntry.title}</Text>
            {bookEntry.author ? <Text style={styles.bookAuthor}>{bookEntry.author}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setBookEntry(null)}>
            <Text style={{ color: c.mute, fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Status *</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {BOOK_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.sectionTag, bookStatus === s && styles.sectionTagActive, { flex: 1, height: 36 }]}
              onPress={() => setBookStatus(s)}
            >
              <Text style={[styles.sectionTagText, bookStatus === s && styles.sectionTagTextActive, { textAlign: "center", fontSize: 11 }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Overall rating */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Overall rating *</Text>
        <StarRating value={bookOverallRating} onChange={setBookOverallRating} />
      </View>

      {/* Ratings breakdown */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Ratings *</Text>
        <View style={styles.bookRatingsContainer}>
          {(["writing", "story", "characters", "pacing"] as const).map((key) => (
            <BookRatingsRow
              key={key}
              label={key.charAt(0).toUpperCase() + key.slice(1)}
              value={bookRatings[key]}
              onChange={(v) => setBookRatings((prev) => ({ ...prev, [key]: v }))}
              styles={styles}
            />
          ))}
        </View>
      </View>

      {/* Review */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Your review *</Text>
        <TextInput
          ref={textRef}
          style={styles.borderedTextarea}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="What did you think? Who would love it?"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>

      {/* Favourite quote */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Favourite quote (optional)</Text>
        <View style={styles.favQuoteWrap}>
          <TextInput
            style={styles.favQuoteInput}
            value={bookFavQuote}
            onChangeText={setBookFavQuote}
            multiline
            placeholder="A line that stayed with you…"
            placeholderTextColor={c.ghost}
            textAlignVertical="top"
          />
        </View>
      </View>

      {/* Recommend */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Would you recommend it? *</Text>
        <View style={styles.recommendRow}>
          <TouchableOpacity
            style={[styles.recommendYes, bookRecommend !== true && { backgroundColor: c.paper, borderWidth: 1, borderColor: c.rule }]}
            onPress={() => setBookRecommend(true)}
          >
            <Text style={[styles.recommendText, bookRecommend !== true && { color: c.inkSoft }]}>👍 Yes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.recommendNo, bookRecommend === false && styles.recommendNoActive]}
            onPress={() => setBookRecommend(false)}
          >
            <Text style={[styles.recommendNoText, bookRecommend === false && styles.recommendText]}>👎 No</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Genres */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Genres (optional)</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {BOOK_GENRES.map((g) => {
            const active = bookGenres.includes(g);
            return (
              <TouchableOpacity
                key={g}
                style={[styles.sectionTag, active && styles.sectionTagActive]}
                onPress={() => setBookGenres((prev) => active ? prev.filter((x) => x !== g) : [...prev, g])}
              >
                <Text style={[styles.sectionTagText, active && styles.sectionTagTextActive]}>{g}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </>
  );

  const renderPoll = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Poll question *</Text>
        <TextInput
          ref={textRef}
          style={[styles.borderedTextarea, { minHeight: 80 }]}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="Ask the community…"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }]}>{remaining}</Text>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Options *</Text>
        <PollBuilder poll={poll} onChange={setPoll} />
      </View>
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Poll duration</Text>
        <View style={styles.segmented}>
          {[1, 3, 7].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.segmentedBtn, poll.durationDays === d && styles.segmentedBtnActive]}
              onPress={() => setPoll((prev) => ({ ...prev, durationDays: d }))}
            >
              <Text style={[styles.segmentedBtnText, poll.durationDays === d && styles.segmentedBtnTextActive]}>{d}d</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Add a description (optional)</Text>
        <TextInput
          style={styles.borderedTextarea}
          value={pollDescription}
          onChangeText={setPollDescription}
          multiline
          placeholder="Give some context for your poll…"
          placeholderTextColor={c.ghost}
          textAlignVertical="top"
        />
      </View>
    </>
  );

  const renderItinerary = () => (
    <>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Trip title *</Text>
        <TextInput
          style={styles.input}
          value={itineraryTitle}
          onChangeText={setItineraryTitle}
          placeholder="e.g. A perfect weekend in Lagos"
          placeholderTextColor={c.ghost}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>City / Region</Text>
        {renderPrefixedInput("📍", itineraryCity, setItineraryCity, "e.g. Lagos, London, Tokyo…")}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Stops *</Text>
        <ItineraryBuilder stops={stops} onChange={setStops} />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Estimated duration (optional)</Text>
        {renderPrefixedInput("⏱", itineraryDuration, setItineraryDuration, "e.g. 2 days, 1 weekend")}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Budget level (optional)</Text>
        {renderPriceChips(PRICE_RANGES_GBP, itineraryBudget, setItineraryBudget)}
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Best time to visit (optional)</Text>
        {renderPrefixedInput("☀️", itineraryBestTime, setItineraryBestTime, "e.g. April–October")}
      </View>
      {renderDivider()}
      <InlinePhotosSection
        images={images}
        onAdd={() => pickImages(true)}
        onRemove={removeImage}
        styles={styles}
        c={c}
      />
    </>
  );

  const renderEvent = () => (
    <>
      <View style={styles.eventBanner}>
        <Ionicons name="calendar-outline" size={14} color={c.mute} />
        <Text style={styles.eventBannerText}>This will be added to the Moveee events calendar.</Text>
      </View>
      <TextInput
        style={styles.eventTitleInput}
        value={eventTitle}
        onChangeText={setEventTitle}
        placeholder="Event name *"
        placeholderTextColor={c.ghost}
        autoFocus
      />

      {/* 2-col date grid */}
      <View style={[styles.eventDateGrid, { marginTop: space[3] }]}>
        <View style={styles.eventDateGridRow}>
          <TouchableOpacity style={styles.eventDateCell} onPress={() => openPicker("start", "date")}>
            <Text style={styles.eventDateCellEmoji}>📅</Text>
            <Text style={[styles.eventDateCellText, !eventDate && { color: c.ghost }]}>
              {eventDate ? fmtDate(eventDate) : "Start date *"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.eventDateCell} onPress={() => openPicker("start", "time")}>
            <Text style={styles.eventDateCellEmoji}>🕐</Text>
            <Text style={[styles.eventDateCellText, !eventDate && { color: c.ghost }]}>
              {eventDate ? fmtTime(eventDate) : "Start time *"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.eventDateGridRow}>
          <TouchableOpacity style={styles.eventDateCell} onPress={() => openPicker("end", "date")}>
            <Text style={styles.eventDateCellEmoji}>📅</Text>
            <Text style={[styles.eventDateCellText, !eventEndDate && { color: c.ghost }]}>
              {eventEndDate ? fmtDate(eventEndDate) : "End date (opt.)"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.eventDateCell} onPress={() => openPicker("end", "time")}>
            <Text style={styles.eventDateCellEmoji}>🕐</Text>
            <Text style={[styles.eventDateCellText, !eventEndDate && { color: c.ghost }]}>
              {eventEndDate ? fmtTime(eventEndDate) : "End time (opt.)"}
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

      {/* Location block */}
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Location</Text>
        <View style={styles.prefixedInputWrap}>
          <Text style={styles.prefixIcon}>🏛</Text>
          <TextInput
            style={styles.prefixedInput}
            value={eventVenue}
            onChangeText={setEventVenue}
            placeholder="Venue name"
            placeholderTextColor={c.ghost}
          />
        </View>
        <View style={[styles.prefixedInputWrap, { marginTop: 8 }]}>
          <Text style={styles.prefixIcon}>📍</Text>
          <TextInput
            style={styles.prefixedInput}
            value={eventAddress}
            onChangeText={setEventAddress}
            placeholder="Full address"
            placeholderTextColor={c.ghost}
          />
        </View>
        <TextInput
          style={[styles.input, { marginTop: 8 }]}
          value={eventCity}
          onChangeText={setEventCity}
          placeholder="City *"
          placeholderTextColor={c.ghost}
        />
      </View>

      {renderDivider()}

      {/* Admission */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Admission</Text>
        <View style={styles.prefixedInputWrap}>
          <Text style={[styles.prefixIcon, { fontFamily: fonts.sansBold }]}>£</Text>
          <TextInput
            style={styles.prefixedInput}
            value={eventAdmission}
            onChangeText={setEventAdmission}
            placeholder="Free / 15 adv / 20 door"
            placeholderTextColor={c.ghost}
          />
        </View>
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Ticket link (optional)</Text>
        <View style={styles.prefixedInputWrap}>
          <Text style={styles.prefixIcon}>🔗</Text>
          <TextInput
            style={styles.prefixedInput}
            value={eventTicketUrl}
            onChangeText={setEventTicketUrl}
            placeholder="https://…"
            placeholderTextColor={c.ghost}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.chipRow, { marginTop: space[3] }]}>
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

      {/* Inline photos */}
      <InlinePhotosSection
        images={images}
        onAdd={() => pickImages(true)}
        onRemove={removeImage}
        styles={styles}
        c={c}
      />
    </>
  );

  const renderQuote = () => (
    <>
      {/* Quote box */}
      <View style={styles.quoteBox}>
        <Text style={styles.quoteOpenMark}>"</Text>
        <TextInput
          ref={textRef}
          style={styles.quoteBoxInput}
          value={text}
          onChangeText={handleTextChange}
          multiline
          placeholder="The quote…"
          placeholderTextColor={c.ghost}
          maxLength={tmpl.maxText + 50}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, remaining < 50 && { color: c.gold }, { marginTop: 4 }]}>{remaining}</Text>
      </View>

      <View style={[styles.fieldGroup, { marginTop: space[3] }]}>
        <Text style={styles.fieldLabel}>Who said it *</Text>
        <TextInput
          style={styles.input}
          value={quoteAuthor}
          onChangeText={setQuoteAuthor}
          placeholder="Author name"
          placeholderTextColor={c.ghost}
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Source (optional)</Text>
        <TextInput
          style={styles.input}
          value={quoteSource}
          onChangeText={setQuoteSource}
          placeholder="Book, speech, film…"
          placeholderTextColor={c.ghost}
        />
      </View>
      {renderDivider()}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Why are you sharing this? (optional)</Text>
        <TextInput
          style={styles.borderedTextarea}
          value={quoteSharingReason}
          onChangeText={setQuoteSharingReason}
          multiline
          placeholder="What does this mean to you?"
          placeholderTextColor={c.ghost}
          textAlignVertical="top"
        />
      </View>
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Quote type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {QUOTE_TYPES.map((qt) => (
            <TouchableOpacity
              key={qt}
              style={[styles.sectionTag, quoteType === qt && styles.sectionTagActive]}
              onPress={() => setQuoteType(quoteType === qt ? "" : qt)}
            >
              <Text style={[styles.sectionTagText, quoteType === qt && styles.sectionTagTextActive]}>{qt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </>
  );

  const renderTemplateBody = () => {
    switch (template) {
      case "post":             return renderStandardPost();
      case "hidden-gem":       return renderHiddenGem();
      case "cultural-take":    return renderCulturalTake();
      case "food-review":      return renderFoodReview();
      case "creative-showcase":return renderCreativeShowcase();
      case "book-review":      return renderBookReview();
      case "poll":             return renderPoll();
      case "itinerary":        return renderItinerary();
      case "event":            return renderEvent();
      case "quote":            return renderQuote();
      default:                 return null;
    }
  };

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
          {renderTemplateBody()}
        </ScrollView>

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

    // Template bar
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
    body: { padding: space[4], paddingBottom: 32 },

    // Guide / starter chips
    guide:     { marginBottom: space[3] },
    guideDesc: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute, lineHeight: 20, marginBottom: space[2] },
    chips:     { gap: space[2], paddingVertical: 2 },
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
    borderedTextarea: {
      fontFamily: fonts.sans, fontSize: 14, color: c.ink,
      lineHeight: 22, minHeight: 120,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      padding: 12, backgroundColor: c.paper,
    },
    charCount: {
      fontFamily: fonts.mono, fontSize: 11, color: c.ghost,
      textAlign: "right", marginTop: 4, marginBottom: space[1],
    },

    // Divider
    divider: {
      height: 1, backgroundColor: c.rule, marginVertical: space[3],
      marginHorizontal: -space[4],
    },

    // Inline photos
    photosSection: { paddingHorizontal: 0, marginTop: space[3] },
    photosRow: { gap: 8, paddingVertical: 4 },
    photoAddTile: {
      width: 80, height: 80, borderRadius: radius.md,
      borderWidth: 1.5, borderColor: c.ghost, borderStyle: "dashed",
      alignItems: "center", justifyContent: "center", gap: 4,
    },
    photoAddText: { fontFamily: fonts.sans, fontSize: 10, color: c.mute },
    photoThumbWrap: { position: "relative" },
    photoThumb: { width: 80, height: 80, borderRadius: radius.md },
    photoRemoveBtn: {
      position: "absolute", top: 3, right: 3,
      width: 18, height: 18, backgroundColor: "#fff", borderRadius: 9,
      alignItems: "center", justifyContent: "center",
    },
    photosHint: { fontFamily: fonts.sans, fontSize: 11, color: c.ghost, marginTop: 6 },

    // Price chips
    priceChipRow: { flexDirection: "row", gap: 8 },
    priceChip: {
      height: 32, paddingHorizontal: 16, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.rule, backgroundColor: c.paper, justifyContent: "center",
    },
    priceChipActive: { backgroundColor: c.ink, borderColor: c.ink },
    priceChipText: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },
    priceChipTextActive: { color: c.paper },

    // Prefixed input
    prefixedInputWrap: {
      flexDirection: "row", alignItems: "center", height: 48,
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      backgroundColor: c.paper, paddingHorizontal: 14, gap: 8,
    },
    prefixIcon: { fontSize: 16 },
    prefixedInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: c.ink },

    // Cultural Take headline
    culturalHeadline: {
      fontFamily: fonts.serifBold, fontSize: 20, color: c.ink,
      lineHeight: 28, minHeight: 80, textAlignVertical: "top",
    },

    // Creative Showcase upload zone
    showcaseUploadZone: {
      height: 120, borderWidth: 1.5, borderColor: c.rule, borderRadius: radius.xl,
      borderStyle: "dashed", backgroundColor: c.paperDeep,
      alignItems: "center", justifyContent: "center", gap: 6,
      marginTop: space[3],
    },
    showcaseUploadZoneFilled: {
      borderColor: c.gold, borderStyle: "solid",
      backgroundColor: "rgba(179,130,56,0.06)",
    },
    showcaseUploadTitle: { fontFamily: fonts.sansBold, fontSize: 14, color: c.inkSoft },
    showcaseUploadSub:   { fontFamily: fonts.mono, fontSize: 11, color: c.mute },

    // Book
    bookCard: {
      flexDirection: "row", alignItems: "flex-start",
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md,
      padding: 12, gap: 12, backgroundColor: c.paper, marginTop: 8,
    },
    bookCover: { width: 48, height: 64, borderRadius: 2, backgroundColor: c.paperDeep },
    bookTitle: { fontFamily: fonts.sansBold, fontSize: 15, color: c.ink },
    bookAuthor: { fontFamily: fonts.sans, fontSize: 13, color: c.mute, marginTop: 2 },
    bookSearchNoResult: {
      padding: 12, backgroundColor: c.paperDeep, borderRadius: radius.md, marginTop: 4,
    },
    bookSearchNoResultText: { fontFamily: fonts.sans, fontSize: 13, color: c.ochre },
    bookRatingsContainer: {
      borderWidth: 1, borderColor: c.rule, borderRadius: radius.md, overflow: "hidden",
    },
    bookRatingsRow: {
      height: 44, flexDirection: "row", alignItems: "center",
      paddingHorizontal: 12,
      borderBottomWidth: 1, borderBottomColor: c.rule,
    },
    bookRatingsLabel: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, width: 100 },

    // Fav quote
    favQuoteWrap: { borderLeftWidth: 3, borderLeftColor: c.ochre, paddingLeft: 16 },
    favQuoteInput: {
      fontFamily: fonts.sans, fontSize: 14, fontStyle: "italic",
      color: c.ink, lineHeight: 22, minHeight: 60, textAlignVertical: "top",
    },

    // Recommend
    recommendRow: { flexDirection: "row", gap: 8 },
    recommendYes: {
      height: 32, paddingHorizontal: 16, borderRadius: radius.full,
      backgroundColor: "#2D6A4F", justifyContent: "center",
    },
    recommendNo: {
      height: 32, paddingHorizontal: 16, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.rule, backgroundColor: c.paper, justifyContent: "center",
    },
    recommendNoActive: { backgroundColor: "#C5491F", borderColor: "#C5491F" },
    recommendText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.paper },
    recommendNoText: { fontFamily: fonts.sans, fontSize: 12, color: c.inkSoft },

    // Segmented (poll duration)
    segmented: {
      flexDirection: "row", borderWidth: 1, borderColor: c.rule,
      borderRadius: radius.md, overflow: "hidden",
    },
    segmentedBtn: { flex: 1, height: 32, alignItems: "center", justifyContent: "center" },
    segmentedBtnActive: { backgroundColor: c.ink },
    segmentedBtnText: { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft },
    segmentedBtnTextActive: { color: c.paper, fontFamily: fonts.sansBold },

    // Quote redesign
    quoteBox: {
      backgroundColor: c.paperWarm, borderRadius: radius.xl,
      borderWidth: 1, borderColor: c.rule,
      padding: 16, paddingTop: 24, position: "relative", minHeight: 160,
    },
    quoteOpenMark: {
      position: "absolute", top: 8, left: 14,
      fontFamily: fonts.serif, fontSize: 40, color: c.ghost, opacity: 0.4, lineHeight: 44,
    },
    quoteBoxInput: {
      fontFamily: fonts.serif, fontSize: 18, fontStyle: "italic",
      color: c.ink, lineHeight: 28, minHeight: 100, textAlignVertical: "top",
    },

    // Event 2-col date grid
    eventDateGrid: { flexDirection: "column", gap: 8 },
    eventDateGridRow: { flexDirection: "row", gap: 8 },
    eventDateCell: {
      flex: 1, height: 48, borderWidth: 1, borderColor: c.rule,
      borderRadius: radius.md, backgroundColor: c.paper,
      flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 6,
    },
    eventDateCellEmoji: { fontSize: 16 },
    eventDateCellText: { fontFamily: fonts.sans, fontSize: 13, color: c.ink, flex: 1 },

    // Event (legacy, kept for compatibility)
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
      marginTop: space[2],
    },
    iosDoneBtn: {
      alignSelf: "flex-end", margin: 8,
      backgroundColor: c.ink, borderRadius: radius.md,
      paddingHorizontal: 14, paddingVertical: 6,
    },
    iosDoneBtnText: { fontFamily: fonts.sansBold, fontSize: 13, color: c.paper },

    // Toolbar
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
