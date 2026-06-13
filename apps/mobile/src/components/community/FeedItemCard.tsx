import React, { useState } from "react";
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
import { api, MOBILE_API } from "../../api/client";
import ReactionBar from "./ReactionBar";
import HashtagText from "./HashtagText";
import ImageLightbox from "../ui/ImageLightbox";
import HappeningDetailModal from "./HappeningDetailModal";
import DirectoryDetailModal from "./DirectoryDetailModal";
import QuoteDetailModal from "./QuoteDetailModal";
import type { FeedItem, PollOption } from "../../types";

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

function shareUrlFor(item: FeedItem): string | undefined {
  if (!item.slug) return undefined;
  if (item.type === "pulse") return `https://connect.themoveee.com/pulse/${item.slug}`;
  if (item.type === "editorial") return `https://themoveee.com/magazine/${item.slug}`;
  return `https://connect.themoveee.com/community/${item.slug}`;
}

// Strip a URL from body text so it isn't duplicated when an OG snippet is shown.
function stripLinkFromBody(body?: string | null, sourceUrl?: string | null): string | undefined {
  if (!body) return body ?? undefined;
  if (!sourceUrl) return body;
  let result = body.replace(sourceUrl, "").trim();
  // Also strip any residual bare URL at the very end.
  result = result.replace(/\s*https?:\/\/\S+\s*$/, "").trim();
  return result || undefined;
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
    fontSize: fontSize.tiny,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
});

// ── Report control ────────────────────────────────────────────────────────────

type ReportState = "idle" | "confirm" | "sent" | "error";

function ReportControl({ item }: { item: FeedItem }) {
  const [state, setState] = useState<ReportState>("idle");

  const submit = async (reason: "spam" | "harassment" | "inappropriate") => {
    if (!item.wpId) return;
    try {
      await api.post(`${MOBILE_API}/community/report`, { post_id: Number(item.wpId), reason });
      setState("sent");
    } catch {
      setState("error");
    }
  };

  if (state === "idle") {
    return (
      <TouchableOpacity
        onPress={() => setState("confirm")}
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      >
        <Ionicons name="flag-outline" size={14} color={colors.ghost} />
      </TouchableOpacity>
    );
  }
  if (state === "confirm") {
    return (
      <View style={reportStyles.row}>
        {(["spam", "harassment", "inappropriate"] as const).map((r) => (
          <TouchableOpacity key={r} style={reportStyles.btn} onPress={() => submit(r)}>
            <Text style={reportStyles.btnText}>{r}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity onPress={() => setState("idle")}>
          <Text style={reportStyles.cancel}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  }
  if (state === "sent") return <Text style={reportStyles.status}>Reported — thank you.</Text>;
  return <Text style={[reportStyles.status, { color: colors.ochre }]}>Couldn't send report.</Text>;
}

const reportStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5, flexShrink: 1, flexWrap: "wrap" },
  btn: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "rgba(192,57,43,0.2)",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  btnText: { fontFamily: fonts.sans, fontSize: fontSize.tiny, color: colors.ochre },
  cancel: { fontSize: 12, color: colors.ghost },
  status: { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute },
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
    <View style={authorStyles.row}>
      {/* Avatar */}
      <TouchableOpacity
        onPress={onAuthorPress}
        activeOpacity={onAuthorPress ? 0.7 : 1}
        disabled={!onAuthorPress}
      >
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
      </TouchableOpacity>

      {/* Name / meta */}
      <View style={authorStyles.meta}>
        <TouchableOpacity
          onPress={onAuthorPress}
          activeOpacity={onAuthorPress ? 0.7 : 1}
          disabled={!onAuthorPress}
        >
          <View style={authorStyles.nameRow}>
            <Text style={authorStyles.name} numberOfLines={1}>
              {item.communityAuthor ?? "Anonymous"}
            </Text>
            {isPro && (
              <BadgePill label="Connect Pro" bg={colors.gold} color={colors.paper} />
            )}
            <Text style={authorStyles.dot}>·</Text>
            <Text style={authorStyles.time}>{timeAgo(item.date)}</Text>
          </View>
        </TouchableOpacity>
        {item.communityAuthorUsername ? (
          <Text style={authorStyles.username}>
            @{item.communityAuthorUsername}
          </Text>
        ) : null}
        {forYouBadge && (
          <View style={{ marginTop: 4 }}>
            <BadgePill
              label="✦ For You"
              bg="transparent"
              color={colors.gold}
              borderColor={colors.goldBorder}
            />
          </View>
        )}
        {item.communityTag ? (
          <View style={authorStyles.tagChip}>
            <Text style={authorStyles.tagText}>{item.communityTag}</Text>
          </View>
        ) : null}
      </View>

      {/* Top-right: report flag */}
      <View style={authorStyles.topRight}>
        <ReportControl item={item} />
      </View>
    </View>
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
    shadowColor: colors.gold,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
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
    fontSize: fontSize.tiny,
    color: colors.inkSoft,
  },
  topRight: {
    alignItems: "flex-end",
    gap: 2,
    maxWidth: 160,
  },
});

