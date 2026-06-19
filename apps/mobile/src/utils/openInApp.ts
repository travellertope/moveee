import { Linking } from "react-native";

// Every http(s) link in the app opens in the branded in-app webview rather
// than handing off to the system browser — standard practice for social apps.
// Non-http(s) schemes (mailto:, tel:, etc.) aren't webview-able and always
// fall through to the OS handler.
function isWebUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export async function openInApp(url: string): Promise<void> {
  if (!url) return;
  if (isWebUrl(url)) {
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
