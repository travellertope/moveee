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

export async function openInApp(url: string): Promise<void> {
  if (!url) return;
  if (isMoveeeUrl(url)) {
    try {
      const WebBrowser = await import("expo-web-browser");
      await WebBrowser.openBrowserAsync(url, {
        toolbarColor: "#b38238",
        controlsColor: "#ffffff",
        enableBarCollapsing: true,
      });
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  } else {
    Linking.openURL(url).catch(() => {});
  }
}
