import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator, Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../store/storage";
import { recordPlayedToday } from "../../features/games/useGameStreak";
import { fonts, fontSize, space, radius } from "../../theme";
import type { ColorPalette } from "../../theme";
import { useColors } from "../../hooks/useColors";

const PROXY    = "https://themoveee.com/api";
const KEY_DATE = "crossword_last_played_date";

interface CrosswordCell  { letter: string; number?: number; black: boolean }
interface CrosswordClue  { number: number; direction: "across" | "down"; clue: string; answer: string; row: number; col: number; length: number }
interface CrosswordPuzzle { size: number; cells: CrosswordCell[][]; clues: CrosswordClue[]; title: string }

type Phase = "loading" | "error" | "played" | "playing" | "done";
type Dir   = "across" | "down";

export default function CrosswordGameScreen() {
  const nav = useNavigation<any>();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const inputRef = useRef<TextInput>(null);

  const [phase,      setPhase]      = useState<Phase>("loading");
  const [puzzle,     setPuzzle]     = useState<CrosswordPuzzle | null>(null);
  const [board,      setBoard]      = useState<string[][]>([]);
  const [selR,       setSelR]       = useState(0);
  const [selC,       setSelC]       = useState(0);
  const [direction,  setDirection]  = useState<Dir>("across");
  const [activeClue, setActiveClue] = useState<CrosswordClue | null>(null);
  const [errorMsg,   setErrorMsg]   = useState("");
  const [checking,   setChecking]   = useState(false);
  const [revealed,   setRevealed]   = useState<boolean[][]>([]);

  const todayStr = new Date().toISOString().slice(0, 10);

  const findClue = useCallback((p: CrosswordPuzzle, r: number, c: number, dir: Dir) => {
    // Walk back to the start of the word in the given direction
    let sr = r, sc = c;
    if (dir === "across") { while (sc > 0 && !p.cells[sr][sc - 1].black) sc--; }
    else                  { while (sr > 0 && !p.cells[sr - 1][sc].black) sr--; }
    const startCell = p.cells[sr][sc];
    return p.clues.find(cl => cl.number === startCell.number && cl.direction === dir) ?? null;
  }, []);

  const init = useCallback(async () => {
    setPhase("loading");
    const lastDate = storage.getString(KEY_DATE);
    if (lastDate === todayStr) { setPhase("played"); return; }
    try {
      const resp = await fetch(`${PROXY}/games/crossword/daily`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      const p: CrosswordPuzzle = data.puzzle;
      setPuzzle(p);
      setBoard(p.cells.map(row => row.map(c => c.black ? "#" : "")));
      setRevealed(p.cells.map(row => row.map(() => false)));
      // Select first non-black cell
      for (let r = 0; r < p.size; r++) {
        for (let c = 0; c < p.size; c++) {
          if (!p.cells[r][c].black) {
            setSelR(r); setSelC(c);
            setActiveClue(findClue(p, r, c, "across"));
            break;
          }
        }
        break;
      }
      setDirection("across");
      setPhase("playing");
    } catch (e: any) {
      setErrorMsg(e.message ?? "Could not load puzzle.");
      setPhase("error");
    }
  }, [todayStr, findClue]);

  useEffect(() => { init(); }, [init]);

  const [inputKey, setInputKey] = useState(0);

  const focusInput = useCallback(() => {
    // Remount + focus in case keyboard was dismissed by user
    setInputKey((k) => k + 1);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Focus hidden input whenever playing
  useEffect(() => {
    if (phase === "playing") focusInput();
  }, [phase, selR, selC]);

  const handleCellPress = (r: number, c: number) => {
    if (!puzzle || puzzle.cells[r][c].black) return;
    if (r === selR && c === selC) {
      // Same cell: toggle direction
      const newDir: Dir = direction === "across" ? "down" : "across";
      setDirection(newDir);
      setActiveClue(findClue(puzzle, r, c, newDir));
    } else {
      setSelR(r); setSelC(c);
      setActiveClue(findClue(puzzle, r, c, direction));
    }
    focusInput();
  };

  const advance = useCallback((r: number, c: number, dir: Dir, p: CrosswordPuzzle) => {
    if (dir === "across") {
      let nc = c + 1;
      while (nc < p.size && p.cells[r][nc].black) nc++;
      if (nc < p.size) { setSelC(nc); setActiveClue(findClue(p, r, nc, dir)); }
    } else {
      let nr = r + 1;
      while (nr < p.size && p.cells[nr][c].black) nr++;
      if (nr < p.size) { setSelR(nr); setActiveClue(findClue(p, nr, c, dir)); }
    }
  }, [findClue]);

  const retreat = useCallback((r: number, c: number, dir: Dir, p: CrosswordPuzzle) => {
    if (dir === "across") {
      let nc = c - 1;
      while (nc >= 0 && p.cells[r][nc].black) nc--;
      if (nc >= 0) { setSelC(nc); setActiveClue(findClue(p, r, nc, dir)); }
    } else {
      let nr = r - 1;
      while (nr >= 0 && p.cells[nr][c].black) nr--;
      if (nr >= 0) { setSelR(nr); setActiveClue(findClue(p, nr, c, dir)); }
    }
  }, [findClue]);

  const handleKey = (text: string) => {
    if (!puzzle) return;
    // TextInput gives us the new character appended; take the last char
    const ch = text.replace(/[^A-Za-z]/g, "").slice(-1).toUpperCase();
    if (!ch) return;
    const next = board.map(row => [...row]);
    next[selR][selC] = ch;
    setBoard(next);
    advance(selR, selC, direction, puzzle);
    checkComplete(next, puzzle);
  };

  const handleBackspace = () => {
    if (!puzzle) return;
    const next = board.map(row => [...row]);
    if (next[selR][selC] !== "") {
      next[selR][selC] = "";
      setBoard(next);
    } else {
      retreat(selR, selC, direction, puzzle);
    }
  };

  const checkComplete = (b: string[][], p: CrosswordPuzzle) => {
    const done = p.cells.every((row, r) =>
      row.every((cell, c) => cell.black || b[r][c] === cell.letter)
    );
    if (done) {
      storage.set(KEY_DATE, todayStr);
      recordPlayedToday();
      setPhase("done");
    }
  };

  const handleCheck = () => {
    if (!puzzle) return;
    setChecking(true);
    setRevealed(puzzle.cells.map((row, r) =>
      row.map((cell, c) => !cell.black && board[r][c] !== "" && board[r][c] !== cell.letter)
    ));
    setTimeout(() => setChecking(false), 1500);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────

  if (!puzzle || phase === "loading") return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Crossword" c={c} styles={styles} />
      <View style={styles.center}><ActivityIndicator color={c.gold} size="large" /></View>
    </SafeAreaView>
  );

  if (phase === "error") return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Crossword" c={c} styles={styles} />
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMsg}</Text>
        <TouchableOpacity onPress={init} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Try again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (phase === "played") return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Crossword" c={c} styles={styles} />
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✓</Text>
        <Text style={styles.doneTitle}>Already solved today!</Text>
        <Text style={styles.doneSub}>Come back tomorrow for a new puzzle.</Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  if (phase === "done") return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Crossword" c={c} styles={styles} />
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>🎉</Text>
        <Text style={styles.doneTitle}>Solved!</Text>
        <Text style={styles.doneSub}>{puzzle.title}</Text>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Back to Games</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  const size = puzzle.size;
  const CELL = Math.min(38, Math.floor(330 / size));

  // Which cells belong to the current clue (highlighted)
  const clueIndices = new Set<string>();
  if (activeClue) {
    for (let i = 0; i < activeClue.length; i++) {
      const r = activeClue.direction === "across" ? activeClue.row : activeClue.row + i;
      const c = activeClue.direction === "across" ? activeClue.col + i : activeClue.col;
      clueIndices.add(`${r},${c}`);
    }
  }

  const acrossClues = puzzle.clues.filter(c => c.direction === "across").sort((a, b) => a.number - b.number);
  const downClues   = puzzle.clues.filter(c => c.direction === "down").sort((a, b) => a.number - b.number);

  return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Crossword" c={c} styles={styles} extra={
        <TouchableOpacity onPress={handleCheck} style={styles.checkBtn}>
          <Text style={styles.checkBtnText}>Check</Text>
        </TouchableOpacity>
      } />

      {/* Hidden input to capture keyboard */}
      <TextInput
        key={inputKey}
        ref={inputRef}
        style={styles.hiddenInput}
        value=""
        onChangeText={handleKey}
        onKeyPress={({ nativeEvent }) => {
          if (nativeEvent.key === "Backspace") handleBackspace();
        }}
        autoCorrect={false}
        autoCapitalize="characters"
        keyboardType="default"
        caretHidden
        multiline={false}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Active clue banner */}
        {activeClue && (
          <TouchableOpacity
            style={styles.clueBanner}
            onPress={() => {
              const newDir: Dir = direction === "across" ? "down" : "across";
              const alt = findClue(puzzle, selR, selC, newDir);
              if (alt) { setDirection(newDir); setActiveClue(alt); }
            }}
          >
            <Text style={styles.clueBannerNum}>{activeClue.number} {activeClue.direction.toUpperCase()}</Text>
            <Text style={styles.clueBannerText} numberOfLines={2}>{activeClue.clue}</Text>
            <Ionicons name="swap-horizontal-outline" size={16} color={c.gold} />
          </TouchableOpacity>
        )}

        {/* Grid */}
        <View style={[styles.grid, { width: CELL * size }]}>
          {puzzle.cells.map((row, r) =>
            row.map((cell, c) => {
              if (cell.black) return (
                <View key={`${r},${c}`} style={[styles.cellBase, { width: CELL, height: CELL, backgroundColor: styles.cellBlackBg.backgroundColor }]} />
              );
              const isSelected  = r === selR && c === selC;
              const isInClue    = clueIndices.has(`${r},${c}`);
              const isError     = revealed[r]?.[c];
              const entered     = board[r]?.[c] ?? "";

              return (
                <TouchableOpacity
                  key={`${r},${c}`}
                  style={[
                    styles.cellBase,
                    { width: CELL, height: CELL },
                    styles.cellWhite,
                    isInClue    && styles.cellInClue,
                    isSelected  && styles.cellSelected,
                  ]}
                  onPress={() => handleCellPress(r, c)}
                  activeOpacity={0.8}
                >
                  {cell.number ? (
                    <Text style={[styles.cellNum, { fontSize: CELL < 36 ? 7 : 9 }]}>{cell.number}</Text>
                  ) : null}
                  <Text style={[
                    styles.cellLetter,
                    { fontSize: CELL < 36 ? 13 : 16 },
                    isError    && styles.cellLetterError,
                    isSelected && styles.cellLetterSelected,
                  ]}>
                    {entered}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Clue lists */}
        <View style={styles.clueSection}>
          <Text style={styles.clueSectionTitle}>Across</Text>
          {acrossClues.map(cl => (
            <TouchableOpacity
              key={`${cl.number}-across`}
              style={[styles.clueRow, activeClue?.number === cl.number && activeClue?.direction === "across" && styles.clueRowActive]}
              onPress={() => { setSelR(cl.row); setSelC(cl.col); setDirection("across"); setActiveClue(cl); focusInput(); }}
            >
              <Text style={styles.clueNum}>{cl.number}.</Text>
              <Text style={styles.clueText}>{cl.clue}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.clueSection}>
          <Text style={styles.clueSectionTitle}>Down</Text>
          {downClues.map(cl => (
            <TouchableOpacity
              key={`${cl.number}-down`}
              style={[styles.clueRow, activeClue?.number === cl.number && activeClue?.direction === "down" && styles.clueRowActive]}
              onPress={() => { setSelR(cl.row); setSelC(cl.col); setDirection("down"); setActiveClue(cl); focusInput(); }}
            >
              <Text style={styles.clueNum}>{cl.number}.</Text>
              <Text style={styles.clueText}>{cl.clue}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ nav, title, extra, c, styles }: { nav: any; title: string; extra?: React.ReactNode; c: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={c.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
      {extra ?? <View style={{ width: 60 }} />}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
  container:   { flex: 1, backgroundColor: c.paperWarm },
  scroll:      { paddingBottom: 60, alignItems: "center" },
  center:      { flex: 1, justifyContent: "center", alignItems: "center", padding: space[6], gap: space[4] },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.rule,
  },
  backBtn:     { padding: 4, marginRight: space[3] },
  headerTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: c.ink, flex: 1 },

  checkBtn:     { backgroundColor: c.ink, borderRadius: radius.md, paddingHorizontal: space[3], paddingVertical: 6 },
  checkBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.xs, color: c.paper },

  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1, top: -100 },

  clueBanner: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: c.paper, borderBottomWidth: 1, borderBottomColor: c.rule,
    paddingHorizontal: space[4], paddingVertical: space[2], gap: 8, width: "100%",
    minHeight: 48,
  },
  clueBannerNum:  { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: c.gold, width: 60 },
  clueBannerText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ink, flex: 1, lineHeight: 18 },

  grid: {
    flexDirection: "row", flexWrap: "wrap",
    borderWidth: 1, borderColor: c.ink,
    marginVertical: space[3], alignSelf: "center",
  },
  cellBase:  { borderWidth: 0.5, borderColor: c.ruleDark },
  cellBlackBg: { backgroundColor: c.ink },
  cellWhite: { backgroundColor: c.paper, position: "relative", justifyContent: "center", alignItems: "center" },
  cellInClue:   { backgroundColor: c.paperDeep },
  cellSelected: { backgroundColor: c.goldLight },

  cellNum:    { position: "absolute", top: 1, left: 2, fontFamily: fonts.mono, color: c.ink },
  cellLetter: { fontFamily: fonts.monoBold, color: c.ink },
  cellLetterError:    { color: c.ochre },
  cellLetterSelected: { color: c.gold },

  clueSection:      { width: "100%", paddingHorizontal: space[4], marginTop: space[3] },
  clueSectionTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink, marginBottom: space[2], borderBottomWidth: 1, borderBottomColor: c.rule, paddingBottom: space[1] },
  clueRow:          { flexDirection: "row", paddingVertical: 6, gap: 6, borderBottomWidth: 1, borderBottomColor: c.rule + "40" },
  clueRowActive:    { backgroundColor: c.goldLight + "60", marginHorizontal: -space[4], paddingHorizontal: space[4] },
  clueNum:          { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: c.gold, width: 28, paddingTop: 1 },
  clueText:         { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, flex: 1, lineHeight: 20 },

  errorText:   { fontFamily: fonts.sans, color: c.ochre, textAlign: "center" },
  actionBtn:   { backgroundColor: c.ink, borderRadius: radius.md, paddingHorizontal: space[6], paddingVertical: space[3] },
  actionBtnText: { fontFamily: fonts.sansBold, color: c.paper, fontSize: fontSize.sm },

  doneEmoji: { fontSize: 48 },
  doneTitle: { fontFamily: fonts.serifBold, fontSize: fontSize["2xl"], color: c.ink },
  doneSub:   { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center" },
  });
}
