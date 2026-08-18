import { useWindowDimensions } from "react-native";

// Matches Android's own sw600dp tablet qualifier (600dp shortest-side is the
// standard Android/Material breakpoint for "this is a tablet, not a large
// phone"). Using the shorter of width/height (not just width) keeps the
// result stable across rotation — a phone in landscape can be wider than
// 600dp without being a tablet.
const TABLET_BREAKPOINT = 600;

export function useIsTablet(): boolean {
  const { width, height } = useWindowDimensions();
  return Math.min(width, height) >= TABLET_BREAKPOINT;
}
