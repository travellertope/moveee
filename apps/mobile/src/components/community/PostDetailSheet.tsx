import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNav } from "../../hooks/useNav";
import BottomSheet from "../ui/BottomSheet";
import SheetErrorState from "../ui/SheetErrorState";
import ReportPostSheet from "./ReportPostSheet";
import ImageLightbox from "../ui/ImageLightbox";
import HashtagText from "./HashtagText";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { useComments } from "../../features/community/useComments";
import { api, MOBILE_API } from "../../api/client";
import type { ColorPalette } from "../../theme";
import { radius, fonts } from "../../theme";
import type { FeedItem, PollOption, ItineraryStop } from "../../types";
import QuoteShareCard from "../quotes/QuoteShareCard";
import { useScoreCardShare } from "../../features/games/useScoreCardShare";

const SCREEN_W = Dimensions.get("window").width;

// ── GalleryGrid ─────────────────────────────────────────────────────────────────
// 1 image: full width tall. 2 images: side by side. 3 images: 1 main + 2 small.
// 4+ images: 2×2 grid, last cell shows "+N more" overlay.
function GalleryGrid({ images }: { images: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const count = images.length;
  if (count === 0) return null;

  const gap = 3;
  const w = SCREEN_W - 32; // 16px padding each side

  const cell = (src: string, idx: number, style: any, overlay?: React.ReactNode) => (
    <TouchableOpacity
      key={idx}
      style={[{ overflow: "hidden", borderRadius: 6 }, style]}
      activeOpacity={0.88}
      onPress={() => setLightboxIdx(idx)}
    >
      <Image source={{ uri: src }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {overlay}
    </TouchableOpacity>
  );

  let grid: React.ReactNode;
  if (count === 1) {
    grid = cell(images[0], 0, { width: w, height: 260 });
  } else if (count === 2) {
    const hw = (w - gap) / 2;
    grid = (
      <View style={{ flexDirection: "row", gap }}>
        {cell(images[0], 0, { width: hw, height: 200 })}
        {cell(images[1], 1, { width: hw, height: 200 })}
      </View>
    );
  } else if (count === 3) {
    const hw = (w - gap) / 2;
    const sh = (200 - gap) / 2;
    grid = (
      <View style={{ flexDirection: "row", gap }}>
        {cell(images[0], 0, { width: hw, height: 200 })}
        <View style={{ width: hw, gap }}>
          {cell(images[1], 1, { flex: 1, height: sh })}
          {cell(images[2], 2, { flex: 1, height: sh })}
        </View>
      </View>
    );
  } else {
    // 4+ → 2×2 grid, last cell has +N overlay
    const hw = (w - gap) / 2;
    const extra = count - 4;
    const rows: React.ReactNode[][] = [
      [images[0], images[1]],
      [images[2], images[3]],
    ];
    grid = (
      <View style={{ gap }}>
        {rows.map((row, ri) => (
          <View key={ri} style={{ flexDirection: "row", gap }}>
            {row.map((src, ci) => {
              const idx = ri * 2 + ci;
              const isLast = ri === 1 && ci === 1 && extra > 0;
              return cell(src, idx, { width: hw, height: 160 },
                isLast ? (
                  <View style={{
                    ...StyleSheet.absoluteFillObject,
                    backgroundColor: "rgba(10,8,5,0.58)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: "#fff", fontFamily: "JetBrainsMono_700Bold", fontSize: 22 }}>+{extra + 1}</Text>
                  </View>
                ) : undefined,
              );
            })}
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={{ marginBottom: 12 }}>
      {grid}
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={images}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </View>
  );
}

// ── TappableHero ───────────────────────────────────────────────────────────────
function TappableHero({ uri, caption }: { uri: string; caption?: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: caption ? 4 : 12 }}>
      <TouchableOpacity activeOpacity={0.88} onPress={() => setOpen(true)}>
        <Image source={{ uri }} style={{ width: "100%", height: 220, borderRadius: 6 }} resizeMode="cover" />
      </TouchableOpacity>
      <ImageLightbox visible={open} images={[uri]} onClose={() => setOpen(false)} />
    </View>
  );
}

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

// ── Template badge config ───────────────────────────────────────────────────────

const TEMPLATE_BADGES: Record<string, { label: string; emoji: string; bg: string; color: string }> = {
  "post":              { label: "POST",             emoji: "✏️", bg: "rgba(100,100,100,0.08)", color: "#555" },
  "hidden-gem":        { label: "HIDDEN GEM",       emoji: "💎", bg: "rgba(98,0,238,0.08)",   color: "#6200EE" },
  "cultural-take":     { label: "CULTURAL TAKE",    emoji: "🎯", bg: "rgba(183,28,28,0.08)",  color: "#B71C1C" },
  "food-review":       { label: "FOOD REVIEW",      emoji: "🍽️", bg: "rgba(197,73,31,0.08)",  color: "#C5491F" },
  "creative-showcase": { label: "CREATIVE SHOWCASE",emoji: "🎨", bg: "rgba(25,118,210,0.08)", color: "#1976D2" },
  "poll":              { label: "POLL",              emoji: "📊", bg: "rgba(255,143,0,0.08)",  color: "#E65100" },
  "itinerary":         { label: "ITINERARY",        emoji: "🗺️", bg: "rgba(46,125,50,0.08)",  color: "#2E7D32" },
  "event":             { label: "EVENT",             emoji: "📅", bg: "rgba(0,137,123,0.08)",  color: "#00695C" },
  "quote":             { label: "QUOTE",             emoji: "❝",  bg: "rgba(185,140,55,0.10)", color: "#92400E" },
  "book-review":       { label: "BOOK REVIEW",       emoji: "📚", bg: "rgba(120,53,15,0.08)",  color: "#78350F" },
};

// ── Helpers ─────────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return `${Math.floor(d / 7)}w ago`;
}

function StarRow({ rating, c }: { rating: number; c: ColorPalette }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Text key={i} style={{ fontSize: 14, color: i <= rating ? c.gold : c.ghost }}>
          {i <= rating ? "★" : "☆"}
        </Text>
      ))}
    </View>
  );
}

// ── Author row (shared across all templates) ────────────────────────────────────

function AuthorRow({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.authorRow}>
      <Image
        source={{ uri: item.communityAuthorAvatar || PLACEHOLDER_AVATAR }}
        style={styles.authorAvatar}
      />
      <View style={styles.authorInfo}>
        <Text style={styles.authorName}>{item.communityAuthor ?? "Community Member"}</Text>
        {item.communityAuthorUsername ? (
          <Text style={styles.authorHandle}>@{item.communityAuthorUsername}</Text>
        ) : null}
      </View>
      <TouchableOpacity style={styles.followBtn}>
        <Text style={styles.followBtnText}>Follow</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Reactions bar (shared) ──────────────────────────────────────────────────────

function ReactionsRow({
  item,
  c,
  styles,
  onComment,
  onReport,
}: {
  item: FeedItem;
  c: ColorPalette;
  styles: ReturnType<typeof createStyles>;
  onComment?: () => void;
  onReport?: () => void;
}) {
  const [loved, setLoved] = useState(false);
  const [fired, setFired] = useState(false);
  const [clapped, setClapped] = useState(false);
  const love = (item.reactions?.love ?? 0) + (loved ? 1 : 0);
  const fire = (item.reactions?.fire ?? 0) + (fired ? 1 : 0);
  const clap = (item.reactions?.clap ?? 0) + (clapped ? 1 : 0);

  const react = async (type: "love" | "fire" | "clap") => {
    if (type === "love") setLoved((v) => !v);
    if (type === "fire") setFired((v) => !v);
    if (type === "clap") setClapped((v) => !v);
    if (item.wpId) {
      try { await api.post(`${MOBILE_API}/community/react`, { post_id: item.wpId, type }); } catch {}
    }
  };

  return (
    <>
      <View style={styles.divider} />
      <View style={styles.reactionsRow}>
        <TouchableOpacity style={styles.reactionBtn} onPress={() => react("love")} activeOpacity={0.7}>
          <Ionicons name={loved ? "heart" : "heart-outline"} size={18} color={loved ? "#E53E3E" : c.mute} />
          <Text style={[styles.reactionCount, loved && { color: "#E53E3E" }]}>{love}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionBtn} onPress={() => react("fire")} activeOpacity={0.7}>
          <Ionicons name={fired ? "flame" : "flame-outline"} size={18} color={fired ? "#F97316" : c.mute} />
          <Text style={[styles.reactionCount, fired && { color: "#F97316" }]}>{fire}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionBtn} onPress={() => react("clap")} activeOpacity={0.7}>
          <Ionicons name={clapped ? "hand-left" : "hand-left-outline"} size={18} color={clapped ? "#B38238" : c.mute} />
          <Text style={[styles.reactionCount, clapped && { color: "#B38238" }]}>{clap}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reactionBtn} onPress={onComment} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={18} color={c.mute} />
          <Text style={styles.reactionCount}>{item.commentCount ?? 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.reactionBtn, { marginLeft: "auto" as any }]}
          onPress={onReport}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="flag-outline" size={18} color={c.ghost} />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />
    </>
  );
}

