import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import BottomSheet from "../ui/BottomSheet";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, radius, type ColorPalette } from "../../theme";
import { MOBILE_API } from "../../api/client";
import { api } from "../../api/client";

const REASONS = [
  { id: "spam", label: "Spam or misleading" },
  { id: "harassment", label: "Harassment or hate speech" },
  { id: "inappropriate", label: "Inappropriate content" },
] as const;

type ReportReason = typeof REASONS[number]["id"];

interface ReportPostSheetProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

export default function ReportPostSheet({
  visible,
  onClose,
  postId,
}: ReportPostSheetProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [selected, setSelected] = useState<ReportReason>("spam");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`${MOBILE_API}/community/report`, {
        post_id: postId,
        reason: selected,
      });
    } catch {}
    setSubmitting(false);
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} initialState="peek">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Report this post</Text>
      </View>

      {REASONS.map((reason) => (
        <TouchableOpacity
          key={reason.id}
          style={styles.row}
          onPress={() => setSelected(reason.id)}
        >
          <View
            style={[
              styles.radio,
              selected === reason.id && styles.radioActive,
            ]}
          >
            {selected === reason.id && <View style={styles.radioDot} />}
          </View>
          <Text style={styles.rowLabel}>{reason.label}</Text>
        </TouchableOpacity>
      ))}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>
            {submitting ? "Submitting…" : "Submit report"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    header: {
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderBottomWidth: 1,
      borderBottomColor: c.ghost,
    },
    headerTitle: {
      fontFamily: fonts.sansBold,
      fontSize: 16,
      color: c.ink,
    },
    row: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.ghost,
    },
    radio: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: c.ghost,
      alignItems: "center",
      justifyContent: "center",
    },
    radioActive: {
      borderColor: "#C5491F",
    },
    radioDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#C5491F",
    },
    rowLabel: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.ink,
    },
    footer: {
      padding: 20,
    },
    submitBtn: {
      height: 48,
      backgroundColor: "#C5491F",
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    submitText: {
      fontFamily: fonts.sansBold,
      fontSize: fontSize.sm,
      color: "#fff",
    },
  });
}
