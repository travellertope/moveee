import React, { useState } from "react";
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, Dimensions, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius, letterSpacing } from "../../theme";
import { api, MOBILE_API } from "../../api/client";
import Avatar from "../ui/Avatar";
import TypeBadge from "../ui/TypeBadge";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import ImageLightbox from "../ui/ImageLightbox";
import HappeningDetailModal from "./HappeningDetailModal";
import DirectoryDetailModal from "./DirectoryDetailModal";
import QuoteDetailModal from "./QuoteDetailModal";
import type { FeedItem, TemplateType, PollOption } from "../../types";

const WINDOW_W = Dimensions.get("window").width;
const IMG_H = 200;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(d: string): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Stars({ rating, max = 5, color = colors.gold }: { rating: number; max?: number; color?: string }) {
  return (
    <Text style={{ color }}>
      {"★".repeat(Math.min(Math.round(rating), max))}
      {"☆".repeat(Math.max(0, max - Math.round(rating)))}
    </Text>
  );
}

// ── Template badge ────────────────────────────────────────────────────────────
const TEMPLATE_META: Partial<Record<TemplateType, { label: (item: FeedItem) => string; bg: string; text: string }>> = {
  "hidden-gem":      {
    label: (item) => `Hidden Gem ${"★".repeat(Math.min(item.starRating ?? 0, 5))}`,
    bg: colors.templateGemBg, text: colors.templateGemText,
  },
  "cultural-take":   { label: () => "Cultural Take",      bg: colors.templateTakeBg,     text: colors.templateTakeText },
  "food-review":     { label: (item) => `Food Review · ${item.foodDishName ?? ""}`, bg: colors.templateFoodBg, text: colors.templateFoodText },
  "creative-showcase":{ label: () => "Creative Showcase", bg: colors.templateShowcaseBg, text: colors.templateShowcaseText },
  "itinerary":       { label: () => "Weekend Route",      bg: colors.templateRouteBg,    text: colors.templateRouteText },
};

function TemplateBadge({ item }: { item: FeedItem }) {
  if (!item.templateType || item.templateType === "post") return null;
  const meta = TEMPLATE_META[item.templateType];
  if (!meta) return null;
  return (
    <View style={[tbStyles.badge, { backgroundColor: meta.bg }]}>
      <Text style={[tbStyles.text, { color: meta.text }]}>{meta.label(item)}</Text>
    </View>
  );
}
const tbStyles = StyleSheet.create({
  badge: { borderRadius: 9999, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: space[1] },
  text:  { fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1 },
});

