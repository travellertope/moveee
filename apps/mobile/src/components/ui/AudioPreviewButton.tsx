import React, { useEffect, useRef, useState } from "react";
import { View, Image, TouchableOpacity, Text, GestureResponderEvent } from "react-native";
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from "expo-audio";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../../hooks/useColors";
import { radius } from "../../theme";

/** Album cover with an overlay play/pause circle for Spotify 30s preview clips.
 * Mirrors packages/shared/components/pulse/AudioPreviewButton.tsx (web).
 * Uses expo-audio (not expo-av, which was removed in Expo SDK 57). */
interface Props {
  uri?: string | null;
  coverUri?: string | null;
  width?: number;
  height?: number;
}

export default function AudioPreviewButton({ uri, coverUri, width = 48, height = 64 }: Props) {
  const c = useColors();
  const playerRef = useRef<AudioPlayer | null>(null);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      subRef.current?.remove();
      playerRef.current?.remove();
      subRef.current = null;
      playerRef.current = null;
      setPlaying(false);
    };
  }, [uri]);

  function toggle(e: GestureResponderEvent) {
    e.stopPropagation();
    try {
      if (!playerRef.current) {
        if (!uri) return;
        const player = createAudioPlayer(uri);
        playerRef.current = player;
        subRef.current = player.addListener("playbackStatusUpdate", (status: AudioStatus) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) setPlaying(false);
        });
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
  }

  if (!uri && !coverUri) return null;

  const btnSize = Math.round(Math.min(width, height) * 0.44);

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius.md,
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: coverUri ? "transparent" : c.ghost,
      }}
    >
      {coverUri ? (
        <Image source={{ uri: coverUri }} style={{ width, height }} resizeMode="cover" />
      ) : (
        <View style={{ width, height, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: 20 }}>🎵</Text>
        </View>
      )}
      {uri ? (
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.75}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          style={{
            position: "absolute",
            top: (height - btnSize) / 2,
            left: (width - btnSize) / 2,
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: "rgba(0,0,0,0.52)",
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.7)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name={playing ? "pause" : "play"}
            size={Math.round(btnSize * 0.38)}
            color="#fff"
          />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
