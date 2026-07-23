"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import SourcePreviewCard from "./SourcePreviewCard";
import StarRating from "@/components/composer/StarRating";
import MultiRating from "@/components/composer/MultiRating";
import DirectorySearch from "@/components/composer/DirectorySearch";
import PollBuilder from "@/components/composer/PollBuilder";
import ItineraryBuilder, { type ItineraryStop } from "@/components/composer/ItineraryBuilder";

const URL_RE = /https?:\/\/[^\s]+/i;

const EDITION_TO_REGION: Record<string, string> = {
  uk: "Diaspora UK", us: "Diaspora US", africa: "Africa",
};
const COUNTRY_TO_REGION: Record<string, string> = {
  ng: "Africa", ghana: "Africa", ke: "Africa", za: "Africa",
  nigeria: "Africa", kenya: "Africa", "south africa": "Africa",
  ethiopia: "Africa", senegal: "Africa", cameroon: "Africa",
  gb: "Diaspora UK", uk: "Diaspora UK", "united kingdom": "Diaspora UK",
  us: "Diaspora US", "united states": "Diaspora US",
  fr: "Diaspora Europe", de: "Diaspora Europe", nl: "Diaspora Europe",
  france: "Diaspora Europe", germany: "Diaspora Europe", netherlands: "Diaspora Europe",
  belgium: "Diaspora Europe", italy: "Diaspora Europe", spain: "Diaspora Europe",
  jamaica: "Caribbean", trinidad: "Caribbean", barbados: "Caribbean",
  guyana: "Caribbean", haiti: "Caribbean",
};

function detectRegion(countryOfResidence?: string): string | null {
  if (typeof document !== "undefined") {
    const edition = document.cookie.split("; ")
      .find(r => r.startsWith("moveee_edition="))?.split("=")[1];
    if (edition && EDITION_TO_REGION[edition]) return EDITION_TO_REGION[edition];
  }
  if (countryOfResidence) {
    const key = countryOfResidence.toLowerCase().trim();
    return COUNTRY_TO_REGION[key] ?? null;
  }
  return null;
}

const TAGS = ["Music", "Fashion", "Art", "Film", "Food", "Sport", "Travel", "Ideas", "Literature", "Design", "Tech"] as const;
type Tag = (typeof TAGS)[number];

type TemplateType = "post" | "quote" | "hidden-gem" | "cultural-take" | "food-review" | "book-review" | "creative-showcase" | "poll" | "itinerary" | "event";

// Never-gated templates first, then the ones TEMPLATE_REP_GATE (below) can
// lock — Quote was never gated but sat after Poll/Route/Event, so it read
// as locked-away even though it wasn't.
const TEMPLATES: { slug: TemplateType; label: string; emoji: string }[] = [
  { slug: "post",              label: "Update",    emoji: "📝" },
  { slug: "hidden-gem",        label: "Gem",       emoji: "💎" },
  { slug: "cultural-take",     label: "Take",      emoji: "💬" },
  { slug: "food-review",       label: "Food",      emoji: "🍽️" },
  { slug: "book-review",       label: "Book",      emoji: "📚" },
  { slug: "creative-showcase", label: "Showcase",  emoji: "🎨" },
  { slug: "quote",             label: "Quote",     emoji: "✦" },
  { slug: "poll",              label: "Poll",      emoji: "📊" },
  { slug: "itinerary",         label: "Route",     emoji: "🗺️" },
  { slug: "event",             label: "Event",     emoji: "📅" },
];

// Templates gated by reputation tier (Moveee Pro always bypasses) — mirrors the
// server-side gate in handle_submit_post() / apps/connect/app/api/community/submit/route.ts
const TEMPLATE_REP_GATE: Partial<Record<TemplateType, { minRep: number; tierLabel: string }>> = {
  poll:      { minRep: 2500, tierLabel: "Taste Maker" },
  itinerary: { minRep: 2500, tierLabel: "Taste Maker" },
  event:     { minRep: 500,  tierLabel: "Culture Contributor" },
};

const TEMPLATE_GUIDES: Record<TemplateType, { desc: string; chips: string[] }> = {
  post:                { desc: "Share news, a link, or a quick thought from your cultural world.",                          chips: ["Hot take:",           "Just saw that",          "Anyone else noticed"] },
  "hidden-gem":        { desc: "Recommend a place worth visiting — hidden spots, local favourites, underrated venues.",     chips: ["Hidden gem alert:",   "Not enough people know about", "If you haven't been to"] },
  "cultural-take":     { desc: "Share a cultural opinion on a book, film, event, or idea worth discussing.",                chips: ["Here's my honest take on", "I finally watched/read", "Why this matters:"] },
  "food-review":       { desc: "Review a dish or restaurant. Rate the taste, value, and vibe.",                            chips: ["Came for the hype, and", "Best thing on the menu:", "Honest review:"] },
  "book-review":       { desc: "Review a book you've read — rate it and share your thoughts.",                             chips: ["Finished it and honestly:", "Had high hopes but", "The kind of book that"] },
  "creative-showcase": { desc: "Share your creative work — art, photography, design, or music.",                           chips: ["Working on something:", "New piece:",             "Behind the work:"] },
  poll:                { desc: "Ask the community something. Great for settling debates or gathering opinions.",             chips: ["Which is better:",    "Settle this for me:",    "Genuine question:"] },
  itinerary:           { desc: "Share a travel itinerary or a local route worth following.",                                chips: ["A perfect day in",    "My go-to route:",        "For first-timers in"] },
  event:               { desc: "Submit a cultural event happening in your city. It will appear on the events calendar.",   chips: ["Happening this weekend:", "Don't miss this one:", "Tickets going fast:"] },
  quote:               { desc: "Share a quote that moved you. Add the author and source below.",                           chips: ["This has stayed with me:", "Still thinking about this:", "Words I keep returning to:"] },
};

