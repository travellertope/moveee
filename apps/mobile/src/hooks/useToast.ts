import { useState, useCallback } from "react";
import type { ToastData, ToastType } from "../components/ui/Toast";

let _counter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const show = useCallback(
    (message: string, type: ToastType = "info", duration?: number) => {
      const id = String(++_counter);
      setToasts((prev) => [...prev, { id, type, message, duration }]);
    },
    []
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
}
