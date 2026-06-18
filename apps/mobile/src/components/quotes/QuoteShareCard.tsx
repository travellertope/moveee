import React, { forwardRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, fontSize, space, radius } from "../../theme";

const CARD_WIDTH = 360;
const CARD_HEIGHT = 600;

export interface QuoteShareCardProps {
  quoteText: string;
  quoteAuthor?: string | null;
  quoteSource?: string | null;
  qrValue: string;
}

const QuoteShareCard = forwardRef<View, QuoteShareCardProps>(function QuoteShareCard(
  { quoteText, quoteAuthor, quoteSource, qrValue },
  ref
) {
  return (
    <View ref={ref} collapsable={false} style={styles.wrap}>
      <LinearGradient
        colors={["#1a140d", "#2a1d10"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.brandRow}>
          <Text style={styles.brandName}>MOVEEE</Text>
          <Text style={styles.brandTag}>Connect to Culture</Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.openMark}>"</Text>
        <Text style={styles.quoteText} numberOfLines={8}>{quoteText}</Text>

        {(quoteAuthor || quoteSource) && (
          <View style={styles.attribution}>
            {quoteAuthor ? <Text style={styles.author}>{quoteAuthor}</Text> : null}
            {quoteSource ? <Text style={styles.source}>{quoteSource}</Text> : null}
          </View>
        )}

        <View style={styles.qrWrap}>
          <View style={styles.qrBadge}>
            <Text style={styles.qrBadgeText}>M</Text>
          </View>
          <View style={styles.qrBox}>
            <QRCode value={qrValue} size={84} backgroundColor="#fff" color="#1a140d" />
          </View>
          <Text style={styles.qrLabel}>Scan to read on Moveee</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

export default QuoteShareCard;

const styles = StyleSheet.create({
  wrap: { width: CARD_WIDTH, height: CARD_HEIGHT },
  card: {
    width: CARD_WIDTH, height: CARD_HEIGHT,
    paddingHorizontal: space[6], paddingVertical: space[8],
    alignItems: "center",
  },

  brandRow: { alignItems: "center", marginBottom: space[4] },
  brandName: { fontFamily: fonts.serifBold, fontSize: 22, color: "#f3ece0", letterSpacing: 2 },
  brandTag:  { fontFamily: fonts.mono, fontSize: 10, color: "#c9a878", letterSpacing: 1, marginTop: 2 },

  divider: { width: 48, height: 2, backgroundColor: "#b38238", marginBottom: space[8] },

  openMark: {
    fontFamily: fonts.serifBold, fontSize: 64, color: "#b38238",
    lineHeight: 56, marginBottom: -8,
  },
  quoteText: {
    fontFamily: fonts.serif, fontStyle: "italic", fontSize: 24, lineHeight: 34,
    color: "#f3ece0", textAlign: "center", marginBottom: space[6],
  },

  attribution: { alignItems: "center", marginBottom: space[8] },
  author: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: "#e8ddcb" },
  source: { fontFamily: fonts.mono, fontSize: 11, color: "#9c8a70", letterSpacing: 0.5, marginTop: 4 },

  qrWrap: { alignItems: "center", marginTop: "auto" },
  qrBadge: {
    width: 28, height: 28, borderRadius: radius.full,
    backgroundColor: "#b38238", alignItems: "center", justifyContent: "center",
    marginBottom: space[2],
  },
  qrBadgeText: { fontFamily: fonts.serifBold, fontSize: 14, color: "#1a140d" },
  qrBox: { backgroundColor: "#fff", padding: 10, borderRadius: radius.md },
  qrLabel: { fontFamily: fonts.mono, fontSize: 10, color: "#9c8a70", letterSpacing: 0.5, marginTop: space[2] },
});
