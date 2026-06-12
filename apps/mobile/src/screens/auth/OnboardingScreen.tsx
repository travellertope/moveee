import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Svg, {
  Rect,
  Circle,
  Line,
  Defs,
  LinearGradient,
  Stop,
  Path,
} from "react-native-svg";
import { storage } from "../../store/storage";
import { colors, fonts, fontSize, space, radius, shadows } from "../../theme";

const { width: W, height: H } = Dimensions.get("window");

const ONBOARDING_KEY = "onboarding_complete";

// ── Textile SVG for Slide 1 ───────────────────────────────────────────────────
function TextileIllustration({ height }: { height: number }) {
  const cols = [0, W / 3, (W * 2) / 3];
  const rows = [0, height / 3, (height * 2) / 3];
  const blockW = W / 3;
  const blockH = height / 3;
  const palette = [
    "#C5491F", "#B38238", "#3A1A08",
    "#5C2A0E", "#C5491F", "#B38238",
    "#B38238", "#4A1A06", "#C5491F",
  ];
  const circleXs = [65, W / 2, W - 65];

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.5" stopColor={colors.ink} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.ink} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      {/* Base */}
      <Rect x="0" y="0" width={W} height={height} fill="#7A3010" />
      {/* Color blocks */}
      {palette.map((fill, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        return (
          <Rect
            key={i}
            x={cols[col]}
            y={rows[row]}
            width={blockW}
            height={blockH}
            fill={fill}
          />
        );
      })}
      {/* Diagonal line overlays */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Line
          key={`d${i}`}
          x1={i * (W / 10) - height}
          y1={0}
          x2={i * (W / 10)}
          y2={height}
          stroke="rgba(255,255,255,0.055)"
          strokeWidth={1}
        />
      ))}
      {/* Horizontal separators */}
      <Rect x="0" y={blockH - 4} width={W} height={8} fill="rgba(243,236,224,0.14)" />
      <Rect x="0" y={blockH * 2 - 4} width={W} height={8} fill="rgba(243,236,224,0.14)" />
      {/* Concentric circles */}
      {circleXs.map((cx, i) => (
        <React.Fragment key={`c${i}`}>
          <Circle cx={cx} cy={blockH * 0.7} r={28} fill="rgba(255,255,255,0.09)" />
          <Circle cx={cx} cy={blockH * 0.7} r={19} fill="rgba(255,255,255,0.09)" />
          <Circle cx={cx} cy={blockH * 0.7} r={11} fill="rgba(255,255,255,0.09)" />
        </React.Fragment>
      ))}
      {/* Bottom vignette */}
      <Rect x="0" y="0" width={W} height={height} fill="url(#vignette)" />
    </Svg>
  );
}

