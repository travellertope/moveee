import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../store/storage";
import { api } from "../../api/client";
import { colors, fonts, fontSize, space, radius } from "../../theme";

const PROXY = "https://themoveee.com/api";
const KEY_DATE  = "trivia_last_played_date";
const KEY_SCORE = "trivia_last_score";

interface TriviaQuestion {
  question:    string;
  options:     [string, string, string, string];
  correct:     number;
  explanation: string;
  category:    string;
}

type Phase = "loading" | "error" | "played" | "game" | "done";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

export default function TriviaGameScreen() {
  const nav = useNavigation<any>();

  const [phase,       setPhase]       = useState<Phase>("loading");
  const [questions,   setQuestions]   = useState<TriviaQuestion[]>([]);
  const [qIndex,      setQIndex]      = useState(0);
  const [selected,    setSelected]    = useState<number | null>(null);
  const [answers,     setAnswers]     = useState<(number | null)[]>([]);
  const [score,       setScore]       = useState(0);
  const [lastScore,   setLastScore]   = useState<number | null>(null);
  const [errorMsg,    setErrorMsg]    = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const init = useCallback(async () => {
    setPhase("loading");
    try {
      const lastDate = storage.getString(KEY_DATE);
      if (lastDate === todayStr) {
        const saved = storage.getString(KEY_SCORE);
        setLastScore(saved !== undefined ? parseInt(saved, 10) : null);
        setPhase("played");
        return;
      }
      const data = await api.get<{ date: string; questions: TriviaQuestion[] }>(
        `${PROXY}/games/trivia/daily`
      );
      if (!data.questions?.length) throw new Error("no questions");
      setQuestions(data.questions);
      setAnswers(new Array(data.questions.length).fill(null));
      setScore(0);
      setQIndex(0);
      setSelected(null);
      setPhase("game");
    } catch {
      setErrorMsg("Could not load today's trivia. Try again later.");
      setPhase("error");
    }
  }, [todayStr]);

  useEffect(() => { init(); }, [init]);

  const currentQ = questions[qIndex];

  const handleSelect = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const newAnswers = [...answers];
    newAnswers[qIndex] = idx;
    setAnswers(newAnswers);
    if (idx === currentQ.correct) setScore((s) => s + 1);
  };

  const handleNext = () => {
    if (qIndex < questions.length - 1) {
      setSelected(null);
      setQIndex((i) => i + 1);
    } else {
      const finalScore = answers.filter((a, i) => {
        const ans = a !== null ? a : selected;
        return ans === questions[i]?.correct;
      }).length;
      storage.set(KEY_DATE, todayStr);
      storage.set(KEY_SCORE, String(finalScore));
      setPhase("done");
    }
  };

  const calcFinalScore = () =>
    answers.map((a, i) => (a !== null ? a : (i === qIndex ? selected : null))).filter(
      (a, i) => a === questions[i]?.correct
    ).length;

  // ── loading ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} title="Daily Trivia" />
        <ActivityIndicator style={{ marginTop: 60 }} color={colors.gold} size="large" />
      </SafeAreaView>
    );
  }

  // ── error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} title="Daily Trivia" />
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
        <Header nav={nav} title="Daily Trivia" />
        <View style={styles.centred}>
          <Text style={styles.doneEmoji}>🏆</Text>
          <Text style={styles.doneTitle}>Already played today!</Text>
          <Text style={styles.doneSub}>Come back tomorrow for a new set of questions.</Text>
          {lastScore !== null && (
            <View style={styles.scoreChip}>
              <Text style={styles.scoreChipText}>Today's score: {lastScore} / 10</Text>
            </View>
          )}
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: space[4] }]} onPress={() => nav.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Games</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── done ──────────────────────────────────────────────────────────────────────
  if (phase === "done") {
    const final = calcFinalScore();
    const pct   = Math.round((final / questions.length) * 100);
    const msg   = pct >= 80 ? "Excellent! 🎉" : pct >= 50 ? "Not bad! 👍" : "Better luck tomorrow! 💪";
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} title="Daily Trivia" />
        <ScrollView contentContainerStyle={styles.doneBody}>
          <Text style={styles.doneEmoji}>🏆</Text>
          <Text style={styles.doneTitle}>{msg}</Text>
          <Text style={styles.doneScore}>{final} / {questions.length}</Text>
          <Text style={styles.doneSub}>Come back tomorrow for new questions.</Text>
          <View style={styles.reviewCard}>
            <Text style={styles.reviewTitle}>Review</Text>
            {questions.map((q, i) => {
              const correct = answers[i] === q.correct;
              return (
                <View key={i} style={[styles.reviewRow, i > 0 && styles.reviewRowBorder]}>
                  <View style={[styles.reviewDot, correct ? styles.reviewDotCorrect : styles.reviewDotWrong]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewQ} numberOfLines={2}>{q.question}</Text>
                    <Text style={[styles.reviewA, !correct && styles.reviewAWrong]}>
                      {correct ? "✓ " : "✗ "}{q.options[q.correct]}
                    </Text>
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

  const isCorrect = selected !== null && selected === currentQ.correct;

  return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} title="Daily Trivia" progress={`${qIndex + 1} / ${questions.length}`} />

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((qIndex + 1) / questions.length) * 100}%` as any }]} />
      </View>

      <ScrollView contentContainerStyle={styles.gameBody} showsVerticalScrollIndicator={false}>
        {currentQ.category && (
          <Text style={styles.categoryLabel}>{currentQ.category.toUpperCase()}</Text>
        )}
        <Text style={styles.question}>{currentQ.question}</Text>

        <View style={styles.options}>
          {currentQ.options.map((opt, idx) => {
            let optStyle   = styles.option;
            let textStyle  = styles.optionText;
            if (selected !== null) {
              if (idx === currentQ.correct)                              { optStyle = styles.optionCorrect; textStyle = styles.optionTextCorrect; }
              else if (idx === selected && selected !== currentQ.correct){ optStyle = styles.optionWrong;   textStyle = styles.optionTextWrong; }
              else                                                        { optStyle = styles.optionDim; }
            }
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, optStyle]}
                onPress={() => handleSelect(idx)}
                disabled={selected !== null}
                activeOpacity={0.75}
              >
                <View style={styles.optionLabelWrap}>
                  <Text style={styles.optionLabelText}>{OPTION_LABELS[idx]}</Text>
                </View>
                <Text style={[styles.optionText, textStyle]}>{opt}</Text>
                {selected !== null && idx === currentQ.correct && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.communityText} />
                )}
                {selected === idx && selected !== currentQ.correct && (
                  <Ionicons name="close-circle" size={18} color={colors.ochre} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected !== null && currentQ.explanation && (
          <View style={styles.explanationBox}>
            <Text style={styles.explanationLabel}>EXPLANATION</Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
          </View>
        )}

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

// ── Shared header sub-component ───────────────────────────────────────────────
function Header({ nav, title, progress }: { nav: any; title: string; progress?: string }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
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

  categoryLabel: {
    fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow,
    color: colors.mute, letterSpacing: 1.8, textTransform: "uppercase",
  },
  question: { fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: colors.ink, lineHeight: 26 },

  options:      { gap: space[2] },
  option: {
    flexDirection: "row", alignItems: "center", gap: space[3],
    backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule,
    borderRadius: radius.lg, paddingHorizontal: space[3], paddingVertical: space[3],
  },
  optionCorrect: { backgroundColor: colors.communityBg, borderColor: colors.communityBorder },
  optionWrong:   { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
  optionDim:     { opacity: 0.45 },

  optionLabelWrap: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.paperDeep, alignItems: "center", justifyContent: "center",
  },
  optionLabelText: { fontFamily: fonts.monoBold, fontSize: fontSize.xs, color: colors.mute },

  optionText:        { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: colors.inkSoft },
  optionTextCorrect: { color: colors.communityText, fontFamily: fonts.sansBold },
  optionTextWrong:   { color: colors.ochre },

  explanationBox: {
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.lg, padding: space[4], gap: space[1],
  },
  explanationLabel: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: colors.gold, letterSpacing: 1.8 },
  explanationText:  { fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.inkSoft, lineHeight: 20 },

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

  scoreChip: {
    backgroundColor: colors.goldLight, borderWidth: 1, borderColor: colors.goldBorder,
    borderRadius: radius.full, paddingHorizontal: space[4], paddingVertical: space[1] + 2,
  },
  scoreChipText: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: colors.gold },

  reviewCard:      { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.rule, borderRadius: radius.lg, overflow: "hidden", width: "100%" },
  reviewTitle:     { fontFamily: fonts.serifBold, fontSize: fontSize.base, color: colors.ink, padding: space[3], borderBottomWidth: 1, borderBottomColor: colors.rule },
  reviewRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[2], padding: space[3] },
  reviewRowBorder: { borderTopWidth: 1, borderTopColor: colors.rule },
  reviewDot:         { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  reviewDotCorrect:  { backgroundColor: colors.communityText },
  reviewDotWrong:    { backgroundColor: colors.ochre },
  reviewQ:           { fontFamily: fonts.sans, fontSize: fontSize.xs, color: colors.mute, marginBottom: 2 },
  reviewA:           { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: colors.communityText },
  reviewAWrong:      { color: colors.ochre },

  primaryBtn:     { backgroundColor: colors.ink, borderRadius: radius.md, paddingVertical: space[3], paddingHorizontal: space[6] },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: colors.paper },
});
