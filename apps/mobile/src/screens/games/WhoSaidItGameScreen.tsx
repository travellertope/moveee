import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../store/storage";
import { api } from "../../api/client";
import { recordPlayedToday } from "../../features/games/useGameStreak";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const PROXY    = "https://themoveee.com/api";
const KEY_DATE = "wsi_last_played_date";

interface WsiQuestion {
  id:             string;
  quote:          string;
  source:         string;
  correct_author: string;
  options:        [string, string, string, string];
}

type Phase = "loading" | "error" | "played" | "game" | "done";

export default function WhoSaidItGameScreen() {
  const nav = useNavigation<any>();

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [questions, setQuestions] = useState<WsiQuestion[]>([]);
  const [qIndex,    setQIndex]    = useState(0);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [answers,   setAnswers]   = useState<(string | null)[]>([]);
  const [score,     setScore]     = useState(0);
  const [errorMsg,  setErrorMsg]  = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const init = useCallback(async () => {
    setPhase("loading");
    try {
      const lastDate = storage.getString(KEY_DATE);
      if (lastDate === todayStr) {
        setPhase("played");
        return;
      }
      const data = await api.get<{ date: string; questions: WsiQuestion[] }>(
        `${PROXY}/games/who-said-it/daily`
      );
      if (!data.questions?.length) throw new Error("no questions");
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      setScore(0);
      setQIndex(0);
      setSelected(null);
      setPhase("game");
    } catch {
      setErrorMsg("Could not load today's game. Try again later.");
      setPhase("error");
    }
  }, [todayStr]);

  useEffect(() => { init(); }, [init]);

  const currentQ = questions[qIndex];

  const handleSelect = (author: string) => {
    if (selected !== null) return;
    setSelected(author);
    const newAnswers = [...answers];
    newAnswers[qIndex] = author;
    setAnswers(newAnswers);
    if (author === currentQ.correct_author) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setSelected(null);
      setQIndex((i) => i + 1);
    } else {
      storage.set(KEY_DATE, todayStr);
      recordPlayedToday();
      setPhase("done");
    }
  };

  const finalScore = answers.filter((a, i) => a === questions[i]?.correct_author).length;

  // ── loading ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} />
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.gold} size="large" />
      </SafeAreaView>
    );
  }

  // ── error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} />
        <View style={styles.centred}>
          <Text style={styles.centredText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={init}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── already played ────────────────────────────────────────────────────────────
  if (phase === "played") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} />
        <View style={styles.centred}>
          <Text style={styles.doneEmoji}>✍️</Text>
          <Text style={styles.doneTitle}>Already played today!</Text>
          <Text style={styles.doneSub}>New quotes drop every day.</Text>
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: space[4] }]} onPress={() => nav.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── done ──────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const pct = Math.round((finalScore / questions.length) * 100);
    const msg = pct >= 80 ? "You know your quotes! 🎉" : pct >= 50 ? "Not bad! 👍" : "Better luck tomorrow! 💪";
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} />
        <ScrollView contentContainerStyle={styles.doneBody}>
          <Text style={styles.doneEmoji}>✍️</Text>
          <Text style={styles.doneTitle}>{msg}</Text>
          <Text style={styles.doneScore}>{finalScore} / {questions.length}</Text>
          <Text style={styles.doneSub}>Come back tomorrow for new quotes.</Text>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Review</Text>
            {questions.map((q, i) => {
              const correct = answers[i] === q.correct_author;
              return (
                <View key={q.id} style={[styles.reviewRow, i > 0 && styles.reviewRowBorder]}>
                  <View style={[styles.reviewDot, correct ? styles.reviewDotCorrect : styles.reviewDotWrong]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewQuote} numberOfLines={2}>"{q.quote}"</Text>
                    <Text style={[styles.reviewA, !correct && styles.reviewAWrong]}>
                      {correct ? "✓ " : "✗ "}{q.correct_author}
                    </Text>
                    {!correct && answers[i] && (
                      <Text style={styles.reviewYours}>You said: {answers[i]}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => nav.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Games</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── in-game ───────────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} progress={`${qIndex + 1} / ${questions.length}`} />

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((qIndex + 1) / questions.length) * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.gameBody} showsVerticalScrollIndicator={false}>
        {/* Quote block */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteMarks}>"</Text>
          <Text style={styles.quoteText}>{currentQ.quote}</Text>
          {currentQ.source && (
            <Text style={styles.quoteSource}>{currentQ.source}</Text>
          )}
        </View>

        <Text style={styles.promptText}>Who said this?</Text>

        <View style={styles.options}>
          {currentQ.options.map((author, idx) => {
            let optStyle  = styles.option;
            let textStyle = styles.optionText;
            if (selected !== null) {
              if (author === currentQ.correct_author)                               { optStyle = styles.optionCorrect; textStyle = styles.optionTextCorrect; }
              else if (author === selected && selected !== currentQ.correct_author) { optStyle = styles.optionWrong; textStyle = styles.optionTextWrong; }
              else                                                                   { optStyle = styles.optionDim; }
            }
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, optStyle]}
                onPress={() => handleSelect(author)}
                disabled={selected !== null}
                activeOpacity={0.75}
              >
                <Text style={[styles.optionText, textStyle]}>{author}</Text>
                {selected !== null && author === currentQ.correct_author && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.communityText} />
                )}
                {selected === author && selected !== currentQ.correct_author && (
                  <Ionicons name="close-circle" size={18} color={colors.ochre} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected !== null && (
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.liveScoreLabel}>SCORE</Text>
              <Text style={styles.liveScoreValue}>{score} / {qIndex + 1}</Text>
            </View>
            <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextBtnText}>
                {qIndex < questions.length - 1 ? "Next →" : "Finish →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ nav, progress }: { nav: any; progress?: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Who Said It?</Text>
      {progress && <Text style={styles.headerProgress}>{progress}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paperWarm },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: space[4], paddingVertical: space[3],
    borderBottomWidth: 1, borderBottomColor: colors.rule,
    backgroundColor: colors.paperWarm,
  },
  backBtn:        { padding: 4, marginRight: space[2] },
  headerTitle:    { flex: 1, fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink },
  headerProgress: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute },

  progressBar:  { height: 3, backgroundColor: colors.rule },
  progressFill: { height: 3, backgroundColor: colors.gold },

  gameBody: { padding: space[4], gap: space[4], paddingBottom: space[10] },

  quoteCard: {
    backgroundColor: colors.paper, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.rule,
    padding: space[5], gap: space[2],
  },
  quoteMarks:  { fontFamily: fonts.serifBold, fontSize: 48, color: colors.gold, lineHeight: 40, marginTop: -8 },
  quoteText:   { fontFamily: fonts.serif, fontSize: fontSize.lg, color: colors.ink, lineHeight: 26, fontStyle: "italic" },
  quoteSource: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, marginTop: space[1] },

  promptText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.ink },

  options: { gap: space[2] },
  option: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, paddingHorizontal: space[4], paddingVertical: space[3] + 2,
  },
  optionCorrect: { backgroundColor: colors.communityBg, borderColor: colors.communityBorder },
  optionWrong:   { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  optionDim:     { opacity: 0.45 },

  optionText:        { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft },
  optionTextCorrect: { color: colors.communityText, fontFamily: fonts.sansBold },
  optionTextWrong:   { color: colors.ochre },

  bottomRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  liveScoreLabel: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.mute, letterSpacing: 1.2 },
  liveScoreValue: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink },
  nextBtn: {
    backgroundColor: colors.ink, borderRadius: radius.md,
    paddingVertical: space[3], paddingHorizontal: space[5],
  },
  nextBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },

  centred:     { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6], gap: space[3] },
  centredText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.mute, textAlign: "center" },

  doneBody:  { padding: space[4], gap: space[4], paddingBottom: space[10], alignItems: "center" },
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: colors.ink, textAlign: "center" },
  doneScore: { fontFamily: fonts.serifBold, fontSize: fontSize["3xl"], color: colors.gold },
  doneSub:   { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.mute, letterSpacing: 0.8, textAlign: "center" },

  reviewCard:      { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule, borderRadius: radius.lg, overflow: "hidden", width: "100%" },
  reviewTitle:     { fontFamily: fonts.serifBold, fontSize: fontSize.base, color: colors.ink, padding: space[3], borderBottomWidth: 1, borderBottomColor: colors.rule },
  reviewRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[2], padding: space[3] },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  reviewDot:        { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  reviewDotCorrect: { backgroundColor: colors.communityText },
  reviewDotWrong:   { backgroundColor: colors.ochre },
  reviewQuote:      { fontFamily: fonts.serif, fontSize: fontSize.xs, color: colors.mute, marginBottom: 4, fontStyle: "italic" },
  reviewA:          { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.communityText },
  reviewAWrong:     { color: colors.ochre },
  reviewYours:      { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.ghost, marginTop: 2 },

  primaryBtn:     { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: space[3], paddingHorizontal: space[6] },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },
});
