import React, { useMemo, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ActivityIndicator,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedFeed } from "../../features/community/useUnifiedFeed";
import FeedItemCard from "../../components/community/FeedItemCard";
import type { FeedItem } from "../../types";

function feedItemToPostId(item: FeedItem): string {
  return item.wpId ?? item.id.replace(/^community-/, "");
}

// Mirrors CATEGORY_FILTERS in components/pulse/PulseFeed.tsx (web app)
const CATEGORY_FILTERS = [
  "Music", "Film", "Art", "Fashion", "Literature",
  "Food", "Tech", "Sport", "Travel", "Design",
];

function matchesCategory(item: FeedItem, category: string): boolean {
  const cat = category.toLowerCase();
  if (item.type === "pulse" || item.type === "editorial") return (item.category ?? "").toLowerCase() === cat;
  if (item.type === "directory") return (item.entryType ?? "").toLowerCase() === cat;
  return false;
}

export default function ConnectFeedScreen() {
  const nav = useNavigation<any>();
  const { items, refreshing, loading, hasMore, error, refresh, loadMore, react } = useUnifiedFeed();
  const [showSections, setShowSections] = useState(false);
  const [activeCategory, setActiveCategory] = useState("");

  const visibleItems = useMemo(
    () => (activeCategory ? items.filter((i) => matchesCategory(i, activeCategory)) : items),
    [items, activeCategory]
  );

  const handleCategory = (cat: string) => {
    setActiveCategory((prev) => (prev === cat ? "" : cat));
    setShowSections(false);
  };

  const openItem = (item: FeedItem) => {
    if (item.type === "community") {
      nav.navigate("PostDetail", { postId: feedItemToPostId(item), item });
      return;
    }
    if (item.type === "pulse") {
      nav.navigate("PulseDetail", { item });
      return;
    }
    if (item.type === "editorial") {
      nav.navigate("Magazine", { screen: "Article", params: { slug: item.slug } });
      return;
    }
    // Happening / directory / quote open dedicated screens once those exist.
  };

  const renderItem = ({ item }: { item: FeedItem }) => (
    <FeedItemCard
      item={item}
      onPress={() => openItem(item)}
      onAuthorPress={
        item.type === "community" && item.communityAuthorId
          ? () => nav.navigate("MemberProfile", { userId: item.communityAuthorId })
          : undefined
      }
      onReact={(type) => react(item, type)}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Connect</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.sectionsBtn, (showSections || activeCategory) && styles.sectionsBtnActive]}
            onPress={() => setShowSections((s) => !s)}
          >
            <Text style={styles.sectionsBtnLabel}>⊞ Sections</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newPostBtn}
            onPress={() => nav.navigate("NewPost")}
          >
            <Ionicons name="add" size={24} color="#f3ece0" />
          </TouchableOpacity>
        </View>
      </View>

      {showSections ? (
        <View style={styles.sectionsPanel}>
          <Text style={styles.sectionsPanelLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionsRow}>
            {CATEGORY_FILTERS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPill, activeCategory === cat && styles.categoryPillActive]}
                onPress={() => handleCategory(cat)}
              >
                <Text style={[styles.categoryPillText, activeCategory === cat && styles.categoryPillTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {activeCategory ? (
        <View style={styles.activeChipRow}>
          <Text style={styles.activeChipLabel}>Category</Text>
          <View style={styles.activeChip}>
            <Text style={styles.activeChipText}>{activeCategory}</Text>
          </View>
          <TouchableOpacity onPress={() => setActiveCategory("")} hitSlop={8}>
            <Ionicons name="close" size={14} color="#bbb" />
          </TouchableOpacity>
        </View>
      ) : null}

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : visibleItems.length === 0 && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#b38238" />
        </View>
      ) : (
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onRefresh={refresh}
          refreshing={refreshing}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="people-outline" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No posts yet. Be the first to share something!</Text>
            </View>
          }
          ListFooterComponent={
            loading && hasMore ? (
              <ActivityIndicator style={styles.loader} color="#b38238" />
            ) : null
          }
          contentContainerStyle={visibleItems.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#e8e2d8",
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 19, fontWeight: "700", fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "serif" }), color: "#14110d" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionsBtn: {
    backgroundColor: "#14110d", borderRadius: 2,
    paddingHorizontal: 11, paddingVertical: 8,
  },
  sectionsBtnActive: { backgroundColor: "#c5491f" },
  sectionsBtnLabel: { color: "#f3ece0", fontSize: 11, fontWeight: "700", letterSpacing: 0.6 },

  sectionsPanel: { borderBottomWidth: 1, borderBottomColor: "#e8e2d8", backgroundColor: "#fff", paddingTop: 10, paddingBottom: 10 },
  sectionsPanelLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase", color: "#7a6f5c", marginLeft: 18, marginBottom: 7 },
  sectionsRow: { flexDirection: "row", gap: 7, paddingHorizontal: 18 },
  categoryPill: {
    borderWidth: 1, borderColor: "#e8e2d8", borderRadius: 2,
    paddingHorizontal: 12, paddingVertical: 5, backgroundColor: "#fff",
  },
  categoryPillActive: { backgroundColor: "#c5491f", borderColor: "#c5491f" },
  categoryPillText: { fontSize: 12, color: "#3a342b" },
  categoryPillTextActive: { color: "#fff" },

  activeChipRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 18, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: "#e8e2d8", backgroundColor: "#fff",
  },
  activeChipLabel: { fontSize: 11, color: "#7a6f5c" },
  activeChip: { backgroundColor: "#fff0eb", borderRadius: 2, paddingHorizontal: 7, paddingVertical: 2 },
  activeChipText: { fontSize: 11, fontWeight: "700", color: "#c5491f" },

  newPostBtn: {
    backgroundColor: "#14110d",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  list: {},
  listEmpty: { flexGrow: 1 },
  loader: { paddingVertical: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  errorText: { color: "#c0392b", marginBottom: 8 },
  retryText: { color: "#b38238", fontWeight: "600" },
  emptyText: { color: "#9e9e9e", textAlign: "center", fontSize: 14, lineHeight: 20 },
});
