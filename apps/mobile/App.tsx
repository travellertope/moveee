import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { hydrateStorage } from "./src/store/storage";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { useFonts } from "expo-font";
import {
  Fraunces_400Regular,
  Fraunces_700Bold,
  Fraunces_400Regular_Italic,
} from "@expo-google-fonts/fraunces";
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from "@expo-google-fonts/dm-sans";
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";

import Navigation from "./src/navigation";
import { useAuthStore } from "./src/auth/authStore";
import { api, CULTURE_API } from "./src/api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerPushToken() {
  if (!Device.isDevice) return;
  const { status: existing } = await Notifications.getPermissionsAsync();
  const { status } = existing === "granted"
    ? { status: existing }
    : await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  await api.post(`${CULTURE_API}/user/push-token`, { token }).catch(() => null);
}

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [storageReady, setStorageReady] = useState(false);

  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_700Bold,
    Fraunces_400Regular_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_700Bold,
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

  // Block render until fonts and persisted storage are ready
  if (!fontsLoaded || !storageReady) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Navigation />
    </>
  );
}
