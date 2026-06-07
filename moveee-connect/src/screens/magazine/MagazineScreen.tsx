import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useMagazine, type MagazineSection } from "../../features/magazine/useMagazine";
import TimeAgo from "../../components/ui/TimeAgo";
import type { Article } from "../../types";

const SERIF = Platform.select({ ios: "Georgia", android: "serif", default: "serif" });

function ArticleCard({ article, onPress }: { article: Article; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {article.featuredImage ? (
        <Image source={{ uri: article.featuredImage }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
      )}
      <View style={styles.cardBody}>
        {article.category ? <Text style={styles.cardCategory}>{article.category}</Text> : null}
        <Text style={styles.cardTitle} numberOfLines={3}>{article.title}</Text>
        <TimeAgo date={article.publishedAt} />
      </View>
    </TouchableOpacity>
  );
}

function SectionGrid({ section, onPressArticle }: { section: MagazineSection; onPressArticle: (a: Article) => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{section.name}</Text>
        <View style={styles.sectionRule} />
      </View>
      <FlatList
        data={section.articles}
        keyExtractor={(a) => a.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sectionRow}
        renderItem={({ item }) => <ArticleCard article={item} onPress={() => onPressArticle(item)} />}
      />
    </View>
  );
}

export default function MagazineScreen() {
  const nav = useNavigation<any>();
  const { featured, sections, loading, refreshing, error, refresh } = useMagazine();

  const openArticle = (article: Article) => {
    nav.navigate("Article", { slug: article.slug, article });
  };

  if (error && !featured && sections.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!featured && loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color="#b38238" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Magazine</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {featured ? (
          <TouchableOpacity style={styles.hero} onPress={() => openArticle(featured)} activeOpacity={0.95}>
            {featured.featuredImage ? (
              <Image source={{ uri: featured.featuredImage }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={[styles.heroImage, styles.cardImagePlaceholder]} />
            )}
            <View style={styles.heroBody}>
              {featured.category ? <Text style={styles.heroCategory}>{featured.category}</Text> : null}
              <Text style={styles.heroTitle} numberOfLines={3}>{featured.title}</Text>
              {featured.excerpt ? <Text style={styles.heroExcerpt} numberOfLines={2}>{featured.excerpt}</Text> : null}
              <TimeAgo date={featured.publishedAt} />
            </View>
          </TouchableOpacity>
        ) : null}

        {sections.map((section) => (
          <SectionGrid key={section.id} section={section} onPressArticle={openArticle} />
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e2d8",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 19, fontWeight: "700", fontFamily: SERIF, color: "#14110d" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  errorText: { color: "#c0392b", marginBottom: 8 },
  retryText: { color: "#b38238", fontWeight: "600" },

  // hero / featured article
  hero: { borderBottomWidth: 1, borderBottomColor: "#e8e2d8" },
  heroImage: { width: "100%", height: 220, backgroundColor: "#e0d8cc" },
  cardImagePlaceholder: { backgroundColor: "#e0d8cc" },
  heroBody: { padding: 18, gap: 6 },
  heroCategory: { fontSize: 11, fontWeight: "700", color: "#b38238", letterSpacing: 1.4, textTransform: "uppercase" },
  heroTitle: { fontSize: 22, fontWeight: "700", fontFamily: SERIF, color: "#14110d", lineHeight: 29 },
  heroExcerpt: { fontSize: 14, color: "#5a5347", lineHeight: 21 },

  // sections
  section: { paddingTop: 22, paddingBottom: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "700", fontFamily: SERIF, color: "#14110d", letterSpacing: 0.2 },
  sectionRule: { flex: 1, height: 1, backgroundColor: "#e8e2d8" },
  sectionRow: { paddingHorizontal: 18, gap: 14 },

  // article card
  card: { width: 200 },
  cardImage: { width: 200, height: 130, borderRadius: 6, borderWidth: 1, borderColor: "#e8e2d8" },
  cardBody: { paddingTop: 8, gap: 4 },
  cardCategory: { fontSize: 9, fontWeight: "700", color: "#b38238", letterSpacing: 1.2, textTransform: "uppercase" },
  cardTitle: { fontSize: 14, fontWeight: "600", fontFamily: SERIF, color: "#14110d", lineHeight: 19 },
});
