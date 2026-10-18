"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import DirectorySearch from "@/components/composer/DirectorySearch";
import MultiRating from "../composer/MultiRating";

export type ComposerTab = "update" | "review" | "art" | "poll" | "quote" | "itinerary" | "event";
type ReviewSubtype = "place" | "food" | "music" | "book" | "film";

const REVIEW_TEMPLATE: Record<ReviewSubtype, string> = {
  place: "hidden-gem",
  food: "food-review",
  music: "music-review",
  book: "book-review",
  film: "film-review",
};

const CATEGORIES = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"];

const QUOTE_TYPES = ["Person", "Book", "Film", "Speech", "Song"];
const QUOTE_SOURCE_TYPES: Record<string, { type: string; label: string; about: string; external?: "google_books" | "spotify" | "tmdb" }> = {
  Book: { type: "book", label: "Which book?", about: "Author", external: "google_books" },
  Film: { type: "film", label: "Which film?", about: "Director", external: "tmdb" },
  Song: { type: "album", label: "Which song or album?", about: "Artist", external: "spotify" },
};

const EVENT_CATEGORIES = ["Art", "Music", "Fashion", "Food", "Film", "Literature", "Sport", "Design", "Tech", "Talk", "Workshop", "Community"];
const SHOWCASE_MEDIUMS = ["Photography", "Film", "Digital Art", "Illustration", "Music", "Writing", "Mixed Media"];
const ITINERARY_BUDGETS = ["£", "££", "£££", "££££"];
const ITINERARY_DURATIONS = ["Day trip", "Weekend", "3–4 days", "1 week", "2 weeks", "1 month+"];
const PRICE_RANGES = ["£", "££", "£££", "££££"];
const BOOK_STATUSES = ["Want to Read", "Reading", "Finished"];
const POLL_DURATIONS = [{ label: "1 day", value: "1" }, { label: "3 days", value: "3" }, { label: "7 days", value: "7" }];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Music:      ["music", "album", "song", "track", "beat", "artist", "rapper", "singer", "concert", "gig", "playlist", "spotify", "soundcloud", "lyrics", "band", "vinyl", "mixtape"],
  Fashion:    ["fashion", "style", "outfit", "clothes", "clothing", "wear", "dress", "brand", "designer", "sneaker", "shoe", "vintage", "thrift", "streetwear", "wardrobe"],
  Art:        ["art", "artwork", "gallery", "painting", "drawing", "illustration", "sketch", "mural", "exhibit", "canvas", "sculpture", "aesthetic"],
  Film:       ["film", "movie", "cinema", "director", "actor", "actress", "scene", "documentary", "series", "episode", "netflix", "sequel", "trailer", "tv show"],
  Food:       ["food", "eat", "restaurant", "meal", "dish", "recipe", "cook", "taste", "flavor", "drink", "cafe", "bar", "brunch", "dinner", "lunch", "breakfast", "jollof", "suya", "chef"],
  Sport:      ["sport", "football", "soccer", "basketball", "tennis", "cricket", "running", "gym", "fitness", "match", "league", "tournament", "athlete"],
  Travel:     ["travel", "trip", "city", "country", "visit", "destination", "hotel", "flight", "abroad", "explore", "vacation", "holiday", "road trip", "itinerary"],
  Ideas:      ["idea", "thought", "opinion", "perspective", "debate", "discuss", "theory", "philosophy", "curious", "reflection", "wonder", "think about"],
  Literature: ["book", "read", "novel", "author", "poetry", "poem", "prose", "fiction", "nonfiction", "writing", "chapter", "story", "narrative", "literature"],
  Design:     ["design", "ux", "ui", "typography", "visual", "layout", "architecture", "interior", "logo", "graphic", "branding"],
  Tech:       ["tech", "technology", "code", "app", "software", "ai", "data", "startup", "digital", "developer", "crypto", "algorithm", "programming"],
};

function inferCategory(text: string): string {
  if (!text.trim()) return "";
  const lower = text.toLowerCase();
  let best = "";
  let bestScore = 0;
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter(kw => lower.includes(kw)).length;
    if (score > bestScore) { bestScore = score; best = cat; }
  }
  return bestScore > 0 ? best : "";
}

const TABS: { key: ComposerTab; label: string; icon: string }[] = [
  { key: "update",    label: "Update",       icon: "✏️" },
  { key: "review",    label: "Review",       icon: "⭐" },
  { key: "art",       label: "Project",        icon: "🎨" },
  { key: "poll",      label: "Poll",         icon: "📊" },
  { key: "quote",     label: "Quote",        icon: "💬" },
  { key: "itinerary", label: "Itinerary",    icon: "🗺️" },
  { key: "event",     label: "Event",        icon: "📅" },
];

interface Stop {
  id: string;
  name: string;
  location: string;
  note: string;
  image_url: string;
  image_uploading?: boolean;
}

interface InitialQuote {
  authorEntry?: { id: number; title: string };
  sourceEntry?: { id: number; title: string };
  quoteType?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: ComposerTab;
  hubId?: number;
  initialQuote?: InitialQuote;
}

