import { useEffect, useState } from "react";

/**
 * Local-only draft persistence — debounced write to localStorage so the
 * user doesn't lose in-progress section values on refresh. Shared by
 * BriefForm and SiteRekiForm.
 */
export function useAutoSave(key, initial) {
  const [state, setState] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      return s ? JSON.parse(s) : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    const t = setTimeout(
      () => localStorage.setItem(key, JSON.stringify(state)),
      500,
    );
    return () => clearTimeout(t);
  }, [state, key]);

  return [state, setState];
}