// ── Grid cards SVG for Slide 2 ────────────────────────────────────────────────
function GridIllustration({ height }: { height: number }) {
  const colW = W / 2;
  const rowH = height / 3;
  const cards = [
    { fill: "#C5491F", label: "Editorial" },
    { fill: "#4C1D95", label: "Happening" },
    { fill: "#92400E", label: "Hidden Gem" },
    { fill: "#14110D", label: "Pulse" },
    { fill: "#065F46", label: "Quote" },
    { fill: "#1E3A5F", label: "Poll" },
  ];

  return (
    <Svg width={W} height={height}>
      {cards.map((card, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col * colW;
        const y = row * rowH;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={colW} height={rowH} fill={card.fill} />
            {/* Label pill */}
            <Rect
              x={x + 10}
              y={y + rowH - 30}
              width={card.label.length * 7 + 16}
              height={22}
              rx={11}
              fill="rgba(255,255,255,0.92)"
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Credits illustration for Slide 3 ─────────────────────────────────────────
function CreditsIllustration({ height }: { height: number }) {
  const cx = W / 2;
  const cy = height / 2;
  const badges = [
    { label: "+10 CR", angle: -90 },
    { label: "+30 CR", angle: 0 },
    { label: "+50 CR", angle: 90 },
    { label: "🏆 Badge", angle: 180 },
  ];
  const orbitR = 90;

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.paperWarm} stopOpacity="1" />
          <Stop offset="1" stopColor="#e8ddd0" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={height} fill="url(#bgGrad)" />
      {/* Concentric circles */}
      <Circle cx={cx} cy={cy} r={130} stroke={colors.rule} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={100} stroke={colors.rule} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={70} stroke={colors.gold} strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
      {/* Center circle */}
      <Circle cx={cx} cy={cy} r={34} fill={colors.ink} />
      {/* "C" in center */}
      {/* Badge pills */}
      {badges.map((b, i) => {
        const rad = (b.angle * Math.PI) / 180;
        const bx = cx + orbitR * Math.cos(rad);
        const by = cy + orbitR * Math.sin(rad);
        const pw = b.label.length * 7 + 20;
        const ph = 26;
        return (
          <React.Fragment key={i}>
            {/* Dashed line from center */}
            <Line
              x1={cx + 34 * Math.cos(rad)}
              y1={cy + 34 * Math.sin(rad)}
              x2={bx - (pw / 2) * Math.cos(rad)}
              y2={by - (ph / 2) * Math.sin(rad)}
              stroke={colors.ochre}
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <Rect
              x={bx - pw / 2}
              y={by - ph / 2}
              width={pw}
              height={ph}
              rx={ph / 2}
              fill={colors.gold}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Dots indicator ────────────────────────────────────────────────────────────
function Dots({ active, total }: { active: number; total: number }) {
  return (
    <View style={dotsStyles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            dotsStyles.dot,
            i === active ? dotsStyles.dotActive : dotsStyles.dotInactive,
          ]}
        />
      ))}
    </View>
  );
}

const dotsStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { borderRadius: 9999 },
  dotActive: { width: 20, height: 6, backgroundColor: colors.ochre },
  dotInactive: { width: 6, height: 6, backgroundColor: colors.ghost },
});

// ── Wordmark ──────────────────────────────────────────────────────────────────
function Wordmark({ size = 22 }: { size?: number }) {
  return (
    <View style={wordmarkStyles.wrap}>
      <Text style={[wordmarkStyles.moveee, { fontSize: size }]}>moveee</Text>
      <Text style={wordmarkStyles.connect}>connect</Text>
      <View style={wordmarkStyles.line} />
    </View>
  );
}

const wordmarkStyles = StyleSheet.create({
  wrap: { alignItems: "center" },
  moveee: {
    fontFamily: fonts.serifBold,
    color: colors.ink,
    letterSpacing: -1,
  },
  connect: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.eyebrow,
    color: colors.gold,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: 4,
  },
  line: {
    width: 40,
    height: 2,
    backgroundColor: colors.ochre,
    marginTop: 16,
  },
});

// ── Splash ────────────────────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    ).start();
    const timer = setTimeout(onDone, 2200);
    return () => clearTimeout(timer);
  }, []);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Pressable style={splashStyles.container} onPress={onDone}>
      <Wordmark size={36} />
      <Animated.View style={{ marginTop: 32, transform: [{ rotate: spin }] }}>
        <Svg width={40} height={40}>
          <Circle cx={20} cy={20} r={18} stroke={colors.ghost} strokeWidth={2} fill="none" />
          <Path
            d="M20 2 A18 18 0 1 1 2 20"
            stroke={colors.ochre}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={splashStyles.loading}>Loading</Text>
    </Pressable>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paperWarm,
    alignItems: "center",
    justifyContent: "center",
  },
  loading: {
    fontFamily: fonts.mono,
    fontSize: fontSize.tiny,
    color: colors.mute,
    marginTop: 10,
    letterSpacing: 1,
  },
});

// ── Bottom card ───────────────────────────────────────────────────────────────
type SlideCardProps = {
  title: string;
  body: string;
  activeIndex: number;
  total: number;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  secondaryIsGhost?: boolean;
};

