import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Dimensions, Image,
  Modal, Share,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { api, MOBILE_API } from "../../api/client";
import { openInApp } from "../../utils/openInApp";
import { fonts, fontSize, radius, shadows } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { Member, FeedItem, TemplateType } from "../../types";
import { BADGE_META, badgeTitleCase } from "../../constants/badges";
import PostDetailSheet from "../../components/community/PostDetailSheet";
import { useAuthStore } from "../../auth/authStore";
import { ProGlowRing } from "../../components/community/FeedItemCard";

const { width: SCREEN_W } = Dimensions.get("window");

// ── Reputation tiers ──────────────────────────────────────────────────────────

const REP_TIERS = [
  { slug: "member",             label: "Member",             min: 0,     max: 500   },
  { slug: "culture-contributor",label: "Culture Contributor",min: 500,   max: 2500  },
  { slug: "taste-maker",        label: "Taste Maker",        min: 2500,  max: 10000 },
  { slug: "culture-authority",  label: "Culture Authority",  min: 10000, max: 25000 },
  { slug: "culture-icon",       label: "Culture Icon",       min: 25000, max: null  },
] as const;

function getRepTier(rep: number) {
  return [...REP_TIERS].reverse().find((t) => rep >= t.min) ?? REP_TIERS[0];
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicProfile extends Member {
  interests?: string[];
  badges?: string[];
  registeredAt?: number;
  reputation?: number;
  reputationTier?: string;
  followersCount?: number;
  followingCount?: number;
  isFollowing?: boolean;
}

interface CommunityPost {
  id: string;
  content: string;
  imageUrl?: string | null;
  publishedAt: string;
  likeCount: number;
  commentCount: number;
  template_type: string;
  // Remaining template fields come through as snake_case from
  // Culture_Mobile_API::format_community_post() — see that method for the full list.
  [key: string]: any;
}

// Map the slim `member/{id}/posts` response (snake_case) onto the FeedItem
// shape PostDetailSheet expects (camelCase) so a tap can open the same sheet
// used by the main feed.
function mapPostToFeedItem(post: CommunityPost, profile: PublicProfile): FeedItem {
  return {
    id: `community-${post.id}`,
    wpId: post.id,
    type: "community",
    title: post.content,
    slug: "",
    date: post.publishedAt,
    image: post.imageUrl ?? null,
    href: "",
    communityAuthorId: profile.id,
    communityAuthor: profile.displayName,
    communityAuthorUsername: profile.username,
    communityAuthorAvatar: profile.avatarUrl,
    commentCount: post.commentCount,
    templateType: post.template_type as TemplateType,
    linkedDirectoryId: post.linked_directory_id || undefined,
    starRating: post.star_rating || undefined,
    locationName: post.location_name || "",
    pollOptions: post.poll_options || [],
    pollExpiresAt: post.poll_expires_at || "",
    pollDescription: post.poll_description || "",
    galleryImages: post.gallery_images || [],
    videoUrl: post.video_url || "",
    itineraryStops: post.itinerary_stops || [],
    itineraryTitle: post.itinerary_title || "",
    itineraryCity: post.itinerary_city || "",
    itineraryBudget: post.itinerary_budget || "",
    itineraryDuration: post.itinerary_duration || "",
    itineraryBestTime: post.itinerary_best_time || "",
    foodDishName: post.food_dish_name || "",
    foodRatingTaste: post.food_rating_taste || undefined,
    foodRatingValue: post.food_rating_value || undefined,
    foodRatingVibe: post.food_rating_vibe || undefined,
    cuisineTag: post.cuisine_tag || "",
    priceRange: post.price_range || "",
    placeName: post.place_name || "",
    placeLocation: post.place_location || "",
    openingHours: post.opening_hours || "",
    culturalTakeHeadline: post.cultural_take_headline || "",
    showcaseTitle: post.showcase_title || "",
    showcaseMedium: post.showcase_medium || "",
    showcaseCollaborator: post.showcase_collaborator || "",
    showcaseCollaboratorUsername: post.showcase_collaborator_username || "",
    bookTitle: post.book_title || "",
    bookAuthor: post.book_author || "",
    bookStatus: post.book_status || "",
    bookOverallRating: post.book_overall_rating || undefined,
    bookRatingWriting: post.book_rating_writing || undefined,
    bookRatingStory: post.book_rating_story || undefined,
    bookRatingCharacters: post.book_rating_characters || undefined,
    bookRatingPacing: post.book_rating_pacing || undefined,
    bookFavQuote: post.book_fav_quote || "",
    bookRecommend: !!post.book_recommend,
    bookGenres: post.book_genres || [],
    reactions: { love: 0, fire: 0, clap: 0 },
  };
}

interface PortfolioItem {
  id: string;
  title: string;
  created_at: string;
  media?: Array<{ type: string; url: string }>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSocialUrl(platform: "instagram" | "linkedin" | "website" | "twitter", value: string): string {
  const v = value.trim();
  if (/^https?:\/\//i.test(v)) return v;
  if (platform === "instagram") return `https://instagram.com/${v.replace(/^@/, "")}`;
  if (platform === "linkedin") return `https://linkedin.com/${v.replace(/^\//, "")}`;
  if (platform === "twitter") return `https://twitter.com/${v.replace(/^@/, "")}`;
  return `https://${v}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function initials(name: string) {
  return (name || "?").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function formatMemberSince(ts?: number): string {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  return `Member since ${d.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
}

const TEMPLATE_META: Record<string, { emoji: string; label: string }> = {
  post:                { emoji: "📝", label: "Post" },
  "hidden-gem":        { emoji: "💎", label: "Hidden Gem" },
  "cultural-take":     { emoji: "💬", label: "Cultural Take" },
  "food-review":       { emoji: "🍽", label: "Food Review" },
  "creative-showcase": { emoji: "🎨", label: "Creative Showcase" },
  poll:                { emoji: "📊", label: "Poll" },
  itinerary:           { emoji: "🗺", label: "Itinerary" },
  event:               { emoji: "📅", label: "Event" },
  quote:               { emoji: "✦", label: "Quote" },
};

const PORTFOLIO_GRADIENTS: Array<[string, string]> = [
  ["#FF9A9E", "#FECFEF"], ["#F6D365", "#FDA085"], ["#84FAB0", "#8FD3F4"],
  ["#A18CD1", "#FBC2EB"], ["#FBC2EB", "#A6C1EE"],
];

const TIER_ICONS: Record<string, string> = {
  "member":              "★",
  "culture-contributor": "✦",
  "taste-maker":         "◆",
  "culture-authority":   "❖",
  "culture-icon":        "✸",
};

// ── Sub-components ────────────────────────────────────────────────────────────

// Tier chip — shows earned tier only (no progress details for other members)
function TierChip({
  reputation = 0, styles, c,
}: {
  reputation?: number; styles: ReturnType<typeof createStyles>; c: ColorPalette;
}) {
  const tier = getRepTier(reputation);
  const icon = TIER_ICONS[tier.slug] ?? "★";
  return (
    <View style={styles.tierChip}>
      <Text style={styles.tierChipIcon}>{icon}</Text>
      <Text style={styles.tierChipLabel}>{tier.label}</Text>
    </View>
  );
}

// Badge icon-only row — tap shows tooltip modal
function BadgeRow({
  badges, styles, c,
}: {
  badges: { slug: string; name: string; emoji: string; description: string }[];
  styles: ReturnType<typeof createStyles>;
  c: ColorPalette;
}) {
  const [tooltip, setTooltip] = useState<{ name: string; emoji: string; description: string } | null>(null);
  if (!badges.length) return null;
  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.badgeRow}
        style={styles.badgeRowWrap}
      >
        {badges.map((b, i) => (
          <TouchableOpacity
            key={b.slug ?? i}
            style={styles.badgeIcon}
            onPress={() => setTooltip({ name: b.name, emoji: b.emoji, description: b.description })}
            activeOpacity={0.7}
          >
            <Text style={styles.badgeEmoji}>{b.emoji}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={!!tooltip}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltip(null)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setTooltip(null)}
        >
          <View style={styles.tooltipBox}>
            <Text style={styles.tooltipEmoji}>{tooltip?.emoji}</Text>
            <Text style={styles.tooltipName}>{tooltip?.name}</Text>
            {tooltip?.description ? <Text style={styles.tooltipDescription}>{tooltip.description}</Text> : null}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function MiniPostCard({
  post, styles, onPress, isSelf, isPinned, onTogglePin,
}: {
  post: CommunityPost; styles: ReturnType<typeof createStyles>; onPress: () => void;
  isSelf?: boolean; isPinned?: boolean; onTogglePin?: () => void;
}) {
  const meta = TEMPLATE_META[post.template_type] ?? { emoji: "📝", label: "Post" };
  return (
    <TouchableOpacity style={styles.postCard} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.postCardHeader}>
        <View style={styles.templateBadge}>
          <Text style={styles.templateBadgeText}>{meta.emoji} {meta.label}</Text>
        </View>
        <Text style={styles.postTimeAgo}>{timeAgo(post.publishedAt)}</Text>
        {isSelf && onTogglePin && (
          <TouchableOpacity onPress={onTogglePin} style={styles.pinBtn} hitSlop={8}>
            <Ionicons name={isPinned ? "bookmark" : "bookmark-outline"} size={16} color={isPinned ? "#C5491F" : styles.postMeta.color as string} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.postExcerpt} numberOfLines={2}>{post.content}</Text>
      <View style={styles.postMetaRow}>
        <Text style={styles.postMeta}>❤️ {post.likeCount}</Text>
        <Text style={styles.postMeta}>💬 {post.commentCount}</Text>
      </View>
    </TouchableOpacity>
  );
}

function PortfolioGrid({ items, pinnedPosts, isOwnProfile, styles, c, onPressPinned, onUnpin, onAdd }: {
  items: PortfolioItem[]; pinnedPosts: CommunityPost[]; isOwnProfile: boolean;
  styles: ReturnType<typeof createStyles>; c: ColorPalette;
  onPressPinned: (post: CommunityPost) => void; onUnpin: (post: CommunityPost) => void;
  onAdd: () => void;
}) {
  const colW = (SCREEN_W - 32 - 8) / 2;
  if (items.length === 0 && pinnedPosts.length === 0 && !isOwnProfile) {
    return <Text style={styles.emptyTabText}>No portfolio items yet.</Text>;
  }
  return (
    <View>
      {pinnedPosts.map((post) => (
        <MiniPostCard
          key={`pin-${post.id}`}
          post={post}
          styles={styles}
          onPress={() => onPressPinned(post)}
          isSelf={isOwnProfile}
          isPinned
          onTogglePin={() => onUnpin(post)}
        />
      ))}
      <View style={styles.portfolioGrid}>
        {items.map((item, i) => {
          const imageUrl = item.media?.find((m) => m.type === "image")?.url;
          const year = item.created_at ? new Date(item.created_at).getFullYear() : "";
          return (
            <View key={item.id} style={[styles.portfolioItem, { width: colW }]}>
              <View style={styles.portfolioImage}>
                {imageUrl
                  ? <Image source={{ uri: imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                  : <View style={[StyleSheet.absoluteFill, { backgroundColor: PORTFOLIO_GRADIENTS[i % PORTFOLIO_GRADIENTS.length][0] }]} />
                }
              </View>
              <Text style={styles.portfolioTitle} numberOfLines={1}>{item.title}</Text>
              <Text style={styles.portfolioYear}>{year}</Text>
            </View>
          );
        })}
        {isOwnProfile && (
          <TouchableOpacity
            style={[styles.portfolioAddBtn, { width: colW }]}
            onPress={onAdd}
          >
            <Ionicons name="add" size={20} color={c.ghost} />
            <Text style={styles.portfolioAddText}>Add portfolio item</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MemberProfileScreen() {
  const { params } = useRoute<any>();
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const currentUser = useAuthStore((s) => s.user);

  const [profile,   setProfile]   = useState<PublicProfile | null>(null);
  const [posts,     setPosts]     = useState<CommunityPost[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<CommunityPost[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [postPage,  setPostPage]  = useState(1);
  const [activeTab, setActiveTab] = useState<"community" | "portfolio">("community");
  const [sheetItem, setSheetItem] = useState<FeedItem | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [notifyPosts, setNotifyPosts] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);

  useEffect(() => {
    const uid = params.userId;
    const username = params.username;
    const url = uid
      ? `${MOBILE_API}/member/${uid}`
      : username
      ? `${MOBILE_API}/member/by-username/${encodeURIComponent(username)}`
      : null;
    if (!url) { setLoading(false); return; }
    api.get<PublicProfile>(url)
      .then((p) => {
        setProfile(p);
        setIsFollowing(!!p.isFollowing);
        setFollowersCount(p.followersCount ?? 0);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [params.userId, params.username]);

  useEffect(() => {
    if (!profile) return;
    api.get<{ posts: CommunityPost[]; hasMore: boolean }>(
      `${MOBILE_API}/member/${profile.id}/posts?page=${postPage}&per_page=10`
    ).then((d) => setPosts((prev) => postPage === 1 ? (d?.posts ?? []) : [...prev, ...(d?.posts ?? [])])).catch(() => {});
  }, [profile, postPage]);

  useEffect(() => {
    if (!profile || activeTab !== "portfolio") return;
    api.get<{ items: PortfolioItem[]; pinned_posts_data: CommunityPost[] }>(`${MOBILE_API}/portfolio?user_id=${profile.id}`)
      .then((d) => {
        setPortfolio(d?.items ?? []);
        setPinnedPosts(d?.pinned_posts_data ?? []);
      }).catch(() => {});
  }, [profile, activeTab]);

  const togglePin = async (post: CommunityPost, pinned: boolean) => {
    try {
      await api.post(`${MOBILE_API}/portfolio/pin`, { post_id: Number(post.id), pinned });
      setPinnedPosts((prev) => pinned ? [...prev, post] : prev.filter((p) => p.id !== post.id));
    } catch { /* ignore */ }
  };

  const isPro = profile?.tier === "patron";
  const isSelf = !!currentUser && !!profile && String(currentUser.id) === String(profile.id);

  const toggleFollow = async () => {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    try {
      if (isFollowing) {
        const res = await api.post<{ isFollowing: boolean; followersCount: number }>(
          `${MOBILE_API}/unfollow`, { user_id: profile.id }
        );
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
        setNotifyPosts(false);
      } else {
        const res = await api.post<{ isFollowing: boolean; followersCount: number }>(
          `${MOBILE_API}/follow`, { user_id: profile.id, notify_posts: notifyPosts }
        );
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
      }
    } catch { /* ignore */ }
    setFollowBusy(false);
  };

  const toggleNotify = async () => {
    if (!profile) return;
    const next = !notifyPosts;
    setNotifyPosts(next);
    try {
      await api.post(`${MOBILE_API}/follow/notify`, { user_id: profile.id, notify_posts: next });
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!profile?.username) return;
    const url = `https://web.themoveee.com/${profile.username}`;
    try {
      await Share.share({ message: `Check out ${profile.displayName} on Moveee: ${url}`, url });
    } catch { /* user cancelled */ }
  };

  if (loading) return <SafeAreaView style={styles.container}><View style={styles.center}><ActivityIndicator color={c.gold} /></View></SafeAreaView>;
  if (!profile) return <SafeAreaView style={styles.container}><View style={styles.center}><Text style={styles.errorText}>Member not found.</Text></View></SafeAreaView>;

  const badges = (profile.badges ?? []).map((b: any) => {
    if (typeof b !== "string") return b;
    const meta = BADGE_META[b];
    return meta
      ? { slug: b, name: meta.name, emoji: meta.emoji, description: meta.description }
      : { slug: b, name: badgeTitleCase(b), emoji: "🏅", description: "" };
  });
  const hasSocial = !!(profile.instagram || profile.linkedin || profile.website || profile.twitter);
  const rep       = profile.reputation ?? 0;

  return (
    <View style={styles.outerContainer}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {profile.coverPhotoUrl ? (
          <Image source={{ uri: profile.coverPhotoUrl }} style={styles.hero} resizeMode="cover" />
        ) : (
          <LinearGradient
            colors={["#F3ECE0", "#E8D3BA", "#C5491F"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          />
        )}

        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={c.ink} />
          </TouchableOpacity>

          <View style={[styles.avatarRing, isPro ? styles.avatarRingPro : styles.avatarRingCitizen]}>
            {isPro && <ProGlowRing color={c.gold} />}
            <View style={styles.avatarInner}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials(profile.displayName)}</Text>
              )}
            </View>
          </View>

          <View style={styles.identity}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{profile.displayName}</Text>
              {isPro && (
                <View style={styles.proBadgePill}>
                  <Ionicons name="ribbon" size={9} color="#fff" />
                </View>
              )}
            </View>
            {profile.username    ? <Text style={styles.profileHandle}>@{profile.username}</Text> : null}
            {profile.occupation  ? <Text style={styles.profileOccupation}>{profile.occupation}</Text> : null}
            {(profile.city || profile.countryOfResidence) ? (
              <Text style={styles.profileCity}>
                📍 {[profile.city, profile.countryOfResidence].filter(Boolean).join(", ")}
              </Text>
            ) : null}
            {profile.registeredAt ? <Text style={styles.profileSince}>{formatMemberSince(profile.registeredAt)}</Text> : null}
          </View>

          {/* Reputation tier chip */}
          <TierChip reputation={rep} styles={styles} c={c} />

          {!isSelf && (
            <View style={styles.followRow}>
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
                disabled={followBusy}
              >
                <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                  {isFollowing ? "Following" : "Follow"}
                </Text>
              </TouchableOpacity>
              <Text style={styles.followersCountText}>
                <Text style={styles.followersCountStrong}>{followersCount.toLocaleString()}</Text> followers
              </Text>
            </View>
          )}
          {!isSelf && isFollowing && (
            <TouchableOpacity style={styles.notifyToggleRow} onPress={toggleNotify}>
              <Ionicons
                name={notifyPosts ? "checkbox" : "square-outline"}
                size={16}
                color={notifyPosts ? c.ochre : c.ghost}
              />
              <Text style={styles.notifyToggleText}>Notify me when they post</Text>
            </TouchableOpacity>
          )}

          {/* Badges — icon only, tap for name */}
          <BadgeRow badges={badges} styles={styles} c={c} />

          {hasSocial && (
            <View style={styles.socialRow}>
              {profile.instagram && (
                <TouchableOpacity style={styles.socialBtn} onPress={() => openInApp(toSocialUrl("instagram", profile.instagram!))}>
                  <Ionicons name="logo-instagram" size={18} color={c.ghost} />
                </TouchableOpacity>
              )}
              {profile.linkedin && (
                <TouchableOpacity style={styles.socialBtn} onPress={() => openInApp(toSocialUrl("linkedin", profile.linkedin!))}>
                  <Ionicons name="logo-linkedin" size={18} color={c.ghost} />
                </TouchableOpacity>
              )}
              {profile.website && (
                <TouchableOpacity style={styles.socialBtn} onPress={() => openInApp(toSocialUrl("website", profile.website!))}>
                  <Ionicons name="globe-outline" size={18} color={c.ghost} />
                </TouchableOpacity>
              )}
              {profile.twitter && (
                <TouchableOpacity style={styles.socialBtn} onPress={() => openInApp(toSocialUrl("twitter", profile.twitter!))}>
                  <Ionicons name="logo-twitter" size={18} color={c.ghost} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View style={styles.tabBar}>
            {(["community", "portfolio"] as const).map((t) => (
              <TouchableOpacity key={t} style={[styles.tab, activeTab === t && styles.tabActive]} onPress={() => setActiveTab(t)}>
                <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.tabContent}>
            {activeTab === "community" ? (
              <>
                {posts.map((p) => (
                  <MiniPostCard
                    key={p.id}
                    post={p}
                    styles={styles}
                    onPress={() => setSheetItem(mapPostToFeedItem(p, profile))}
                    isSelf={isSelf}
                    isPinned={pinnedPosts.some((pp) => pp.id === p.id)}
                    onTogglePin={() => togglePin(p, !pinnedPosts.some((pp) => pp.id === p.id))}
                  />
                ))}
                {posts.length > 0 && (
                  <TouchableOpacity style={styles.loadMore} onPress={() => setPostPage((n) => n + 1)}>
                    <Text style={styles.loadMoreText}>Load more posts</Text>
                  </TouchableOpacity>
                )}
                {posts.length === 0 && <Text style={styles.emptyTabText}>No posts yet.</Text>}
              </>
            ) : (
              <PortfolioGrid
                items={portfolio}
                pinnedPosts={pinnedPosts}
                isOwnProfile={isSelf}
                styles={styles}
                c={c}
                onPressPinned={(post) => setSheetItem(mapPostToFeedItem(post, profile))}
                onUnpin={(post) => togglePin(post, false)}
                onAdd={() => nav.navigate("NewPortfolioItem" as any)}
              />
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
        <Ionicons name="chevron-back" size={20} color={c.ink} />
      </TouchableOpacity>

      <PostDetailSheet item={sheetItem} visible={sheetItem !== null} onClose={() => setSheetItem(null)} />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    outerContainer: { flex: 1, backgroundColor: c.paper },
    container:      { flex: 1, backgroundColor: c.paper },
    scroll:         { flex: 1 },
    scrollContent:  { flexGrow: 1 },
    center:         { flex: 1, justifyContent: "center", alignItems: "center" },
    errorText:      { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute },
    hero:           { width: "100%", height: 200 },

    backBtn: {
      position: "absolute", top: 56, left: 16,
      width: 40, height: 40, borderRadius: 20, backgroundColor: c.paper,
      justifyContent: "center", alignItems: "center", ...shadows.card,
    },

    profileCard: {
      flexGrow: 1,
      backgroundColor: c.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
      marginTop: -40, zIndex: 10, paddingBottom: 24, alignItems: "center",
    },

    shareBtn: {
      position: "absolute", top: 16, right: 16,
      width: 36, height: 36, borderRadius: 18,
      borderWidth: 1, borderColor: c.ghost,
      justifyContent: "center", alignItems: "center",
    },

    avatarRing: {
      width: 96, height: 96, borderRadius: 48, borderWidth: 3, padding: 3,
      backgroundColor: c.paper, marginTop: -48,
      position: "relative", overflow: "visible",
    },
    avatarRingPro: {
      borderColor: c.gold,
      shadowColor: c.gold,
      shadowOpacity: 0.85,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 0 },
      elevation: 12,
    },
    avatarRingCitizen: { borderColor: c.ghost },
    avatarInner: {
      flex: 1, borderRadius: 44, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center", overflow: "hidden",
    },
    avatarImage: {
      width: "100%", height: "100%",
    },
    avatarInitials: { fontFamily: fonts.monoBold, fontSize: 18, color: c.inkSoft },

    tierBadge: {
      marginTop: 8, marginBottom: 4, backgroundColor: c.gold,
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full,
      flexDirection: "row", alignItems: "center", gap: 4,
    },
    tierBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: c.paper, letterSpacing: 1.4, textTransform: "uppercase" },

    identity:          { alignItems: "center", paddingHorizontal: 16, marginTop: 12, gap: 2 },
    profileNameRow:    { flexDirection: "row", alignItems: "center", gap: 4 },
    profileName:       { fontFamily: fonts.serifBold, fontSize: 24, color: c.ink },
    proBadgePill: {
      backgroundColor: c.gold,
      borderRadius: 4,
      paddingHorizontal: 4,
      paddingVertical: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    profileHandle:     { fontFamily: fonts.mono, fontSize: 13, color: c.mute, marginTop: 2 },
    profileOccupation: { fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft, marginTop: 4, textAlign: "center" },
    profileCity:       { fontFamily: fonts.sans, fontSize: 12, color: c.mute, marginTop: 4 },
    profileSince:      { fontFamily: fonts.mono, fontSize: 10, color: c.ghost, marginTop: 8 },

    // Reputation tier chip
    tierChip: {
      flexDirection: "row", alignItems: "center", gap: 6,
      marginTop: 16, paddingHorizontal: 14, paddingVertical: 7,
      backgroundColor: c.paperDeep, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost,
    },
    tierChipIcon:  { fontSize: 13, color: c.ochre },
    tierChipLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink, letterSpacing: 0.3 },

    // Follow button + followers count
    followRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 },
    followBtn: {
      paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.full,
      borderWidth: 1, borderColor: c.ghost, backgroundColor: c.paper,
    },
    followBtnActive: { borderColor: c.ochre, backgroundColor: c.paperDeep },
    followBtnText: { fontFamily: fonts.sansBold, fontSize: 12, color: c.ink, letterSpacing: 0.3 },
    followBtnTextActive: { color: c.ochre },
    followersCountText: { fontFamily: fonts.mono, fontSize: 11, color: c.mute },
    followersCountStrong: { color: c.ink, fontFamily: fonts.monoBold },
    notifyToggleRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
    notifyToggleText: { fontFamily: fonts.sans, fontSize: 11, color: c.inkSoft },

    // Badge row — icon only
    badgeRowWrap: { marginTop: 16, width: "100%" },
    badgeRow:     { paddingHorizontal: 20, gap: 10, flexGrow: 1, justifyContent: "center" },
    badgeIcon: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.paperDeep, borderWidth: 1, borderColor: c.ghost,
      justifyContent: "center", alignItems: "center",
    },
    badgeEmoji: { fontSize: 20 },

    // Badge tooltip modal
    tooltipOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.35)",
      justifyContent: "center", alignItems: "center",
    },
    tooltipBox: {
      backgroundColor: c.ink, borderRadius: 14,
      paddingHorizontal: 28, paddingVertical: 20,
      alignItems: "center", gap: 8, minWidth: 160, maxWidth: 260,
    },
    tooltipEmoji: { fontSize: 36 },
    tooltipName:  { fontFamily: fonts.sansBold, fontSize: 15, color: c.paper, textAlign: "center" },
    tooltipDescription: { fontFamily: fonts.sans, fontSize: 13, color: c.paper, opacity: 0.8, textAlign: "center" },

    socialRow: { flexDirection: "row", gap: 24, marginTop: 16 },
    socialBtn: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: c.paperDeep,
      justifyContent: "center", alignItems: "center",
    },

    tabBar: {
      flexDirection: "row", alignItems: "flex-end",
      height: 44, width: "100%",
      borderBottomWidth: 1, borderBottomColor: c.ghost,
      marginTop: 16, paddingHorizontal: 16, gap: 24,
    },
    tab:           { paddingBottom: 6 },
    tabActive:     { borderBottomWidth: 2, borderBottomColor: c.ochre, paddingBottom: 1 },
    tabText:       { fontFamily: fonts.sans, fontSize: 14, color: c.mute },
    tabTextActive: { fontFamily: fonts.sansBold, color: c.ink },

    tabContent: {
      width: "100%", backgroundColor: c.paper,
      paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24, gap: 8,
    },

    postCard:       { backgroundColor: c.paper, borderRadius: 8, padding: 16, marginBottom: 8, ...shadows.card },
    postCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    templateBadge:     { backgroundColor: c.paperDeep, borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 4 },
    templateBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: c.ink },
    postTimeAgo:   { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    postExcerpt:   { fontFamily: fonts.sans, fontSize: 13, color: c.inkSoft, lineHeight: 20 },
    postMetaRow:   { flexDirection: "row", gap: 16, marginTop: 12 },
    postMeta:      { fontFamily: fonts.mono, fontSize: 10, color: c.mute },
    pinBtn:        { marginLeft: 8 },

    loadMore:     { marginTop: 8, alignItems: "center", paddingVertical: 8 },
    loadMoreText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
    emptyTabText: { fontFamily: fonts.sans, fontSize: 14, color: c.ghost, textAlign: "center", paddingVertical: 32 },

    portfolioGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    portfolioItem:   { marginBottom: 4 },
    portfolioImage:  { width: "100%", height: 120, borderRadius: 8 },
    portfolioTitle:  { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, marginTop: 6 },
    portfolioYear:   { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 2 },
    portfolioAddBtn: {
      height: 120, borderWidth: 1.5, borderStyle: "dashed", borderColor: c.ghost,
      borderRadius: 8, backgroundColor: c.paperWarm,
      justifyContent: "center", alignItems: "center", gap: 6,
    },
    portfolioAddText: { fontFamily: fonts.sans, fontSize: 12, color: c.mute },
  });
}
