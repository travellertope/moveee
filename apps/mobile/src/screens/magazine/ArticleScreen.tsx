import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  Linking,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import RenderHtml from "react-native-render-html";
import { useArticle } from "../../features/magazine/useMagazine";
import { WP_URL } from "../../api/client";
import TimeAgo from "../../components/ui/TimeAgo";
import type { Article } from "../../types";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

const HTML_TAG_STYLES = {
  p: { fontSize: 16, lineHeight: 26, color: "#2b2620", marginBottom: 14 },
  a: { color: "#b38238", textDecorationLine: "underline" as const },
  h2: { fontSize: 20, fontWeight: "700" as const, fontFamily: SERIF, color: "#14110d", marginTop: 8, marginBottom: 10 },
  h3: { fontSize: 18, fontWeight: "700" as const, fontFamily: SERIF, color: "#14110d", marginTop: 6, marginBottom: 8 },
  blockquote: { borderLeftWidth: 3, borderLeftColor: "#b38238", paddingLeft: 14, fontStyle: "italic" as const, color: "#5a5347" },
  img: { borderRadius: 6 },
  figcaption: { fontSize: 12, color: "#7a6f5c", textAlign: "center" as const, marginTop: 4 },
};

function ArticleBody({ article }: { article: Article }) {
  const nav = useNavigation<any>();
  const { width } = useWindowDimensions();

  const handleLinkPress = (_event: unknown, href: string) => {
    const m = href.match(new RegExp(`^${WP_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/(?:magazine|stories?)?/?([^/?#]+)/?$`));
    if (m && m[1]) {
      nav.push("Article", { slug: m[1] });
      return;
    }
    Linking.openURL(href).catch(() => {});
  };

  return (
    <RenderHtml
      contentWidth={width - 36}
      source={{ html: article.content }}
      tagsStyles={HTML_TAG_STYLES}
      renderersProps={{ a: { onPress: handleLinkPress } }}
    />
  );
}

export default function ArticleScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const { slug, article: passedArticle } = route.params ?? {};
  const { article: fetched, loading, error } = useArticle(slug);
  const article = fetched ?? passedArticle;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#14110d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{article?.category || "Article"}</Text>
        <View style={styles.backBtn} />
      </View>

      {!article && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#b38238" />
        </View>
      ) : !article && error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : article ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {article.featuredImage ? (
            <Image source={{ uri: article.featuredImage }} style={styles.heroImage} resizeMode="cover" />
          ) : null}

          {article.category ? <Text style={styles.category}>{article.category}</Text> : null}
          <Text style={styles.title}>{article.title}</Text>

          <View style={styles.byline}>
            {article.author.avatarUrl ? (
              <Image source={{ uri: article.author.avatarUrl }} style={styles.avatar} />
            ) : null}
            <View>
              <Text style={styles.authorName}>{article.author.name}</Text>
              <View style={styles.bylineMeta}>
                <TimeAgo date={article.publishedAt} />
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.readingTime}>{article.readingTime} min read</Text>
              </View>
            </View>
          </View>

          <ArticleBody article={article} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e2d8",
    backgroundColor: "#fff",
  },
  backBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  headerTitle: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase", color: "#7a6f5c" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  errorText: { color: "#c0392b" },

  content: { paddingBottom: 48 },
  heroImage: { width: "100%", height: 240, backgroundColor: "#e0d8cc" },
  category: { marginTop: 18, marginHorizontal: 18, fontSize: 11, fontWeight: "700", color: "#b38238", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { marginTop: 6, marginHorizontal: 18, fontSize: 26, fontWeight: "700", fontFamily: SERIF, color: "#14110d", lineHeight: 33 },

  byline: { flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 18, marginTop: 16, marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#e8e2d8" },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#edf7ed" },
  authorName: { fontSize: 14, fontWeight: "600", color: "#14110d" },
  bylineMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaDot: { color: "#9e9e9e" },
  readingTime: { fontSize: 12, color: "#7a6f5c" },
});
