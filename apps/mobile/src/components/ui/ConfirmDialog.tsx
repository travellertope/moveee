import React, { useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";

interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export default function ConfirmDialog({
  visible,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmDialogProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={onClose}
            >
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.btn,
                destructive ? styles.destructiveBtn : styles.confirmBtn,
              ]}
              onPress={() => {
                onConfirm();
                onClose();
              }}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(20,17,13,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    card: {
      width: 320,
      backgroundColor: c.paper,
      borderRadius: 16,
      padding: 24,
      alignItems: "center",
    },
    title: {
      fontFamily: fonts.sansBold,
      fontSize: 16,
      color: c.ink,
      textAlign: "center",
    },
    description: {
      fontFamily: fonts.sans,
      fontSize: 14,
      color: c.mute,
      textAlign: "center",
      marginTop: 8,
      lineHeight: 22,
    },
    btnRow: {
      flexDirection: "row",
      gap: 12,
      marginTop: 24,
      width: "100%",
    },
    btn: {
      flex: 1,
      height: 48,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelBtn: {
      borderWidth: 1,
      borderColor: c.ghost,
    },
    confirmBtn: {
      backgroundColor: "#C5491F",
    },
    destructiveBtn: {
      backgroundColor: "#C62828",
    },
    cancelText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    confirmText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
  });
}