// ── Comments section (shared) ───────────────────────────────────────────────────

function CommentsSection({ postId, c, styles }: { postId: string; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const { comments, loading, addComment } = useComments(postId);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const user = useAuthStore((s) => s.user);
  const [showAll, setShowAll] = useState(false);

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try { await addComment(text.trim()); setText(""); } finally { setSubmitting(false); }
  };

  const displayed = showAll ? comments : comments.slice(0, 2);

  return (
    <View>
      <View style={styles.commentHeader}>
        <Text style={styles.commentHeaderText}>Comments ({comments.length})</Text>
        <TouchableOpacity>
          <Text style={styles.addCommentBtn}>Add comment</Text>
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color={c.gold} style={{ marginVertical: 12 }} />}

      {displayed.map((cm) => (
        <View key={cm.id} style={styles.commentRow}>
          <Image source={{ uri: cm.author.avatarUrl || PLACEHOLDER_AVATAR }} style={styles.commentAvatar} />
          <View style={styles.commentBody}>
            <View style={styles.commentMeta}>
              <Text style={styles.commentAuthor}>{cm.author.name}</Text>
              <Text style={styles.commentTime}>{timeAgo(cm.publishedAt)}</Text>
            </View>
            <Text style={styles.commentContent}>{cm.content}</Text>
          </View>
        </View>
      ))}

      {comments.length > 2 && !showAll && (
        <TouchableOpacity onPress={() => setShowAll(true)}>
          <Text style={styles.viewAllComments}>View all {comments.length} comments</Text>
        </TouchableOpacity>
      )}

      {/* Compose row */}
      <View style={styles.composeRow}>
        <Image source={{ uri: user?.avatarUrl || PLACEHOLDER_AVATAR }} style={styles.composeAvatar} />
        <TextInput
          style={[styles.composeInput, { color: c.ink }]}
          placeholder="Add a comment…"
          placeholderTextColor={c.ghost}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()}>
          {submitting
            ? <ActivityIndicator size="small" color={c.gold} />
            : <Ionicons name="send" size={18} color={text.trim() ? c.gold : c.ghost} />
          }
        </TouchableOpacity>
      </View>

    </View>
  );
}

