import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import { useGameStreak } from "../../features/games/useGameStreak";

// ── Crossword mini-grid illustration ─────────────────────────────────────────
function CrosswordIllustration() {
  // 4×4 grid — black cells at known positions
  const cells = [
    [false, false, true,  false],
    [false, true,  false, false],
    [true,  false, false, true ],
    [false, false, false, false],
  ];
  return (
    <View style={{ gap: 2 }}>
      {cells.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", gap: 2 }}>
          {row.map((black, c) => (
            <View
              key={c}
              style={{
                width: 12, height: 12,
                backgroundColor: black ? colors.ink : colors.paper,
                borderWidth: 1, borderColor: colors.ghost,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Sudoku mini-grid illustration ─────────────────────────────────────────────
function SudokuIllustration() {
  return (
    <View style={{ borderWidth: 2, borderColor: "rgba(200,191,176,0.6)", padding: 2, gap: 2 }}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={{ flexDirection: "row", gap: 2 }}>
          {[0, 1, 2].map((col) => (
            <View
              key={col}
              style={{
                width: 14, height: 14,
                backgroundColor: (row + col) % 2 === 0 ? "rgba(200,191,176,0.2)" : colors.paper,
                borderWidth: 1, borderColor: colors.ghost,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export default function GamesScreen() {
  const nav    = useNavigation<any>();
  const streak = useGameStreak();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Games</Text>
          <Text style={styles.headerStar}>★</Text>
        </View>
        <Text style={styles.headerSub}>Daily challenges · Earn culture points</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 90 }}>
        {/* Streak banner */}
        {streak > 0 && (
          <View style={styles.streakBanner}>
            <View style={styles.streakLeft}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakText}>{streak} day{streak !== 1 ? "s" : ""} streak!</Text>
            </View>
            <Text style={styles.streakSub}>Keep it up</Text>
          </View>
        )}

        {/* Games grid */}
        <View style={styles.grid}>
          {/* Card 1 — Daily Trivia */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("TriviaGame")}
            activeOpacity={0.85}
          >
            <View style={[styles.cardTop, { backgroundColor: colors.ochre }]}>
              <Text style={styles.triviaQuestion}>?</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>Daily Trivia</Text>
              <Text style={styles.cardDesc}>10 questions · cultural knowledge</Text>
              <Text style={styles.cardCredits}>Earn up to 50 CR</Text>
              <View style={styles.playBtn}>
                <Text style={styles.playBtnText}>Play now →</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 2 — Who Said It? */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("WhoSaidIt")}
            activeOpacity={0.85}
          >
            <View style={[styles.cardTop, { backgroundColor: colors.ink }]}>
              <Text style={styles.quoteChar}>"</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>Who Said It?</Text>
              <Text style={styles.cardDesc}>Match quotes to their authors</Text>
              <Text style={styles.cardCredits}>Earn up to 30 CR</Text>
              <View style={styles.playBtn}>
                <Text style={styles.playBtnText}>Play now →</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 3 — Crossword */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("Crossword")}
            activeOpacity={0.85}
          >
            <View style={[styles.cardTop, { backgroundColor: colors.paperDeep }]}>
              <CrosswordIllustration />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>Crossword</Text>
              <Text style={styles.cardDesc}>Mini 7×7 · African & diaspora culture</Text>
              <View style={styles.playBtn}>
                <Text style={styles.playBtnText}>Play now →</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Card 4 — Sudoku */}
          <TouchableOpacity
            style={styles.card}
            onPress={() => nav.navigate("Sudoku")}
            activeOpacity={0.85}
          >
            <View style={[styles.cardTop, { backgroundColor: colors.paperDeep }]}>
              <SudokuIllustration />
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>Sudoku</Text>
              <Text style={styles.cardDesc}>Daily 9×9 · same grid for everyone</Text>
              <View style={styles.playBtn}>
                <Text style={styles.playBtnText}>Play now →</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.paper, paddingHorizontal: space[4],
    paddingTop: space[2], paddingBottom: space[2],
    borderBottomWidth: 1, borderBottomColor: colors.ghost,
  },
  headerLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: 20, color: colors.ink },
  headerStar:  { fontFamily: fonts.sans, fontSize: 14, color: colors.gold, marginTop: 2 },
  headerSub:   { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },

  // Streak banner
  streakBanner: {
    height: 64, backgroundColor: "rgba(255,255,255,0.5)",
    borderLeftWidth: 3, borderLeftColor: colors.ochre,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, marginBottom: space[3],
    shadowColor: colors.ink, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  streakLeft:  { flexDirection: "row", alignItems: "center", gap: 8 },
  streakEmoji: { fontSize: 24 },
  streakText:  { fontFamily: fonts.sansBold, fontSize: 14, color: colors.ink },
  streakSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.mute },

  // Grid
  grid: {
    flexDirection: "row", flexWrap: "wrap", paddingHorizontal: space[4], gap: space[4],
  },

  card: {
    width: "47%", backgroundColor: colors.paper, borderRadius: radius.xl,
    overflow: "hidden", minHeight: 250, ...shadows.card,
  },
  cardDim: { opacity: 0.6 },

  cardTop: {
    height: 100, alignItems: "center", justifyContent: "center",
  },

  triviaQuestion: {
    fontFamily: fonts.serifBold, fontSize: 48, color: colors.paper, lineHeight: 56,
  },
  quoteChar: {
    fontFamily: fonts.serifBold, fontSize: 48, color: colors.gold, lineHeight: 56, paddingBottom: 16,
  },

  cardBody: { padding: 16, flex: 1, justifyContent: "space-between" },
  cardName: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink, marginBottom: 4 },
  cardDesc: {
    fontFamily: fonts.mono, fontSize: fontSize.eyebrow, color: colors.mute,
    lineHeight: 14, marginBottom: 8,
  },
  cardCredits: {
    fontFamily: fonts.sansBold, fontSize: 12, color: colors.ochre, marginBottom: 8,
  },
  playBtn: {
    height: 32, backgroundColor: "rgba(197,73,31,0.1)", borderRadius: radius.full,
    alignItems: "center", justifyContent: "center",
  },
  playBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.ochre },

  comingSoonPill: {
    borderWidth: 1, borderColor: colors.ghost, borderRadius: radius.full,
    paddingVertical: 4, alignItems: "center", backgroundColor: colors.paperDeep,
  },
  comingSoonText: {
    fontFamily: fonts.sansBold, fontSize: 11, color: colors.mute,
    letterSpacing: 1, textTransform: "uppercase",
  },
});