// ── ImgPlaceholder (real Image with gradient fallback) ──────────────────────────

interface ImgPlaceholderProps {
  height: number;
  src?: string | null;
  borderRadius?: number;
  width?: number | string;
  onPress?: () => void;
}

function ImgPlaceholder({ height, src, borderRadius = 0, width, onPress }: ImgPlaceholderProps) {
  const style: any = { height, borderRadius, overflow: "hidden" };
  if (width !== undefined) style.width = width;

  const content = src ? (
    <Image
      source={{ uri: src }}
      style={[style, { backgroundColor: colors.ghost }]}
      resizeMode="cover"
    />
  ) : (
    <View style={[style, { backgroundColor: "#C8BFB0", justifyContent: "center", alignItems: "center" }]}>
      <Ionicons name="image-outline" size={24} color={colors.ghost} />
    </View>
  );

  if (src && onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
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
    fontSize: fontSize.tiny,
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
    fontSize: fontSize.tiny,
    color: colors.ghost,
    marginTop: 2,
  },
});

// ── FeedReactionBar — wraps the real ReactionBar in the InlineReactionBar slot ──

function FeedReactionBar({ item, marginTop }: { item: FeedItem; marginTop?: number }) {
  if (!item.reactions || !item.wpId) {
    return null;
  }
  return (
    <View
      style={[
        reactionStyles.barWrap,
        marginTop !== undefined ? { marginTop } : undefined,
      ]}
    >
      <ReactionBar
        postId={item.wpId}
        initialCounts={item.reactions}
        shareUrl={shareUrlFor(item)}
        shareTitle={item.title || item.communityAuthor ? `${item.communityAuthor ?? "Someone"}'s post on Moveee` : undefined}
      />
    </View>
  );
}

const reactionStyles = StyleSheet.create({
  barWrap: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
});

// ── Gallery (horizontal carousel with lightbox) ─────────────────────────────────

function GalleryStrip({
  images,
  height,
  width,
  onTap,
}: {
  images: string[];
  height: number;
  width: number;
  onTap: (idx: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginTop: 10 }}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 14 }}
    >
      {images.map((src, i) => (
        <ImgPlaceholder
          key={i}
          height={height}
          src={src}
          borderRadius={6}
          width={width}
          onPress={() => onTap(i)}
        />
      ))}
    </ScrollView>
  );
}

// ── Card Implementations ──────────────────────────────────────────────────────

