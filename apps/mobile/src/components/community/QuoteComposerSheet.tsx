import React, { useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from "react-native";
import BottomSheet from "../ui/BottomSheet";
import DirectorySearch, { DirectoryEntry } from "../composer/DirectorySearch";
import { api, MOBILE_API } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const QUOTE_TYPE_MAP: Record<string, string> = {
  book: "Book",
  film: "Film",
  album: "Song",
};

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Pre-linked directory entry id */
  entryId: number;
  /** Pre-linked directory entry title */
  entryTitle: string;
  /** "author" = person (pre-set as who said it); "source" = book/film/album (pre-set as the work) */
  quoteLinkRole: "author" | "source";
  /** Type slug: "book" | "film" | "album" — only relevant when quoteLinkRole is "source" */
  quoteLinkType?: string;
}

export default function QuoteComposerSheet({
  visible, onClose, onSuccess,
  entryId, entryTitle, quoteLinkRole, quoteLinkType,
}: Props) {
  const [text, setText] = useState("");
  const [authorEntry, setAuthorEntry] = useState<DirectoryEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const quoteType = quoteLinkRole === "author"
    ? "Person"
    : (quoteLinkType ? QUOTE_TYPE_MAP[quoteLinkType] : undefined);

  const handleClose = useCallback(() => {
    setText("");
    setAuthorEntry(null);
    onClose();
  }, [onClose]);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      await api.post(`${MOBILE_API}/community/quote`, {
        text: text.trim(),
        // For author-role: the entry IS the author; for source-role: the separately
        // searched authorEntry (if any) is who said it
        author:  quoteLinkRole === "author" ? entryTitle : (authorEntry?.title ?? ""),
        source:  quoteLinkRole === "source" ? entryTitle : undefined,
        quote_author_directory_id: quoteLinkRole === "author" ? entryId : (authorEntry?.id ?? undefined),
        linked_directory_id:       quoteLinkRole === "source" ? entryId : undefined,
        quote_type: quoteType,
      });
      handleClose();
      onSuccess?.();
    } catch {
      Alert.alert("Couldn't save", "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = text.trim().length >= 10;

  return (
    <BottomSheet visible={visible} onClose={handleClose} initialState="full">
      <View style={styles.inner}>
        <Text style={styles.heading}>Save a line</Text>

        {/* Pre-linked entry chip */}
        <View style={styles.section}>
          <Text style={styles.label}>
            {quoteLinkRole === "author" ? "Author" : "Source"}
          </Text>
          <View style={styles.preselectedChip}>
            <Text style={styles.preselectedText}>{entryTitle}</Text>
          </View>
        </View>

        {/* Author search — only shown when entry is a source (book/film/album) */}
        {quoteLinkRole === "source" && (
          <View style={styles.section}>
            <DirectorySearch
              label="Who said it (optional)"
              selected={authorEntry}
              onSelect={(e) => setAuthorEntry(e)}
              typeFilter="person"
            />
          </View>
        )}

        {/* Quote text */}
        <View style={styles.section}>
          <Text style={styles.label}>The line *</Text>
          <TextInput
            style={styles.textArea}
            value={text}
            onChangeText={setText}
            placeholder="Type the quote…"
            placeholderTextColor={colors.ghost}
            multiline
            maxLength={600}
            autoFocus
          />
          <Text style={styles.counter}>{text.length}/600</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
        >
          {submitting
            ? <ActivityIndicator color={colors.paper} size="small" />
            : <Text style={styles.submitText}>Save line</Text>
          }
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  inner: {
    padding: space[4],
    gap: space[3],
  },
  heading: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.lg,
    color: colors.ink,
  },
  section: {
    gap: space[1],
  },
  label: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.mute,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  preselectedChip: {
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.goldBorder,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
  },
  preselectedText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.ink,
  },
  textArea: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.rule,
    borderRadius: radius.md,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    minHeight: 100,
    textAlignVertical: "top",
    backgroundColor: colors.paper,
  },
  counter: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.ghost,
    textAlign: "right",
  },
  submitBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    paddingVertical: space[3],
    alignItems: "center",
    marginTop: space[1],
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
});
