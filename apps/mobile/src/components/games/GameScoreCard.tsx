import React, { forwardRef } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";
import { fonts, fontSize, space, radius } from "../../theme";

const CARD_WIDTH  = 360;
const CARD_HEIGHT = 600;

export interface GameScoreCardProps {
  gameName: string;
  gameEmoji: string;
  score: number;
  maxScore: number;
  pct: number;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
  dateLabel: string;
  qrValue: string;
}

const GameScoreCard = forwardRef<View, GameScoreCardProps>(function GameScoreCard(
  { gameName, gameEmoji, score, maxScore, pct, displayName, username, avatarUrl, dateLabel, qrValue },
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

        <Text style={styles.gameEmoji}>{gameEmoji}</Text>
        <Text style={styles.gameName}>{gameName}</Text>

        <Text style={styles.scoreBig}>{score}/{maxScore}</Text>
        <Text style={styles.scorePct}>{pct}% correct</Text>

        <View style={styles.userRow}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{(displayName || username || "?").charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.userName}>{displayName || username}</Text>
            <Text style={styles.userHandle}>@{username} · {dateLabel}</Text>
          </View>
        </View>

        <View style={styles.qrWrap}>
          <View style={styles.qrBox}>
            <QRCode value={qrValue} size={84} backgroundColor="#fff" color="#1a140d" />
          </View>
          <Text style={styles.qrLabel}>Scan to play today's game</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

export default GameScoreCard;

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

  divider: { width: 48, height: 2, backgroundColor: "#b38238", marginBottom: space[6] },

  gameEmoji: { fontSize: 40, marginBottom: space[2] },
  gameName:  { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: "#e8ddcb", letterSpacing: 1, textTransform: "uppercase", marginBottom: space[6] },

  scoreBig: { fontFamily: fonts.serifBold, fontSize: 72, color: "#f3ece0", lineHeight: 76 },
  scorePct: { fontFamily: fonts.sans, fontSize: fontSize.base, color: "#c9a878", marginBottom: space[8] },

  userRow: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    marginBottom: space[8],
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.lg, paddingHorizontal: space[4], paddingVertical: space[3],
    width: "100%",
  },
  avatar: { width: 40, height: 40, borderRadius: radius.full },
  avatarFallback: { backgroundColor: "#b38238", alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: "#1a140d" },
  userName:   { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: "#f3ece0" },
  userHandle: { fontFamily: fonts.mono, fontSize: 11, color: "#9c8a70", marginTop: 2 },

  qrWrap: { alignItems: "center", marginTop: "auto" },
  qrBox: { backgroundColor: "#fff", padding: 10, borderRadius: radius.md },
  qrLabel: { fontFamily: fonts.mono, fontSize: 10, color: "#9c8a70", letterSpacing: 0.5, marginTop: space[2] },
});