// ── Template bodies ─────────────────────────────────────────────────────────────

function TemplatePost({ item, c, styles, onMentionPress }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles>; onMentionPress?: (username: string) => void }) {
  return (
    <>
      {item.title ? <HashtagText text={item.title} style={styles.bodyText} onMentionPress={onMentionPress} /> : null}
      {item.image ? <TappableHero uri={item.image} /> : null}
    </>
  );
}

function TemplateHiddenGem({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const images = item.galleryImages ?? [];
  return (
    <>
      {item.placeName ? <Text style={styles.serifTitle}>{item.placeName}</Text> : null}
      {(item.placeLocation ?? item.locationName) ? (
        <View style={styles.locationRow}>
          <Text style={{ fontSize: 14 }}>📍</Text>
          <Text style={styles.locationText}>{item.placeLocation ?? item.locationName}</Text>
        </View>
      ) : null}
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}
      {item.linkedDirectoryId ? (
        <View style={styles.directoryChip}>
          <Ionicons name="grid-outline" size={12} color={c.gold} />
          <Text style={styles.directoryChipText}>View in Directory →</Text>
        </View>
      ) : null}
      {(item.priceRange || item.openingHours) ? (
        <View style={[styles.locationRow, { marginBottom: 8 }]}>
          {item.priceRange ? (
            <Text style={{ fontSize: 13, color: c.gold, fontFamily: fonts.mono, fontWeight: "700" }}>{item.priceRange}</Text>
          ) : null}
          {item.priceRange && item.openingHours ? (
            <Text style={{ fontSize: 13, color: c.ghost, marginHorizontal: 6 }}>·</Text>
          ) : null}
          {item.openingHours ? (
            <Text style={{ fontSize: 13, color: c.mute }}>{item.openingHours}</Text>
          ) : null}
        </View>
      ) : null}
      {images.length > 0
        ? <GalleryGrid images={images} />
        : item.image ? <TappableHero uri={item.image} /> : null}
    </>
  );
}

function TemplateCulturalTake({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  return (
    <>
      <View style={styles.takeHeadlineBlock}>
        <Text style={styles.takeHeadline}>{item.culturalTakeHeadline ?? item.title}</Text>
      </View>
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}
      <TouchableOpacity style={styles.agreeChip}>
        <Text style={styles.agreeChipText}>Do you agree? →</Text>
      </TouchableOpacity>
      {item.communityTag ? <Text style={styles.hashtags}>{item.communityTag}</Text> : null}
      {item.image ? <TappableHero uri={item.image} /> : null}
    </>
  );
}

function TemplateFoodReview({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const taste = item.foodRatingTaste ?? 0;
  const value = item.foodRatingValue ?? 0;
  const vibe = item.foodRatingVibe ?? 0;
  const overall = taste + value + vibe > 0 ? ((taste + value + vibe) / 3).toFixed(1) : null;
  const images = item.galleryImages ?? [];

  return (
    <>
      <Text style={styles.serifTitle}>{item.foodDishName ?? item.title}</Text>
      {item.linkedDirectoryId ? (
        <View style={styles.locationRow}>
          <Ionicons name="grid-outline" size={12} color={c.gold} />
          <Text style={styles.directoryChipText}>View in Directory →</Text>
        </View>
      ) : null}
      <View style={styles.foodMeta}>
        {item.locationName ? (
          <View style={styles.locationRow}>
            <Text style={{ fontSize: 14 }}>📍</Text>
            <Text style={styles.locationText}>{item.locationName}</Text>
          </View>
        ) : null}
        {item.priceRange ? (
          <View style={styles.locationRow}>
            <Text style={[styles.locationText, { color: c.gold, fontFamily: fonts.mono, fontWeight: "700" }]}>{item.priceRange}</Text>
          </View>
        ) : null}
      </View>
      {/* Ratings block */}
      <View style={styles.ratingsBlock}>
        <Text style={styles.ratingsLabel}>Ratings</Text>
        {[{ label: "Taste", val: taste }, { label: "Value", val: value }, { label: "Vibe", val: vibe }].map((row) => (
          <View key={row.label} style={styles.ratingRow}>
            <Text style={styles.ratingLabel}>{row.label}</Text>
            <StarRow rating={row.val} c={c} />
            <Text style={styles.ratingScore}>{row.val.toFixed(1)}</Text>
          </View>
        ))}
        {overall ? (
          <View style={styles.overallRow}>
            <Text style={styles.overallScore}>{overall}</Text>
            <Text style={styles.overallDenom}>/ 5.0</Text>
          </View>
        ) : null}
      </View>
      {images.length > 0
        ? <GalleryGrid images={images} />
        : item.image ? (
          <>
            <TappableHero uri={item.image} caption={item.foodDishName} />
            {item.foodDishName ? <Text style={styles.dishCaption}>{item.foodDishName}</Text> : null}
          </>
        ) : null}
      {item.cuisineTag ? (
        <View style={[styles.tagRow, { marginTop: 8 }]}>
          <View style={[styles.tag, { borderColor: c.gold }]}>
            <Text style={[styles.tagText, { color: c.gold }]}>{item.cuisineTag}</Text>
          </View>
        </View>
      ) : null}
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}
    </>
  );
}

