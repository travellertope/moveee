import React from "react";
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import { useGameStreak } from "../../features/games/useGameStreak";

const GAMES = [
  {
    name: "Daily Trivia",
    desc: "10 culture questions. New set every day.",
    icon: "help-circle-outline" as const,
    screen: "TriviaGame",
    available: true,
  },
  {
    name: "Who Said It?",
    desc: "Match quotes to their authors.",
    icon: "chatbubble-ellipses-outline" as const,
    screen: "WhoSaidIt",
    available: true,
  },
  {
    name: "Crossword",
    desc: "Mini 7×7 crossword. African & diaspora culture.",
    icon: "grid-outline" as const,
    screen: "Crossword",
    available: true,
  },
  {
    name: "Sudoku",
    desc: "Daily 9×9 puzzle. Same grid for everyone.",
    icon: "calculator-outline" as const,
    screen: "Sudoku",
    available: true,
  },
];

export default function GamesScreen() {
  const nav    = useNavigation<any>();
  const streak = useGameStreak();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Games</Text>
            <Text style={styles.headerSub}>Play daily — earn culture credits.</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakFlame}>🔥</Text>
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakLabel}>day{streak !== 1 ? "s" : ""}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.grid}>
        {GAMES.map((g) => (
          <TouchableOpacity
            key={g.name}
            style={[styles.card, !g.available && styles.cardDim]}
            onPress={() => g.screen && nav.navigate(g.screen)}
            disabled={!g.available}
            activeOpacity={g.available ? 0.75 : 1}
          >
            <View style={[styles.iconWrap, !g.available && styles.iconWrapDim]}>
              <Ionicons
                name={g.icon}
                size={28}
                color={g.available ? colors.gold : colors.ghost}
              />
            </View>
            <Text style={[styles.gameName, !g.available && styles.gameNameDim]}>{g.name}</Text>
            <Text style={[styles.gameDesc, !g.available && styles.gameDescDim]}>{g.desc}</Text>
            {g.available && (
              <View style={styles.playBtn}>
                <Text style={styles.playBtnText}>Play →</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: { paddingHorizontal: space[4], paddingTop: space[5], paddingBottom: space[3] },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: colors.ink },
  headerSub: {
    fontFamily: fonts.mono, fontSize: fontSize.xs,
    color: colors.mute, marginTop: 4, letterSpacing: 0.8,
  },
  streakBadge: {
    alignItems: "center",
    backgroundColor: colors.goldLight,
    borderRadius: radius.lg,
    paddingHorizontal: space[3],
    paddingVertical: space[2],
    borderWidth: 1,
    borderColor: colors.goldBorder,
    minWidth: 64,
  },
  streakFlame:  { fontSize: 20 },
  streakCount:  { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, lineHeight: 26 },
  streakLabel:  { fontFamily: fonts.mono, fontSize: 9, color: colors.gold, textTransform: "uppercase", letterSpacing: 0.8 },

  grid: { flexDirection: "row", flexWrap: "wrap", padding: space[4], gap: space[3] },

  card: {
    width: "47%",
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.rule,
    padding: space[4], gap: space[2],
  },
  cardDim: { opacity: 0.55 },

  iconWrap: {
    width: 48, height: 48, borderRadius: radius.lg,
    backgroundColor: colors.goldLight,
    alignItems: "center", justifyContent: "center",
  },
  iconWrapDim: { backgroundColor: colors.paperDeep },

  gameName:    { fontFamily: fonts.serifBold, fontSize: fontSize.base, color: colors.ink, marginTop: space[1] },
  gameNameDim: { color: colors.mute },
  gameDesc:    { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, lineHeight: 16 },
  gameDescDim: { color: colors.ghost },

  playBtn: {
    marginTop: space[1], backgroundColor: colors.ink,
    borderRadius: radius.md, paddingVertical: space[1] + 2, alignItems: "center",
  },
  playBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.xs, color: colors.paper },
});
