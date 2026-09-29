import { useCallback, useState } from "react";
import * as Location from "expo-location";
import { api, MOBILE_API } from "../../api/client";

// One-time GPS snapshot — no background/continuous tracking. A member taps
// "Turn on location" (from StoopProximityBanner or Settings), we ask for
// foreground permission once, grab a single fix, and POST it to the server
// (which fuzzes it to ~1km before storing — see
// Culture_Geolocation::set_location() in class-culture-geolocation.php).
// There is no auto-refresh; the member re-triggers this manually if they
// move and want proximity features to reflect it.

export interface LocationState {
  hasLocation: boolean;
  updatedAt: string | null;
}

export function useLocation() {
  const [requesting, setRequesting] = useState(false);
  const [deniedPermission, setDeniedPermission] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestAndSaveLocation = useCallback(async (): Promise<boolean> => {
    setRequesting(true);
    setError(null);
    setDeniedPermission(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setDeniedPermission(true);
        return false;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      await api.post(`${MOBILE_API}/me/location`, {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      return true;
    } catch {
      setError("Couldn't get your location. Try again.");
      return false;
    } finally {
      setRequesting(false);
    }
  }, []);

  const clearLocation = useCallback(async (): Promise<boolean> => {
    try {
      await api.delete(`${MOBILE_API}/me/location`);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchLocationState = useCallback(async (): Promise<LocationState | null> => {
    try {
      return await api.get<LocationState>(`${MOBILE_API}/me/location`);
    } catch {
      return null;
    }
  }, []);

  return { requesting, deniedPermission, error, requestAndSaveLocation, clearLocation, fetchLocationState };
}
