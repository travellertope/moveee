import { useState, useCallback, useEffect } from "react";
import { api, CULTURE_API } from "../../api/client";

interface Comment {
  id: string;
  content: string;
  author: { id: string; name: string; avatarUrl: string };
  publishedAt: string;
  likeCount: number;
  liked: boolean;
}

export function useComments(postId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get<Comment[]>(`${CULTURE_API}/community/comments?post_id=${postId}`)
      .then(setComments)
      .finally(() => setLoading(false));
  }, [postId]);

  const addComment = useCallback(
    async (content: string) => {
      const comment = await api.post<Comment>(`${CULTURE_API}/community/comment`, {
        post_id: postId,
        content,
      });
      setComments((prev) => [...prev, comment]);
      return comment;
    },
    [postId]
  );

  const reportPost = useCallback(
    async (reason: "spam" | "harassment" | "inappropriate") => {
      await api.post(`${CULTURE_API}/community/report`, { post_id: postId, reason });
    },
    [postId]
  );

  return { comments, loading, addComment, reportPost };
}
