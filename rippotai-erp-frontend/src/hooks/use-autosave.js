import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createDraftStorage } from "../lib/draft-storage";

/**
 * Local-only draft persistence — debounced write to localStorage so the
 * user doesn't lose in-progress section values on refresh. Shared by
 * BriefForm and SiteRekiForm.
 */
export function useAutoSave(draftKey, initial) {
  const { user } = useAuth();
  const storage = useMemo(() => createDraftStorage(user?.id), [user?.id]);
  const key = `${user?.id ?? "signed-out"}:${draftKey}`;
  const [snapshot, setSnapshot] = useState(() => ({
    key,
    value: readStoredDraft(draftKey, initial, storage),
  }));
  if (snapshot.key !== key) {
    setSnapshot({ key, value: readStoredDraft(draftKey, initial, storage) });
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
        storage.setItem(draftKey, JSON.stringify(state));
      } catch {
        /* Draft remains in memory when storage is full. */
      }
    }, 500);
    return () => clearTimeout(t);
  }, [state, key, snapshot.key, storage, draftKey]);

  return [state, setState, storage];
}

export function readStoredDraft(key, initial, storage = localStorage) {
  try {
    const stored = storage.getItem(key);
    return stored ? JSON.parse(stored) : initial;
  } catch {
    return initial;
  }
}