function TemplateCreativeShowcase({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const images = item.galleryImages ?? [];
  return (
    <>
      <Text style={styles.serifTitle}>{item.showcaseTitle ?? item.title}</Text>
      {item.showcaseMedium ? (
        <View style={[styles.tag, { alignSelf: "flex-start", marginBottom: 10 }]}>
          <Text style={styles.tagText}>{item.showcaseMedium}</Text>
        </View>
      ) : null}
      {images.length > 0
        ? <GalleryGrid images={images} />
        : item.image ? <TappableHero uri={item.image} /> : null
      }
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}
      {item.showcaseCollaborator ? (
        <View style={[styles.tagRow, { backgroundColor: c.paperWarm, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, alignItems: "center" }]}>
          <Text style={{ fontSize: 14 }}>🤝</Text>
          <Text style={{ fontSize: 13, color: c.inkSoft, flex: 1, marginLeft: 6 }}>Collaboration with {item.showcaseCollaborator}</Text>
          <Text style={{ fontSize: 13, color: c.gold }}>View profile →</Text>
        </View>
      ) : null}
    </>
  );
}

function TemplatePoll({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const [voted, setVoted] = useState<number | null>(null);
  const options = item.pollOptions ?? [];
  const totalVotes = options.reduce((s, o) => s + o.votes, 0);
  const maxVotes = Math.max(...options.map((o) => o.votes), 1);

  const vote = (i: number) => {
    if (voted !== null) return;
    setVoted(i);
    if (item.wpId) {
      api.post(`${MOBILE_API}/community/poll-vote`, { post_id: item.wpId, option_index: i }).catch(() => {});
    }
  };

  return (
    <>
      <Text style={styles.serifTitle}>{item.title}</Text>
      <View style={styles.pollOptions}>
        {options.map((opt, i) => {
          const pct = totalVotes > 0 ? opt.votes / totalVotes : 0;
          const isLeader = opt.votes === maxVotes && opt.votes > 0;
          const isVoted = voted === i;
          return (
            <TouchableOpacity
              key={i}
              onPress={() => vote(i)}
              style={[styles.pollOption, isLeader && styles.pollOptionLeader]}
              activeOpacity={0.8}
            >
              <View style={[styles.pollFill, { width: `${Math.round(pct * 100)}%` as any }]} />
              <Text style={styles.pollOptionText}>
                {isLeader ? "👑 " : ""}{opt.text}
              </Text>
              <Text style={styles.pollPct}>{Math.round(pct * 100)}%</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.pollMeta}>
        <Text style={styles.pollMetaText}>
          {totalVotes} votes{item.pollExpiresAt ? ` · Closes ${new Date(item.pollExpiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </Text>
        {voted !== null && (
          <Text style={[styles.pollMetaText, { color: c.gold }]}>
            You voted: {options[voted]?.text} ✓
          </Text>
        )}
      </View>
      {item.pollDescription ? <Text style={styles.bodyText}>{item.pollDescription}</Text> : null}
    </>
  );
}

function TemplateItinerary({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const stops = item.itineraryStops ?? [];
  const [expanded, setExpanded] = useState(false);
  const displayed = expanded ? stops : stops.slice(0, 4);
  const images = item.galleryImages ?? [];

  return (
    <>
      <Text style={styles.serifTitle}>{item.itineraryTitle ?? item.title}</Text>
      <View style={styles.itinMeta}>
        <Text style={styles.itinMetaText}>🗂 {stops.length} stops</Text>
        {item.itineraryDuration ? <Text style={styles.itinMetaText}>⏱ {item.itineraryDuration}</Text> : null}
        {(item.itineraryCity ?? item.locationName) ? <Text style={styles.itinMetaText}>📍 {item.itineraryCity ?? item.locationName}</Text> : null}
        {item.itineraryBudget ? <Text style={styles.itinMetaText}>💰 {item.itineraryBudget}</Text> : null}
      </View>
      <View style={styles.routeCard}>
        <Text style={styles.routeCardLabel}>The Route</Text>
        {displayed.map((stop, i) => (
          <View key={i} style={styles.stopRow}>
            {i < displayed.length - 1 && <View style={styles.stopConnector} />}
            <View style={styles.stopNumber}>
              <Text style={styles.stopNumberText}>{i + 1}</Text>
            </View>
            <View style={styles.stopContent}>
              <Text style={styles.stopName}>{stop.name}</Text>
              {stop.note ? <Text style={styles.stopNote}>{stop.note}</Text> : null}
            </View>
          </View>
        ))}
        {stops.length > 4 && !expanded && (
          <TouchableOpacity onPress={() => setExpanded(true)} style={styles.expandStops}>
            <Text style={styles.expandStopsText}>{stops.length - 4} more stops ↓</Text>
          </TouchableOpacity>
        )}
      </View>
      {images.length > 0 ? <GalleryGrid images={images} /> : null}
      {item.communityTag ? <Text style={styles.hashtags}>{item.communityTag}</Text> : null}
    </>
  );
}

function TemplateEvent({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  return (
    <>
      <Text style={[styles.serifTitle, { fontSize: 22 }]}>{item.title}</Text>
      {(item.galleryImages && item.galleryImages.length > 0)
        ? <GalleryGrid images={item.galleryImages} />
        : item.image ? <Image source={{ uri: item.image }} style={styles.heroImage} resizeMode="cover" /> : null}
      <View style={styles.eventMeta}>
        {item.eventDate ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>📅</Text>
            <Text style={styles.eventMetaText}>{item.eventDate}{item.endDate ? ` – ${item.endDate}` : ""}</Text>
          </View>
        ) : null}
        {item.location ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>📍</Text>
            <Text style={styles.eventMetaText}>{item.location}{item.venueAddress ? ` · ${item.venueAddress}` : ""}</Text>
          </View>
        ) : null}
        {item.city ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>🏙️</Text>
            <Text style={styles.eventMetaText}>{item.city}</Text>
          </View>
        ) : null}
        {item.admission ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>💰</Text>
            <Text style={styles.eventMetaText}>{item.admission}</Text>
          </View>
        ) : null}
        {item.eventCategory ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>🏷️</Text>
            <View style={styles.eventCategoryChip}>
              <Text style={styles.eventCategoryText}>{item.eventCategory}</Text>
            </View>
          </View>
        ) : null}
        {item.organiserName ? (
          <View style={styles.eventMetaRow}>
            <Text style={styles.eventMetaIcon}>👤</Text>
            <Text style={styles.organiserLink}>{item.organiserName}</Text>
          </View>
        ) : null}
      </View>
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}
      <View style={styles.proPerk}>
        <Text style={[styles.proPerkText, { color: c.gold, marginRight: 6 }]}>★</Text>
        <Text style={styles.proPerkText}>Pro Members: Early entry + priority access.</Text>
      </View>
      <TouchableOpacity style={styles.rsvpBtn}>
        <Text style={styles.rsvpBtnText}>RSVP Now →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={{ alignItems: "center", marginTop: 8 }}>
        <Text style={styles.calendarLink}>Add to calendar</Text>
      </TouchableOpacity>
    </>
  );
}

function TemplateQuote({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const sharerFirstName = item.communityAuthor?.split(" ")[0] ?? "Their";
  const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : "https://connect.themoveee.com/quotes";
  const { cardRef, share: shareCard } = useScoreCardShare();

  const handleShare = async () => {
    await shareCard();
  };
  return (
    <>
      <View style={{ position: "absolute", top: -9999, left: -9999 }}>
        <QuoteShareCard
          ref={cardRef}
          quoteText={item.title}
          quoteAuthor={item.quoteAuthor}
          quoteSource={item.quoteSource}
          qrValue={shareUrl}
        />
      </View>
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteMark}>"</Text>
        <Text style={styles.quoteText}>{item.title}</Text>
        <Text style={[styles.quoteMark, { textAlign: "right" as const, fontSize: 36, lineHeight: 28 }]}>"</Text>
      </View>
      {(item.quoteAuthor || item.quoteSource) ? (
        <View style={styles.quoteAttrib}>
          {item.quoteAuthor ? (
            <Text style={styles.quoteAuthor}>{item.quoteAuthor}</Text>
          ) : null}
          {item.quoteSource ? (
            <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 4, marginTop: 4 }}>
              <Ionicons name="mic-outline" size={12} color={c.ghost} />
              <Text style={styles.quoteSource}>{item.quoteSource}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {item.quoteSharingReason ? (
        <View style={styles.posterNote}>
          <Text style={styles.posterNoteLabel}>💬 {sharerFirstName.toUpperCase()}'S NOTE:</Text>
          <Text style={styles.bodyText}>{item.quoteSharingReason}</Text>
        </View>
      ) : null}
      <View style={styles.sharePrompt}>
        <Text style={styles.sharePromptText}>Know someone who needs to see this?</Text>
        <TouchableOpacity onPress={handleShare}>
          <Text style={styles.sharePromptLink}>Share quote →</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function TemplateBookReview({ item, c, styles }: { item: FeedItem; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  const overall = item.bookOverallRating ?? 0;
  const statusColor = "#2D6A4F";

  const ratingRows: { label: string; val: number | undefined }[] = [
    { label: "Writing",    val: item.bookRatingWriting },
    { label: "Story",      val: item.bookRatingStory },
    { label: "Characters", val: item.bookRatingCharacters },
    { label: "Pacing",     val: item.bookRatingPacing },
  ].filter((r) => r.val !== undefined && r.val > 0);

  return (
    <>
      {/* Book card */}
      <View style={styles.bookCard}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.bookCover} resizeMode="cover" />
        ) : (
          <View style={[styles.bookCover, { backgroundColor: c.gold + "30", alignItems: "center", justifyContent: "center" }]}>
            <Text style={{ fontSize: 24 }}>📚</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.bookTitle ?? item.title}</Text>
          {item.bookAuthor ? (
            <Text style={styles.bookAuthor}>{item.bookAuthor}</Text>
          ) : null}
          {overall > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <StarRow rating={overall} c={c} />
              <Text style={{ fontSize: 11, fontFamily: fonts.mono, color: c.gold }}>{overall.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Status + Recommend chips */}
      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        {item.bookStatus ? (
          <View style={[styles.tag, { backgroundColor: statusColor, borderColor: statusColor }]}>
            <Text style={[styles.tagText, { color: "#fff" }]}>
              {item.bookStatus === "finished" ? "✓ Finished"
                : item.bookStatus === "reading" ? "Reading"
                : item.bookStatus === "want-to-read" ? "Want to Read"
                : item.bookStatus}
            </Text>
          </View>
        ) : null}
        {item.bookRecommend === true ? (
          <View style={[styles.tag, { backgroundColor: c.paperWarm, borderColor: c.gold }]}>
            <Text style={[styles.tagText, { color: c.gold }]}>👍 Recommended</Text>
          </View>
        ) : null}
      </View>

      {/* Ratings section */}
      {ratingRows.length > 0 ? (
        <View style={styles.ratingsBlock}>
          <Text style={styles.ratingsLabel}>RATINGS</Text>
          {ratingRows.map((row) => (
            <View key={row.label} style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>{row.label}</Text>
              <StarRow rating={row.val!} c={c} />
              <Text style={styles.ratingScore}>{row.val!.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Review text */}
      {item.title ? <Text style={styles.bodyText}>{item.title}</Text> : null}

      {/* Favourite quote */}
      {item.bookFavQuote ? (
        <View style={styles.bookFavQuote}>
          <Text style={styles.bookFavQuoteLabel}>📖 Favourite quote:</Text>
          <Text style={styles.bookFavQuoteText}>{item.bookFavQuote}</Text>
        </View>
      ) : null}

      {/* Genre chips */}
      {item.bookGenres && item.bookGenres.length > 0 ? (
        <View style={[styles.tagRow, { marginTop: 8 }]}>
          {item.bookGenres.map((g, i) => (
            <View key={g} style={[styles.tag, i === 0 ? { backgroundColor: c.ink, borderColor: c.ink } : {}]}>
              <Text style={[styles.tagText, i === 0 ? { color: "#fff" } : { color: c.inkSoft }]}>{g}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </>
  );
}

// ── Main PostDetailSheet ────────────────────────────────────────────────────────

interface PostDetailSheetProps {
  item: FeedItem | null;
  visible: boolean;
  onClose: () => void;
  onMentionPress?: (username: string) => void;
}

export default function PostDetailSheet({ item, visible, onClose, onMentionPress }: PostDetailSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [reportOpen, setReportOpen] = useState(false);
  const nav = useNav();
  const handleMentionPress = onMentionPress ?? ((username: string) => nav.navigate("MemberProfile", { username }));

  if (!item) {
    return (
      <SheetErrorState
        visible={visible}
        onClose={onClose}
        message="Couldn't load this post"
      />
    );
  }

  const badge = TEMPLATE_BADGES[item.templateType ?? "post"] ?? TEMPLATE_BADGES["post"];
  const postId = item.wpId ?? item.id ?? "";

  const renderTemplateBody = () => {
    switch (item.templateType) {
      case "hidden-gem":        return <TemplateHiddenGem item={item} c={c} styles={styles} />;
      case "cultural-take":     return <TemplateCulturalTake item={item} c={c} styles={styles} />;
      case "food-review":       return <TemplateFoodReview item={item} c={c} styles={styles} />;
      case "creative-showcase": return <TemplateCreativeShowcase item={item} c={c} styles={styles} />;
      case "poll":              return <TemplatePoll item={item} c={c} styles={styles} />;
      case "itinerary":         return <TemplateItinerary item={item} c={c} styles={styles} />;
      case "event":             return <TemplateEvent item={item} c={c} styles={styles} />;
      case "book-review":       return <TemplateBookReview item={item} c={c} styles={styles} />;
      case "quote":             return <TemplateQuote item={item} c={c} styles={styles} />;
      default:                  return <TemplatePost item={item} c={c} styles={styles} onMentionPress={handleMentionPress} />;
    }
  };

  return (
    <>
    <BottomSheet visible={visible} onClose={onClose} initialState="full">
      {/* Type badge + time */}
      <View style={styles.topRow}>
        <View style={[styles.typeBadge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.typeBadgeText, { color: badge.color }]}>
            {badge.emoji} {badge.label}
          </Text>
        </View>
        <Text style={styles.timeAgo}>{timeAgo(item.date)}</Text>
      </View>

      {/* Author */}
      <AuthorRow item={item} c={c} styles={styles} />

      {/* Template-specific body */}
      <View style={styles.templateBody}>
        {renderTemplateBody()}
      </View>

      {/* Reactions */}
      <ReactionsRow item={item} c={c} styles={styles} onReport={() => setReportOpen(true)} />

      {/* Comments */}
      <CommentsSection postId={postId} c={c} styles={styles} />
    </BottomSheet>

    {postId ? (
      <ReportPostSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        postId={String(postId)}
      />
    ) : null}
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    typeBadge: {
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    typeBadgeText: {
      fontSize: 9,
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    timeAgo: {
      fontSize: 10,
      color: c.ghost,
      fontFamily: fonts.mono,
    },

    // Author
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      marginTop: 12,
    },
    authorAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.ruleDark,
    },
    authorInfo: { flex: 1 },
    authorName: {
      fontSize: 14,
      fontWeight: "700",
      color: c.ink,
      lineHeight: 18,
    },
    authorHandle: {
      fontSize: 12,
      color: c.mute,
      marginTop: 2,
    },
    followBtn: {
      height: 24,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
    },
    followBtnText: {
      fontSize: 12,
      fontWeight: "700",
      color: c.ink,
    },

    // Template body wrapper
    templateBody: {
      paddingHorizontal: 16,
      marginTop: 12,
    },

    // Shared text
    serifTitle: {
      fontSize: 20,
      fontWeight: "700",
      fontFamily: fonts.serifBold,
      color: c.ink,
      marginBottom: 8,
      lineHeight: 26,
    },
    bodyText: {
      fontSize: 14,
      color: c.inkSoft,
      lineHeight: 23,
      marginBottom: 12,
    },
    hashtags: {
      fontSize: 13,
      color: c.gold,
      marginTop: 4,
      marginBottom: 8,
    },
    heroImage: {
      width: "100%",
      height: 200,
      borderRadius: 6,
      marginBottom: 12,
      backgroundColor: c.ruleDark,
    },
    locationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 6,
    },
    locationText: {
      fontSize: 13,
      color: c.mute,
    },
    directoryChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginBottom: 10,
    },
    directoryChipText: {
      fontSize: 12,
      color: c.gold,
    },
    tagRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 8,
    },
    tag: {
      height: 28,
      paddingHorizontal: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
    },
    tagText: {
      fontSize: 11,
      color: c.inkSoft,
    },

    // Hidden gem
    // (uses serifTitle, locationRow, bodyText, directoryChip, heroImage)

    // Cultural take
    takeHeadlineBlock: {
      backgroundColor: c.paperWarm,
      padding: 14,
      borderRadius: 8,
      marginBottom: 12,
    },
    takeHeadline: {
      fontSize: 20,
      fontWeight: "700",
      fontFamily: fonts.serifBold,
      color: c.ink,
      lineHeight: 26,
    },
    agreeChip: {
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: c.gold,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginBottom: 10,
    },
    agreeChipText: {
      fontSize: 12,
      color: c.gold,
      fontWeight: "600",
    },

    // Food review
    foodMeta: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 8,
    },
    ratingsBlock: {
      backgroundColor: c.paperWarm,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: c.ghost + "40",
    },
    ratingsLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.mute,
      textTransform: "uppercase",
      letterSpacing: 1.4,
      marginBottom: 8,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      height: 36,
      borderBottomWidth: 1,
      borderBottomColor: c.ghost + "40",
    },
    ratingLabel: {
      fontSize: 13,
      color: c.inkSoft,
      width: 60,
    },
    ratingScore: {
      fontSize: 12,
      color: c.gold,
      fontFamily: fonts.mono,
      width: 30,
      textAlign: "right",
    },
    overallRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "flex-end",
      marginTop: 12,
      gap: 4,
    },
    overallScore: {
      fontSize: 28,
      fontWeight: "700",
      fontFamily: fonts.serifBold,
      color: c.ink,
      lineHeight: 32,
    },
    overallDenom: {
      fontSize: 13,
      color: c.mute,
    },
    dishCaption: {
      textAlign: "center",
      fontSize: 10,
      fontFamily: fonts.mono,
      color: c.mute,
      marginTop: 4,
      marginBottom: 12,
    },

    // Gallery
    galleryContainer: { marginBottom: 12 },
    galleryMain: {
      width: "100%",
      height: 220,
      borderRadius: 6,
      backgroundColor: c.ruleDark,
      marginBottom: 4,
    },
    galleryGrid: { flexDirection: "row", gap: 4 },
    galleryThumb: {
      flex: 1,
      height: 130,
      borderRadius: 6,
      backgroundColor: c.ruleDark,
    },

    // Poll
    pollOptions: { gap: 8, marginBottom: 12 },
    pollOption: {
      height: 52,
      borderRadius: 8,
      backgroundColor: c.paperWarm,
      borderWidth: 1,
      borderColor: c.ghost + "40",
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      overflow: "hidden",
      position: "relative",
    },
    pollOptionLeader: { borderColor: c.gold },
    pollFill: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: c.gold + "26",
    },
    pollOptionText: {
      flex: 1,
      fontSize: 14,
      fontWeight: "600",
      color: c.ink,
      zIndex: 1,
    },
    pollPct: {
      fontSize: 12,
      fontFamily: fonts.mono,
      color: c.gold,
      fontWeight: "700",
      zIndex: 1,
    },
    pollMeta: {
      backgroundColor: c.paperWarm,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: c.ghost + "40",
      gap: 4,
      marginBottom: 12,
    },
    pollMetaText: {
      fontSize: 12,
      fontFamily: fonts.mono,
      color: c.mute,
    },

    // Itinerary
    itinMeta: {
      flexDirection: "row",
      gap: 16,
      marginBottom: 8,
    },
    itinMetaText: {
      fontSize: 11,
      fontFamily: fonts.mono,
      color: c.ghost,
    },
    routeCard: {
      backgroundColor: c.paperWarm,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
    },
    routeCardLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.mute,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    stopRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: c.ghost + "30",
      position: "relative",
    },
    stopConnector: {
      position: "absolute",
      left: 11,
      top: 34,
      bottom: -10,
      width: 1,
      borderLeftWidth: 1,
      borderLeftColor: c.ghost + "60",
      borderStyle: "dashed",
    },
    stopNumber: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.paperWarm,
      borderWidth: 1,
      borderColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
    },
    stopNumberText: {
      fontSize: 12,
      fontWeight: "700",
      color: c.mute,
    },
    stopContent: { flex: 1 },
    stopName: {
      fontSize: 14,
      fontWeight: "700",
      color: c.ink,
    },
    stopNote: {
      fontSize: 12,
      color: c.mute,
      marginTop: 2,
    },
    expandStops: {
      paddingTop: 8,
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: c.ghost + "30",
    },
    expandStopsText: {
      fontSize: 13,
      color: c.gold,
    },

    // Event
    eventMeta: { gap: 8, marginTop: 12, marginBottom: 12 },
    eventMetaRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    eventMetaIcon: { fontSize: 16, width: 22, textAlign: "center" },
    eventMetaText: { fontSize: 14, color: c.inkSoft, flex: 1 },
    eventCategoryChip: {
      backgroundColor: c.paperWarm,
      borderWidth: 1,
      borderColor: c.ghost,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 4,
    },
    eventCategoryText: { fontSize: 11, fontWeight: "700", color: c.inkSoft },
    organiserLink: { fontSize: 13, color: c.gold, textDecorationLine: "underline" },
    proPerk: {
      backgroundColor: c.paperWarm,
      borderRadius: 8,
      padding: 12,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
      marginBottom: 12,
    },
    proPerkText: { fontSize: 13, color: c.inkSoft, flex: 1 },
    rsvpBtn: {
      backgroundColor: c.gold,
      borderRadius: 26,
      height: 52,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    rsvpBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
      letterSpacing: 0.6,
    },
    calendarLink: { fontSize: 13, color: c.mute },

    // Quote
    quoteBlock: {
      paddingTop: 16,
      paddingBottom: 16,
      position: "relative",
    },
    quoteMark: {
      fontSize: 72,
      fontFamily: fonts.serif,
      color: c.ghost,
      lineHeight: 60,
      marginBottom: -8,
    },
    quoteText: {
      fontSize: 22,
      fontFamily: fonts.serifBold,
      color: c.ink,
      lineHeight: 30,
      paddingLeft: 8,
      marginBottom: 12,
    },
    quoteAttrib: { paddingLeft: 8, marginTop: 12 },
    quoteAuthor: {
      fontSize: 14,
      fontWeight: "700",
      color: c.ink,
    },
    quoteSource: {
      fontSize: 12,
      color: c.mute,
    },
    posterNote: {
      backgroundColor: c.paperWarm,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    posterNoteLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.mute,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    sharePrompt: { alignItems: "center", paddingVertical: 8, gap: 4 },
    sharePromptText: { fontSize: 13, fontFamily: fonts.sans, color: c.mute },
    sharePromptLink: { fontSize: 13, fontFamily: fonts.sansBold, color: c.ochre },

    // Reactions
    divider: {
      height: 1,
      backgroundColor: c.ghost + "30",
      marginHorizontal: 16,
    },
    reactionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    reactionBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    reactionCount: {
      fontSize: 10,
      fontFamily: fonts.mono,
      color: c.mute,
    },

    // Comments
    commentHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    commentHeaderText: {
      fontSize: 13,
      fontWeight: "700",
      color: c.ink,
    },
    addCommentBtn: {
      fontSize: 13,
      color: c.gold,
    },
    commentRow: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: c.ghost + "30",
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.ruleDark,
    },
    commentBody: { flex: 1 },
    commentMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "baseline",
    },
    commentAuthor: {
      fontSize: 13,
      fontWeight: "700",
      color: c.ink,
    },
    commentTime: {
      fontSize: 10,
      fontFamily: fonts.mono,
      color: c.ghost,
    },
    commentContent: {
      fontSize: 13,
      color: c.mute,
      marginTop: 2,
    },
    viewAllComments: {
      fontSize: 13,
      color: c.mute,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    composeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    composeAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.ruleDark,
    },
    composeInput: {
      flex: 1,
      backgroundColor: c.paperWarm,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: c.ghost + "40",
      paddingHorizontal: 14,
      paddingVertical: 8,
      fontSize: 14,
      maxHeight: 80,
    },
    reportBtn: {
      fontSize: 12,
      color: c.ghost,
      paddingHorizontal: 16,
      paddingBottom: 8,
    },

    // Book review
    bookCard: {
      flexDirection: "row",
      gap: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: c.ghost + "60",
      borderRadius: 8,
      backgroundColor: "#fff",
      marginBottom: 12,
    },
    bookCover: {
      width: 48,
      height: 64,
      borderRadius: 4,
      backgroundColor: c.ruleDark,
      flexShrink: 0,
    },
    bookTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: c.ink,
      lineHeight: 20,
    },
    bookAuthor: {
      fontSize: 12,
      color: c.mute,
      marginTop: 2,
    },
    bookFavQuote: {
      backgroundColor: c.paperWarm,
      borderLeftWidth: 3,
      borderLeftColor: c.gold,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 4,
      marginBottom: 12,
    },
    bookFavQuoteLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: c.mute,
      marginBottom: 4,
    },
    bookFavQuoteText: {
      fontSize: 13,
      fontStyle: "italic",
      color: c.inkSoft,
      lineHeight: 20,
    },
  });
}