// ── Gallery ───────────────────────────────────────────────────────────────────
function Gallery({ images, onTap }: { images: string[]; onTap: (idx: number) => void }) {
  const [dot, setDot] = useState(0);
  const w = WINDOW_W - 32;

  return (
    <View style={gStyles.wrap}>
      <ScrollView
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setDot(Math.round(e.nativeEvent.contentOffset.x / w))}
        style={gStyles.scroll}
      >
        {images.map((uri, i) => (
          <TouchableOpacity key={uri + i} onPress={() => onTap(i)} activeOpacity={0.9}>
            <Image source={{ uri }} style={[gStyles.img, { width: w }]} resizeMode="cover" />
          </TouchableOpacity>
        ))}
      </ScrollView>
      {images.length > 1 && (
        <View style={gStyles.dots}>
          {images.map((_, i) => (
            <View key={i} style={[gStyles.dot, i === dot && gStyles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}
const gStyles = StyleSheet.create({
  wrap:     { marginTop: space[2], marginBottom: space[2] },
  scroll:   { borderRadius: radius.lg },
  img:      { height: IMG_H, borderRadius: radius.lg },
  dots:     { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 6 },
  dot:      { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.ghost },
  dotActive:{ backgroundColor: colors.gold },
});

// ── Poll ──────────────────────────────────────────────────────────────────────
function PollBlock({ item, postId }: { item: FeedItem; postId: string }) {
  const options = item.pollOptions ?? [];
  const totalVotes = options.reduce((s, o) => s + o.votes, 0);
  const [voted, setVoted] = useState(false);
  const [localOpts, setLocalOpts] = useState<PollOption[]>(options);
  const expired = item.pollExpiresAt ? new Date(item.pollExpiresAt) < new Date() : false;

  const vote = async (idx: number) => {
    if (voted || expired) return;
    setVoted(true);
    setLocalOpts((prev) => prev.map((o, i) => i === idx ? { ...o, votes: o.votes + 1 } : o));
    try {
      await api.post(`${MOBILE_API}/community/poll-vote`, { post_id: Number(postId), option_index: idx });
    } catch {
      setVoted(false);
      setLocalOpts(options);
    }
  };

  const total = localOpts.reduce((s, o) => s + o.votes, 0);
  const maxVotes = Math.max(...localOpts.map((o) => o.votes), 1);

  return (
    <View style={pollStyles.wrap}>
      {localOpts.map((opt, i) => {
        const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
        const isWinner = opt.votes === maxVotes && opt.votes > 0;
        return (
          <TouchableOpacity
            key={i}
            style={[
              pollStyles.option,
              (voted || expired) && { backgroundColor: "transparent" },
            ]}
            onPress={() => vote(i)}
            disabled={voted || expired}
          >
            {(voted || expired) && (
              <View
                style={[
                  isWinner ? pollStyles.fillWinner : pollStyles.fill,
                  { width: `${pct}%` as any },
                ]}
              />
            )}
            <Text style={pollStyles.optText}>
              {opt.text}
            </Text>
            {(voted || expired) && (
              <Text style={isWinner ? pollStyles.pctWinner : pollStyles.pct}>{pct}%</Text>
            )}
          </TouchableOpacity>
        );
      })}
      <Text style={pollStyles.meta}>
        {total} vote{total !== 1 ? "s" : ""}
        {item.pollExpiresAt && !expired
          ? ` · ends ${formatDate(item.pollExpiresAt)}`
          : expired ? " · ended" : ""}
      </Text>
    </View>
  );
}
const pollStyles = StyleSheet.create({
  wrap:    { marginTop: space[2], marginBottom: space[1], gap: space[1] + 2 },
  option: {
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.md,
    paddingHorizontal: space[3],
    height: 48,
    flexDirection: "row", alignItems: "center", overflow: "hidden",
    position: "relative",
  },
  fill:    {
    position: "absolute", left: 0, top: 0, bottom: 0,
    backgroundColor: colors.paperDeep,
  },
  fillWinner: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(197,73,31,0.10)",
  },
  optText: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ink },
  pct:     { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginLeft: space[2] },
  pctWinner: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ochre, marginLeft: space[2] },
  meta:    { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: 2 },
});

// ── Itinerary ─────────────────────────────────────────────────────────────────
function ItineraryBlock({ item }: { item: FeedItem }) {
  const stops = item.itineraryStops ?? [];
  return (
    <View style={itinStyles.wrap}>
      {stops.map((stop, i) => (
        <View key={i} style={itinStyles.row}>
          <View style={itinStyles.leftCol}>
            <View style={itinStyles.circle}>
              <Text style={itinStyles.circleText}>{i + 1}</Text>
            </View>
            {i < stops.length - 1 && <View style={itinStyles.connector} />}
          </View>
          <View style={itinStyles.content}>
            <Text style={itinStyles.name}>{stop.name}</Text>
            {stop.note ? <Text style={itinStyles.note}>{stop.note}</Text> : null}
          </View>
        </View>
      ))}
    </View>
  );
}
const itinStyles = StyleSheet.create({
  wrap: { marginTop: space[2], gap: 0 },
  row:  { flexDirection: "row", gap: space[2], alignItems: "flex-start" },
  leftCol: { alignItems: "center", width: 24 },
  connector: {
    width: 0, flex: 1, minHeight: space[2],
    borderLeftWidth: 1.5, borderStyle: "dashed", borderColor: colors.gold,
    marginTop: 2,
  },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: colors.gold, justifyContent: "center", alignItems: "center",
    flexShrink: 0,
  },
  circleText: { fontFamily: fonts.monoBold, fontSize: 11, color: "#fff" },
  content: { flex: 1, paddingBottom: space[2] },
  name:       { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  note:       { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, marginTop: 1 },
});

// ── Food ratings ──────────────────────────────────────────────────────────────
function FoodRatings({ item }: { item: FeedItem }) {
  if (!item.foodRatingTaste && !item.foodRatingValue && !item.foodRatingVibe) return null;
  const rows = [
    { label: "Taste", val: item.foodRatingTaste },
    { label: "Value", val: item.foodRatingValue },
    { label: "Vibe",  val: item.foodRatingVibe },
  ];
  return (
    <View style={foodStyles.wrap}>
      {rows.map(({ label, val }) =>
        val ? (
          <View key={label} style={foodStyles.row}>
            <Text style={foodStyles.label}>{label}</Text>
            <Stars rating={val} />
          </View>
        ) : null
      )}
    </View>
  );
}
const foodStyles = StyleSheet.create({
  wrap:  { flexDirection: "row", flexWrap: "wrap", gap: space[3], marginTop: space[1] },
  row:   { flexDirection: "row", alignItems: "center", gap: 4 },
  label: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },
});

// ── Link snippet ──────────────────────────────────────────────────────────────
function LinkSnippet({ item }: { item: FeedItem }) {
  if (!item.ogTitle && !item.ogImage) return null;
  return (
    <View style={snipStyles.card}>
      {item.ogImage ? <Image source={{ uri: item.ogImage }} style={snipStyles.img} resizeMode="cover" /> : null}
      <View style={snipStyles.body}>
        {item.source ? <Text style={snipStyles.source}>{item.source}</Text> : null}
        {item.ogTitle ? <Text style={snipStyles.title} numberOfLines={2}>{item.ogTitle}</Text> : null}
        {item.ogDescription ? <Text style={snipStyles.desc} numberOfLines={2}>{item.ogDescription}</Text> : null}
      </View>
    </View>
  );
}
const snipStyles = StyleSheet.create({
  card: {
    flexDirection: "row", borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, overflow: "hidden", marginTop: space[1], marginBottom: space[1],
    backgroundColor: colors.paperDeep,
  },
  img:    { width: 84, height: 84, backgroundColor: colors.rule },
  body:   { flex: 1, padding: space[2], justifyContent: "center", gap: 2 },
  source: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute, textTransform: "uppercase", letterSpacing: 0.5 },
  title:  { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink },
  desc:   { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.inkSoft },
});

// ── Report control ────────────────────────────────────────────────────────────
type ReportState = "idle" | "confirm" | "sent" | "error";

function ReportControl({
  state, onChangeState, onSubmit,
}: {
  state: ReportState;
  onChangeState: (s: ReportState) => void;
  onSubmit: (reason: "spam" | "harassment" | "inappropriate") => void;
}) {
  if (state === "idle") {
    return (
      <TouchableOpacity onPress={() => onChangeState("confirm")} style={styles.flagBtn}>
        <Text style={styles.flagIcon}>⚑</Text>
      </TouchableOpacity>
    );
  }
  if (state === "confirm") {
    return (
      <View style={styles.reportRow}>
        <Text style={styles.reportLabel}>Report as:</Text>
        {(["spam", "harassment", "inappropriate"] as const).map((r) => (
          <TouchableOpacity key={r} style={styles.reportBtn} onPress={() => onSubmit(r)}>
            <Text style={styles.reportBtnText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => onChangeState("idle")}>
          <Text style={styles.reportCancel}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (state === "sent")  return <Text style={styles.reportStatus}>Reported — thank you.</Text>;
  return <Text style={[styles.reportStatus, { color: colors.ochre }]}>Couldn't send report.</Text>;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  item: FeedItem;
  onPress: () => void;
  onAuthorPress?: () => void;
  onReact?: (type: string) => void;
  forYouBadge?: boolean;
}

// ── Community card ────────────────────────────────────────────────────────────
function CommunityCard({ item, onPress, onAuthorPress, forYouBadge }: Props) {
  const [reportState, setReportState] = useState<ReportState>("idle");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const submitReport = async (reason: "spam" | "harassment" | "inappropriate") => {
    if (!item.wpId) return;
    try {
      await api.post(`${MOBILE_API}/community/report`, { post_id: Number(item.wpId), reason });
      setReportState("sent");
    } catch {
      setReportState("error");
    }
  };

  const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : undefined;

  // Gallery guard: don't double-render first image
  const hasGallery = (item.galleryImages ?? []).length >= 1;

  return (
    <>
      <TouchableOpacity style={[styles.card, styles.communityCard]} onPress={onPress} activeOpacity={0.95}>
        <View style={styles.communityRow}>
          <TouchableOpacity onPress={onAuthorPress} disabled={!onAuthorPress}>
            <View style={[
              styles.avatarWrap,
              item.communityTier === "patron"
                ? styles.avatarWrapPro
                : styles.avatarWrapCitizen,
            ]}>
              <Avatar
                uri={item.communityAuthorAvatar}
                name={item.communityAuthor ?? "?"}
                size={40}
                tier={item.communityTier as any}
              />
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1, minWidth: 0 }}>
            {/* Author row */}
            <View style={styles.communityHeaderRow}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <TouchableOpacity onPress={onAuthorPress} disabled={!onAuthorPress}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={styles.authorName}>{item.communityAuthor ?? "Community Member"}</Text>
                    {item.communityTier === "patron" && (
                      <View style={styles.proBadge}>
                        <Text style={styles.proBadgeText}>PRO</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
                {item.communityAuthorUsername ? (
                  <Text style={styles.authorHandle}>@{item.communityAuthorUsername}</Text>
                ) : null}
                {/* For You badge */}
                {forYouBadge && (
                  <View style={fyStyles.badge}>
                    <Text style={fyStyles.text}>✦ For You</Text>
                  </View>
                )}
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                {item.communityTag && (
                  <View style={styles.tagPill}>
                    <Text style={styles.tagText}>{item.communityTag}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Template badge */}
            <TemplateBadge item={item} />

            {/* Location line */}

            {item.locationName ? (
              <Text style={styles.locationLine}>📍 {item.locationName}</Text>
            ) : null}

            {/* Post text */}
            <HashtagText
              text={item.title}
              numberOfLines={6}
              style={styles.content}
            />

            {/* Media */}
            {hasGallery ? (
              <Gallery
                images={item.galleryImages!}
                onTap={(idx) => setLightboxIdx(idx)}
              />
            ) : item.image ? (
              <TouchableOpacity onPress={() => setLightboxIdx(0)}>
                <Image source={{ uri: item.image }} style={styles.postImage} resizeMode="cover" />
              </TouchableOpacity>
            ) : (
              <LinkSnippet item={item} />
            )}

            {/* Poll */}
            {item.pollOptions && item.wpId && (
              <PollBlock item={item} postId={item.wpId} />
            )}

            {/* Itinerary */}
            {item.itineraryStops && item.itineraryStops.length > 0 && (
              <ItineraryBlock item={item} />
            )}

            {/* Food ratings */}
            <FoodRatings item={item} />

            {/* Footer */}
            <View style={styles.communityActionRow}>
              {item.reactions && item.wpId && (
                <View style={{ flex: 1 }}>
                  <ReactionBar
                    postId={item.wpId}
                    initialCounts={item.reactions}
                    shareUrl={shareUrl}
                    noBorder
                  />
                </View>
              )}
              <TouchableOpacity style={styles.commentBtn} onPress={onPress}>
                <Ionicons name="chatbubble-outline" size={14} color={colors.mute} />
                {typeof item.commentCount === "number" && item.commentCount > 0 && (
                  <Text style={styles.commentCount}>{item.commentCount}</Text>
                )}
              </TouchableOpacity>
              <ReportControl state={reportState} onChangeState={setReportState} onSubmit={submitReport} />
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Lightbox */}
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={hasGallery ? item.galleryImages! : item.image ? [item.image] : []}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </>
  );
}

// ── Quote card ────────────────────────────────────────────────────────────────
function QuoteCard({ item }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={[styles.card]} onPress={() => setDrawerOpen(true)} activeOpacity={0.95}>
        <View style={styles.quoteContainer}>
          <Text style={styles.quoteDecorMark}>"</Text>
          <View style={styles.quoteInner}>
            <Text style={styles.quoteText}>{item.title}</Text>
            {item.quoteAuthor ? (
              <Text style={styles.quoteAuthor}>{item.quoteAuthor}</Text>
            ) : null}
            {item.quoteSource ? (
              <Text style={styles.quoteSrc}>{item.quoteSource}</Text>
            ) : null}
            <View style={[styles.quoteFooter, { marginTop: space[2] }]}>
              <TypeBadge type="quote" />
              <View style={{ flex: 1 }} />
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <QuoteDetailModal visible={drawerOpen} item={item} onClose={() => setDrawerOpen(false)} />
    </>
  );
}

// ── Happening date range helper ────────────────────────────────────────────────
function fmtHappeningDate(start: string, end?: string | null): string {
  try {
    const s = new Date(start);
    const startStr = s.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (!end) return startStr;
    const e = new Date(end);
    if (s.toDateString() === e.toDateString()) return startStr;
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
      return `${s.getDate()}–${e.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    }
    return `${startStr} – ${e.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  } catch { return start; }
}

// ── Generic card (pulse / editorial / happening / directory) ──────────────────
const INTERNAL_LINK_LABEL: Record<string, string> = {
  pulse:     "Moveee Pulse",
  editorial: "Moveee Magazine",
  happening: "Moveee Happenings",
  directory: "Culture Directory",
};
const READ_MORE_COLOR: Record<string, string> = {
  pulse:     colors.gold,
  editorial: colors.ochre,
  happening: "#3c3489",
  directory: "#085041",
};

function GenericCard({ item, onPress }: Props) {
  const [lightboxIdx, setLightboxIdx]     = useState<number | null>(null);
  const [happeningOpen, setHappeningOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);

  const CLAMP = 280;
  const excerpt = item.excerpt ?? "";
  const isLong = excerpt.length > CLAMP;
  const displayExcerpt = isLong ? excerpt.slice(0, CLAMP) + "…" : excerpt;

  // Happening + Directory open their own detail drawer; others use onPress
  const handlePress = () => {
    if (item.type === "happening") { setHappeningOpen(true); return; }
    if (item.type === "directory") { setDirectoryOpen(true); return; }
    onPress();
  };

  // Happening cards: full-bleed hero image layout
  if (item.type === "happening") {
    return (
      <>
        <TouchableOpacity style={[styles.card, styles.happeningCard]} onPress={handlePress} activeOpacity={0.95}>
          {item.image ? (
            <TouchableOpacity onPress={() => setLightboxIdx(0)} activeOpacity={0.92}>
              <Image source={{ uri: item.image }} style={styles.happeningHero} resizeMode="cover" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.happeningContent}>
            <View style={styles.metaRow}>
              <TypeBadge type="happening" />
              {item.eventDate ? (
                <Text style={[styles.metaTag, { color: READ_MORE_COLOR.happening, fontFamily: fonts.sansBold }]}>
                  {fmtHappeningDate(item.eventDate, item.endDate)}
                </Text>
              ) : null}
              {(item.location || item.city) ? (
                <Text style={styles.metaTagMuted} numberOfLines={1}>
                  · {[item.location, item.city].filter(Boolean).join(", ")}
                </Text>
              ) : null}
              <View style={{ flex: 1 }} />
              <Text style={styles.dateText}>{formatDate(item.date)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
            {displayExcerpt ? <Text style={styles.excerpt}>{displayExcerpt}</Text> : null}
            {item.admission && (
              <View style={styles.admissionPill}>
                <Ionicons name="ticket-outline" size={11} color={colors.badgeHappeningText} />
                <Text style={styles.admissionText}>{item.admission}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.rsvpButton} onPress={handlePress}>
              <Text style={styles.rsvpButtonText}>See details →</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        {item.image && (
          <ImageLightbox
            visible={lightboxIdx !== null}
            images={[item.image]}
            onClose={() => setLightboxIdx(null)}
          />
        )}
        <HappeningDetailModal visible={happeningOpen} item={item} onClose={() => setHappeningOpen(false)} />
      </>
    );
  }

  return (
    <>
      <TouchableOpacity style={styles.card} onPress={handlePress} activeOpacity={0.95}>
        <View style={styles.metaRow}>
          <TypeBadge type={item.type} />
          {item.type === "directory" && item.entryType ? (
            <Text style={styles.metaTagMuted}>{item.entryType}</Text>
          ) : null}
          {item.type === "directory" && item.city ? (
            <Text style={styles.metaTagMuted} numberOfLines={1}>· {item.city}</Text>
          ) : null}
          {item.type === "editorial" && item.category ? (
            <Text style={styles.metaTagMuted}>{item.category}</Text>
          ) : null}
          <View style={{ flex: 1 }} />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        {displayExcerpt ? <Text style={styles.excerpt}>{displayExcerpt}</Text> : null}
        {isLong ? (
          <Text style={[styles.readMore, { color: READ_MORE_COLOR[item.type] ?? colors.gold }]}>
            {item.type === "directory" ? "See details →" : "Read more →"}
          </Text>
        ) : (
          item.type === "directory" ? (
            <Text style={[styles.readMore, { color: READ_MORE_COLOR[item.type] }]}>See details →</Text>
          ) : null
        )}

        <View style={styles.internalLinkCard}>
          {item.image ? (
            <TouchableOpacity onPress={() => setLightboxIdx(0)}>
              <Image source={{ uri: item.image }} style={styles.internalLinkImage} resizeMode="cover" />
            </TouchableOpacity>
          ) : null}
          <View style={styles.internalLinkBody}>
            <Text style={styles.internalLinkLabel}>{INTERNAL_LINK_LABEL[item.type] ?? ""}</Text>
            <Text style={styles.internalLinkTitle} numberOfLines={2}>{item.title}</Text>
            {item.excerpt ? <Text style={styles.internalLinkDesc} numberOfLines={1}>{item.excerpt}</Text> : null}
          </View>
        </View>

        <LinkSnippet item={item} />

        {item.reactions && item.wpId && (
          <ReactionBar postId={item.wpId} initialCounts={item.reactions} />
        )}
      </TouchableOpacity>

      {item.image && (
        <ImageLightbox
          visible={lightboxIdx !== null}
          images={[item.image]}
          onClose={() => setLightboxIdx(null)}
        />
      )}

      <DirectoryDetailModal visible={directoryOpen} item={item} onClose={() => setDirectoryOpen(false)} />
    </>
  );
}

// ── Entry point ───────────────────────────────────────────────────────────────
export default function FeedItemCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: Props) {
  if (item.type === "community") {
    return <CommunityCard item={item} onPress={onPress} onAuthorPress={onAuthorPress} forYouBadge={forYouBadge} />;
  }
  if (item.type === "quote") {
    return <QuoteCard item={item} onPress={onPress} />;
  }
  return <GenericCard item={item} onPress={onPress} />;
}

const fyStyles = StyleSheet.create({
  badge: {
    borderColor: colors.goldBorder, borderWidth: 1, borderRadius: 9999,
    paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start",
    marginTop: 3,
  },
  text: { fontFamily: fonts.sansBold, fontSize: 8, letterSpacing: 1, color: colors.gold, textTransform: "uppercase" },
});

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: space[4], paddingVertical: space[4],
    shadowColor: "#14110D",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  communityCard: {
    borderLeftWidth: 3, borderLeftColor: colors.communityBorder,
  },

  // Avatar with tier border
  avatarWrap: {
    borderRadius: 9999, overflow: "hidden",
  },
  avatarWrapPro: {
    borderColor: colors.gold, borderWidth: 2.5,
    shadowColor: colors.gold, shadowOpacity: 0.18, shadowRadius: 8, elevation: 2,
  },
  avatarWrapCitizen: {
    borderColor: colors.ghost, borderWidth: 1.5,
  },

  // community header
  communityRow:       { flexDirection: "row", gap: space[2] + 2 },
  communityHeaderRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 6, marginBottom: 6 },
  authorName: { fontFamily: fonts.sansBold, fontSize: fontSize.sm + 1, color: colors.ink },
  authorHandle: { fontFamily: fonts.sans, fontSize: 12, color: colors.ghost, marginTop: 1 },
  proBadge: {
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2,
  },
  proBadgeText: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    letterSpacing: 1, color: colors.gold,
  },
  dotSep:   { fontSize: 12, color: colors.ghost },
  dateText: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: colors.mute },
  tagPill: {
    backgroundColor: colors.communityBg,
    borderRadius: 9999, paddingHorizontal: 6, paddingVertical: 2,
  },
  tagText: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    letterSpacing: 1, color: colors.communityText,
  },
  locationLine: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, marginBottom: space[1] },
  content:      { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink, lineHeight: 22, marginBottom: space[2] },
  postImage: {
    width: "100%", height: IMG_H, borderRadius: radius.lg,
    marginBottom: space[2], borderWidth: 1, borderColor: colors.rule,
  },

  // footer
  communityActionRow: {
    flexDirection: "row", alignItems: "center", gap: space[2] + 2,
    paddingTop: space[2], marginTop: space[1],
    borderTopWidth: 1, borderTopColor: colors.rule,
  },
  commentBtn:   { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  commentCount: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },
  flagBtn:      { paddingLeft: 4, flexShrink: 0 },
  flagIcon:     { fontSize: 12, color: colors.ghost },
  reportRow:    { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 0 },
  reportLabel:  { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute },
  reportBtn: {
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "rgba(192,57,43,0.2)",
    borderRadius: 3, paddingHorizontal: 6, paddingVertical: 1,
  },
  reportBtnText: { fontFamily: fonts.sans, fontSize: fontSize.tiny, color: colors.ochre },
  reportCancel:  { fontSize: 12, color: colors.ghost },
  reportStatus:  { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, flexShrink: 0 },

  // meta row for generic cards
  metaRow: { flexDirection: "row", alignItems: "center", gap: space[2], marginBottom: space[2], flexWrap: "wrap" },
  metaTag:     { fontFamily: fonts.sansBold, fontSize: fontSize.xs },
  metaTagMuted:{ fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute },

  // generic card body
  title:   { fontFamily: fonts.serifBold, fontSize: fontSize.md, color: colors.ink, lineHeight: 22, marginBottom: space[1] },
  excerpt: { fontFamily: fonts.sans, fontSize: fontSize.sm + 1, color: colors.inkSoft, lineHeight: 21, marginBottom: 4 },
  readMore:{ fontFamily: fonts.sansBold, fontSize: fontSize.sm, marginTop: 2, marginBottom: 2 },

  admissionPill: {
    flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start",
    backgroundColor: colors.badgeHappeningBg, borderRadius: radius.full,
    paddingHorizontal: space[2], paddingVertical: 2, marginTop: 4,
  },
  admissionText: { fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.badgeHappeningText, letterSpacing: 0.8 },

  // Happening full-bleed layout
  happeningCard: {
    paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden",
  },
  happeningHero: {
    width: "100%", height: 200,
  },
  happeningContent: {
    paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16,
  },
  rsvpButton: {
    height: 36, borderRadius: 9999, borderColor: colors.ink, borderWidth: 1,
    justifyContent: "center", alignItems: "center", marginTop: space[2],
  },
  rsvpButtonText: {
    fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink,
  },

  internalLinkCard: {
    flexDirection: "row", alignItems: "stretch",
    borderWidth: 1, borderColor: colors.rule, borderRadius: radius.lg,
    overflow: "hidden", marginTop: space[2], backgroundColor: "#faf8f4", minHeight: 72,
  },
  internalLinkImage: { width: 110, backgroundColor: colors.rule },
  internalLinkBody:  { flex: 1, minWidth: 0, padding: 9, justifyContent: "center", gap: 2 },
  internalLinkLabel: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.gold, letterSpacing: 1.2, textTransform: "uppercase" },
  internalLinkTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ink, lineHeight: 18 },
  internalLinkDesc:  { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, lineHeight: 15 },

  // quote
  quoteContainer: { position: "relative", minHeight: 60 },
  quoteInner:     { paddingTop: 8 },
  quoteDecorMark: {
    position: "absolute", top: 14, left: 14,
    fontFamily: fonts.serif, fontSize: 52, color: colors.ghost,
    lineHeight: 52, zIndex: 0,
  },
  quoteRow:   { flexDirection: "row", gap: space[2] + 2 },
  quoteMark:  { fontFamily: fonts.serif, fontSize: 32, lineHeight: 30, color: colors.ghost },
  quoteText:  { fontFamily: fonts.serifBold, fontSize: 19, fontStyle: "italic", color: colors.ink, lineHeight: 27, marginBottom: space[2] },
  quoteFooter:{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  quoteAuthor:{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkSoft, marginBottom: 2 },
  quoteSrc:   { fontFamily: fonts.mono, fontSize: 11, color: colors.ghost },
});
