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
import ReactionBar from "../../components/community/ReactionBar";

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
    const text = m[2].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#\d+;/g, "").trim();
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


// ── Newsletter CTA ───────────────────────────────────────────────────────────

function NewsletterCTA({ c }: { c: ColorPalette }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    setBusy(true);
    try {
      await api.post(`${CULTURE_API}/newsletter/subscribe`, { email: trimmed, list: "getmelit" }, false);
      setSubmitted(true);
    } catch {
      // fail silently — user can retry
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{
      marginTop: 32, borderRadius: radius.xl, padding: 24,
      backgroundColor: c.paperDeep,
      borderWidth: 1, borderColor: c.rule,
    }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <View style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: c.goldLight, alignItems: "center", justifyContent: "center",
        }}>
          <Ionicons name="mail-outline" size={18} color={c.gold} />
        </View>
        <Text style={{
          fontFamily: fonts.serifBold, fontSize: 16, color: c.ink, flex: 1, lineHeight: 22,
        }}>{"Culture in your inbox,\nevery Friday"}</Text>
      </View>
      <Text style={{
        fontFamily: fonts.sans, fontSize: 13, color: c.mute, lineHeight: 19, marginBottom: 16,
      }}>
        GetMeLit — the Moveee weekly. Handpicked stories, what to watch, read, and experience.
      </Text>
      {submitted ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="checkmark-circle" size={18} color={c.gold} />
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.gold }}>
            You're on the list!
          </Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Your email address"
            placeholderTextColor={c.ghost}
            keyboardType="email-address"
            autoCapitalize="none"
            style={{
              flex: 1, height: 44, borderWidth: 1, borderColor: c.rule,
              borderRadius: radius.md, paddingHorizontal: 12,
              fontFamily: fonts.sans, fontSize: 14, color: c.ink,
              backgroundColor: c.paper,
            }}
          />
          <TouchableOpacity
            onPress={handleSubscribe}
            disabled={busy}
            style={{
              height: 44, paddingHorizontal: 16, borderRadius: radius.md,
              backgroundColor: c.ink, alignItems: "center", justifyContent: "center",
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.paper }}>
              {busy ? "…" : "Subscribe"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Shop the Edit ─────────────────────────────────────────────────────────────

interface ShopProduct {
  id: number;
  name: string;
  brand: string;
  price: string;
  pro_price?: string;
  image?: string;
  slug: string;
}

function ShopTheEdit({ articleSlug, c, nav }: { articleSlug: string; c: ColorPalette; nav: any }) {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<{ products: ShopProduct[] }>(`${MOBILE_API}/articles/${articleSlug}/products`, false)
      .then((res) => { setProducts(res.products ?? []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [articleSlug]);

  if (!loaded || products.length === 0) return null;

  return (
    <View style={{ marginTop: 32 }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
      }}>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: c.ink }}>Shop the edit</Text>
        <TouchableOpacity onPress={() => nav.navigate("ShopHome")}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre }}>Browse all →</Text>
        </TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {products.slice(0, 4).map((p) => (
          <TouchableOpacity
            key={p.id}
            onPress={() => nav.navigate("Shop", { screen: "ProductDetail", params: { id: p.id, slug: p.slug } } as any)}
            activeOpacity={0.85}
            style={{
              width: "48%", borderWidth: 1, borderColor: c.rule,
              borderRadius: radius.xl, overflow: "hidden", backgroundColor: c.paper,
            }}
          >
            {p.image ? (
              <Image source={{ uri: p.image }} style={{ width: "100%", height: 140 }} resizeMode="cover" />
            ) : (
              <View style={{ width: "100%", height: 140, backgroundColor: c.paperDeep }} />
            )}
            <View style={{ padding: 10 }}>
              <Text style={{
                fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
                color: c.ghost, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3,
              }}>
                {p.brand}
              </Text>
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 13, color: c.ink, lineHeight: 17,
              }} numberOfLines={2}>
                {p.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ink }}>{p.price}</Text>
                {p.pro_price ? (
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: c.gold }}>{p.pro_price} Pro</Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

// ── Keep Reading ──────────────────────────────────────────────────────────────

interface RelatedArticle {
  id: number;
  slug: string;
  title: string;
  category?: string;
  author?: string;
  readingTime?: number;
  image?: string;
}

