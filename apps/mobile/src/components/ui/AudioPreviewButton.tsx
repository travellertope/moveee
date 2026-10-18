import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { createAudioPlayer, type AudioPlayer, type AudioStatus } from "expo-audio";
import { useColors } from "../../hooks/useColors";
import { radius } from "../../theme";

/** Album cover with an overlay play/pause circle for Spotify 30s preview clips.
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

  const btnSize = Math.round(Math.min(width, height) * 0.44);
  const iconSize = Math.round(btnSize * 0.4);

  return (
    <View style={{ width, height, flexShrink: 0 }}>
      {/* Inner wrapper with overflow:hidden for rounded corners — kept separate so
          the absolute overlay button below is NOT clipped on Android */}
      <View
        style={{
          position: "absolute",
          width,
          height,
          borderRadius: radius.md,
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
              backgroundColor: c.ghost,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 20 }}>🎵</Text>
          </View>
        )}
      </View>

      {/* Overlay button lives outside overflow:hidden so it receives touches */}
      {uri ? (
        <Pressable
          onPress={toggle}
          hitSlop={8}
          style={{
            position: "absolute",
            top: (height - btnSize) / 2,
            left: (width - btnSize) / 2,
            width: btnSize,
            height: btnSize,
            borderRadius: btnSize / 2,
            backgroundColor: "rgba(0,0,0,0.55)",
            borderWidth: 1.5,
            borderColor: "rgba(255,255,255,0.75)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
            <Ionicons
            name={playing ? "pause" : "play"}
            size={iconSize}
            color="#fff"
            style={{ marginLeft: playing ? 0 : 2 }}
          />
        </Pressable>
      ) : null}
    </View>
  );
}
