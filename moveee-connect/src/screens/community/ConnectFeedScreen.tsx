import React from "react";
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Text,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useFeed } from "../../features/community/useFeed";
import PostCard from "../../components/community/PostCard";
import type { CommunityPost } from "../../types";

export default function ConnectFeedScreen() {
  const nav = useNavigation<any>();
  const { posts, refreshing, loading, hasMore, error, refresh, loadMore, likePost } = useFeed();

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <PostCard
      post={item}
      onPress={() => nav.navigate("PostDetail", { postId: item.id, post: item })}
      onLike={() => likePost(item.id)}
      onAuthorPress={() => nav.navigate("MemberProfile", { userId: item.author.id })}
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
      ) : posts.length === 0 && loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#b38238" />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
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
          contentContainerStyle={posts.length === 0 ? styles.listEmpty : styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3ece0" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0d8cc",
    backgroundColor: "#f3ece0",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#14110d" },
  newPostBtn: {
    backgroundColor: "#14110d",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { paddingVertical: 8 },
  listEmpty: { flexGrow: 1 },
  loader: { paddingVertical: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 10 },
  errorText: { color: "#c0392b", marginBottom: 8 },
  retryText: { color: "#b38238", fontWeight: "600" },
  emptyText: { color: "#9e9e9e", textAlign: "center", fontSize: 14, lineHeight: 20 },
});
