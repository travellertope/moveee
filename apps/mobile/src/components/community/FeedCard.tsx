import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import type { FeedItem } from "../../types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FeedCardProps {
  item: FeedItem;
  onPress?: () => void;
  onAuthorPress?: () => void;
  onReact?: (type: "love" | "fire" | "clap") => void;
  forYouBadge?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(d: string): string {
  if (!d) return "";
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  const wks = Math.floor(days / 7);
  if (wks < 5) return `${wks}w`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function starsText(n?: number): string {
  if (!n) return "—";
  const full = Math.round(n);
  return "★".repeat(Math.max(0, full)) + "☆".repeat(Math.max(0, 5 - full));
}

// ── BadgePill ─────────────────────────────────────────────────────────────────

interface BadgePillProps {
  label: string;
  bg: string;
  color: string;
  borderColor?: string;
}

function BadgePill({ label, bg, color, borderColor }: BadgePillProps) {
  return (
    <View
      style={[
        badgeStyles.pill,
        { backgroundColor: bg },
        borderColor ? { borderWidth: 1, borderColor } : undefined,
      ]}
    >
      <Text style={[badgeStyles.text, { color }]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
  },
  text: {
    fontFamily: fonts.monoBold,
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});

// ── AuthorRow ─────────────────────────────────────────────────────────────────

interface AuthorRowProps {
  item: FeedItem;
  forYouBadge?: boolean;
  onAuthorPress?: () => void;
}

function AuthorRow({ item, forYouBadge, onAuthorPress }: AuthorRowProps) {
  const isPro = item.communityTier === "patron";
  return (
    <TouchableOpacity
      style={authorStyles.row}
      onPress={onAuthorPress}
      activeOpacity={onAuthorPress ? 0.7 : 1}
    >
      {/* Avatar */}
      <View
        style={[
          authorStyles.avatarWrap,
          isPro ? authorStyles.avatarWrapPro : undefined,
        ]}
      >
        {item.communityAuthorAvatar ? (
          <Image
            source={{ uri: item.communityAuthorAvatar }}
            style={authorStyles.avatar}
          />
        ) : (
          <View style={[authorStyles.avatar, authorStyles.avatarFallback]}>
            <Text style={authorStyles.avatarInitial}>
              {(item.communityAuthor ?? "?")[0]?.toUpperCase()}
            </Text>
          </View>
        )}
        {isPro && (
          <View style={authorStyles.proStar}>
            <Text style={{ fontSize: 8, color: colors.gold }}>★</Text>
          </View>
        )}
      </View>

      {/* Name / meta */}
      <View style={authorStyles.meta}>
        <View style={authorStyles.nameRow}>
          <Text style={authorStyles.name} numberOfLines={1}>
            {item.communityAuthor ?? "Anonymous"}
          </Text>
          {isPro && (
            <BadgePill label="Pro" bg={colors.gold} color={colors.paper} />
          )}
          <Text style={authorStyles.dot}>·</Text>
          <Text style={authorStyles.time}>{timeAgo(item.date)}</Text>
        </View>
        {item.communityAuthorUsername ? (
          <Text style={authorStyles.username}>
            @{item.communityAuthorUsername}
          </Text>
        ) : null}
        {item.communityTag ? (
          <View style={authorStyles.tagChip}>
            <Text style={authorStyles.tagText}>{item.communityTag}</Text>
          </View>
        ) : null}
      </View>

      {/* Top-right: For You + flag */}
      <View style={authorStyles.topRight}>
        {forYouBadge && (
          <BadgePill
            label="✦ FOR YOU"
            bg="transparent"
            color={colors.gold}
            borderColor={colors.goldBorder}
          />
        )}
        <Ionicons
          name="flag-outline"
          size={14}
          color={colors.ghost}
          style={{ marginTop: forYouBadge ? 4 : 0 }}
        />
      </View>
    </TouchableOpacity>
  );
}

const authorStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
    alignItems: "flex-start",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "visible",
    position: "relative",
  },
  avatarWrapPro: {
    borderWidth: 2,
    borderColor: colors.goldBorder,
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarFallback: {
    backgroundColor: colors.goldLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarInitial: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.gold,
  },
  proStar: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.paper,
    borderRadius: radius.full,
    width: 14,
    height: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: { flex: 1 },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  name: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.ink,
    flexShrink: 1,
  },
  dot: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
  },
  time: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
  },
  username: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.ghost,
    marginTop: 1,
  },
  tagChip: {
    marginTop: 4,
    backgroundColor: colors.paperDeep,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: "flex-start",
  },
  tagText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.inkSoft,
  },
  topRight: {
    alignItems: "flex-end",
    gap: 2,
  },
});

