import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors, fonts, fontSize } from "../../theme";

interface Props {
  text: string;
  onHashtagPress?: (tag: string) => void;
  numberOfLines?: number;
  style?: object;
}

function parseSegments(text: string): Array<{ type: "text" | "tag"; value: string }> {
  const segments: Array<{ type: "text" | "tag"; value: string }> = [];
  const re = /#\w+/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      segments.push({ type: "text", value: text.slice(last, match.index) });
    }
    segments.push({ type: "tag", value: match[0] });
    last = match.index + match[0].length;
  }
  if (last < text.length) {
    segments.push({ type: "text", value: text.slice(last) });
  }
  return segments;
}

export default function HashtagText({ text, onHashtagPress, numberOfLines, style }: Props) {
  const segments = parseSegments(text);

  return (
    <Text numberOfLines={numberOfLines} style={[styles.base, style]}>
      {segments.map((seg, i) =>
        seg.type === "tag" ? (
          <Text
            key={i}
            style={styles.hashtag}
            onPress={onHashtagPress ? () => onHashtagPress(seg.value) : undefined}
          >
            {seg.value}
          </Text>
        ) : (
          <Text key={i}>{seg.value}</Text>
        )
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  base:    { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.ink, lineHeight: 22 },
  hashtag: { color: colors.gold, fontFamily: fonts.sansBold },
});
