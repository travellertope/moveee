import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator, ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../store/storage";
import { recordPlayedToday } from "../../features/games/useGameStreak";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const PROXY    = "https://themoveee.com/api";
const KEY_DATE = "sudoku_last_played_date";

type Phase = "loading" | "error" | "played" | "playing" | "done";

function useTimer(running: boolean) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  return { display: `${mm}:${ss}`, secs };
}

function isConflict(board: number[], idx: number, val: number): boolean {
  if (val === 0) return false;
  const r = Math.floor(idx / 9), c = idx % 9;
  for (let i = 0; i < 9; i++) {
    if (i !== c && board[r * 9 + i] === val) return true;
    if (i !== r && board[i * 9 + c] === val) return true;
  }
  const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++) {
    for (let dc = 0; dc < 3; dc++) {
      const ni = (br + dr) * 9 + (bc + dc);
      if (ni !== idx && board[ni] === val) return true;
    }
  }
  return false;
}

export default function SudokuGameScreen() {
  const nav = useNavigation<any>();

  const [phase,    setPhase]    = useState<Phase>("loading");
  const [puzzle,   setPuzzle]   = useState<number[]>([]);
  const [solution, setSolution] = useState<number[]>([]);
  const [board,    setBoard]    = useState<number[]>([]);
  const [given,    setGiven]    = useState<boolean[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);
  const { display: timerDisplay } = useTimer(phase === "playing");

  const init = useCallback(async () => {
    setPhase("loading");
    const lastDate = storage.getString(KEY_DATE);
    if (lastDate === todayStr) {
      setPhase("played");
      return;
    }
    try {
      const resp = await fetch(`${PROXY}/games/sudoku/daily`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      setPuzzle(data.puzzle);
      setSolution(data.solution);
      setBoard([...data.puzzle]);
      setGiven(data.puzzle.map((v: number) => v !== 0));
      setSelected(null);
      setMistakes(0);
      setPhase("playing");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Could not load puzzle.");
      setPhase("error");
    }
  }, [todayStr]);

  useEffect(() => { init(); }, [init]);

  const handleCell = (idx: number) => {
    if (given[idx]) return;
    setSelected(idx === selected ? null : idx);
  };

  const handleNumber = (n: number) => {
    if (selected === null || given[selected] || phase !== "playing") return;
    const next = [...board];
    next[selected] = n;
    setBoard(next);

    // Count mistake if wrong
    if (n !== 0 && n !== solution[selected]) {
      setMistakes(m => m + 1);
    }

    // Check completion
    const complete = next.every((v, i) => v === solution[i]);
    if (complete) {
      storage.set(KEY_DATE, todayStr);
      recordPlayedToday();
      setPhase("done");
    }
  };

  const handleErase = () => handleNumber(0);

  // ── Render ─────────────────────────────────────────────────────────────────

  const headerRow = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Sudoku</Text>
      <Text style={styles.timer}>{timerDisplay}</Text>
    </View>
  );

  if (phase === "loading") return (
    <SafeAreaView style={styles.container}>
      {headerRow}
      <View style={styles.center}><ActivityIndicator color={colors.gold} size="large" /></View>
    </SafeAreaView>
  );

  if (phase === "error") return (
    <SafeAreaView style={styles.container}>
      {headerRow}
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={init} style={styles.retryBtn}>
          <Text style={styles.retryText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (phase === "played") return (
    <SafeAreaView style={styles.container}>
      {headerRow}
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✓</Text>
        <Text style={styles.doneTitle}>Already solved today!</Text>
        <Text style={styles.doneSub}>Come back tomorrow for a new puzzle.</Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (phase === "done") return (
    <SafeAreaView style={styles.container}>
      {headerRow}
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Puzzle complete!</Text>
        <Text style={styles.doneSub}>
          Finished in {timerDisplay} with {mistakes} mistake{mistakes !== 1 ? "s" : ""}.
        </Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.doneBtn}>
          <Text style={styles.doneBtnText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {headerRow}

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Meta bar */}
        <View style={styles.metaBar}>
          <Text style={styles.metaText}>Mistakes: {mistakes}</Text>
          <Text style={styles.metaText}>Medium · 36 clues</Text>
        </View>

        {/* Grid */}
        <View style={styles.grid}>
          {board.map((val, idx) => {
            const r = Math.floor(idx / 9), c = idx % 9;
            const isSelected  = selected === idx;
            const isSameVal   = selected !== null && val !== 0 && board[selected] === val;
            const isHighlight = selected !== null && (
              Math.floor(selected / 9) === r ||
              selected % 9 === c ||
              (Math.floor(selected / 27) === Math.floor(r / 3) &&
               Math.floor((selected % 9) / 3) === Math.floor(c / 3))
            );
            const isGiven   = given[idx];
            const isError   = !isGiven && val !== 0 && val !== solution[idx];
            const conflict  = !isGiven && val !== 0 && isConflict(board, idx, val);

            const borderRight  = c === 2 || c === 5 ? styles.thickRight  : styles.thinRight;
            const borderBottom = r === 2 || r === 5 ? styles.thickBottom : styles.thinBottom;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.cell,
                  borderRight,
                  borderBottom,
                  c === 0 && styles.leftEdge,
                  r === 0 && styles.topEdge,
                  isSelected  && styles.cellSelected,
                  isHighlight && !isSelected && styles.cellHighlight,
                  isSameVal   && !isSelected && styles.cellSameVal,
                ]}
                onPress={() => handleCell(idx)}
                activeOpacity={isGiven ? 1 : 0.7}
              >
                <Text style={[
                  styles.cellText,
                  isGiven           && styles.cellTextGiven,
                  (isError || conflict) && styles.cellTextError,
                  isSelected        && styles.cellTextSelected,
                ]}>
                  {val !== 0 ? val : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Number pad */}
        <View style={styles.numPad}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <TouchableOpacity
              key={n}
              style={styles.numBtn}
              onPress={() => handleNumber(n)}
              activeOpacity={0.7}
            >
              <Text style={styles.numBtnText}>{n}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.eraseBtn} onPress={handleErase}>
          <Ionicons name="backspace-outline" size={20} color={colors.mute} />
          <Text style={styles.eraseBtnText}>Erase</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const CELL_SIZE = 38;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },
  scroll:    { paddingBottom: 40, alignItems: "center" },
  center:    { flex: 1, justifyContent: "center", alignItems: "center", padding: space[6], gap: space[4] },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.rule,
  },
  backBtn:     { padding: 4, marginRight: space[3] },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, flex: 1 },
  timer:       { fontFamily: fonts.mono, fontSize: fontSize.sm, color: colors.mute },

  metaBar: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: space[4], paddingVertical: space[2],
    width: "100%",
  },
  metaText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    width: CELL_SIZE * 9 + 4,
    borderWidth: 2, borderColor: colors.ink,
    marginVertical: space[3],
  },
  cell: {
    width: CELL_SIZE, height: CELL_SIZE,
    justifyContent: "center", alignItems: "center",
    backgroundColor: colors.paper,
  },
  leftEdge:   { borderLeftWidth: 0 },
  topEdge:    { borderTopWidth: 0 },
  thinRight:  { borderRightWidth: 1, borderRightColor: "#ccc4b4" },
  thickRight: { borderRightWidth: 2, borderRightColor: colors.ink },
  thinBottom: { borderBottomWidth: 1, borderBottomColor: "#ccc4b4" },
  thickBottom:{ borderBottomWidth: 2, borderBottomColor: colors.ink },

  cellSelected:  { backgroundColor: colors.goldLight },
  cellHighlight: { backgroundColor: "#f0ece4" },
  cellSameVal:   { backgroundColor: "#e8e0d4" },

  cellText:         { fontFamily: fonts.mono, fontSize: 17, color: colors.mute },
  cellTextGiven:    { fontFamily: fonts.monoBold, color: colors.ink },
  cellTextError:    { color: "#c5491f" },
  cellTextSelected: { color: colors.gold },

  numPad: {
    flexDirection: "row", gap: space[2],
    marginTop: space[4], paddingHorizontal: space[4],
    flexWrap: "wrap", justifyContent: "center",
  },
  numBtn: {
    width: 52, height: 52, borderRadius: radius.lg,
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    justifyContent: "center", alignItems: "center",
    ...({ shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 } as any),
  },
  numBtnText: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink },

  eraseBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: space[3], paddingHorizontal: space[4], paddingVertical: space[2],
  },
  eraseBtnText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.mute },

  errorText: { fontFamily: fonts.sans, color: colors.ochre, textAlign: "center" },
  retryBtn:  { backgroundColor: colors.ink, borderRadius: radius.md, paddingHorizontal: space[5], paddingVertical: space[3] },
  retryText: { fontFamily: fonts.sansBold, color: colors.paper, fontSize: fontSize.sm },

  doneEmoji: { fontSize: 48 },
  doneTitle: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: colors.ink },
  doneSub:   { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute, textAlign: "center" },
  doneBtn:   { backgroundColor: colors.ink, borderRadius: radius.md, paddingHorizontal: space[6], paddingVertical: space[3], marginTop: space[2] },
  doneBtnText: { fontFamily: fonts.sansBold, color: colors.paper, fontSize: fontSize.sm },
});
