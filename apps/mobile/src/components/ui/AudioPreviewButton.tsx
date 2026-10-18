import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from "expo-audio";
import { useColors } from "../../hooks/useColors";
import { radius } from "../../theme";

/** Album cover with an overlay play/pause circle for iTunes 30s preview clips.
 * Mirrors packages/shared/components/pulse/AudioPreviewButton.tsx (web).
 *
 * NOTE: overflow:"hidden" is applied only to the inner image wrapper, NOT the
 * outer container. On Android, overflow:"hidden" clips touch events for any
 * absolutely-positioned children, so the overlay button must live outside it. */
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

  function toggle() {
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

  // Larger cover → larger rounded corners, bigger play button
  const coverRadius = width >= 60 ? radius.xl : radius.md;
  const btnSize = Math.round(Math.min(width, height) * 0.46);
  const iconSize = Math.round(btnSize * 0.42);

  return (
    <View style={{ width, height, flexShrink: 0 }}>
      {/* Inner wrapper with overflow:hidden for rounded corners — kept separate so
          the absolute overlay button below is NOT clipped on Android */}
      <View
        style={{
          position: "absolute",
          width,
          height,
          borderRadius: coverRadius,
          overflow: "hidden",
        }}
      >
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={{ width, height }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width,
              height,
              backgroundColor: c.paperDeep,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: width >= 60 ? 28 : 16 }}>🎵</Text>
          </View>
        )}
      </View>

      {/* Overlay button lives outside overflow:hidden so it receives touches.
          White frosted circle with dark icon — readable on any cover colour. */}
      {uri ? (
        <Pressable
          onPress={toggle}
          hitSlop={10}
          style={({ pressed }) => ({
            position: "absolute",
            top: (height - btnSize) / 2,
            left: (width - btnSize) / 2,
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: pressed ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.92)",
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: 2 },
            elevation: 4,
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <Ionicons
            name={playing ? "pause" : "play"}
            size={iconSize}
            color="#14110d"
            style={{ marginLeft: playing ? 0 : 2 }}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
