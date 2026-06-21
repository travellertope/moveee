import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { storage } from "../../store/storage";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { recordPlayedToday } from "../../features/games/useGameStreak";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import GameScoreCard from "../../components/games/GameScoreCard";
import { useScoreCardShare } from "../../features/games/useScoreCardShare";

const PROXY      = "https://themoveee.com/api";
const KEY_DATE   = "trivia_last_played_date";
const KEY_SCORE  = "trivia_last_score";
const KEY_CR     = "trivia_last_credits";
const KEY_COUNT  = "trivia_play_count";
const PRO_LIMIT  = 5;
const FREE_LIMIT = 1;

interface TriviaQuestion {
  question:    string;
  options:     [string, string, string, string];
  correct:     number;
  explanation: string;
  category:    string;
}

type Phase = "loading" | "error" | "played" | "game" | "done";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;

// ── Shared header ─────────────────────────────────────────────────────────────
function Header({ nav, styles }: { nav: any; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.header}>
      <View style={{ width: 44 }} />
      <Text style={styles.headerTitle}>Daily Trivia</Text>
      <TouchableOpacity style={{ width: 44, alignItems: "flex-end" }} onPress={() => nav.goBack()}>
        <Text style={styles.exitText}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function TriviaGameScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore();
  const isPro = user?.tier === "patron";
  const { cardRef, share: shareScoreCard, sharing } = useScoreCardShare();

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [qIndex,    setQIndex]    = useState(0);
  const [selected,  setSelected]  = useState<number | null>(null);
  const [answers,   setAnswers]   = useState<(number | null)[]>([]);
  const [score,     setScore]     = useState(0);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [creditsEarned, setCreditsEarned] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg,  setErrorMsg]  = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const init = useCallback(async () => {
    setPhase("loading");
    try {
      const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
      const countKey = `${KEY_COUNT}_${todayStr}`;
      const playedToday = parseInt(storage.getString(countKey) ?? "0", 10);
      if (playedToday >= limit) {
        const saved = storage.getString(KEY_SCORE);
        const savedCr = storage.getString(KEY_CR);
        setLastScore(saved !== undefined ? parseInt(saved, 10) : null);
        setCreditsEarned(savedCr !== undefined ? parseInt(savedCr, 10) : null);
        setPhase("played");
        return;
      }
      // slot = play number (1-5), ensuring each play is a unique game
      const slot = playedToday + 1;
      const data = await api.get<{ date: string; slot: number; questions: TriviaQuestion[] }>(
        `${PROXY}/games/trivia/daily?slot=${slot}`
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

  const handleNext = async () => {
    if (qIndex < questions.length - 1) {
      setSelected(null);
      setQIndex((i) => i + 1);
    } else {
      const finalScore = answers.filter((a, i) => {
        const ans = a !== null ? a : selected;
        return ans === questions[i]?.correct;
      }).length;
      const countKey = `${KEY_COUNT}_${todayStr}`;
      const prev = parseInt(storage.getString(countKey) ?? "0", 10);
      storage.set(countKey, String(prev + 1));
      storage.set(KEY_SCORE, String(finalScore));
      recordPlayedToday();
      setSubmitting(true);
      try {
        const result = await api.post<{ credits_earned: number }>(`${MOBILE_API}/games/complete`, {
          game_type: "trivia",
          score: finalScore,
          max_score: questions.length,
        });
        setCreditsEarned(result.credits_earned);
        storage.set(KEY_CR, String(result.credits_earned));
      } catch {
        setCreditsEarned(null);
      } finally {
        setSubmitting(false);
      }
      setPhase("done");
    }
  };

  const calcFinalScore = () =>
    answers
      .map((a, i) => (a !== null ? a : i === qIndex ? selected : null))
      .filter((a, i) => a === questions[i]?.correct).length;

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} />
        <ActivityIndicator style={{ marginTop: 60 }} color={c.gold} size="large" />
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} />
        <View style={styles.centred}>
          <Text style={styles.centredText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={init}>
            <Text style={styles.primaryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Already played ────────────────────────────────────────────────────────────
  if (phase === "played") {
    const cr = creditsEarned ?? 0;
    const countKey = `${KEY_COUNT}_${todayStr}`;
    const playsToday = parseInt(storage.getString(countKey) ?? "0", 10);
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.paperWarm }]}>
        <View style={styles.centred}>
          <View style={styles.playedCircle}>
            <Text style={styles.playedCheck}>✓</Text>
          </View>
          <Text style={styles.playedTitle}>
            {isPro ? `${playsToday}/${limit} plays used today` : "Already played today!"}
          </Text>
          {lastScore !== null && (
            <Text style={styles.playedSub}>You scored {lastScore}/10 · +{cr} CR earned</Text>
          )}
          <View style={styles.countdownWrap}>
            <Text style={styles.countdownLabel}>Next game available in</Text>
            <Text style={styles.countdownValue}>Resets tomorrow</Text>
          </View>
          {!isPro && (
            <TouchableOpacity onPress={() => nav.navigate("Membership" as never)} style={styles.proHintBtn}>
              <Text style={styles.proHintText}>Moveee Pro members get 5 plays/day →</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => nav.goBack()}>
            <Text style={styles.browseFeedLink}>Browse the feed while you wait →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done / Score screen ───────────────────────────────────────────────────────
  if (phase === "done") {
    const final = calcFinalScore();
    const pct   = Math.round((final / questions.length) * 100);
    const cr    = creditsEarned ?? Math.round((final / questions.length) * 50);
    const msg   = pct >= 80 ? "Excellent knowledge!" : pct >= 50 ? "Solid knowledge! Keep exploring." : "Keep learning and come back!";

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.paperWarm }]}>
        <ScrollView contentContainerStyle={styles.scoreBody}>
          <Text style={styles.scoreLarge}>{final} / {questions.length}</Text>
          <Text style={styles.scorePct}>{pct}% correct</Text>
          <Text style={styles.scoreMsg}>{msg}</Text>
          <View style={styles.crPill}>
            <Text style={styles.crPillText}>+{cr} CR earned</Text>
          </View>

          <View style={styles.scoreDivider} />

          <Text style={styles.reviewTitle}>Question Review</Text>
          <View style={styles.reviewDots}>
            {questions.map((q, i) => (
              <View
                key={i}
                style={[
                  styles.reviewDot,
                  { backgroundColor: answers[i] === q.correct ? c.ochre : c.error },
                ]}
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={shareScoreCard}
            disabled={sharing}
          >
            {sharing ? (
              <ActivityIndicator color={c.ink} />
            ) : (
              <Text style={styles.shareBtnText}>Share result</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => nav.goBack()} style={{ marginTop: space[2] }}>
            <Text style={styles.backGamesLink}>Back to Games</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.offscreen} pointerEvents="none">
          <GameScoreCard
            ref={cardRef}
            gameName="Daily Trivia"
            gameEmoji="🧠"
            score={final}
            maxScore={questions.length}
            pct={pct}
            displayName={user?.displayName ?? ""}
            username={user?.username ?? "member"}
            avatarUrl={user?.avatarUrl}
            dateLabel={new Date().toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
            qrValue={`https://themoveee.com/games?ref=${encodeURIComponent(user?.username ?? "")}`}
          />
        </View>
      </SafeAreaView>
    );
  }

  // ── In-game ───────────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  const progress = ((qIndex + 1) / questions.length) * 100;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.paper }]}>
      <Header nav={nav} styles={styles} />

      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
        </View>
        <View style={styles.progressRow}>
          <View style={{ width: 60 }} />
          <Text style={styles.progressLabel}>Question {qIndex + 1} of {questions.length}</Text>
          <Text style={styles.scoreLabel}>Score: {score}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.gameBody}>
        {/* Question card */}
        <View style={styles.questionCard}>
          {currentQ.category ? (
            <Text style={styles.questionCategory}>{currentQ.category.toUpperCase()}</Text>
          ) : null}
          <View style={styles.questionRule} />
          <Text style={styles.questionText}>{currentQ.question}</Text>
        </View>

        {/* Options */}
        <View style={styles.options}>
          {currentQ.options.map((opt, idx) => {
            const isCorrect  = idx === currentQ.correct;
            const isSelected = idx === selected;
            const isRevealed = selected !== null;

            let optStyle  = styles.option;
            if (isRevealed) {
              if (isCorrect)                            optStyle = styles.optionCorrect;
              else if (isSelected && !isCorrect)        optStyle = styles.optionWrong;
              else                                      optStyle = styles.optionDim;
            }

            return (
              <TouchableOpacity
                key={idx}
                style={[styles.option, optStyle]}
                onPress={() => handleSelect(idx)}
                disabled={selected !== null}
                activeOpacity={0.75}
              >
                <View style={[
                  styles.optionLabelCircle,
                  isRevealed && isCorrect  && styles.optionLabelCorrect,
                  isRevealed && isSelected && !isCorrect && styles.optionLabelWrong,
                ]}>
                  <Text style={[
                    styles.optionLabelText,
                    isRevealed && isCorrect  && { color: c.success },
                    isRevealed && isSelected && !isCorrect && { color: c.error },
                  ]}>
                    {OPTION_LABELS[idx]}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  isRevealed && isCorrect  && styles.optionTextCorrect,
                  isRevealed && isSelected && !isCorrect && styles.optionTextWrong,
                ]}>
                  {opt}
                </Text>
                {isRevealed && isCorrect ? (
                  <Text style={{ fontSize: 16, color: c.success }}>✓</Text>
                ) : null}
                {isRevealed && isSelected && !isCorrect ? (
                  <Text style={{ fontSize: 16, color: c.error }}>✗</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Explanation */}
        {selected !== null && currentQ.explanation ? (
          <View style={styles.explanation}>
            <Text style={styles.explanationText}>💡 {currentQ.explanation}</Text>
          </View>
        ) : null}

        {/* Spacer for footer button */}
        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Footer button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.nextBtn, (selected === null || submitting) && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={selected === null || submitting}
        >
          <Text style={styles.nextBtnText}>
            {submitting ? "Submitting…" : qIndex < questions.length - 1 ? "Next Question →" : "Finish →"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1 },

    // Header
    header: {
      height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: space[4], borderBottomWidth: 1, borderBottomColor: c.ghost,
      backgroundColor: c.paper,
    },
    headerTitle: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    exitText:    { fontFamily: fonts.sans, fontSize: 14, color: c.ghost },

    // Progress
    progressWrap: { paddingHorizontal: space[4], marginTop: 12 },
    progressBg:   { height: 8, backgroundColor: c.ghost, borderRadius: radius.full, overflow: "hidden" },
    progressFill: { height: 8, backgroundColor: c.ochre, borderRadius: radius.full },
    progressRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
    progressLabel: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },
    scoreLabel:   { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink, width: 60, textAlign: "right" },

    gameBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 20 },

    // Question card
    questionCard: {
      backgroundColor: c.paper, borderRadius: radius.xl, padding: 24,
      alignItems: "center", marginBottom: 16, ...shadows.card,
    },
    questionCategory: {
      fontFamily: fonts.sansBold, fontSize: fontSize.eyebrow,
      color: c.ochre, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4,
    },
    questionRule: { width: 32, height: 1.5, backgroundColor: c.ochre, marginBottom: 20 },
    questionText: {
      fontFamily: fonts.serifBold, fontSize: 22, color: c.ink,
      lineHeight: 30, textAlign: "center",
    },

    // Options
    options: { gap: 12, marginBottom: 16 },
    option: {
      height: 52, flexDirection: "row", alignItems: "center", gap: 12,
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.ghost,
      borderRadius: 8, paddingHorizontal: space[4],
    },
    optionCorrect: { backgroundColor: "#edf7ed", borderWidth: 2, borderColor: c.success },
    optionWrong:   { backgroundColor: "#fef2f2", borderWidth: 2, borderColor: c.error },
    optionDim:     { opacity: 0.5 },

    optionLabelCircle: {
      width: 24, height: 24, borderRadius: 12,
      backgroundColor: c.paperDeep, alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: "rgba(200,191,176,0.5)",
    },
    optionLabelCorrect: { backgroundColor: c.paper, borderColor: "rgba(45,106,79,0.3)" },
    optionLabelWrong:   { backgroundColor: c.paper, borderColor: "rgba(198,40,40,0.3)" },
    optionLabelText:    { fontFamily: fonts.sansBold, fontSize: 11, color: c.ink },

    optionText:        { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.ink },
    optionTextCorrect: { fontFamily: fonts.sansBold, color: c.ink },
    optionTextWrong:   { color: c.inkSoft },

    // Explanation
    explanation: { backgroundColor: c.paperDeep, borderRadius: 8, padding: 16 },
    explanationText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.inkSoft, lineHeight: 20 },

    // Footer
    footer: {
      position: "absolute", bottom: 0, left: 0, right: 0,
      backgroundColor: c.paper, borderTopWidth: 1, borderTopColor: c.ghost,
      paddingBottom: 34, paddingTop: 16, paddingHorizontal: 20,
    },
    nextBtn: {
      height: 52, backgroundColor: c.ochre, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center",
      shadowColor: c.ochre, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    // Centred layout (error + already played)
    centred:     { flex: 1, alignItems: "center", justifyContent: "center", padding: space[8], gap: space[3] },
    centredText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center" },

    // Already played
    playedCircle: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: c.ochre, alignItems: "center", justifyContent: "center",
      marginBottom: 8,
      shadowColor: c.ochre, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 3,
    },
    playedCheck:   { fontSize: 32, color: c.paper, fontWeight: "bold" },
    playedTitle:   { fontFamily: fonts.serifBold, fontSize: 22, color: c.ink },
    playedSub:     { fontFamily: fonts.sans, fontSize: 14, color: c.mute },
    countdownWrap: { alignItems: "center", gap: 4, marginVertical: 8 },
    countdownLabel: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.mute },
    countdownValue: { fontFamily: fonts.monoBold, fontSize: 28, color: c.ink, letterSpacing: -0.5 },
    browseFeedLink: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre },
    proHintBtn: { marginBottom: 12 },
    proHintText: { fontFamily: fonts.sans, fontSize: fontSize.sm, color: c.ochre },

    // Score screen
    scoreBody: { padding: space[8], alignItems: "center", gap: space[3], paddingTop: 60 },
    scoreLarge: { fontFamily: fonts.serifBold, fontSize: 56, color: c.ink, lineHeight: 60 },
    scorePct:   { fontFamily: fonts.sans, fontSize: 16, color: c.mute },
    scoreMsg:   { fontFamily: fonts.serifBoldItalic, fontSize: 20, color: c.gold, textAlign: "center" },
    crPill: {
      backgroundColor: c.gold, borderRadius: radius.full,
      paddingHorizontal: space[4], paddingVertical: 8,
      shadowColor: c.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
    },
    crPillText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },

    scoreDivider: { width: "100%", height: 1, backgroundColor: c.ghost },
    reviewTitle:  { fontFamily: fonts.sansBold, fontSize: 14, color: c.ink },
    reviewDots:   { flexDirection: "row", flexWrap: "wrap", gap: 5, justifyContent: "center" },
    reviewDot:    { width: 12, height: 12, borderRadius: 6 },

    shareBtn: {
      width: "100%", maxWidth: 200, height: 48,
      borderWidth: 1.5, borderColor: c.ink, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center",
    },
    shareBtnText:  { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    backGamesLink: { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.ochre },
    offscreen: { position: "absolute", top: -9999, left: -9999 },

    primaryBtn:     { backgroundColor: c.ink, borderRadius: radius.xl, paddingVertical: space[3], paddingHorizontal: space[6] },
    primaryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
  });
}