function SlideCard({
  title,
  body,
  activeIndex,
  total,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  secondaryIsGhost = false,
}: SlideCardProps) {
  return (
    <View style={cardStyles.card}>
      <Text style={cardStyles.title}>{title}</Text>
      <Text style={cardStyles.body}>{body}</Text>
      <Dots active={activeIndex} total={total} />
      <Pressable style={cardStyles.primaryBtn} onPress={onPrimary}>
        {({ pressed }) => (
          <Text style={[cardStyles.primaryLabel, pressed && { opacity: 0.8 }]}>
            {primaryLabel}
          </Text>
        )}
      </Pressable>
      {secondaryIsGhost ? (
        <Pressable onPress={onSecondary} style={cardStyles.ghostBtn}>
          <Text style={cardStyles.ghostLabel}>{secondaryLabel}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onSecondary} style={cardStyles.footerLink}>
          <Text style={cardStyles.footerText}>{secondaryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: space[8],
    paddingTop: space[8],
    paddingBottom: space[6],
    ...shadows.modal,
    gap: 12,
  },
  title: {
    fontFamily: fonts.serifBold,
    fontSize: 30,
    color: colors.ink,
    lineHeight: 36,
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: fontSize.base,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: colors.ochre,
    borderRadius: 9999,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryLabel: {
    fontFamily: fonts.sansBold,
    fontSize: fontSize.base,
    color: colors.paper,
  },
  ghostBtn: {
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  ghostLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: fontSize.base,
    color: colors.ochre,
  },
  footerLink: {
    alignItems: "center",
    paddingVertical: 8,
  },
  footerText: {
    fontFamily: fonts.sans,
    fontSize: fontSize.sm,
    color: colors.mute,
    textAlign: "center",
  },
});

// ── Slide wrapper ─────────────────────────────────────────────────────────────
type SlideProps = {
  index: number;
  translateX: Animated.Value;
  topHeight: number;
  children: React.ReactNode;
  illustration: React.ReactNode;
};

function Slide({ index, translateX, topHeight, children, illustration }: SlideProps) {
  const x = translateX.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [W, 0, -W],
  });

  return (
    <Animated.View
      style={[slideStyles.slide, { transform: [{ translateX: x }] }]}
    >
      <View style={{ height: topHeight, overflow: "hidden" }}>{illustration}</View>
      {children}
    </Animated.View>
  );
}

const slideStyles = StyleSheet.create({
  slide: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: H,
    justifyContent: "flex-end",
  },
});

// ── Main OnboardingScreen ─────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const nav = useNavigation<any>();
  const [phase, setPhase] = useState<"splash" | "slides">("splash");
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const seen = storage.getString(ONBOARDING_KEY);
    if (seen === "1") {
      nav.replace("Login");
    }
  }, []);

  function goToSlide(index: number) {
    Animated.timing(slideAnim, {
      toValue: index,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }

  function finishOnboarding() {
    storage.set(ONBOARDING_KEY, "1");
    nav.replace("Register");
  }

  function goToLogin() {
    storage.set(ONBOARDING_KEY, "1");
    nav.replace("Login");
  }

  if (phase === "splash") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paperWarm }}>
        <Splash onDone={() => setPhase("slides")} />
      </SafeAreaView>
    );
  }

  const topH1 = H * 0.56;
  const topH2 = H * 0.5;
  const topH3 = H * 0.46;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={{ flex: 1 }}>
        <Slide
          index={0}
          translateX={slideAnim}
          topHeight={topH1}
          illustration={<TextileIllustration height={topH1} />}
        >
          <SlideCard
            title="Your cultural home."
            body="Discover, connect and create with people who share your cultural vision."
            activeIndex={0}
            total={3}
            primaryLabel="Get started"
            onPrimary={() => goToSlide(1)}
            secondaryLabel="Already a member? Sign in"
            onSecondary={goToLogin}
          />
        </Slide>

        <Slide
          index={1}
          translateX={slideAnim}
          topHeight={topH2}
          illustration={<GridIllustration height={topH2} />}
        >
          <SlideCard
            title="Built for your world."
            body="Magazine stories, community posts, events, games — all in one place."
            activeIndex={1}
            total={3}
            primaryLabel="Continue"
            onPrimary={() => goToSlide(2)}
            secondaryLabel="Skip"
            onSecondary={finishOnboarding}
            secondaryIsGhost
          />
        </Slide>

        <Slide
          index={2}
          translateX={slideAnim}
          topHeight={topH3}
          illustration={<CreditsIllustration height={topH3} />}
        >
          <SlideCard
            title="Earn as you create."
            body="Post, engage, and earn Culture Points™ redeemable for real-world perks and cash."
            activeIndex={2}
            total={3}
            primaryLabel="Create my account"
            onPrimary={finishOnboarding}
            secondaryLabel="Sign in instead"
            onSecondary={goToLogin}
            secondaryIsGhost
          />
        </Slide>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paperWarm,
    overflow: "hidden",
  },
});