function averageRating(vals: Record<string, number>): number {
  const nums = Object.values(vals).filter(v => v > 0);
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="cm-stars" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          className={`cm-star${n <= (hovered || value) ? " cm-star--active" : ""}`}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          aria-label={`${n} star${n !== 1 ? "s" : ""}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function MultiImageUpload({ urls, onUpload, onRemove, uploading, max = 4 }: {
  urls: string[]; onUpload: (f: File) => void; onRemove: (idx: number) => void; uploading: boolean; max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="cm-gallery-grid">
      {urls.map((url, i) => (
        <div key={i} className="cm-gallery-thumb">
          <img src={url} alt={`Photo ${i + 1}`} />
          <button type="button" className="cm-gallery-remove" onClick={() => onRemove(i)} aria-label="Remove photo">✕</button>
        </div>
      ))}
      {urls.length < max && (
        <button
          type="button"
          className={`cm-gallery-add${uploading ? " cm-gallery-add--uploading" : ""}`}
          onClick={() => !uploading && inputRef.current?.click()}
          disabled={uploading}
          aria-label="Add photo"
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={e => { if (e.target.files?.[0]) { onUpload(e.target.files[0]); e.target.value = ""; } }}
          />
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
          <span className="cm-gallery-add-label">{uploading ? "Uploading…" : urls.length === 0 ? "Add photos" : "Add more"}</span>
        </button>
      )}
    </div>
  );
}

export default function ComposerModal({ open, onClose, onSuccess, initialTab = "update", hubId, initialQuote }: Props) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<ComposerTab>(initialTab);

  // Update
  const [updTitle, setUpdTitle] = useState("");
  const [updContent, setUpdContent] = useState("");

  // Review
  const [revSubtype, setRevSubtype] = useState<ReviewSubtype>("place");
  const [revTitle, setRevTitle]     = useState("");
  const [revEntry, setRevEntry]     = useState<any>(null);
  const [revRating, setRevRating]   = useState(5);
  const [revContent, setRevContent] = useState("");

  // Art
  const [artTitle, setArtTitle]     = useState("");
  const [artContent, setArtContent] = useState("");

  // Poll
  const [pollQ, setPollQ]           = useState("");
  const [pollOpts, setPollOpts]     = useState(["", ""]);

  // Quote
  const [qText, setQText]           = useState("");
  const [qAuthorEntry, setQAuthorEntry] = useState<any>(null);
  const [qSource, setQSource]       = useState("");
  const [qSourceEntry, setQSourceEntry] = useState<any>(null);
  const [qType, setQType]           = useState("");
  const [qReflection, setQReflection] = useState("");

  // Itinerary
  const [iTitle, setITitle]         = useState("");
  const [iOverview, setIOverview]   = useState("");
  const [stops, setStops]           = useState<Stop[]>([
    { id: "a", name: "", location: "", note: "", image_url: "" },
    { id: "b", name: "", location: "", note: "", image_url: "" },
  ]);

  // Event
  const [evTitle, setEvTitle]       = useState("");
  const [evDate, setEvDate]         = useState("");
  const [evEndDate, setEvEndDate]   = useState("");
  const [evVenue, setEvVenue]       = useState("");
  const [evCity, setEvCity]         = useState("");
  const [evDesc, setEvDesc]         = useState("");
  const [evAdmission, setEvAdmission] = useState("");
  const [evTicketUrl, setEvTicketUrl] = useState("");
  const [evAddress, setEvAddress] = useState("");
  const [evCategory, setEvCategory] = useState("");
  const [evOrganiser, setEvOrganiser] = useState<any>(null);
  const [evRsvpEnabled, setEvRsvpEnabled] = useState(false);
  const [evCapacity, setEvCapacity] = useState("");

  // Poll additions
  const [pollDuration, setPollDuration] = useState("3");
  const [pollDescription, setPollDescription] = useState("");

  // Itinerary additions
  const [iCity, setICity] = useState("");
  const [iDurationPick, setIDurationPick] = useState("");
  const [iBudget, setIBudget] = useState("");
  const [iBestTime, setIBestTime] = useState("");

  // Art additions
  const [showcaseMedium, setShowcaseMedium] = useState("");

  // Book review additions
  const [bookStatus, setBookStatus] = useState("");
  const [bookRatings, setBookRatings] = useState<Record<string, number>>({ writing: 0, story: 0, characters: 0, pacing: 0 });
  const [bookFavQuote, setBookFavQuote] = useState("");

  // Music review additions
  const [musicRatings, setMusicRatings] = useState<Record<string, number>>({ production: 0, lyrics: 0, replay: 0, vibe: 0 });
  const [musicFavLyric, setMusicFavLyric] = useState("");

  // Film review additions
  const [filmRatings, setFilmRatings] = useState<Record<string, number>>({ story: 0, acting: 0, visuals: 0, pacing: 0 });
  const [filmFavLine, setFilmFavLine] = useState("");

  // Food review additions
  const [foodRatings, setFoodRatings] = useState<Record<string, number>>({ taste: 0, value: 0, vibe: 0 });
  const [foodPriceRange, setFoodPriceRange] = useState("");

  // Place review additions
  const [placePriceRange, setPlacePriceRange] = useState("");
  const [openingHours, setOpeningHours] = useState("");

  // Shared
  const [category, setCategory]           = useState("");
  const [categoryManuallySet, setCategoryManuallySet] = useState(false);
  const [galleryUrls, setGalleryUrls]     = useState<string[]>([]);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [submitting, setSubmitting]       = useState(false);
  const [error, setError]                 = useState("");

  // Sync initialTab when it changes (star button sets review)
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      if (initialQuote?.authorEntry) setQAuthorEntry(initialQuote.authorEntry);
      if (initialQuote?.sourceEntry) setQSourceEntry(initialQuote.sourceEntry);
      if (initialQuote?.quoteType)   setQType(initialQuote.quoteType);
    }
  }, [open, initialTab, initialQuote]);

  // Auto-infer hub/category from content unless user has manually picked one
  useEffect(() => {
    if (categoryManuallySet) return;
    // Direct tab-to-category mappings
    if (activeTab === "art")       { setCategory("Art");      return; }
    if (activeTab === "itinerary") { setCategory("Travel");   return; }
    if (activeTab === "review") {
      const map: Record<ReviewSubtype, string> = { food: "Food", music: "Music", book: "Literature", film: "Film", place: "" };
      const direct = map[revSubtype];
      if (direct) { setCategory(direct); return; }
    }
    // Keyword inference from text
    const combined = [updTitle, updContent, revTitle, revContent, artTitle, artContent, pollQ, qText, qSource, iTitle, iOverview, evTitle, evDesc].join(" ");
    const inferred = inferCategory(combined);
    if (inferred) setCategory(inferred);
  }, [activeTab, revSubtype, updTitle, updContent, revTitle, revContent, artTitle, artContent, pollQ, qText, qSource, iTitle, iOverview, evTitle, evDesc, categoryManuallySet]);

  // Auto-compute overall star rating from breakdown when set
  useEffect(() => {
    if (revSubtype === "book") {
      const avg = averageRating(bookRatings);
      if (avg > 0) setRevRating(avg);
    } else if (revSubtype === "music") {
      const avg = averageRating(musicRatings);
      if (avg > 0) setRevRating(avg);
    } else if (revSubtype === "film") {
      const avg = averageRating(filmRatings);
      if (avg > 0) setRevRating(avg);
    } else if (revSubtype === "food") {
      const avg = averageRating(foodRatings);
      if (avg > 0) setRevRating(avg);
    }
  }, [bookRatings, musicRatings, filmRatings, foodRatings, revSubtype]);

  const resetAll = useCallback(() => {
    setUpdTitle(""); setUpdContent("");
    setRevTitle(""); setRevContent(""); setRevRating(5); setRevSubtype("place"); setRevEntry(null);
    setArtTitle(""); setArtContent("");
    setPollQ(""); setPollOpts(["", ""]);
    setQText(""); setQAuthorEntry(null); setQSource(""); setQSourceEntry(null); setQType(""); setQReflection("");
    setITitle(""); setIOverview("");
    setStops([{ id: "a", name: "", location: "", note: "", image_url: "" }, { id: "b", name: "", location: "", note: "", image_url: "" }]);
    setEvTitle(""); setEvDate(""); setEvEndDate(""); setEvVenue(""); setEvCity("");
    setEvDesc(""); setEvAdmission(""); setEvTicketUrl("");
    setEvAddress(""); setEvCategory(""); setEvOrganiser(null); setEvRsvpEnabled(false); setEvCapacity("");
    setPollDuration("3"); setPollDescription("");
    setICity(""); setIDurationPick(""); setIBudget(""); setIBestTime("");
    setShowcaseMedium("");
    setBookStatus(""); setBookRatings({ writing: 0, story: 0, characters: 0, pacing: 0 }); setBookFavQuote("");
    setMusicRatings({ production: 0, lyrics: 0, replay: 0, vibe: 0 }); setMusicFavLyric("");
    setFilmRatings({ story: 0, acting: 0, visuals: 0, pacing: 0 }); setFilmFavLine("");
    setFoodRatings({ taste: 0, value: 0, vibe: 0 }); setFoodPriceRange("");
    setPlacePriceRange(""); setOpeningHours("");
    setGalleryUrls([]); setError("");
    setCategory(""); setCategoryManuallySet(false);
  }, []);

  const MAX_GALLERY = 4;

  async function handleGalleryImageUpload(file: File) {
    setGalleryUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setGalleryUrls(prev => [...prev, data.url].slice(0, MAX_GALLERY));
    } catch (e: any) {
      setError(e.message || "Image upload failed");
    } finally {
      setGalleryUploading(false);
    }
  }

  function removeGalleryImage(idx: number) {
    setGalleryUrls(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleStopImageUpload(stopId: string, file: File) {
    setStops(prev => prev.map(s => s.id === stopId ? { ...s, image_uploading: true } : s));
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setStops(prev => prev.map(s => s.id === stopId ? { ...s, image_url: data.url, image_uploading: false } : s));
    } catch (e: any) {
      setError(e.message || "Stop image upload failed");
      setStops(prev => prev.map(s => s.id === stopId ? { ...s, image_uploading: false } : s));
    }
  }

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      if (activeTab === "quote") {
        if (!qText.trim()) throw new Error("Quote text is required");
        if (!qAuthorEntry) throw new Error("Search the directory to pick who said this.");
        const res = await fetch("/api/quotes/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: qText.trim(),
            author: qAuthorEntry.title,
            source: (qSourceEntry?.title || qSource).trim() || undefined,
            quote_author_directory_id: qAuthorEntry?.id || undefined,
            linked_directory_id: qSourceEntry?.id || undefined,
            sharing_reason: qReflection.trim() || undefined,
            quote_type: qType || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post quote");
      } else {
        let template_type = "";
        const payload: Record<string, unknown> = { tag: category };

        if (activeTab === "update") {
          template_type = "post";
          if (!updContent.trim()) throw new Error("Post content is required");
          payload.text = updTitle.trim() ? `${updTitle.trim()}\n\n${updContent.trim()}` : updContent.trim();
          if (galleryUrls.length > 0) { payload.imageUrl = galleryUrls[0]; payload.gallery_images = galleryUrls; }
        } else if (activeTab === "review") {
          template_type = REVIEW_TEMPLATE[revSubtype];
          if (!revContent.trim()) throw new Error("Review content is required");
          if (revSubtype === "place") {
            const placeName = revEntry?.title || revTitle.trim();
            payload.location_name = placeName;
            payload.text = revContent.trim();
            if (revEntry?.id) payload.linked_directory_id = revEntry.id;
            if (revEntry?.slug) payload.linked_directory_slug = revEntry.slug;
          } else if (revSubtype === "food") {
            const foodName = revEntry?.title || revTitle.trim();
            payload.text = foodName ? `${foodName}\n\n${revContent.trim()}` : revContent.trim();
            if (revEntry?.id) payload.linked_directory_id = revEntry.id;
            if (revEntry?.slug) payload.linked_directory_slug = revEntry.slug;
          } else {
            // book / music / film — use linked directory entry when available
            const entryTitle = revEntry?.title || revTitle.trim();
            payload.text = entryTitle ? `${entryTitle}\n\n${revContent.trim()}` : revContent.trim();
            if (revEntry?.id) {
              payload.linked_directory_id = revEntry.id;
              if (revEntry?.slug) payload.linked_directory_slug = revEntry.slug;
              if (revSubtype === "book") {
                payload.book_title = revEntry.title;
                payload.book_author = revEntry.about;
                if (revEntry.thumbnail) payload.book_cover_url = revEntry.thumbnail;
              } else if (revSubtype === "music") {
                payload.music_title = revEntry.title;
                payload.music_artist = revEntry.about;
                if (revEntry.thumbnail) payload.music_cover_url = revEntry.thumbnail;
                if (revEntry.previewUrl) payload.music_preview_url = revEntry.previewUrl;
              } else if (revSubtype === "film") {
                payload.film_title = revEntry.title;
                payload.film_director = revEntry.about;
                if (revEntry.thumbnail) payload.film_cover_url = revEntry.thumbnail;
              }
            }
          }
          // Extended per-subtype fields
          if (revSubtype === "book") {
            payload.book_overall_rating = revRating;
            if (bookStatus) payload.book_status = bookStatus;
            if (bookRatings.writing)    payload.book_rating_writing    = bookRatings.writing;
            if (bookRatings.story)      payload.book_rating_story      = bookRatings.story;
            if (bookRatings.characters) payload.book_rating_characters = bookRatings.characters;
            if (bookRatings.pacing)     payload.book_rating_pacing     = bookRatings.pacing;
            if (bookFavQuote.trim()) payload.book_fav_quote = bookFavQuote.trim();
          } else if (revSubtype === "music") {
            payload.music_overall_rating = revRating;
            if (musicRatings.production) payload.music_rating_production = musicRatings.production;
            if (musicRatings.lyrics)     payload.music_rating_lyrics    = musicRatings.lyrics;
            if (musicRatings.replay)     payload.music_rating_replay    = musicRatings.replay;
            if (musicRatings.vibe)       payload.music_rating_vibe      = musicRatings.vibe;
            if (musicFavLyric.trim()) payload.music_fav_lyric = musicFavLyric.trim();
          } else if (revSubtype === "film") {
            payload.film_overall_rating = revRating;
            if (filmRatings.story)   payload.film_rating_story   = filmRatings.story;
            if (filmRatings.acting)  payload.film_rating_acting  = filmRatings.acting;
            if (filmRatings.visuals) payload.film_rating_visuals = filmRatings.visuals;
            if (filmRatings.pacing)  payload.film_rating_pacing  = filmRatings.pacing;
            if (filmFavLine.trim()) payload.film_fav_line = filmFavLine.trim();
          } else if (revSubtype === "food") {
            if (foodRatings.taste) payload.food_rating_taste = foodRatings.taste;
            if (foodRatings.value) payload.food_rating_value = foodRatings.value;
            if (foodRatings.vibe)  payload.food_rating_vibe  = foodRatings.vibe;
            if (foodPriceRange) payload.price_range = foodPriceRange;
          } else if (revSubtype === "place") {
            if (placePriceRange) payload.price_range = placePriceRange;
            if (openingHours.trim()) payload.opening_hours = openingHours.trim();
          }
          payload.star_rating = revRating;
          if (galleryUrls.length > 0) { payload.imageUrl = galleryUrls[0]; payload.gallery_images = galleryUrls; }
        } else if (activeTab === "art") {
          template_type = "project";
          if (!artContent.trim()) throw new Error("Description is required");
          payload.text = artTitle.trim() ? `${artTitle.trim()}\n\n${artContent.trim()}` : artContent.trim();
          if (showcaseMedium) payload.showcase_medium = showcaseMedium;
          if (galleryUrls.length > 0) { payload.imageUrl = galleryUrls[0]; payload.gallery_images = galleryUrls; }
        } else if (activeTab === "poll") {
          template_type = "poll";
          if (!pollQ.trim()) throw new Error("Poll question is required");
          const opts = pollOpts.filter(o => o.trim());
          if (opts.length < 2) throw new Error("Add at least 2 poll options");
          payload.text = pollQ.trim();
          payload.poll_options = opts.map(o => ({ text: o.trim() }));
          if (pollDescription.trim()) payload.poll_description = pollDescription.trim();
          const days = parseInt(pollDuration);
          const exp = new Date();
          exp.setDate(exp.getDate() + days);
          payload.poll_expires_at = exp.toISOString();
        } else if (activeTab === "itinerary") {
          template_type = "itinerary";
          if (!iOverview.trim()) throw new Error("Overview is required");
          payload.text = iTitle.trim() ? `${iTitle.trim()}\n\n${iOverview.trim()}` : iOverview.trim();
          const validStops = stops.filter(s => s.name.trim());
          if (validStops.length === 0) throw new Error("Add at least one stop");
          payload.itinerary_stops = validStops.map(s => ({
            name: s.name.trim(),
            lat: 0,
            lng: 0,
            note: [s.location.trim(), s.note.trim()].filter(Boolean).join(" — "),
            image_url: s.image_url || "",
          }));
          if (iCity.trim()) payload.itinerary_city = iCity.trim();
          if (iDurationPick) payload.itinerary_duration = iDurationPick;
          if (iBudget) payload.itinerary_budget = iBudget;
          if (iBestTime.trim()) payload.itinerary_best_time = iBestTime.trim();
        } else if (activeTab === "event") {
          template_type = "event";
          if (!evTitle.trim()) throw new Error("Event title is required");
          if (!evDate) throw new Error("Event date is required");
          payload.text = evDesc.trim() || evTitle.trim();
          payload.event_title = evTitle.trim();
          payload.event_date = evDate;
          if (evEndDate) payload.event_end_date = evEndDate;
          payload.event_venue = evVenue.trim();
          payload.event_city = evCity.trim();
          payload.event_address = evAddress.trim() || evVenue.trim();
          payload.event_admission = evAdmission.trim() || "Free";
          if (evTicketUrl.trim()) payload.ticket_url = evTicketUrl.trim();
          if (evCategory) payload.event_category = evCategory;
          if (evOrganiser?.id) payload.organiser_directory_id = evOrganiser.id;
          payload.rsvp_enabled = evRsvpEnabled;
          if (evRsvpEnabled && evCapacity.trim()) payload.rsvp_capacity = parseInt(evCapacity);
          if (galleryUrls.length > 0) { payload.imageUrl = galleryUrls[0]; payload.gallery_images = galleryUrls; }
        }

        payload.template_type = template_type;
        if (hubId) payload.hub_id = hubId;

        const res = await fetch("/api/community/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to post");
      }

      resetAll();
      onClose();
      onSuccess?.();
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  if (!open) return null;

  const tabLabel = TABS.find(t => t.key === activeTab)?.label ?? "Post";

  return (
    <div className="cm-backdrop" role="dialog" aria-modal="true" aria-label="Create post" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="cm-card">

        {/* Header */}
        <div className="cm-header">
          <div className="cm-header-title">
            <span className="cm-title">Create Post</span>
            <span className="cm-type-badge">{tabLabel}</span>
          </div>
          <button type="button" className="cm-close" onClick={handleClose} aria-label="Close">✕</button>
        </div>

        {/* Tab strip */}
        <div className="cm-tabs" role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`cm-tab${activeTab === tab.key ? " cm-tab--active" : ""}`}
              onClick={() => { setActiveTab(tab.key); setGalleryUrls([]); }}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="cm-body">
          {error && <p className="cm-error">{error}</p>}

          {/* ── UPDATE ── */}
          {activeTab === "update" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Title <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="Give your post a title…"
                  value={updTitle}
                  onChange={e => setUpdTitle(e.target.value)}
                  maxLength={120}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">What&rsquo;s on your mind?</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Share what's happening in culture right now…"
                  value={updContent}
                  onChange={e => setUpdContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Photos <span className="cm-label-opt">(optional, up to 4)</span></label>
                <MultiImageUpload urls={galleryUrls} onUpload={handleGalleryImageUpload} onRemove={removeGalleryImage} uploading={galleryUploading} />
              </div>
            </>
          )}

          {/* ── REVIEW ── */}
          {activeTab === "review" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Review type</label>
                <div className="cm-review-pills">
                  {(["place", "food", "music", "book", "film"] as ReviewSubtype[]).map(sub => (
                    <button
                      key={sub}
                      type="button"
                      className={`cm-pill${revSubtype === sub ? " cm-pill--active" : ""}`}
                      onClick={() => { setRevSubtype(sub); setRevEntry(null); setRevTitle(""); setGalleryUrls([]); }}
                    >
                      {{ place: "📍 Place", food: "🍽 Food", music: "🎵 Music", book: "📚 Book", film: "🎬 Film" }[sub]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cm-field">
                <>
                  <label className="cm-label">
                    {{ place: "Place", food: "Restaurant / dish", book: "Book", music: "Album", film: "Film" }[revSubtype]}
                  </label>
                  <DirectorySearch
                    value={revEntry}
                    onChange={(entry) => { setRevEntry(entry); if (entry) setRevTitle(entry.title); }}
                    typeFilter={{ place: "place", food: "place", book: "book", music: "album", film: "film" }[revSubtype]}
                    aboutFieldLabel={{ book: "Author", music: "Artist", film: "Director" }[revSubtype as "book" | "music" | "film"] ?? undefined}
                    externalSource={({ place: "google_places", food: "google_places", book: "google_books", music: "spotify", film: "tmdb" } as const)[revSubtype]}
                    placeholder={{ place: "Search for a place on Google Maps…", food: "Search for a restaurant or café…", book: "Search for a book…", music: "Search for an album…", film: "Search for a film…" }[revSubtype]}
                  />
                </>
              </div>
              {/* Book status */}
              {revSubtype === "book" && (
                <div className="cm-field">
                  <label className="cm-label">Reading status</label>
                  <div className="cm-review-pills">
                    {BOOK_STATUSES.map(s => (
                      <button
                        key={s}
                        type="button"
                        className={`cm-pill${bookStatus === s ? " cm-pill--active" : ""}`}
                        onClick={() => setBookStatus(bookStatus === s ? "" : s)}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Breakdown ratings */}
              {revSubtype === "book" && (
                <div className="cm-field">
                  <label className="cm-label">Breakdown <span className="cm-label-opt">(sets overall)</span></label>
                  <MultiRating
                    ratings={[
                      { label: "Writing", key: "writing", value: bookRatings.writing },
                      { label: "Story", key: "story", value: bookRatings.story },
                      { label: "Characters", key: "characters", value: bookRatings.characters },
                      { label: "Pacing", key: "pacing", value: bookRatings.pacing },
                    ]}
                    onChange={(key, v) => setBookRatings(r => ({ ...r, [key]: v }))}
                    overall={{ label: "Overall", value: revRating, onChange: setRevRating }}
                  />
                </div>
              )}
              {revSubtype === "music" && (
                <div className="cm-field">
                  <label className="cm-label">Breakdown <span className="cm-label-opt">(sets overall)</span></label>
                  <MultiRating
                    ratings={[
                      { label: "Production", key: "production", value: musicRatings.production },
                      { label: "Lyrics", key: "lyrics", value: musicRatings.lyrics },
                      { label: "Replay", key: "replay", value: musicRatings.replay },
                      { label: "Vibe", key: "vibe", value: musicRatings.vibe },
                    ]}
                    onChange={(key, v) => setMusicRatings(r => ({ ...r, [key]: v }))}
                    overall={{ label: "Overall", value: revRating, onChange: setRevRating }}
                  />
                </div>
              )}
              {revSubtype === "film" && (
                <div className="cm-field">
                  <label className="cm-label">Breakdown <span className="cm-label-opt">(sets overall)</span></label>
                  <MultiRating
                    ratings={[
                      { label: "Story", key: "story", value: filmRatings.story },
                      { label: "Acting", key: "acting", value: filmRatings.acting },
                      { label: "Visuals", key: "visuals", value: filmRatings.visuals },
                      { label: "Pacing", key: "pacing", value: filmRatings.pacing },
                    ]}
                    onChange={(key, v) => setFilmRatings(r => ({ ...r, [key]: v }))}
                    overall={{ label: "Overall", value: revRating, onChange: setRevRating }}
                  />
                </div>
              )}
              {revSubtype === "food" && (
                <div className="cm-field">
                  <label className="cm-label">Breakdown <span className="cm-label-opt">(sets overall)</span></label>
                  <MultiRating
                    ratings={[
                      { label: "Taste", key: "taste", value: foodRatings.taste },
                      { label: "Value", key: "value", value: foodRatings.value },
                      { label: "Vibe", key: "vibe", value: foodRatings.vibe },
                    ]}
                    onChange={(key, v) => setFoodRatings(r => ({ ...r, [key]: v }))}
                    overall={{ label: "Overall", value: revRating, onChange: setRevRating }}
                  />
                </div>
              )}

              {/* Food extras */}
              {revSubtype === "food" && (
                <div className="cm-field">
                  <label className="cm-label">Price range <span className="cm-label-opt">(optional)</span></label>
                  <div className="cm-review-pills">
                    {PRICE_RANGES.map(p => (
                      <button
                        key={p}
                        type="button"
                        className={`cm-pill${foodPriceRange === p ? " cm-pill--active" : ""}`}
                        onClick={() => setFoodPriceRange(foodPriceRange === p ? "" : p)}
                      >{p}</button>
                    ))}
                  </div>
                </div>
              )}
              {revSubtype === "place" && (
                <>
                  <div className="cm-field">
                    <label className="cm-label">Price range <span className="cm-label-opt">(optional)</span></label>
                    <div className="cm-review-pills">
                      {PRICE_RANGES.map(p => (
                        <button
                          key={p}
                          type="button"
                          className={`cm-pill${placePriceRange === p ? " cm-pill--active" : ""}`}
                          onClick={() => setPlacePriceRange(placePriceRange === p ? "" : p)}
                        >{p}</button>
                      ))}
                    </div>
                  </div>
                  <div className="cm-field">
                    <label className="cm-label">Opening hours <span className="cm-label-opt">(optional)</span></label>
                    <input
                      className="cm-input"
                      placeholder="e.g. Mon–Fri 9am–6pm…"
                      value={openingHours}
                      onChange={e => setOpeningHours(e.target.value)}
                    />
                  </div>
                </>
              )}

              {/* Overall star rating — place only; food/music/book/film use breakdown auto-calc */}
              {revSubtype === "place" && (
                <div className="cm-field">
                  <label className="cm-label">Overall rating</label>
                  <StarRating value={revRating} onChange={setRevRating} />
                </div>
              )}

              <div className="cm-field">
                <label className="cm-label">Your review</label>
                <textarea
                  className="cm-textarea"
                  placeholder={
                    { place: "What makes it worth visiting?", food: "How was the taste, vibe, value?", music: "What does this make you feel?", book: "What stayed with you?", film: "What made it memorable?" }[revSubtype]
                  }
                  value={revContent}
                  onChange={e => setRevContent(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Favourite quote / lyric / line */}
              {revSubtype === "book" && (
                <div className="cm-field">
                  <label className="cm-label">Favourite quote <span className="cm-label-opt">(optional)</span></label>
                  <textarea
                    className="cm-textarea cm-textarea--serif"
                    placeholder="A line that stayed with you…"
                    value={bookFavQuote}
                    onChange={e => setBookFavQuote(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              {revSubtype === "music" && (
                <div className="cm-field">
                  <label className="cm-label">Favourite lyric <span className="cm-label-opt">(optional)</span></label>
                  <textarea
                    className="cm-textarea cm-textarea--serif"
                    placeholder="A lyric that hit different…"
                    value={musicFavLyric}
                    onChange={e => setMusicFavLyric(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
              {revSubtype === "film" && (
                <div className="cm-field">
                  <label className="cm-label">Favourite line <span className="cm-label-opt">(optional)</span></label>
                  <textarea
                    className="cm-textarea cm-textarea--serif"
                    placeholder="A line from the film…"
                    value={filmFavLine}
                    onChange={e => setFilmFavLine(e.target.value)}
                    rows={2}
                  />
                </div>
              )}

              <div className="cm-field">
                <label className="cm-label">Photos <span className="cm-label-opt">(optional, up to 4)</span></label>
                <MultiImageUpload urls={galleryUrls} onUpload={handleGalleryImageUpload} onRemove={removeGalleryImage} uploading={galleryUploading} />
              </div>
            </>
          )}

          {/* ── ART / SHOWCASE ── */}
          {activeTab === "art" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Artwork title <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="Name of the piece or project…"
                  value={artTitle}
                  onChange={e => setArtTitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Medium <span className="cm-label-opt">(optional)</span></label>
                <div className="cm-review-pills">
                  {SHOWCASE_MEDIUMS.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`cm-pill${showcaseMedium === m ? " cm-pill--active" : ""}`}
                      onClick={() => setShowcaseMedium(showcaseMedium === m ? "" : m)}
                    >{m}</button>
                  ))}
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Curator&rsquo;s note</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Tell us about this work — the concept, the process, what inspired it…"
                  value={artContent}
                  onChange={e => setArtContent(e.target.value)}
                  rows={5}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Visuals <span className="cm-label-opt">(up to 4)</span></label>
                <MultiImageUpload urls={galleryUrls} onUpload={handleGalleryImageUpload} onRemove={removeGalleryImage} uploading={galleryUploading} />
              </div>
            </>
          )}

          {/* ── POLL ── */}
          {activeTab === "poll" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Your question</label>
                <input
                  className="cm-input"
                  placeholder="Ask the community something…"
                  value={pollQ}
                  onChange={e => setPollQ(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Context <span className="cm-label-opt">(optional)</span></label>
                <textarea
                  className="cm-textarea"
                  placeholder="Add some background or context for your question…"
                  value={pollDescription}
                  onChange={e => setPollDescription(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Options</label>
                <div className="cm-poll-options">
                  {pollOpts.map((opt, i) => (
                    <div key={i} className="cm-poll-opt-row">
                      <input
                        className="cm-input"
                        placeholder={`Option ${i + 1}…`}
                        value={opt}
                        onChange={e => {
                          const next = [...pollOpts];
                          next[i] = e.target.value;
                          setPollOpts(next);
                        }}
                      />
                      {pollOpts.length > 2 && (
                        <button
                          type="button"
                          className="cm-poll-remove"
                          onClick={() => setPollOpts(pollOpts.filter((_, j) => j !== i))}
                          aria-label="Remove option"
                        >✕</button>
                      )}
                    </div>
                  ))}
                  {pollOpts.length < 5 && (
                    <button
                      type="button"
                      className="cm-add-btn"
                      onClick={() => setPollOpts([...pollOpts, ""])}
                    >
                      <span aria-hidden="true">＋</span> Add option
                    </button>
                  )}
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Poll duration</label>
                <div className="cm-review-pills">
                  {POLL_DURATIONS.map(d => (
                    <button
                      key={d.value}
                      type="button"
                      className={`cm-pill${pollDuration === d.value ? " cm-pill--active" : ""}`}
                      onClick={() => setPollDuration(d.value)}
                    >{d.label}</button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── QUOTE ── */}
          {activeTab === "quote" && (
            <>
              {/* Quote type — at the top so the source picker below adapts immediately */}
              <div className="cm-field">
                <label className="cm-label">Quote type <span className="cm-label-opt">(optional)</span></label>
                <div className="cm-review-pills">
                  {QUOTE_TYPES.map(qt => (
                    <button
                      key={qt}
                      type="button"
                      className={`cm-pill${qType === qt ? " cm-pill--active" : ""}`}
                      onClick={() => { setQType(qType === qt ? "" : qt); setQSourceEntry(null); }}
                    >
                      {{ Person: "👤 Person", Book: "📚 Book", Film: "🎬 Film", Speech: "🎤 Speech", Song: "🎵 Song" }[qt]}
                    </button>
                  ))}
                </div>
              </div>

              {/* The quote */}
              <div className="cm-field">
                <label className="cm-label">The quote</label>
                <textarea
                  className="cm-textarea cm-textarea--serif"
                  placeholder='"The quote that moved you…"'
                  value={qText}
                  onChange={e => setQText(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Author — directory-backed picker, freeform fallback */}
              <div className="cm-field">
                <DirectorySearch
                  value={qAuthorEntry}
                  onChange={entry => setQAuthorEntry(entry)}
                  typeFilter="person"
                  placeholder="Who said it? *"
                  aboutFieldLabel="Known for"
                />
              </div>

              {/* Source — directory search with external catalog when type has one; freeform for Speech/untyped; hidden for Person */}
              {QUOTE_SOURCE_TYPES[qType] ? (
                <div className="cm-field">
                  <DirectorySearch
                    value={qSourceEntry}
                    onChange={entry => setQSourceEntry(entry)}
                    typeFilter={QUOTE_SOURCE_TYPES[qType].type}
                    placeholder={QUOTE_SOURCE_TYPES[qType].label}
                    aboutFieldLabel={QUOTE_SOURCE_TYPES[qType].about}
                    externalSource={QUOTE_SOURCE_TYPES[qType].external}
                  />
                </div>
              ) : qType !== "Person" ? (
                <div className="cm-field">
                  <label className="cm-label">Source <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    placeholder="e.g. speech, article, interview…"
                    value={qSource}
                    onChange={e => setQSource(e.target.value)}
                  />
                </div>
              ) : null}

              {/* Why does this resonate? */}
              <div className="cm-field">
                <label className="cm-label">Why does this resonate? <span className="cm-label-opt">(optional)</span></label>
                <textarea
                  className="cm-textarea"
                  placeholder="Share why this quote stayed with you…"
                  value={qReflection}
                  onChange={e => setQReflection(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}

          {/* ── ITINERARY ── */}
          {activeTab === "itinerary" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Itinerary title</label>
                <input
                  className="cm-input"
                  placeholder="e.g. 48 Hours in Lagos"
                  value={iTitle}
                  onChange={e => setITitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">City / destination <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="e.g. Lagos, Paris, New York…"
                  value={iCity}
                  onChange={e => setICity(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Duration <span className="cm-label-opt">(optional)</span></label>
                <div className="cm-review-pills cm-pills-wrap">
                  {ITINERARY_DURATIONS.map(d => (
                    <button
                      key={d}
                      type="button"
                      className={`cm-pill${iDurationPick === d ? " cm-pill--active" : ""}`}
                      onClick={() => setIDurationPick(iDurationPick === d ? "" : d)}
                    >{d}</button>
                  ))}
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Budget <span className="cm-label-opt">(optional)</span></label>
                <div className="cm-review-pills">
                  {ITINERARY_BUDGETS.map(b => (
                    <button
                      key={b}
                      type="button"
                      className={`cm-pill${iBudget === b ? " cm-pill--active" : ""}`}
                      onClick={() => setIBudget(iBudget === b ? "" : b)}
                    >{b}</button>
                  ))}
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Overview / tagline</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Set the scene — who's this for, what's the vibe?"
                  value={iOverview}
                  onChange={e => setIOverview(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Best time to visit <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="e.g. Spring, December, dry season…"
                  value={iBestTime}
                  onChange={e => setIBestTime(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Stops</label>
                <div className="cm-stops">
                  {stops.map((stop, i) => (
                    <div key={stop.id} className="cm-stop-card">
                      <div className="cm-stop-header">
                        <span className="cm-stop-num">Stop {i + 1}</span>
                        {stops.length > 1 && (
                          <button
                            type="button"
                            className="cm-poll-remove"
                            onClick={() => setStops(stops.filter(s => s.id !== stop.id))}
                            aria-label="Remove stop"
                          >✕</button>
                        )}
                      </div>
                      <input
                        className="cm-input"
                        placeholder="Stop name / place…"
                        value={stop.name}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, name: e.target.value } : s))}
                      />
                      <input
                        className="cm-input"
                        placeholder="Address or neighbourhood (optional)…"
                        value={stop.location}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, location: e.target.value } : s))}
                      />
                      <textarea
                        className="cm-textarea"
                        placeholder="Tips, notes, what to do here…"
                        value={stop.note}
                        onChange={e => setStops(stops.map(s => s.id === stop.id ? { ...s, note: e.target.value } : s))}
                        rows={2}
                      />
                      {/* Per-stop photo */}
                      <div className="cm-stop-photo">
                        <input
                          id={`stop-img-${stop.id}`}
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={e => { if (e.target.files?.[0]) handleStopImageUpload(stop.id, e.target.files[0]); e.target.value = ""; }}
                        />
                        {stop.image_url ? (
                          <div className="cm-stop-photo-preview">
                            <img src={stop.image_url} alt="Stop photo" />
                            <button type="button" className="cm-stop-photo-remove" onClick={() => setStops(stops.map(s => s.id === stop.id ? { ...s, image_url: "" } : s))} aria-label="Remove photo">✕</button>
                          </div>
                        ) : (
                          <label htmlFor={`stop-img-${stop.id}`} className={`cm-stop-photo-add${stop.image_uploading ? " cm-stop-photo-add--uploading" : ""}`}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                            {stop.image_uploading ? "Uploading…" : "Add photo"}
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                  {stops.length < 8 && (
                    <button
                      type="button"
                      className="cm-add-btn"
                      onClick={() => setStops([...stops, { id: Math.random().toString(36).slice(2), name: "", location: "", note: "", image_url: "" }])}
                    >
                      <span aria-hidden="true">＋</span> Add a stop
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── EVENT ── */}
          {activeTab === "event" && (
            <>
              <div className="cm-field">
                <label className="cm-label">Event title</label>
                <input
                  className="cm-input"
                  placeholder="What's the event called?"
                  value={evTitle}
                  onChange={e => setEvTitle(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Category <span className="cm-label-opt">(optional)</span></label>
                <div className="cm-review-pills cm-pills-wrap">
                  {EVENT_CATEGORIES.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`cm-pill${evCategory === c ? " cm-pill--active" : ""}`}
                      onClick={() => setEvCategory(evCategory === c ? "" : c)}
                    >{c}</button>
                  ))}
                </div>
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Start date &amp; time</label>
                  <input
                    className="cm-input"
                    type="datetime-local"
                    value={evDate}
                    onChange={e => setEvDate(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">End date &amp; time <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    type="datetime-local"
                    value={evEndDate}
                    onChange={e => setEvEndDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Venue name</label>
                  <input
                    className="cm-input"
                    placeholder="Venue or space name…"
                    value={evVenue}
                    onChange={e => setEvVenue(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">City</label>
                  <input
                    className="cm-input"
                    placeholder="e.g. London"
                    value={evCity}
                    onChange={e => setEvCity(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Address <span className="cm-label-opt">(optional)</span></label>
                <input
                  className="cm-input"
                  placeholder="Full street address…"
                  value={evAddress}
                  onChange={e => setEvAddress(e.target.value)}
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Organiser <span className="cm-label-opt">(optional)</span></label>
                <DirectorySearch
                  value={evOrganiser}
                  onChange={entry => setEvOrganiser(entry)}
                  typeFilter="person"
                  placeholder="Search for an organiser in the directory…"
                  aboutFieldLabel="Known for"
                />
              </div>
              <div className="cm-field">
                <label className="cm-label">Description</label>
                <textarea
                  className="cm-textarea"
                  placeholder="Tell people what to expect…"
                  value={evDesc}
                  onChange={e => setEvDesc(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="cm-grid-2">
                <div className="cm-field">
                  <label className="cm-label">Admission <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    placeholder="e.g. Free, £10, $15"
                    value={evAdmission}
                    onChange={e => setEvAdmission(e.target.value)}
                  />
                </div>
                <div className="cm-field">
                  <label className="cm-label">Ticket / RSVP link <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    type="url"
                    placeholder="https://…"
                    value={evTicketUrl}
                    onChange={e => setEvTicketUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="cm-field">
                <label className="cm-label">Enable RSVP</label>
                <div className="cm-review-pills">
                  <button
                    type="button"
                    className={`cm-pill${evRsvpEnabled ? " cm-pill--active" : ""}`}
                    onClick={() => setEvRsvpEnabled(true)}
                  >Yes</button>
                  <button
                    type="button"
                    className={`cm-pill${!evRsvpEnabled ? " cm-pill--active" : ""}`}
                    onClick={() => { setEvRsvpEnabled(false); setEvCapacity(""); }}
                  >No</button>
                </div>
              </div>
              {evRsvpEnabled && (
                <div className="cm-field">
                  <label className="cm-label">Capacity <span className="cm-label-opt">(optional)</span></label>
                  <input
                    className="cm-input"
                    type="number"
                    min="1"
                    placeholder="Max attendees…"
                    value={evCapacity}
                    onChange={e => setEvCapacity(e.target.value)}
                  />
                </div>
              )}
              <div className="cm-field">
                <label className="cm-label">Cover banner <span className="cm-label-opt">(optional, up to 4)</span></label>
                <MultiImageUpload urls={galleryUrls} onUpload={handleGalleryImageUpload} onRemove={removeGalleryImage} uploading={galleryUploading} />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="cm-footer">
          <div className="cm-footer-left">
            <span className="cm-footer-label">Hub</span>
            <select
              className="cm-category-select"
              value={category}
              onChange={e => { setCategory(e.target.value); setCategoryManuallySet(true); }}
              aria-label="Hub"
            >
              <option value="">— Select Hub —</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>#{c}</option>
              ))}
            </select>
          </div>
          <div className="cm-footer-right">
            <button type="button" className="cm-cancel" onClick={handleClose}>Cancel</button>
            <button
              type="button"
              className="cm-submit"
              disabled={submitting || galleryUploading}
              onClick={handleSubmit}
            >
              {submitting ? "Posting…" : "Publish Post"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
