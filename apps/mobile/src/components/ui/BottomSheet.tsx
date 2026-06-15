import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import { radius, shadows } from "../../theme";

const { height: SCREEN_H } = Dimensions.get("window");
const FULL_H      = SCREEN_H * 0.90;   // 90% — full state (leaves 10% gap at top)
const PEEK_H      = SCREEN_H * 0.52;   // 52% — peek state
const DISMISS_VEL = 0.5;               // velocity threshold to dismiss
const EXPAND_VEL  = -0.5;              // velocity threshold to expand from peek
const PEEK_Y      = FULL_H - PEEK_H;   // translateY for peek (offset within sheet)

export type BottomSheetState = "peek" | "full" | "closed";

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  /** Start in peek state (truncated preview). Default: false (opens full). */
  initialState?: BottomSheetState;
  children: React.ReactNode;
  /** Content rendered only in peek (truncated body). If omitted, same as children. */
  peekContent?: React.ReactNode;
}

export default function BottomSheet({
  visible,
  onClose,
  initialState = "full",
  children,
  peekContent,
}: BottomSheetProps) {
  const c = useColors();
  const styles = createStyles(c);
  const insets = useSafeAreaInsets();

  const [sheetState, setSheetState] = useState<BottomSheetState>(initialState);
  const translateY    = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpac  = useRef(new Animated.Value(0)).current;
  const dragStart     = useRef(0);

  const targetY = sheetState === "full" ? 0 : PEEK_Y;

  // Animate in when visible
  useEffect(() => {
    if (visible) {
      const startY = sheetState === "full" ? 0 : PEEK_Y;
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: startY,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
        }),
        Animated.timing(backdropOpac, {
          toValue: sheetState === "full" ? 1 : 0.4,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      translateY.setValue(SCREEN_H);
      backdropOpac.setValue(0);
      setSheetState(initialState);
    }
  }, [visible]);

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_H,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpac, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start(() => {
      translateY.setValue(SCREEN_H);
      onClose();
    });
  }, [onClose]);

  const expandToFull = useCallback(() => {
    setSheetState("full");
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }),
      Animated.timing(backdropOpac, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const snapToPeek = useCallback(() => {
    setSheetState("peek");
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: PEEK_Y,
        useNativeDriver: true,
        damping: 22,
        stiffness: 220,
      }),
      Animated.timing(backdropOpac, {
        toValue: 0.4,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
      onPanResponderGrant: () => {
        dragStart.current = (translateY as any)._value;
      },
      onPanResponderMove: (_, g) => {
        const next = dragStart.current + g.dy;
        // Allow elastic overscroll up to 34px past top
        const clamped = Math.max(-34, next);
        translateY.setValue(clamped);
        // Backdrop opacity tracks position
        const ratio = 1 - clamped / (PEEK_Y);
        backdropOpac.setValue(Math.min(1, Math.max(0, 0.4 + ratio * 0.6)));
      },
      onPanResponderRelease: (_, g) => {
        const dy = g.dy;
        const vy = g.vy;
        const cur = dragStart.current;

        if (vy > DISMISS_VEL || (dy > SCREEN_H * 0.25 && vy >= 0)) {
          // Fast swipe down or dragged far enough → dismiss
          dismiss();
        } else if (vy < EXPAND_VEL || (dy < -SCREEN_H * 0.1 && vy <= 0)) {
          // Fast swipe up → expand to full
          expandToFull();
        } else if (cur > SCREEN_H * 0.2) {
          // Was in peek/partial, snap to peek
          snapToPeek();
        } else {
          // Snap back to full
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              damping: 22,
              stiffness: 220,
            }),
            Animated.timing(backdropOpac, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
          setSheetState("full");
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={dismiss}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={dismiss}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpac }]} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>

        {/* Chrome — drag area */}
        <View style={styles.chrome} {...panResponder.panHandlers}>
          <View style={styles.handle} />
          <TouchableWithoutFeedback onPress={dismiss}>
            <View style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>

        {sheetState === "peek" ? (
          // Peek: fixed height container, gradient fade, tap/swipe to expand
          <TouchableWithoutFeedback onPress={expandToFull}>
            <View style={styles.peekContent}>
              {peekContent ?? children}
              {/* Gradient fade at bottom */}
              <View style={styles.peekFade} pointerEvents="none" />
              {/* Swipe hint */}
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>↑ Swipe up for full post</Text>
              </View>
            </View>
          </TouchableWithoutFeedback>
        ) : (
          // Full: scrollable
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            showsVerticalScrollIndicator={false}
            bounces
            scrollEventThrottle={16}
          >
            {children}
          </ScrollView>
        )}
      </Animated.View>
    </Modal>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.ink,
    },
    sheet: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: FULL_H,
      backgroundColor: c.paper,
      borderTopLeftRadius: radius["2xl"] + 4,
      borderTopRightRadius: radius["2xl"] + 4,
      ...shadows.modal,
      overflow: "hidden",
    },
    chrome: {
      height: 52,
      width: "100%",
      position: "relative",
      flexShrink: 0,
      backgroundColor: c.paper,
      borderTopLeftRadius: radius["2xl"] + 4,
      borderTopRightRadius: radius["2xl"] + 4,
      zIndex: 10,
    },
    handle: {
      position: "absolute",
      top: 10,
      left: "50%",
      marginLeft: -14,
      width: 28,
      height: 4,
      backgroundColor: c.ghost,
      borderRadius: 2,
    },
    closeBtn: {
      position: "absolute",
      top: 14,
      right: 16,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.paperWarm,
      alignItems: "center",
      justifyContent: "center",
    },
    closeBtnText: {
      fontSize: 13,
      color: c.ink,
      fontWeight: "600",
    },
    peekContent: {
      height: PEEK_H - 52,
      overflow: "hidden",
      position: "relative",
    },
    peekFade: {
      position: "absolute",
      bottom: 48,
      left: 0,
      right: 0,
      height: 48,
      // Linear gradient from transparent to paper
      backgroundColor: "transparent",
      // RN doesn't support CSS gradients — use a semi-opaque overlay trick
      // For a true gradient, wrap with expo-linear-gradient in the parent
    },
    swipeHint: {
      position: "absolute",
      bottom: 12,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    swipeHintText: {
      fontSize: 9,
      color: c.ghost,
      letterSpacing: 0.6,
      textTransform: "uppercase",
      fontFamily: "JetBrainsMono_400Regular",
    },
    scrollArea: {
      flex: 1,
    },
  });
}
