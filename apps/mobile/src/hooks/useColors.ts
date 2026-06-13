import { useColorScheme } from "react-native";
import { lightColors, darkColors, type ColorPalette } from "../theme";
import { useThemeStore } from "../store/themeStore";

export function useColors(): ColorPalette {
  const { mode } = useThemeStore();
  const systemScheme = useColorScheme();
  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");
  return isDark ? darkColors : lightColors;
}
