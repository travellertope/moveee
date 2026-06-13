import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useColors } from "../../hooks/useColors";
import { fonts, fontSize, space, radius, type ColorPalette } from "../../theme";

interface ProEarlyAccessGateProps {
  openDate?: string;
  onUpgrade: () => void;
  onLearnMore?: () => void;
}

function getCountdown(openDate: string): string {
  const diff = new Date(openDate).getTime() - Date.now();
  if (diff <= 0) return "";
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

function createStyles(c: ColorPalette) {
  return StyleSheet.create({
    card: {
      borderWidth: 2,
      borderColor: c.gold,
      backgroundColor: c.paperWarm,
      borderRadius: 12,
      padding: space[5],
      alignItems: "center",
    },
    star: { fontSize: 28, marginBottom: space[3] },
    title: {
      fontFamily: fonts.serifBold,
      fontSize: 20,
      color: c.ink,
      textAlign: "center",
      marginBottom: space[3],
    },
    desc: {
      fontFamily: fonts.sans,
      fontSize: fontSize.sm,
      color: c.mute,
      textAlign: "center",
      maxWidth: 280,
      lineHeight: fontSize.sm * 1.5,
      marginBottom: space[4],
    },
    countdown: {
      fontFamily: fonts.monoBold,
      fontSize: 16,
      color: c.gold,
      marginBottom: space[5],
    },
    upgradeBtn: {
      height: 52,
      borderRadius: radius["2xl"],
      backgroundColor: c.gold,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: space[8],
      marginBottom: space[3],
      alignSelf: "stretch",
    },
    upgradeBtnText: { fontFamily: fonts.sansBold, fontSize: fontSize.base, color: c.paper },
    learnMore: { fontFamily: fonts.sans, fontSize: 12, color: c.ochre },
  });
}

export default function ProEarlyAccessGate({ openDate, onUpgrade, onLearnMore }: ProEarlyAccessGateProps) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  const countdown = useMemo(() => (openDate ? getCountdown(openDate) : ""), [openDate]);

  return (
    <View style={styles.card}>
      <Text style={styles.star}>★</Text>
      <Text style={styles.title}>Early Access — Pro Members Only</Text>
      <Text style={styles.desc}>
        This product is available exclusively to Connect Pro members before it goes on general sale.
      </Text>
      {countdown ? <Text style={styles.countdown}>Opens in {countdown}</Text> : null}
      <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade} activeOpacity={0.85}>
        <Text style={styles.upgradeBtnText}>Upgrade to Connect Pro</Text>
      </TouchableOpacity>
      {onLearnMore && (
        <TouchableOpacity onPress={onLearnMore} activeOpacity={0.7}>
          <Text style={styles.learnMore}>Learn more about Connect Pro →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
