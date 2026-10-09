import { useCallback, useEffect, useState } from "react";
import { defaultNotificationPreferences } from "../lib/notifications";

export function useNotificationPreferences(userId) {
  const key = `bc.notification-preferences.${userId || "signed-out"}`;
  const read = useCallback(() => {
    try {
      return {
        ...defaultNotificationPreferences,
        ...JSON.parse(localStorage.getItem(key) || "{}"),
      };
    } catch {
      return { ...defaultNotificationPreferences };
    }
  }, [key]);
  const [preferences, setPreferences] = useState(read);
  useEffect(() => {
    const refresh = () => setPreferences(read());
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("notification-preferences", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("notification-preferences", refresh);
    };
  }, [read]);
  const update = (group, enabled) => {
    const next = { ...read(), [group]: enabled };
    localStorage.setItem(key, JSON.stringify(next));
    setPreferences(next);
    window.dispatchEvent(new Event("notification-preferences"));
  };
  return [preferences, update];
}
