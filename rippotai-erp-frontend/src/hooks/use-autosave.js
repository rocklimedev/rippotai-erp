import { useCallback, useEffect, useState } from "react";

/**
 * Local-only draft persistence — debounced write to localStorage so the
 * user doesn't lose in-progress section values on refresh. Shared by
 * BriefForm and SiteRekiForm.
 */
export function useAutoSave(key, initial) {
  const [snapshot, setSnapshot] = useState(() => ({
    key,
    value: readStoredDraft(key, initial),
  }));
  if (snapshot.key !== key) {
    setSnapshot({ key, value: readStoredDraft(key, initial) });
  }
  const state = snapshot.value;
  const setState = useCallback(
    (updater) =>
      setSnapshot((current) => {
        if (current.key !== key) return current;
        const value = current.value;
        const next = typeof updater === "function" ? updater(value) : updater;
        return current.key === key && next === value
          ? current
          : { key, value: next };
      }),
    [key],
  );

  useEffect(() => {
    if (snapshot.key !== key) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        /* Draft remains in memory when storage is full. */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [state, key, snapshot.key]);

  return [state, setState];
}

export function readStoredDraft(key, initial, storage = localStorage) {
  try {
    const stored = storage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  } catch {
    return initial;
  }
}