function KeepReading({ articleSlug, c, nav }: { articleSlug: string; c: ColorPalette; nav: any }) {
  const [articles, setArticles] = useState<RelatedArticle[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.get<{ articles: RelatedArticle[] }>(`${MOBILE_API}/articles/${articleSlug}/related`, false)
      .then((res) => { setArticles(res.articles ?? []); })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [articleSlug]);

  if (!loaded || articles.length === 0) return null;

  return (
    <View style={{ marginTop: 32, paddingBottom: 8 }}>
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16,
      }}>
        <Text style={{ fontFamily: fonts.serifBold, fontSize: 20, color: c.ink }}>Keep reading</Text>
        <TouchableOpacity onPress={() => nav.navigate("MagazineList")}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: c.ochre }}>See all →</Text>
        </TouchableOpacity>
      </View>
      <View style={{ borderTopWidth: 1, borderTopColor: c.rule }}>
        {articles.slice(0, 4).map((a) => (
          <TouchableOpacity
            key={a.id}
            onPress={() => nav.push("Article", { slug: a.slug })}
            activeOpacity={0.85}
            style={{
              flexDirection: "row", gap: 14, paddingVertical: 16,
              borderBottomWidth: 1, borderBottomColor: c.rule,
            }}
          >
            {a.image ? (
              <Image
                source={{ uri: a.image }}
                style={{ width: 88, height: 66, borderRadius: radius.lg }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ width: 88, height: 66, borderRadius: radius.lg, backgroundColor: c.paperDeep }} />
            )}
            <View style={{ flex: 1, justifyContent: "space-between" }}>
              {a.category ? (
                <Text style={{
                  fontFamily: fonts.mono, fontSize: fontSize.eyebrow,
                  color: c.ochre, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4,
                }}>
                  {a.category}
                </Text>
              ) : null}
              <Text style={{
                fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, lineHeight: 19,
              }} numberOfLines={3}>
                {a.title}
              </Text>
              <Text style={{
                fontFamily: fonts.mono, fontSize: 11, color: c.ghost, marginTop: 4,
              }}>
                {[a.author, a.readingTime ? `${a.readingTime} min read` : null]
                  .filter(Boolean).join(" · ")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
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
    <View style={styles.cm_section}>
      <View style={styles.cm_header}>
        <Text style={styles.cm_heading}>Discussion</Text>
        <Text style={styles.cm_count}>{comments.length} comment{comments.length !== 1 ? "s" : ""}</Text>
      </View>

      {/* Comment list */}
      {loading ? (
        <ActivityIndicator color={c.gold} style={{ marginVertical: 16 }} />
      ) : comments.length === 0 ? (
        <Text style={styles.cm_empty}>Be the first to leave a comment.</Text>
      ) : (
        comments.map((cm) => {
          const avatar = cm.author_avatar_urls?.["48"] ?? PLACEHOLDER_AVATAR;
          return (
            <View key={cm.id} style={styles.cm_row}>
              <Image source={{ uri: avatar }} style={styles.cm_avatar} />
              <View style={styles.cm_body}>
                <View style={styles.cm_meta}>
                  <Text style={styles.cm_author}>{cm.author_name}</Text>
                  <Text style={styles.cm_time}>{timeAgoComment(cm.date)}</Text>
                </View>
                <Text style={styles.cm_text}>{stripHtml(cm.content.rendered)}</Text>
              </View>
            </View>
          );
        })
      )}

      {/* Compose */}
      <View style={styles.cm_compose}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={styles.cm_composeAvatar} />
        ) : (
          <View style={[styles.cm_composeAvatar, styles.cm_composeAvatarFallback]}>
            <Ionicons name="person" size={14} color={c.mute} />
          </View>
        )}
        {submitted ? (
          <Text style={styles.cm_submittedNote}>Comment submitted for review ✓</Text>
        ) : user ? (
          <>
            <TextInput
              style={styles.cm_input}
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
          <Text style={styles.cm_signIn}>Sign in to leave a comment</Text>
        )}
      </View>
    </View>
  );
}

