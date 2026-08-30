import React, { useEffect, useState, Component, type ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { Text, View } from "react-native";
import * as Sentry from "@sentry/react-native";
import { hydrateStorage } from "./src/store/storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import { SENTRY_DSN } from "./src/config/sentry";
import { navigationIntegration } from "./src/navigation";
import {
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
  Fraunces_700Bold_Italic,
} from "@expo-google-fonts/fraunces";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
  DMSans_400Regular_Italic,
} from "@expo-google-fonts/dm-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
  JetBrainsMono_400Regular_Italic,
} from "@expo-google-fonts/jetbrains-mono";

import Navigation from "./src/navigation";
import { useAuthStore } from "./src/auth/authStore";
import { api, MOBILE_API } from "./src/api/client";

// Sentry.init() is a no-op (SDK stays disabled, nothing is sent) when
// SENTRY_DSN is blank — see src/config/sentry.ts for how to fill it in.
// Called at module scope, before any component renders, per Sentry's own
// setup guidance, so startup crashes are captured too.
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    debug: __DEV__,
    // Every event in dev (cheap, local); a modest sample in production so
    // trace volume doesn't balloon — errors themselves are never sampled,
    // only performance/tracing spans are.
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    integrations: [navigationIntegration],
  });
}

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(e: Error) { return { error: e.message + "\n" + e.stack }; }
  componentDidCatch(error: Error) {
    Sentry.captureException(error);
  }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, padding: 24, paddingTop: 80, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: "red", marginBottom: 12 }}>Startup Error</Text>
          <Text style={{ fontSize: 12, color: "#333", fontFamily: "monospace" }}>{this.state.error}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {}

async function registerPushToken() {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing === "granted"
    ? { status: existing }
    : await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId: "943d1ee4-9194-4a36-8b6a-48ab32dfd813" })).data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  await api.post(`${MOBILE_API}/push-token`, { token }).catch(() => null);
}

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const userId = useAuthStore((s) => s.user?.id);
  const username = useAuthStore((s) => s.user?.username);
  const [storageReady, setStorageReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    Fraunces_700Bold_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMSans_400Regular_Italic,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
    JetBrainsMono_400Regular_Italic,
  });

  useEffect(() => {
    hydrateStorage().then(() => {
      setStorageReady(true);
      hydrate();
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) registerPushToken();
  }, [isAuthenticated]);

  // Tags error/crash events with who hit them, without sending PII —
  // id + username only, never email/phone/etc. Cleared on logout so a
  // shared/handed-down device doesn't misattribute the next session's
  // errors to the previous user.
  useEffect(() => {
    if (isAuthenticated && userId) {
      Sentry.setUser({ id: String(userId), username });
    } else {
      Sentry.setUser(null);
    }
  }, [isAuthenticated, userId, username]);

  // Block render until fonts and persisted storage are ready
  if (!fontsLoaded || !storageReady) return null;

  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <Navigation />
    </ErrorBoundary>
  );
}

// Sentry.wrap adds a root-level error boundary of its own (belt-and-braces
// alongside the app's ErrorBoundary above, which still owns the visible
// "Startup Error" fallback screen) plus automatic touch-event breadcrumbs
// and cold/warm start timing. A no-op wrapper when SENTRY_DSN is unset.
export default Sentry.wrap(App);
