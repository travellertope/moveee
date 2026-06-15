import React, { useMemo, useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Share,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { LinearGradient } from "expo-linear-gradient";
import { useArticle } from "../../features/magazine/useMagazine";
import { WP_URL, api, MOBILE_API, CULTURE_API } from "../../api/client";
import { openInApp } from "../../utils/openInApp";
import type { Article } from "../../types";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";
import { ArticleSkeleton } from "../../components/ui/Skeleton";
import { useAuthStore } from "../../auth/authStore";
import BottomSheet from "../../components/ui/BottomSheet";

const HERO_HEIGHT = 280;
const SHEET_OVERLAP = 32;
const HEADER_TRIGGER = HERO_HEIGHT - 60;

function makeHtmlTagStyles(c: ColorPalette) {
  return {
    p:          { fontSize: 16, lineHeight: 26, color: c.inkSoft, marginBottom: 14 },
    a:          { color: c.gold, textDecorationLine: "underline" as const },
    h2:         { fontSize: 20, fontWeight: "700" as const, color: c.ink, marginTop: 8, marginBottom: 10 },
    h3:         { fontSize: 18, fontWeight: "700" as const, color: c.ink, marginTop: 6, marginBottom: 8 },
    blockquote: { borderLeftWidth: 3, borderLeftColor: c.ochre, paddingLeft: 12, fontStyle: "italic" as const, color: c.mute },
    img:        { borderRadius: 6 },
    figcaption: { fontSize: 11, color: c.mute, textAlign: "center" as const, marginTop: 4 },
  };
}

// Minimal TOC heading extraction from HTML
function extractHeadings(html: string): Array<{ id: string; text: string; level: number }> {
  const headings: Array<{ id: string; text: string; level: number }> = [];
  const re = /<h([23])[^>]*>(.*?)<\/h\1>/gi;
  let m: RegExpExecArray | null;
  let idx = 0;
  while ((m = re.exec(html)) !== null) {
    const text = m[2].replace(/<[^>]+>/g, "").trim();
    if (text) {
      headings.push({ id: `h${idx++}`, text, level: parseInt(m[1], 10) });
    }
  }
  return headings;
}

function ArticleBody({ article, colors: c }: { article: Article; colors: ColorPalette }) {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const contentWidth = width - 64;
  const HTML_TAG_STYLES = useMemo(() => makeHtmlTagStyles(c), [c]);

  const handleLinkPress = (_event: unknown, href: string) => {
    const m = href.match(
      new RegExp(`^${WP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?:magazine|stories?)?/?([^/?#]+)/?$`)
    );
    if (m?.[1]) {
      nav.push("Article", { slug: m[1] });
      return;
    }
    openInApp(href);
  };

  return (
    <RenderHtml
      contentWidth={contentWidth}
      source={{ html: article.content }}
      tagsStyles={HTML_TAG_STYLES}
      renderersProps={{ a: { onPress: handleLinkPress } }}
    />
  );
}

// ── Article Reaction Row ──────────────────────────────────────────────────────

const REACTIONS = [
  { key: "love",  emoji: "❤️" },
  { key: "fire",  emoji: "🔥" },
  { key: "clap",  emoji: "👏" },
] as const;

type ReactionKey = typeof REACTIONS[number]["key"];

function ReactionRow({ articleId, initialCounts, c }: {
  articleId: string;
  initialCounts?: Partial<Record<ReactionKey, number>>;
  c: ColorPalette;
}) {
  const [counts, setCounts] = useState<Record<ReactionKey, number>>({
    love: initialCounts?.love ?? 0,
    fire: initialCounts?.fire ?? 0,
    clap: initialCounts?.clap ?? 0,
  });
  const [mine, setMine] = useState<ReactionKey | null>(null);
  const [pending, setPending] = useState(false);

  const handleReact = async (key: ReactionKey) => {
    if (pending) return;
    const prev = mine;
    const prevCounts = { ...counts };
    // optimistic update
    const next: ReactionKey | null = mine === key ? null : key;
    setMine(next);
    setCounts((c) => {
      const updated = { ...c };
      if (prev) updated[prev] = Math.max(0, updated[prev] - 1);
      if (next) updated[next] = updated[next] + 1;
      return updated;
    });
    setPending(true);
    try {
      await api.post(`${MOBILE_API}/community/react`, { post_id: Number(articleId), type: key });
    } catch {
      // rollback
      setMine(prev);
      setCounts(prevCounts);
    } finally {
      setPending(false);
    }
  };

  return (
    <View style={{
      flexDirection: "row", gap: 10, marginTop: 24,
      paddingTop: 20, borderTopWidth: 1, borderTopColor: c.rule,
    }}>
      {REACTIONS.map(({ key, emoji }) => {
        const active = mine === key;
        return (
          <TouchableOpacity
            key={key}
            onPress={() => handleReact(key)}
            activeOpacity={0.75}
            style={{
              flexDirection: "row", alignItems: "center", gap: 6,
              paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: 999, borderWidth: 1,
              borderColor: active ? c.ruleDark ?? c.inkSoft : c.rule,
              backgroundColor: active ? c.paperDeep : "transparent",
            }}
          >
            <Text style={{ fontSize: 15 }}>{emoji}</Text>
            <Text style={{
              fontFamily: fonts.sansBold, fontSize: fontSize.sm,
              color: active ? c.ink : c.mute,
            }}>{counts[key]}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Article Comments Section ──────────────────────────────────────────────────

const PLACEHOLDER_AVATAR = "https://cms.themoveee.com/wp-content/uploads/placeholder-avatar.png";

interface WpComment {
  id: number;
  content: { rendered: string };
  author_name: string;
  author_avatar_urls?: Record<string, string>;
  date: string;
}

function timeAgoComment(dateStr: string): string {
  try {
    const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch { return ""; }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#8220;|&#8221;/g, '"').trim();
}

function ArticleCommentsSection({ articleId, c, styles }: { articleId: string; c: ColorPalette; styles: any }) {
  const user = useAuthStore((s) => s.user);
  const [comments, setComments] = useState<WpComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`https://cms.themoveee.com/wp-json/wp/v2/comments?post=${articleId}&per_page=20&order=asc`)
      .then((r) => r.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [articleId]);

  const submitComment = async () => {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await api.post(`${MOBILE_API}/community/comment`, { post_id: Number(articleId), content: text.trim() });
      setSubmitted(true);
      setText("");
    } catch {} finally { setSubmitting(false); }
  };

  return (
    <View style={acStyles.section}>
      <View style={acStyles.header}>
        <Text style={[acStyles.heading, { color: c.ink }]}>Discussion</Text>
        <Text style={[acStyles.count, { color: c.mute }]}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* Comment list */}
      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={[acStyles.empty, { color: c.ghost }]}>Be the first to leave a comment.</Text>
      ) : (
        comments.map((cm) => {
          const avatar = cm.author_avatar_urls?.["48"] ?? PLACEHOLDER_AVATAR;
          return (
            <View key={cm.id} style={[acStyles.commentRow, { borderBottomColor: c.rule }]}>
              <Image source={{ uri: avatar }} style={acStyles.avatar} />
              <View style={acStyles.commentBody}>
                <View style={acStyles.commentMeta}>
                  <Text style={[acStyles.authorName, { color: c.ink }]}>{cm.author_name}</Text>
                  <Text style={[acStyles.timestamp, { color: c.ghost }]}>{timeAgoComment(cm.date)}</Text>
                </View>
                <Text style={[acStyles.commentText, { color: c.inkSoft }]}>{stripHtml(cm.content.rendered)}</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Compose */}
      <View style={[acStyles.compose, { borderTopColor: c.rule, backgroundColor: c.paperDeep }]}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={acStyles.composeAvatar} />
        ) : (
          <View style={[acStyles.composeAvatar, { backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center" }]}>
            <Ionicons name="person" size={14} color={c.mute} />
          </View>
        )}
        {submitted ? (
          <Text style={[acStyles.submittedNote, { color: c.mute }]}>Comment submitted for review ✓</Text>
        ) : user ? (
          <>
            <TextInput
              style={[acStyles.input, { color: c.ink, backgroundColor: c.paper, borderColor: c.rule }]}
              placeholder="Add a comment…"
              placeholderTextColor={c.ghost}
              value={text}
              onChangeText={setText}
              multiline
              maxLength={600}
            />
            <TouchableOpacity onPress={submitComment} disabled={submitting || !text.trim()} activeOpacity={0.7}>
              {submitting
                ? <ActivityIndicator size="small" color={c.gold} />
                : <Ionicons name="send" size={18} color={text.trim() ? c.gold : c.ghost} />
              }
            </TouchableOpacity>
          </>
        ) : (
          <Text style={[acStyles.signInNote, { color: c.mute }]}>Sign in to leave a comment</Text>
        )}
      </View>
    </View>
  );
}

const acStyles = StyleSheet.create({
  section: { marginTop: 24, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 16 },
  heading: { fontFamily: "Fraunces_700Bold", fontSize: 20 },
  count: { fontFamily: "JetBrainsMono_400Regular", fontSize: 11 },
  empty: { fontFamily: "DMSans_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  commentRow: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  authorName: { fontFamily: "DMSans_700Bold", fontSize: 13 },
  timestamp: { fontFamily: "JetBrainsMono_400Regular", fontSize: 10 },
  commentText: { fontFamily: "DMSans_400Regular", fontSize: 14, lineHeight: 20 },
  compose: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderTopWidth: 1, borderRadius: 8, marginTop: 16 },
  composeAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  input: { flex: 1, fontFamily: "DMSans_400Regular", fontSize: 14, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, maxHeight: 80 },
  submittedNote: { flex: 1, fontFamily: "DMSans_400Regular", fontSize: 13, fontStyle: "italic" },
  signInNote: { flex: 1, fontFamily: "DMSans_400Regular", fontSize: 13 },
});

export default function ArticleScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { slug, article: passedArticle } = route.params ?? {};
  const { article: fetched, loading, error } = useArticle(slug);
  const article: Article | undefined = fetched ?? passedArticle;
  const { width, height } = useWindowDimensions();

  const user = useAuthStore((s) => s.user);
  const isPatron = user?.tier === "patron";

  // Scroll tracking
  const [readProgress, setReadProgress] = useState(0);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const contentHeightRef = useRef(0);
  const layoutHeightRef = useRef(0);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentH = e.nativeEvent.contentSize.height;
    const layoutH = e.nativeEvent.layoutMeasurement.height;
    contentHeightRef.current = contentH;
    layoutHeightRef.current = layoutH;
    const scrollable = contentH - layoutH;
    if (scrollable > 0) {
      setReadProgress(Math.min(1, Math.max(0, offsetY / scrollable)));
    }
    setShowStickyHeader(offsetY > HEADER_TRIGGER);
  }, []);

  // Bookmark
  const [bookmarked, setBookmarked] = useState(false);
  const handleBookmark = useCallback(async () => {
    if (!article) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await api.post(`${MOBILE_API}/content/bookmark`, { post_id: article.id, action: next ? "add" : "remove" });
    } catch {
      setBookmarked(!next); // revert on failure
    }
  }, [article, bookmarked]);

  // Article complete
  const [pointsCollected, setPointsCollected] = useState(false);
  const handleCollectPoints = useCallback(() => {
    if (pointsCollected) return;
    setPointsCollected(true);
    // TODO: call awards API
  }, [pointsCollected]);

  // TOC
  const [tocOpen, setTocOpen] = useState(false);
  const [activeTocIdx, setActiveTocIdx] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const headings = useMemo(() => article ? extractHeadings(article.content ?? "") : [], [article]);

  const handleShare = () => {
    if (!article) return;
    Share.share({ title: article.title, url: `https://themoveee.com/magazine/${article.slug}` }).catch(() => {});
  };

  const authorInitials = (article?.author?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w: string) => w[0])
    .join("")
    .toUpperCase();

  const publishedDate = article?.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString("en-GB", {
        day: "numeric", month: "long", year: "numeric",
      })
    : "";

  // Pro gate: show gate if article is Pro-only and user is not patron
  const isGated = !!(article as any)?.isProOnly && !isPatron;

  // Truncate title for sticky header
  const shortTitle = article?.title
    ? article.title.length > 40
      ? article.title.slice(0, 40) + "…"
      : article.title
    : "";

  return (
    <View style={styles.container}>
      {/* ── Progress bar ── */}
      <View style={styles.progressTrack} pointerEvents="none">
        <View style={[styles.progressFill, { width: `${readProgress * 100}%` as any }]} />
      </View>

      {/* ── Hero background (absolute, top 280px) ── */}
      <View style={styles.heroWrap}>
        {article?.featuredImage ? (
          <Image source={{ uri: article.featuredImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]} />
        )}
      </View>

      {/* ── Floating controls on hero ── */}
      <View style={styles.floatingControls} pointerEvents="box-none">
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.floatBtn}>
          <Ionicons name="chevron-back" size={20} color={c.ink} />
        </TouchableOpacity>
        <View style={styles.floatRight}>
          <TouchableOpacity style={styles.floatBtn} onPress={handleBookmark}>
            <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={18} color={bookmarked ? c.gold : c.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={c.ink} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      {!article && loading ? (
        <ArticleSkeleton />
      ) : !article && error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : article ? (
        <>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: HERO_HEIGHT - SHEET_OVERLAP, paddingBottom: 120 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {/* ── White rounded card ── */}
            <View style={styles.sheet}>
              {/* Breadcrumb */}
              <TouchableOpacity
                onPress={() => article.category && nav.push("CategoryArchive", {
                  categorySlug: article.category.toLowerCase().replace(/\s+/g, "-"),
                  categoryName: article.category,
                })}
                disabled={!article.category}
              >
                <Text style={styles.breadcrumb}>Magazine › {article.category ?? "Article"}</Text>
              </TouchableOpacity>

              {/* Eyebrow */}
              <Text style={styles.eyebrow}>
                ★ {article.category ? article.category.toUpperCase() : "ARTICLE"}
                {(article as any).region ? ` · ${((article as any).region as string).toUpperCase()}` : ""}
              </Text>

              {/* Title */}
              <Text style={styles.title}>{article.title}</Text>

              {/* Standfirst */}
              {article.excerpt ? (
                <Text style={styles.standfirst}>{article.excerpt}</Text>
              ) : null}

              {/* Ochre divider */}
              <View style={styles.divider} />

              {/* Byline block */}
              <View style={styles.bylineBlock}>
                <View style={styles.bylineLeft}>
                  {article.author?.avatarUrl ? (
                    <Image source={{ uri: article.author.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{authorInitials}</Text>
                    </View>
                  )}
                  <View style={styles.bylineInfo}>
                    <Text style={styles.bylineWords}>Words by {article.author?.name ?? ""}</Text>
                    <Text style={styles.bylineMeta}>
                      {publishedDate}{article.readingTime ? ` · ${article.readingTime} min read` : ""}
                    </Text>
                  </View>
                </View>
                {(article as any).series ? (
                  <View style={styles.seriesBadge}>
                    <Text style={styles.seriesBadgeText} numberOfLines={1}>
                      {(article as any).series}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Actions bar */}
              <View style={styles.actionsBar}>
                <View style={styles.actionsLeft}>
                  <TouchableOpacity style={styles.actionItem}>
                    <Text style={styles.actionEmoji}>❤️</Text>
                    <Text style={styles.actionCount}>{article.reactions?.heart ?? 0}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionItem}>
                    <Text style={styles.actionEmoji}>🔥</Text>
                    <Text style={styles.actionCount}>{article.reactions?.fire ?? 0}</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.actionsRight}>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={handleBookmark}>
                    <Ionicons name={bookmarked ? "bookmark" : "bookmark-outline"} size={18} color={bookmarked ? c.gold : c.ink} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIconBtn} onPress={handleShare}>
                    <Ionicons name="share-outline" size={18} color={c.ink} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Article body (with optional gate) ── */}
              {isGated ? (
                <View>
                  {/* First portion of content visible */}
                  <View style={styles.gatedContent}>
                    <ArticleBody article={article} colors={c} />
                    {/* Fade overlay */}
                    <LinearGradient
                      colors={[`${c.paper}00`, c.paper]}
                      style={styles.fadeOverlay}
                      pointerEvents="none"
                    />
                  </View>
                  {/* Gate card */}
                  <View style={styles.gateCard}>
                    <Ionicons name="lock-closed" size={24} color={c.gold} style={{ marginBottom: 12 }} />
                    <Text style={styles.gateTitle}>Members-only article</Text>
                    <Text style={styles.gateDesc}>
                      This article is exclusive to Connect Pro members. Upgrade to read the full piece and unlock all premium content.
                    </Text>
                    <TouchableOpacity
                      style={styles.upgradeBtn}
                      onPress={() => nav.navigate("Membership")}
                    >
                      <Text style={styles.upgradeBtnText}>Upgrade to Connect Pro</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ marginTop: 12 }}
                      onPress={() => nav.navigate("Membership")}
                    >
                      <Text style={styles.signInLink}>Sign in →</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  {/* Pull quote if present */}
                  {(article as any).pullQuote ? (
                    <View style={styles.pullQuote}>
                      <Text style={styles.pullQuoteText}>{(article as any).pullQuote}</Text>
                    </View>
                  ) : null}

                  {/* Full body */}
                  <ArticleBody article={article} colors={c} />

                  {/* ── Reaction row ── */}
                  <ReactionRow
                    articleId={article.id}
                    initialCounts={{
                      love: (article as any).reactions?.love ?? (article as any).reactions?.heart ?? 0,
                      fire: (article as any).reactions?.fire ?? 0,
                      clap: (article as any).reactions?.clap ?? 0,
                    }}
                    c={c}
                  />

                  {/* ── Frame 3: Article complete banner ── */}
                  <View style={styles.completeBanner}>
                    <View style={styles.completeBannerLeft}>
                      <View style={styles.completeCheck}>
                        <Ionicons name="checkmark" size={18} color={c.ochre} />
                      </View>
                      <View>
                        <Text style={styles.completeTitle}>Article complete!</Text>
                        <Text style={styles.completePoints}>+ 15 Culture Points earned</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.collectBtn, pointsCollected && styles.collectBtnDone]}
                      onPress={handleCollectPoints}
                      disabled={pointsCollected}
                    >
                      <Text style={styles.collectBtnText}>
                        {pointsCollected ? "Collected!" : "Collect Points"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Series context strip */}
                  {(article as any).series ? (
                    <View style={styles.seriesStrip}>
                      <Ionicons name="book-outline" size={16} color={c.mute} />
                      <Text style={styles.seriesStripText}>
                        Part of the '{(article as any).series}' series
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color={c.mute} />
                    </View>
                  ) : null}

                  {/* ── Frame 4: From This Issue ── */}
                  {(article as any).issue ? (
                    <View style={styles.issueCard}>
                      {(article as any).issue.coverImage ? (
                        <Image
                          source={{ uri: (article as any).issue.coverImage }}
                          style={styles.issueCover}
                        />
                      ) : (
                        <View style={[styles.issueCover, styles.issueCoverPlaceholder]} />
                      )}
                      <View style={styles.issueInfo}>
                        <Text style={styles.issueEyebrow}>From This Issue</Text>
                        <Text style={styles.issueTitle} numberOfLines={2}>
                          {(article as any).issue.title ?? "Current Issue"}
                        </Text>
                        {(article as any).issue.articleCount != null ? (
                          <Text style={styles.issueMeta}>
                            {(article as any).issue.articleCount} articles
                          </Text>
                        ) : null}
                        <TouchableOpacity>
                          <Text style={styles.issueBrowse}>Browse issue →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}

                  {/* ── Author bio card ── */}
                  {article.author ? (
                    <View style={styles.authorBioCard}>
                      {article.author.avatarUrl ? (
                        <Image source={{ uri: article.author.avatarUrl }} style={styles.authorBioAvatar} />
                      ) : (
                        <View style={[styles.authorBioAvatar, styles.authorBioAvatarPlaceholder]}>
                          <Text style={styles.avatarInitials}>{authorInitials}</Text>
                        </View>
                      )}
                      <Text style={styles.authorBioName}>{article.author.name}</Text>
                      {article.author.role ? (
                        <Text style={styles.authorBioRole}>{article.author.role}</Text>
                      ) : null}
                      {(article.author as any).bio ? (
                        <Text style={styles.authorBioBio}>{(article.author as any).bio}</Text>
                      ) : null}
                      <TouchableOpacity
                        onPress={() => nav.push("AuthorArchive", {
                          authorSlug: article.author.slug,
                          authorName: article.author.name,
                          authorAvatar: article.author.avatarUrl,
                        })}
                      >
                        <Text style={styles.authorBioMore}>More articles by {article.author.name} →</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}

                  {/* ── Comments section ── */}
                  <ArticleCommentsSection articleId={article.id} c={c} styles={styles} />
                </>
              )}
            </View>
          </ScrollView>

          {/* ── TOC floating button ── */}
          {headings.length > 0 && (
            <TouchableOpacity
              style={styles.tocFab}
              onPress={() => setTocOpen(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="list" size={20} color={c.ink} />
            </TouchableOpacity>
          )}

          {/* ── TOC Bottom Sheet ── */}
          <BottomSheet visible={tocOpen} onClose={() => setTocOpen(false)}>
            <View style={styles.tocHeader}>
              <Text style={styles.tocHeaderTitle}>Contents</Text>
              <Text style={styles.tocArticleTitle} numberOfLines={2}>{article.title}</Text>
            </View>
            <View style={styles.tocMeta}>
              {[
                ["WRITER", article.author?.name ?? "—"],
                ["SECTION", article.category ?? "—"],
                ["READ TIME", article.readingTime ? `${article.readingTime} min` : "—"],
              ].map(([label, val]) => (
                <View key={label} style={styles.tocMetaRow}>
                  <Text style={styles.tocMetaLabel}>{label}</Text>
                  <Text style={styles.tocMetaVal}>{val}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.tocSectionLabel}>In this article</Text>
            <View style={{ height: 1, backgroundColor: c.rule, marginHorizontal: space[5] }} />
            <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
              {headings.map((h, i) => (
                <TouchableOpacity
                  key={h.id}
                  style={[
                    styles.tocItem,
                    h.level === 3 && styles.tocItemNested,
                  ]}
                  onPress={() => {
                    setActiveTocIdx(i);
                    setTocOpen(false);
                    // Best-effort: scroll to approximate position
                    scrollRef.current?.scrollTo({ y: HERO_HEIGHT + 300 + i * 200, animated: true });
                  }}
                >
                  {i === activeTocIdx ? (
                    <View style={styles.tocActiveDot} />
                  ) : (
                    <View style={styles.tocDotPlaceholder} />
                  )}
                  <Text
                    style={[
                      styles.tocItemText,
                      i === activeTocIdx && styles.tocItemTextActive,
                      h.level === 3 && styles.tocItemTextNested,
                    ]}
                    numberOfLines={2}
                  >
                    {h.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </BottomSheet>
        </>
      ) : null}
    </View>
  );
}

function createStyles(c: ColorPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.paper },

  // Progress bar
  progressTrack: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 3, backgroundColor: c.rule, zIndex: 200,
  },
  progressFill: {
    height: 3, backgroundColor: c.ochre,
  },

  // Sticky header
  stickyHeader: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 150,
    height: 52, backgroundColor: c.paper,
    borderBottomWidth: 1, borderBottomColor: c.rule,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12,
  },
  stickyBackBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },
  stickyTitle: {
    flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: c.ink,
    textAlign: "center", marginHorizontal: 8,
  },
  stickyIconBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
  },

  heroWrap: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: HERO_HEIGHT, backgroundColor: c.paperDeep,
  },
  heroPlaceholder: { backgroundColor: c.paperDeep },

  floatingControls: {
    position: "absolute", top: 56, left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between", zIndex: 150,
  },
  floatRight: { flexDirection: "row", gap: 8 },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.paper, alignItems: "center", justifyContent: "center",
    shadowColor: c.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8] },
  errorText: { fontFamily: fonts.sans, color: c.ochre, textAlign: "center" },

  sheet: {
    backgroundColor: c.paper,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40,
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12, shadowRadius: 30, elevation: 8,
    minHeight: 600,
  },

  breadcrumb: {
    fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: c.ghost,
    letterSpacing: 0.5, marginBottom: 10, textTransform: "uppercase",
  },
  eyebrow: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: c.ochre, letterSpacing: 1.5, textTransform: "uppercase",
    marginBottom: 12,
  },

  title: {
    fontFamily: fonts.serifBold, fontSize: 26, color: c.ink,
    lineHeight: 32, marginBottom: space[2],
  },
  standfirst: {
    fontFamily: fonts.sans, fontSize: 15,
    fontStyle: "italic", color: c.inkSoft, lineHeight: 22, marginTop: 6,
  },

  divider: {
    width: 48, height: 2, backgroundColor: c.ochre,
    marginVertical: 24,
  },

  // Byline
  bylineBlock: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: 0,
  },
  bylineLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  bylineInfo: { flex: 1 },
  bylineWords: { fontFamily: fonts.sansBold, fontSize: 13, color: c.ink },
  bylineMeta: { fontFamily: fonts.mono, fontSize: 11, color: c.ghost, marginTop: 3 },
  seriesBadge: {
    borderWidth: 1, borderColor: c.ghost, borderRadius: radius.full,
    paddingHorizontal: 10, paddingVertical: 4, maxWidth: 120,
  },
  seriesBadgeText: {
    fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: c.mute,
  },

  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: c.gold,
  },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: c.gold,
    backgroundColor: c.goldLight, alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontFamily: fonts.sansBold, fontSize: 14, color: c.gold },

  // Actions bar
  actionsBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    height: 40, borderTopWidth: 1, borderBottomWidth: 1, borderColor: c.rule,
    marginTop: 20, marginBottom: 24, paddingHorizontal: 4,
  },
  actionsLeft: { flexDirection: "row", gap: 16, alignItems: "center" },
  actionsRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  actionItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionEmoji: { fontSize: 16 },
  actionCount: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.inkSoft },
  actionIconBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },

  // Pull quote
  pullQuote: {
    borderLeftWidth: 3, borderLeftColor: c.ochre,
    paddingLeft: 16, marginVertical: 20,
  },
  pullQuoteText: {
    fontFamily: fonts.serif, fontSize: 20, fontStyle: "italic",
    color: c.inkSoft, lineHeight: 28,
  },

  // Pro gate
  gatedContent: {
    maxHeight: 320, overflow: "hidden",
  },
  fadeOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 120,
  },
  gateCard: {
    marginTop: 16, borderWidth: 1.5, borderColor: c.goldBorder,
    borderRadius: radius.xl, padding: 24, alignItems: "center",
    backgroundColor: c.goldLight,
  },
  gateTitle: {
    fontFamily: fonts.serifBold, fontSize: 18, color: c.ink,
    marginBottom: 10, textAlign: "center",
  },
  gateDesc: {
    fontFamily: fonts.sans, fontSize: 14, color: c.mute,
    textAlign: "center", lineHeight: 20, marginBottom: 20,
  },
  upgradeBtn: {
    width: "100%", height: 44, backgroundColor: c.gold,
    borderRadius: radius.full, alignItems: "center", justifyContent: "center",
  },
  upgradeBtnText: {
    fontFamily: fonts.sansBold, fontSize: 14, color: "#fff",
  },
  signInLink: {
    fontFamily: fonts.sansMedium, fontSize: 14, color: c.ochre,
  },

  // Article complete banner
  completeBanner: {
    marginTop: 32, height: 72, backgroundColor: c.ochre,
    borderRadius: radius.xl, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  completeBannerLeft: {
    flexDirection: "row", alignItems: "center", gap: 12, flex: 1,
  },
  completeCheck: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  completeTitle: {
    fontFamily: fonts.sansBold, fontSize: 14, color: "#fff",
  },
  completePoints: {
    fontFamily: fonts.mono, fontSize: 11, color: "#fff", opacity: 0.9, marginTop: 2,
  },
  collectBtn: {
    height: 34, paddingHorizontal: 14, borderRadius: radius.full,
    backgroundColor: "#fff", alignItems: "center", justifyContent: "center",
  },
  collectBtnDone: { opacity: 0.65 },
  collectBtnText: {
    fontFamily: fonts.sansBold, fontSize: 12, color: c.ochre,
  },

  // Series strip
  seriesStrip: {
    marginTop: 16, height: 56, backgroundColor: c.paperDeep,
    borderRadius: radius.lg, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 10,
  },
  seriesStripText: {
    flex: 1, fontFamily: fonts.sans, fontSize: 13, color: c.mute,
  },

  // Issue card
  issueCard: {
    marginTop: 24, flexDirection: "row", gap: 16,
    borderWidth: 1, borderColor: c.rule,
    borderRadius: radius.xl, padding: 16, backgroundColor: c.paper,
  },
  issueCover: { width: 64, height: 80, borderRadius: radius.lg },
  issueCoverPlaceholder: { backgroundColor: c.paperDeep },
  issueInfo: { flex: 1, justifyContent: "space-between" },
  issueEyebrow: {
    fontFamily: fonts.mono, fontSize: fontSize.eyebrow,
    color: c.ghost, letterSpacing: 1, textTransform: "uppercase",
    marginBottom: 4,
  },
  issueTitle: {
    fontFamily: fonts.serifBold, fontSize: 15, color: c.ink, lineHeight: 20,
  },
  issueMeta: { fontFamily: fonts.mono, fontSize: 11, color: c.mute, marginTop: 4 },
  issueBrowse: {
    fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre, marginTop: 8,
  },

  // Author bio card
  authorBioCard: {
    marginTop: 24, borderWidth: 1, borderColor: c.rule,
    borderRadius: radius.xl, padding: 20, backgroundColor: c.paper,
    alignItems: "center",
  },
  authorBioAvatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, borderColor: c.gold, marginBottom: 12,
  },
  authorBioAvatarPlaceholder: {
    backgroundColor: c.goldLight, alignItems: "center", justifyContent: "center",
  },
  authorBioName: {
    fontFamily: fonts.serifBold, fontSize: 18, color: c.ink, marginBottom: 4,
  },
  authorBioRole: {
    fontFamily: fonts.mono, fontSize: 11, color: c.mute, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 10,
  },
  authorBioBio: {
    fontFamily: fonts.sans, fontSize: 14, color: c.inkSoft, lineHeight: 20,
    textAlign: "center", marginBottom: 12,
  },
  authorBioMore: {
    fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre,
  },

  // TOC FAB
  tocFab: {
    position: "absolute", bottom: 100, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.paper,
    alignItems: "center", justifyContent: "center",
    shadowColor: c.ink, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },

  // TOC sheet
  tocHeader: {
    paddingHorizontal: space[5], paddingTop: space[2], paddingBottom: space[4],
    borderBottomWidth: 1, borderBottomColor: c.rule,
  },
  tocHeaderTitle: {
    fontFamily: fonts.serifBold, fontSize: 22, color: c.ink, marginBottom: 6,
  },
  tocArticleTitle: {
    fontFamily: fonts.mono, fontSize: 11, color: c.ghost, lineHeight: 16,
    fontStyle: "italic" as const,
  },
  tocMeta: {
    marginTop: 16, marginBottom: 0,
    borderTopWidth: 1, borderTopColor: c.rule,
  },
  tocMetaRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", height: 38,
    paddingHorizontal: space[5],
    borderBottomWidth: 1, borderBottomColor: c.rule,
  },
  tocMetaLabel: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: c.ghost, letterSpacing: 1.5, textTransform: "uppercase",
  },
  tocMetaVal: {
    fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, fontWeight: "600" as const,
  },
  tocSectionLabel: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: c.mute, textTransform: "uppercase", letterSpacing: 1.5,
    marginTop: space[5], marginBottom: space[2],
    paddingHorizontal: space[5],
  },
  tocItem: {
    flexDirection: "row", alignItems: "center", minHeight: 48,
    borderBottomWidth: 1, borderBottomColor: c.rule, gap: 14,
    paddingHorizontal: space[5],
  },
  tocItemNested: { paddingLeft: space[5] + 20 },
  tocActiveDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: c.ochre, flexShrink: 0,
  },
  tocDotPlaceholder: { width: 7, height: 7, flexShrink: 0 },
  tocItemText: {
    flex: 1, fontFamily: fonts.sans, fontSize: 15, color: c.ink, lineHeight: 22,
  },
  tocItemTextActive: {
    fontFamily: fonts.sansBold, color: c.ochre,
  },
  tocItemTextNested: {
    fontSize: 13, color: c.inkSoft,
  },
}); }