// ── ImgPlaceholder ────────────────────────────────────────────────────────────

interface ImgPlaceholderProps {
  height: number;
  src?: string | null;
  borderRadius?: number;
  width?: number | string;
}

function ImgPlaceholder({ height, src, borderRadius = 0, width }: ImgPlaceholderProps) {
  const style: any = {
    height,
    borderRadius,
    overflow: "hidden",
  };
  if (width !== undefined) style.width = width;

  if (src) {
    return (
      <Image
        source={{ uri: src }}
        style={[style, { backgroundColor: colors.ghost }]}
        resizeMode="cover"
      />
    );
  }
  return (
    <View style={[style, { backgroundColor: "#C8BFB0", justifyContent: "center", alignItems: "center" }]}>
      <Ionicons name="image-outline" size={24} color={colors.ghost} />
    </View>
  );
}

// ── LinkPreview ───────────────────────────────────────────────────────────────

interface LinkPreviewProps {
  source?: string | null;
  title: string;
  domain?: string | null;
  image?: string | null;
}

function LinkPreview({ source, title, domain, image }: LinkPreviewProps) {
  return (
    <View style={linkStyles.container}>
      <ImgPlaceholder height={60} src={image} borderRadius={6} width={60} />
      <View style={linkStyles.right}>
        {source ? (
          <Text style={linkStyles.source} numberOfLines={1}>
            {source}
          </Text>
        ) : null}
        <Text style={linkStyles.title} numberOfLines={2}>
          {title}
        </Text>
        {domain ? (
          <Text style={linkStyles.domain} numberOfLines={1}>
            {domain}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const linkStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.paperDeep,
    borderRadius: 6,
    padding: 12,
    marginHorizontal: 14,
    gap: 10,
    alignItems: "center",
  },
  right: { flex: 1 },
  source: {
    fontFamily: fonts.mono,
    fontSize: 9,
    textTransform: "uppercase",
    color: colors.mute,
    marginBottom: 2,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ink,
    lineHeight: 18,
  },
  domain: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.ghost,
    marginTop: 2,
  },
});

// ── InlineReactionBar ─────────────────────────────────────────────────────────

interface InlineReactionBarProps {
  item: FeedItem;
  onReact?: (type: "love" | "fire" | "clap") => void;
  marginTop?: number;
}

