import React from "react";
import { View, StyleSheet } from "react-native";
import { space } from "../../theme";
import StarRating from "./StarRating";

interface Ratings {
  taste: number;
  value: number;
  vibe: number;
}

interface Props {
  ratings: Ratings;
  onChange: (r: Ratings) => void;
}

export default function MultiRating({ ratings, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <StarRating label="Taste" value={ratings.taste} onChange={(v) => onChange({ ...ratings, taste: v })} size={24} />
      <StarRating label="Value" value={ratings.value} onChange={(v) => onChange({ ...ratings, value: v })} size={24} />
      <StarRating label="Vibe"  value={ratings.vibe}  onChange={(v) => onChange({ ...ratings, vibe:  v })} size={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space[2] },
});
