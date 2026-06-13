import React, { useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, type ColorPalette } from "../../theme";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const TYPE_CONFIG: Record<
  ToastType,
  { color: string; icon: string }
> = {
  success:  { color: "#2D6A4F", icon: "checkmark-circle-outline" },
  error:    { color: "#C62828", icon: "close-circle-outline" },
  info:     { color: "#C5491F", icon: "information-circle-outline" },
  warning:  { color: "#E65100", icon: "warning-outline" },
};

export function Toast({ toast, onDismiss }: ToastProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { color, icon } = TYPE_CONFIG[toast.type];
  const progressAnim = useRef(new Animated.Value(1)).current;
  const duration = toast.duration ?? 3500;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0,
      duration,
      useNativeDriver: false,
    }).start(() => onDismiss(toast.id));
  }, []);

  return (
    <View style={[styles.container, { borderLeftColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.message}>{toast.message}</Text>
      <TouchableOpacity onPress={() => onDismiss(toast.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={16} color={c.ghost} />
      </TouchableOpacity>
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: color,
            width: progressAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ["0%", "100%"],
            }),
          },
        ]}
      />
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      width: 343,
      backgroundColor: c.paper,
      borderRadius: 8,
      borderLeftWidth: 4,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      elevation: 8,
      shadowColor: "#14110D",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      overflow: "hidden",
    },
    message: {
      flex: 1,
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
      lineHeight: 20,
    },
    progress: {
      position: "absolute",
      bottom: 0,
      left: 0,
      height: 4,
      borderBottomRightRadius: 4,
    },
  });
}
