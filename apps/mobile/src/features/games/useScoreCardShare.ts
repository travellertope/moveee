import { useRef, useState } from "react";
import { View, Alert } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

export function useScoreCardShare() {
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  const share = async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const uri = await captureRef(cardRef, { format: "jpg", quality: 0.92 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/jpeg",
          dialogTitle: "Share your score",
        });
      } else {
        Alert.alert("Sharing unavailable", "Sharing isn't supported on this device.");
      }
    } catch {
      Alert.alert("Couldn't share", "Something went wrong generating your scorecard. Please try again.");
    } finally {
      setSharing(false);
    }
  };

  return { cardRef, share, sharing };
}
