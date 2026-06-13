import React from "react";
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
  Linking,
  Share,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { useArticle } from "../../features/magazine/useMagazine";
import { WP_URL } from "../../api/client";
import type { Article } from "../../types";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import { ArticleSkeleton } from "../../components/ui/Skeleton";

const HTML_TAG_STYLES = {
  p:          { fontSize: 16, lineHeight: 26, color: colors.inkSoft, marginBottom: 14 },
  a:          { color: colors.gold, textDecorationLine: "underline" as const },
  h2:         { fontSize: 20, fontWeight: "700" as const, color: colors.ink, marginTop: 8, marginBottom: 10 },
  h3:         { fontSize: 18, fontWeight: "700" as const, color: colors.ink, marginTop: 6, marginBottom: 8 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: colors.ochre, paddingLeft: 12, fontStyle: "italic" as const, color: colors.mute },
  img:        { borderRadius: 6 },
  figcaption: { fontSize: 11, color: colors.mute, textAlign: "center" as const, marginTop: 4 },
};

function ArticleBody({ article }: { article: Article }) {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();
  const contentWidth = width - 64;

  const handleLinkPress = (_event: unknown, href: string) => {
    const m = href.match(
      new RegExp(`^${WP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?:magazine|stories?)?/?([^/?#]+)/?$`)
    );
    if (m?.[1]) {
      nav.push("Article", { slug: m[1] });
      return;
    }
    Linking.openURL(href).catch(() => {});
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

export default function ArticleScreen() {
  const nav   = useNavigation<any>();
  const route = useRoute<any>();
  const { slug, article: passedArticle } = route.params ?? {};
  const { article: fetched, loading, error } = useArticle(slug);
  const article: Article | undefined = fetched ?? passedArticle;
  const { height } = useWindowDimensions();

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

  return (
    <View style={styles.container}>
      {/* ── Hero background (absolute, top 280px) ── */}
      <View style={styles.heroWrap}>
        {article?.featuredImage ? (
          <Image source={{ uri: article.featuredImage }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.heroPlaceholder]} />
        )}
      </View>

      {/* ── Floating controls ── */}
      <View style={styles.floatingControls} pointerEvents="box-none">
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.floatBtn}>
          <Ionicons name="chevron-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.floatRight}>
          <TouchableOpacity style={styles.floatBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={18} color={colors.ink} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatBtn}>
            <Ionicons name="bookmark-outline" size={18} color={colors.ink} />
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
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 248, paddingBottom: 100 }}
          >
            {/* White rounded sheet */}
            <View style={styles.sheet}>
              {/* Category + rule */}
              <View style={styles.categoryRow}>
                <Text style={styles.category}>
                  {article.category ? `${article.category.toUpperCase()} · ARTICLE` : "ARTICLE"}
                </Text>
                <View style={styles.categoryRule} />
              </View>

              {/* Title */}
              <Text style={styles.title}>{article.title}</Text>

              {/* Standfirst */}
              {article.excerpt ? (
                <Text style={styles.standfirst}>{article.excerpt}</Text>
              ) : null}

              {/* Center divider */}
              <View style={styles.divider} />

              {/* Author row */}
              <View style={styles.authorRow}>
                <View style={styles.authorLeft}>
                  {article.author?.avatarUrl ? (
                    <Image source={{ uri: article.author.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarInitials}>{authorInitials}</Text>
                    </View>
                  )}
                  <View style={styles.authorInfo}>
                    <Text style={styles.authorName}>{article.author?.name ?? ""}</Text>
                    <Text style={styles.authorMeta}>
                      {article.author?.role ? `${article.author.role} · ` : ""}Published {publishedDate}
                    </Text>
                  </View>
                </View>
                <View style={styles.authorRight}>
                  <Ionicons name="bookmark-outline" size={20} color={colors.ink} />
                  <Text style={styles.readingTime}>{article.readingTime ?? "?"} min read</Text>
                </View>
              </View>

              {/* Article body */}
              <ArticleBody article={article} />
            </View>
          </ScrollView>

          {/* ── Fixed bottom bar ── */}
          <View style={styles.bottomBar}>
            <View style={styles.reactions}>
              <TouchableOpacity style={styles.reactionBtn}>
                <Text style={styles.reactionEmoji}>❤️</Text>
                <Text style={styles.reactionCount}>{article.reactions?.heart ?? 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.reactionBtn}>
                <Text style={styles.reactionEmoji}>🔥</Text>
                <Text style={styles.reactionCount}>{article.reactions?.fire ?? 0}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share article</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },

  heroWrap: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 280, backgroundColor: colors.paperDeep,
  },
  heroPlaceholder: { backgroundColor: colors.paperDeep },

  floatingControls: {
    position: "absolute", top: 52, left: 16, right: 16,
    flexDirection: "row", justifyContent: "space-between", zIndex: 50,
  },
  floatRight: { flexDirection: "row", gap: 8 },
  floatBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper, alignItems: "center", justifyContent: "center",
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: space[8] },
  errorText: { fontFamily: fonts.sans, color: colors.ochre, textAlign: "center" },

  // White sheet
  sheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 32, paddingTop: 32, paddingBottom: 40,
    shadowColor: "#000", shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.12, shadowRadius: 30, elevation: 8,
    minHeight: 600,
  },

  categoryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: space[3] },
  category: {
    fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
    color: colors.ochre, letterSpacing: 1.5, textTransform: "uppercase",
  },
  categoryRule: { width: 48, height: 2, backgroundColor: colors.ochre },

  title: {
    fontFamily: fonts.serifBold, fontSize: 28, color: colors.ink,
    lineHeight: 34, marginBottom: space[2],
  },
  standfirst: {
    fontFamily: fonts.sans, fontSize: fontSize.base,
    fontStyle: "italic", color: colors.inkSoft, lineHeight: 22,
  },

  divider: {
    width: 48, height: 2, backgroundColor: colors.ochre,
    alignSelf: "center", marginVertical: 32,
  },

  authorRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    marginBottom: space[4],
  },
  authorLeft:  { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  authorRight: { alignItems: "flex-end", gap: 4, marginLeft: space[2] },

  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: colors.gold,
  },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 2, borderColor: colors.gold,
    backgroundColor: colors.goldLight, alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.gold },

  authorInfo:   { flex: 1 },
  authorName:   { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  authorMeta:   { fontFamily: fonts.mono, fontSize: 11, color: colors.mute, marginTop: 4 },
  readingTime:  { fontFamily: fonts.mono, fontSize: 11, color: colors.ochre },

  // Bottom bar
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: colors.paper,
    borderTopWidth: 1, borderTopColor: colors.ghost,
    paddingHorizontal: 24, paddingTop: 16, paddingBottom: 34,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  reactions:     { flexDirection: "row", alignItems: "center", gap: 16 },
  reactionBtn:   { flexDirection: "row", alignItems: "center", gap: 6 },
  reactionEmoji: { fontSize: 18 },
  reactionCount: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.inkSoft },

  shareBtn: {
    height: 40, paddingHorizontal: 20,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.ink,
    alignItems: "center", justifyContent: "center",
  },
  shareBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
});
