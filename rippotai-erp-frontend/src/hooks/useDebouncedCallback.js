import { useEffect, useRef } from "react";

/**
 * Fire `fn(latest args)` after `delay` ms of inactivity.
 * Returns a stable function reference.
 */
export function useDebouncedCallback(fn, delay = 800) {
  const timer = useRef(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return (...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), delay);
  };
}
