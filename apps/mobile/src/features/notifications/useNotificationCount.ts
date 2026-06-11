import { useEffect, useState, useCallback } from "react";
import { api } from "../../api/client";

const PROXY = "https://themoveee.com/api";
const POLL_INTERVAL_MS = 30_000;

export function useNotificationCount() {
  const [unread, setUnread] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const data = await api.get<{ unread: number }>(`${PROXY}/notifications/count`);
      setUnread(data.unread ?? 0);
    } catch {
      // silent — badge stays stale rather than crashing
    }
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchCount]);

  return { unread, refresh: fetchCount };
}
