import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
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

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (isAuthenticated) registerPushToken();
  }, [isAuthenticated]);

  return (
    <>
      <StatusBar style="dark" />
      <Navigation />
    </>
  );
}