function InlineReactionBar({ item, onReact, marginTop }: InlineReactionBarProps) {
  const love = item.reactions?.love ?? 0;
  const fire = item.reactions?.fire ?? 0;
  const clap = item.reactions?.clap ?? 0;

  return (
    <View style={[reactionStyles.bar, marginTop !== undefined ? { marginTop } : undefined]}>
      <TouchableOpacity
        style={reactionStyles.btn}
        onPress={() => onReact?.("love")}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="heart-outline" size={18} color={love > 0 ? colors.ochre : colors.mute} />
        {love > 0 && <Text style={[reactionStyles.count, love > 0 && reactionStyles.countActive]}>{love}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={reactionStyles.btn}
        onPress={() => onReact?.("fire")}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="flame-outline" size={18} color={fire > 0 ? colors.ochre : colors.mute} />
        {fire > 0 && <Text style={[reactionStyles.count, fire > 0 && reactionStyles.countActive]}>{fire}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={reactionStyles.btn}
        onPress={() => onReact?.("clap")}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="hand-left-outline" size={18} color={clap > 0 ? colors.ochre : colors.mute} />
        {clap > 0 && <Text style={[reactionStyles.count, clap > 0 && reactionStyles.countActive]}>{clap}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[reactionStyles.btn, { marginLeft: "auto" }]}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="share-outline" size={18} color={colors.ghost} />
      </TouchableOpacity>
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    paddingHorizontal: 14,
    gap: 4,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  count: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
    marginLeft: 3,
  },
  countActive: {
    color: colors.ochre,
  },
});

// ── Card Implementations ──────────────────────────────────────────────────────

// PulseCard
function PulseCard({ item, onPress, onReact }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BadgePill
            label={item.arm ?? "Pulse"}
            bg={colors.badgePulseBg}
            color={colors.badgePulseText}
          />
          {item.category ? (
            <Text style={cardStyles.eyebrow}>{item.category}</Text>
          ) : null}
          <Text style={[cardStyles.timeRight]}>{timeAgo(item.date)}</Text>
        </View>

        <Text style={[cardStyles.titleSerif, { marginTop: 10 }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.excerpt ? (
          <Text style={[cardStyles.bodySmall, { marginTop: 6 }]} numberOfLines={2}>
            {item.excerpt}
          </Text>
        ) : null}

        <View style={{ marginTop: 10 }}>
          <ImgPlaceholder height={172} src={item.image} />
        </View>

        {item.source ? (
          <Text style={[cardStyles.sourceText, { marginTop: 8 }]}>
            📰 {item.source}
          </Text>
        ) : null}
      </View>
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

// EditorialCard
function EditorialCard({ item, onPress }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BadgePill label="Editorial" bg={colors.ochre} color={colors.paper} />
          {item.category ? (
            <Text style={cardStyles.eyebrow}>{item.category}</Text>
          ) : null}
          <Text style={cardStyles.timeRight}>{timeAgo(item.date)}</Text>
        </View>

        <Text style={[cardStyles.titleSerifXl, { marginTop: 10 }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.excerpt ? (
          <Text style={[cardStyles.bodySmall, { marginTop: 6 }]} numberOfLines={3}>
            {item.excerpt}
          </Text>
        ) : null}

        <Text style={[cardStyles.readMore, { marginTop: 8 }]}>Read more →</Text>

        {(item.source || item.ogTitle) ? (
          <View style={{ marginTop: 8 }}>
            <LinkPreview
              source={item.source}
              title={item.ogTitle ?? item.title}
              domain={item.sourceUrl ?? undefined}
              image={item.ogImage}
            />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// HappeningCard
function HappeningCard({ item, onPress }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      {/* Colored header */}
      <View style={happeningStyles.header}>
        <BadgePill
          label="Happening"
          bg={colors.badgeHappeningBg}
          color={colors.badgeHappeningText}
        />
      </View>

      <View style={happeningStyles.content}>
        <Text style={happeningStyles.title} numberOfLines={2}>
          {item.title}
        </Text>

        {item.eventDate ? (
          <View style={happeningStyles.metaRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.gold} />
            <Text style={happeningStyles.metaText}>{item.eventDate}</Text>
          </View>
        ) : null}

        {item.location ? (
          <View style={[happeningStyles.metaRow, { marginTop: 4 }]}>
            <Ionicons name="location-outline" size={14} color={colors.gold} />
            <Text style={happeningStyles.metaText}>{item.location}</Text>
          </View>
        ) : null}

        <View style={happeningStyles.footer}>
          <Text style={happeningStyles.admission}>
            {item.admission ?? "Free admission"}
          </Text>
          <TouchableOpacity style={happeningStyles.rsvpBtn}>
            <Text style={happeningStyles.rsvpText}>RSVP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const happeningStyles = StyleSheet.create({
  header: {
    height: 160,
    backgroundColor: "#7C3AED",
    padding: 12,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xl,
    color: colors.ink,
    lineHeight: 32,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  admission: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.ghost,
  },
  rsvpBtn: {
    borderWidth: 1,
    borderColor: colors.ochre,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  rsvpText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.xs,
    color: colors.ochre,
  },
});

// DirectoryCard
function DirectoryCard({ item, onPress, onReact }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BadgePill
            label="Directory"
            bg={colors.badgeDirectoryBg}
            color={colors.badgeDirectoryText}
          />
          {(item.entryType || item.city) ? (
            <Text style={cardStyles.eyebrow}>
              {[item.entryType, item.city].filter(Boolean).join(" · ")}
            </Text>
          ) : null}
          <Text style={cardStyles.timeRight}>{timeAgo(item.date)}</Text>
        </View>

        <Text style={[cardStyles.titleSansBold, { marginTop: 10 }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.excerpt ? (
          <Text style={[cardStyles.bodySmall, { marginTop: 6 }]} numberOfLines={3}>
            {item.excerpt}
          </Text>
        ) : null}

        <Text style={[cardStyles.successLink, { marginTop: 8 }]}>View entry →</Text>

        {(item.source || item.ogTitle) ? (
          <View style={{ marginTop: 8 }}>
            <LinkPreview
              source={item.source}
              title={item.ogTitle ?? item.title}
              domain={item.sourceUrl ?? undefined}
              image={item.ogImage}
            />
          </View>
        ) : null}
      </View>
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

// BasicPostCard
function BasicPostCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <Text style={cardStyles.bodyMd}>{item.body ?? item.excerpt ?? ""}</Text>
      </View>
      {item.image ? (
        <View style={{ marginTop: 10 }}>
          <ImgPlaceholder height={220} src={item.image} />
        </View>
      ) : null}
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

// HiddenGemCard
function HiddenGemCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill
          label={`Hidden Gem ${starsText(item.starRating)}`}
          bg={colors.templateGemBg}
          color={colors.templateGemText}
        />
        {item.locationName ? (
          <Text style={[cardStyles.locationText, { marginTop: 6 }]}>
            📍 {item.locationName}
          </Text>
        ) : null}
        <Text style={[cardStyles.bodyMd, { marginTop: 8 }]} numberOfLines={2}>
          {item.body ?? item.excerpt ?? ""}
        </Text>
      </View>
      {item.galleryImages && item.galleryImages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
        >
          {item.galleryImages.map((src, i) => (
            <ImgPlaceholder key={i} height={130} src={src} borderRadius={6} width={180} />
          ))}
        </ScrollView>
      ) : null}
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

// CulturalTakeCard
function CulturalTakeCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill
          label="Cultural Take"
          bg={colors.templateTakeBg}
          color={colors.templateTakeText}
        />
        {item.locationName ? (
          <Text style={[cardStyles.locationText, { marginTop: 6 }]}>
            📍 {item.locationName}
          </Text>
        ) : null}
        <Text style={[cardStyles.bodyMd, { marginTop: 8 }]}>
          {item.body ?? item.excerpt ?? ""}
        </Text>
        <View style={{ marginTop: 10 }}>
          <ImgPlaceholder height={180} src={item.image} />
        </View>
      </View>
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

// FoodReviewCard
function FoodReviewCard({ item, onPress, onAuthorPress, onReact }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill
          label={`Food Review${item.foodDishName ? " · " + item.foodDishName : ""}`}
          bg={colors.templateFoodBg}
          color={colors.templateFoodText}
        />
        {item.locationName ? (
          <Text style={[cardStyles.locationText, { marginTop: 6 }]}>
            📍 {item.locationName}
          </Text>
        ) : null}
        <Text style={[cardStyles.bodyMd, { marginTop: 8 }]} numberOfLines={3}>
          {item.body ?? item.excerpt ?? ""}
        </Text>

        {/* Star ratings grid */}
        <View style={foodStyles.ratingsGrid}>
          {[
            { label: "Taste", value: item.foodRatingTaste },
            { label: "Value", value: item.foodRatingValue },
            { label: "Vibe", value: item.foodRatingVibe },
          ].map(({ label, value }) => (
            <View key={label} style={foodStyles.ratingRow}>
              <Text style={foodStyles.ratingLabel}>{label}</Text>
              <Text style={foodStyles.ratingStars}>{starsText(value)}</Text>
              <Text style={foodStyles.ratingNum}>{value ?? "—"}</Text>
            </View>
          ))}
        </View>
      </View>

      {item.galleryImages && item.galleryImages.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
        >
          {item.galleryImages.map((src, i) => (
            <ImgPlaceholder key={i} height={140} src={src} borderRadius={6} width={200} />
          ))}
        </ScrollView>
      ) : null}
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

const foodStyles = StyleSheet.create({
  ratingsGrid: { marginTop: 10, gap: 4 },
  ratingRow: { flexDirection: "row", alignItems: "center", height: 24 },
  ratingLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    width: 60,
  },
  ratingStars: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    flex: 1,
  },
  ratingNum: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    marginLeft: "auto",
  },
});

// CreativeShowcaseCard
function CreativeShowcaseCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: FeedCardProps) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const count = item.galleryImages?.length ?? 0;

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill
          label="Creative Showcase"
          bg={colors.templateShowcaseBg}
          color={colors.templateShowcaseText}
        />
      </View>
      {item.body || item.excerpt ? (
        <View style={{ paddingHorizontal: 14, marginTop: 8 }}>
          <Text style={cardStyles.bodyMd}>{item.body ?? item.excerpt}</Text>
        </View>
      ) : null}

      {item.galleryImages && item.galleryImages.length > 0 ? (
        <>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10, height: 200 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / 260);
              setActiveIdx(Math.min(idx, count - 1));
            }}
          >
            {item.galleryImages.map((src, i) => (
              <ImgPlaceholder key={i} height={200} src={src} borderRadius={6} width={260} />
            ))}
          </ScrollView>
          {count > 1 ? (
            <View style={showcaseStyles.dots}>
              {item.galleryImages.map((_, i) => (
                <View
                  key={i}
                  style={[
                    showcaseStyles.dot,
                    i === activeIdx
                      ? showcaseStyles.dotActive
                      : showcaseStyles.dotInactive,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </>
      ) : null}

      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

const showcaseStyles = StyleSheet.create({
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
    marginTop: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotActive: { backgroundColor: colors.ochre },
  dotInactive: { backgroundColor: colors.ghost },
});

// PollCard
function PollCard({ item, onPress, onAuthorPress, onReact }: FeedCardProps) {
  const options = item.pollOptions ?? [];
  const total = options.reduce((s, o) => s + o.votes, 0);
  const maxVotes = options.reduce((m, o) => Math.max(m, o.votes), 0);

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <Text style={pollStyles.question}>{item.title}</Text>
        {options.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          const isWinner = opt.votes === maxVotes && maxVotes > 0;
          return (
            <View key={i} style={pollStyles.optionWrap}>
              {/* Fill bar */}
              <View
                style={[
                  pollStyles.fillBar,
                  {
                    width: `${pct}%`,
                    backgroundColor: isWinner
                      ? "rgba(197,73,31,0.10)"
                      : colors.paperDeep,
                  },
                ]}
              />
              {/* Content */}
              <View style={pollStyles.optionInner}>
                <Text style={pollStyles.optionLabel} numberOfLines={1}>
                  {opt.text}
                </Text>
                <Text
                  style={[
                    pollStyles.optionPct,
                    isWinner ? pollStyles.optionPctWinner : undefined,
                  ]}
                >
                  {pct}%
                </Text>
              </View>
            </View>
          );
        })}
        <Text style={pollStyles.meta}>
          {total} vote{total !== 1 ? "s" : ""} · Poll closed
        </Text>
      </View>
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

const pollStyles = StyleSheet.create({
  question: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.md,
    color: colors.ink,
    marginBottom: 10,
  },
  optionWrap: {
    height: 48,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.rule,
    overflow: "hidden",
    position: "relative",
    marginBottom: 6,
  },
  fillBar: {
    position: "absolute",
    top: 0,
    left: 0,
    height: "100%",
    minWidth: 4,
  },
  optionInner: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  optionLabel: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.ink,
    flex: 1,
  },
  optionPct: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.ghost,
  },
  optionPctWinner: {
    color: colors.ochre,
  },
  meta: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    marginTop: 4,
  },
});

// ItineraryCard
function ItineraryCard({ item, onPress, onAuthorPress, onReact, forYouBadge }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <BadgePill
          label="Weekend Route"
          bg={colors.templateRouteBg}
          color={colors.templateRouteText}
        />
        {item.city ? (
          <Text style={[cardStyles.locationText, { marginTop: 6 }]}>
            📍 {item.city}
          </Text>
        ) : null}
        {item.body || item.excerpt ? (
          <Text style={[cardStyles.bodyMd, { marginTop: 8 }]} numberOfLines={2}>
            {item.body ?? item.excerpt}
          </Text>
        ) : null}

        {/* Stops list */}
        {item.itineraryStops && item.itineraryStops.length > 0 ? (
          <View style={{ marginTop: 10 }}>
            {item.itineraryStops.map((stop, i) => (
              <View key={i} style={itinStyles.stopRow}>
                <View style={itinStyles.stopNum}>
                  <Text style={itinStyles.stopNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={itinStyles.stopName}>{stop.name}</Text>
                  {stop.note ? (
                    <Text style={itinStyles.stopNote}>{stop.note}</Text>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <InlineReactionBar item={item} onReact={onReact} />
    </TouchableOpacity>
  );
}

const itinStyles = StyleSheet.create({
  stopRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  stopNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.gold,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  stopNumText: {
    fontFamily: fonts.monoBold,
    fontSize: 9,
    color: colors.paper,
  },
  stopName: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ink,
  },
  stopNote: {
    fontFamily: fonts.sans,
    fontSize: fontSize.xs,
    color: colors.mute,
    marginTop: 1,
  },
});

// QuoteCard
function QuoteCard({ item, onPress, onReact }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={quoteStyles.container}>
        {/* Large opening quote mark */}
        <Text style={quoteStyles.bigQuote}>"</Text>
        <Text style={quoteStyles.quoteText}>
          {item.title}
        </Text>
        <View style={quoteStyles.attribution}>
          {item.quoteAuthor ? (
            <Text style={quoteStyles.author}>{item.quoteAuthor}</Text>
          ) : null}
          {item.quoteAuthor && item.quoteSource ? (
            <Text style={quoteStyles.dot}>·</Text>
          ) : null}
          {item.quoteSource ? (
            <Text style={quoteStyles.source}>{item.quoteSource}</Text>
          ) : null}
        </View>
      </View>
      <InlineReactionBar item={item} onReact={onReact} marginTop={12} />
    </TouchableOpacity>
  );
}

const quoteStyles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 24,
    position: "relative",
  },
  bigQuote: {
    position: "absolute",
    top: 8,
    left: 14,
    fontFamily: fonts.serifBold,
    fontSize: 52,
    color: colors.ghost,
    lineHeight: 40,
  },
  quoteText: {
    fontFamily: fonts.serif,
    fontStyle: "italic",
    fontSize: fontSize.xl,
    color: colors.ink,
    lineHeight: 30,
    marginLeft: 8,
    marginTop: 8,
  },
  attribution: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  author: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.inkSoft,
  },
  dot: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
  },
  source: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.ghost,
  },
});

// ── Shared card styles ─────────────────────────────────────────────────────────

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: "hidden",
    ...shadows.card,
  },
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
    flex: 1,
  },
  timeRight: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.ghost,
    marginLeft: "auto",
  },
  titleSerif: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
    lineHeight: 28,
  },
  titleSerifXl: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.xl,
    color: colors.ink,
    lineHeight: 34,
  },
  titleSansBold: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.md,
    color: colors.ink,
    lineHeight: 24,
  },
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  bodyMd: {
    fontFamily: fonts.sans,
    fontSize: fontSize.md,
    color: colors.inkSoft,
    lineHeight: 24,
  },
  readMore: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.ochre,
  },
  successLink: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.sm,
    color: colors.success,
  },
  sourceText: {
    fontFamily: fonts.mono,
    fontSize: 9,
    color: colors.ghost,
  },
  locationText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
  },
});

// ── Main export ───────────────────────────────────────────────────────────────

export default function FeedCard(props: FeedCardProps) {
  const { item } = props;

  if (item.type === "quote") return <QuoteCard {...props} />;
  if (item.type === "happening") return <HappeningCard {...props} />;
  if (item.type === "directory") return <DirectoryCard {...props} />;
  if (item.type === "editorial") return <EditorialCard {...props} />;
  if (item.type === "pulse") return <PulseCard {...props} />;

  if (item.type === "community") {
    switch (item.templateType) {
      case "hidden-gem":
        return <HiddenGemCard {...props} />;
      case "cultural-take":
        return <CulturalTakeCard {...props} />;
      case "food-review":
        return <FoodReviewCard {...props} />;
      case "creative-showcase":
        return <CreativeShowcaseCard {...props} />;
      case "poll":
        return <PollCard {...props} />;
      case "itinerary":
        return <ItineraryCard {...props} />;
      default:
        return <BasicPostCard {...props} />;
    }
  }

  // Fallback
  return <BasicPostCard {...props} />;
}
