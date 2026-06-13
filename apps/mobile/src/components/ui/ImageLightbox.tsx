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
        {/* Top bar: close left, counter right */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.85}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </TouchableOpacity>
          {images.length > 1 && (
            <Text style={styles.counter}>{current + 1} / {images.length}</Text>
          )}
        </View>

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
              <View
                key={i}
                style={[
                  styles.dot,
                  i === current ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "#000000" },

  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    zIndex: 20, paddingTop: 56, paddingHorizontal: 16,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.paper,
    justifyContent: "center", alignItems: "center",
  },
  counter: {
    fontFamily: fonts.monoBold, fontSize: 13, color: "#FFFFFF",
  },

  slide: { width: SCREEN_W, height: SCREEN_H, justifyContent: "center" },
  image: { width: SCREEN_W, height: SCREEN_H },

  dotsRow: {
    position: "absolute", bottom: 40, left: 0, right: 0,
    flexDirection: "row", justifyContent: "center", gap: 8,
  },
  dot:         { borderRadius: 99 },
  dotActive:   { width: 8, height: 8, backgroundColor: "#FFFFFF" },
  dotInactive: { width: 6, height: 6, backgroundColor: "rgba(255,255,255,0.3)" },
});
