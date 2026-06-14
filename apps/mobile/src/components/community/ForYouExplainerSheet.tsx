import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";

interface ForYouExplainerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSetupInterests: () => void;
}

export default function ForYouExplainerSheet({
  visible,
  onClose,
  onSetupInterests,
}: ForYouExplainerSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <BottomSheet visible={visible} onClose={onClose} initialState="peek">
      <View style={styles.container}>
        <Text style={styles.sparkle}>✦</Text>
        <Text style={styles.title}>For You feed</Text>
        <Text style={styles.description}>
          We rank your feed based on your interests and engagement. The more you
          post and react, the better it gets.
        </Text>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => {
            onClose();
            onSetupInterests();
          }}
        >
          <Text style={styles.primaryBtnText}>Set up your interests →</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.laterLink}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      paddingHorizontal: 24,
      paddingBottom: 32,
    },
    sparkle: {
      fontSize: 24,
      color: "#C5491F",
      marginTop: 20,
    },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
      marginTop: 8,
    },
    description: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: 22,
      marginTop: 12,
    },
    primaryBtn: {
      width: 280,
      height: 48,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 20,
    },
    primaryBtnText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
    laterLink: {
      fontFamily: fonts.sans,
      fontSize: 13,
      color: c.ghost,
      marginTop: 12,
    },
  });
}
