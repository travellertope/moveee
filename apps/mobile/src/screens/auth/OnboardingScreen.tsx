import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNav } from "../../hooks/useNav";
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
import { colors, fonts, fontSize, space, shadows } from "../../theme";

const { width: W, height: H } = Dimensions.get("window");
const ONBOARDING_KEY = "onboarding_complete";
const SPLASH_ICON = require("../../../assets/logo.png");

// ── Textile SVG (Slide 1 top) ─────────────────────────────────────────────────
function TextileIllustration({ height }: { height: number }) {
  const blockW = W / 3;
  const blockH = height / 3;
  const palette = [
    "#C5491F", "#B38238", "#3A1A08",
    "#5C2A0E", "#C5491F", "#B38238",
    "#B38238", "#4A1A06", "#C5491F",
  ];
  const circleXs = [blockW / 2, blockW + blockW / 2, blockW * 2 + blockW / 2];

  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.5" stopColor={colors.ink} stopOpacity="0" />
          <Stop offset="1" stopColor={colors.ink} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={height} fill="#7A3010" />
      {palette.map((fill, i) => (
        <Rect
          key={i}
          x={(i % 3) * blockW}
          y={Math.floor(i / 3) * blockH}
          width={blockW}
          height={blockH}
          fill={fill}
        />
      ))}
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
      <Rect x="0" y={blockH - 4} width={W} height={8} fill="rgba(243,236,224,0.14)" />
      <Rect x="0" y={blockH * 2 - 4} width={W} height={8} fill="rgba(243,236,224,0.14)" />
      {circleXs.map((cx, i) => (
        <React.Fragment key={`cc${i}`}>
          <Circle cx={cx} cy={blockH * 0.75} r={28} fill="rgba(255,255,255,0.09)" />
          <Circle cx={cx} cy={blockH * 0.75} r={19} fill="rgba(255,255,255,0.09)" />
          <Circle cx={cx} cy={blockH * 0.75} r={11} fill="rgba(255,255,255,0.09)" />
        </React.Fragment>
      ))}
      <Rect x="0" y="0" width={W} height={height} fill="url(#vignette)" />
    </Svg>
  );
}

