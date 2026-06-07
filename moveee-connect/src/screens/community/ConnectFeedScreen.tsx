import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUnifiedFeed } from "../../features/community/useUnifiedFeed";
import FeedItemCard from "../../components/community/FeedItemCard";
import type { CommunityPost, FeedItem, Tier } from "../../types";

function feedItemToPostId(item: FeedItem): string {
  return item.wpId ?? item.id.replace(/^community-/, "");
}

function feedItemToCommunityPost(item: FeedItem): CommunityPost {
  return {
    id: feedItemToPostId(item),
    content: item.title,
    imageUrl: item.image ?? undefined,
    author: {
      id: item.communityAuthorId ?? "",
      name: item.communityAuthor || "Member",
      avatarUrl: item.communityAuthorAvatar ?? "",
      tier: (item.communityTier as Tier) || "citizen",
    },
    publishedAt: item.date,
    likeCount: item.reactions?.love ?? 0,
    commentCount: item.commentCount ?? 0,
    liked: item.liked ?? false,
    status: "publish",
  };
}

export default function ConnectFeedScreen() {
  const nav = useNavigation<any>();
  const { items, refreshing, loading, hasMore, error, refresh, loadMore, react } = useUnifiedFeed();

  const openItem = (item: FeedItem) => {
    if (item.type === "community") {
      nav.navigate("PostDetail", { postId: feedItemToPostId(item), post: feedItemToCommunityPost(item) });
      return;
    }
    if (item.type === "pulse" || item.type === "editorial") {
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
        <TouchableOpacity
          style={styles.newPostBtn}
          onPress={() => nav.navigate("NewPost")}
        >
          <Ionicons name="add" size={24} color="#f3ece0" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : items.length === 0 && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#b38238" />
        </View>
      ) : (
        <FlatList
          data={items}
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
          contentContainerStyle={items.length === 0 ? styles.listEmpty : styles.list}
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