// Template → default section tag
const TEMPLATE_TAGS: Partial<Record<TemplateType, Tag>> = {
  "food-review":       "Food",
  "book-review":       "Literature",
  "itinerary":         "Travel",
  "creative-showcase": "Art",
};

// Keyword lists for content-based tag detection
const TAG_KEYWORDS: [Tag, string[]][] = [
  ["Music",      ["music","song","album","artist","band","concert","gig","playlist","track","rapper","singer","lyrics","afrobeats","jazz","hip hop","r&b"]],
  ["Film",       ["film","movie","cinema","watched","director","actor","actress","series","episode","netflix","streaming","documentary","tv show"]],
  ["Literature", ["book","reading","novel","author","poetry","poem","writer","chapter","fiction","nonfiction","memoir","literature"]],
  ["Food",       ["food","eating","restaurant","dish","meal","cuisine","recipe","chef","cooking","taste","cafe","brunch","dinner","lunch"]],
  ["Travel",     ["travel","trip","city","country","visited","explore","destination","hotel","flight","vacation","holiday","abroad"]],
  ["Art",        ["art","painting","gallery","exhibition","sculpture","artwork","illustration","mural","portrait","photography"]],
  ["Fashion",    ["fashion","style","outfit","clothes","wearing","brand","designer","trend","runway","streetwear","sneakers","wardrobe"]],
  ["Sport",      ["sport","football","basketball","tennis","match","game","player","team","league","athletics","cricket","rugby","fifa"]],
  ["Tech",       ["tech","technology","app","software","coding","artificial intelligence","digital","startup","programming","algorithm"]],
  ["Design",     ["design","graphic","logo","typography","interface","ux","ui","branding","visual identity","illustration"]],
  ["Ideas",      ["idea","philosophy","society","politics","economy","future","innovation","theory","culture","mindset","movement"]],
];

function detectTagFromContent(text: string): Tag | null {
  let best: Tag | null = null;
  let bestScore = 0;
  const lower = text.toLowerCase();
  for (const [tag, keywords] of TAG_KEYWORDS) {
    let score = 0;
    for (const kw of keywords) {
      let pos = lower.indexOf(kw);
      while (pos !== -1) { score++; pos = lower.indexOf(kw, pos + 1); }
    }
    if (score > bestScore) { bestScore = score; best = tag; }
  }
  return bestScore >= 1 ? best : null;
}

const BOOK_STATUSES = ["Finished", "Reading", "Want to Read"] as const;
const BOOK_GENRES = ["Classic Literature", "World Lit", "Post-Colonial", "Fiction", "Historical", "Non-Fiction", "Thriller", "Romance"];

const MAX_CHARS: Record<string, number> = {
  post: 3000, "hidden-gem": 500, "cultural-take": 1000, "food-review": 500,
  "book-review": 800,
  "creative-showcase": 500, poll: 280, itinerary: 300, event: 1000, quote: 600,
};


interface SubmitPostProps {
  onPosted?: (item: { id: string; text: string; authorName: string; tag: string | null; imageUrl: string | null; region: string | null; galleryImages?: string[]; templateType?: string }) => void;
  lockedTag?: string;
  initialTemplate?: TemplateType;
  /** Hub-scoped composer (docs/hubs-plan.md §3.1). When set, the template
   * picker is filtered down to hubAllowedTemplates (absent entirely, not
   * just dimmed) and every submission includes hub_id. */
  hubId?: number;
  hubAllowedTemplates?: string[];
}