// ── Grid cards SVG (Slide 2 top) ──────────────────────────────────────────────
function GridIllustration({ height }: { height: number }) {
  const colW = W / 2;
  const rowH = height / 3;
  const cards = [
    { fill: "#C5491F", label: "Editorial" },
    { fill: "#4C1D95", label: "Happening" },
    { fill: "#92400E", label: "Place" },
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
        const pillW = card.label.length * 7 + 18;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={colW} height={rowH} fill={card.fill} />
            <Rect
              x={x + 10}
              y={y + rowH - 30}
              width={pillW}
              height={22}
              rx={11}
              fill="rgba(255,255,255,0.90)"
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Credits illustration (Slide 3 top) ───────────────────────────────────────
function CreditsIllustration({ height }: { height: number }) {
  const cx = W / 2;
  const cy = height / 2;
  const orbitR = 90;
  const badges = [
    { label: "+10 CR", angle: -90 },
    { label: "+30 CR", angle: 0 },
    { label: "+50 CR", angle: 90 },
    { label: "Badge", angle: 180 },
  ];
  return (
    <Svg width={W} height={height}>
      <Defs>
        <LinearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.paperWarm} stopOpacity="1" />
          <Stop offset="1" stopColor="#e8ddd0" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={height} fill="url(#bgGrad)" />
      <Circle cx={cx} cy={cy} r={130} stroke={colors.rule} strokeWidth={1} fill="none" />
      <Circle cx={cx} cy={cy} r={100} stroke={colors.rule} strokeWidth={1} fill="none" />
      <Circle
        cx={cx}
        cy={cy}
        r={70}
        stroke={colors.gold}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        fill="none"
      />
      <Circle cx={cx} cy={cy} r={34} fill={colors.ink} />
      {badges.map((b, i) => {
        const rad = (b.angle * Math.PI) / 180;
        const bx = cx + orbitR * Math.cos(rad);
        const by = cy + orbitR * Math.sin(rad);
        const pw = b.label.length * 7 + 20;
        const ph = 26;
        return (
          <React.Fragment key={i}>
            <Line
              x1={cx + 36 * Math.cos(rad)}
              y1={cy + 36 * Math.sin(rad)}
              x2={bx - (pw / 2 + 2) * Math.cos(rad)}
              y2={by - (ph / 2 + 2) * Math.sin(rad)}
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
              fill={i === 3 ? colors.ink : colors.gold}
            />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

// ── Dots ──────────────────────────────────────────────────────────────────────
function Dots({ active, total }: { active: number; total: number }) {
  return (
    <View style={dotsS.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[dotsS.dot, i === active ? dotsS.active : dotsS.inactive]}
        />
      ))}
    </View>
  );
}
const dotsS = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { borderRadius: 9999 },
  active: { width: 20, height: 6, backgroundColor: colors.ochre },
  inactive: { width: 6, height: 6, backgroundColor: colors.ghost },
});

// ── Logo ─────────────────────────────────────────────────────────────────────

// ── Splash ────────────────────────────────────────────────────────────────────
function Splash({ onDone }: { onDone: () => void }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
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
    <Pressable style={splashS.container} onPress={onDone}>
      <Image
        source={SPLASH_ICON}
        style={{ width: 56, height: 56, borderRadius: 28 }}
        resizeMode="contain"
      />
      <Animated.View style={{ marginTop: 32, transform: [{ rotate: spin }] }}>
        <Svg width={40} height={40}>
          <Circle cx={20} cy={20} r={18} stroke={colors.ghost} strokeWidth={2.5} fill="none" />
          <Path
            d="M20 2 A18 18 0 1 1 2 20"
            stroke={colors.ochre}
            strokeWidth={2.5}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={splashS.loading}>Loading</Text>
    </Pressable>
  );
}
const splashS = StyleSheet.create({
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

// ── Slide card ────────────────────────────────────────────────────────────────
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
    <View style={cardS.card}>
      <Text style={cardS.title}>{title}</Text>
      <Text style={cardS.body}>{body}</Text>
      <Dots active={activeIndex} total={total} />
      <Pressable style={cardS.primaryBtn} onPress={onPrimary}>
        {({ pressed }) => (
          <Text style={[cardS.primaryLabel, pressed && { opacity: 0.85 }]}>
            {primaryLabel}
          </Text>
        )}
      </Pressable>
      {secondaryIsGhost ? (
        <Pressable onPress={onSecondary} style={cardS.ghostBtn}>
          <Text style={cardS.ghostLabel}>{secondaryLabel}</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onSecondary} style={cardS.footerBtn}>
          <Text style={cardS.footerText}>{secondaryLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
const cardS = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: space[8],
    paddingTop: space[8],
    paddingBottom: space[6],
    gap: 12,
    ...shadows.modal,
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
  footerBtn: {
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
function Slide({
  index,
  translateX,
  topHeight,
  illustration,
  children,
}: {
  index: number;
  translateX: Animated.Value;
  topHeight: number;
  illustration: React.ReactNode;
  children: React.ReactNode;
}) {
  const x = translateX.interpolate({
    inputRange: [index - 1, index, index + 1],
    outputRange: [W, 0, -W],
  });
  return (
    <Animated.View style={[slideS.slide, { transform: [{ translateX: x }] }]}>
      <View style={{ height: topHeight, overflow: "hidden" }}>{illustration}</View>
      {children}
    </Animated.View>
  );
}
const slideS = StyleSheet.create({
  slide: {
    position: "absolute",
    top: 0,
    left: 0,
    width: W,
    height: H,
    justifyContent: "flex-end",
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const nav = useNav();
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
      easing: Easing.bezier(0.4, 0, 0.2, 1),
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
  const topH2 = H * 0.50;
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
