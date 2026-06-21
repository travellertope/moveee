import React from "react";
import { View, StyleSheet } from "react-native";
import { Toast } from "./Toast";
import type { ToastData } from "./Toast";

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 8,
    zIndex: 9999,
  },
});
