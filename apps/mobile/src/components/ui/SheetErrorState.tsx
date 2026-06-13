import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";

interface SheetErrorStateProps {
  visible: boolean;
  onClose: () => void;
  onRetry?: () => void;
  message?: string;
}

export default function SheetErrorState({
  visible,
  onClose,
  onRetry,
  message = "Couldn't load this post",
}: SheetErrorStateProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <BottomSheet visible={visible} onClose={onClose} initialState="peek">
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="wifi-outline" size={28} color={c.ghost} />
        </View>
        <Text style={styles.title}>{message}</Text>
        <Text style={styles.subtitle}>Check your connection and try again.</Text>
        {onRetry ? (
          <TouchableOpacity style={styles.retryBtn} onPress={onRetry}>
            <Text style={styles.retryBtnText}>Try again</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={onClose} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      paddingBottom: 48,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.paperWarm,
      borderWidth: 2,
      borderColor: c.ghost + "40",
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      fontSize: 18,
      fontWeight: "700",
      fontFamily: "Fraunces_700Bold",
      color: c.ink,
      marginTop: 16,
      textAlign: "center",
    },
    subtitle: {
      fontSize: 14,
      color: c.mute,
      textAlign: "center",
      lineHeight: 22,
      marginTop: 8,
      maxWidth: 260,
    },
    retryBtn: {
      width: 140,
      height: 44,
      backgroundColor: "#C5491F",
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    retryBtnText: {
      fontSize: 14,
      fontWeight: "700",
      color: "#fff",
    },
    dismissBtn: {
      marginTop: 16,
    },
    dismissText: {
      fontSize: 13,
      color: c.mute,
    },
  });
}
