import React, { useEffect, useMemo, useRef, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, GestureResponderEvent } from "react-native";
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";

/** 30s Spotify preview clip play/pause button — used on Music Review cards.
 * Mirrors packages/shared/components/pulse/AudioPreviewButton.tsx (web).
 *
 * Uses expo-audio, not expo-av: expo-av was removed in Expo SDK 57. The
 * shapes differ — expo-audio's play/pause are synchronous void calls and
 * `playing` is a plain property, where expo-av returned promises and a
 * status object. Behaviour here is unchanged: tap toggles, the clip
 * resets the button when it finishes, and the player is torn down on
 * unmount so a card scrolling out of view can't keep audio alive. */
export default function AudioPreviewButton({ uri }: { uri: string }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const playerRef = useRef<AudioPlayer | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const [playing, setPlaying] = useState(false);

  // Keyed on uri so this covers both unmount and a card being recycled
  // onto a different clip — a stale player must never outlive its source.
  useEffect(() => {
    return () => {
      subRef.current?.remove();
      playerRef.current?.remove();
      subRef.current = null;
      playerRef.current = null;
      setPlaying(false);
    };
  }, [uri]);

  const toggle = (e: GestureResponderEvent) => {
    e.stopPropagation();
    try {
      if (!playerRef.current) {
        const player = createAudioPlayer(uri);
        playerRef.current = player;
        subRef.current = player.addListener(
          "playbackStatusUpdate",
          (status: AudioStatus) => {
            if (!status.isLoaded) return;
            if (status.didJustFinish) setPlaying(false);
          }
        );
        player.play();
        setPlaying(true);
        return;
      }
      if (playerRef.current.playing) {
        playerRef.current.pause();
        setPlaying(false);
      } else {
        playerRef.current.play();
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