// acStyles is intentionally empty — comment styles now live in createStyles(c) as cm_* keys

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
  const readProgressRef = useRef(0); // ref copy for use inside intervals

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    const contentH = e.nativeEvent.contentSize.height;
    const layoutH = e.nativeEvent.layoutMeasurement.height;
    contentHeightRef.current = contentH;
    layoutHeightRef.current = layoutH;
    const scrollable = contentH - layoutH;
    if (scrollable > 0) {
      const progress = Math.min(1, Math.max(0, offsetY / scrollable));
      readProgressRef.current = progress;
      setReadProgress(progress);
    }
    setShowStickyHeader(offsetY > HEADER_TRIGGER);
  }, []);

  // Bookmark — fetch actual state from interactions endpoint once article loads
  const [bookmarked, setBookmarked] = useState(false);
  useEffect(() => {
    if (!article || !user) return;
    api.get<{ bookmarked_articles?: (number | string)[] }>(
      `${CULTURE_API}/user/interactions`
    ).then((res) => {
      const ids = (res.bookmarked_articles ?? []).map(String);
      setBookmarked(ids.includes(String(article.id)));
    }).catch(() => {});
  }, [article?.id, user?.id]);

  const handleBookmark = useCallback(async () => {
    if (!article) return;
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await api.post(`${MOBILE_API}/content/bookmark`, { post_id: Number(article.id), action: next ? "add" : "remove" });
    } catch {
      setBookmarked(!next); // revert on failure
    }
  }, [article, bookmarked]);

  // Auto-award: fires once when scroll ≥85% AND time on screen ≥ 50% of reading time (min 30s)
  const [awarded, setAwarded] = useState(false);
  const [creditsEarned, setCreditsEarned] = useState(0);
  const awardFired = useRef(false);
  const timeOnScreen = useRef(0);

  useEffect(() => {
    if (!article || !user) return;
    const minSeconds = Math.max(30, (article.readingTime ?? 5) * 60 * 0.5);
    const interval = setInterval(() => {
      if (awardFired.current) { clearInterval(interval); return; }
      timeOnScreen.current += 1;
      if (readProgressRef.current >= 0.85 && timeOnScreen.current >= minSeconds) {
        awardFired.current = true;
        clearInterval(interval);
        api.post<{ credits_earned?: number; already_awarded?: boolean }>(
          `${MOBILE_API}/articles/read-complete`,
          { post_id: Number(article.id), slug: article.slug }
        ).then((res) => {
          setCreditsEarned(res?.credits_earned ?? 0);
          setAwarded(true);
        }).catch(() => {
          setAwarded(true); // show banner even if network fails
        });
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [article?.id, user?.id]);

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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: HERO_HEIGHT - SHEET_OVERLAP, paddingBottom: 120 }}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            keyboardShouldPersistTaps="handled"
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
                  <ReactionBar
                    postId={article.id}
                    initialCounts={{
                      love: (article as any).reactions?.love ?? (article as any).reactions?.heart ?? 0,
                      fire: (article as any).reactions?.fire ?? 0,
                      clap: (article as any).reactions?.clap ?? 0,
                    }}
                    shareUrl={`https://themoveee.com/magazine/${article.slug}`}
                    shareTitle={article.title}
                    noBorder={false}
                  />

                  {/* ── Frame 3: Article complete banner — auto-shown when read ── */}
                  {awarded && (
                    <View style={styles.completeBanner}>
                      <View style={styles.completeBannerLeft}>
                        <View style={styles.completeCheck}>
                          <Ionicons name="checkmark" size={18} color={c.ochre} />
                        </View>
                        <View>
                          <Text style={styles.completeTitle}>Article complete!</Text>
                          <Text style={styles.completePoints}>
                            {creditsEarned > 0
                              ? `+ ${creditsEarned} Culture Points earned`
                              : "Already credited — thanks for reading!"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

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

                  {/* ── Newsletter CTA ── */}
                  <NewsletterCTA c={c} />

                  {/* ── Shop the Edit ── */}
                  <ShopTheEdit articleSlug={article.slug} c={c} nav={nav} />

                  {/* ── Keep Reading ── */}
                  <KeepReading articleSlug={article.slug} c={c} nav={nav} />

                  {/* ── Comments section ── */}
                  <ArticleCommentsSection articleId={article.id} c={c} styles={styles} />
                </>
              )}
            </View>
          </ScrollView>
          </KeyboardAvoidingView>

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
            <View style={{ paddingBottom: 8 }}>
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
            </View>
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
    marginTop: 32, paddingVertical: 16, backgroundColor: c.ochre,
    borderRadius: radius.xl, flexDirection: "row",
    alignItems: "center", paddingHorizontal: 16,
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

  // Comments section
  cm_section: { marginTop: 24, paddingBottom: 32 },
  cm_header: { flexDirection: "row", alignItems: "baseline", gap: 8, marginBottom: 16 },
  cm_heading: { fontFamily: fonts.serifBold, fontSize: 20, color: c.ink },
  cm_count: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },
  cm_empty: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ghost, textAlign: "center", paddingVertical: 24 },
  cm_row: { flexDirection: "row", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.rule, gap: 10 },
  cm_avatar: { width: 36, height: 36, borderRadius: 18, flexShrink: 0 },
  cm_body: { flex: 1 },
  cm_meta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  cm_author: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ink },
  cm_time: { fontFamily: fonts.mono, fontSize: fontSize.tiny, color: c.ghost },
  cm_text: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft, lineHeight: 20 },
  cm_compose: {
    flexDirection: "row", alignItems: "center", gap: 10, padding: 12,
    borderTopWidth: 1, borderTopColor: c.rule,
    borderRadius: radius.lg, marginTop: 16, backgroundColor: c.paperDeep,
  },
  cm_composeAvatar: { width: 32, height: 32, borderRadius: 16, flexShrink: 0 },
  cm_composeAvatarFallback: { backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center" },
  cm_input: {
    flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base,
    borderWidth: 1, borderColor: c.rule, borderRadius: radius.full,
    paddingHorizontal: 14, paddingVertical: 8, maxHeight: 80,
    color: c.ink, backgroundColor: c.paper,
  },
  cm_submittedNote: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, fontStyle: "italic", color: c.mute },
  cm_signIn: { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
}); }
