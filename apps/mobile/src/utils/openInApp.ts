import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

const MOVEEE_DOMAINS = [
  "themoveee.com",
  "connect.themoveee.com",
  "cms.themoveee.com",
  "media.themoveee.com",
];

function isMoveeeUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return MOVEEE_DOMAINS.some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * Opens a URL. Moveee domains open in an in-app browser (Safari View Controller /
 * Chrome Custom Tab) so users never leave the app. All other domains open in the
 * system browser via Linking.
 */
export async function openInApp(url: string): Promise<void> {
  if (!url) return;
  if (isMoveeeUrl(url)) {
    await WebBrowser.openBrowserAsync(url, {
      // Brand the in-app browser with Moveee gold
      toolbarColor: "#b38238",
      controlsColor: "#ffffff",
      enableBarCollapsing: true,
    }).catch(() => {
      // Fallback to system browser if WebBrowser fails
      Linking.openURL(url).catch(() => {});
    });
  } else {
    Linking.openURL(url).catch(() => {});
  }
}