// PulseCard (A1)
function PulseCard({ item, onPress }: FeedCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BadgePill
              label={item.arm ?? "Pulse"}
              bg={colors.badgePulseBg}
              color={colors.badgePulseText}
            />
            {item.category ? <Text style={cardStyles.eyebrow}>{item.category}</Text> : null}
            <Text style={cardStyles.timeRight}>{timeAgo(item.date)}</Text>
          </View>

          <Text style={[cardStyles.cardTitle, { marginTop: 10 }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.excerpt ? (
            <Text style={[cardStyles.cardBody, { marginTop: 6 }]} numberOfLines={2}>
              {item.excerpt}
            </Text>
          ) : null}

          <View style={{ marginTop: 10 }}>
            <ImgPlaceholder
              height={172}
              src={item.image}
              onPress={item.image ? () => setLightboxOpen(true) : undefined}
            />
          </View>

          {item.source ? (
            <Text style={[cardStyles.sourceText, { marginTop: 8 }]}>📰 {item.source}</Text>
          ) : null}
        </View>
        <FeedReactionBar item={item} />
      </TouchableOpacity>
      {item.image && (
        <ImageLightbox
          visible={lightboxOpen}
          images={[item.image]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// EditorialCard (A2)
function EditorialCard({ item, onPress }: FeedCardProps) {
  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <View style={{ padding: 14 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <BadgePill label="Editorial" bg={colors.ochre} color={colors.paper} />
          {item.category ? <Text style={cardStyles.eyebrow}>{item.category}</Text> : null}
          <Text style={cardStyles.timeRight}>{timeAgo(item.date)}</Text>
        </View>

        <Text style={[cardStyles.cardTitleXl, { marginTop: 10 }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.excerpt ? (
          <Text style={[cardStyles.cardBody, { marginTop: 6 }]} numberOfLines={3}>
            {item.excerpt}
          </Text>
        ) : null}

        <Text style={[cardStyles.readMore, { marginTop: 8 }]}>Read more →</Text>

        {item.source || item.ogTitle ? (
          <View style={{ marginTop: 8, marginHorizontal: -14 }}>
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

// HappeningCard (A3) — full-bleed hero + detail modal on body tap
function HappeningCard({ item, onPress }: FeedCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <View style={cardStyles.card}>
        {/* Colored header / hero */}
        {item.image ? (
          <TouchableOpacity onPress={() => setLightboxOpen(true)} activeOpacity={0.92}>
            <Image source={{ uri: item.image }} style={happeningStyles.hero} resizeMode="cover" />
          </TouchableOpacity>
        ) : (
          <View style={happeningStyles.header}>
            <BadgePill
              label="Happening"
              bg={colors.badgeHappeningBg}
              color={colors.badgeHappeningText}
            />
          </View>
        )}

        <TouchableOpacity onPress={() => setModalOpen(true)} activeOpacity={0.92}>
          <View style={happeningStyles.content}>
            {item.image ? (
              <BadgePill
                label="Happening"
                bg={colors.badgeHappeningBg}
                color={colors.badgeHappeningText}
              />
            ) : null}
            <Text style={[happeningStyles.title, item.image ? { marginTop: 8 } : null]} numberOfLines={2}>
              {item.title}
            </Text>

            {item.eventDate ? (
              <View style={happeningStyles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color={colors.gold} />
                <Text style={happeningStyles.metaText}>{item.eventDate}</Text>
              </View>
            ) : null}

            {item.location || item.city ? (
              <View style={[happeningStyles.metaRow, { marginTop: 4 }]}>
                <Ionicons name="location-outline" size={14} color={colors.gold} />
                <Text style={happeningStyles.metaText} numberOfLines={1}>
                  {[item.location, item.city].filter(Boolean).join(", ")}
                </Text>
              </View>
            ) : null}

            <View style={happeningStyles.footer}>
              <Text style={happeningStyles.admission}>{item.admission ?? "Free admission"}</Text>
              <View style={happeningStyles.rsvpBtn}>
                <Text style={happeningStyles.rsvpText}>See details</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {item.image && (
        <ImageLightbox
          visible={lightboxOpen}
          images={[item.image]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
      <HappeningDetailModal visible={modalOpen} item={item} onClose={() => setModalOpen(false)} />
    </>
  );
}

const happeningStyles = StyleSheet.create({
  header: {
    height: 160,
    backgroundColor: "#7C3AED",
    padding: 12,
  },
  hero: {
    width: "100%",
    height: 200,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
    lineHeight: 26,
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
    flex: 1,
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

// DirectoryCard (A4) — detail modal on body tap
function DirectoryCard({ item }: FeedCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={() => setModalOpen(true)} activeOpacity={0.92}>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <BadgePill
              label="Directory"
              bg={colors.badgeDirectoryBg}
              color={colors.badgeDirectoryText}
            />
            {item.entryType || item.city ? (
              <Text style={cardStyles.eyebrow}>
                {[item.entryType, item.city].filter(Boolean).join(" · ")}
              </Text>
            ) : null}
            <Text style={cardStyles.timeRight}>{timeAgo(item.date)}</Text>
          </View>

          <Text style={[cardStyles.cardTitle, { marginTop: 10 }]} numberOfLines={2}>
            {item.title}
          </Text>

          {item.excerpt ? (
            <Text style={[cardStyles.cardBody, { marginTop: 6 }]} numberOfLines={3}>
              {item.excerpt}
            </Text>
          ) : null}

          <Text style={[cardStyles.successLink, { marginTop: 8 }]}>View entry →</Text>

          {item.source || item.ogTitle ? (
            <View style={{ marginTop: 8, marginHorizontal: -14 }}>
              <LinkPreview
                source={item.source}
                title={item.ogTitle ?? item.title}
                domain={item.sourceUrl ?? undefined}
                image={item.ogImage}
              />
            </View>
          ) : null}
        </View>
        <FeedReactionBar item={item} />
      </TouchableOpacity>
      <DirectoryDetailModal visible={modalOpen} item={item} onClose={() => setModalOpen(false)} />
    </>
  );
}

// BasicPostCard (B1 / B2)
function BasicPostCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const hasLink = !!(item.ogTitle || item.ogImage || item.source);
  const rawBody = item.body ?? item.excerpt ?? item.title ?? "";
  // Strip the link URL from body text when an OG snippet is shown below.
  const displayBody = hasLink ? (stripLinkFromBody(rawBody, item.sourceUrl) ?? rawBody) : rawBody;
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <HashtagText text={displayBody} style={cardStyles.cardBody} />
        </View>
        {item.image ? (
          <View style={{ marginTop: 10 }}>
            <ImgPlaceholder height={220} src={item.image} onPress={() => setLightboxOpen(true)} />
          </View>
        ) : hasLink ? (
          <View style={{ marginTop: 10 }}>
            <LinkPreview
              source={item.source}
              title={item.ogTitle ?? item.title}
              domain={item.sourceUrl ?? undefined}
              image={item.ogImage}
            />
          </View>
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      {item.image && (
        <ImageLightbox
          visible={lightboxOpen}
          images={[item.image]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// HiddenGemCard (B3)
function HiddenGemCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill
            label={`Hidden Gem ${starsText(item.starRating)}`}
            bg={colors.templateGemBg}
            color={colors.templateGemText}
          />
          {item.locationName ? (
            <Text style={[cardStyles.locationText, { marginTop: 6 }]}>📍 {item.locationName}</Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <HashtagText
              text={item.body ?? item.excerpt ?? item.title ?? ""}
              numberOfLines={2}
              style={cardStyles.cardBody}
            />
          </View>
        </View>
        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={130} width={180} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={gallery}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </>
  );
}

// CulturalTakeCard (B4)
function CulturalTakeCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill
            label="Cultural Take"
            bg={colors.templateTakeBg}
            color={colors.templateTakeText}
          />
          {item.locationName ? (
            <Text style={[cardStyles.locationText, { marginTop: 6 }]}>📍 {item.locationName}</Text>
          ) : null}
          <View style={{ marginTop: 8 }}>
            <HashtagText
              text={item.body ?? item.excerpt ?? item.title ?? ""}
              style={cardStyles.cardBody}
            />
          </View>
          <View style={{ marginTop: 10 }}>
            <ImgPlaceholder
              height={180}
              src={item.image}
              onPress={item.image ? () => setLightboxOpen(true) : undefined}
            />
          </View>
        </View>
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      {item.image && (
        <ImageLightbox
          visible={lightboxOpen}
          images={[item.image]}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}

// FoodReviewCard (B5)
function FoodReviewCard({ item, onPress, onAuthorPress }: FeedCardProps) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
        <AuthorRow item={item} onAuthorPress={onAuthorPress} />
        <View style={{ paddingHorizontal: 14 }}>
          <BadgePill
            label={`Food Review${item.foodDishName ? " · " + item.foodDishName : ""}`}
            bg={colors.templateFoodBg}
            color={colors.templateFoodText}
          />
          {item.locationName ? (
            <Text style={[cardStyles.locationText, { marginTop: 6 }]}>📍 {item.locationName}</Text>
          ) : null}
          <Text style={[cardStyles.cardBody, { marginTop: 8 }]} numberOfLines={3}>
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

        {gallery.length > 0 ? (
          <GalleryStrip images={gallery} height={140} width={200} onTap={(i) => setLightboxIdx(i)} />
        ) : null}
        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={gallery}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </>
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

// CreativeShowcaseCard (B6)
function CreativeShowcaseCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const gallery = item.galleryImages ?? [];
  const count = gallery.length;

  return (
    <>
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
            <HashtagText text={item.body ?? item.excerpt ?? ""} style={cardStyles.cardBody} />
          </View>
        ) : null}

        {count > 0 ? (
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
              {gallery.map((src, i) => (
                <ImgPlaceholder
                  key={i}
                  height={200}
                  src={src}
                  borderRadius={6}
                  width={260}
                  onPress={() => setLightboxIdx(i)}
                />
              ))}
            </ScrollView>
            {count > 1 ? (
              <View style={showcaseStyles.dots}>
                {gallery.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      showcaseStyles.dot,
                      i === activeIdx ? showcaseStyles.dotActive : showcaseStyles.dotInactive,
                    ]}
                  />
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <FeedReactionBar item={item} marginTop={10} />
      </TouchableOpacity>
      <ImageLightbox
        visible={lightboxIdx !== null}
        images={gallery}
        initialIndex={lightboxIdx ?? 0}
        onClose={() => setLightboxIdx(null)}
      />
    </>
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

// PollCard (B7) — live voting via API
function PollCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
  const initialOptions = item.pollOptions ?? [];
  const [localOpts, setLocalOpts] = useState<PollOption[]>(initialOptions);
  const [voted, setVoted] = useState(false);
  const expired = item.pollExpiresAt ? new Date(item.pollExpiresAt) < new Date() : false;

  const total = localOpts.reduce((s, o) => s + o.votes, 0);
  const maxVotes = localOpts.reduce((m, o) => Math.max(m, o.votes), 0);

  const vote = async (idx: number) => {
    if (voted || expired || !item.wpId) return;
    setVoted(true);
    setLocalOpts((prev) => prev.map((o, i) => (i === idx ? { ...o, votes: o.votes + 1 } : o)));
    try {
      await api.post(`${MOBILE_API}/community/poll-vote`, {
        post_id: Number(item.wpId),
        option_index: idx,
      });
    } catch {
      setVoted(false);
      setLocalOpts(initialOptions);
    }
  };

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.92}>
      <AuthorRow item={item} forYouBadge={forYouBadge} onAuthorPress={onAuthorPress} />
      <View style={{ paddingHorizontal: 14 }}>
        <Text style={pollStyles.question}>{item.title}</Text>
        {localOpts.map((opt, i) => {
          const pct = total > 0 ? Math.round((opt.votes / total) * 100) : 0;
          const isWinner = opt.votes === maxVotes && maxVotes > 0;
          const showResults = voted || expired;
          return (
            <TouchableOpacity
              key={i}
              style={pollStyles.optionWrap}
              onPress={() => vote(i)}
              disabled={voted || expired}
              activeOpacity={0.8}
            >
              {showResults ? (
                <View
                  style={[
                    pollStyles.fillBar,
                    {
                      width: `${pct}%`,
                      backgroundColor: isWinner ? "rgba(197,73,31,0.10)" : colors.paperDeep,
                    },
                  ]}
                />
              ) : null}
              <View style={pollStyles.optionInner}>
                <Text style={pollStyles.optionLabel} numberOfLines={1}>
                  {opt.text}
                </Text>
                {showResults ? (
                  <Text
                    style={[pollStyles.optionPct, isWinner ? pollStyles.optionPctWinner : undefined]}
                  >
                    {pct}%
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
        <Text style={pollStyles.meta}>
          {total} vote{total !== 1 ? "s" : ""}
          {expired ? " · Poll closed" : voted ? " · You voted" : ""}
        </Text>
      </View>
      <FeedReactionBar item={item} marginTop={10} />
    </TouchableOpacity>
  );
}

const pollStyles = StyleSheet.create({
  question: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
    lineHeight: 26,
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

// ItineraryCard (B8)
function ItineraryCard({ item, onPress, onAuthorPress, forYouBadge }: FeedCardProps) {
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
          <Text style={[cardStyles.locationText, { marginTop: 6 }]}>📍 {item.city}</Text>
        ) : null}
        {item.body || item.excerpt ? (
          <Text style={[cardStyles.cardBody, { marginTop: 8 }]} numberOfLines={2}>
            {item.body ?? item.excerpt}
          </Text>
        ) : null}

        {item.itineraryStops && item.itineraryStops.length > 0 ? (
          <View style={{ marginTop: 10 }}>
            {item.itineraryStops.map((stop, i) => (
              <View key={i} style={itinStyles.stopRow}>
                <View style={itinStyles.stopNum}>
                  <Text style={itinStyles.stopNumText}>{i + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={itinStyles.stopName}>{stop.name}</Text>
                  {stop.note ? <Text style={itinStyles.stopNote}>{stop.note}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
      <FeedReactionBar item={item} marginTop={10} />
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
    fontSize: fontSize.tiny,
    color: colors.paper,
  },
  stopName: {
    fontFamily: fonts.sans,
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

// QuoteCard — detail modal on tap
function QuoteCard({ item }: FeedCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={cardStyles.card} onPress={() => setModalOpen(true)} activeOpacity={0.92}>
        <View style={quoteStyles.container}>
          <Text style={quoteStyles.bigQuote}>"</Text>
          <Text style={quoteStyles.quoteText}>{item.title}</Text>
          <View style={quoteStyles.attribution}>
            {item.quoteAuthor ? <Text style={quoteStyles.author}>{item.quoteAuthor}</Text> : null}
            {item.quoteAuthor && item.quoteSource ? (
              <Text style={quoteStyles.dot}>·</Text>
            ) : null}
            {item.quoteSource ? <Text style={quoteStyles.source}>{item.quoteSource}</Text> : null}
          </View>
        </View>
        <FeedReactionBar item={item} marginTop={4} />
      </TouchableOpacity>
      <QuoteDetailModal visible={modalOpen} item={item} onClose={() => setModalOpen(false)} />
    </>
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
  cardTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
    lineHeight: 26,
  },
  cardBody: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.inkSoft,
    lineHeight: 20,
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
    fontSize: fontSize.tiny,
    color: colors.ghost,
  },
  locationText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
  },
});

// ── Main export ───────────────────────────────────────────────────────────────

export default function FeedItemCard(props: FeedCardProps) {
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

  return <BasicPostCard {...props} />;
}