export default function SubmitPost({ onPosted, lockedTag, initialTemplate, hubId, hubAllowedTemplates }: SubmitPostProps) {
  const { data: session, status } = useSession();
  const visibleTemplates = hubAllowedTemplates
    ? TEMPLATES.filter(t => hubAllowedTemplates.includes(t.slug))
    : TEMPLATES;
  const [template, setTemplate] = useState<TemplateType>(
    (initialTemplate && (!hubAllowedTemplates || hubAllowedTemplates.includes(initialTemplate)))
      ? initialTemplate
      : (visibleTemplates[0]?.slug ?? "post")
  );

  // Shared state
  const [text, setText] = useState("");
  const [tag, setTag] = useState<Tag | "">(
    (lockedTag as Tag) ?? TEMPLATE_TAGS[initialTemplate ?? "post"] ?? ""
  );
  const [tagLocked, setTagLocked] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Link preview
  const [linkPreview, setLinkPreview] = useState<{ url: string; ogTitle: string; ogDescription: string; ogImage: string } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewFetchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Template-specific state
  const [starRating, setStarRating] = useState(0);
  const [directoryEntry, setDirectoryEntry] = useState<any>(null);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollDuration, setPollDuration] = useState("3");
  const [itineraryStops, setItineraryStops] = useState<ItineraryStop[]>([
    { name: "", lat: 0, lng: 0, note: "", image_url: "" },
    { name: "", lat: 0, lng: 0, note: "", image_url: "" },
  ]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  // Food review specific
  const [foodDishName, setFoodDishName] = useState("");
  const [foodTaste, setFoodTaste] = useState(0);
  const [foodValue, setFoodValue] = useState(0);
  const [foodVibe, setFoodVibe] = useState(0);

  // Book review specific
  const [bookEntry, setBookEntry] = useState<any>(null);
  const [bookStatus, setBookStatus] = useState<"Finished" | "Reading" | "Want to Read" | "">("");
  const [bookOverallRating, setBookOverallRating] = useState(0);
  const [bookRatings, setBookRatings] = useState({ writing: 0, story: 0, characters: 0, pacing: 0 });
  const [bookFavQuote, setBookFavQuote] = useState("");
  const [bookRecommend, setBookRecommend] = useState<boolean | null>(null);
  const [bookGenres, setBookGenres] = useState<string[]>([]);

  // Quote specific
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteSource, setQuoteSource] = useState("");
  const [quoteSharingReason, setQuoteSharingReason] = useState("");
  const [quoteType, setQuoteType] = useState("");

  // Event specific
  const [eventOrganiser, setEventOrganiser] = useState<{ id: number; title: string; slug: string; type: string; thumbnail: string | null } | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCity, setEventCity] = useState("");
  const [eventAdmission, setEventAdmission] = useState("");
  const [eventTicketUrl, setEventTicketUrl] = useState("");
  const [eventCategory, setEventCategory] = useState("");
  const [eventRsvpEnabled, setEventRsvpEnabled] = useState(false);
  const [eventRsvpCapacity, setEventRsvpCapacity] = useState("");

  const [lockedTip, setLockedTip] = useState<TemplateType | null>(null);
  const lockedTipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (lockedTipTimer.current) clearTimeout(lockedTipTimer.current); }, []);

  const user = session?.user as any;
  const isPro = user?.tier === "patron";
  const loggedIn = status === "authenticated";
  const maxChars = MAX_CHARS[template] ?? 3000;
  const charCount = text.length;
  const charRemaining = maxChars - charCount;
  const reputation = Number(user?.reputation ?? 0);

  function meetsTemplateGate(t: TemplateType): boolean {
    const gate = TEMPLATE_REP_GATE[t];
    if (!gate) return true;
    return isPro || reputation >= gate.minRep;
  }

  const fetchLinkPreview = useCallback((url: string) => {
    if (previewFetchRef.current) clearTimeout(previewFetchRef.current);
    setPreviewLoading(true);
    previewFetchRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/community/link-preview?url=${encodeURIComponent(url)}`);
        const og = await res.json();
        setLinkPreview({ url, ogTitle: og.title || "", ogDescription: og.description || "", ogImage: og.image || "" });
      } catch {
        setLinkPreview({ url, ogTitle: "", ogDescription: "", ogImage: "" });
      } finally {
        setPreviewLoading(false);
      }
    }, 800);
  }, []);

  useEffect(() => {
    if (template !== "post" || !isPro) return;
    const match = text.match(URL_RE);
    if (match) {
      const url = match[0];
      if (!linkPreview || linkPreview.url !== url) fetchLinkPreview(url);
    } else {
      setLinkPreview(null);
      setPreviewLoading(false);
    }
  }, [text, template]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = ev => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  }

  function handleGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 4);
    setGalleryFiles(prev => [...prev, ...files].slice(0, 4));
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setGalleryPreviews(prev => [...prev, ev.target?.result as string].slice(0, 4));
      reader.readAsDataURL(f);
    });
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeGalleryImage(i: number) {
    setGalleryFiles(prev => prev.filter((_, j) => j !== i));
    setGalleryPreviews(prev => prev.filter((_, j) => j !== i));
  }

  function resetForm() {
    setText(""); setTag(TEMPLATE_TAGS[template] ?? ""); setTagLocked(false); removeImage(); setError(""); setSuccess("");
    setStarRating(0); setDirectoryEntry(null);
    setPollOptions(["", ""]); setPollDuration("3");
    setItineraryStops([
      { name: "", lat: 0, lng: 0, note: "", image_url: "" },
      { name: "", lat: 0, lng: 0, note: "", image_url: "" },
    ]);
    setGalleryFiles([]); setGalleryPreviews([]); setVideoUrl("");
    setFoodDishName(""); setFoodTaste(0); setFoodValue(0); setFoodVibe(0);
    setQuoteAuthor(""); setQuoteSource(""); setQuoteSharingReason(""); setQuoteType("");
    setEventTitle(""); setEventDate(""); setEventEndDate(""); setEventLocation("");
    setEventCity(""); setEventAdmission(""); setEventTicketUrl(""); setEventCategory("");
    setEventOrganiser(null);
    setEventRsvpEnabled(false); setEventRsvpCapacity("");
    setLinkPreview(null);
  }

  async function uploadImage(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/community/upload-image", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url;
  }

  function handleTemplateChange(t: TemplateType) {
    if (!meetsTemplateGate(t)) {
      setLockedTip(t);
      if (lockedTipTimer.current) clearTimeout(lockedTipTimer.current);
      lockedTipTimer.current = setTimeout(() => setLockedTip(null), 4000);
      return;
    }
    setLockedTip(null);
    setTemplate(t);
    setError("");
    if (!lockedTag) {
      setTagLocked(false);
      setTag(TEMPLATE_TAGS[t] ?? "");
    }
  }

  function handleTagChange(value: Tag | "") {
    setTag(value);
    setTagLocked(value !== ""); // clearing resumes auto-detection
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setText(val);
    if (tagLocked || lockedTag || TEMPLATE_TAGS[template]) return;
    if (val.length < 20) { setTag(""); return; }
    const detected = detectTagFromContent(val);
    if (detected) setTag(detected);
  }

  function canSubmit(): boolean {
    if (loading) return false;
    if (charRemaining < 0) return false;

    switch (template) {
      case "post":
        if (!isPro && URL_RE.test(text)) return false;
        return text.trim().length >= 1;
      case "quote":
        return text.trim().length >= 10 && quoteAuthor.trim().length > 0;
      case "hidden-gem":
        return text.trim().length >= 50 && starRating > 0 && !!directoryEntry && (!!imageFile || galleryFiles.length > 0);
      case "cultural-take":
        return text.trim().length >= 100 && !!directoryEntry;
      case "food-review":
        return text.trim().length >= 50 && foodDishName.trim().length > 0 && foodTaste > 0 && foodValue > 0 && foodVibe > 0 && (!!imageFile || galleryFiles.length > 0);
      case "book-review":
        return !!bookEntry && !!bookStatus && bookOverallRating > 0 && text.trim().length >= 50 && bookRecommend !== null;
      case "creative-showcase":
        return galleryFiles.length > 0 || videoUrl.trim().length > 0;
      case "poll":
        return text.trim().length >= 10 && pollOptions.filter(o => o.trim()).length >= 2;
      case "itinerary":
        return itineraryStops.filter(s => s.name.trim()).length >= 2;
      case "event": {
        if (!eventTitle.trim() || !eventDate) return false;
        const d = new Date(eventDate);
        if (isNaN(d.getTime())) return false;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        return d >= today;
      }
      default:
        return false;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit()) return;
    setLoading(true);
    setError("");

    try {
      // Upload images
      let imageUrl: string | undefined;
      const galleryUrls: string[] = [];

      if (imageFile) {
        if (imageFile.size > 8 * 1024 * 1024) throw new Error("Image must be under 8 MB.");
        setUploading(true);
        imageUrl = await uploadImage(imageFile);
        setUploading(false);
      }

      for (const f of galleryFiles) {
        if (f.size > 8 * 1024 * 1024) throw new Error("Each image must be under 8 MB.");
        setUploading(true);
        galleryUrls.push(await uploadImage(f));
        setUploading(false);
      }

      // Quote goes to separate endpoint
      if (template === "quote") {
        const res = await fetch("/api/quotes/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: text.trim(),
            author: quoteAuthor.trim(),
            source: quoteSource.trim() || undefined,
            sharing_reason: quoteSharingReason.trim() || undefined,
            quote_type: quoteType || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to submit quote.");
        setSuccess("Quote submitted — it will appear after review.");
        resetForm();
        setTimeout(() => setSuccess(""), 4000);
        return;
      }

      // Build payload
      const payload: Record<string, any> = {
        text: text.trim(),
        imageUrl: imageUrl || (galleryUrls[0] ?? undefined),
        tag: template === "food-review" ? "Food" : (tag || undefined),
        region: detectRegion(user?.countryOfResidence) ?? undefined,
        authorTier: user?.tier ?? undefined,
        authorAvatar: user?.avatarUrl || undefined,
        template_type: template,
        // Always include all gallery images (not just for creative-showcase)
        gallery_images: galleryUrls.length > 0 ? galleryUrls : undefined,
        hub_id: hubId || undefined,
      };

      // Link preview (post only)
      if (template === "post" && linkPreview) {
        payload.linkUrl = linkPreview.url;
        payload.ogTitle = linkPreview.ogTitle;
        payload.ogDescription = linkPreview.ogDescription;
        payload.ogImage = linkPreview.ogImage;
      }

      // Template-specific fields
      if (directoryEntry) {
        payload.linked_directory_id = directoryEntry.id;
        payload.location_name = directoryEntry.title || "";
      }
      if (template === "hidden-gem") {
        payload.star_rating = starRating;
      }
      if (template === "food-review") {
        payload.food_dish_name = foodDishName;
        payload.star_rating = Math.round((foodTaste + foodValue + foodVibe) / 3);
        payload.food_rating_taste = foodTaste;
        payload.food_rating_value = foodValue;
        payload.food_rating_vibe = foodVibe;
      }
      if (template === "book-review") {
        payload.linked_directory_id = bookEntry?.id;
        payload.book_title = bookEntry?.title;
        payload.book_author = bookEntry?.about;
        payload.book_status = bookStatus;
        payload.book_overall_rating = bookOverallRating;
        payload.book_rating_writing = bookRatings.writing;
        payload.book_rating_story = bookRatings.story;
        payload.book_rating_characters = bookRatings.characters;
        payload.book_rating_pacing = bookRatings.pacing;
        payload.book_fav_quote = bookFavQuote.trim() || undefined;
        payload.book_recommend = bookRecommend;
        payload.book_genres = bookGenres.length > 0 ? bookGenres : undefined;
      }
      if (template === "poll") {
        payload.poll_options = pollOptions.filter(o => o.trim()).map(text => ({ text }));
        const expires = new Date();
        expires.setDate(expires.getDate() + parseInt(pollDuration));
        payload.poll_expires_at = expires.toISOString();
      }
      if (template === "itinerary") {
        payload.itinerary_stops = itineraryStops.filter(s => s.name.trim());
      }
      if (template === "creative-showcase" && videoUrl.trim()) {
        payload.video_url = videoUrl.trim();
      }
      if (template === "event") {
        payload.event_title = eventTitle.trim();
        payload.event_date = eventDate;
        payload.event_end_date = eventEndDate || undefined;
        payload.event_venue = eventLocation.trim() || undefined;
        payload.event_address = eventLocation.trim() || undefined;
        payload.event_city = eventCity.trim() || undefined;
        payload.event_admission = eventAdmission.trim() || undefined;
        payload.ticket_url = eventTicketUrl.trim() || undefined;
        payload.event_category = eventCategory || undefined;
        payload.organiser_directory_id = eventOrganiser?.id || undefined;
        if (isPro && eventRsvpEnabled) {
          payload.rsvp_enabled = true;
          payload.rsvp_capacity = parseInt(eventRsvpCapacity) || 0;
        }
      }

      const res = await fetch("/api/community/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post");

      const region = detectRegion(user?.countryOfResidence);
      onPosted?.({
        id: data.id,
        text: text.trim(),
        authorName: user?.name ?? user?.displayName ?? "Community Member",
        tag: payload.tag || null,
        imageUrl: galleryUrls.length > 0 ? null : (imageUrl ?? null),
        region,
        galleryImages: galleryUrls.length > 0 ? galleryUrls : undefined,
        templateType: template,
      });
      resetForm();
      setSuccess("Posted! Your update is now live in the feed.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
      setUploading(false);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return null;

  if (!loggedIn) {
    return (
      <div className="composer-card" style={{ padding: "0.9rem 1.25rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div className="composer-avatar" />
        <button onClick={() => window.dispatchEvent(new Event("open-auth-modal"))} className="composer-prompt-btn">
          What&apos;s happening in culture? Join the community to share.
        </button>
      </div>
    );
  }

  const initials = (user?.name ?? user?.displayName ?? "?")
    .split(" ").slice(0, 2).map((w: string) => w[0]).join("").toUpperCase();

  if (success) {
    return (
      <div className="composer-card" style={{ padding: "1rem 1.25rem" }}>
        <div className="composer-success-banner">
          {success}
        </div>
      </div>
    );
  }

  const placeholders: Record<TemplateType, string> = {
    post: "What's happening in culture?",
    quote: "The quote…",
    "hidden-gem": "Tell us about this gem — what makes it special?",
    "cultural-take": "Share your take…",
    "food-review": "How was the food?",
    "book-review": "What did you think? Who would love it?",
    "creative-showcase": "Caption (optional)",
    poll: "Ask a question…",
    itinerary: "Describe your route…",
    event: "Describe the event — what to expect, why it matters… (optional)",
  };

  return (
    <div className="composer-card">
      {/* Template selector */}
      <div className="composer-template-bar">
        <div className="composer-template-scroll">
          {visibleTemplates.map(t => {
            const gate = TEMPLATE_REP_GATE[t.slug];
            const locked = gate ? !meetsTemplateGate(t.slug) : false;
            const isQuote = t.slug === "quote";
            return (
              <span key={t.slug} className="composer-template-pill-wrap">
                <button
                  type="button"
                  className={`composer-template-pill${template === t.slug ? " composer-template-pill--active" : ""}${locked ? " composer-template-pill--locked" : ""}${isQuote ? " composer-template-pill--quote" : ""}`}
                  onClick={() => handleTemplateChange(t.slug)}
                >
                  <span className="composer-template-emoji">{t.emoji}</span>
                  <span className="composer-template-label">{t.label}</span>
                  {locked && <span className="composer-template-lock" aria-hidden>🔒</span>}
                </button>
                {locked && gate && (
                  <span className="composer-template-tooltip">{gate.tierLabel} or Pro required</span>
                )}
              </span>
            );
          })}
        </div>
      </div>
      {lockedTip && TEMPLATE_REP_GATE[lockedTip] && (
        <p className="composer-template-lock-tip">
          {TEMPLATE_REP_GATE[lockedTip]!.tierLabel} ({TEMPLATE_REP_GATE[lockedTip]!.minRep.toLocaleString()} rep) or Moveee Pro required to use the {TEMPLATES.find(t => t.slug === lockedTip)?.label} template.
        </p>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="composer-form-body">
        <div style={{ display: "flex", gap: "0.75rem" }}>
          {/* Avatar */}
          <div className={`composer-avatar${template === "quote" ? " composer-avatar--quote" : ""}`}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : initials}
          </div>

          <div className="composer-fields">
            {/* Directory search — for cultural-take (required), hidden-gem, food-review */}
            {(template === "cultural-take" || template === "hidden-gem" || template === "food-review") && (
              <DirectorySearch
                value={directoryEntry}
                onChange={setDirectoryEntry}
                typeFilter={template === "food-review" ? "restaurant" : undefined}
                placeholder={template === "cultural-take" ? "What are you writing about?" : template === "food-review" ? "Which restaurant or venue?" : "Search or add a location *"}
              />
            )}

            {/* Food dish name */}
            {template === "food-review" && (
              <input
                type="text"
                value={foodDishName}
                onChange={e => setFoodDishName(e.target.value)}
                placeholder="Dish or item name *"
                className="composer-input"
              />
            )}

            {/* Book search + status */}
            {template === "book-review" && (
              <>
                <DirectorySearch
                  value={bookEntry}
                  onChange={setBookEntry}
                  typeFilter="book"
                  aboutFieldLabel="Author"
                  externalSource="google_books"
                  placeholder="Search for a book *"
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  {BOOK_STATUSES.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setBookStatus(s)}
                      className={`composer-template-pill${bookStatus === s ? " composer-template-pill--active" : ""}`}
                      style={{ flex: 1, justifyContent: "center" }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Event fields */}
            {template === "event" && (
              <>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={e => setEventTitle(e.target.value.slice(0, 150))}
                  placeholder="Event name *"
                  className="composer-input"
                />
                <div className="composer-event-dates">
                  <div>
                    <label className="composer-field-label">Start date & time *</label>
                    <input
                      type="datetime-local"
                      value={eventDate}
                      onChange={e => setEventDate(e.target.value)}
                      className="composer-input"
                    />
                  </div>
                  <div>
                    <label className="composer-field-label">End date & time</label>
                    <input
                      type="datetime-local"
                      value={eventEndDate}
                      onChange={e => setEventEndDate(e.target.value)}
                      className="composer-input"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value.slice(0, 200))}
                    placeholder="Venue / address"
                    className="composer-input"
                    style={{ flex: 2 }}
                  />
                  <input
                    type="text"
                    value={eventCity}
                    onChange={e => setEventCity(e.target.value.slice(0, 80))}
                    placeholder="City"
                    className="composer-input"
                    style={{ flex: 1 }}
                  />
                </div>
                <input
                  type="text"
                  value={eventAdmission}
                  onChange={e => setEventAdmission(e.target.value.slice(0, 80))}
                  placeholder="Admission (e.g. Free, £10)"
                  className="composer-input"
                />
                <input
                  type="url"
                  value={eventTicketUrl}
                  onChange={e => setEventTicketUrl(e.target.value)}
                  placeholder="Ticket / event link"
                  className="composer-input"
                />
                <select
                  value={eventCategory}
                  onChange={e => setEventCategory(e.target.value)}
                  className="composer-input"
                >
                  <option value="">Category (optional)</option>
                  <option value="live-music">Music</option>
                  <option value="independent-film">Film</option>
                  <option value="visual-art">Visual Arts</option>
                  <option value="fashion-streetwear">Fashion</option>
                  <option value="food-drink">Food &amp; Drink</option>
                  <option value="literature">Literature</option>
                  <option value="visual-design">Design</option>
                  <option value="event-performance">Performance</option>
                  <option value="event-community">Community</option>
                  <option value="tech-culture">Tech</option>
                </select>
                <label className="composer-field-label" style={{ marginTop: "0.25rem" }}>Organiser (optional)</label>
                <DirectorySearch
                  value={eventOrganiser}
                  onChange={setEventOrganiser}
                  placeholder="Search directory for organiser…"
                />

                {isPro ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.85rem", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={eventRsvpEnabled}
                        onChange={e => setEventRsvpEnabled(e.target.checked)}
                      />
                      Enable RSVP for this event
                    </label>
                    {eventRsvpEnabled && (
                      <input
                        type="number"
                        min={0}
                        value={eventRsvpCapacity}
                        onChange={e => setEventRsvpCapacity(e.target.value)}
                        placeholder="Capacity (0 = unlimited)"
                        className="composer-input"
                      />
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: "0.78rem", color: "var(--mute)", marginTop: "0.25rem" }}>
                    Moveee Pro members can enable RSVP for their events.
                  </p>
                )}
              </>
            )}

            {/* Template guide */}
            <div className={`composer-guide${text.length > 0 ? " composer-guide--hidden" : ""}`}>
              <p className="composer-guide-desc">{TEMPLATE_GUIDES[template].desc}</p>
              <div className="composer-guide-chips">
                {TEMPLATE_GUIDES[template].chips.map(chip => (
                  <button
                    key={chip}
                    type="button"
                    className="composer-guide-chip"
                    onClick={() => { setText(chip + " "); setTimeout(() => textareaRef.current?.focus(), 0); }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Main text area */}
            {template === "quote" ? (
              <div className="composer-quote-box">
                <span className="composer-quote-glyph" aria-hidden>&ldquo;</span>
                <div className="composer-textarea-wrap">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    placeholder={placeholders[template]}
                    rows={4}
                    className="composer-textarea composer-textarea--italic"
                  />
                  <span className={`composer-char-count${charRemaining < 0 ? " composer-char-count--error" : charRemaining < 30 ? " composer-char-count--warn" : ""}`}>
                    {charCount}/{maxChars}
                  </span>
                </div>
              </div>
            ) : (
              <div className="composer-textarea-wrap">
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={handleTextChange}
                  placeholder={placeholders[template]}
                  rows={template === "cultural-take" ? 6 : template === "creative-showcase" ? 2 : 4}
                  className="composer-textarea"
                />
                <span className={`composer-char-count${charRemaining < 0 ? " composer-char-count--error" : charRemaining < 30 ? " composer-char-count--warn" : ""}`}>
                  {charCount}/{maxChars}
                </span>
              </div>
            )}

            {/* Quote author/source */}
            {template === "quote" && (
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <input
                  type="text" value={quoteAuthor} onChange={e => setQuoteAuthor(e.target.value.slice(0, 100))}
                  placeholder="Author *" required className="composer-input" style={{ flex: 1, minWidth: "120px" }}
                />
                <input
                  type="text" value={quoteSource} onChange={e => setQuoteSource(e.target.value.slice(0, 150))}
                  placeholder="Source (optional)" className="composer-input" style={{ flex: 1, minWidth: "120px" }}
                />
              </div>
            )}

            {/* Quote type + sharing reason */}
            {template === "quote" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <select
                  value={quoteType}
                  onChange={e => setQuoteType(e.target.value)}
                  className={`composer-tag-select${quoteType ? " composer-tag-select--selected" : ""}`}
                >
                  <option value="">Quote type (optional)</option>
                  {["Person", "Book", "Film", "Speech", "Song"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <textarea
                  value={quoteSharingReason}
                  onChange={e => setQuoteSharingReason(e.target.value.slice(0, 280))}
                  placeholder="Why are you sharing this? (optional)"
                  rows={2}
                  className="composer-textarea"
                />
              </div>
            )}

            {/* Star rating — hidden-gem */}
            {template === "hidden-gem" && (
              <StarRating value={starRating} onChange={setStarRating} label="Rating" />
            )}

            {/* Book review — overall + breakdown ratings, favourite quote, recommend, genres */}
            {template === "book-review" && (
              <>
                <StarRating value={bookOverallRating} onChange={setBookOverallRating} label="Overall rating" />
                <MultiRating
                  ratings={[
                    { label: "Writing", value: bookRatings.writing },
                    { label: "Story", value: bookRatings.story },
                    { label: "Characters", value: bookRatings.characters },
                    { label: "Pacing", value: bookRatings.pacing },
                  ]}
                  onChange={(label, v) => setBookRatings(prev => ({ ...prev, [label.toLowerCase()]: v }))}
                />
                <textarea
                  value={bookFavQuote}
                  onChange={e => setBookFavQuote(e.target.value.slice(0, 300))}
                  placeholder="Favourite quote (optional)"
                  rows={2}
                  className="composer-textarea composer-textarea--italic"
                />
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => setBookRecommend(true)}
                    className={`composer-template-pill${bookRecommend === true ? " composer-template-pill--active" : ""}`}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    👍 Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookRecommend(false)}
                    className={`composer-template-pill${bookRecommend === false ? " composer-template-pill--active" : ""}`}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    👎 No
                  </button>
                </div>
                <div className="composer-guide-chips">
                  {BOOK_GENRES.map(g => {
                    const active = bookGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setBookGenres(prev => active ? prev.filter(x => x !== g) : [...prev, g])}
                        className="composer-guide-chip"
                        style={active ? { background: "#c5491f", color: "#fff", borderColor: "#c5491f" } : undefined}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Multi-rating — food-review */}
            {template === "food-review" && (
              <MultiRating
                ratings={[
                  { label: "Taste", value: foodTaste },
                  { label: "Value", value: foodValue },
                  { label: "Vibe", value: foodVibe },
                ]}
                onChange={(label, v) => {
                  if (label === "Taste") setFoodTaste(v);
                  if (label === "Value") setFoodValue(v);
                  if (label === "Vibe") setFoodVibe(v);
                }}
              />
            )}

            {/* Poll builder */}
            {template === "poll" && (
              <PollBuilder
                options={pollOptions}
                onChange={setPollOptions}
                duration={pollDuration}
                onDurationChange={setPollDuration}
              />
            )}

            {/* Itinerary builder */}
            {template === "itinerary" && (
              <ItineraryBuilder stops={itineraryStops} onChange={setItineraryStops} />
            )}

            {/* Link blocked warning — Citizens can't post links (server-side gate in spam-protection.ts) */}
            {template === "post" && !isPro && URL_RE.test(text) && (
              <div className="composer-link-warning">
                <span>Links are a Moveee Pro feature — this post will be rejected with a link in it.</span>
                <a href="/register?upgrade=patron">Upgrade →</a>
              </div>
            )}

            {/* Link preview (post only) */}
            {template === "post" && isPro && !imagePreview && linkPreview && (
              previewLoading ? (
                <p className="composer-link-loading">Fetching link preview…</p>
              ) : (
                <SourcePreviewCard
                  goUrl={linkPreview.url}
                  sourceName={(() => { try { return new URL(linkPreview.url).hostname.replace(/^www\./, ""); } catch { return linkPreview.url; } })()}
                  sourceUrl={linkPreview.url}
                  ogTitle={linkPreview.ogTitle}
                  ogDescription={linkPreview.ogDescription}
                  ogImage={linkPreview.ogImage}
                />
              )
            )}

            {/* Photo grid — single image (event) or gallery (post/hidden-gem/food-review/creative-showcase/itinerary) */}
            {template === "event" ? (
              imagePreview && (
                <div className="composer-photo-row">
                  <div className="composer-photo-thumb">
                    <img src={imagePreview} alt="Preview" />
                    <button type="button" onClick={removeImage} aria-label="Remove image" className="composer-photo-remove">✕</button>
                  </div>
                </div>
              )
            ) : template !== "poll" && template !== "quote" && template !== "cultural-take" && template !== "book-review" && (
              <div className="composer-photo-row">
                {galleryPreviews.map((p, i) => (
                  <div key={i} className="composer-photo-thumb">
                    <img src={p} alt="" />
                    <button type="button" onClick={() => removeGalleryImage(i)} aria-label="Remove image" className="composer-photo-remove">✕</button>
                  </div>
                ))}
                {galleryFiles.length < 4 && (
                  <button type="button" className="composer-photo-add" onClick={() => fileInputRef.current?.click()} aria-label="Add photo">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                )}
                <p className="composer-photo-hint">Up to 4 photos</p>
              </div>
            )}

            {/* Video URL — creative-showcase */}
            {template === "creative-showcase" && (
              <input
                type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
                placeholder="Video URL (YouTube, Vimeo)" className="composer-input"
              />
            )}

            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={template !== "event" && template !== "poll" && template !== "quote" && template !== "cultural-take" && template !== "book-review" ? handleGalleryChange : handleFileChange}
              multiple={template !== "event" && template !== "poll" && template !== "quote" && template !== "cultural-take" && template !== "book-review"}
              style={{ display: "none" }}
            />


            {/* Action bar */}
            <div className="composer-action-bar">
              {/* Tag selector (not for quote, food-review auto-sets Food, event has its own categories,
                  hub-scoped posts skip it — Hub membership already signals topic, see docs/hubs-plan.md §1.4) */}
              {!hubId && template !== "quote" && template !== "food-review" && template !== "event" && (
                lockedTag ? (
                  <span className="composer-tag-select composer-tag-select--selected" style={{ cursor: "default" }}>
                    {lockedTag}
                  </span>
                ) : (
                  <select
                    value={tag}
                    onChange={e => handleTagChange(e.target.value as Tag | "")}
                    className={`composer-tag-select${tag ? " composer-tag-select--selected" : ""}`}
                  >
                    <option value="">Section</option>
                    {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )
              )}

              {/* Image button — only for event (other image templates use the inline add-tile in the photo row) */}
              {template === "event" && (
                <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach image"
                className={`composer-image-btn${(imageFile || galleryFiles.length > 0) ? " composer-image-btn--active" : ""}`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                {galleryFiles.length > 0 ? `${galleryFiles.length}/4 image${galleryFiles.length > 1 ? "s" : ""}` : imageFile ? "1 image" : "Image"}
              </button>
              )}

              <div className="composer-spacer" />
              <button
                type="submit"
                disabled={!canSubmit()}
                className="composer-submit"
              >
                {uploading ? "Uploading…" : loading ? "Posting…" : "Post"}
              </button>
            </div>
            {error && <p className="composer-error">{error}</p>}
          </div>
        </div>
      </form>
    </div>
  );
}
