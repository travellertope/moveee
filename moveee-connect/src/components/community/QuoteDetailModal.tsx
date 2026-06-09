import React, { useEffect, useRef } from "react";
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  Animated, StyleSheet, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReactionBar from "./ReactionBar";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import type { FeedItem } from "../../types";

const { height: SCREEN_H } = Dimensions.get("window");
const SHEET_H = SCREEN_H * 0.72;

interface Props {
  visible: boolean;
  item: FeedItem;
  onClose: () => void;
}

export default function QuoteDetailModal({ visible, item, onClose }: Props) {
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 280 : 200,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_H, 0],
  });
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });

  const shareUrl = item.slug ? `https://themoveee.com/community/${item.slug}` : undefined;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.sheetHeader}>
          <View style={styles.handle} />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {/* Large quote */}
          <View style={styles.quoteBlock}>
            <Text style={styles.quoteMark}>"</Text>
            <Text style={styles.quoteText}>{item.title}</Text>
            <Text style={styles.closeMark}>"</Text>
          </View>

          {/* Author + source */}
          <View style={styles.attribution}>
            {item.quoteAuthor && (
              <Text style={styles.author}>{item.quoteAuthor}</Text>
            )}
            {item.quoteSource && (
              <Text style={styles.source}>{item.quoteSource}</Text>
            )}
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Reactions */}
          {item.reactions && item.wpId && (
            <ReactionBar
              postId={item.wpId}
              initialCounts={item.reactions}
              shareUrl={shareUrl}
            />
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    height: SHEET_H,
    backgroundColor: colors.paperWarm,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHeader: {
    alignItems: "center", paddingTop: space[2], paddingBottom: space[1],
    paddingHorizontal: space[4],
    flexDirection: "row", justifyContent: "center",
    borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  handle:   { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ghost },
  closeBtn: { position: "absolute", right: space[4], padding: 4 },

  body: { padding: space[5], gap: space[4], paddingBottom: space[10] },

  quoteBlock: { gap: space[1] },
  quoteMark:  { fontFamily: fonts.serifBold, fontSize: 72, color: colors.gold, lineHeight: 60, marginBottom: -space[2] },
  quoteText:  { fontFamily: fonts.serif, fontSize: fontSize.xl, color: colors.ink, lineHeight: 30, fontStyle: "italic" },
  closeMark:  { fontFamily: fonts.serifBold, fontSize: 48, color: colors.gold, lineHeight: 36, textAlign: "right", marginTop: -space[1] },

  attribution: { gap: space[1], paddingLeft: space[2] },
  author: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },
  source: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: colors.rule },
});
