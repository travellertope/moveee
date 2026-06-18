import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView,
  TouchableOpacity, ActivityIndicator,
} from "react-native";
import { useNav } from "../../hooks/useNav";
import { Ionicons } from "@expo/vector-icons";
import { storage } from "../../store/storage";
import { api, MOBILE_API } from "../../api/client";
import { useAuthStore } from "../../auth/authStore";
import { recordPlayedToday } from "../../features/games/useGameStreak";
import { colors, fonts, fontSize, space, radius } from "../../theme";
import { useColors } from "../../hooks/useColors";
import type { ColorPalette } from "../../theme";
import GameScoreCard from "../../components/games/GameScoreCard";
import { useScoreCardShare } from "../../features/games/useScoreCardShare";

const PROXY      = "https://themoveee.com/api";
const KEY_DATE   = "wsi_last_played_date";
const KEY_COUNT  = "wsi_play_count";
const PRO_LIMIT  = 5;
const FREE_LIMIT = 1;

interface WsiQuestion {
  id:             string;
  quote:          string;
  source:         string;
  correct_author: string;
  options:        [string, string, string, string];
}

type Phase = "loading" | "error" | "played" | "game" | "done";

export default function WhoSaidItGameScreen() {
  const nav = useNav();
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { user } = useAuthStore();
  const isPro = user?.tier === "patron";
  const { cardRef, share: shareScoreCard, sharing } = useScoreCardShare();

  const [phase,     setPhase]     = useState<Phase>("loading");
  const [questions, setQuestions] = useState<WsiQuestion[]>([]);
  const [qIndex,    setQIndex]    = useState(0);
  const [selected,  setSelected]  = useState<string | null>(null);
  const [answers,   setAnswers]   = useState<(string | null)[]>([]);
  const [score,     setScore]     = useState(0);
  const [creditsEarned, setCreditsEarned] = useState<number | null>(null);
  const [errorMsg,  setErrorMsg]  = useState("");

  const todayStr = new Date().toISOString().slice(0, 10);

  const init = useCallback(async () => {
    setPhase("loading");
    try {
      const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
      const countKey = `${KEY_COUNT}_${todayStr}`;
      const playedToday = parseInt(storage.getString(countKey) ?? "0", 10);
      if (playedToday >= limit) {
        setPhase("played");
        return;
      }
      const slot = playedToday + 1;
      const data = await api.get<{ date: string; slot: number; questions: WsiQuestion[] }>(
        `${PROXY}/games/who-said-it/daily?slot=${slot}`
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

  const handleNext = async () => {
    if (qIndex < questions.length - 1) {
      setSelected(null);
      setQIndex((i) => i + 1);
    } else {
      const countKey = `${KEY_COUNT}_${todayStr}`;
      const prev = parseInt(storage.getString(countKey) ?? "0", 10);
      storage.set(countKey, String(prev + 1));
      recordPlayedToday();
      const final = answers.filter((a, i) => a === questions[i]?.correct_author).length;
      try {
        const result = await api.post<{ credits_earned: number }>(`${MOBILE_API}/games/complete`, {
          game_type: "who-said-it",
          score: final,
          max_score: questions.length,
        });
        setCreditsEarned(result.credits_earned);
      } catch {
        setCreditsEarned(null);
      }
      setPhase("done");
    }
  };

  const finalScore = answers.filter((a, i) => a === questions[i]?.correct_author).length;

  // ── loading ──────────────────────────────────────────────────────────────────
  if (phase === "loading") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} c={c} />
        <ActivityIndicator style={{ marginTop: 60 }} color={c.gold} size="large" />
      </SafeAreaView>
    );
  }

  // ── error ────────────────────────────────────────────────────────────────────
  if (phase === "error") {
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} c={c} />
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
    const countKey = `${KEY_COUNT}_${todayStr}`;
    const playsToday = parseInt(storage.getString(countKey) ?? "0", 10);
    const limit = isPro ? PRO_LIMIT : FREE_LIMIT;
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} c={c} />
        <View style={styles.centred}>
          <Text style={styles.doneEmoji}>✍️</Text>
          <Text style={styles.doneTitle}>
            {isPro ? `${playsToday}/${limit} plays used today` : "Already played today!"}
          </Text>
          <Text style={styles.doneSub}>New quotes drop every day.</Text>
          {!isPro && (
            <TouchableOpacity onPress={() => nav.navigate("Membership" as never)} style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: fonts.sans, fontSize: fontSize.sm, color: colors.ochre }}>Connect Pro members get 5 plays/day →</Text>
            </TouchableOpacity>
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
    const pct = Math.round((finalScore / questions.length) * 100);
    const cr  = creditsEarned ?? Math.round((finalScore / questions.length) * 30);
    const msg = pct >= 80 ? "You know your quotes! 🎉" : pct >= 50 ? "Not bad! 👍" : "Better luck tomorrow! 💪";
    return (
      <SafeAreaView style={styles.container}>
        <Header nav={nav} styles={styles} c={c} />
        <ScrollView contentContainerStyle={styles.doneBody}>
          <Text style={styles.doneEmoji}>✍️</Text>
          <Text style={styles.doneTitle}>{msg}</Text>
          <Text style={styles.doneScore}>{finalScore} / {questions.length}</Text>
          <View style={styles.crPill}>
            <Text style={styles.crPillText}>+{cr} CR earned</Text>
          </View>
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
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: space[2] }]} onPress={() => nav.goBack()}>
            <Text style={styles.primaryBtnText}>Back to Games</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.offscreen} pointerEvents="none">
          <GameScoreCard
            ref={cardRef}
            gameName="Who Said It?"
            gameEmoji="💬"
            score={finalScore}
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

  // ── in-game ───────────────────────────────────────────────────────────────────
  if (!currentQ) return null;

  return (
    <SafeAreaView style={styles.container}>
      <Header nav={nav} progress={`${qIndex + 1} / ${questions.length}`} styles={styles} c={c} />

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
                  <Ionicons name="checkmark-circle" size={18} color={c.communityText} />
                )}
                {selected === author && selected !== currentQ.correct_author && (
                  <Ionicons name="close-circle" size={18} color={c.ochre} />
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

function Header({ nav, progress, styles, c }: { nav: any; progress?: string; styles: ReturnType<typeof createStyles>; c: ColorPalette }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color={c.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Who Said It?</Text>
      {progress && <Text style={styles.headerProgress}>{progress}</Text>}
    </View>
  );
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.paperWarm },

    header: {
      flexDirection: "row", alignItems: "center",
      paddingHorizontal: space[4], paddingVertical: space[3],
      borderBottomWidth: 1, borderBottomColor: c.rule,
      backgroundColor: c.paperWarm,
    },
    backBtn:        { padding: 4, marginRight: space[2] },
    headerTitle:    { flex: 1, fontFamily: fonts.serifBold, fontSize: fontSize.lg, color: c.ink },
    headerProgress: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute },

    progressBar:  { height: 3, backgroundColor: c.rule },
    progressFill: { height: 3, backgroundColor: c.gold },

    gameBody: { padding: space[4], gap: space[4], paddingBottom: space[10] },

    quoteCard: {
      backgroundColor: c.paper, borderRadius: radius.lg,
      borderWidth: 1, borderColor: c.rule,
      padding: space[5], gap: space[2],
    },
    quoteMarks:  { fontFamily: fonts.serifBold, fontSize: 48, color: c.gold, lineHeight: 40, marginTop: -8 },
    quoteText:   { fontFamily: fonts.serif, fontSize: fontSize.lg, color: c.ink, lineHeight: 26, fontStyle: "italic" },
    quoteSource: { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute, marginTop: space[1] },

    promptText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },

    options: { gap: space[2] },
    option: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      backgroundColor: c.paper, borderWidth: 1, borderColor: c.rule,
      borderRadius: radius.lg, paddingHorizontal: space[4], paddingVertical: space[3] + 2,
    },
    optionCorrect: { backgroundColor: c.communityBg, borderColor: c.communityBorder },
    optionWrong:   { backgroundColor: "#fef2f2", borderColor: "#fca5a5" },
    optionDim:     { opacity: 0.45 },

    optionText:        { flex: 1, fontFamily: fonts.sans, fontSize: fontSize.base, color: c.inkSoft },
    optionTextCorrect: { color: c.communityText, fontFamily: fonts.sansBold },
    optionTextWrong:   { color: c.ochre },

    bottomRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    liveScoreLabel: { fontFamily: fonts.monoBold, fontSize: fontSize.eyebrow, color: c.mute, letterSpacing: 1.2 },
    liveScoreValue: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: c.ink },
    nextBtn: {
      backgroundColor: c.ink, borderRadius: radius.md,
      paddingVertical: space[3], paddingHorizontal: space[5],
    },
    nextBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    centred:     { flex: 1, alignItems: "center", justifyContent: "center", padding: space[6], gap: space[3] },
    centredText: { fontFamily: fonts.sans, fontSize: fontSize.base, color: c.mute, textAlign: "center" },

    doneBody:  { padding: space[4], gap: space[4], paddingBottom: space[10], alignItems: "center" },
    doneEmoji: { fontSize: 56 },
    doneTitle: { fontFamily: fonts.serifBold, fontSize: fontSize.xl, color: c.ink, textAlign: "center" },
    doneScore: { fontFamily: fonts.serifBold, fontSize: fontSize["3xl"], color: c.gold },
    crPill: {
      backgroundColor: c.gold, borderRadius: radius.full,
      paddingHorizontal: space[4], paddingVertical: 8,
      shadowColor: c.gold, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 2,
    },
    crPillText: { fontFamily: fonts.sansBold, fontSize: 14, color: c.paper },
    doneSub:   { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.mute, letterSpacing: 0.8, textAlign: "center" },

    reviewCard:      { backgroundColor: c.paper, borderWidth: 1, borderColor: c.rule, borderRadius: radius.lg, overflow: "hidden", width: "100%" },
    reviewTitle:     { fontFamily: fonts.serifBold, fontSize: fontSize.base, color: c.ink, padding: space[3], borderBottomWidth: 1, borderBottomColor: c.rule },
    reviewRow:       { flexDirection: "row", alignItems: "flex-start", gap: space[2], padding: space[3] },
    reviewRowBorder: { borderTopWidth: 1, borderTopColor: c.rule },
    reviewDot:        { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
    reviewDotCorrect: { backgroundColor: c.communityText },
    reviewDotWrong:   { backgroundColor: c.ochre },
    reviewQuote:      { fontFamily: fonts.serif, fontSize: fontSize.xs, color: c.mute, marginBottom: 4, fontStyle: "italic" },
    reviewA:          { fontFamily: fonts.sansBold, fontSize: fontSize.sm, color: c.communityText },
    reviewAWrong:     { color: c.ochre },
    reviewYours:      { fontFamily: fonts.mono, fontSize: fontSize.xs, color: c.ghost, marginTop: 2 },

    primaryBtn:     { backgroundColor: c.ink, borderRadius: radius.md, paddingVertical: space[3], paddingHorizontal: space[6] },
    primaryBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },

    shareBtn: {
      width: "100%", maxWidth: 200, height: 48,
      borderWidth: 1.5, borderColor: c.ink, borderRadius: radius.full,
      alignItems: "center", justifyContent: "center",
    },
    shareBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.ink },
    offscreen: { position: "absolute", top: -9999, left: -9999 },
  });
}
