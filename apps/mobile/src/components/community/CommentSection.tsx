import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { useAuthStore } from "../../auth/authStore";
import { useComments } from "../../features/community/useComments";
import { fonts, fontSize, radius, space } from "../../theme";
import type { ColorPalette } from "../../theme";

const PLACEHOLDER_AVATAR = "https://api.dicebear.com/7.x/initials/png?seed=U";

/**
 * Normalized comment shape every screen maps its own data into, so this one
 * component can render comments regardless of where they came from (the
 * custom community/comments API or WordPress's native comments REST).
 */
export interface NormalizedComment {
  id: string;
  authorName: string;
  avatarUrl?: string | null;
  content: string;
  date?: string;
}

interface CommentSectionProps {
  /** Pass a post ID to have this component fetch + post via the shared
   *  community/comments API itself (covers most screens). */
  postId?: string;
  /** Fully-controlled mode — pass these instead of `postId` when the screen
   *  has its own data source (e.g. ArticleScreen's WordPress-native
   *  comments with optimistic insertion). */
  comments?: NormalizedComment[];
  loading?: boolean;
  submitting?: boolean;
  onSubmit?: (text: string) => Promise<void> | void;
  heading?: string;
  emptyText?: string;
  /** Number of comments to show before a "View all" link. 0 = show all. */
  truncateAt?: number;
  signedIn?: boolean;
  signInPrompt?: string;
}

export default function CommentSection({
  postId,
  comments: controlledComments,
  loading: controlledLoading,
  submitting: controlledSubmitting,
  onSubmit,
  heading = "Comments",
  emptyText = "No comments yet — be the first to comment.",
  truncateAt = 3,
  signedIn = true,
  signInPrompt = "Sign in to leave a comment.",
}: CommentSectionProps) {
  const c = useColors();
  const styles = createStyles(c);
  const user = useAuthStore((s) => s.user);
  const isControlled = postId === undefined;
  const hookResult = useComments(postId ?? "__controlled__", !isControlled);

  const comments: NormalizedComment[] = isControlled
    ? controlledComments ?? []
    : hookResult.comments.map((cm) => ({
        id: cm.id,
        authorName: cm.author.name,
        avatarUrl: cm.author.avatarUrl,
        content: cm.content,
        date: cm.publishedAt,
      }));

  const loading = isControlled ? !!controlledLoading : hookResult.loading;

  const [text, setText] = useState("");
  const [internalSubmitting, setInternalSubmitting] = useState(false);
  const submitting = isControlled ? !!controlledSubmitting : internalSubmitting;
  const [showAll, setShowAll] = useState(false);

  const submit = async () => {
    const value = text.trim();
    if (!value) return;
    if (isControlled) {
      await onSubmit?.(value);
      setText("");
      return;
    }
    setInternalSubmitting(true);
    try {
      await hookResult.addComment(value);
      setText("");
    } finally {
      setInternalSubmitting(false);
    }
  };

  const displayed =
    truncateAt > 0 && !showAll ? comments.slice(0, truncateAt) : comments;

  return (
    <View>
      <Text style={styles.heading}>
        {heading} {comments.length > 0 ? `(${comments.length})` : ""}
      </Text>

      {loading && <ActivityIndicator color={c.gold} style={{ marginVertical: 12 }} />}

      {!loading && comments.length === 0 && (
        <Text style={styles.emptyText}>{emptyText}</Text>
      )}

      <View style={styles.list}>
        {displayed.map((cm) => (
          <View key={cm.id} style={styles.commentRow}>
            <Image
              source={{ uri: cm.avatarUrl || PLACEHOLDER_AVATAR }}
              style={styles.avatar}
            />
            <View style={styles.commentBody}>
              <View style={styles.commentMeta}>
                <Text style={styles.author}>{cm.authorName}</Text>
                {cm.date ? <Text style={styles.time}>{timeAgo(cm.date)}</Text> : null}
              </View>
              <Text style={styles.content}>{cm.content}</Text>
            </View>
          </View>
        ))}
      </View>

      {truncateAt > 0 && comments.length > truncateAt && !showAll && (
        <TouchableOpacity onPress={() => setShowAll(true)}>
          <Text style={styles.viewAll}>View all {comments.length} comments</Text>
        </TouchableOpacity>
      )}

      {signedIn ? (
        <>
          {user?.displayName || user?.name ? (
            <Text style={styles.commentingAs}>
              Commenting as <Text style={styles.commentingAsName}>{user.displayName ?? user.name}</Text>
            </Text>
          ) : null}
          <View style={styles.composeRow}>
            <Image
              source={{ uri: user?.avatarUrl || PLACEHOLDER_AVATAR }}
              style={styles.avatar}
            />
            <TextInput
              style={styles.composeInput}
              placeholder="Add a comment…"
              placeholderTextColor={c.ghost}
              value={text}
              onChangeText={setText}
              multiline
              returnKeyType="send"
              onSubmitEditing={submit}
            />
            <TouchableOpacity onPress={submit} disabled={submitting || !text.trim()}>
              {submitting ? (
                <ActivityIndicator size="small" color={c.gold} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={text.trim() ? c.gold : c.ghost}
                />
              )}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <Text style={styles.emptyText}>{signInPrompt}</Text>
      )}
    </View>
  );
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    heading: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.md,
      color: c.ink,
      marginBottom: space[3],
    },
    emptyText: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ghost,
      marginBottom: space[3],
    },
    list: {
      gap: space[3],
      marginBottom: space[2],
    },
    commentRow: {
      flexDirection: "row",
      gap: space[2] + 2,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: c.paperDeep,
    },
    commentBody: {
      flex: 1,
    },
    commentMeta: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    author: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    time: {
      fontFamily: fonts.mono,
      fontSize: fontSize.tiny,
      color: c.ghost,
    },
    content: {
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.inkSoft,
      lineHeight: 20,
    },
    viewAll: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      paddingVertical: space[2],
    },
    commentingAs: {
      fontFamily: fonts.sans,
      fontSize: fontSize.xs,
      color: c.ghost,
      marginTop: space[2],
      marginBottom: space[2],
    },
    commentingAsName: {
      fontFamily: fonts.sansBold,
      color: c.gold,
    },
    composeRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: space[2] + 2,
    },
    composeInput: {
      flex: 1,
      backgroundColor: c.paperWarm,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.ruleDark,
      paddingHorizontal: space[3],
      paddingVertical: space[2],
      fontFamily: fonts.sans,
      fontSize: fontSize.base,
      color: c.ink,
      maxHeight: 100,
    },
  });
}
