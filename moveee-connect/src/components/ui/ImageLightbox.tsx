import React, { useState } from "react";
import {
  Modal, View, Image, TouchableOpacity, StyleSheet, Dimensions,
  FlatList, Text, StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize } from "../../theme";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

interface Props {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ images, initialIndex = 0, visible, onClose }: Props) {
  const [current, setCurrent] = useState(initialIndex);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color={colors.paper} />
        </TouchableOpacity>

        <FlatList
          data={images}
          keyExtractor={(uri, i) => `${uri}-${i}`}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, index) => ({ length: SCREEN_W, offset: SCREEN_W * index, index })}
          onMomentumScrollEnd={(e) => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
            setCurrent(idx);
          }}
          renderItem={({ item }) => (
            <View style={styles.slide}>
              <Image source={{ uri: item }} style={styles.image} resizeMode="contain" />
            </View>
          )}
        />

        {images.length > 1 && (
          <View style={styles.dotsRow}>
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, i === current && styles.dotActive]} />
            ))}
          </View>
        )}

        {images.length > 1 && (
          <Text style={styles.counter}>{current + 1} / {images.length}</Text>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center" },
  closeBtn: {
    position: "absolute", top: 48, right: 20, zIndex: 10,
    padding: 8, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20,
  },
  slide: { width: SCREEN_W, height: SCREEN_H, justifyContent: "center" },
  image: { width: SCREEN_W, height: SCREEN_H },
  dotsRow: {
    position: "absolute", bottom: 32, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 6,
  },
  dot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { backgroundColor: colors.paper },
  counter: {
    position: "absolute", bottom: 20, left: 0, right: 0,
    textAlign: "center", fontFamily: fonts.mono, fontSize: fontSize.xs, color: "rgba(255,255,255,0.6)",
  },
});
