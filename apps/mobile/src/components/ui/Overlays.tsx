/**
 * Shared overlay primitives for Moveee.
 *
 * Exports:
 *   BottomSheet          — generic draggable bottom sheet wrapper
 *   TemplatePickerSheet  — "Choose a post type" grid
 *   ReportSheet          — report post bottom sheet
 *   ConfirmRedeemDialog  — perk redeem confirmation
 *   SignOutDialog        — destructive sign-out confirmation
 *   PasskeyPromptSheet   — Face ID / biometric auth sheet
 *   ForYouExplainerSheet — "For You" feed onboarding
 *   ContextMenu          — long-press post actions menu
 *   Toast                — auto-dismissing status toasts (success/error/info/warning)
 *   useToast             — hook to imperatively fire toasts
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, Modal, Animated,
  Dimensions, Pressable, ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, radius, shadows } from "../../theme";

const { width: W, height: H } = Dimensions.get("window");

// ── Backdrop ─────────────────────────────────────────────────────────────────

function Backdrop({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.backdrop} onPress={onPress} />
  );
}

// ── Bottom Sheet wrapper ──────────────────────────────────────────────────────

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showHandle?: boolean;
}

export function BottomSheet({ visible, onClose, children, showHandle = true }: BottomSheetProps) {
  const slideY = useRef(new Animated.Value(H)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    } else {
      Animated.timing(slideY, { toValue: H, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.sheetContainer}>
        <Backdrop onPress={onClose} />
        <Animated.View style={[styles.sheet, { transform: [{ translateY: slideY }] }]}>
          {showHandle && <View style={styles.handle} />}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Template picker ───────────────────────────────────────────────────────────

const POST_TYPES = [
  { id: "post",               emoji: "✏️", label: "Post" },
  { id: "hidden-gem",         emoji: "💎", label: "Place" },
  { id: "cultural-take",      emoji: "💬", label: "Cultural Take" },
  { id: "food-review",        emoji: "🍽️", label: "Food Review" },
  { id: "creative-showcase",  emoji: "🎨", label: "Creative Showcase" },
  { id: "poll",               emoji: "📊", label: "Poll" },
  { id: "itinerary",          emoji: "🗺️", label: "Itinerary" },
  { id: "event",              emoji: "📅", label: "Event" },
  { id: "quote",              emoji: "✦",  label: "Quote" },
] as const;

type PostTypeId = (typeof POST_TYPES)[number]["id"];

interface TemplatePickerSheetProps {
  visible: boolean;
  selected: PostTypeId;
  onSelect: (id: PostTypeId) => void;
  onClose: () => void;
}

export function TemplatePickerSheet({ visible, selected, onSelect, onClose }: TemplatePickerSheetProps) {
  const cols = 3;
  const cardW = (W - 32 - 24) / cols;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Text style={styles.sheetTitle}>Choose a post type</Text>
      <View style={styles.templateGrid}>
        {POST_TYPES.map((pt) => (
          <TouchableOpacity
            key={pt.id}
            style={[styles.templateCard, { width: cardW }, selected === pt.id && styles.templateCardActive]}
            onPress={() => { onSelect(pt.id); onClose(); }}
            activeOpacity={0.7}
          >
            <Text style={styles.templateEmoji}>{pt.emoji}</Text>
            <Text style={styles.templateLabel}>{pt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.sheetCancelBtn} onPress={onClose}>
        <Text style={styles.sheetCancelText}>Cancel</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

// ── Report sheet ──────────────────────────────────────────────────────────────

const REPORT_REASONS = [
  { id: "spam",          label: "Spam or misleading" },
  { id: "harassment",    label: "Harassment or hate speech" },
  { id: "inappropriate", label: "Inappropriate content" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["id"];

interface ReportSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: ReportReason) => void;
}

export function ReportSheet({ visible, onClose, onSubmit }: ReportSheetProps) {
  const [selected, setSelected] = useState<ReportReason>("spam");

  return (
    <BottomSheet visible={visible} onClose={onClose} showHandle={false}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>Report this post</Text>
      </View>
      {REPORT_REASONS.map((r) => (
        <TouchableOpacity
          key={r.id}
          style={styles.reportRow}
          onPress={() => setSelected(r.id)}
          activeOpacity={0.7}
        >
          <View style={[styles.radioOuter, selected === r.id && styles.radioOuterActive]}>
            {selected === r.id && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.reportRowText}>{r.label}</Text>
        </TouchableOpacity>
      ))}
      <View style={styles.reportFooter}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={() => { onSubmit(selected); onClose(); }}
          activeOpacity={0.85}
        >
          <Text style={styles.submitBtnText}>Submit report</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ── Confirm redeem dialog ─────────────────────────────────────────────────────

interface ConfirmRedeemDialogProps {
  visible: boolean;
  perkName: string;
  cost: number;
  balance: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmRedeemDialog({ visible, perkName, cost, balance, onConfirm, onCancel }: ConfirmRedeemDialogProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Redeem this perk?</Text>
          <Text style={styles.dialogPerkName}>{perkName}</Text>
          <Text style={styles.dialogCost}>
            This will spend {cost} CR. Balance: {balance.toLocaleString()} → {(balance - cost).toLocaleString()} CR
          </Text>
          <View style={styles.dialogButtons}>
            <TouchableOpacity style={styles.dialogCancelBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogConfirmBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.dialogConfirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Sign out dialog ───────────────────────────────────────────────────────────

interface SignOutDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function SignOutDialog({ visible, onConfirm, onCancel }: SignOutDialogProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.dialogBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>Sign out?</Text>
          <Text style={styles.dialogDesc}>
            You'll need to sign in again to access your account.
          </Text>
          <View style={styles.dialogButtons}>
            <TouchableOpacity style={styles.dialogGhostBtn} onPress={onCancel} activeOpacity={0.8}>
              <Text style={styles.dialogCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dialogDestructiveBtn} onPress={onConfirm} activeOpacity={0.85}>
              <Text style={styles.dialogConfirmText}>Sign out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Passkey prompt sheet ──────────────────────────────────────────────────────

interface PasskeyPromptSheetProps {
  visible: boolean;
  onCancel: () => void;
}

export function PasskeyPromptSheet({ visible, onCancel }: PasskeyPromptSheetProps) {
  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <View style={styles.passkeyContent}>
        <View style={styles.passkeyIcon}>
          <Ionicons name="scan-outline" size={28} color="#007AFF" />
        </View>
        <Text style={styles.passkeyApp}>Moveee</Text>
        <Text style={styles.passkeyTitle}>Sign in with Face ID</Text>
        <Text style={styles.passkeyDesc}>Use your biometric to log in securely.</Text>
        <TouchableOpacity style={styles.passkeyCancel} onPress={onCancel}>
          <Text style={styles.passkeyCancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ── For You explainer sheet ───────────────────────────────────────────────────

interface ForYouExplainerProps {
  visible: boolean;
  onSetupInterests: () => void;
  onDismiss: () => void;
}

export function ForYouExplainerSheet({ visible, onSetupInterests, onDismiss }: ForYouExplainerProps) {
  return (
    <BottomSheet visible={visible} onClose={onDismiss}>
      <View style={styles.explainerContent}>
        <Text style={styles.explainerStar}>✦</Text>
        <Text style={styles.explainerTitle}>For You feed</Text>
        <Text style={styles.explainerDesc}>
          We rank your feed based on your interests and engagement. The more you post and react, the better it gets.
        </Text>
        <TouchableOpacity style={styles.explainerCTA} onPress={onSetupInterests} activeOpacity={0.85}>
          <Text style={styles.explainerCTAText}>Set up your interests →</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.explainerLater} onPress={onDismiss}>
          <Text style={styles.explainerLaterText}>Maybe later</Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

interface ContextMenuProps {
  visible: boolean;
  onClose: () => void;
  onCopyLink?: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onReport?: () => void;
  anchorStyle?: object;
}

export function ContextMenu({ visible, onClose, onCopyLink, onSave, onShare, onReport, anchorStyle }: ContextMenuProps) {
  if (!visible) return null;

  const item = (label: string, iconName: keyof typeof Ionicons.glyphMap, onPress?: () => void, destructive = false) => (
    <TouchableOpacity
      style={styles.ctxItem}
      onPress={() => { onPress?.(); onClose(); }}
      activeOpacity={0.7}
    >
      <Ionicons name={iconName} size={16} color={destructive ? colors.error : colors.ink} />
      <Text style={[styles.ctxItemText, destructive && { color: colors.error }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.ctxBackdrop} onPress={onClose}>
        <View style={[styles.ctxMenu, anchorStyle]}>
          {item("Copy link",  "copy-outline",     onCopyLink)}
          {item("Save post",  "bookmark-outline", onSave)}
          {item("Share",      "share-outline",    onShare)}
          <View style={styles.ctxDivider} />
          {item("Report",     "flag-outline",     onReport, true)}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info" | "warning";

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number;
}

const TOAST_META: Record<ToastType, { border: string; icon: keyof typeof Ionicons.glyphMap; iconColor: string; progressColor: string }> = {
  success: { border: colors.success,  icon: "checkmark-circle-outline", iconColor: colors.success, progressColor: colors.success },
  error:   { border: colors.error,    icon: "close-circle-outline",     iconColor: colors.error,   progressColor: colors.error   },
  info:    { border: colors.ochre,    icon: "information-circle-outline",iconColor: colors.ochre,   progressColor: colors.ochre   },
  warning: { border: colors.warning,  icon: "warning-outline",          iconColor: colors.warning, progressColor: colors.warning },
};

interface ToastProps extends ToastConfig {
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = "info", duration = 3000, visible, onHide }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(1)).current;
  const meta = TOAST_META[type];

  useEffect(() => {
    if (!visible) return;
    progress.setValue(1);
    Animated.parallel([
      Animated.timing(opacity,   { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(progress,  { toValue: 0, duration, useNativeDriver: false }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(onHide);
    }, duration);
    return () => clearTimeout(t);
  }, [visible, message]);

  if (!visible) return null;

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });

  return (
    <Animated.View style={[styles.toast, { opacity, borderLeftColor: meta.border }]}>
      <Ionicons name={meta.icon} size={20} color={meta.iconColor} style={{ marginRight: 12 }} />
      <Text style={styles.toastText} numberOfLines={2}>{message}</Text>
      <Animated.View style={[styles.toastBar, { width: barWidth, backgroundColor: meta.progressColor }]} />
    </Animated.View>
  );
}

// ── useToast hook ─────────────────────────────────────────────────────────────

export function useToast() {
  const [toast, setToast] = useState<(ToastConfig & { visible: boolean; key: number }) | null>(null);
  const keyRef = useRef(0);

  const show = useCallback((config: ToastConfig) => {
    keyRef.current += 1;
    setToast({ ...config, visible: true, key: keyRef.current });
  }, []);

  const hide = useCallback(() => {
    setToast((prev) => prev ? { ...prev, visible: false } : null);
  }, []);

  const ToastNode = toast ? (
    <Toast
      key={toast.key}
      message={toast.message}
      type={toast.type}
      duration={toast.duration}
      visible={toast.visible}
      onHide={hide}
    />
  ) : null;

  return { show, ToastNode };
}

// ── Toast container (place at root of each screen that uses toasts) ───────────

export function ToastContainer({ children }: { children: React.ReactNode }) {
  return <View style={{ flex: 1 }}>{children}</View>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Backdrop
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(20,17,13,0.45)",
  },

  // Sheet
  sheetContainer: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    shadowColor: "#14110D", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 20,
    paddingBottom: 40,
  },
  handle: {
    width: 32, height: 4, borderRadius: 2, backgroundColor: colors.ghost,
    alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: fonts.sansBold, fontSize: 15, color: colors.ink,
    textAlign: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
  },
  sheetCancelBtn: { marginTop: 24, alignItems: "center" },
  sheetCancelText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mute },

  // Template grid
  templateGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12,
    paddingHorizontal: 16,
  },
  templateCard: {
    height: 72, backgroundColor: colors.paper, borderRadius: 12,
    justifyContent: "center", alignItems: "center", gap: 4,
    ...shadows.card, borderWidth: 2, borderColor: "transparent",
  },
  templateCardActive: { borderColor: colors.ochre },
  templateEmoji: { fontSize: 24 },
  templateLabel: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.ink, textAlign: "center", paddingHorizontal: 2 },

  // Report sheet
  reportHeader: {
    paddingHorizontal: 24, paddingVertical: 24,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  reportTitle: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink },
  reportRow: {
    height: 52, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  radioOuter: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: colors.ghost,
    justifyContent: "center", alignItems: "center",
  },
  radioOuterActive: { borderColor: colors.ochre },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.ochre },
  reportRowText: { fontFamily: fonts.sans, fontSize: 15, color: colors.ink },
  reportFooter: { paddingHorizontal: 20, paddingTop: 20 },
  submitBtn: {
    height: 48, backgroundColor: colors.ochre, borderRadius: radius.full,
    justifyContent: "center", alignItems: "center",
  },
  submitBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.paper },

  // Dialog
  dialogBackdrop: {
    flex: 1, backgroundColor: "rgba(20,17,13,0.45)",
    justifyContent: "center", alignItems: "center",
  },
  dialog: {
    width: 320, backgroundColor: colors.paper, borderRadius: 24,
    padding: 24, alignItems: "center",
    shadowColor: "#14110D", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 24, elevation: 16,
  },
  dialogTitle:    { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, textAlign: "center" },
  dialogPerkName: { fontFamily: fonts.serifBold, fontSize: 18, color: colors.ink, marginTop: 8, textAlign: "center" },
  dialogDesc:     { fontFamily: fonts.sans, fontSize: 14, color: colors.mute, marginTop: 8, textAlign: "center", lineHeight: 20 },
  dialogCost:     { fontFamily: fonts.sans, fontSize: 13, color: colors.mute, marginTop: 8, textAlign: "center" },
  dialogButtons:  { flexDirection: "row", gap: 12, marginTop: 16, width: "100%" },
  dialogCancelBtn: {
    flex: 1, height: 48, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.ink,
    justifyContent: "center", alignItems: "center",
  },
  dialogGhostBtn: {
    flex: 1, height: 48, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.ghost,
    justifyContent: "center", alignItems: "center",
  },
  dialogConfirmBtn: {
    flex: 1, height: 48, borderRadius: radius.full,
    backgroundColor: colors.ochre,
    justifyContent: "center", alignItems: "center",
  },
  dialogDestructiveBtn: {
    flex: 1, height: 48, borderRadius: radius.full,
    backgroundColor: colors.error,
    justifyContent: "center", alignItems: "center",
  },
  dialogCancelText:  { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  dialogConfirmText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.paper },

  // Passkey
  passkeyContent: { alignItems: "center", paddingTop: 32, paddingBottom: 8, paddingHorizontal: 24 },
  passkeyIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#E8F0FE", justifyContent: "center", alignItems: "center",
    marginTop: 0,
  },
  passkeyApp:    { fontFamily: fonts.sans, fontSize: 12, color: colors.mute, marginTop: 16 },
  passkeyTitle:  { fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginTop: 12 },
  passkeyDesc:   { fontFamily: fonts.sans, fontSize: 14, color: colors.mute, marginTop: 8, textAlign: "center" },
  passkeyCancel: { marginTop: 16, paddingVertical: 8 },
  passkeyCancelText: { fontFamily: fonts.sans, fontSize: 14, color: colors.mute },

  // For You explainer
  explainerContent: { alignItems: "center", paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  explainerStar:  { fontSize: 24, color: colors.ochre, fontFamily: fonts.sansBold, marginTop: 0 },
  explainerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink, marginTop: 8 },
  explainerDesc: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.mute,
    textAlign: "center", maxWidth: 280, marginTop: 12, lineHeight: 22,
  },
  explainerCTA: {
    width: 280, height: 48, backgroundColor: colors.ochre,
    borderRadius: radius.full, justifyContent: "center", alignItems: "center",
    marginTop: 20,
  },
  explainerCTAText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.paper },
  explainerLater: { marginTop: 12, paddingVertical: 8 },
  explainerLaterText: { fontFamily: fonts.sans, fontSize: 13, color: colors.ghost },

  // Context menu
  ctxBackdrop: {
    flex: 1, backgroundColor: "rgba(20,17,13,0.25)",
  },
  ctxMenu: {
    width: 200, backgroundColor: colors.paper, borderRadius: 12,
    paddingVertical: 8,
    shadowColor: "#14110D", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
  },
  ctxItem: {
    height: 44, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, gap: 12,
  },
  ctxItemText: { fontFamily: fonts.sans, fontSize: 14, color: colors.ink },
  ctxDivider: {
    height: 1, backgroundColor: colors.ghost,
    marginHorizontal: 16, marginVertical: 4,
  },

  // Toast
  toast: {
    position: "absolute", top: 56, alignSelf: "center",
    width: W - 32, backgroundColor: colors.paper,
    borderRadius: 8, padding: 16,
    flexDirection: "row", alignItems: "center",
    borderLeftWidth: 4,
    shadowColor: "#14110D", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 10,
    overflow: "hidden",
    zIndex: 9999,
  },
  toastText: { flex: 1, fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink, lineHeight: 18 },
  toastBar: {
    position: "absolute", bottom: 0, left: 0, height: 3,
    borderTopRightRadius: 2, borderBottomRightRadius: 2,
  },
});
