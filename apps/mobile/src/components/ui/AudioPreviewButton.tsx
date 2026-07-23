import React, { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";

/** 30s Spotify preview clip play/pause button — used on Music Review cards.
 * Mirrors packages/shared/components/pulse/AudioPreviewButton.tsx (web). */
export default function AudioPreviewButton({ uri }: { uri: string }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
    };
  }, []);

  const onStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    if (status.didJustFinish) setPlaying(false);
  };

  const toggle = async (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true },
          onStatusUpdate
        );
        soundRef.current = sound;
        setPlaying(true);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (!status.isLoaded) return;
      if (status.isPlaying) {
        await soundRef.current.pauseAsync();
        setPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
    }
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      style={styles.btn}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons name={playing ? "pause" : "play"} size={11} color={c.templateMusicText} />
      <Text style={styles.label}>Preview</Text>
    </TouchableOpacity>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    btn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: c.templateMusicBg,
      borderRadius: radius.full,
      paddingHorizontal: 10,
      paddingVertical: 4,
      alignSelf: "flex-start",
    },
    label: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.xs - 0.5,
      color: c.templateMusicText,
    },
  });
}
